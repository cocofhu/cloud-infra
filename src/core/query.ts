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
import type { ModuleError, PluginConfig, QueryResult, ResourceCard, ResourceModule } from './types.js'

export interface QueryInput {
  kind?: string
  provider?: string
  query?: string
  offset?: number
  limit?: number
  group?: string
  region?: string
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
  const region = String(input.region || '').trim()
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
    }
  }

  const lists: ResourceCard[][] = []
  const errors: ModuleError[] = []
  const regions: string[] = []
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
      errors.push({ moduleId: module.id, message: `${providerDef.title} 未配置 ${missing.join('、')}。${credentialHint(module.kind)}` })
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
        group: group || undefined,
        region: region || undefined,
      })
      lists.push(result.items || [])
      if (result.total != null) total += result.total
      else total += result.items?.length || 0
      if (result.hasMore) hasMore = true
      for (const message of result.warnings || []) {
        errors.push({ moduleId: module.id, message })
      }
      for (const name of result.regions || []) {
        if (name && !regions.includes(name)) regions.push(name)
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
  if (!total) total = items.length
  return { query, kind, items, errors, total, offset, hasMore, regions: regions.length ? regions : undefined }
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
    if (err) return err
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
    ? `这是第 ${start + 1}–${shown} 条。列表可翻页；用户若在对话里问还有吗，立刻再调用 cloud_infra_query，query 仍为「${result.query || ''}」，kind=${result.kind}，offset=${shown}。`
    : `一共 ${result.total ?? result.items.length} 条，已经全部列出。`
  const err = result.errors.length ? `\n部分模块失败：${result.errors.map((item) => item.moduleId).join(', ')}` : ''
  if (result.kind === 'registrar') {
    return `可注册查询已显示为对话卡片。请用户在卡片顶部搜索框改关键字再查；可买的点「立即加购」，再走购物车、提交订单、核对信息、账户余额支付。不要引导去设置页或独立页。不要打印密钥。\n\n${lines.join('\n')}${err}`
  }
  if (result.kind === 'my-domain') {
    return `我的域名已显示为对话卡片。请用户在卡片顶部搜索框筛选，点「管理」查看基本信息与域名安全。不要引导去设置页或独立页。不要打印密钥。\n\n${lines.join('\n')}${err}`
  }
  const cdb = result.kind === 'cdb' || result.items.some((item) => item.kind === 'cdb')
  const instance = result.kind === 'cvm' || result.kind === 'lighthouse'
    || result.items.some((item) => item.kind === 'cvm' || item.kind === 'lighthouse')
  const hint = result.kind === 'cert'
    ? '用一两句话概括即可，请用户点击证书 ID 或绑定域名查看完整详情。不要打印密钥或证书正文。'
    : cdb
      ? '用一两句话概括即可，请用户点击「登录」进入 DMC，或点击「管理」打开实例管理页。不要打印密钥。'
      : instance
        ? '用一两句话概括即可，请用户在列表中查看或点击实例 ID 看详情。不要打印密钥。'
        : '用一两句话概括即可，请用户点击「解析」或域名进行配置。不要打印密钥。'
  return `找到 ${result.total ?? result.items.length} 条，已显示为可翻页列表。${more} ${hint}\n\n${lines.join('\n')}${err}`
}
