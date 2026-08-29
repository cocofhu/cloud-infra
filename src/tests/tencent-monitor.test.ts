import assert from 'node:assert/strict'
import test from 'node:test'
import type { TencentProductCall } from '../providers/tencent/client.js'
import {
  HOST_METRICS,
  MONITOR_RANGE_PERIOD,
  fetchMetricSeries,
  fetchMonitorSeries,
  monitorWindow,
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
  assert.equal(h24.period, 900)
  assert.equal(h24.startTime, '2026-08-28 12:05:00')
  const fallback = monitorWindow(undefined, now)
  assert.equal(fallback.period, 60)
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
