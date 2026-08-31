import { publicErrorMessage } from '../../../core/safe-error.js'
import type { ModuleError, ResourceAction, ResourceStatus } from '../../../core/types.js'
import type { TencentCallContext, TencentCreds, TencentProductCall } from '../client.js'

export type MonitorApi = TencentProductCall

export type MonitorRange = '1h' | '6h' | '24h'

export interface MetricSeries {
  /** 指标定义 key(如 'cpu'),与 MetricDef.key 对齐,前端以此作 seriesMap 键 */
  key?: string
  metric: string
  timestamps: number[]
  values: Array<number | null>
}

/**
 * 云监控允许的统计粒度（秒）。GetMonitorData 只接受这些取值，
 * 传集合外的数字（曾用过 900）会被上游直接判 `InvalidParameterValue: period is invalid`，
 * 且是整档时间范围内的每个指标都失败，而不是单个指标降级。
 */
export const MONITOR_PERIODS = [10, 60, 300, 3600, 86400]

/**
 * 时间档 → 默认采样周期（秒）：1h/60s、6h/300s、24h/300s。
 * 24h 用 300s（288 点，远低于单请求 1440 点上限）而不是 3600s：
 * 轻量应用服务器的 CpuUsage 等指标官方只给到 300s 粒度，3600s 不在其统计规则内。
 */
export const MONITOR_RANGE_PERIOD: Record<MonitorRange, number> = {
  '1h': 60,
  '6h': 300,
  '24h': 300,
}

/** 把任意周期收敛到合法粒度：优先取不超过目标值的最细一档，保证点数不少于预期。 */
export function normalizeMonitorPeriod(period?: number): number {
  const want = Number(period)
  if (!Number.isFinite(want) || want <= 0) return 60
  if (MONITOR_PERIODS.includes(want)) return want
  const finer = MONITOR_PERIODS.filter((row) => row < want)
  return finer.length ? finer[finer.length - 1] : MONITOR_PERIODS[0]
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
  const period = normalizeMonitorPeriod(MONITOR_RANGE_PERIOD[r])
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
    Period: normalizeMonitorPeriod(input.period || win.period),
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
  /** 官方未在主机级(InstanceId 维度)暴露该指标时不发起请求,前端卡片显示此说明 */
  unavailable?: string
  /** 依赖实例内监控组件(barad_agent);为空序列时归因为 AGENT_MISSING */
  requiresAgent?: boolean
}

/** 指标级失败根因分类 */
export type MetricErrorType = 'AGENT_MISSING' | 'METRIC_NOT_FOUND' | 'API_ERROR' | 'INSTANCE_NOT_RUNNING'

export interface MetricError {
  key: string
  metric: string
  errorType: MetricErrorType
  /** 已脱敏的可展示原因 */
  message?: string
  /** 上游错误码(TencentApiError.code),仅 API_ERROR 时存在 */
  code?: string
  /** 前端建议动作 */
  suggestion?: string
}

export const METRIC_SUGGESTIONS: Record<MetricErrorType, string> = {
  METRIC_NOT_FOUND: '云监控未提供该指标',
  AGENT_MISSING: '请到轻量/CVM 控制台检查并安装或启动监控组件(barad_agent)后重试',
  API_ERROR: '请检查 CAM 云监控权限或稍后重试',
  INSTANCE_NOT_RUNNING: '实例开机后约 5 分钟开始上报监控数据',
}

/** 实例未运行时的整体说明,替代逐条「监控组件未安装」(关机实例本来就不上报) */
export const MONITOR_NOT_RUNNING_NOTE = '实例未运行，云监控暂无数据（开机后约 5 分钟开始上报）'

/**
 * 指标级根因分类。优先级与需求边界用例一致:
 *  1) 空点 + 实例未运行 → INSTANCE_NOT_RUNNING(关机实例不上报,归因为 agent 缺失会误导用户去装组件)
 *  2) 空点 + 依赖 agent → AGENT_MISSING
 *  3) 空点(或错误信息表明指标/维度不存在)→ METRIC_NOT_FOUND
 *  4) 带上游 code → 命中上述 not-found 关键字时归 METRIC_NOT_FOUND,否则 API_ERROR
 */
export function classifyMetricError(input: {
  error?: unknown
  emptyPoints?: boolean
  requiresAgent?: boolean
  unavailable?: string
  /** 明确为 false 时表示实例非运行中(已关机/待回收等) */
  instanceRunning?: boolean
}): { errorType: MetricErrorType; message?: string; code?: string } {
  // 结构性不可用(官方未暴露)与「按官方要求未发请求」
  if (input.unavailable) return { errorType: 'METRIC_NOT_FOUND', message: input.unavailable }
  const err = input.error
  const code = err && typeof err === 'object' && 'code' in err ? String((err as { code?: unknown }).code || '') : ''
  const message = err ? publicErrorMessage(err) : ''
  // 判定依据用上游原始信息(脱敏后可能塌缩为「云厂商请求失败」),展示信息用脱敏后的
  const raw = err instanceof Error ? err.message : String(err ?? '')
  const notFound = /InvalidParameterValue|ResourceNotFound|MetricNotExist|not exist|不存在/i.test(`${code} ${raw}`)
  // 非运行中实例不会上报监控；即使上游以错误而非空序列表达，也不要误导成 agent 缺失。
  if (input.emptyPoints && input.instanceRunning === false) {
    return { errorType: 'INSTANCE_NOT_RUNNING', code: code || undefined }
  }
  if (err) {
    // 依赖 agent 的指标同时返回空/报错:优先按 agent 缺失归因(空点最常见就是组件未装)
    if (input.emptyPoints && input.requiresAgent) return { errorType: 'AGENT_MISSING', message, code: code || undefined }
    if (notFound) return { errorType: 'METRIC_NOT_FOUND', message, code: code || undefined }
    if (code) return { errorType: 'API_ERROR', message, code }
    if (input.emptyPoints && input.requiresAgent) return { errorType: 'AGENT_MISSING', message }
    return { errorType: 'API_ERROR', message }
  }
  if (input.emptyPoints && input.instanceRunning === false) return { errorType: 'INSTANCE_NOT_RUNNING' }
  if (input.emptyPoints && input.requiresAgent) return { errorType: 'AGENT_MISSING' }
  if (input.emptyPoints) return { errorType: 'METRIC_NOT_FOUND' }
  return { errorType: 'API_ERROR' }
}

/**
 * CVM(QCE/CVM)主机级指标集。
 * 官方「云服务器监控指标」文档(https://cloud.tencent.com/document/product/248/6843):
 * InstanceId 维度下不存在主机级磁盘 IOPS 指标(相近的 VmDiskReadIops 为 vmUuid 维度、
 * DiskReadTraffic/DiskWriteTraffic 为设备级 vm_uuid 维度),故指标集不含磁盘 IOPS 条目。
 * MemUsage/CvmDiskUsage 依赖实例内监控组件(官方文档明示),标记 requiresAgent。
 */
export const HOST_METRICS: HostMetricDef[] = [
  { key: 'cpu', metricName: 'CpuUsage', label: 'CPU 使用率', unit: '%', color: '#3a7bff' },
  { key: 'memory', metricName: 'MemUsage', label: '内存使用率', unit: '%', color: '#8a5cf6', requiresAgent: true },
  { key: 'disk', metricName: 'CvmDiskUsage', label: '磁盘使用率', unit: '%', color: '#f6a35c', requiresAgent: true },
  { key: 'lanIn', metricName: 'LanIntraffic', label: '内网入带宽', unit: 'Mbps', color: '#2fbf71' },
  { key: 'lanOut', metricName: 'LanOuttraffic', label: '内网出带宽', unit: 'Mbps', color: '#1f9d8f' },
  { key: 'pkgIn', metricName: 'LanInpkg', label: '内网入包量', unit: '个/s', color: '#6b7cff' },
  { key: 'pkgOut', metricName: 'LanOutpkg', label: '内网出包量', unit: '个/s', color: '#9a6bff' },
]

/**
 * 轻量应用服务器(QCE/LIGHTHOUSE)指标集。
 * 命名空间与 CVM 不同,多项指标英文名也不同:
 * 指标英文名以官方「轻量应用服务器监控指标」文档(https://cloud.tencent.com/document/product/248/60127)为准:
 *  - CPU 使用率:CpuUsage
 *  - 内存使用率:MemUsage(与 CVM 同名;依赖实例内监控组件,未装时返回空序列)
 *  - 磁盘使用率:DiskUsage(CVM 为 CvmDiskUsage)
 * 该命名空间不存在 CPUUsage / MemoryUsage 指标,传这两个名字云监控会返回 InvalidParameterValue。
 * 与 CVM 一致:官方在 InstanceId 维度同样未提供主机级磁盘 IOPS,指标集不含 IOPS 条目。
 */
export const LIGHTHOUSE_METRICS: HostMetricDef[] = [
  { key: 'cpu', metricName: 'CpuUsage', label: 'CPU 使用率', unit: '%', color: '#3a7bff' },
  { key: 'memory', metricName: 'MemUsage', label: '内存使用率', unit: '%', color: '#8a5cf6', requiresAgent: true },
  { key: 'disk', metricName: 'DiskUsage', label: '磁盘使用率', unit: '%', color: '#f6a35c', requiresAgent: true },
  { key: 'lanIn', metricName: 'LanIntraffic', label: '内网入带宽', unit: 'Mbps', color: '#2fbf71' },
  { key: 'lanOut', metricName: 'LanOuttraffic', label: '内网出带宽', unit: 'Mbps', color: '#1f9d8f' },
  { key: 'pkgIn', metricName: 'LanInpkg', label: '内网入包量', unit: '个/s', color: '#6b7cff' },
  { key: 'pkgOut', metricName: 'LanOutpkg', label: '内网出包量', unit: '个/s', color: '#9a6bff' },
]

/**
 * 并发拉取一组指标；单指标失败只记空序列，不拖垮其他图。
 * 每项失败按 classifyMetricError 归入 MetricError[];errors(string[])保留兼容旧契约。
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
    /** 实例是否运行中;传 false 时空序列归因为「实例未运行」而不是「监控组件未安装」 */
    instanceRunning?: boolean
  },
): Promise<{
  range: MonitorRange
  series: MetricSeries[]
  errors: string[]
  metricErrors: MetricError[]
  /** 实例未运行且全部指标为空:调用方应只给一条整体说明,不逐条列失败 */
  notRunning?: boolean
}> {
  const range = normalizeMonitorRange(input.range)
  const results = await Promise.all(input.metrics.map(async (metric) => {
    if (metric.unavailable) {
      const err = classifyMetricError({ unavailable: metric.unavailable })
      return {
        key: metric.key,
        metric: metric.metricName,
        timestamps: [] as number[],
        values: [] as Array<number | null>,
        error: { key: metric.key, metric: metric.metricName, ...err, suggestion: METRIC_SUGGESTIONS.METRIC_NOT_FOUND } as MetricError,
      }
    }
    try {
      const row = await fetchMetricSeries(monitor, { ...input, metric: metric.metricName, range })
      // 空序列且无错误码:关机实例归因为「实例未运行」,运行中且依赖 agent 才归因为组件缺失
      if (!row.timestamps.length && (metric.requiresAgent || input.instanceRunning === false)) {
        const cls = classifyMetricError({
          emptyPoints: true,
          requiresAgent: metric.requiresAgent,
          instanceRunning: input.instanceRunning,
        })
        return {
          ...row,
          key: metric.key,
          error: {
            key: metric.key,
            metric: metric.metricName,
            ...cls,
            suggestion: METRIC_SUGGESTIONS[cls.errorType],
          } as MetricError,
        }
      }
      // 同步回填 MetricDef.key,前端 seriesMap 统一以 key 为键(避免 metricName 与 key 错位)
      return { ...row, key: metric.key }
    } catch (err) {
      const cls = classifyMetricError({
        error: err,
        emptyPoints: true,
        requiresAgent: metric.requiresAgent,
        instanceRunning: input.instanceRunning,
      })
      return {
        key: metric.key,
        metric: metric.metricName,
        timestamps: [] as number[],
        values: [] as Array<number | null>,
        error: {
          key: metric.key,
          metric: metric.metricName,
          ...cls,
          suggestion: METRIC_SUGGESTIONS[cls.errorType],
        } as MetricError,
      }
    }
  }))
  const metricErrors = results
    .map((row) => ('error' in row ? row.error : undefined))
    .filter((row): row is MetricError => !!row)
  const series = results.map((row) => ({ key: row.key, metric: row.metric, timestamps: row.timestamps, values: row.values }))
  // 关机实例全部指标为空是预期行为,逐条列「拉取失败」只会让用户以为要去修组件
  const notRunning = input.instanceRunning === false
    && series.every((row) => !row.timestamps.length)
    && metricErrors.every((row) => row.errorType === 'INSTANCE_NOT_RUNNING')
  if (notRunning) return { range, series, errors: [], metricErrors: [], notRunning: true }
  return {
    range,
    series,
    errors: metricErrors.map((row) => row.message || row.errorType),
    metricErrors,
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

/**
 * 状态筛选可选项，与控制台「状态」列下拉一致，取值即 mapInstanceState 产出的中文状态。
 * 过渡态（开机中/关机中/重启中/创建中）不单列，避免下拉里出现一堆瞬时项。
 */
export const INSTANCE_STATUS_OPTIONS = ['运行中', '待回收', '已关机']

/**
 * 按状态筛选。ctx.filters.status 为逗号分隔的中文状态（前端多选拼接），空值表示不筛选。
 * 这里在已映射的卡片上做，而不是下推成 DescribeInstances 的 instance-state 过滤器：
 * 「待回收」在我们的口径里覆盖 SHUTDOWN/EXPIRED/TERMINATED 多个上游状态，
 * 下推后既要维护一份易漂移的状态映射，又会因传入官方状态表外的值被判 InvalidFilterValue 而整表拉取失败。
 */
export function matchInstanceStatus(card: { stateLabel?: string }, status?: string): boolean {
  const wanted = parseStatusFilter(status)
  if (!wanted.length) return true
  return wanted.includes(String(card.stateLabel || ''))
}

export function parseStatusFilter(status?: string): string[] {
  return String(status || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
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
    // CVM 返回 ZoneSet,轻量应用服务器返回 ZoneInfoSet(同为 Zone + ZoneName);
    // 只读 ZoneSet 会让轻量的可用区列退化成 ap-guangzhou-7 这样的 id。
    const data = await call<{ ZoneSet?: ZoneItem[]; ZoneInfoSet?: ZoneItem[] }>('DescribeZones', {}, creds, { ...opts, region })
    const map = new Map<string, string>()
    for (const item of data.ZoneSet || data.ZoneInfoSet || []) {
      if (item.Zone) map.set(item.Zone, item.ZoneName || item.Zone)
    }
    return map
  } catch {
    return new Map()
  }
}

/** 达到 cap 截断时置位,供调用方生成 warning;调用方每次调用前应复位为 false。 */
export const listAllPagesTruncated = { current: false }

export async function listAllPages<T>(
  fetchPage: (offset: number, limit: number) => Promise<{ items: T[]; total?: number }>,
  pageSize = 100,
  cap = 500,
): Promise<T[]> {
  listAllPagesTruncated.current = false
  const all: T[] = []
  let offset = 0
  let reportedTotal: number | undefined
  while (all.length < cap) {
    const { items, total } = await fetchPage(offset, pageSize)
    if (total != null) reportedTotal = total
    all.push(...items)
    if (!items.length) break
    if (total != null && all.length >= total) break
    if (items.length < pageSize) break
    offset += items.length
  }
  // 上游总数大于已拉取条数,说明触顶截断,标记给上层提示「仅显示前 N 条」
  if (reportedTotal != null && reportedTotal > all.length) listAllPagesTruncated.current = true
  if (all.length > cap) listAllPagesTruncated.current = true
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
