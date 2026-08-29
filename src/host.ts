import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import Schema from '@deepseek-ai/schemastery'
import { assignConfig, publicConfig, readOverlay, sanitizePatch, withDefaults, writeOverlay } from './core/config-store.js'
import { queryResources, renderQuery } from './core/query.js'
import { credentialMap, implementedModules, missingCredentialKeys, publicMeta, registry, SETTINGS_HINT, supportedKinds } from './core/registry.js'
import { publicErrorMessage } from './core/safe-error.js'
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

export function apply(ctx: Context, config: Config): void {
  const cfg = withDefaults(config)
  assignConfig(cfg, readOverlay())

  ctx.tools.register(defineTool({
    name: 'cloud_infra_query',
    description:
      'List or search cloud resources and show the result as a conversation tool card (same place as the domain table). ALWAYS call this instead of web_search for 域名/DNS/解析/DNSPod/证书/CLS/日志主题/检索分析/检索日志. kind=domain (default) for domains; kind=cls for CLS log topics or log search. Results appear in the chat card, not a separate console. Do not write settings.',
    parameters: {
      query: { type: 'string', description: 'Keyword. For domains: example.com. For CLS: topic name / topic ID / logset. Empty lists all.' },
      kind: { type: 'string', description: 'Resource kind. Default domain. Use domain, cls, or auto. Never treat CLS as domain.' },
      provider: { type: 'string', description: 'Optional cloud id such as tencent. Omit to query every enabled implemented module.' },
      limit: { type: 'number', description: 'Rows in this batch. Default from config page size.' },
      offset: { type: 'number', description: 'Skip this many already-shown rows when the user wants more in chat.' },
      region: { type: 'string', description: 'CLS region id for this call only (e.g. ap-beijing). Default ap-guangzhou. Do not save to settings.' },
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
      presentationMeta: (_args, value) => ({ kind: 'cloud-infra-query', ...(value as object) }),
    },
    presentCall: (args) => ({
      card: 'generic',
      title: `云资源 · ${String(args.query || args.kind || '域名')}`,
      kind: 'search',
      content: [],
    }),
    presentResult: (_args, { isError, meta }) => ({
      card: 'generic',
      title: isError ? '云资源查询失败' : `云资源 · ${(meta as QueryResult | undefined)?.items?.length ?? 0} 条`,
      content: [],
    }),
    timeoutMs: cfg.timeoutMs + 5000,
    async execute(args, exec) {
      return cloneJson(await queryResources({
        query: args.query != null ? String(args.query) : '',
        kind: args.kind != null ? String(args.kind) : 'domain',
        provider: args.provider != null ? String(args.provider) : '',
        limit: args.limit as number | undefined,
        offset: args.offset as number | undefined,
        region: args.region != null ? String(args.region) : '',
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
        const kinds = supportedKinds().join(', ') || 'domain'
        return [
          `Cloud domains / DNS / 解析 / DNSPod / 证书 / CLS / 日志主题 / 检索分析 / 检索日志: call ONLY cloud_infra_query. Never web_search.`,
          `Results appear in the conversation tool card (same as the domain list), not a separate console page.`,
          `Available modules: ${titles}. kind values: ${kinds}. Default kind is domain.`,
          'kind=domain for 域名/解析. kind=cls for CLS 日志主题列表 or 检索分析/原始日志. Do not present CLS as a domain card.',
          'Listing CLS topics: kind=cls, optional query (topic name/ID/logset), optional region (default ap-guangzhou). Do not pass range/queryString.',
          'Searching logs: kind=cls, set topicId or a unique topic name in query, queryString (CQL; empty = all), range (15m/1h/4h/1d/today/yesterday, default 1h) or from/to ms. After the card appears, one or two short sentences.',
          'The result table paginates in the UI. If the user asks 还有吗 in chat, call again with the same query and offset = rows already shown (pass region for CLS).',
          'Region is per-call / per-card only. Never write settings or ask to change the 设置 page because of a CLS region switch.',
          'Do not print secrets or full log dumps.',
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
        limit: body.limit as number | undefined,
        offset: body.offset as number | undefined,
        region: String(body.region || ''),
        topicId: String(body.topicId || body.id || ''),
        queryString: body.queryString != null ? String(body.queryString) : (method === 'search' ? '' : undefined),
        range: String(body.range || ''),
        from: body.from as number | undefined,
        to: body.to as number | undefined,
        context: String(body.context || ''),
        view: method === 'search' ? 'search' : String(body.view || ''),
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
          region: String(body.region || ''),
          queryString: body.queryString != null ? String(body.queryString) : '',
          range: String(body.range || '1h'),
          from: body.from as number | undefined,
          to: body.to as number | undefined,
          context: String(body.context || ''),
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
      )
      if (!result.ok) return sendJson(res, 400, { ok: false, error: publicErrorMessage(result.error) })
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
  extra: { region?: string; queryString?: string; range?: string; from?: number; to?: number; context?: string } = {},
) {
  const { module, creds } = readyModule(cfg, moduleId, id)
  if (!module.detail) throw new Error(`${module.title} 不支持详情`)
  return module.detail({
    creds,
    query: title,
    offset: 0,
    limit: cfg.maxResults,
    timeoutMs: cfg.timeoutMs,
    id,
    title: title || undefined,
    region: extra.region,
    topicId: id,
    queryString: extra.queryString,
    range: extra.range,
    from: extra.from,
    to: extra.to,
    context: extra.context,
    view: 'search',
  })
}

async function runAction(
  cfg: PluginConfig,
  moduleId: string,
  actionId: string,
  id: string,
  payload: Record<string, unknown>,
) {
  const { module, creds } = readyModule(cfg, moduleId, id)
  if (!module.execute) return { ok: false, error: `${module.title} 不支持写操作` }
  return module.execute(actionId, payload, {
    creds,
    query: '',
    offset: 0,
    limit: cfg.maxResults,
    timeoutMs: cfg.timeoutMs,
    id,
  })
}

function readyModule(cfg: PluginConfig, moduleId: string, id: string) {
  const resolvedId = moduleId || (id.includes(':') ? id.slice(0, id.lastIndexOf(':')) : '')
  const module = registry.getModule(resolvedId)
  if (!module) throw new Error('未知模块')
  const provider = registry.getProvider(module.provider)
  if (!provider) throw new Error('未知云厂商')
  const missing = missingCredentialKeys(provider, cfg.providers[module.provider])
  if (missing.length) throw new Error(`${provider.title} 未配置 ${missing.join('、')}。${SETTINGS_HINT}`)
  return { module, creds: credentialMap(provider, cfg.providers[module.provider]) }
}
