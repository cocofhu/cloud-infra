import { publicErrorMessage } from '../../../core/safe-error.js'
import { registerModule } from '../../../core/registry.js'
import type {
  LogHit,
  ModuleContext,
  ResourceCard,
  ResourceDetail,
  ResourceModule,
  SearchResult,
} from '../../../core/types.js'
import { clsCall } from '../client.js'
import {
  CLS_REGIONS,
  DEFAULT_CLS_REGION,
  parseRegionHint,
  regionLabel,
  resolveClsRegion,
} from '../regions.js'

export interface TopicListItem {
  TopicId?: string
  TopicName?: string
  LogsetId?: string
  LogsetName?: string
  StorageType?: string
  Period?: number
  HotPeriod?: number
  CreateTime?: string
  Status?: boolean
  BizType?: number
  Describes?: string
}

export interface LogsetListItem {
  LogsetId?: string
  LogsetName?: string
}

export interface SearchLogItem {
  Time?: number
  TopicId?: string
  TopicName?: string
  Source?: string
  FileName?: string
  HostName?: string
  RawLog?: string
  LogJson?: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function storageLabel(raw?: string): string {
  const value = String(raw || '').toLowerCase()
  if (value === 'hot' || value === 'standard') return '标准存储'
  if (value === 'cold' || value === 'infrequent') return '低频存储'
  return raw || '-'
}

export function periodLabel(days?: number): string {
  if (!Number.isFinite(Number(days)) || Number(days) <= 0) return '-'
  return `${Number(days)} 天`
}

export function formatLogTime(timeMs: number): string {
  if (!Number.isFinite(timeMs) || timeMs <= 0) return ''
  const d = new Date(timeMs)
  const pad = (n: number, w = 2) => String(n).padStart(w, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

export function mapTopicItem(item: TopicListItem, region: string, moduleId = 'tencent.cls'): ResourceCard {
  const topicId = String(item.TopicId || '').trim()
  const title = item.TopicName || topicId
  const logset = item.LogsetName || item.LogsetId || '-'
  const created = item.CreateTime || ''
  return {
    id: `${moduleId}:${region}:${topicId}`,
    moduleId,
    provider: 'tencent',
    kind: 'cls',
    title,
    description: [logset !== '-' ? logset : '', created].filter(Boolean).join(' · ') || title,
    status: item.Status === false ? 'pause' : 'enable',
    openLabel: '检索分析',
    columns: [
      { label: '主题ID', value: topicId },
      { label: '日志集', value: logset },
      { label: '存储类型', value: storageLabel(item.StorageType) },
      { label: '保存时间', value: periodLabel(item.Period) },
      { label: '创建时间', value: created },
    ],
  }
}

export function mapLogHit(item: SearchLogItem): LogHit {
  const timeMs = Number(item.Time) || 0
  const fields: Record<string, string> = {}
  if (item.LogJson) {
    try {
      const parsed = JSON.parse(item.LogJson) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
          if (value == null) continue
          fields[key] = typeof value === 'string' ? value : JSON.stringify(value)
        }
      }
    } catch {
      /* keep raw */
    }
  }
  return {
    timeMs,
    timeLabel: formatLogTime(timeMs),
    content: item.RawLog || item.LogJson || '',
    source: item.Source || item.HostName || undefined,
    fileName: item.FileName || undefined,
    fields,
  }
}

export function parseTopicRef(id: string): { moduleId: string; region: string; topicId: string } {
  const raw = String(id || '').trim()
  const parts = raw.split(':')
  if (parts.length >= 3) {
    return {
      moduleId: parts.slice(0, -2).join(':'),
      region: parts[parts.length - 2] || DEFAULT_CLS_REGION,
      topicId: parts[parts.length - 1] || '',
    }
  }
  if (parts.length === 2) {
    return { moduleId: parts[0] || 'tencent.cls', region: DEFAULT_CLS_REGION, topicId: parts[1] || '' }
  }
  return { moduleId: 'tencent.cls', region: DEFAULT_CLS_REGION, topicId: raw }
}

export function resolveTimeRange(
  range?: string,
  from?: number,
  to?: number,
  now = Date.now(),
): { from: number; to: number; range: string } {
  const start = Number(from)
  const end = Number(to)
  if (Number.isFinite(start) && start > 0 && Number.isFinite(end) && end > start) {
    return { from: Math.floor(start), to: Math.floor(end), range: range || 'custom' }
  }
  const key = String(range || '1h').trim() || '1h'
  if (key === '15m') return { from: now - 15 * 60 * 1000, to: now, range: '15m' }
  if (key === '4h') return { from: now - 4 * 60 * 60 * 1000, to: now, range: '4h' }
  if (key === '1d') return { from: now - 24 * 60 * 60 * 1000, to: now, range: '1d' }
  if (key === 'today') {
    const day = new Date(now)
    day.setHours(0, 0, 0, 0)
    return { from: day.getTime(), to: now, range: 'today' }
  }
  if (key === 'yesterday') {
    const day = new Date(now)
    day.setHours(0, 0, 0, 0)
    return { from: day.getTime() - 24 * 60 * 60 * 1000, to: day.getTime(), range: 'yesterday' }
  }
  return { from: now - 60 * 60 * 1000, to: now, range: '1h' }
}

export type ClsCall = typeof clsCall

export function createClsModule(call: ClsCall = clsCall): ResourceModule {
  const module: ResourceModule = {
    id: 'tencent.cls',
    provider: 'tencent',
    kind: 'cls',
    title: '腾讯云 CLS',
    implemented: true,
    async list(ctx) {
      const { region, query } = resolveListQuery(ctx)
      const data = await listTopics(call, ctx, region, query)
      const items = data.items.map((item) => mapTopicItem(item, region, module.id))
      return {
        items,
        total: data.total,
        offset: ctx.offset,
        hasMore: ctx.offset + items.length < data.total,
        region,
        regions: CLS_REGIONS,
        view: 'list',
      }
    },
    async detail(ctx) {
      const searched = await module.search?.(ctx)
      const ref = parseTopicRef(String(ctx.id || ctx.topicId || ''))
      const region = resolveClsRegion(ctx.region || ref.region)
      const card = searched?.card || {
        id: `${module.id}:${region}:${ref.topicId}`,
        moduleId: module.id,
        provider: 'tencent',
        kind: 'cls',
        title: searched?.topicName || ctx.title || ref.topicId,
        description: regionLabel(region),
        openLabel: '检索分析',
      }
      const fields = [
        { label: '日志主题', value: card.title },
        { label: '主题 ID', value: searched?.topicId || ref.topicId },
        { label: '地域', value: regionLabel(region) },
        { label: '时间窗', value: searched?.range || '1h' },
      ].filter((row) => row.value)
      return {
        card,
        fields,
        logs: searched?.logs || [],
      } satisfies ResourceDetail
    },
    async search(ctx) {
      const { region, query } = resolveListQuery(ctx)
      const ref = parseTopicRef(String(ctx.topicId || ctx.id || ''))
      let topicId = String(ref.topicId || ctx.topicId || '').trim()
      let card: ResourceCard | undefined
      if (!topicId || topicId === module.id) {
        topicId = ''
      }
      if (!UUID_RE.test(topicId) && topicId.includes(':')) {
        topicId = parseTopicRef(topicId).topicId
      }
      if (!topicId) {
        const listed = await listTopics(call, ctx, region, query)
        const items = listed.items.map((item) => mapTopicItem(item, region, module.id))
        if (!items.length) {
          return {
            region,
            queryString: String(ctx.queryString || ''),
            range: ctx.range || '1h',
            from: 0,
            to: 0,
            logs: [],
            items: [],
            regions: CLS_REGIONS,
            error: '没有找到该日志主题',
          }
        }
        const needle = query.trim()
        const exact = needle ? items.filter((item) => item.title === needle) : items
        const pool = exact.length ? exact : items
        if (pool.length > 1) {
          return {
            region,
            queryString: String(ctx.queryString || ''),
            range: ctx.range || '1h',
            from: 0,
            to: 0,
            logs: [],
            items: pool,
            regions: CLS_REGIONS,
            error: '没有唯一匹配的日志主题，请指定主题 ID 或日志集',
          }
        }
        card = pool[0]
        topicId = parseTopicRef(card.id).topicId
      }
      const window = resolveTimeRange(ctx.range, ctx.from, ctx.to)
      const queryString = normalizeCql(ctx.queryString)
      try {
        const data = await call<{
          Context?: string
          ListOver?: boolean
          Results?: SearchLogItem[]
        }>('SearchLog', {
          TopicId: topicId,
          From: window.from,
          To: window.to,
          QueryString: queryString,
          QuerySyntax: 1,
          Limit: Math.max(1, Math.min(ctx.limit || 100, 1000)),
          Sort: 'desc',
          ...(ctx.context ? { Context: ctx.context } : {}),
        }, creds(ctx), opts(ctx, region))
        const logs = (data.Results || []).map(mapLogHit)
        const fieldSet = new Set<string>()
        for (const hit of logs) {
          for (const key of Object.keys(hit.fields || {})) fieldSet.add(key)
        }
        if (!card) {
          card = {
            id: `${module.id}:${region}:${topicId}`,
            moduleId: module.id,
            provider: 'tencent',
            kind: 'cls',
            title: ctx.title || topicId,
            description: regionLabel(region),
            openLabel: '检索分析',
            columns: [{ label: '主题ID', value: topicId }],
          }
        }
        return {
          card,
          items: [card],
          topicId,
          topicName: card.title,
          region,
          queryString,
          range: window.range,
          from: window.from,
          to: window.to,
          logs,
          context: data.Context,
          hasMore: data.ListOver === false,
          total: logs.length,
          fields: [...fieldSet],
          regions: CLS_REGIONS,
        } satisfies SearchResult
      } catch (err) {
        throw wrapClsError(err)
      }
    },
  }
  return module
}

function wrapClsError(err: unknown): Error {
  const code = err && typeof err === 'object' && 'code' in err ? String((err as { code?: unknown }).code || '') : ''
  if (/TopicNotExist|TopicNotFound/i.test(code)) return new Error('没有找到该日志主题')
  const message = publicErrorMessage(err)
  return Object.assign(new Error(message), { code })
}

/** Map common Chinese operators from the card placeholder to CQL. */
export function normalizeCql(raw?: string): string {
  return String(raw ?? '')
    .replace(/并且|且/g, ' AND ')
    .replace(/或/g, ' OR ')
    .replace(/\s+/g, ' ')
    .trim()
}

function resolveListQuery(ctx: ModuleContext): { region: string; query: string } {
  if (String(ctx.region || '').trim()) {
    return { region: resolveClsRegion(ctx.region), query: String(ctx.query || '').trim() }
  }
  const hinted = parseRegionHint(String(ctx.query || ''))
  return {
    region: resolveClsRegion(hinted.region),
    query: hinted.rest.replace(/\b(CLS|日志主题|日志服务|检索分析)\b/gi, ' ').replace(/\s+/g, ' ').trim(),
  }
}

async function listTopics(
  call: ClsCall,
  ctx: ModuleContext,
  region: string,
  query: string,
): Promise<{ items: TopicListItem[]; total: number }> {
  const filter = topicFilter(query)
  const payload: Record<string, unknown> = {
    Offset: ctx.offset,
    Limit: Math.max(1, Math.min(ctx.limit || 12, 50)),
  }
  if (filter) payload.Filters = [filter]
  try {
    const [topics, logsets] = await Promise.all([
      call<{ Topics?: TopicListItem[]; TotalCount?: number }>('DescribeTopics', payload, creds(ctx), opts(ctx, region)),
      call<{ Logsets?: LogsetListItem[] }>('DescribeLogsets', { Offset: 0, Limit: 100 }, creds(ctx), opts(ctx, region))
        .catch(() => ({ Logsets: [] as LogsetListItem[] })),
    ])
    let items = (topics.Topics || []).filter((item) => item.BizType !== 1)
    const names = new Map((logsets.Logsets || []).map((row) => [String(row.LogsetId || ''), String(row.LogsetName || '')]))
    items = items.map((item) => ({
      ...item,
      LogsetName: item.LogsetName || names.get(String(item.LogsetId || '')) || '',
    }))
    if (query && !filter) {
      const needle = query.toLowerCase()
      items = items.filter((item) => {
        return [item.TopicName, item.TopicId, item.LogsetName, item.LogsetId]
          .some((value) => String(value || '').toLowerCase().includes(needle))
      })
    }
    if (query && filter?.Key === 'topicName' && !items.length) {
      const retry = await call<{ Topics?: TopicListItem[]; TotalCount?: number }>('DescribeTopics', {
        Offset: ctx.offset,
        Limit: payload.Limit,
        Filters: [{ Key: 'logsetName', Values: [query] }],
      }, creds(ctx), opts(ctx, region))
      items = (retry.Topics || []).filter((item) => item.BizType !== 1).map((item) => ({
        ...item,
        LogsetName: item.LogsetName || names.get(String(item.LogsetId || '')) || '',
      }))
      // 本地按 BizType 过滤后 items 可能少于上游 TotalCount;取较小值保持「总数与列表」口径一致
      const retryTotal = Number(retry.TotalCount)
      return { items, total: Number.isFinite(retryTotal) ? Math.min(retryTotal, items.length) : items.length }
    }
    // 上游 TotalCount 是过滤前总数;本地 BizType/关键字过滤后用「上游总数与本页实际位置」取小,
    // 保证「共 N 条」与列表行数、hasMore 口径一致,不会把已过滤掉的条目计入总数
    const total = Number(topics.TotalCount)
    return { items, total: Number.isFinite(total) ? Math.min(total, ctx.offset + items.length) : items.length }
  } catch (err) {
    throw wrapClsError(err)
  }
}

function topicFilter(query: string): { Key: string; Values: string[] } | undefined {
  const text = String(query || '').trim()
  if (!text) return undefined
  if (UUID_RE.test(text)) return { Key: 'topicId', Values: [text] }
  return { Key: 'topicName', Values: [text] }
}

function creds(ctx: ModuleContext): { secretId: string; secretKey: string } {
  return { secretId: ctx.creds.secretId, secretKey: ctx.creds.secretKey }
}

function opts(ctx: ModuleContext, region: string): { timeoutMs: number; signal?: AbortSignal; region: string } {
  return { timeoutMs: ctx.timeoutMs, signal: ctx.signal, region }
}

export const tencentClsModule = createClsModule()
registerModule(tencentClsModule)
