import { publicErrorMessage } from '../../../core/safe-error.js'
import type { ModuleError, ResourceAction, ResourceStatus } from '../../../core/types.js'
import type { TencentCallContext, TencentCreds, TencentProductCall } from '../client.js'

export type MonitorApi = TencentProductCall

export type MonitorRange = '1h' | '6h' | '24h'

export interface MetricSeries {
  metric: string
  timestamps: number[]
  values: Array<number | null>
}

/** 时间档 → 默认采样周期（秒）：1h/60s、6h/300s、24h/900s */
export const MONITOR_RANGE_PERIOD: Record<MonitorRange, number> = {
  '1h': 60,
  '6h': 300,
  '24h': 900,
}

export function normalizeMonitorRange(range?: string): MonitorRange {
  return range === '6h' || range === '24h' ? range : '1h'
}

/**
 * 推导 GetMonitorData 的时间窗与采样周期。
 * EndTime 对齐到 5 分钟整数倍（云监控 60s 数据有分钟级延迟，对齐后点数平稳）。
 */
export function monitorWindow(range?: string, nowMs = Date.now()): { startTime: string; endTime: string; period: number } {
  const r = normalizeMonitorRange(range)
  const period = MONITOR_RANGE_PERIOD[r]
  const hours = r === '24h' ? 24 : r === '6h' ? 6 : 1
  const align = 300
  const endSec = Math.floor(nowMs / 1000 / align) * align
  const startSec = endSec - hours * 3600
  const iso = (sec: number) => new Date(sec * 1000).toISOString().replace(/\.\d+Z$/, 'Z').replace('T', ' ').replace('Z', '')
  return { startTime: iso(startSec), endTime: iso(endSec), period }
}

interface GetMonitorDataPoint {
  Dimensions?: Array<{ Name?: string; Value?: string }>
  Timestamps?: number[]
  Values?: Array<number | null>
}

interface GetMonitorDataResponse {
  MetricName?: string
  DataPoints?: GetMonitorDataPoint[]
  Points?: GetMonitorDataPoint[]
}

/**
 * 拉取单实例单指标的时间序列。
 * 空数据 / 指标不存在时返回空数组而不抛错；网络与权限错误仍会抛给调用方。
 */
export async function fetchMetricSeries(
  monitor: MonitorApi,
  input: {
    namespace: string
    metric: string
    instanceId: string
    region: string
    range?: string
    period?: number
    dimensionName?: string
    creds: TencentCreds
    opts: TencentCallContext
    nowMs?: number
  },
): Promise<MetricSeries> {
  const win = monitorWindow(input.range, input.nowMs)
  const data = await monitor<GetMonitorDataResponse>('GetMonitorData', {
    Namespace: input.namespace,
    MetricName: input.metric,
    Period: input.period || win.period,
    StartTime: win.startTime,
    EndTime: win.endTime,
    Instances: [{ Dimensions: [{ Name: input.dimensionName || 'InstanceId', Value: input.instanceId }] }],
  }, input.creds, { ...input.opts, region: input.region })
  const point = (data.DataPoints || data.Points || [])[0]
  const timestamps = Array.isArray(point?.Timestamps) ? point.Timestamps.map((t) => Number(t)).filter(Number.isFinite) : []
  const rawValues = Array.isArray(point?.Values) ? point.Values : []
  const values = timestamps.map((_, i) => {
    const v = rawValues[i]
    const n = Number(v)
    return v == null || !Number.isFinite(n) ? null : n
  })
  return { metric: input.metric, timestamps, values }
}

export interface HostMetricDef {
  key: string
  metricName: string
  label: string
  unit: string
  color: string
}

/** CVM / 轻量应用服务器共用主机级指标集 */
export const HOST_METRICS: HostMetricDef[] = [
  { key: 'cpu', metricName: 'CpuUsage', label: 'CPU 使用率', unit: '%', color: '#3a7bff' },
  { key: 'memory', metricName: 'MemUsage', label: '内存使用率', unit: '%', color: '#8a5cf6' },
  { key: 'disk', metricName: 'CvmDiskUsage', label: '磁盘使用率', unit: '%', color: '#f6a35c' },
  { key: 'lanIn', metricName: 'LanIntraffic', label: '内网入带宽', unit: 'Mbps', color: '#2fbf71' },
  { key: 'lanOut', metricName: 'LanOuttraffic', label: '内网出带宽', unit: 'Mbps', color: '#1f9d8f' },
  { key: 'diskRead', metricName: 'DiskReadIops', label: '磁盘读 IOPS', unit: '次/s', color: '#e5646e' },
  { key: 'diskWrite', metricName: 'DiskWriteIops', label: '磁盘写 IOPS', unit: '次/s', color: '#d48806' },
  { key: 'pkgIn', metricName: 'LanInpkg', label: '内网入包量', unit: '个/s', color: '#6b7cff' },
  { key: 'pkgOut', metricName: 'LanOutpkg', label: '内网出包量', unit: '个/s', color: '#9a6bff' },
]

/**
 * 并发拉取一组指标；单指标失败只记空序列，不拖垮其他图。
 */
export async function fetchMonitorSeries(
  monitor: MonitorApi,
  input: {
    namespace: string
    metrics: HostMetricDef[]
    instanceId: string
    region: string
    range?: string
    creds: TencentCreds
    opts: TencentCallContext
    nowMs?: number
  },
): Promise<{ range: MonitorRange; series: MetricSeries[]; errors: string[] }> {
  const range = normalizeMonitorRange(input.range)
  const results = await Promise.all(input.metrics.map(async (metric) => {
    try {
      return await fetchMetricSeries(monitor, { ...input, metric: metric.metricName, range })
    } catch (err) {
      return { metric: metric.metricName, timestamps: [] as number[], values: [] as Array<number | null>, error: publicErrorMessage(err) }
    }
  }))
  return {
    range,
    series: results.map((row) => ({ metric: row.metric, timestamps: row.timestamps, values: row.values })),
    errors: results.map((row) => ('error' in row ? String(row.error) : '')).filter(Boolean),
  }
}


export const INSTANCE_ACTIONS: ResourceAction[] = [
  { id: 'instance.start', label: '开机', confirm: 'default' },
  { id: 'instance.stop', label: '关机', confirm: 'default' },
  { id: 'instance.reboot', label: '重启', confirm: 'default' },
]

export const POWER_ACTIONS: Record<string, string> = {
  'instance.start': 'StartInstances',
  'instance.stop': 'StopInstances',
  'instance.reboot': 'RebootInstances',
}

export interface CloudRegion {
  region: string
  regionName: string
}

export interface RegionItem {
  Region?: string
  RegionName?: string
  RegionState?: string
}

export interface ZoneItem {
  Zone?: string
  ZoneName?: string
}

export function consoleRegionName(name?: string, region?: string): string {
  const raw = String(name || region || '').replace(/\(/g, '（').replace(/\)/g, '）')
  return raw || region || ''
}

export function consoleTime(value?: string): string {
  if (!value) return ''
  return value.replace('T', ' ').replace(/\.\d+Z$/, '').replace(/Z$/, '')
}

export function mapInstanceState(state?: string): { status: ResourceStatus; stateLabel: string } {
  const value = String(state || '').toUpperCase()
  if (value === 'RUNNING') return { status: 'enable', stateLabel: '运行中' }
  if (value === 'STOPPED') return { status: 'pause', stateLabel: '已关机' }
  if (value === 'STARTING') return { status: 'unknown', stateLabel: '开机中' }
  if (value === 'STOPPING') return { status: 'unknown', stateLabel: '关机中' }
  if (value === 'REBOOTING') return { status: 'unknown', stateLabel: '重启中' }
  if (value === 'PENDING' || value === 'LAUNCH_FAILED') return { status: 'unknown', stateLabel: '创建中' }
  if (value === 'SHUTDOWN' || value === 'EXPIRED' || value === 'TERMINATED') return { status: 'pause', stateLabel: '待回收' }
  return { status: 'unknown', stateLabel: value || '未知' }
}

export function powerAllowed(stateLabel: string, actionId: string): boolean {
  if (actionId === 'instance.start') return stateLabel === '已关机'
  if (actionId === 'instance.stop' || actionId === 'instance.reboot') return stateLabel === '运行中'
  return false
}

export function parseInstanceRef(id: string): { moduleId: string; region: string; instanceId: string } {
  const parts = String(id || '').split(':')
  if (parts.length >= 3) {
    return {
      moduleId: parts.slice(0, -2).join(':'),
      region: parts[parts.length - 2],
      instanceId: parts[parts.length - 1],
    }
  }
  return {
    moduleId: parts[0] || '',
    region: '',
    instanceId: parts[1] || parts[0] || '',
  }
}

export function instanceCardId(moduleId: string, region: string, instanceId: string): string {
  return `${moduleId}:${region}:${instanceId}`
}

export function matchInstanceQuery(haystacks: Array<string | undefined>, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return haystacks.some((value) => String(value || '').toLowerCase().includes(q))
}

export function instanceSearchText(card: {
  title?: string
  instanceId?: string
  id?: string
  privateIp?: string
  publicIp?: string
  columns?: Array<{ value?: string }>
}): Array<string | undefined> {
  return [
    card.title,
    card.instanceId,
    card.id,
    card.privateIp,
    card.publicIp,
    ...(card.columns || []).map((col) => col.value),
  ]
}

export function matchRegion(card: { region?: string; regionName?: string }, region?: string): boolean {
  const want = String(region || '').trim()
  if (!want || want === 'all' || want === '*') return true
  return card.region === want || card.regionName === want
}

export const DEFAULT_REGION = 'ap-guangzhou'
export const DEFAULT_REGION_LABEL = '华南地区（广州）'

export function isGuangzhou(region: { region?: string; regionName?: string } | string): boolean {
  const text = typeof region === 'string'
    ? region
    : `${region.region || ''} ${region.regionName || ''}`
  return /ap-guangzhou\b/.test(text) || /广州/.test(text)
}

export function pickRegions(regions: CloudRegion[], wanted?: string): CloudRegion[] {
  if (!regions.length) return []
  const want = String(wanted || '').trim()
  if (want === 'all' || want === '*') return regions
  if (want) {
    return regions.filter((row) => (
      row.region === want
      || row.regionName === want
      || (isGuangzhou(want) && isGuangzhou(row))
    ))
  }
  const gz = regions.find((row) => isGuangzhou(row))
  return [gz || regions[0]]
}

export function defaultRegionName(names: string[]): string {
  const list = names.filter(Boolean)
  return list.find((name) => isGuangzhou(name)) || list[0] || DEFAULT_REGION_LABEL
}

export function paginateItems<T>(items: T[], offset: number, limit: number): {
  items: T[]
  total: number
  offset: number
  hasMore: boolean
} {
  const total = items.length
  const start = Math.max(0, Math.floor(Number(offset) || 0))
  const size = Math.max(1, Math.floor(Number(limit) || 1))
  const page = items.slice(start, start + size)
  return {
    items: page,
    total,
    offset: start,
    hasMore: start + page.length < total,
  }
}

export function chargeTypeLabel(type?: string): string {
  const value = String(type || '').toUpperCase()
  if (value === 'PREPAID') return '包年包月'
  if (value === 'POSTPAID_BY_HOUR') return '按量计费'
  if (value === 'SPOTPAID') return '竞价实例'
  if (value === 'CDHPAID') return 'CDH 付费'
  return type || '-'
}

export function formatSpec(cpu?: number, memory?: number, memoryUnit = 'GB'): string {
  if (cpu == null && memory == null) return '-'
  const cores = cpu != null ? `${cpu}核` : ''
  const mem = memory != null ? `${memory}${memoryUnit}` : ''
  return [cores, mem].filter(Boolean).join(' ')
}

export function firstIp(list?: string[]): string {
  return list?.find((item) => item && item !== '-') || ''
}

export async function listRegions(
  call: TencentProductCall,
  creds: TencentCreds,
  opts: TencentCallContext,
): Promise<CloudRegion[]> {
  const data = await call<{ RegionSet?: RegionItem[] }>('DescribeRegions', {}, creds, opts)
  return (data.RegionSet || [])
    .filter((item) => item.Region && String(item.RegionState || 'AVAILABLE').toUpperCase() !== 'UNAVAILABLE')
    .map((item) => ({
      region: String(item.Region),
      regionName: consoleRegionName(item.RegionName, item.Region),
    }))
}

export async function listZones(
  call: TencentProductCall,
  creds: TencentCreds,
  opts: TencentCallContext,
  region: string,
): Promise<Map<string, string>> {
  try {
    const data = await call<{ ZoneSet?: ZoneItem[] }>('DescribeZones', {}, creds, { ...opts, region })
    const map = new Map<string, string>()
    for (const item of data.ZoneSet || []) {
      if (item.Zone) map.set(item.Zone, item.ZoneName || item.Zone)
    }
    return map
  } catch {
    return new Map()
  }
}

export async function listAllPages<T>(
  fetchPage: (offset: number, limit: number) => Promise<{ items: T[]; total?: number }>,
  pageSize = 100,
  cap = 500,
): Promise<T[]> {
  const all: T[] = []
  let offset = 0
  while (all.length < cap) {
    const { items, total } = await fetchPage(offset, pageSize)
    all.push(...items)
    if (!items.length) break
    if (total != null && all.length >= total) break
    if (items.length < pageSize) break
    offset += items.length
  }
  return all.slice(0, cap)
}

export async function listAcrossRegions<T>(
  regions: CloudRegion[],
  load: (region: CloudRegion) => Promise<T[]>,
  moduleId: string,
): Promise<{ items: T[]; errors: ModuleError[] }> {
  const bags = await Promise.all(regions.map(async (region) => {
    try {
      return { items: await load(region), error: undefined as ModuleError | undefined }
    } catch (err) {
      return {
        items: [] as T[],
        error: {
          moduleId,
          message: `${region.regionName || region.region}：${publicErrorMessage(err)}`,
        },
      }
    }
  }))
  return {
    items: bags.flatMap((bag) => bag.items),
    errors: bags.map((bag) => bag.error).filter((item): item is ModuleError => !!item),
  }
}

export function credsOf(ctx: { creds: Record<string, string> }): TencentCreds {
  return { secretId: ctx.creds.secretId, secretKey: ctx.creds.secretKey }
}

export function optsOf(ctx: { timeoutMs: number; signal?: AbortSignal }, region?: string): TencentCallContext {
  return { timeoutMs: ctx.timeoutMs, signal: ctx.signal, region }
}
