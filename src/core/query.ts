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
  topicId?: string
  queryString?: string
  from?: number
  to?: number
  range?: string
  context?: string
  view?: string
}

export function wantsSearch(input: QueryInput): boolean {
  if (String(input.view || '') === 'list') return false
  if (String(input.view || '') === 'search') return true
  if (String(input.topicId || '').trim()) return true
  if (String(input.context || '').trim()) return true
  if (input.queryString != null && String(input.queryString).trim() !== '') return true
  const from = Number(input.from)
  const to = Number(input.to)
  const hasWindow = Number.isFinite(from) && from > 0 && Number.isFinite(to) && to > from
  const range = String(input.range || '').trim()
  const hasTopicHint = String(input.query || '').trim() !== '' || String(input.topicId || '').trim() !== ''
  if ((hasWindow || range) && hasTopicHint) return true
  return false
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
  const offset = Math.max(0, Math.floor(Number(input.offset) || 0))
  const explicit = Number(input.limit)
  const limit = Number.isFinite(explicit) && explicit > 0
    ? clamp(explicit, 1, 80)
    : clamp(config.maxResults, 1, 80)
  const search = wantsSearch(input)

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
      view: search ? 'search' : 'list',
    }
  }

  const lists: ResourceCard[][] = []
  const errors: ModuleError[] = []
  const extras: Partial<QueryResult> = {}
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
      const ctx = {
        creds: credentialMap(providerDef, config.providers[module.provider]),
        query,
        offset,
        limit,
        timeoutMs: config.timeoutMs,
        signal,
        region: input.region,
        topicId: input.topicId,
        queryString: input.queryString,
        from: input.from,
        to: input.to,
        range: input.range,
        context: input.context,
        view: input.view,
        id: input.topicId,
      }
      if (search && module.search) {
        const result = await module.search(ctx)
        lists.push(result.items || (result.card ? [result.card] : []))
        if (result.total != null) total += result.total
        else total += result.logs?.length || result.items?.length || 0
        if (result.hasMore) hasMore = true
        extras.view = result.error && result.items?.length ? 'list' : 'search'
        extras.region = result.region
        extras.regions = result.regions
        extras.topicId = result.topicId
        extras.topicName = result.topicName
        extras.queryString = result.queryString
        extras.range = result.range
        extras.from = result.from
        extras.to = result.to
        extras.logs = result.logs
        extras.context = result.context
        extras.fields = result.fields
        if (result.error) errors.push({ moduleId: module.id, message: result.error })
        return
      }
      const result = await module.list(ctx)
      lists.push(result.items || [])
      if (result.total != null) total += result.total
      else total += result.items?.length || 0
      if (result.hasMore) hasMore = true
      extras.view = result.view || 'list'
      if (result.region) extras.region = result.region
      if (result.regions) extras.regions = result.regions
    } catch (err) {
      errors.push({ moduleId: module.id, message: publicErrorMessage(err) })
    }
  }))

  const items = lists.flat()
  if (!total) total = extras.logs?.length || items.length
  return {
    query,
    kind,
    items,
    errors,
    total,
    offset,
    hasMore,
    ...extras,
  }
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
  if (result.kind === 'cls') return renderClsQuery(result)
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
    ? `这是第 ${start + 1}–${shown} 条。列表可翻页；用户若在对话里问还有吗，立刻再调用 cloud_infra_query，query 仍为「${result.query || ''}」，kind=${result.kind}，offset=${shown}。`
    : `一共 ${result.total ?? result.items.length} 条，已经全部列出。`
  const err = result.errors.length ? `\n部分模块失败：${result.errors.map((item) => item.moduleId).join(', ')}` : ''
  return `找到 ${result.total ?? result.items.length} 条，已显示为可翻页列表。${more} 用一两句话概括即可，请用户点击「解析」或域名进行配置。不要打印密钥。\n\n${lines.join('\n')}${err}`
}

function renderClsQuery(result: QueryResult): string {
  const err = result.errors.map((item) => item.message).join('；')
  const region = result.region ? `当前地域 ${result.region}。` : ''
  if (result.view === 'search') {
    const n = result.logs?.length ?? 0
    const topic = result.topicName || result.topicId || result.items[0]?.title || ''
    const more = result.hasMore ? '还可在卡片内继续拉取。' : ''
    const head = n
      ? `已在对话卡片中展示「检索分析」原始日志（${topic}，${n} 条）。${more}`
      : (err || '该时间窗没有匹配日志。结果出现在对话卡片里。')
    return `${region}${head} 用一两句话概括即可。不要打印密钥或完整日志正文。`
  }
  if (!result.items.length) {
    return err || `${region}当前地域没有匹配的日志主题。结果出现在对话卡片里。`
  }
  const lines = result.items.map((item, index) => {
    const topicId = item.columns?.find((col) => col.label === '主题ID')?.value || item.id
    return `${index + 1}. ${item.title}\n   id: ${topicId}`
  })
  const start = result.offset || 0
  const shown = start + result.items.length
  const more = result.hasMore
    ? `这是第 ${start + 1}–${shown} 条。用户若在对话里问还有吗，立刻再调用 cloud_infra_query，kind=cls，query 仍为「${result.query || ''}」，region=${result.region || ''}，offset=${shown}。`
    : `一共 ${result.total ?? result.items.length} 个日志主题。`
  return `${region}找到 ${result.total ?? result.items.length} 个日志主题，已显示为对话卡片。点卡片内「检索分析」或再说检索语句。${more} 用一两句话概括即可。不要打印密钥。\n\n${lines.join('\n')}${err ? `\n${err}` : ''}`
}
