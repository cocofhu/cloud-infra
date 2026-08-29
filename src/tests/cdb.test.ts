import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { publicErrorMessage } from '../core/safe-error.js'
import { TencentApiError } from '../providers/tencent/client.js'
import { clearDmcSessions, getDmcSession } from '../providers/tencent/dmc-session.js'
import {
  CDB_MONITOR_METRICS,
  CDB_OFFICIAL_TABS,
  createCdbModule,
  dmcConnectHint,
  explicitOpened,
  firstMetric,
  instanceMatchesQuery,
  isConnectError,
  isDestructiveSql,
  isWriteSql,
  lastDayRange,
  mapCdbItem,
  metricValue,
  parseCdbRef,
  pickDmcEndpoint,
  type CdbInstance,
  type DmcDriver,
} from '../providers/tencent/products/cdb.js'

const dir = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => JSON.parse(readFileSync(join(dir, 'fixtures', name), 'utf8')) as Record<string, unknown>
const src = (rel: string) => readFileSync(join(dir, '../..', rel), 'utf8')

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

test('mapCdbItem aligns console list columns g1.2', () => {
  const item = (fixture('cdb-list.json').Items as CdbInstance[])[0]
  const card = mapCdbItem(item, 'ap-guangzhou')
  assert.equal(card.id, 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1')
  assert.equal(card.kind, 'cdb')
  assert.equal(card.title, 'cdb-70zdmgg1')
  assert.equal(card.description, 'prod-order')
  assert.equal(card.openLabel, '管理')
  assert.equal(card.status, 'enable')
  assert.deepEqual(card.columns, [
    { label: '运行状态', value: '运行中' },
    { label: '可用区', value: '广州三区' },
    { label: '数据库版本', value: '8.0' },
    { label: '配置', value: '2核 4000MB / 200GB' },
    { label: '内网地址', value: '10.0.1.12:3306' },
    { label: '计费模式', value: '按量计费' },
  ])
  assert.equal(card.meta?.region, 'ap-guangzhou')
  assert.equal(card.meta?.destroyProtect, 'off')
  assert.ok(instanceMatchesQuery(item, 'cdb-70zdmgg1'))
  assert.ok(instanceMatchesQuery(item, 'prod-order'))
  assert.ok(instanceMatchesQuery(item, '10.0.1.12'))
  assert.equal(instanceMatchesQuery(item, 'other'), false)
})

test('parseCdbRef keeps region in the resource id', () => {
  assert.deepEqual(parseCdbRef('tencent.cdb:ap-guangzhou:cdb-70zdmgg1'), {
    moduleId: 'tencent.cdb',
    region: 'ap-guangzhou',
    instanceId: 'cdb-70zdmgg1',
  })
})

test('official manage tabs stay the 11 console names g2', () => {
  assert.deepEqual([...CDB_OFFICIAL_TABS], [
    '实例详情', '实例监控', '账号管理', '数据库管理', '安全组',
    '备份恢复', '日志中心', '只读实例', '数据库代理', '数据安全', '连接检查',
  ])
  assert.equal(CDB_OFFICIAL_TABS.includes('在线查询' as never), false)
  assert.equal(CDB_OFFICIAL_TABS.includes('慢查询' as never), false)
})

test('list maps fixtures and isolates region failures g1.1', async () => {
  const calls: Array<{ action: string; region?: string }> = []
  const call = async (action: string, _payload: unknown, _creds: unknown, opts: { region?: string }) => {
    calls.push({ action, region: opts.region })
    if (action === 'DescribeDBInstances' && opts.region === 'ap-tokyo') throw new Error('tokyo down')
    if (action === 'DescribeDBInstances') return fixture('cdb-list.json')
    return {}
  }
  const module = createCdbModule(call as never, {
    async ping() {},
    async query() { return { columns: [], rows: [] } },
  })
  const listed = await module.list(ctx({ query: 'prod-order' }))
  assert.ok(listed.items.some((item) => item.title === 'cdb-70zdmgg1'))
  assert.ok(listed.items.every((item) => item.kind === 'cdb'))
  assert.ok((listed.warnings || []).some((row) => row.includes('东京')))
  assert.ok(calls.some((row) => row.region === 'ap-guangzhou'))
  assert.ok(calls.some((row) => row.region === 'ap-tokyo'))
  const named = await module.list(ctx({ query: '10.0.1.12', region: 'ap-guangzhou' }))
  assert.equal(named.items[0]?.title, 'cdb-70zdmgg1')
  assert.equal(named.items[0]?.columns?.find((col) => col.label === '内网地址')?.value, '10.0.1.12:3306')
})

test('account actions and destroy always confirm g1.3 g2.2', async () => {
  const calls: Array<{ action: string; payload: unknown }> = []
  const call = async (action: string, payload: unknown) => {
    calls.push({ action, payload })
    if (action === 'DescribeDBInstances') return { Items: (fixture('cdb-list.json').Items as unknown[]).slice(0, 1) }
    if (action === 'DescribeAccounts') return { Items: [{ User: 'root', Host: '%' }] }
    return {}
  }
  const module = createCdbModule(call as never)
  assert.equal(module.actions?.find((item) => item.id === 'instance.destroy')?.confirm, 'always')
  assert.equal(module.actions?.find((item) => item.id === 'account.delete')?.confirm, 'always')
  assert.equal(module.actions?.find((item) => item.id === 'account.password')?.confirm, 'always')
  const created = await module.execute?.('account.create', {
    region: 'ap-guangzhou',
    instanceId: 'cdb-70zdmgg1',
    user: 'app',
    host: '%',
    password: 'NotAPublicSecret!',
  }, ctx({ id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1' }))
  assert.equal(created?.ok, true)
  assert.equal(calls.some((row) => row.action === 'CreateAccounts'), true)
  const destroyed = await module.execute?.('instance.destroy', {
    region: 'ap-guangzhou',
    instanceId: 'cdb-70zdmgg1',
  }, ctx({ id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1' }))
  assert.equal(destroyed?.ok, true)
  assert.equal(calls.some((row) => row.action === 'IsolateDBInstance'), true)
  const buy = await module.execute?.('instance.buy', {}, ctx({ id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1' }))
  assert.equal(buy?.ok, false)
  if (buy && !buy.ok) assert.match(buy.error, /不在插件内下单/)
  const detail = await module.detail?.({
    ...ctx(),
    id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1',
    tab: '账号管理',
    region: 'ap-guangzhou',
  })
  assert.equal(detail?.card.title, 'cdb-70zdmgg1')
  assert.deepEqual(detail?.extra?.tabs, [...CDB_OFFICIAL_TABS])
  const accounts = (detail?.extra?.tabData as { accounts?: unknown[] } | undefined)?.accounts
  assert.equal(accounts?.length, 1)
})

test('manage tabs load official console sections g2.3-g2.5', async () => {
  const calls: string[] = []
  const call = async (action: string) => {
    calls.push(action)
    if (action === 'DescribeDBInstances') return { Items: (fixture('cdb-list.json').Items as unknown[]).slice(0, 1) }
    if (action === 'DescribeDatabases') return { Items: [{ DatabaseName: 'app', CharacterSet: 'utf8mb4' }] }
    if (action === 'DescribeInstanceParams') return { Items: [{ Name: 'max_connections', CurrentValue: '1000' }] }
    if (action === 'DescribeDBSecurityGroups') return { Groups: [{ SecurityGroupId: 'sg-1', SecurityGroupName: 'default' }] }
    if (action === 'DescribeBackups') return { Items: [{ BackupId: 9, Way: 'manual', Date: '2024-01-01' }] }
    if (action === 'DescribeSlowLogData') return { Items: [{ SqlText: 'SELECT 1' }] }
    if (action === 'DescribeErrorLogData') return { Items: [] }
    if (action === 'DescribeRoGroups') return { RoGroups: [{ RoInstances: [{ InstanceId: 'cdbro-8k2n1a', InstanceName: 'prod-order-ro' }] }] }
    if (action === 'DescribeCdbProxyInfo') return { ProxyId: 'proxy-1' }
    if (action === 'DescribeDBFeatures') return { Encryption: false }
    if (action === 'DescribeAuditConfig') return { opened: false }
    if (action === 'DescribeDeviceMonitorInfo') return { Cpu: 12, Memory: 30, Disk: 40, Connections: 8 }
    return {}
  }
  const module = createCdbModule(call as never, {
    async ping() {},
    async query() { return { columns: [], rows: [] } },
  }, (async () => ({})) as never)
  const load = (tab: string) => module.detail?.({
    ...ctx(),
    id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1',
    region: 'ap-guangzhou',
    tab,
  })
  const db = await load('数据库管理')
  assert.equal(((db?.extra?.tabData as { databases?: unknown[] }).databases || []).length, 1)
  assert.equal(((db?.extra?.tabData as { parameters?: unknown[] }).parameters || []).length, 1)
  const sg = await load('安全组')
  assert.equal(((sg?.extra?.tabData as { groups?: unknown[] }).groups || []).length, 1)
  const bak = await load('备份恢复')
  assert.equal(((bak?.extra?.tabData as { backups?: unknown[] }).backups || []).length, 1)
  const logs = await load('日志中心')
  assert.equal(((logs?.extra?.tabData as { slowLogs?: unknown[] }).slowLogs || []).length, 1)
  const ro = await load('只读实例')
  assert.equal(((ro?.extra?.tabData as { readonlyInstances?: unknown[] }).readonlyInstances || []).length, 1)
  const proxy = await load('数据库代理')
  assert.equal((proxy?.extra?.tabData as { opened?: boolean }).opened, true)
  const sec = await load('数据安全')
  assert.ok(sec?.extra?.tabData)
  const mon = await load('实例监控')
  const monData = mon?.extra?.tabData as { range?: string; series?: Array<{ metric?: string }> }
  assert.equal(monData.range, '1h')
  assert.equal(monData.series?.length, CDB_MONITOR_METRICS.length)
  assert.ok(calls.includes('DescribeDatabases'))
  assert.ok(calls.includes('DescribeSlowLogData'))
  assert.ok(calls.includes('DescribeRoGroups'))
})

test('dmc login stays in memory and never persists password g3.1', async () => {
  clearDmcSessions()
  const pings: unknown[] = []
  const driver: DmcDriver = {
    async ping(opts) { pings.push({ user: opts.user, host: opts.host }) },
    async query(opts) {
      if (/SHOW DATABASES/i.test(opts.sql)) return { columns: ['Database'], rows: [['app']] }
      if (/SHOW TABLES/i.test(opts.sql)) return { columns: ['Tables_in_app'], rows: [['orders']] }
      return { columns: ['id'], rows: [[1]] }
    },
  }
  const call = async () => ({})
  const module = createCdbModule(call as never, driver)
  const logged = await module.execute?.('dmc.login', {
    region: 'ap-guangzhou',
    instanceId: 'cdb-70zdmgg1',
    user: 'root',
    password: 'OnlyInMemory#1',
    host: '10.0.1.12',
    port: 3306,
  }, ctx({ id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1' }))
  assert.equal(logged?.ok, true)
  if (logged && logged.ok) {
    assert.equal((logged.data as { user?: string }).user, 'root')
    assert.equal((logged.data as { password?: string }).password, undefined)
  }
  assert.doesNotMatch(JSON.stringify(logged), /OnlyInMemory/)
  assert.equal(getDmcSession('cdb-70zdmgg1', 'ap-guangzhou')?.password, 'OnlyInMemory#1')
  assert.doesNotMatch(src('src/providers/tencent/products/cdb.ts'), /writeOverlay|overlayPath|writeFileSync/)
  assert.doesNotMatch(src('src/providers/tencent/dmc-session.ts'), /writeFileSync|writeOverlay|overlayPath/)
  const sql = await module.execute?.('dmc.sql', {
    region: 'ap-guangzhou',
    instanceId: 'cdb-70zdmgg1',
    sql: 'SELECT 1',
  }, ctx({ id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1' }))
  assert.equal(sql?.ok, true)
  const schema = await module.execute?.('dmc.schema', {
    region: 'ap-guangzhou',
    instanceId: 'cdb-70zdmgg1',
  }, ctx({ id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1' }))
  assert.equal(schema?.ok, true)
  if (schema && schema.ok) assert.deepEqual((schema.data as { databases?: string[] }).databases, ['app'])
  const browsed = await module.execute?.('dmc.rows', {
    region: 'ap-guangzhou',
    instanceId: 'cdb-70zdmgg1',
    database: 'app',
    table: 'orders',
  }, ctx({ id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1' }))
  assert.equal(browsed?.ok, true)
  assert.equal(isWriteSql('SELECT 1'), false)
  assert.equal(isWriteSql('UPDATE t SET a=1'), true)
  assert.equal(isDestructiveSql('SELECT 1'), false)
  assert.equal(isDestructiveSql('INSERT INTO t VALUES (1)'), false)
  assert.equal(isDestructiveSql('DROP DATABASE app'), true)
  assert.equal(isDestructiveSql('DELETE FROM t'), true)
  assert.equal(isDestructiveSql('TRUNCATE TABLE t'), true)
  assert.equal(isDestructiveSql('ALTER TABLE t DROP COLUMN a'), true)
})

test('password never appears in public action errors g2.2', async () => {
  const call = async () => {
    throw new TencentApiError('ModifyAccountPassword failed SuperSecretPass!', 'FailedOperation')
  }
  const module = createCdbModule(call as never)
  const result = await module.execute?.('account.password', {
    region: 'ap-guangzhou',
    instanceId: 'cdb-70zdmgg1',
    user: 'root',
    password: 'SuperSecretPass!',
  }, ctx({ id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1' }))
  assert.equal(result?.ok, false)
  if (result && !result.ok) {
    assert.doesNotMatch(result.error, /SuperSecretPass/)
    assert.equal(result.error, publicErrorMessage(new TencentApiError('x', 'FailedOperation')))
  }
})

test('query render for kind=cdb points to 登录/管理 g4.2', async () => {
  const { renderQuery } = await import('../core/query.js')
  const text = renderQuery({
    query: '',
    kind: 'cdb',
    items: [{
      id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1',
      moduleId: 'tencent.cdb',
      provider: 'tencent',
      kind: 'cdb',
      title: 'cdb-70zdmgg1',
      description: 'prod-order',
    }],
    errors: [],
    total: 1,
  })
  assert.match(text, /登录/)
  assert.match(text, /管理/)
  assert.doesNotMatch(text, /解析/)
})

test('settings provider fields stay SecretId/SecretKey g4.1', () => {
  const index = src('src/providers/tencent/index.ts')
  assert.match(index, /products\/cdb\.js/)
  assert.match(index, /key: 'secretId'/)
  assert.match(index, /key: 'secretKey'/)
  assert.doesNotMatch(index, /region|dbUser|dbPassword|库账号/)
})

test('list paginates DescribeDBInstances by Offset instead of truncating at 100 g1.1', async () => {
  const offsets: number[] = []
  const call = async (action: string, payload: { Offset?: number; Limit?: number }) => {
    if (action !== 'DescribeDBInstances') return {}
    offsets.push(payload.Offset || 0)
    assert.equal(payload.Limit, 100)
    const offset = payload.Offset || 0
    const size = offset === 0 ? 100 : 50
    return {
      TotalCount: 150,
      Items: Array.from({ length: size }, (_, i) => ({
        InstanceId: `cdb-page${offset + i}`,
        InstanceName: `n${offset + i}`,
        Status: 1,
        Vip: '10.0.0.1',
        Vport: 3306,
      })),
    }
  }
  const module = createCdbModule(call as never)
  const listed = await module.list(ctx({ region: 'ap-guangzhou', limit: 12 }))
  assert.deepEqual(offsets, [0, 100])
  assert.equal(listed.total, 150)
  assert.equal(listed.hasMore, true)
  assert.equal(listed.items.length, 12)
})

test('destroy protect calls ModifyInstanceDestroyProtect on/off g1.3', async () => {
  const calls: Array<{ action: string; payload: unknown }> = []
  const call = async (action: string, payload: unknown) => {
    calls.push({ action, payload })
    return {}
  }
  const module = createCdbModule(call as never)
  const on = await module.execute?.('instance.protect', {
    region: 'ap-guangzhou',
    instanceId: 'cdb-70zdmgg1',
    enable: true,
  }, ctx({ id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1' }))
  const off = await module.execute?.('instance.protect', {
    region: 'ap-guangzhou',
    instanceId: 'cdb-70zdmgg1',
    enable: false,
  }, ctx({ id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1' }))
  assert.equal(on?.ok, true)
  assert.equal(off?.ok, true)
  const protect = calls.filter((row) => row.action === 'ModifyInstanceDestroyProtect')
  assert.equal(protect.length, 2)
  assert.deepEqual(protect[0]?.payload, { InstanceIds: ['cdb-70zdmgg1'], DestroyProtect: 'on' })
  assert.deepEqual(protect[1]?.payload, { InstanceIds: ['cdb-70zdmgg1'], DestroyProtect: 'off' })
  assert.equal(calls.some((row) => row.action === 'ModifyInstanceTag'), false)
  assert.doesNotMatch(src('src/providers/tencent/products/cdb.ts'), /ProtectStatus/)
})

test('param.modify sends InstanceIds array g2.3', async () => {
  const calls: Array<{ action: string; payload: unknown }> = []
  const call = async (action: string, payload: unknown) => {
    calls.push({ action, payload })
    return {}
  }
  const module = createCdbModule(call as never)
  const result = await module.execute?.('param.modify', {
    region: 'ap-guangzhou',
    instanceId: 'cdb-70zdmgg1',
    name: 'max_connections',
    value: '2000',
  }, ctx({ id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1' }))
  assert.equal(result?.ok, true)
  const modify = calls.find((row) => row.action === 'ModifyInstanceParam')
  assert.deepEqual(modify?.payload, {
    InstanceIds: ['cdb-70zdmgg1'],
    ParamList: [{ Name: 'max_connections', CurrentValue: '2000' }],
  })
})

test('monitor tab returns chart series and tolerates single metric failure g2.5', async () => {
  const calls: Array<{ action: string; payload: Record<string, unknown> }> = []
  const call = async (action: string) => {
    if (action === 'DescribeDBInstances') return { Items: (fixture('cdb-list.json').Items as unknown[]).slice(0, 1) }
    return {}
  }
  const monitor = async (_action: string, payload: Record<string, unknown>) => {
    calls.push({ action: _action, payload })
    const metric = String(payload.MetricName || '')
    if (metric === 'SlowQueries') throw new Error('AuthFailure')
    if (metric === 'CpuUseRate') return { DataPoints: [{ Timestamps: [1000, 1060], Values: [10, 12.5] }] }
    return { DataPoints: [{ Timestamps: [1000], Values: [3] }] }
  }
  const module = createCdbModule(call as never, {
    async ping() {},
    async query() { return { columns: [], rows: [] } },
  }, monitor as never)
  const mon = await module.detail?.({
    ...ctx(),
    id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1',
    region: 'ap-guangzhou',
    tab: '实例监控',
    range: '6h',
  })
  const data = mon?.extra?.tabData as {
    range?: string
    metrics?: Array<{ key?: string; metricName?: string }>
    series?: Array<{ key?: string; metric: string; timestamps: number[]; values: Array<number | null> }>
    cpu?: string
    note?: string
  }
  assert.equal(data.range, '6h')
  assert.equal(data.series?.length, CDB_MONITOR_METRICS.length)
  assert.equal(data.metrics?.length, CDB_MONITOR_METRICS.length)
  const cpu = data.series?.find((row) => row.metric === 'CpuUseRate')
  assert.deepEqual(cpu?.timestamps, [1000, 1060])
  assert.deepEqual(cpu?.values, [10, 12.5])
  assert.equal(data.cpu, '12.5')
  const slow = data.series?.find((row) => row.metric === 'SlowQueries')
  assert.deepEqual(slow, { key: 'slowQueries', metric: 'SlowQueries', timestamps: [], values: [] })
  // series[].key 必须与 metrics[].key 对齐,前端 seriesMap 以 key 为键
  for (const row of data.series || []) {
    assert.ok(row.key && data.metrics?.some((m) => m.key === row.key), `series key ${row.key} 应对应 metrics 中某项`)
  }
  assert.match(data.note || '', /部分指标拉取失败/)
  const firstCall = calls[0]
  assert.equal(firstCall.payload.Namespace, 'QCE/CDB')
  assert.equal(firstCall.payload.Period, 300)
  assert.ok(typeof firstCall.payload.StartTime === 'string' && typeof firstCall.payload.EndTime === 'string')
  assert.deepEqual(metricValue({ DataPoints: [{ Values: [1, 2, 8] }] }), '8')
  assert.equal(firstMetric({ Min: [0], Max: [1], Avg: [4] }, { DataPoints: [{ Values: [9] }] }), '4')
})

test('monitor tab shows CAM hint when every metric fails g2.5', async () => {
  const call = async (action: string) => {
    if (action === 'DescribeDBInstances') return { Items: (fixture('cdb-list.json').Items as unknown[]).slice(0, 1) }
    return {}
  }
  const monitor = async () => { throw new Error('AuthFailure') }
  const module = createCdbModule(call as never, {
    async ping() {},
    async query() { return { columns: [], rows: [] } },
  }, monitor as never)
  const mon = await module.detail?.({
    ...ctx(),
    id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1',
    region: 'ap-guangzhou',
    tab: '实例监控',
  })
  const data = mon?.extra?.tabData as { series?: unknown[]; note?: string }
  assert.equal(data.series?.length, CDB_MONITOR_METRICS.length)
  assert.match(data.note || '', /无法拉取监控数据/)
})

test('data security empty objects are not treated as opened g2.5', async () => {
  const call = async (action: string) => {
    if (action === 'DescribeDBInstances') return { Items: (fixture('cdb-list.json').Items as unknown[]).slice(0, 1) }
    if (action === 'DescribeDBFeatures') return {}
    if (action === 'DescribeAuditConfig') return {}
    return {}
  }
  const module = createCdbModule(call as never)
  const sec = await module.detail?.({
    ...ctx(),
    id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1',
    region: 'ap-guangzhou',
    tab: '数据安全',
  })
  const data = sec?.extra?.tabData as { opened?: boolean; auditOpened?: boolean | null; encryptionOpened?: boolean | null }
  assert.equal(data.opened, false)
  assert.equal(data.auditOpened, null)
  assert.equal(data.encryptionOpened, null)
  assert.equal(explicitOpened({}, ['opened']), null)
  assert.equal(explicitOpened({ opened: false }, ['opened']), false)
})

test('logs tab maps SqlText and Timestamp g2.4', async () => {
  const payloads: Array<{ action: string; payload: Record<string, unknown> }> = []
  const call = async (action: string, payload: Record<string, unknown> = {}) => {
    payloads.push({ action, payload })
    if (action === 'DescribeDBInstances') return { Items: (fixture('cdb-list.json').Items as unknown[]).slice(0, 1) }
    if (action === 'DescribeSlowLogData') return { Items: [{ SqlText: 'SELECT 1', Timestamp: '2024-01-01 00:00:00', UserHost: 'app' }] }
    if (action === 'DescribeErrorLogData') return { Items: [{ Content: 'err', Timestamp: '2024-01-01 00:01:00' }] }
    return {}
  }
  const module = createCdbModule(call as never)
  const logs = await module.detail?.({
    ...ctx(),
    id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1',
    region: 'ap-guangzhou',
    tab: '日志中心',
  })
  const data = logs?.extra?.tabData as { slowLogs?: Array<{ sql?: string; time?: string }>; errorLogs?: Array<{ sql?: string }> }
  assert.equal(data.slowLogs?.[0]?.sql, 'SELECT 1')
  assert.equal(data.slowLogs?.[0]?.time, '2024-01-01 00:00:00')
  assert.equal(data.errorLogs?.[0]?.sql, 'err')
  const slow = payloads.find((row) => row.action === 'DescribeSlowLogData')
  const errLog = payloads.find((row) => row.action === 'DescribeErrorLogData')
  assert.equal(typeof slow?.payload.StartTime, 'number')
  assert.equal(typeof slow?.payload.EndTime, 'number')
  assert.ok(Number.isInteger(slow?.payload.StartTime))
  assert.ok(Number.isInteger(slow?.payload.EndTime))
  assert.equal(typeof errLog?.payload.StartTime, 'number')
  assert.equal(typeof errLog?.payload.EndTime, 'number')
  const range = lastDayRange()
  assert.equal(typeof range.StartTime, 'number')
  assert.equal(typeof range.EndTime, 'number')
  assert.equal(range.EndTime - range.StartTime, 86400)
})

test('logs tab surfaces DescribeSlowLogData failure instead of fake empty g2.4', async () => {
  const call = async (action: string) => {
    if (action === 'DescribeDBInstances') return { Items: (fixture('cdb-list.json').Items as unknown[]).slice(0, 1) }
    if (action === 'DescribeSlowLogData') throw new TencentApiError('StartTime invalid', 'InvalidParameter')
    if (action === 'DescribeErrorLogData') return { Items: [{ Content: 'err', Timestamp: '2024-01-01 00:01:00' }] }
    return {}
  }
  const module = createCdbModule(call as never)
  const logs = await module.detail?.({
    ...ctx(),
    id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1',
    region: 'ap-guangzhou',
    tab: '日志中心',
  })
  const data = logs?.extra?.tabData as {
    slowLogs?: unknown[]
    errorLogs?: Array<{ sql?: string }>
    slowLogError?: string
    tabError?: string
  }
  assert.equal((data.slowLogs || []).length, 0)
  assert.ok(data.slowLogError)
  assert.match(String(data.tabError || ''), /慢日志/)
  assert.equal(data.errorLogs?.[0]?.sql, 'err')
  const client = src('src/client.js')
  assert.match(client, /tabData\.slowLogError/)
  assert.match(client, /tabData\.errorLogError/)
})

test('dmc.login prefers WAN and keeps password out of the result g3.1', async () => {
  clearDmcSessions()
  const pings: Array<{ host: string; port: number }> = []
  const driver: DmcDriver = {
    async ping(opts) { pings.push({ host: opts.host, port: opts.port }) },
    async query() { return { columns: [], rows: [] } },
  }
  const call = async (action: string) => {
    if (action === 'DescribeDBInstances') {
      return {
        Items: [{
          InstanceId: 'cdb-70zdmgg1',
          Vip: '10.0.1.12',
          Vport: 3306,
          WanStatus: 2,
          WanDomain: 'cdb-70zdmgg1.sql.tencentcdb.com',
          WanPort: 20407,
        }],
      }
    }
    return {}
  }
  const module = createCdbModule(call as never, driver)
  const logged = await module.execute?.('dmc.login', {
    region: 'ap-guangzhou',
    instanceId: 'cdb-70zdmgg1',
    user: 'root',
    password: 'OnlyInMemory#1',
    host: '10.0.1.12',
    port: 3306,
  }, ctx({ id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1' }))
  assert.equal(logged?.ok, true)
  assert.equal(pings[0]?.host, 'cdb-70zdmgg1.sql.tencentcdb.com')
  assert.equal(pings[0]?.port, 20407)
  if (logged && logged.ok) {
    assert.equal((logged.data as { viaWan?: boolean }).viaWan, true)
    assert.equal((logged.data as { password?: string }).password, undefined)
  }
  assert.equal(pickDmcEndpoint({ vip: '10.0.1.12', port: 3306, wanStatus: 2, wanDomain: 'wan.example', wanPort: 20407 }).host, 'wan.example')
})

test('dmc.login connection failure is not a generic cloud error g3.1', async () => {
  const driver: DmcDriver = {
    async ping() {
      const err = new Error('connect ECONNREFUSED 10.0.1.12:3306') as Error & { code: string }
      err.code = 'ECONNREFUSED'
      throw err
    },
    async query() { return { columns: [], rows: [] } },
  }
  const call = async (action: string) => {
    if (action === 'DescribeDBInstances') {
      return { Items: [{ InstanceId: 'cdb-70zdmgg1', Vip: '10.0.1.12', Vport: 3306, WanStatus: 0 }] }
    }
    return {}
  }
  const module = createCdbModule(call as never, driver)
  const logged = await module.execute?.('dmc.login', {
    region: 'ap-guangzhou',
    instanceId: 'cdb-70zdmgg1',
    user: 'root',
    password: 'x',
  }, ctx({ id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1' }))
  assert.equal(logged?.ok, false)
  if (logged && !logged.ok) {
    assert.match(logged.error, /未开外网/)
    assert.doesNotMatch(logged.error, /云厂商请求失败/)
  }
  assert.equal(isConnectError({ code: 'ETIMEDOUT', message: 'timeout' }), true)
  assert.match(dmcConnectHint({ wanOpen: false, viaWan: false }), /未开外网/)
  assert.equal(publicErrorMessage(new Error('未开外网：管理页仍可用，DMC 登录需插件主机可达实例内网，或先在管理页开启外网后再登录')), '未开外网：管理页仍可用，DMC 登录需插件主机可达实例内网，或先在管理页开启外网后再登录')
})

test('check.connect probes WAN as well as VIP g2.5', async () => {
  const module = createCdbModule((async () => ({})) as never)
  const result = await module.execute?.('check.connect', {
    region: 'ap-guangzhou',
    instanceId: 'cdb-70zdmgg1',
    host: '127.0.0.1',
    port: 1,
    wanDomain: '127.0.0.1',
    wanPort: 2,
  }, ctx({ id: 'tencent.cdb:ap-guangzhou:cdb-70zdmgg1', timeoutMs: 400 }))
  assert.equal(result?.ok, true)
  const data = result?.data as { inner?: { ok?: boolean }; outer?: { ok?: boolean } }
  assert.ok(data.inner)
  assert.ok(data.outer)
})

