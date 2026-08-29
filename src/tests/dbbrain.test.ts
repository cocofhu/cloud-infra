import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { overlayPath, withDefaults } from '../core/config-store.js'
import { handleApi } from '../host.js'
import {
  LIST_REGION,
  MISSING_REGION,
  SLOW_RANGES,
  createDbbrainModule,
  encodeInstanceRef,
  hasReportTab,
  mapInstanceItem,
  parseInstanceRef,
  readableDiagText,
  requireRegion,
  resolveTab,
  supportsThreadKill,
  tabsForProduct,
  timeRange,
  toIso8601,
  KILL_UNSUPPORTED,
  MONGO_KILL_HINT,
  type InstanceInfo,
} from '../providers/tencent/products/dbbrain.js'
import { DBBRAIN_REGIONS } from '../providers/tencent/products/dbbrain-catalog.js'

const dir = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => JSON.parse(readFileSync(join(dir, 'fixtures', name), 'utf8')) as Record<string, unknown>

function ctx(extra: Record<string, unknown> = {}) {
  return {
    creds: { secretId: 'id', secretKey: 'key' },
    query: '',
    offset: 0,
    limit: 12,
    timeoutMs: 5000,
    ...extra,
  }
}

test('mapInstanceItem encodes product region instance and 诊断优化 (g1.1 g1.2)', () => {
  const list = fixture('diag-instances.json')
  const item = (list.Items as InstanceInfo[])[0]
  const card = mapInstanceItem(item, 'mysql')
  assert.equal(card.id, 'tencent.dbbrain:mysql:ap-shanghai:cdb-sh')
  assert.equal(card.kind, 'dbbrain')
  assert.equal(card.region, 'ap-shanghai')
  assert.equal(card.product, 'mysql')
  assert.equal(card.openLabel, '诊断优化')
  assert.equal(card.hasReport, true)
  assert.equal(card.columns?.find((col) => col.label === '地域')?.value, '上海')
  assert.equal(card.columns?.find((col) => col.label === '健康分')?.value, '88')
  assert.equal(card.columns?.find((col) => col.label === '异常告警')?.value, '1')
  assert.deepEqual(parseInstanceRef(card.id), {
    moduleId: 'tencent.dbbrain',
    product: 'mysql',
    region: 'ap-shanghai',
    instanceId: 'cdb-sh',
  })
  assert.equal(encodeInstanceRef('mysql', 'ap-shanghai', 'cdb-sh'), card.id)
})

test('list uses Guangzhou header and optional Regions.N (g1.1 g4.1)', async () => {
  const calls: Array<{ action: string; payload: Record<string, unknown>; region: string }> = []
  const call = async (action: string, payload: unknown, _creds: unknown, opts: { region: string }) => {
    calls.push({ action, payload: payload as Record<string, unknown>, region: opts.region })
    if (action === 'DescribeDiagDBInstances') return fixture('diag-instances.json')
    return {}
  }
  const module = createDbbrainModule(call as never)
  const all = await module.list(ctx({ query: '', filters: { product: 'mysql' } }))
  assert.equal(all.items.length, 2)
  assert.equal(all.items[0].title, 'pay-core')
  assert.equal(all.items[0].region, 'ap-shanghai')
  assert.equal(calls[0].action, 'DescribeDiagDBInstances')
  assert.equal(calls[0].region, LIST_REGION)
  assert.equal(calls[0].payload.Product, 'mysql')
  assert.equal(calls[0].payload.IsSupported, true)
  assert.equal(calls[0].payload.Regions, undefined)

  await module.list(ctx({ filters: { product: 'mysql', region: 'ap-shanghai' } }))
  const filtered = calls[1]
  assert.deepEqual(filtered.payload.Regions, ['ap-shanghai'])
  assert.equal(filtered.region, LIST_REGION)
})

test('same-card detail carries instance region, not list Guangzhou (g1.2 g2.1 g4.1)', async () => {
  const calls: Array<{ action: string; region: string; payload: Record<string, unknown> }> = []
  const call = async (action: string, payload: unknown, _creds: unknown, opts: { region: string }) => {
    calls.push({ action, region: opts.region, payload: payload as Record<string, unknown> })
    if (action === 'DescribeDiagDBInstances') return fixture('diag-instances.json')
    if (action === 'DescribeDBDiagEvents' || action === 'DescribeDBDiagHistory') {
      return {
        Events: [{ EventId: 9, Severity: 3, DiagItem: '慢SQL', StartTime: '10:02', EndTime: '10:18' }],
      }
    }
    return {}
  }
  const module = createDbbrainModule(call as never)
  const listed = await module.list(ctx({ filters: { product: 'mysql' } }))
  const shanghai = listed.items.find((item) => item.region === 'ap-shanghai')
  if (!shanghai) throw new Error('missing shanghai row')
  const detail = await module.detail?.(ctx({
    id: shanghai.id,
    title: shanghai.title,
    filters: { tab: 'diag', product: shanghai.product, region: shanghai.region },
  }))
  assert.ok(detail?.tabs?.some((tab) => tab.label === '异常诊断'))
  assert.ok(detail?.tabs?.some((tab) => tab.label === '慢SQL分析'))
  assert.equal(detail?.fields.find((row) => row.label === '地域')?.value, 'ap-shanghai')
  const diag = calls.find((row) => row.action === 'DescribeDBDiagEvents' || row.action === 'DescribeDBDiagHistory')
  assert.equal(diag?.region, 'ap-shanghai')
  assert.notEqual(diag?.region, LIST_REGION)
  assert.equal(diag?.action, 'DescribeDBDiagEvents')
  assert.deepEqual(diag?.payload.InstanceIds, ['cdb-sh'])
  assert.equal(diag?.payload.InstanceId, undefined)
  assert.match(String(diag?.payload.StartTime), /\+08:00$/)
  assert.equal(detail?.card.openLabel, '诊断优化')
})

test('missing region refuses diagnosis and never defaults to Guangzhou (g2.1 g4.1)', async () => {
  const calls: Array<{ region: string }> = []
  const call = async (_action: string, _payload: unknown, _creds: unknown, opts: { region: string }) => {
    calls.push({ region: opts.region })
    return {}
  }
  const module = createDbbrainModule(call as never)
  await assert.rejects(
    async () => {
      await module.detail?.(ctx({ id: 'tencent.dbbrain:mysql::cdb-x', title: 'x', filters: { tab: 'diag' } }))
    },
    (err: Error) => err.message === MISSING_REGION,
  )
  assert.equal(calls.length, 0)
  assert.throws(
    () => requireRegion(ctx({ id: 'tencent.dbbrain:mysql::cdb-x' })),
    (err: Error) => err.message === MISSING_REGION,
  )
})

test('MySQL tabs, Redis/Mongo console names, Kill always confirms (g2.2 g2.3)', () => {
  const mysql = tabsForProduct('mysql').map((tab) => tab.label)
  for (const label of ['异常诊断', '慢SQL分析', '空间分析', '实时会话', '健康报告', 'SQL优化', '自治中心']) {
    assert.ok(mysql.includes(label), label)
  }
  assert.deepEqual(tabsForProduct('cynosdb').map((tab) => tab.id), tabsForProduct('mysql').map((tab) => tab.id))
  const mariadb = tabsForProduct('mariadb').map((tab) => tab.label)
  assert.deepEqual(mariadb, ['异常诊断', '实时会话', '慢SQL分析', '健康报告'])
  assert.ok(!mariadb.includes('自治中心'))
  assert.ok(!mariadb.includes('死锁可视化'))
  assert.deepEqual(tabsForProduct('dcdb').map((tab) => tab.id), tabsForProduct('mariadb').map((tab) => tab.id))
  assert.deepEqual(tabsForProduct('dbbrain-mysql').map((tab) => tab.id), tabsForProduct('mariadb').map((tab) => tab.id))
  assert.deepEqual(tabsForProduct('redis').map((tab) => tab.label), ['内存分析', '访问分析', '慢日志分析'])
  assert.deepEqual(tabsForProduct('mongodb').map((tab) => tab.label), ['索引推荐', '会话'])
  assert.equal(resolveTab('redis', 'diag'), 'memory')
  assert.equal(resolveTab('mysql', 'report'), 'report')
  assert.equal(resolveTab('redis', 'report'), 'memory')
  assert.equal(hasReportTab('mysql'), true)
  assert.equal(hasReportTab('redis'), false)
  assert.equal(hasReportTab('mongodb'), false)
  const module = createDbbrainModule((async () => ({})) as never)
  assert.equal(module.actions?.find((item) => item.id === 'session.kill')?.confirm, 'always')
  assert.equal(module.actions?.find((item) => item.id === 'report.delete')?.confirm, 'always')
})

test('slow SQL shortcuts include today through custom (g2.2)', () => {
  const labels = ['今天', '近五分', '近十分', '近一小时', '近三小时', '近二十四小时', '近三天', '自定义']
  assert.deepEqual(SLOW_RANGES.map((item) => item.label), labels)
  const five = timeRange('5m')
  assert.match(five.start, /^\d{4}-\d{2}-\d{2} /)
  assert.match(five.end, /^\d{4}-\d{2}-\d{2} /)
  const today = timeRange('today')
  assert.match(today.start, / 00:00:00$/)
  assert.match(toIso8601(five.start), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/)
})

test('Kill execute uses Prepare/Commit, instance region, and does not write overlay (g2.2 g3.2 g4.1)', async () => {
  const calls: Array<{ action: string; region: string; payload: Record<string, unknown> }> = []
  const call = async (action: string, payload: unknown, _creds: unknown, opts: { region: string }) => {
    calls.push({ action, region: opts.region, payload: payload as Record<string, unknown> })
    if (action === 'KillMySqlThreads' && (payload as { Stage?: string }).Stage === 'Prepare') {
      return { SqlExecId: 'exec-9' }
    }
    return {}
  }
  const module = createDbbrainModule(call as never)
  const killed = await module.execute?.('session.kill', {
    sessionId: '123',
    product: 'mysql',
    region: 'ap-shanghai',
    instanceId: 'cdb-sh',
  }, ctx({ id: 'tencent.dbbrain:mysql:ap-shanghai:cdb-sh' }))
  assert.equal(killed?.ok, true)
  assert.equal(calls.length, 2)
  assert.equal(calls[0].action, 'KillMySqlThreads')
  assert.equal(calls[0].region, 'ap-shanghai')
  assert.equal(calls[0].payload.Stage, 'Prepare')
  assert.equal(calls[0].payload.Product, 'mysql')
  assert.deepEqual(calls[0].payload.Threads, [123])
  assert.equal(calls[0].payload.SessionIds, undefined)
  assert.equal(calls[1].payload.Stage, 'Commit')
  assert.equal(calls[1].payload.SqlExecId, 'exec-9')
  assert.equal(calls[1].payload.Product, 'mysql')
  calls.length = 0
  const cynos = await module.execute?.('session.kill', {
    sessionId: '8',
    product: 'cynosdb',
    region: 'ap-shanghai',
    instanceId: 'cynosdbmysql-1',
  }, ctx({ id: 'tencent.dbbrain:cynosdb:ap-shanghai:cynosdbmysql-1' }))
  assert.equal(cynos?.ok, true)
  assert.equal(calls[0].payload.Product, 'cynosdb')
  assert.deepEqual(calls[0].payload.Threads, [8])
  const src = readFileSync(join(dir, '../../src/providers/tencent/products/dbbrain.ts'), 'utf8')
  assert.doesNotMatch(src, /writeOverlay/)
})

test('Redis memory and Mongo index tabs call matching APIs (g2.3)', async () => {
  const calls: string[] = []
  const call = async (action: string) => {
    calls.push(action)
    return { Items: [] }
  }
  const module = createDbbrainModule(call as never)
  await module.detail?.(ctx({
    id: 'tencent.dbbrain:redis:ap-shanghai:crs-1',
    title: 'cache',
    filters: { tab: 'memory', product: 'redis', region: 'ap-shanghai' },
  }))
  assert.ok(calls.includes('DescribeRedisTopBigKeys'))
  calls.length = 0
  await module.detail?.(ctx({
    id: 'tencent.dbbrain:mongodb:ap-beijing:cmgo-1',
    title: 'mongo',
    filters: { tab: 'index', product: 'mongodb', region: 'ap-beijing' },
  }))
  assert.ok(calls.includes('DescribeIndexRecommendInfo'))
})

test('handleApi query/detail pass filters; action does not save overlay (g3.2 g4.1)', async () => {
  function req(headers: Record<string, string | undefined>, opts: { method?: string; body?: string; remoteAddress?: string } = {}): IncomingMessage {
    const chunks = opts.body ? [Buffer.from(opts.body)] : []
    return {
      method: opts.method || 'POST',
      url: '/cloud-infra',
      headers,
      socket: { remoteAddress: opts.remoteAddress || '127.0.0.1' },
      async *[Symbol.asyncIterator]() {
        for (const chunk of chunks) yield chunk
      },
    } as IncomingMessage
  }
  function res() {
    const out = { status: 0, body: '' }
    const response = {
      statusCode: 0,
      setHeader() {},
      end(text: string) {
        out.status = response.statusCode
        out.body = String(text || '')
      },
    }
    return { response: response as unknown as ServerResponse, out }
  }
  const cfg = withDefaults()
  const meta = res()
  await handleApi(req({ host: '127.0.0.1:3091' }, { method: 'GET', body: '' }), meta.response, cfg)
  const parsed = JSON.parse(meta.out.body) as { modules: Array<{ id: string }>; providers: Array<{ fields: Array<{ key: string }> }> }
  assert.ok(parsed.modules.some((item) => item.id === 'tencent.dbbrain'))
  const tencent = parsed.providers.find((item) => item.fields?.some((field) => field.key === 'secretId'))
  assert.ok(tencent)
  assert.equal(tencent?.fields.some((field) => field.key === 'region'), false)

  const dirName = mkdtempSync(join(tmpdir(), 'cloud-infra-dbbrain-'))
  const prev = process.env.DSH_HOME
  process.env.DSH_HOME = dirName
  try {
    const live = withDefaults({
      timeoutMs: 80,
      providers: { tencent: { secretId: 'AKIDabcdefghijklmnop', secretKey: 'super-secret-value-1234' } },
    })
    const blocked = res()
    await handleApi(req({
      host: '127.0.0.1:3091',
      origin: 'http://127.0.0.1:3091',
    }, {
      body: JSON.stringify({
        method: 'action',
        moduleId: 'tencent.dbbrain',
        action: 'session.kill',
        id: 'tencent.dbbrain:mysql:ap-shanghai:cdb-sh',
        payload: { sessionId: '1', region: 'ap-shanghai', product: 'mysql', instanceId: 'cdb-sh' },
      }),
    }), blocked.response, live)
    assert.equal(existsSync(overlayPath()), false)
  } finally {
    process.env.DSH_HOME = prev
    rmSync(dirName, { recursive: true, force: true })
  }
})

test('report.create sends SendMailFlag 0 as ISO8601 without contacts (g2.2 g4.1)', async () => {
  const calls: Array<{ action: string; payload: Record<string, unknown> }> = []
  const call = async (action: string, payload: unknown) => {
    calls.push({ action, payload: payload as Record<string, unknown> })
    return {}
  }
  const module = createDbbrainModule(call as never)
  const created = await module.execute?.('report.create', {
    product: 'mysql',
    region: 'ap-shanghai',
    instanceId: 'cdb-sh',
    range: '24h',
  }, ctx({ id: 'tencent.dbbrain:mysql:ap-shanghai:cdb-sh' }))
  assert.equal(created?.ok, true)
  assert.equal(calls[0].action, 'CreateDBDiagReportTask')
  assert.equal(calls[0].payload.SendMailFlag, 0)
  assert.equal(calls[0].payload.ContactPerson, undefined)
  assert.equal(calls[0].payload.ContactGroup, undefined)
  assert.match(String(calls[0].payload.StartTime), /^\d{4}-\d{2}-\d{2}T.+\+08:00$/)
  assert.match(String(calls[0].payload.EndTime), /^\d{4}-\d{2}-\d{2}T.+\+08:00$/)
})

test('event.ignore uses integer Status (g2.2 g4.1)', async () => {
  const calls: Array<{ payload: Record<string, unknown> }> = []
  const call = async (_action: string, payload: unknown) => {
    calls.push({ payload: payload as Record<string, unknown> })
    return {}
  }
  const module = createDbbrainModule(call as never)
  const ignored = await module.execute?.('event.ignore', {
    eventId: 9,
    product: 'mysql',
    region: 'ap-shanghai',
    instanceId: 'cdb-sh',
  }, ctx({ id: 'tencent.dbbrain:mysql:ap-shanghai:cdb-sh' }))
  assert.equal(ignored?.ok, true)
  assert.equal(calls[0].payload.Status, 2)
  assert.equal(typeof calls[0].payload.Status, 'number')
})

test('Mongo kill uses CreateMongoDBKillTask form fields, not sessionId (g2.3 g4.1)', async () => {
  const calls: Array<{ action: string; payload: Record<string, unknown> }> = []
  const call = async (action: string, payload: unknown) => {
    calls.push({ action, payload: payload as Record<string, unknown> })
    return { Status: 1 }
  }
  const module = createDbbrainModule(call as never)
  const killed = await module.execute?.('session.kill', {
    duration: '30',
    time: '5',
    host: '10.0.0.1',
    type: 'active',
    sessionId: '61',
    product: 'mongodb',
    region: 'ap-beijing',
    instanceId: 'cmgo-1',
  }, ctx({ id: 'tencent.dbbrain:mongodb:ap-beijing:cmgo-1' }))
  assert.equal(killed?.ok, true)
  assert.equal(calls[0].action, 'CreateMongoDBKillTask')
  assert.equal(calls[0].payload.Product, 'mongodb')
  assert.equal(calls[0].payload.Duration, 30)
  assert.equal(calls[0].payload.Time, 5)
  assert.equal(calls[0].payload.Host, '10.0.0.1')
  assert.equal(calls[0].payload.Type, 'active')
  assert.equal(calls[0].payload.SessionIds, undefined)
  assert.equal(calls[0].payload.sessionId, undefined)
  calls.length = 0
  const missing = await module.execute?.('session.kill', {
    sessionId: '61',
    product: 'mongodb',
    region: 'ap-beijing',
    instanceId: 'cmgo-1',
  }, ctx({ id: 'tencent.dbbrain:mongodb:ap-beijing:cmgo-1' }))
  assert.equal(missing?.ok, false)
  assert.match(String(missing?.error), /Duration/)
  assert.equal(calls.length, 0)
})

test('Mongo session tab offers kill-task form and hides per-row Kill (g2.3 g4.1)', async () => {
  const module = createDbbrainModule((async () => ({
    ProcessList: [{ Id: '61', Host: '10.0.0.1', User: 'app' }],
  })) as never)
  const detail = await module.detail?.(ctx({
    id: 'tencent.dbbrain:mongodb:ap-beijing:cmgo-1',
    title: 'mongo',
    filters: { tab: 'session', product: 'mongodb', region: 'ap-beijing' },
  }))
  assert.equal(detail?.form?.id, 'mongo-kill-task')
  assert.equal(detail?.form?.action, 'session.kill')
  assert.equal(detail?.form?.submitLabel, '创建中断任务')
  assert.ok(detail?.form?.fields?.some((field) => field.key === 'duration'))
  assert.ok(detail?.form?.fields?.some((field) => field.key === 'time'))
  assert.ok(detail?.form?.fields?.some((field) => field.key === 'host'))
  assert.ok(detail?.hints?.some((hint) => hint.includes('不支持按会话 ID 杀')))
  assert.equal(detail?.hints?.some((hint) => hint.includes(MONGO_KILL_HINT.split('。')[0])), true)
  const client = readFileSync(join(dir, '../../src/client.js'), 'utf8')
  assert.match(client, /创建中断任务/)
  assert.match(client, /可能中断该实例上多条匹配会话/)
  assert.match(client, /不只针对某一条 sessionId/)
  assert.match(client, /canKillSession/)
  assert.match(client, /item\.hasReport/)
  assert.match(client, /sessionId: row\.sessionId/)
  assert.doesNotMatch(client, /function hasReportTab/)
  assert.doesNotMatch(client, /sessionId: row\.sessionId,\s*host:/)
})

test('MariaDB/TDSQL/self-built MySQL refuse Kill and never send Product=mysql (g2.2 g4.1)', async () => {
  for (const product of ['mariadb', 'dcdb', 'dbbrain-mysql']) {
    const calls: Array<{ action: string; payload: Record<string, unknown> }> = []
    const module = createDbbrainModule((async (action: string, payload: unknown) => {
      calls.push({ action, payload: payload as Record<string, unknown> })
      return {}
    }) as never)
    const killed = await module.execute?.('session.kill', {
      sessionId: '1',
      product,
      region: 'ap-shanghai',
      instanceId: 'inst-1',
    }, ctx({ id: `tencent.dbbrain:${product}:ap-shanghai:inst-1` }))
    assert.equal(killed?.ok, false, product)
    assert.equal(killed?.error, KILL_UNSUPPORTED, product)
    assert.equal(calls.length, 0, product)
    assert.equal(supportsThreadKill(product), false, product)
    const detail = await module.detail?.(ctx({
      id: `tencent.dbbrain:${product}:ap-shanghai:inst-1`,
      title: product,
      filters: { tab: 'session', product, region: 'ap-shanghai' },
    }))
    assert.ok(detail?.hints?.some((hint) => hint.includes(KILL_UNSUPPORTED)), product)
  }
  assert.equal(supportsThreadKill('mysql'), true)
  assert.equal(supportsThreadKill('cynosdb'), true)
  assert.equal(supportsThreadKill('mongodb'), false)
  assert.equal(hasReportTab('postgres'), true)
  assert.equal(mapInstanceItem({ InstanceId: 'crs-1', Region: 'ap-shanghai' }, 'redis').hasReport, false)
  assert.equal(mapInstanceItem({ InstanceId: 'cmgo-1', Region: 'ap-beijing' }, 'mongodb').hasReport, false)
})

test('history diagnosis clamps 3d window to two days (g2.1 g4.1)', async () => {
  const calls: Array<{ action: string; payload: Record<string, unknown> }> = []
  const call = async (action: string, payload: unknown) => {
    calls.push({ action, payload: payload as Record<string, unknown> })
    return { Events: [] }
  }
  const module = createDbbrainModule(call as never)
  await module.detail?.(ctx({
    id: 'tencent.dbbrain:mysql:ap-shanghai:cdb-sh',
    title: 'pay-core',
    filters: { tab: 'diag', subTab: 'history', range: '3d', product: 'mysql', region: 'ap-shanghai' },
  }))
  const history = calls.find((row) => row.action === 'DescribeDBDiagHistory')
  assert.ok(history)
  const start = Date.parse(toIso8601(String(history?.payload.StartTime)))
  const end = Date.parse(toIso8601(String(history?.payload.EndTime)))
  assert.ok(end - start <= 2 * 24 * 60 * 60 * 1000 + 1000)
})

test('empty range after tab switch does not keep slow 3d on live diag (g2.1 g4.1)', async () => {
  const calls: Array<{ action: string; payload: Record<string, unknown> }> = []
  const call = async (action: string, payload: unknown) => {
    calls.push({ action, payload: payload as Record<string, unknown> })
    return { Events: [] }
  }
  const module = createDbbrainModule(call as never)
  await module.detail?.(ctx({
    id: 'tencent.dbbrain:mysql:ap-shanghai:cdb-sh',
    title: 'pay-core',
    filters: { tab: 'diag', product: 'mysql', region: 'ap-shanghai', range: '' },
  }))
  const live = calls.find((row) => row.action === 'DescribeDBDiagEvents')
  assert.ok(live)
  const start = Date.parse(String(live?.payload.StartTime))
  const end = Date.parse(String(live?.payload.EndTime))
  assert.ok(end - start <= 3 * 60 * 60 * 1000 + 2000)
})

test('MySQL autonomy does not call redis-only API (g2.2 g4.1)', async () => {
  const calls: string[] = []
  const call = async (action: string) => {
    calls.push(action)
    return {}
  }
  const module = createDbbrainModule(call as never)
  const detail = await module.detail?.(ctx({
    id: 'tencent.dbbrain:mysql:ap-shanghai:cdb-sh',
    title: 'pay-core',
    filters: { tab: 'autonomy', product: 'mysql', region: 'ap-shanghai' },
  }))
  assert.equal(calls.includes('DescribeDBAutonomyEvents'), false)
  assert.ok(detail?.hints?.some((hint) => hint.includes('当前产品线') && hint.includes('自治中心')))
})

test('event detail flattens Problem/Suggestions JSON (g2.2 g4.1)', async () => {
  const call = async (action: string) => {
    if (action === 'DescribeDBDiagEvents') {
      return { Items: [{ EventId: 9, Severity: 3, DiagItem: '慢SQL' }] }
    }
    if (action === 'DescribeDBDiagEvent') {
      return {
        Outline: '发现1个问题',
        Problem: '[{"DataType":"title","Data":{"Name":"会话快照"}}]',
        Suggestions: '[{"DataType":"title","Data":{"Name":"SQL优化"}}]',
      }
    }
    return {}
  }
  const module = createDbbrainModule(call as never)
  const detail = await module.detail?.(ctx({
    id: 'tencent.dbbrain:mysql:ap-shanghai:cdb-sh',
    title: 'pay-core',
    filters: { tab: 'diag', eventId: '9', product: 'mysql', region: 'ap-shanghai' },
  }))
  const cause = detail?.tables?.find((table) => table.id === 'cause')
  const advice = detail?.tables?.find((table) => table.id === 'advice')
  const causeRow = cause?.rows[0] as Record<string, string> | undefined
  const adviceRow = advice?.rows[0] as Record<string, string> | undefined
  assert.equal(causeRow?.内容, '会话快照')
  assert.equal(adviceRow?.内容, 'SQL优化')
  assert.equal(readableDiagText('[{"DataType":"title","Data":{"Name":"会话快照"}}]'), '会话快照')
})

test('shared region catalog covers finance and overseas ids (g1.1)', () => {
  const ids = DBBRAIN_REGIONS.map((item) => item.id)
  for (const id of ['ap-shanghai-fsi', 'ap-shenzhen-fsi', 'ap-beijing-fsi', 'ap-qingdao', 'ap-hangzhou', 'ap-jakarta']) {
    assert.ok(ids.includes(id), id)
  }
  const client = readFileSync(join(dir, '../../src/client.js'), 'utf8')
  for (const region of DBBRAIN_REGIONS) {
    if (!region.id) continue
    assert.ok(client.includes(region.id), region.id)
    assert.ok(client.includes(region.label), region.label)
  }
})

