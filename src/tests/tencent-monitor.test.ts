import assert from 'node:assert/strict'
import test from 'node:test'
import { TencentApiError, type TencentProductCall } from '../providers/tencent/client.js'
import {
  HOST_METRICS,
  LIGHTHOUSE_METRICS,
  MONITOR_PERIODS,
  MONITOR_RANGE_PERIOD,
  classifyMetricError,
  fetchMetricSeries,
  fetchMonitorSeries,
  monitorWindow,
  normalizeMonitorPeriod,
  normalizeMonitorRange,
} from '../providers/tencent/products/instance-common.js'

const creds = { secretId: 'id', secretKey: 'key' }
const opts = { timeoutMs: 5000 }

test('normalizeMonitorRange falls back to 1h', () => {
  assert.equal(normalizeMonitorRange('6h'), '6h')
  assert.equal(normalizeMonitorRange('24h'), '24h')
  assert.equal(normalizeMonitorRange('1h'), '1h')
  assert.equal(normalizeMonitorRange('7d'), '1h')
  assert.equal(normalizeMonitorRange(undefined), '1h')
})

test('monitorWindow aligns endTime to 5min and picks period per range', () => {
  const now = Date.parse('2026-08-29T12:07:33Z')
  const h1 = monitorWindow('1h', now)
  assert.equal(h1.period, MONITOR_RANGE_PERIOD['1h'])
  assert.equal(h1.endTime, '2026-08-29 12:05:00')
  assert.equal(h1.startTime, '2026-08-29 11:05:00')
  const h6 = monitorWindow('6h', now)
  assert.equal(h6.period, 300)
  assert.equal(h6.endTime, '2026-08-29 12:05:00')
  assert.equal(h6.startTime, '2026-08-29 06:05:00')
  const h24 = monitorWindow('24h', now)
  // 24h 不能用 900s:云监控只接受 10/60/300/3600/86400,900 会让整档指标全报 period is invalid
  assert.equal(h24.period, 300)
  assert.equal(h24.startTime, '2026-08-28 12:05:00')
  const fallback = monitorWindow(undefined, now)
  assert.equal(fallback.period, 60)
})

test('每档采样周期都落在云监控允许的统计粒度内', () => {
  for (const [range, period] of Object.entries(MONITOR_RANGE_PERIOD)) {
    assert.ok(MONITOR_PERIODS.includes(period), `${range} 的周期 ${period} 不是合法统计粒度`)
  }
  // 非法值收敛到不超过它的最细一档,而不是原样发给上游
  assert.equal(normalizeMonitorPeriod(900), 300)
  assert.equal(normalizeMonitorPeriod(1800), 300)
  assert.equal(normalizeMonitorPeriod(7200), 3600)
  assert.equal(normalizeMonitorPeriod(5), 10)
  assert.equal(normalizeMonitorPeriod(0), 60)
  assert.equal(normalizeMonitorPeriod(undefined), 60)
  assert.equal(normalizeMonitorPeriod(3600), 3600)
})

test('fetchMetricSeries 不会把非法周期透传给 GetMonitorData', async () => {
  const calls: Array<Record<string, unknown>> = []
  const monitor = (async (_action: string, payload: Record<string, unknown>) => {
    calls.push(payload)
    return { DataPoints: [{ Timestamps: [1000], Values: [1] }] }
  }) as unknown as TencentProductCall
  await fetchMetricSeries(monitor, {
    namespace: 'QCE/CVM',
    metric: 'CpuUsage',
    instanceId: 'ins-abc',
    region: 'ap-guangzhou',
    range: '24h',
    period: 900,
    creds: { secretId: 'id', secretKey: 'key' },
    opts: { timeoutMs: 1000 },
  })
  assert.equal(calls[0].Period, 300)
})

test('fetchMetricSeries sends namespace/metric/window and maps data points', async () => {
  const calls: Array<{ action: string; payload: Record<string, unknown> }> = []
  const monitor = (async (action: string, payload: Record<string, unknown>) => {
    calls.push({ action, payload })
    return {
      MetricName: 'CpuUsage',
      DataPoints: [{ Timestamps: [1000, 1060, 1120], Values: [12.5, null, 30] }],
    }
  }) as unknown as TencentProductCall
  const series = await fetchMetricSeries(monitor, {
    namespace: 'QCE/CVM',
    metric: 'CpuUsage',
    instanceId: 'ins-abc',
    region: 'ap-guangzhou',
    range: '1h',
    creds,
    opts,
    nowMs: Date.parse('2026-08-29T12:07:33Z'),
  })
  assert.equal(calls.length, 1)
  const payload = calls[0].payload
  assert.equal(calls[0].action, 'GetMonitorData')
  assert.equal(payload.Namespace, 'QCE/CVM')
  assert.equal(payload.MetricName, 'CpuUsage')
  assert.equal(payload.Period, 60)
  assert.equal(payload.StartTime, '2026-08-29 11:05:00')
  assert.equal(payload.EndTime, '2026-08-29 12:05:00')
  assert.deepEqual(payload.Instances, [{ Dimensions: [{ Name: 'InstanceId', Value: 'ins-abc' }] }])
  assert.deepEqual(series, { metric: 'CpuUsage', timestamps: [1000, 1060, 1120], values: [12.5, null, 30] })
})

test('fetchMetricSeries returns empty arrays on empty data without throwing', async () => {
  const monitor = (async () => ({ MetricName: 'CpuUsage', DataPoints: [] })) as unknown as TencentProductCall
  const series = await fetchMetricSeries(monitor, {
    namespace: 'QCE/CDB',
    metric: 'CpuUseRate',
    instanceId: 'cdb-x',
    region: 'ap-guangzhou',
    creds,
    opts,
    nowMs: 0,
  })
  assert.deepEqual(series, { metric: 'CpuUseRate', timestamps: [], values: [] })
  const noPoints = (async () => ({})) as unknown as TencentProductCall
  const empty = await fetchMetricSeries(noPoints, {
    namespace: 'QCE/CDB',
    metric: 'QPS',
    instanceId: 'cdb-x',
    region: 'ap-guangzhou',
    creds,
    opts,
    nowMs: 0,
  })
  assert.deepEqual(empty.timestamps, [])
})

test('fetchMonitorSeries keeps per-metric failures isolated', async () => {
  const monitor = (async (_action: string, payload: { MetricName?: string }) => {
    if (payload.MetricName === 'MemUsage') throw new Error('AuthFailure')
    return {
      DataPoints: [{ Timestamps: [1, 2], Values: [10, 20] }],
    }
  }) as unknown as TencentProductCall
  const result = await fetchMonitorSeries(monitor, {
    namespace: 'QCE/CVM',
    metrics: HOST_METRICS.slice(0, 3),
    instanceId: 'ins-abc',
    region: 'ap-guangzhou',
    range: '6h',
    creds,
    opts,
    nowMs: Date.parse('2026-08-29T12:07:33Z'),
  })
  assert.equal(result.range, '6h')
  assert.equal(result.series.length, 3)
  assert.deepEqual(result.series[0].values, [10, 20])
  // 回填 key 与 MetricDef.key 对齐,前端 seriesMap 以 key 为键
  assert.deepEqual(result.series[1], { key: 'memory', metric: 'MemUsage', timestamps: [], values: [] })
  assert.equal(result.series[0].key, 'cpu')
  assert.equal(result.series[2].key, 'disk')
  assert.deepEqual(result.series[2].values, [10, 20])
  assert.equal(result.errors.length, 1)
  assert.ok(result.errors[0].length > 0)
})

test('classifyMetricError: 三类根因各归属正确', () => {
  // METRIC_NOT_FOUND:官方未暴露(unavailable 短路)
  assert.equal(classifyMetricError({ unavailable: 'x' }).errorType, 'METRIC_NOT_FOUND')
  // METRIC_NOT_FOUND:指标不存在/维度错误
  assert.equal(
    classifyMetricError({ error: new TencentApiError('metric not exist', 'InvalidParameterValue') }).errorType,
    'METRIC_NOT_FOUND',
  )
  assert.equal(
    classifyMetricError({ error: new TencentApiError('指标不存在') }).errorType,
    'METRIC_NOT_FOUND',
  )
  // AGENT_MISSING:依赖 agent 的指标返回空且无错误码
  assert.equal(classifyMetricError({ emptyPoints: true, requiresAgent: true }).errorType, 'AGENT_MISSING')
  // 优先级:agent 缺失 > 指标不存在(空点 + agent 依赖 + api 错 同时成立时)
  assert.equal(
    classifyMetricError({
      error: new TencentApiError('metric not exist', 'InvalidParameterValue'),
      emptyPoints: true,
      requiresAgent: true,
    }).errorType,
    'AGENT_MISSING',
  )
  // API_ERROR:带 code 的权限/限流错误,保留 code
  const denied = classifyMetricError({ error: new TencentApiError('no permission', 'AuthFailure') })
  assert.equal(denied.errorType, 'API_ERROR')
  assert.equal(denied.code, 'AuthFailure')
  const limited = classifyMetricError({ error: new TencentApiError('too many', 'RequestLimitExceeded') })
  assert.equal(limited.errorType, 'API_ERROR')
  assert.equal(limited.code, 'RequestLimitExceeded')
  // 空点但不依赖 agent:归 METRIC_NOT_FOUND
  assert.equal(classifyMetricError({ emptyPoints: true }).errorType, 'METRIC_NOT_FOUND')
  // 关机实例即使云监控用错误码表达无数据，也不能误判成 agent 缺失
  assert.equal(
    classifyMetricError({
      error: new TencentApiError('metric unavailable', 'InvalidParameterValue'),
      emptyPoints: true,
      requiresAgent: true,
      instanceRunning: false,
    }).errorType,
    'INSTANCE_NOT_RUNNING',
  )
})

test('fetchMonitorSeries: 关机实例的云监控错误收敛为整体未运行提示', async () => {
  const monitor = (async () => {
    throw new TencentApiError('metric unavailable', 'InvalidParameterValue')
  }) as unknown as TencentProductCall
  const result = await fetchMonitorSeries(monitor, {
    namespace: 'QCE/CVM',
    metrics: HOST_METRICS.slice(0, 3),
    instanceId: 'ins-stopped',
    region: 'ap-guangzhou',
    creds,
    opts,
    instanceRunning: false,
  })
  assert.equal(result.notRunning, true)
  assert.deepEqual(result.errors, [])
  assert.deepEqual(result.metricErrors, [])
  assert.ok(result.series.every((row) => row.timestamps.length === 0))
})

test('fetchMonitorSeries: unavailable 指标不发起请求且归类 METRIC_NOT_FOUND', async () => {
  const requested: string[] = []
  const monitor = (async (_action: string, payload: { MetricName?: string }) => {
    requested.push(String(payload.MetricName || ''))
    return { DataPoints: [{ Timestamps: [1], Values: [1] }] }
  }) as unknown as TencentProductCall
  // 用临时构造的 unavailable 指标验证通用分支(CVM/LIGHTHOUSE 内置指标集已不再使用 unavailable)
  const metrics = [
    { key: 'cpu', metricName: 'CpuUsage', label: 'CPU', unit: '%', color: '#000' },
    { key: 'futurePlaceholder', metricName: 'FutureMetric', label: '占位', unit: '-', color: '#000', unavailable: '官方暂未提供该指标' },
  ]
  const result = await fetchMonitorSeries(monitor, {
    namespace: 'QCE/CVM',
    metrics,
    instanceId: 'ins-abc',
    region: 'ap-guangzhou',
    creds,
    opts,
    nowMs: 0,
  })
  // unavailable 指标不发起 GetMonitorData
  assert.deepEqual(requested, ['CpuUsage'])
  const notFound = result.metricErrors.filter((row) => row.errorType === 'METRIC_NOT_FOUND')
  assert.equal(notFound.length, 1)
  assert.equal(notFound[0].key, 'futurePlaceholder')
  assert.equal(notFound[0].message, '官方暂未提供该指标')
  // series 长度与指标集一致,失败项为空序列但仍在列表中(不拖垮其它图)
  assert.equal(result.series.length, metrics.length)
  assert.equal(result.series.find((row) => row.key === 'futurePlaceholder')?.timestamps.length, 0)
  assert.ok(result.series.find((row) => row.key === 'cpu')?.timestamps.length)
  // 兼容契约:errors(string[]) 与 metricErrors 一一对应
  assert.equal(result.errors.length, result.metricErrors.length)
})

test('内置指标集不含主机级磁盘 IOPS 条目(CVM 与 LIGHTHOUSE)', async () => {
  for (const metrics of [HOST_METRICS, LIGHTHOUSE_METRICS]) {
    assert.ok(!metrics.some((row) => row.key === 'diskRead' || row.key === 'diskWrite'))
    assert.ok(!metrics.some((row) => /Iops/i.test(row.metricName)))
  }
  const requested: string[] = []
  const monitor = (async (_action: string, payload: { MetricName?: string }) => {
    requested.push(String(payload.MetricName || ''))
    return { DataPoints: [{ Timestamps: [1], Values: [1] }] }
  }) as unknown as TencentProductCall
  const result = await fetchMonitorSeries(monitor, {
    namespace: 'QCE/CVM',
    metrics: HOST_METRICS,
    instanceId: 'ins-abc',
    region: 'ap-guangzhou',
    creds,
    opts,
    nowMs: 0,
  })
  // 全部指标均发起真实请求,无磁盘 IOPS
  assert.equal(requested.length, HOST_METRICS.length)
  assert.ok(!requested.some((name) => /Iops/i.test(name)))
  assert.equal(result.metricErrors.length, 0)
})

test('fetchMonitorSeries: agent 依赖指标空点归 AGENT_MISSING,API 错归 API_ERROR(混合场景)', async () => {
  const monitor = (async (_action: string, payload: { MetricName?: string }) => {
    const name = String(payload.MetricName || '')
    if (name === 'MemUsage') return { DataPoints: [] } // 空点 + requiresAgent → AGENT_MISSING
    if (name === 'LanIntraffic') throw new TencentApiError('no permission', 'AuthFailure') // → API_ERROR
    return { DataPoints: [{ Timestamps: [1], Values: [2] }] }
  }) as unknown as TencentProductCall
  const metrics = [
    { key: 'cpu', metricName: 'CpuUsage', label: 'CPU', unit: '%', color: '#000' },
    { key: 'memory', metricName: 'MemUsage', label: '内存', unit: '%', color: '#000', requiresAgent: true },
    { key: 'lanIn', metricName: 'LanIntraffic', label: '内网入', unit: 'Mbps', color: '#000' },
  ]
  const result = await fetchMonitorSeries(monitor, {
    namespace: 'QCE/CVM',
    metrics,
    instanceId: 'ins-x',
    region: 'ap-guangzhou',
    creds,
    opts,
    nowMs: 0,
  })
  assert.equal(result.series.length, 3)
  const byKey = new Map(result.metricErrors.map((row) => [row.key, row]))
  assert.equal(byKey.get('memory')?.errorType, 'AGENT_MISSING')
  assert.ok(byKey.get('memory')?.suggestion?.includes('监控组件'))
  assert.equal(byKey.get('lanIn')?.errorType, 'API_ERROR')
  assert.equal(byKey.get('lanIn')?.code, 'AuthFailure')
  assert.equal(byKey.has('cpu'), false)
  // 混合失败下 healthy 指标不受影响
  assert.deepEqual(result.series.find((row) => row.key === 'cpu')?.values, [2])
})

test('LIGHTHOUSE 与 CVM 指标集均未使用 unavailable 占位(内置集无 IOPS)', () => {
  assert.ok(!LIGHTHOUSE_METRICS.some((row) => row.unavailable))
  assert.ok(!HOST_METRICS.some((row) => row.unavailable))
  // 内存/磁盘依赖实例内监控组件
  assert.ok(LIGHTHOUSE_METRICS.find((row) => row.key === 'memory')?.requiresAgent)
  assert.ok(LIGHTHOUSE_METRICS.find((row) => row.key === 'disk')?.requiresAgent)
  assert.ok(HOST_METRICS.find((row) => row.key === 'memory')?.requiresAgent)
  assert.ok(HOST_METRICS.find((row) => row.key === 'disk')?.requiresAgent)
})
