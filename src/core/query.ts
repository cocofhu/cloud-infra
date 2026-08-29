import {
  credentialMap,
  implementedModules,
  isModuleEnabled,
  isProviderEnabled,
  missingCredentialKeys,
  credentialHint,
  type Registry,
  registry,
} from './registry.js'
import { publicErrorMessage } from './safe-error.js'
import type { ClsRegionOption, ModuleError, PluginConfig, QueryResult, RegionOption, ResourceCard, ResourceModule } from './types.js'

export interface QueryInput {
  kind?: string
  provider?: string
  query?: string
  offset?: number
  limit?: number
  group?: string
  region?: string
  filters?: Record<string, string>
  topicId?: string
  queryString?: string
  from?: number
  to?: number
  range?: string
  context?: string
  view?: string
  title?: string
  instanceId?: string
  /** 见 ModuleContext.clientLocalFilter；host 工具调用缺省按服务端过滤（false），客户端卡片传 true。 */
  clientLocalFilter?: boolean
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

/** 参与「带资源名直达/未命中回落」的模块 kind（其余 kind 的 query 过滤行为保持不变）。 */
const DIRECT_HIT_KINDS = new Set(['cos', 'cert', 'cdb', 'cluster', 'cvm', 'lighthouse', 'image'])

/**
 * 直达判定：用户带具体资源名时，query 与某条卡片的 title 或 id 最后一段
 * （如 cos 的 bucket、cert 的证书 ID、cdb/cvm 的实例 ID、tke 的集群 ID、
 * image 的 RegistryId）完全相等（不区分大小写）即视为直达命中。
 * 空 query 返回 {}；非空但无精确命中返回 { notFoundQuery }。
 */
export function detectDirectHit(
  items: ResourceCard[],
  query: string,
): { directItemId?: string; notFoundQuery?: string } {
  const needle = String(query || '').trim().toLowerCase()
  if (!needle) return {}
  for (const item of items || []) {
    if (!item) continue
    if (String(item.title || '').trim().toLowerCase() === needle) return { directItemId: item.id }
    const tail = String(item.id || '').split(':').pop()?.trim().toLowerCase()
    if (tail && tail === needle) return { directItemId: item.id }
  }
  return { notFoundQuery: String(query || '').trim() }
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
  const group = String(input.group || '').trim()
  const region = String(input.region || '').trim() || (kind === 'cluster' ? 'ap-guangzhou' : '')
  const filters = sanitizeFilters(input.filters)
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
      region: region || undefined,
    }
  }

  const lists: ResourceCard[][] = []
  const errors: ModuleError[] = []
  const extras: Partial<QueryResult> = {}
  const regions: string[] = []
  let total = 0
  let hasMore = false
  let needsRegion = false

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
      errors.push({ moduleId: module.id, message: `${providerDef.title} 未配置 ${missing.join('、')}。${credentialHint(module.kind)}` })
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
        group: group || undefined,
        region: input.region || region || undefined,
        filters,
        topicId: input.topicId,
        queryString: input.queryString,
        from: input.from,
        to: input.to,
        range: input.range,
        context: input.context,
        view: input.view,
        id: input.topicId,
        title: input.title,
        instanceId: input.instanceId,
        clientLocalFilter: input.clientLocalFilter,
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
      // 未命中回落：带了资源名且模块按 query 过滤后为空时，以空 query 重拉一次当前地域全量列表
      // （需求 f2/r3 默认方案：卡片展示「该地域全部 X」+ 提示，而不是空表格）。
      if (!search && DIRECT_HIT_KINDS.has(module.kind) && query && !(result.items || []).length) {
        const refetch = await module.list({ ...ctx, query: '', offset: 0 }).catch(() => null)
        if (refetch && (refetch.items || []).length) {
          lists.push(refetch.items || [])
          total += refetch.total != null ? refetch.total : (refetch.items?.length || 0)
          if (refetch.hasMore) hasMore = true
          extras.view = refetch.view || extras.view || 'list'
          if (refetch.region) extras.region = refetch.region
          if (refetch.instanceId && !extras.instanceId) extras.instanceId = refetch.instanceId
          collectRegions(refetch.regions, extras, regions)
          if (refetch.needsRegion) needsRegion = true
          for (const message of refetch.warnings || []) {
            errors.push({ moduleId: module.id, message })
          }
          for (const item of refetch.errors || []) {
            errors.push({
              moduleId: item.moduleId || module.id,
              message: item.message,
            })
          }
          return
        }
      }
      lists.push(result.items || [])
      if (result.total != null) total += result.total
      else total += result.items?.length || 0
      if (result.hasMore) hasMore = true
      extras.view = result.view || extras.view || 'list'
      if (result.region) extras.region = result.region
      if (result.instanceId && !extras.instanceId) extras.instanceId = result.instanceId
      collectRegions(result.regions, extras, regions)
      if (result.needsRegion) needsRegion = true
      for (const message of result.warnings || []) {
        errors.push({ moduleId: module.id, message })
      }
      for (const item of result.errors || []) {
        errors.push({
          moduleId: item.moduleId || module.id,
          message: item.message,
        })
      }
    } catch (err) {
      errors.push({ moduleId: module.id, message: publicErrorMessage(err) })
    }
  }))

  const items = lists.flat()
  if (!total) total = extras.logs?.length || items.length
  const direct = !search ? detectDirectHit(items, query) : {}
  return {
    query,
    kind,
    items,
    errors,
    total,
    offset,
    hasMore,
    ...extras,
    region: extras.region || region || undefined,
    regions: extras.regions || (regions.length ? regions : undefined),
    ...(needsRegion ? { needsRegion: true } : {}),
    ...(direct.directItemId ? { directItemId: direct.directItemId } : {}),
    ...(direct.notFoundQuery ? { notFoundQuery: direct.notFoundQuery } : {}),
  }
}

function collectRegions(
  incoming: Array<string | ClsRegionOption | RegionOption> | undefined,
  extras: Partial<QueryResult>,
  regions: string[],
): void {
  if (!incoming?.length) return
  if (typeof incoming[0] === 'object') {
    extras.regions = incoming.filter((item): item is ClsRegionOption | RegionOption => typeof item !== 'string')
    return
  }
  for (const name of incoming) {
    if (typeof name === 'string' && name && !regions.includes(name)) regions.push(name)
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
  const directHit = result.directItemId
    ? result.items.find((item) => item.id === result.directItemId) || null
    : null
  if (!result.items.length) {
    if (result.kind === 'cos' && result.needsRegion) {
      return '对话卡默认选中广州（ap-guangzhou，#ci-cos-region 可输入补全并改选其它官方地域）并自动列出该地域存储桶。不要用 Ask question 代替选地域，不要编造 region id，也不要把中文名或自由文本当作 region。'
    }
    const err = result.errors.map((item) => item.message).join('；')
    if (err) return err
    if (result.notFoundQuery) {
      return `没有找到与您输入的「${result.notFoundQuery}」完全匹配的资源（可能是名称打错、资源不存在或不在当前地域）。对话卡片里已给出提示；请用户确认名称或换个关键字重试。不要打印密钥。`
    }
    if (result.kind === 'registrar') {
      return result.query
        ? `没有匹配「${result.query}」的可注册结果。请用户在对话卡片顶部搜索框改关键字再查。不要引导去设置页。不要打印密钥。`
        : '请用户在对话卡片顶部搜索框输入域名后查询。不要引导去设置页。不要打印密钥。'
    }
    if (result.kind === 'my-domain') {
      return result.query
        ? `没有匹配「${result.query}」的已购域名。请用户在对话卡片顶部搜索框清空即可恢复全部。不要引导去设置页。不要打印密钥。`
        : '没有已购域名。请用户在对话卡片顶部搜索框筛选。不要引导去设置页。不要打印密钥。'
    }
    return '没有找到相关资源。'
  }
  const lines = result.items.map((item, index) => {
    const status = item.status ? ` ${item.status}` : ''
    const badges = item.badges?.length ? ` · ${item.badges.join(' / ')}` : ''
    return `${index + 1}. ${item.title}${status}${badges}\n   id: ${item.id}`
  })
  const start = result.offset || 0
  const shown = start + result.items.length
  const more = result.hasMore
    ? `这是第 ${start + 1}–${shown} 条。列表可翻页；用户若在对话里问还有吗，立刻再调用 cloud_infra_query，query 仍为「${result.query || ''}」，kind=${result.kind}${result.region ? `，region=${result.region}` : result.kind === 'cos' && result.items[0] ? `，region 保持已选地域` : ''}，offset=${shown}。`
    : `一共 ${result.total ?? result.items.length} 条，已经全部列出。`
  const err = result.errors.length ? `\n部分模块失败：${result.errors.map((item) => item.moduleId).join(', ')}` : ''
  if (result.kind === 'registrar') {
    return `可注册查询已显示为对话卡片。请用户在卡片顶部搜索框改关键字再查；可买的点「立即加购」，再走购物车、提交订单、核对信息、账户余额支付。不要引导去设置页或独立页。不要打印密钥。\n\n${lines.join('\n')}${err}`
  }
  if (result.kind === 'my-domain') {
    return `我的域名已显示为对话卡片。请用户在卡片顶部搜索框筛选，点「管理」查看基本信息与域名安全。不要引导去设置页或独立页。不要打印密钥。\n\n${lines.join('\n')}${err}`
  }
  const cluster = result.kind === 'cluster' || result.items.some((item) => item.kind === 'cluster')
  const cdb = result.kind === 'cdb' || result.items.some((item) => item.kind === 'cdb')
  const instance = result.kind === 'cvm' || result.kind === 'lighthouse'
    || result.items.some((item) => item.kind === 'cvm' || item.kind === 'lighthouse')
  const hint = result.kind === 'cos'
    ? '用一两句话概括即可，请用户点击存储桶名称进入文件列表。不要打印密钥或签名 URL。'
    : result.kind === 'cert'
      ? '用一两句话概括即可，请用户点击证书 ID 或绑定域名查看完整详情。不要打印密钥或证书正文。'
      : cluster
        ? '用一两句话概括即可，列表默认广州，用户可在顶栏切换地域并点击集群 ID 进入配置。不要询问地域、不要打印密钥或集群凭证，不要套用域名解析页。'
        : cdb
          ? '用一两句话概括即可，请用户点击「登录」进入 DMC，或点击「管理」打开实例管理页。不要打印密钥。'
          : instance
            ? '用一两句话概括即可，请用户在列表中查看或点击实例 ID 看详情。不要打印密钥。'
            : result.kind === 'image'
              ? '请用户在卡片中先选择地域，再点实例卡片查看仓库与版本。不要打印密钥。'
              : '用一两句话概括即可，请用户点击「解析」或域名进行配置。不要打印密钥。'
  const directNote = directHit
    ? `其中「${directHit.title}」与用户输入完全匹配，对话卡片将自动定位到「${directHit.title}」并直接打开它的详情面板，不要再说让用户自己点进去。`
    : ''
  const missNote = result.notFoundQuery
    ? `注意：未找到与您输入的「${result.notFoundQuery}」完全匹配的资源（可能是名称打错、资源不存在或不在当前地域）；对话卡片已在列表上方给出提示并展示当前地域的全量列表，请用户从列表中选择或换个关键字重试。`
    : ''
  return `找到 ${result.total ?? result.items.length} 条，已显示为可翻页列表。${more} ${hint}${directNote ? ` ${directNote}` : ''}${missNote ? ` ${missNote}` : ''}\n\n${lines.join('\n')}${err}`
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
