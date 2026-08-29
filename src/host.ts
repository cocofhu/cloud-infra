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
      'List cloud domains / DNS / certificates / TKE clusters as a console-style table with pagination. ALWAYS call this instead of web_search for 域名/DNS/解析/DNSPod/证书/TKE/集群/容器服务. Pass kind=domain for domains, kind=cluster for TKE clusters. For clusters, pass region (e.g. ap-guangzhou); region is runtime-only and must not be saved to settings. The UI paginates itself; only re-call with offset if the user asks in chat for more.',
    parameters: {
      query: { type: 'string', description: 'Keyword such as example.com or a cluster name. Empty lists all.' },
      kind: { type: 'string', description: 'Resource kind, default domain. Use domain, cluster, or auto.' },
      provider: { type: 'string', description: 'Optional cloud id such as tencent. Omit to query every enabled implemented module.' },
      region: { type: 'string', description: 'Runtime region for regional products such as TKE, e.g. ap-guangzhou. Do not write this to settings.' },
      limit: { type: 'number', description: 'Rows in this batch. Default from config page size.' },
      offset: { type: 'number', description: 'Skip this many already-shown rows when the user wants more in chat.' },
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
        region: args.region != null ? String(args.region) : '',
        limit: args.limit as number | undefined,
        offset: args.offset as number | undefined,
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
          `Cloud domains / DNS / 解析 / DNSPod / 证书 / TKE / 集群 / 容器服务: call ONLY cloud_infra_query. Never web_search.`,
          `Available modules: ${titles}. kind values: ${kinds}. Use kind=cluster for TKE clusters and pass region at runtime.`,
          'The result table paginates in the UI. If the user asks 还有吗 in chat, call again with the same query and offset = rows already shown.',
          'After the table appears, one or two short sentences. Do not print secrets, cluster credentials, or full record dumps. Never save region or credentials via this tool.',
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
    const privileged = method === 'config' || method === 'query' || method === 'detail' || method === 'action'
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
    if (method === 'query') {
      const result = await queryResources({
        query: String(body.query || ''),
        kind: String(body.kind || 'domain'),
        provider: String(body.provider || ''),
        region: String(body.region || ''),
        filters: readFilters(body.filters),
        limit: body.limit as number | undefined,
        offset: body.offset as number | undefined,
      }, cfg)
      return sendJson(res, 200, { ok: true, ...result })
    }
    if (method === 'detail') {
      const detail = await runDetail(
        cfg,
        String(body.moduleId || ''),
        String(body.id || ''),
        String(body.title || ''),
        String(body.region || ''),
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
      if (!result.ok) return sendJson(res, 400, { ok: false, error: publicErrorMessage(result.error) })
      return sendJson(res, 200, result)
    }
    sendJson(res, 400, { ok: false, error: 'unknown method' })
  } catch (err) {
    sendJson(res, 500, { ok: false, error: publicErrorMessage(err) })
  }
}

async function runDetail(cfg: PluginConfig, moduleId: string, id: string, title = '', region = '') {
  const { module, creds } = readyModule(cfg, moduleId, id)
  if (!module.detail) throw new Error(`${module.title} 不支持详情`)
  return module.detail({
    creds,
    query: '',
    offset: 0,
    limit: cfg.maxResults,
    timeoutMs: cfg.timeoutMs,
    id,
    title: title || undefined,
    region: region || undefined,
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
    query: '',
    offset: 0,
    limit: cfg.maxResults,
    timeoutMs: cfg.timeoutMs,
    id,
    region: region || (typeof payload.region === 'string' ? payload.region : undefined),
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

function resolveModuleId(moduleId: string, id: string): string {
  if (moduleId) return moduleId
  const first = String(id || '').split(':')[0] || ''
  if (first.includes('.')) return first
  return id.includes(':') ? id.slice(0, id.lastIndexOf(':')) : ''
}

function readyModule(cfg: PluginConfig, moduleId: string, id: string) {
  const resolvedId = resolveModuleId(moduleId, id)
  const module = registry.getModule(resolvedId)
  if (!module) throw new Error('未知模块')
  const provider = registry.getProvider(module.provider)
  if (!provider) throw new Error('未知云厂商')
  const missing = missingCredentialKeys(provider, cfg.providers[module.provider])
  if (missing.length) throw new Error(`${provider.title} 未配置 ${missing.join('、')}。${SETTINGS_HINT}`)
  return { module, creds: credentialMap(provider, cfg.providers[module.provider]) }
}
