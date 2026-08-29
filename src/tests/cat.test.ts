import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { TencentApiError } from '../providers/tencent/client.js'
import {
  catCardId,
  catPublicError,
  createCatModule,
  defaultParameters,
  intervalLabel,
  mapProbeTask,
  mapTaskStatus,
  mergeParameters,
  paramFieldsFromJson,
  parseCatRef,
  resolveCatScope,
  taskTypeLabel,
  type ProbeTaskItem,
} from '../providers/tencent/products/cat.js'

const dir = dirname(fileURLToPath(import.meta.url))
const root = join(dir, '../..')
const read = (rel: string) => readFileSync(join(root, rel), 'utf8')

const sampleTask = (): ProbeTaskItem => ({
  Name: '官网首页拨测',
  TaskId: 'task-n1wchki8',
  TaskType: 1,
  Status: 2,
  TargetAddress: 'https://example.com',
  Interval: 5,
  Nodes: ['10001', '10002'],
  NodeIpType: 0,
  PayMode: 1,
  Cron: '',
  Parameters: JSON.stringify({ ipType: 0, grabBag: 0, navCustomHost: 1, navCustomHostIp: '' }),
})

function fakeCat(calls: Array<{ action: string; payload: unknown }>, overrides: Record<string, unknown> = {}) {
  return async (action: string, payload: unknown) => {
    calls.push({ action, payload })
    if (overrides[action] !== undefined) {
      const value = overrides[action]
      if (typeof value === 'function') return (value as (p: unknown) => unknown)(payload)
      if (value instanceof Error) throw value
      return value
    }
    if (action === 'DescribeProbeTasks') {
      return { TaskSet: [sampleTask()], Total: 1 }
    }
    if (action === 'DescribeNodes') {
      return {
        NodeSet: [
          { Code: '10001', Name: '北京', City: '北京', NetService: '电信', Type: 1 },
          { Code: '10002', Name: '上海', City: '上海', NetService: '联通', Type: 2 },
        ],
      }
    }
    if (action === 'DescribeInstantTasks') {
      return {
        Tasks: [{
          TaskId: 'inst-1',
          TargetAddress: 'www.test.com',
          TaskType: 5,
          ProbeTime: 1641917822000,
          Status: '1',
          SuccessRate: 100,
          NodeCount: 1,
        }],
        Total: 1,
      }
    }
    if (action === 'DescribeProbeMetricData') return { MetricSet: '[]' }
    if (action === 'DescribeProbeMetricTagValues') return { TagValueSet: '[]' }
    if (action === 'DescribeDetailedSingleProbeData') return { DataSet: [], TotalNumber: 0 }
    if (action === 'CreateProbeTasks') return { TaskIDs: ['task-new'] }
    if (action === 'UpdateProbeTaskConfigurationList') return {}
    if (action === 'UpdateProbeTaskAttributes') return {}
    if (action === 'SuspendProbeTask' || action === 'ResumeProbeTask' || action === 'DeleteProbeTask') {
      return { Total: 1, SuccessCount: 1, Results: [{ TaskId: 'task-n1wchki8', Success: true }] }
    }
    return {}
  }
}

function fakeMonitor(calls: Array<{ action: string; payload: unknown }>, overrides: Record<string, unknown> = {}) {
  return async (action: string, payload: unknown) => {
    calls.push({ action, payload })
    if (overrides[action] !== undefined) {
      const value = overrides[action]
      if (value instanceof Error) throw value
      return value
    }
    if (action === 'DescribeAlarmPolicies') {
      return {
        Policies: [{
          PolicyId: 'policy-1',
          PolicyName: '首页可用性',
          Namespace: 'cat',
          Enable: 1,
          Remark: 'taskId=task-n1wchki8',
          Condition: { Rules: [{ MetricName: 'Availability', Operator: 'lt', Value: '99' }] },
        }],
        TotalCount: 1,
      }
    }
    if (action === 'DescribeAlarmHistories') {
      return { Histories: [{ AlarmId: 'a1', AlarmStatus: 'ALARM', FirstOccurTime: '2026-01-01 00:00:00', Content: '可用性 < 99' }] }
    }
    if (action === 'CreateAlarmPolicy') return { PolicyId: 'policy-new' }
    return {}
  }
}

const ctx = {
  creds: { secretId: 'id', secretKey: 'key' },
  query: '',
  offset: 0,
  limit: 12,
  timeoutMs: 5000,
}

test('g1.1 mapProbeTask and parseCatRef cover CAT task ids', () => {
  const card = mapProbeTask(sampleTask(), { 10001: '北京电信 IDC', 10002: '上海联通 LastMile' })
  assert.equal(card.id, 'tencent.cat:task:task-n1wchki8')
  assert.equal(card.kind, 'cat')
  assert.equal(card.openLabel, '配置')
  assert.equal(card.status, 'enable')
  assert.deepEqual(card.columns?.map((col) => col.label), ['任务类型', '拨测地址', '拨测频率', '拨测点'])
  assert.equal(card.columns?.[2].value, '5分钟')
  assert.match(card.columns?.[3].value || '', /北京电信 IDC/)
  assert.deepEqual(parseCatRef(card.id), { moduleId: 'tencent.cat', scope: 'task', ref: 'task-n1wchki8' })
  assert.equal(catCardId('instant', 'inst-1'), 'tencent.cat:instant:inst-1')
  assert.equal(mapTaskStatus(6), 'pause')
  assert.equal(taskTypeLabel(5), '网络质量')
  assert.equal(intervalLabel(240), '4小时')
})

test('g1.1 createCatModule list talks DescribeProbeTasks and DescribeNodes', async () => {
  const calls: Array<{ action: string; payload: unknown }> = []
  const module = createCatModule(fakeCat(calls) as never, fakeMonitor([]) as never)
  const listed = await module.list({ ...ctx, kind: 'cat' })
  assert.equal(listed.items[0].title, '官网首页拨测')
  assert.equal(listed.total, 1)
  assert.equal(calls[0].action, 'DescribeProbeTasks')
  assert.equal(calls.some((row) => row.action === 'DescribeNodes'), true)
  assert.equal(module.id, 'tencent.cat')
})

test('g1.2 list columns and create/update send three-block six-type params', async () => {
  const calls: Array<{ action: string; payload: unknown }> = []
  const module = createCatModule(fakeCat(calls) as never, fakeMonitor([]) as never)
  const create = module.actions?.find((item) => item.id === 'task.create')
  const groups = new Set((create?.fields || []).map((field) => field.group))
  assert.ok(groups.has('基本信息'))
  assert.ok(groups.has('拨测点'))
  assert.ok((create?.fields || []).some((field) => field.label === '拨测频率' && field.options?.some((opt) => opt.label === '5分钟')))
  assert.ok((create?.fields || []).some((field) => field.label === '点类型' && field.options?.some((opt) => opt.label === 'IDC')))
  for (const group of ['拨测参数 · 页面性能', '拨测参数 · 文件上传', '拨测参数 · 文件下载', '拨测参数 · 端口性能', '拨测参数 · 网络质量', '拨测参数 · 音视频']) {
    assert.ok(groups.has(group), group)
  }
  const created = await module.execute?.('task.create', {
    probeKind: 'custom',
    taskType: '1',
    name: '官网首页拨测',
    targetAddress: 'https://example.com',
    interval: '5',
    nodeSelect: 'custom',
    nodes: '10001,10002',
    navCustomHost: '1',
    grabBag: '0',
  }, ctx)
  assert.equal(created?.ok, true)
  const createCall = calls.find((row) => row.action === 'CreateProbeTasks')
  const payload = createCall?.payload as { TaskType?: number; Interval?: number; Parameters?: string; BatchTasks?: Array<{ Name?: string }> }
  assert.equal(payload.TaskType, 1)
  assert.equal(payload.Interval, 5)
  assert.match(payload.Parameters || '', /navCustomHost/)
  assert.equal(payload.BatchTasks?.[0].Name, '官网首页拨测')

  const updated = await module.execute?.('task.update', {
    taskId: 'task-n1wchki8',
    name: '官网首页拨测',
    interval: '15',
    nodes: '10001',
    grabBag: '0',
  }, { ...ctx, id: 'tencent.cat:task:task-n1wchki8' })
  assert.equal(updated?.ok, true)
  assert.equal(calls.some((row) => row.action === 'UpdateProbeTaskConfigurationList'), true)
})

test('g1.2 six task types emit console-named parameter rows', () => {
  for (const type of [1, 2, 3, 4, 5, 6]) {
    const raw = mergeParameters(type, {})
    const fields = paramFieldsFromJson(type, raw)
    assert.ok(fields.length >= 3, `type ${type}`)
    assert.ok(fields.every((row) => row.label && !/^[a-z]+$/.test(row.label)))
    assert.ok(Object.keys(defaultParameters(type)).includes('ipType'))
  }
  const net = paramFieldsFromJson(5, mergeParameters(5, { netIcmpOn: '1', grabBag: '0' }))
  assert.ok(net.some((row) => row.label === '启用 Ping' && row.value === '启用'))
  assert.ok(net.some((row) => row.label === '抓包' && row.value === '关闭'))
})

test('g1.3 suspend resume delete and batch confirm=always, execute only hits cloud', async () => {
  const calls: Array<{ action: string; payload: unknown }> = []
  const module = createCatModule(fakeCat(calls) as never, fakeMonitor([]) as never)
  assert.equal(module.actions?.find((item) => item.id === 'task.delete')?.confirm, 'always')
  assert.equal(module.actions?.find((item) => item.id === 'task.batchSuspend')?.confirm, 'always')
  const paused = await module.execute?.('task.suspend', { taskId: 'task-n1wchki8' }, { ...ctx, id: 'tencent.cat:task:task-n1wchki8' })
  assert.equal(paused?.ok, true)
  const resumed = await module.execute?.('task.resume', { taskIds: ['task-n1wchki8'] }, ctx)
  assert.equal(resumed?.ok, true)
  const deleted = await module.execute?.('task.delete', {}, { ...ctx, id: 'tencent.cat:task:task-n1wchki8' })
  assert.equal(deleted?.ok, true)
  const batched = await module.execute?.('task.batchSuspend', { taskIds: ['task-n1wchki8', 'task-other'] }, ctx)
  assert.equal(batched?.ok, true)
  assert.deepEqual(calls.filter((row) => row.action === 'SuspendProbeTask').map((row) => (row.payload as { TaskIds: string[] }).TaskIds), [
    ['task-n1wchki8'],
    ['task-n1wchki8', 'task-other'],
  ])
  assert.equal(calls.some((row) => /config|overlay|writeOverlay/i.test(row.action)), false)
})

test('g1.3 status not allowed returns readable reason', async () => {
  const calls: Array<{ action: string; payload: unknown }> = []
  const module = createCatModule(fakeCat(calls, {
    SuspendProbeTask: { Results: [{ TaskId: 'task-n1wchki8', Success: false, ErrorMessage: '当前状态不允许暂停' }] },
  }) as never, fakeMonitor([]) as never)
  const result = await module.execute?.('task.suspend', { taskId: 'task-n1wchki8' }, ctx)
  assert.equal(result?.ok, false)
  if (result && !result.ok) assert.match(result.error, /不允许暂停/)
})

test('g2.1 instant create five types and history list/detail', async () => {
  const calls: Array<{ action: string; payload: unknown }> = []
  const module = createCatModule(fakeCat(calls) as never, fakeMonitor([]) as never)
  assert.equal(resolveCatScope('cat.instant', ''), 'instant')
  const listed = await module.list({ ...ctx, kind: 'cat.instant', query: '即时拨测' })
  assert.equal(listed.items[0].kind, 'cat.instant')
  assert.equal(listed.items[0].openLabel, '诊断')
  assert.equal(calls.some((row) => row.action === 'DescribeInstantTasks'), true)
  const detail = await module.detail?.({ ...ctx, id: 'tencent.cat:instant:inst-1', title: 'www.test.com' })
  assert.ok(detail?.sections?.some((sec) => sec.title === '历史诊断'))
  const started = await module.execute?.('instant.create', {
    taskType: '5',
    targetAddress: 'www.test.com',
    nodes: '10001',
  }, ctx)
  assert.equal(started?.ok, true)
  const createCall = calls.find((row) => row.action === 'CreateProbeTasks' && (row.payload as { ProbeType?: number }).ProbeType === 1)
  assert.ok(createCall)
  const rejected = await module.execute?.('instant.create', { taskType: '2', targetAddress: 'x', nodes: '10001' }, ctx)
  assert.equal(rejected?.ok, false)
  if (rejected && !rejected.ok) assert.match(rejected.error, /即时拨测仅支持/)
})

test('g2.2 analysis empty data stays readable and loads metric/tag/log APIs', async () => {
  const calls: Array<{ action: string; payload: unknown }> = []
  const module = createCatModule(fakeCat(calls) as never, fakeMonitor([]) as never)
  const detail = await module.detail?.({ ...ctx, id: 'tencent.cat:task:task-n1wchki8', title: '官网首页拨测' })
  const analysis = detail?.sections?.find((sec) => sec.title === '多维分析')
  assert.ok(analysis)
  assert.match(analysis?.hint || '', /尚未产生分析数据|确认任务已运行/)
  assert.equal(calls.some((row) => row.action === 'DescribeProbeMetricData'), true)
  assert.equal(calls.some((row) => row.action === 'DescribeProbeMetricTagValues'), true)
  assert.equal(calls.some((row) => row.action === 'DescribeDetailedSingleProbeData'), true)
  assert.equal(detail?.records, undefined)
})

test('g2.3 alarm list create history and not-opened hint', async () => {
  const calls: Array<{ action: string; payload: unknown }> = []
  const module = createCatModule(fakeCat([]) as never, fakeMonitor(calls) as never)
  const listed = await module.list({ ...ctx, kind: 'cat.alarm', query: '告警配置' })
  assert.equal(listed.items[0].title, '首页可用性')
  assert.equal(listed.items[0].openLabel, '历史')
  const detail = await module.detail?.({ ...ctx, id: 'tencent.cat:alarm:policy-1' })
  assert.ok(detail?.sections?.some((sec) => sec.title === '告警历史'))
  const created = await module.execute?.('alarm.create', {
    name: '首页可用性',
    taskId: 'task-n1wchki8',
    metric: 'availability',
    operator: 'lt',
    threshold: '99',
  }, ctx)
  assert.equal(created?.ok, true)
  assert.equal(calls.some((row) => row.action === 'CreateAlarmPolicy'), true)

  const closed = createCatModule(fakeCat([]) as never, fakeMonitor([], {
    DescribeAlarmPolicies: new TencentApiError('product not activated', 'FailedOperation.ProductNotActivated'),
  }) as never)
  await assert.rejects(() => closed.list({ ...ctx, kind: 'cat.alarm' }), /尚未开通云拨测告警/)
})

test('g3.1 resolveCatScope and detail never expose domain records', async () => {
  assert.equal(resolveCatScope('cat', ''), 'task')
  assert.equal(resolveCatScope('auto', '即时拨测'), 'instant')
  assert.equal(resolveCatScope('cat', '告警配置'), 'alarm')
  const module = createCatModule(fakeCat([]) as never, fakeMonitor([]) as never)
  const detail = await module.detail?.({ ...ctx, id: 'tencent.cat:task:task-n1wchki8' })
  assert.equal(detail?.card.kind, 'cat')
  assert.ok(!detail?.records)
  assert.ok(detail?.sections?.some((sec) => sec.title === '基本信息'))
  assert.ok(detail?.sections?.some((sec) => sec.title === '拨测点'))
  assert.ok(detail?.sections?.some((sec) => sec.title === '拨测参数'))
})

test('g3.2 ConfigCard and Config schema stay frozen; cat never writes overlay', () => {
  const host = read('src/host.ts')
  const client = read('src/client.js')
  const cat = read('src/providers/tencent/products/cat.ts')
  assert.match(host, /timeoutMs: Schema\.number\(\)\.default\(20000\)/)
  assert.match(host, /maxResults: Schema\.number\(\)\.default\(12\)/)
  assert.match(host, /skipConfirm: Schema\.boolean\(\)\.default\(false\)/)
  assert.doesNotMatch(host, /catSecret|拨测密钥|CAT_KEY/)
  assert.match(client, /function ConfigCard\(\)/)
  assert.match(client, /配置各云厂商 AccessKey，查询域名与解析记录。/)
  assert.match(client, /写操作免确认（删除仍会确认）/)
  assert.match(client, /key:\s*"cloud-infra"/)
  assert.match(client, /item\.kind === "domain"/)
  assert.match(client, /没有解析记录/)
  assert.match(client, /任务列表/)
  assert.match(client, /即时拨测/)
  assert.match(client, /告警配置/)
  assert.doesNotMatch(cat, /writeOverlay|config-store|assignConfig/)
  assert.match(host, /Never call config save from conversation actions/)
  assert.match(client, /isDomain \? h\("div"/)
})

test('g3.2 CAM and secret-safe errors', () => {
  const denied = new TencentApiError('no CAM', 'UnauthorizedOperation')
  assert.equal(catPublicError(denied, 'read'), '当前密钥缺少云拨测读权限。')
  assert.equal(catPublicError(denied, 'write'), '当前密钥缺少云拨测写权限。')
  assert.equal(catPublicError(denied, 'analysis'), '当前密钥缺少云拨测分析权限。')
  assert.equal(catPublicError(denied, 'alarm'), '当前密钥缺少可观测平台告警权限。')
  assert.doesNotMatch(catPublicError(new TencentApiError('got AKIDabcdefghijklmnop', 'AuthFailure'), 'read'), /AKID/)
})
