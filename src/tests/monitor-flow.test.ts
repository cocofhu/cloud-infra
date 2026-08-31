import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { TencentProductCall } from '../providers/tencent/client.js'
import { createCdbModule, CDB_MONITOR_METRICS } from '../providers/tencent/products/cdb.js'
import { HOST_METRICS, LIGHTHOUSE_METRICS } from '../providers/tencent/products/instance-common.js'

const dir = dirname(fileURLToPath(import.meta.url))
const root = join(dir, '../..')
const require = createRequire(import.meta.url)

/**
 * 数据流契约测试:provider 返回的 series 与前端 MonitorPanel 之间的键契约。
 * 评审 v1 回归用例:series[].metric 是腾讯云 metricName,若前端按 MetricDef.key 查表会出现整体空态。
 * 此处模拟真实链路:mock monitorCall → detail(实例监控) → 用 lib/client.js 暴露的
 * buildMonitorSeriesMap 构造 seriesMap → 断言每个指标 key 都能拿到序列,并用 react-dom/server
 * 渲染 MonitorPanel 确认不出现整体空态(渲染出图表网格)。
 */

interface MonitorTabData {
  range?: string
  metrics?: Array<{ key: string; metricName: string; label: string; unit: string; color: string }>
  series?: Array<{ key?: string; metric: string; timestamps: number[]; values: Array<number | null> }>
  cpu?: string
  note?: string
}

// 通过 __ModuleLoader__ 捕获 factory,拿到客户端内部组件做契约验证
let moduleLoadSeq = 0
async function loadClientInternals(): Promise<{
  buildMonitorSeriesMap: (metrics: unknown, series: unknown) => Record<string, { timestamps?: number[]; values?: Array<number | null> }>
  MonitorPanel: (props: unknown) => unknown
  MonitorChart: (props: unknown) => unknown
}> {
  interface ModuleDef { id: string; factory: (req: (name: string) => unknown) => Record<string, unknown> }
  let captured: ModuleDef | undefined
  const w = globalThis as { window?: unknown }
  const prevWindow = w.window
  w.window = {
    addEventListener() {},
    removeEventListener() {},
    __ModuleLoader__: {
      load(def: ModuleDef) { captured = def },
    },
  }
  try {
    const url = pathToFileURL(join(root, 'lib/client.js')).href + `?t=${process.pid}-${++moduleLoadSeq}`
    await import(url)
  } finally {
    w.window = prevWindow
  }
  assert.ok(captured, 'lib/client.js 应调用 window.__ModuleLoader__.load')
  const assertCaptured: ModuleDef = captured
  const react = require('react')
  const fakeRequire = (name: string) => (name === 'react' ? react : require(name))
  const api = assertCaptured.factory(fakeRequire)
  const internals = api.__monitorInternals as {
    buildMonitorSeriesMap?: unknown
    MonitorPanel?: unknown
    MonitorChart?: unknown
  }
  assert.ok(typeof internals.buildMonitorSeriesMap === 'function', 'factory 应暴露 __monitorInternals.buildMonitorSeriesMap')
  assert.ok(typeof internals.MonitorPanel === 'function', 'factory 应暴露 __monitorInternals.MonitorPanel')
  return internals as never
}

function cdbCtx(over: Record<string, unknown> = {}) {
  return {
    id: 'tencent.cdb:ap-guangzhou:cdb-flow',
    region: 'ap-guangzhou',
    timeoutMs: 5000,
    creds: { secretId: 'AKIDTEST', secretKey: 'SKTEST' },
    settings: {},
    tab: '实例监控',
    ...over,
  } as never
}

async function fetchCdbMonitorTab(): Promise<MonitorTabData> {
  const call = async (action: string) => {
    if (action === 'DescribeDBInstances') {
      return {
        Items: [{
          InstanceId: 'cdb-flow',
          InstanceName: 'flow-mock',
          Region: 'ap-guangzhou',
          Status: 1,
          EngineVersion: '8.0',
          Memory: 2000,
          Volume: 100,
          Vip: '10.0.0.8',
          Vport: 3306,
          WanStatus: 0,
          CreateTime: '2026-08-29 10:00:00',
          DeadlineTime: '2027-08-29 10:00:00',
          PayType: 1,
        }],
      }
    }
    return {}
  }
  // 模拟云监控:每个指标都回 3 个点的有效序列
  const monitor = (async (_action: string, payload: { MetricName?: string }) => ({
    MetricName: payload.MetricName,
    DataPoints: [{ Timestamps: [1000, 1060, 1120], Values: [11, 12.5, 13] }],
  })) as unknown as TencentProductCall
  const mod = createCdbModule(call as never, {
    async ping() {},
    async query() { return { columns: [], rows: [] } },
  }, monitor)
  const detail = await mod.detail?.(cdbCtx())
  const data = (detail?.extra as { tabData?: MonitorTabData }).tabData
  assert.ok(data, 'detail(实例监控) 应返回 tabData')
  return data as MonitorTabData
}

test('contract: CDB provider series keys align with MetricDef.key (v1 回归)', async () => {
  const data = await fetchCdbMonitorTab()
  assert.equal(data.metrics?.length, CDB_MONITOR_METRICS.length)
  assert.equal(data.series?.length, CDB_MONITOR_METRICS.length)
  // 后端必须回填 key,且与指标定义一一对应
  const metrics = data.metrics || []
  for (const row of data.series || []) {
    const def = metrics.find((m) => m.key === row.key)
    assert.ok(def, `series.key=${row.key} 必须在 metrics 中存在`)
    assert.equal(row.metric, def?.metricName, 'series.metric 必须是腾讯云 metricName')
  }
})

test('contract: buildMonitorSeriesMap 以 key 为键,MonitorPanel 不为空态且每个图有序列 (v1+v4)', async () => {
  const data = await fetchCdbMonitorTab()
  const { buildMonitorSeriesMap, MonitorPanel, MonitorChart } = await loadClientInternals()
  const seriesMap = buildMonitorSeriesMap(data.metrics, data.series)
  // 与 MonitorPanel 完全相同的 empty 判定:全部指标 timestamps 为空才判空
  const empty = (data.metrics || []).every((m) => {
    const s = seriesMap[m.key]
    return !s || !Array.isArray(s.timestamps) || !s.timestamps.length
  })
  assert.equal(empty, false, '真实数据流下 MonitorPanel 不应出现整体空态')
  for (const m of data.metrics || []) {
    const s = seriesMap[m.key]
    assert.ok(s, `seriesMap[${m.key}] 应能取到序列`)
    assert.deepEqual(s.timestamps || [], [1000, 1060, 1120], `seriesMap[${m.key}].timestamps 应透传`)
    assert.deepEqual(s.values || [], [11, 12.5, 13])
  }

  // 真正的组件级渲染:react-dom/server 渲染 MonitorPanel,断言出现图表网格而不是空态文案
  // 注:react 是 peerDependency,这里不走类型导入,直接以 any 使用
  const React = require('react') as { createElement: (...args: unknown[]) => unknown }
  const { renderToStaticMarkup } = require('react-dom/server') as { renderToStaticMarkup: (node: unknown) => string }
  const html = renderToStaticMarkup(React.createElement(MonitorPanel as never, {
    metrics: data.metrics,
    seriesMap,
    range: '1h',
    onRangeChange: () => {},
    note: '',
  } as never))
  assert.match(html, /ci-monitor-grid/, '有数据时应渲染图表网格')
  assert.match(html, /ci-monitor-chart/, '每个指标应渲染一张图')
  const chartCount = html.split('ci-monitor-chart-box').length - 1
  assert.equal(chartCount, CDB_MONITOR_METRICS.length, '每个指标一张图')
  assert.doesNotMatch(html, />暂无监控数据</, '有数据时不应渲染空态占位(图表内空 GPU 画布不算)')
  // 切换时间档按钮存在
  assert.ok(html.includes('1小时') && html.includes('6小时') && html.includes('24小时'))
})

test('contract: MonitorChart 无序列时渲染单图空态而非崩溃 (v4)', async () => {
  const { buildMonitorSeriesMap, MonitorPanel } = await loadClientInternals()
  const React = require('react') as { createElement: (...args: unknown[]) => unknown }
  const { renderToStaticMarkup } = require('react-dom/server') as { renderToStaticMarkup: (node: unknown) => string }
  // 全空序列 → MonitorPanel 整体空态文案
  const allEmpty = (HOST_METRICS || []).map((m) => ({ key: m.key, metric: m.metricName, timestamps: [], values: [] }))
  const map = buildMonitorSeriesMap(HOST_METRICS, allEmpty)
  const html = renderToStaticMarkup(React.createElement(MonitorPanel as never, {
    metrics: HOST_METRICS,
    seriesMap: map,
    range: '6h',
    onRangeChange: () => {},
    note: '',
  } as never))
  assert.match(html, /暂无监控数据/, '全空序列应渲染整体空态提示')
  assert.doesNotMatch(html, /ci-monitor-grid/, '空态不应渲染网格')
})

test('contract: CVM 与 LIGHTHOUSE 指标表命名空间正确 (v3 回归)', () => {
  // CVM:磁盘使用率为 CvmDiskUsage、CPU 为 CpuUsage、内存为 MemUsage
  assert.equal(HOST_METRICS.find((m) => m.key === 'disk')?.metricName, 'CvmDiskUsage')
  assert.equal(HOST_METRICS.find((m) => m.key === 'cpu')?.metricName, 'CpuUsage')
  assert.equal(HOST_METRICS.find((m) => m.key === 'memory')?.metricName, 'MemUsage')
  // LIGHTHOUSE(官方 248/60127):磁盘为 DiskUsage、CPU 为 CpuUsage、内存为 MemUsage
  // 该命名空间没有 CPUUsage / MemoryUsage,写错会被云监控判为 InvalidParameterValue
  assert.equal(LIGHTHOUSE_METRICS.find((m) => m.key === 'disk')?.metricName, 'DiskUsage')
  assert.equal(LIGHTHOUSE_METRICS.find((m) => m.key === 'cpu')?.metricName, 'CpuUsage')
  assert.equal(LIGHTHOUSE_METRICS.find((m) => m.key === 'memory')?.metricName, 'MemUsage')
  assert.ok(
    !LIGHTHOUSE_METRICS.some((m) => m.metricName === 'MemoryUsage' || m.metricName === 'CPUUsage'),
    'Lighthouse 指标表不得使用 QCE/LIGHTHOUSE 不存在的 MemoryUsage / CPUUsage',
  )
  assert.ok(
    LIGHTHOUSE_METRICS.every((m) => !m.metricName.startsWith('Cvm')),
    'Lighthouse 指标表不得出现 Cvm* 前缀指标名',
  )
})

test('contract: MonitorPanel 渲染指标级错误清单与卡内不可用说明', async () => {
  const { buildMonitorSeriesMap, MonitorPanel } = await loadClientInternals()
  const React = require('react') as { createElement: (...args: unknown[]) => unknown }
  const { renderToStaticMarkup } = require('react-dom/server') as { renderToStaticMarkup: (node: unknown) => string }
  // 指标集已不再含磁盘 IOPS 的 unavailable 占位
  assert.ok(!HOST_METRICS.some((m) => m.key === 'diskRead' || m.key === 'diskWrite'))
  // 在指标集末尾附带一个 unavailable 占位指标,验证 perChartNote 通用分支仍可渲染说明
  const placeholder = { key: 'futurePlaceholder', metricName: 'FutureMetric', label: '未来占位', unit: '-', color: '#000', unavailable: '官方暂未提供该指标' }
  const metrics = [...HOST_METRICS, placeholder]
  // 有数据指标 + METRIC_NOT_FOUND 真实接口错 + agent 缺失指标 的混合场景
  const series = metrics.map((m) => ({
    key: m.key,
    metric: m.metricName,
    timestamps: m.key === 'cpu' ? [1000, 1060] : [],
    values: m.key === 'cpu' ? [12, 13] : [],
  }))
  const errors = [
    { key: 'lanIn', metric: 'LanIntraffic', errorType: 'METRIC_NOT_FOUND', message: '云监控返回内网入带宽指标不存在', suggestion: '云监控未提供该指标' },
    { key: 'memory', metric: 'MemUsage', errorType: 'AGENT_MISSING', suggestion: '请到控制台安装或启动监控组件(barad_agent)后重试' },
  ]
  const html = renderToStaticMarkup(React.createElement(MonitorPanel as never, {
    metrics,
    seriesMap: buildMonitorSeriesMap(metrics, series),
    range: '1h',
    onRangeChange: () => {},
    note: `部分指标拉取失败（${errors.length} 项）`,
    errors,
  } as never))
  assert.match(html, /ci-monitor-errs/, '应渲染指标级错误清单容器')
  assert.match(html, /指标不可用/, 'METRIC_NOT_FOUND 应显示中文标签')
  assert.match(html, /监控组件未安装/, 'AGENT_MISSING 应显示中文标签')
  assert.match(html, /云监控返回内网入带宽指标不存在/, '应展示具体失败项与原因')
  assert.match(html, /barad_agent/, '组件未装类文案应含可操作引导')
  // 不可用指标卡内应显示说明而非笼统「暂无监控数据」(perChartNote 通用分支)
  assert.match(html, /官方暂未提供该指标/, 'unavailable 指标卡内应渲染说明')
})
