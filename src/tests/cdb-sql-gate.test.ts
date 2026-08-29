import assert from 'node:assert/strict'
import test from 'node:test'
import { createCdbModule, type DmcDriver } from '../providers/tencent/products/cdb.js'
import { clearDmcSessions, getDmcSession } from '../providers/tencent/dmc-session.js'

// 回归:g2 审查 — dmc.sql 写语句必须显式 confirmed,skipConfirm 不得放行 UPDATE/INSERT

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

async function login(module: ReturnType<typeof createCdbModule>) {
  await module.execute?.('dmc.login', {
    region: 'ap-guangzhou',
    instanceId: 'cdb-gate1',
    user: 'root',
    password: 'Gate#1',
    host: '10.0.0.9',
    port: 3306,
  }, ctx({ id: 'tencent.cdb:ap-guangzhou:cdb-gate1' }))
}

test('dmc.sql 读语句无需 confirmed,写语句必须显式 confirmed', async () => {
  clearDmcSessions()
  const ran: string[] = []
  const driver: DmcDriver = {
    async ping() {},
    async query(opts) { ran.push(opts.sql); return { columns: ['ok'], rows: [[1]] } },
  }
  const module = createCdbModule((async () => ({})) as never, driver)
  await login(module)
  assert.ok(getDmcSession('cdb-gate1', 'ap-guangzhou'))

  const read = await module.execute?.('dmc.sql', { region: 'ap-guangzhou', instanceId: 'cdb-gate1', sql: 'SELECT 1' }, ctx())
  assert.equal(read?.ok, true)

  const write = await module.execute?.('dmc.sql', { region: 'ap-guangzhou', instanceId: 'cdb-gate1', sql: 'UPDATE t SET a=1' }, ctx())
  assert.equal(write?.ok, false)
  assert.match(String(write && 'error' in write ? write.error : ''), /confirmed/)
  assert.equal(ran.filter((sql) => /UPDATE/i.test(sql)).length, 0)

  const confirmed = await module.execute?.('dmc.sql', { region: 'ap-guangzhou', instanceId: 'cdb-gate1', sql: 'UPDATE t SET a=1', confirmed: true }, ctx())
  assert.equal(confirmed?.ok, true)
  assert.equal(ran.filter((sql) => /UPDATE/i.test(sql)).length, 1)
})

test('dmc.row.write insert 空 values 直接报参数错误', async () => {
  clearDmcSessions()
  const driver: DmcDriver = {
    async ping() {},
    async query() { return { columns: [], rows: [] } },
  }
  const module = createCdbModule((async () => ({})) as never, driver)
  await login(module)
  const res = await module.execute?.('dmc.row.write', {
    region: 'ap-guangzhou', instanceId: 'cdb-gate1', database: 'app', table: 't', op: 'insert', values: {},
  }, ctx())
  assert.equal(res?.ok, false)
  assert.match(String(res && 'error' in res ? res.error : ''), /缺少写入字段/)
})
