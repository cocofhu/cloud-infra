import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import Schema from '@deepseek-ai/schemastery'
import { assignConfig, publicConfig, readOverlay, sanitizePatch, withDefaults, writeOverlay } from './core/config-store.js'
import { queryResources, renderQuery } from './core/query.js'
import { credentialHint, credentialMap, implementedModules, missingCredentialKeys, publicMeta, registry, resolveModuleId, supportedKinds } from './core/registry.js'
import { actionErrorMessage, publicErrorMessage } from './core/safe-error.js'
import { isPost, trustedUiRequest } from './core/trusted-request.js'
import type { PluginConfig, QueryResult } from './core/types.js'
import './providers/index.js'

export const name = 'cloud-infra'
export const inject = ['tools']

export type Config = Partial<PluginConfig>

export const Config: Schema<Config> = Schema.object({
  timeoutMs: Schema.number().default(20000).description('上游请求超时（毫秒）'),
  maxResults: Schema.number().default(12).description('每页条数'),
  skipConfirm: Schema.boolean().default(false).description('写操作免确认（删除除外）'),
}) as unknown as Schema<Config>

export { resolveModuleId }

export function apply(ctx: Context, config: Config): void {
  const cfg = withDefaults(config)
  assignConfig(cfg, readOverlay())

  ctx.tools.register(defineTool({
    name: 'cloud_infra_query',
    description:
      'List or search cloud resources and show the result as a conversation tool card (same place as the domain table). ALWAYS call this instead of web_search for 域名/DNS/解析/DNSPod/证书/SSL/我的证书/COS/对象存储/存储桶/注册/可注册/能不能注册/买域名/我的域名/TKE/集群/容器服务/CDB/云数据库/MySQL/云服务器/轻量/CVM/实例/CLS/日志主题/检索分析/检索日志/镜像/TCR/容器镜像/镜像仓库. kind=domain (default) for domains; kind=cls for CLS log topics or log search. Pass kind=domain for DNS 解析 (default). Pass kind=cert for 腾讯云 SSL 证书. 查证书必须传 kind=cert. 未传 kind 仍默认 domain. Pass kind=cos for COS. For COS: if the user did not already name an official region id, still call kind=cos and OMIT region so the console card can default #ci-cos-region to 广州 (ap-guangzhou) and stay selectable. Never use Ask question to pick a COS region. Never guess, invent, or pass Chinese names / free text as region. Only pass region when it is an official id such as ap-guangzhou. Pass kind=registrar to check if a name can be registered; kind=my-domain for purchased domains. Pass kind=cluster for TKE clusters. Pass kind=cdb for cloud MySQL, kind=cvm for 云服务器, kind=lighthouse for 轻量应用服务器, kind=image for TCR images. kind=auto to query every enabled module. After the card appears, the user searches and 立即加购 inside the card — do not send them to settings or a standalone page. For 「查一下我的服务器」use kind=cvm, kind=lighthouse or kind=auto — never kind=domain. For clusters, pass region if the user names one; if omitted, default to ap-guangzhou and do not ask which region. Results appear in the chat card, not a separate console. Region is runtime-only and must not be saved to settings. Do not write settings. The UI paginates itself; only re-call with offset if the user asks in chat for more.',
    parameters: {
      query: { type: 'string', description: 'Keyword such as example.com, certificate id, a bucket name, instance name, cluster name, ins-/lhins-/cdb- ID, IP, or CLS topic name / topic ID / logset. Empty lists all purchased domains, or waits for in-card search on registrar.' },
      kind: { type: 'string', description: 'Resource kind, default domain. Use domain, cert, cos, registrar, my-domain, cluster, cdb, lighthouse, cvm, cls, image, or auto. kind=domain (default). kind=cls for CLS. 查证书必须传 kind=cert。 Never treat CLS as domain.' },
      provider: { type: 'string', description: 'Optional cloud id such as tencent. Omit to query every enabled implemented module.' },
      region: { type: 'string', description: 'Optional. For kind=cos, pass only an official COS region id such as ap-guangzhou after the user named one. Omit region when none is named so the UI defaults #ci-cos-region to 广州 (ap-guangzhou) and stays selectable. Never pass Chinese names or free text. Runtime region for regional products such as TKE, CVM, CDB or CLS, e.g. ap-guangzhou / ap-beijing. CLS default ap-guangzhou. Empty or all queries every region for CVM/CDB. Do not write this to settings.' },
      limit: { type: 'number', description: 'Rows in this batch. Default from config page size.' },
      offset: { type: 'number', description: 'Skip this many already-shown rows when the user wants more in chat.' },
      topicId: { type: 'string', description: 'CLS topic id when searching logs. Required for 检索分析 unless query uniquely names the topic.' },
      queryString: { type: 'string', description: 'CLS CQL statement. Empty means all logs in the time window. Omit when listing topics.' },
      range: { type: 'string', description: 'CLS time window: 15m / 1h / 4h / 1d / today / yesterday. Default 1h when searching. Omit when listing topics.' },
      from: { type: 'number', description: 'Optional CLS window start, unix milliseconds.' },
      to: { type: 'number', description: 'Optional CLS window end, unix milliseconds.' },
      context: { type: 'string', description: 'CLS SearchLog context to continue the current page without duplicating rows.' },
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => [{ type: 'text', text: renderQuery(value as unknown as QueryResult) }],
      presentationMeta: (_args, value) => ({
        ...value,
        kind: 'cloud-infra-query',
        resourceKind: typeof value.kind === 'string' ? value.kind : 'domain',
      }),
    },
    presentCall: (args) => ({
      card: 'generic',
      title: `云资源 · ${String(args.kind === 'image' ? '容器镜像' : (args.query || args.kind || '域名'))}`,
      kind: 'search',
      content: [],
    }),
    presentResult: (_args, { isError, meta }) => {
      const result = meta as QueryResult | undefined
      return {
        card: 'generic',
        title: isError
          ? '云资源查询失败'
          : result?.needsRegion
            ? '对象存储'
            : result?.kind === 'cos' && result?.errors?.length && !result?.items?.length
              ? '对象存储 · 请先配置凭证'
              : `云资源 · ${result?.items?.length ?? 0} 条`,
        content: [],
      }
    },
    timeoutMs: cfg.timeoutMs + 5000,
    async execute(args, exec) {
      return cloneJson(await queryResources({
        query: args.query != null ? String(args.query) : '',
        kind: args.kind != null ? String(args.kind) : 'domain',
        provider: args.provider != null ? String(args.provider) : '',
        region: args.region != null ? String(args.region) : '',
        limit: args.limit as number | undefined,
        offset: args.offset as number | undefined,
        topicId: args.topicId != null ? String(args.topicId) : '',
        queryString: args.queryString != null ? String(args.queryString) : undefined,
        range: args.range != null ? String(args.range) : '',
        from: args.from as number | undefined,
        to: args.to as number | undefined,
        context: args.context != null ? String(args.context) : '',
      }, cfg, exec.signal))
    },
  }))

  ctx.inject(['systemPrompt'], (c) => {
    const prompt = (c as unknown as {
      systemPrompt: {
        section: (section: { name: string; order: number; text: string | (() => string) }) => void
      }
    }).systemPrompt
    prompt.section({
      name: 'tool:cloud-infra',
      order: 120,
      text: () => {
        const modules = implementedModules(cfg)
        const titles = modules.map((module) => module.title).join('、') || '（尚未启用任何模块）'
        const kinds = [...new Set([...supportedKinds(), 'auto'])].join(', ') || 'domain, auto'
        return [
          `Cloud domains / DNS / 解析 / DNSPod / 证书 / SSL / 我的证书 / COS / 对象存储 / 存储桶 / 注册 / 可注册 / 我的域名 / TKE / 集群 / 容器服务 / CDB / 云数据库 / MySQL / 云服务器 / 轻量 / CVM / 实例 / CLS / 日志主题 / 检索分析 / 检索日志 / 镜像 / TCR / 容器镜像 / 镜像仓库: call ONLY cloud_infra_query. Never web_search.`,
          `Results appear in the conversation tool card (same as the domain list), not a separate console page.`,
          `查证书 / SSL / 我的证书: pass kind=cert. 未传 kind 仍默认 domain.`,
          `Available modules: ${titles}. kind values: ${kinds}. Default kind is domain. Use kind=cluster for TKE clusters. Use kind=cdb for 云数据库 MySQL. Use kind=cls for CLS.`,
          'kind=domain for 域名/解析. kind=cls for CLS 日志主题列表 or 检索分析/原始日志. Do not present CLS as a domain card.',
          'Listing CLS topics: kind=cls, optional query (topic name/ID/logset), optional region (default ap-guangzhou). Do not pass range/queryString.',
          'Searching logs: kind=cls, set topicId or a unique topic name in query, queryString (CQL; empty = all), range (15m/1h/4h/1d/today/yesterday, default 1h) or from/to ms. After the card appears, one or two short sentences.',
          'When the user says 查 COS / 对象存储 / 存储桶 without naming a region: still call kind=cos and omit region. CosConsoleView defaults #ci-cos-region to 广州 (ap-guangzhou), lists that region\'s buckets, and stays selectable. Never use Ask question to pick a COS region. Never invent region ids or pass Chinese names / free text. Only pass region= an official id (e.g. ap-guangzhou) if the user already named one.',
          'kind=registrar for 注册/能不能注册; kind=my-domain for 我的域名; kind=domain for DNS 解析; kind=cert for SSL 证书. For 镜像/TCR/容器镜像/镜像仓库 pass kind=image.',
          'When the user names a specific resource (bucket name, certificate ID, instance ID such as ins-/lhins-/cdb-, cluster name/ID, or registry/repo name), pass that name verbatim as query to cloud_infra_query — the card auto-opens the exact match (direct hit) or falls back to the region list with a notice. Do not list everything first and ask the user to pick.',
          'The result is a chat tool card. Users search and 立即加购 inside the card. Do not send them to settings or a standalone page.',
          'For 服务器/实例/CVM/轻量, use kind=cvm, kind=lighthouse, or kind=auto. Do not query domains when the user asks for 服务器.',
          'For TKE/集群, use kind=cluster. Default region ap-guangzhou when unspecified; do not ask which region.',
          'The result table paginates in the UI. If the user asks 还有吗 in chat, call again with the same query and offset = rows already shown (keep region for COS or CLS).',
          'Region is per-call / per-card only. Never write settings or ask to change the 设置 page because of a CLS region switch. Do not write settings.',
          'After the table appears, one or two short sentences. Click 证书 ID for full detail. CDB list uses 登录 and 管理. Do not print secrets, PEM, cluster credentials, full record dumps, signed COS URLs, or full log dumps. Never save region or credentials via this tool.',
        ].join(' ')
      },
    })
  })

  ctx.inject(['webServer'], (c) => {
    const server = (c as unknown as { webServer: { register: (route: { kind: string; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }) => void } }).webServer
    server.register({ kind: 'exact', path: '/cloud-infra', handler: (req, res) => handleApi(req, res, cfg) })
  })

  ctx.inject(['settings'], (c) => {
    const settings = (c as unknown as {
      settings: { register: (ns: string, schema: typeof Config, options?: { base?: Config }) => void }
    }).settings
    settings.register('cloud-infra', Config, { base: config })
  })
}

function cloneJson(value: unknown) {
  return JSON.parse(JSON.stringify(value))
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

function sendJson(res: ServerResponse, code: number, body: unknown): void {
  res.statusCode = code
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export async function handleApi(req: IncomingMessage, res: ServerResponse, cfg: PluginConfig): Promise<void> {
  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const body = req.method === 'POST' ? await readBody(req) : {}
    const method = String(body.method || url.searchParams.get('method') || 'meta')
    const privileged = method === 'config' || method === 'query' || method === 'detail' || method === 'action' || method === 'search'
    if (privileged && !trustedUiRequest(req)) {
      return sendJson(res, 403, { ok: false, error: '请求来源不受信任' })
    }
    if ((method === 'action' || (method === 'config' && body.save)) && !isPost(req)) {
      return sendJson(res, 405, { ok: false, error: '写操作仅允许 POST' })
    }
    if (method === 'meta') {
      return sendJson(res, 200, { ok: true, ...publicMeta(cfg), skipConfirm: cfg.skipConfirm })
    }
    if (method === 'config') {
      if (body.save) {
        assignConfig(cfg, sanitizePatch(body))
        writeOverlay(cfg)
      }
      const pub = publicConfig(cfg)
      const meta = publicMeta(cfg)
      const providers = meta.providers.map((provider) => {
        const publicItem = pub.providers.find((item) => item.id === provider.id)
        return {
          ...provider,
          enabled: publicItem?.enabled ?? provider.enabledByDefault !== false,
          configured: publicItem?.configured ?? false,
          values: publicItem?.values || {},
        }
      })
      return sendJson(res, 200, {
        ok: true,
        timeoutMs: pub.timeoutMs,
        maxResults: pub.maxResults,
        skipConfirm: pub.skipConfirm,
        providers,
        modules: meta.modules,
      })
    }
    if (method === 'query' || method === 'search') {
      const result = await queryResources({
        query: String(body.query || ''),
        kind: String(body.kind || (method === 'search' ? 'cls' : 'domain')),
        provider: String(body.provider || ''),
        region: body.region != null ? String(body.region) : '',
        filters: readFilters(body.filters),
        limit: body.limit as number | undefined,
        offset: body.offset as number | undefined,
        group: body.group != null ? String(body.group) : '',
        topicId: String(body.topicId || body.id || ''),
        queryString: body.queryString != null ? String(body.queryString) : (method === 'search' ? '' : undefined),
        range: String(body.range || ''),
        from: body.from as number | undefined,
        to: body.to as number | undefined,
        context: String(body.context || ''),
        view: method === 'search' ? 'search' : String(body.view || ''),
        title: String(body.title || ''),
        instanceId: body.instanceId != null ? String(body.instanceId) : undefined,
        clientLocalFilter: body.clientLocalFilter != null ? Boolean(body.clientLocalFilter) : undefined,
      }, cfg)
      return sendJson(res, 200, { ok: true, ...result })
    }
    if (method === 'detail') {
      const detail = await runDetail(
        cfg,
        String(body.moduleId || ''),
        String(body.id || ''),
        String(body.title || ''),
        {
          region: body.region != null ? String(body.region) : '',
          prefix: String(body.prefix || ''),
          marker: String(body.marker || ''),
          bucket: String(body.bucket || ''),
          tab: body.tab != null ? String(body.tab) : '',
          queryString: body.queryString != null ? String(body.queryString) : '',
          range: String(body.range || '1h'),
          from: body.from as number | undefined,
          to: body.to as number | undefined,
          context: String(body.context || ''),
          query: body.query != null ? String(body.query) : '',
          instanceId: body.instanceId != null ? String(body.instanceId) : '',
          view: body.view != null ? String(body.view) : '',
          namespace: body.namespace != null ? String(body.namespace) : '',
          repository: body.repository != null ? String(body.repository) : '',
          offset: body.offset as number | undefined,
        },
      )
      return sendJson(res, 200, { ok: true, ...detail })
    }
    if (method === 'action') {
      const result = await runAction(
        cfg,
        String(body.moduleId || ''),
        String(body.action || ''),
        String(body.id || ''),
        (body.payload && typeof body.payload === 'object' && !Array.isArray(body.payload))
          ? body.payload as Record<string, unknown>
          : {},
        String(body.region || ''),
      )
      if (!result.ok) return sendJson(res, 400, { ok: false, error: actionErrorMessage(result.error) })
      return sendJson(res, 200, result)
    }
    sendJson(res, 400, { ok: false, error: 'unknown method' })
  } catch (err) {
    sendJson(res, 500, { ok: false, error: publicErrorMessage(err) })
  }
}

async function runDetail(
  cfg: PluginConfig,
  moduleId: string,
  id: string,
  title = '',
  extra: {
    region?: string
    prefix?: string
    marker?: string
    bucket?: string
    tab?: string
    queryString?: string
    range?: string
    from?: number
    to?: number
    context?: string
    query?: string
    instanceId?: string
    view?: string
    namespace?: string
    repository?: string
    offset?: number
  } = {},
) {
  const { module, creds } = readyModule(cfg, moduleId, id)
  if (!module.detail) throw new Error(`${module.title} 不支持详情`)
  return module.detail({
    creds,
    query: extra.query || title,
    offset: Math.max(0, Math.floor(Number(extra.offset) || 0)),
    limit: cfg.maxResults,
    timeoutMs: cfg.timeoutMs,
    id,
    title: title || undefined,
    region: extra.region || undefined,
    prefix: extra.prefix || undefined,
    marker: extra.marker || undefined,
    bucket: extra.bucket || undefined,
    tab: extra.tab || undefined,
    topicId: id,
    queryString: extra.queryString,
    range: extra.range,
    from: extra.from,
    to: extra.to,
    context: extra.context,
    view: extra.view || 'search',
    instanceId: extra.instanceId || id,
    namespace: extra.namespace || undefined,
    repository: extra.repository || undefined,
  })
}

async function runAction(
  cfg: PluginConfig,
  moduleId: string,
  actionId: string,
  id: string,
  payload: Record<string, unknown>,
  region = '',
) {
  const { module, creds } = readyModule(cfg, moduleId, id)
  if (!module.execute) return { ok: false, error: `${module.title} 不支持写操作` }
  return module.execute(actionId, payload, {
    creds,
    query: String(payload.query || ''),
    offset: 0,
    limit: cfg.maxResults,
    timeoutMs: cfg.timeoutMs,
    id,
    region: region || (typeof payload.region === 'string' ? payload.region : undefined),
    prefix: typeof payload.prefix === 'string' ? payload.prefix : undefined,
    bucket: typeof payload.bucket === 'string' ? payload.bucket : undefined,
    tab: typeof payload.tab === 'string' ? payload.tab : undefined,
    instanceId: typeof payload.instanceId === 'string' ? payload.instanceId : id,
    namespace: typeof payload.namespace === 'string' ? payload.namespace : undefined,
    repository: typeof payload.repository === 'string' ? payload.repository : undefined,
  })
}

function readFilters(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const name = String(key || '').trim()
    const text = String(value ?? '').trim()
    if (!name || !text) continue
    out[name] = text
  }
  return Object.keys(out).length ? out : undefined
}

function readyModule(cfg: PluginConfig, moduleId: string, id: string) {
  const resolvedId = resolveModuleId(moduleId, id)
  const module = registry.getModule(resolvedId)
  if (!module) throw new Error('未知模块')
  const provider = registry.getProvider(module.provider)
  if (!provider) throw new Error('未知云厂商')
  const missing = missingCredentialKeys(provider, cfg.providers[module.provider])
  if (missing.length) throw new Error(`${provider.title} 未配置 ${missing.join('、')}。${credentialHint(module.kind)}`)
  return { module, creds: credentialMap(provider, cfg.providers[module.provider]) }
}
