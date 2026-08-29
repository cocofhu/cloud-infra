// 单实例 / 单指标的监控拉取验证入口。
// 用法(先 npm run build 生成 lib/):
//   TENCENT_SECRET_ID=xxx TENCENT_SECRET_KEY=yyy \
//   node scripts/monitor-probe.mjs --product cvm --region ap-guangzhou --instance ins-abc12 [--range 1h] [--metric CpuUsage]
// 对给定实例并发拉取该产品的指标集(或 --metric 指定单项),
// 逐项打印 errorType 与上游 code,便于复现「部分指标拉取失败」类问题的根因。
import { HOST_METRICS, LIGHTHOUSE_METRICS, fetchMonitorSeries } from '../lib/providers/tencent/products/instance-common.js'
import { monitorCall } from '../lib/providers/tencent/client.js'

function arg(name, fallback = '') {
  const idx = process.argv.indexOf(`--${name}`)
  return idx >= 0 ? String(process.argv[idx + 1] || '') : fallback
}

const product = arg('product', 'cvm').toLowerCase()
const region = arg('region')
const instanceId = arg('instance')
const range = arg('range', '1h')
const onlyMetric = arg('metric')

if (!region || !instanceId) {
  console.error('缺少 --region 或 --instance')
  process.exit(2)
}
const creds = {
  secretId: process.env.TENCENT_SECRET_ID || '',
  secretKey: process.env.TENCENT_SECRET_KEY || '',
}
if (!creds.secretId || !creds.secretKey) {
  console.error('缺少 TENCENT_SECRET_ID / TENCENT_SECRET_KEY 环境变量')
  process.exit(2)
}

const catalog = product === 'lighthouse'
  ? { namespace: 'QCE/LIGHTHOUSE', metrics: LIGHTHOUSE_METRICS }
  : { namespace: 'QCE/CVM', metrics: HOST_METRICS }
const metrics = onlyMetric
  ? catalog.metrics.filter((row) => row.metricName === onlyMetric || row.key === onlyMetric)
  : catalog.metrics
if (!metrics.length) {
  console.error(`指标 ${onlyMetric} 不在 ${product} 指标集内`)
  process.exit(2)
}

const result = await fetchMonitorSeries(monitorCall, {
  namespace: catalog.namespace,
  metrics,
  instanceId,
  region,
  range,
  creds,
  opts: { timeoutMs: 15000 },
})

console.log(JSON.stringify({
  product,
  namespace: catalog.namespace,
  region,
  instanceId,
  range: result.range,
  probes: metrics.map((metric) => {
    const series = result.series.find((row) => row.key === metric.key)
    const error = result.metricErrors.find((row) => row.key === metric.key)
    return {
      key: metric.key,
      metric: metric.metricName,
      requiresAgent: !!metric.requiresAgent,
      unavailable: metric.unavailable || null,
      points: series ? series.timestamps.length : 0,
      errorType: error ? error.errorType : null,
      code: error && error.code ? error.code : null,
      message: error && error.message ? error.message : null,
    }
  }),
}, null, 2))
