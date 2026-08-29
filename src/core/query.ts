import {
  credentialMap,
  implementedModules,
  isModuleEnabled,
  isProviderEnabled,
  missingCredentialKeys,
  SETTINGS_HINT,
  type Registry,
  registry,
} from './registry.js'
import { publicErrorMessage } from './safe-error.js'
import type { ModuleError, PluginConfig, QueryResult, ResourceCard, ResourceModule } from './types.js'

export interface QueryInput {
  kind?: string
  provider?: string
  query?: string
  offset?: number
  limit?: number
  region?: string
  filters?: Record<string, string>
}

export async function queryResources(
  input: QueryInput,
  config: PluginConfig,
  signal?: AbortSignal,
  source: Registry = registry,
): Promise<QueryResult> {
  const kind = String(input.kind || 'domain').trim() || 'domain'
  const provider = String(input.provider || '').trim()
  const query = String(input.query || '').trim()
  const region = String(input.region || '').trim()
  const filters = sanitizeFilters(input.filters)
  const offset = Math.max(0, Math.floor(Number(input.offset) || 0))
  const explicit = Number(input.limit)
  const limit = Number.isFinite(explicit) && explicit > 0
    ? clamp(explicit, 1, 80)
    : clamp(config.maxResults, 1, 80)

  const candidates = selectModules(kind, provider, config, source)
  if (!candidates.length) {
    const available = implementedModules(config, source).map((module) => `${module.title} (${module.kind})`)
    return {
      query,
      kind,
      items: [],
      errors: [{
        moduleId: 'core',
        message: available.length
          ? `没有可查询的模块。已支持：${available.join('、')}`
          : '没有已启用且已实现的云资源模块。',
      }],
      total: 0,
      offset,
      hasMore: false,
      region: region || undefined,
    }
  }

  const lists: ResourceCard[][] = []
  const errors: ModuleError[] = []
  let total = 0
  let hasMore = false

  await Promise.allSettled(candidates.map(async (module) => {
    const providerDef = source.getProvider(module.provider)
    if (!providerDef) {
      errors.push({ moduleId: module.id, message: `未注册的云厂商：${module.provider}` })
      return
    }
    if (!module.implemented) {
      errors.push({ moduleId: module.id, message: `${module.title} 尚未实现` })
      return
    }
    const missing = missingCredentialKeys(providerDef, config.providers[module.provider])
    if (missing.length) {
      errors.push({ moduleId: module.id, message: `${providerDef.title} 未配置 ${missing.join('、')}。${SETTINGS_HINT}` })
      return
    }
    try {
      const result = await module.list({
        creds: credentialMap(providerDef, config.providers[module.provider]),
        query,
        offset,
        limit,
        timeoutMs: config.timeoutMs,
        signal,
        region: region || undefined,
        filters,
      })
      lists.push(result.items || [])
      if (result.total != null) total += result.total
      else total += result.items?.length || 0
      if (result.hasMore) hasMore = true
    } catch (err) {
      errors.push({ moduleId: module.id, message: publicErrorMessage(err) })
    }
  }))

  const items = lists.flat()
  if (!total) total = items.length
  return { query, kind, items, errors, total, offset, hasMore, region: region || undefined }
}

function selectModules(kind: string, provider: string, config: PluginConfig, source: Registry): ResourceModule[] {
  const wantedKind = kind === 'auto' || !kind ? '' : kind
  return source.listModules().filter((module) => {
    if (wantedKind && module.kind !== wantedKind) return false
    if (provider && module.provider !== provider) return false
    if (!isProviderEnabled(module.provider, config, source.getProvider(module.provider))) return false
    if (config.modules[module.id] === false) return false
    if (!provider && !module.implemented) return false
    if (!provider && !isModuleEnabled(module, config)) return false
    return true
  })
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export function renderQuery(result: QueryResult): string {
  if (!result.items.length) {
    const err = result.errors.map((item) => item.message).join('；')
    return err || '没有找到相关资源。'
  }
  const lines = result.items.map((item, index) => {
    const status = item.status ? ` ${item.status}` : ''
    const badges = item.badges?.length ? ` · ${item.badges.join(' / ')}` : ''
    return `${index + 1}. ${item.title}${status}${badges}\n   id: ${item.id}`
  })
  const start = result.offset || 0
  const shown = start + result.items.length
  const more = result.hasMore
    ? `这是第 ${start + 1}–${shown} 条。列表可翻页；用户若在对话里问还有吗，立刻再调用 cloud_infra_query，query 仍为「${result.query || ''}」，kind=${result.kind}${result.region ? `，region=${result.region}` : ''}，offset=${shown}。`
    : `一共 ${result.total ?? result.items.length} 条，已经全部列出。`
  const err = result.errors.length ? `\n部分模块失败：${result.errors.map((item) => item.moduleId).join(', ')}` : ''
  const hint = result.kind === 'cluster'
    ? '用一两句话概括即可，请用户在列表中选择地域并点击集群 ID 进入配置。不要打印密钥或集群凭证，不要套用域名解析页。'
    : '用一两句话概括即可，请用户点击「解析」或域名进行配置。不要打印密钥。'
  return `找到 ${result.total ?? result.items.length} 条，已显示为可翻页列表。${more} ${hint}\n\n${lines.join('\n')}${err}`
}

function sanitizeFilters(raw: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    const name = String(key || '').trim()
    const text = String(value ?? '').trim()
    if (!name || !text) continue
    out[name] = text
  }
  return Object.keys(out).length ? out : undefined
}
