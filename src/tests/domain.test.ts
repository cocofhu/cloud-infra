import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { createDomainModule, mapDomainItem, mapRecordItem, parseDomainRef, type DomainListItem, type RecordListItem } from '../providers/tencent/products/domain.js'

const dir = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => JSON.parse(readFileSync(join(dir, 'fixtures', name), 'utf8')) as Record<string, unknown>

test('mapDomainItem uses DNSPod DomainListItem fields', () => {
  const list = fixture('domain-list.json')
  const item = (list.DomainList as DomainListItem[])[0]
  const card = mapDomainItem(item)
  assert.equal(card.id, 'tencent.domain:12614766')
  assert.equal(card.title, 'dnspod.com')
  assert.equal(card.provider, 'tencent')
  assert.equal(card.kind, 'domain')
  assert.equal(card.status, 'error')
  assert.ok(card.badges?.includes('尊享版'))
  assert.equal(card.openLabel, '解析')
  assert.deepEqual(card.columns, [
    { label: 'DNS状态', value: '异常' },
    { label: '套餐', value: '尊享版' },
    { label: '记录数', value: '12' },
  ])
  assert.match(card.description, /prod/)
})

test('mapRecordItem maps host type value line', () => {
  const list = fixture('record-list.json')
  const records = (list.RecordList as RecordListItem[]).map(mapRecordItem)
  assert.equal(records[0].host, '@')
  assert.equal(records[0].type, 'NS')
  assert.equal(records[0].line, '默认')
  assert.equal(records[1].host, 'www')
  assert.equal(records[1].status, 'disable')
})

test('parseDomainRef reads module and numeric id', () => {
  assert.deepEqual(parseDomainRef('tencent.domain:12614766'), { moduleId: 'tencent.domain', domainId: 12614766 })
})

test('createDomainModule list and record actions talk DNSPod actions', async () => {
  const calls: Array<{ action: string; payload: unknown }> = []
  const call = async (action: string, payload: unknown) => {
    calls.push({ action, payload })
    if (action === 'DescribeDomainList') return fixture('domain-list.json')
    if (action === 'DescribeDomain') return { DomainInfo: (fixture('domain-list.json').DomainList as unknown[])[0] }
    if (action === 'DescribeRecordList') return fixture('record-list.json')
    return {}
  }
  const module = createDomainModule(call as never)
  const listed = await module.list({
    creds: { secretId: 'id', secretKey: 'key' },
    query: 'dnspod',
    offset: 0,
    limit: 12,
    timeoutMs: 5000,
  })
  assert.equal(listed.items[0].title, 'dnspod.com')
  assert.equal(listed.total, 1)
  const all = await module.list({
    creds: { secretId: 'id', secretKey: 'key' },
    query: '',
    offset: 0,
    limit: 12,
    timeoutMs: 5000,
  })
  assert.equal(all.total, 35)
  assert.equal(calls[0].action, 'DescribeDomainList')
  const detail = await module.detail?.({
    creds: { secretId: 'id', secretKey: 'key' },
    query: '',
    offset: 0,
    limit: 12,
    timeoutMs: 5000,
    id: 'tencent.domain:12614766',
    title: 'dnspod.com',
  })
  assert.equal(detail?.records?.length, 2)
  const describe = calls.find((row) => row.action === 'DescribeDomain')
  assert.equal((describe?.payload as { Domain?: string }).Domain, 'dnspod.com')
  const created = await module.execute?.('record.create', {
    domain: 'dnspod.com',
    host: 'www',
    type: 'A',
    value: '1.2.3.4',
  }, {
    creds: { secretId: 'id', secretKey: 'key' },
    query: '',
    offset: 0,
    limit: 12,
    timeoutMs: 5000,
    id: 'tencent.domain:12614766',
  })
  assert.equal(created?.ok, true)
  assert.equal(calls.some((row: { action: string }) => row.action === 'CreateRecord'), true)
  assert.equal(module.actions?.find((item) => item.id === 'record.delete')?.confirm, 'always')
})
