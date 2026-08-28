import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import {
  AGREEMENT_URL,
  POPULAR_TLDS,
  availabilityAction,
  availabilityKeyword,
  batchStatusLabel,
  checkTargets,
  clampPeriod,
  createMyDomainModule,
  createRegistrarModule,
  filterOwned,
  mapCheckDomain,
  mapOwnedDomain,
  maxPeriodYears,
  normalizeKeyword,
  type CheckDomainResult,
  type DomainListRow,
} from '../providers/tencent/products/registrar.js'
import { domainCall } from '../providers/tencent/client.js'

const dir = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => JSON.parse(readFileSync(join(dir, 'fixtures', name), 'utf8')) as Record<string, unknown>

const ctx = {
  creds: { secretId: 'id', secretKey: 'key' },
  query: '',
  offset: 0,
  limit: 12,
  timeoutMs: 5000,
}

function mockCall(handler: (action: string, payload: unknown) => unknown) {
  const calls: Array<{ action: string; payload: unknown }> = []
  const call = async (action: string, payload: unknown) => {
    calls.push({ action, payload })
    return handler(action, payload)
  }
  return { calls, call: call as typeof domainCall }
}

test('g1.1 domainCall targets Domain API 2018-08-08', () => {
  const src = readFileSync(join(dir, '../providers/tencent/client.js'), 'utf8')
  assert.match(src, /export function domainCall/)
  assert.match(src, /host:\s*['"]domain\.tencentcloudapi\.com['"]/)
  assert.match(src, /version:\s*['"]2018-08-08['"]/)
  assert.match(src, /service:\s*['"]domain['"]/)
})

test('g1.2 empty card search returns no rows; bare name fans out popular TLDs', async () => {
  assert.deepEqual(checkTargets(''), [])
  assert.deepEqual(checkTargets('   '), [])
  assert.deepEqual(checkTargets('example'), POPULAR_TLDS.map((tld) => `example${tld}`))
  assert.deepEqual(checkTargets('Example.COM'), ['example.com'])
  assert.equal(normalizeKeyword('https://Example.com/path'), 'example.com')

  const { calls, call } = mockCall((action, payload) => {
    assert.equal(action, 'CheckDomain')
    const name = String((payload as { DomainName?: string }).DomainName)
    if (name.endsWith('.cn')) return fixture('check-domain-taken.json')
    if (name.endsWith('.xyz')) return fixture('check-domain-premium.json')
    return { ...fixture('check-domain-available.json'), DomainName: name }
  })
  const module = createRegistrarModule(call)
  const empty = await module.list({ ...ctx, query: '' })
  assert.equal(empty.items.length, 0)
  assert.equal(calls.length, 0)

  const listed = await module.list({ ...ctx, query: 'example' })
  assert.equal(listed.items.length, POPULAR_TLDS.length)
  assert.equal(calls.filter((row) => row.action === 'CheckDomain').length, POPULAR_TLDS.length)
  const com = listed.items.find((item) => item.title === 'example.com')
  assert.equal(com?.openLabel, '立即加购')
  assert.equal(com?.columns?.find((col) => col.label === '状态')?.value, '未注册')
  const cn = listed.items.find((item) => item.title === 'taken.cn' || item.title.endsWith('.cn'))
  assert.ok(cn)
  assert.equal(cn?.openLabel, '')
  assert.match(String(cn?.columns?.find((col) => col.label === '状态')?.value), /已被注册/)
})

test('g1.2 full domain is one CheckDomain row; premium cannot 立即加购', () => {
  const available = mapCheckDomain(fixture('check-domain-available.json') as CheckDomainResult)
  assert.equal(available.kind, 'registrar')
  assert.equal(available.openLabel, '立即加购')
  assert.equal(available.extras?.available, true)
  assert.equal(available.extras?.actionHint, '立即加购')

  const taken = mapCheckDomain(fixture('check-domain-taken.json') as CheckDomainResult)
  assert.equal(availabilityKeyword(fixture('check-domain-taken.json') as CheckDomainResult), 'taken')
  assert.equal(taken.openLabel, '')
  assert.equal(taken.extras?.actionHint, '已被注册')

  const premium = mapCheckDomain(fixture('check-domain-premium.json') as CheckDomainResult)
  assert.equal(availabilityAction('premium'), '溢价词不可加购')
  assert.equal(premium.openLabel, '')
  assert.equal(premium.extras?.premium, true)
  assert.equal(premium.extras?.available, false)
})

test('g1.3 cart order rejects empty/no-agree/premium and always PayMode=1', async () => {
  const { calls, call } = mockCall((action, payload) => {
    if (action === 'CheckDomain') {
      const name = String((payload as { DomainName?: string }).DomainName)
      if (name.includes('hot')) return fixture('check-domain-premium.json')
      if (name.includes('taken')) return fixture('check-domain-taken.json')
      return { ...fixture('check-domain-available.json'), DomainName: name }
    }
    if (action === 'DescribeTemplateList') return fixture('template-list.json')
    if (action === 'CreateDomainBatch') return { LogId: 318 }
    if (action === 'CheckBatchStatus') return { StatusSet: [{ LogId: 318, Status: 'doing' }] }
    return {}
  })
  const module = createRegistrarModule(call)

  const empty = await module.execute?.('order.create', { domains: [], agree: true, period: 1 }, ctx)
  assert.equal(empty?.ok, false)
  if (!empty?.ok) assert.match(empty.error, /购物车为空/)

  const noAgree = await module.execute?.('order.create', { domains: ['example.com'], agree: false, period: 1 }, ctx)
  assert.equal(noAgree?.ok, false)
  if (!noAgree?.ok) assert.match(noAgree.error, /未勾选协议/)

  const premium = await module.execute?.('order.create', { domains: ['hot.xyz'], agree: true, period: 1 }, ctx)
  assert.equal(premium?.ok, false)
  if (!premium?.ok) assert.match(premium.error, /溢价词/)

  const created = await module.execute?.('order.create', {
    domains: ['example.com', 'brand.net'],
    agree: true,
    period: 1,
    templateId: 'tmpl-ok',
    autoRenew: true,
    updateLock: true,
    transferLock: false,
  }, ctx)
  assert.equal(created?.ok, true)
  const batch = calls.find((row) => row.action === 'CreateDomainBatch')
  const body = batch?.payload as {
    PayMode?: number
    Period?: number
    Domains?: string[]
    TemplateId?: string
    AutoRenewFlag?: number
    UpdateProhibition?: number
  }
  assert.equal(body.PayMode, 1)
  assert.equal(body.Period, 1)
  assert.deepEqual(body.Domains, ['example.com', 'brand.net'])
  assert.equal(body.TemplateId, 'tmpl-ok')
  assert.equal(body.AutoRenewFlag, 1)
  assert.equal(body.UpdateProhibition, 1)
  if (created?.ok) {
    assert.equal(created.data?.payMode, 1)
    assert.equal(created.data?.statusLabel, '进行中')
    assert.match(String(created.data?.hint || ''), /我的域名/)
  }

  assert.equal(maxPeriodYears(['brand.co']), 5)
  assert.equal(clampPeriod(10, ['brand.co']), 5)
  assert.equal(clampPeriod(1, ['brand.com']), 1)
})

test('g1.3 order.preview returns approved templates and agreement link', async () => {
  const { call } = mockCall((action, payload) => {
    if (action === 'CheckDomain') return { ...fixture('check-domain-available.json'), DomainName: (payload as { DomainName?: string }).DomainName }
    if (action === 'DescribeTemplateList') return fixture('template-list.json')
    return {}
  })
  const module = createRegistrarModule(call)
  const preview = await module.execute?.('order.preview', { domains: ['example.com'], agree: true, period: 2 }, ctx)
  assert.equal(preview?.ok, true)
  if (preview?.ok) {
    const templates = preview.data?.templates as Array<{ templateId: string }>
    assert.equal(templates.length, 1)
    assert.equal(templates[0].templateId, 'tmpl-ok')
    assert.equal(preview.data?.agreementUrl, AGREEMENT_URL)
    assert.equal(preview.data?.payMode, 1)
    assert.equal(preview.data?.total, 70)
    assert.match(String(preview.data?.payHint || ''), /账户余额/)
  }
})

test('g1.4 my-domain filters by card keyword and serves 基本信息/域名安全', async () => {
  const { calls, call } = mockCall((action) => {
    if (action === 'DescribeDomainNameList') return fixture('owned-domain-list.json')
    if (action === 'DescribeDomainBaseInfo') return fixture('domain-base-info.json')
    if (action === 'SetDomainAutoRenew') return {}
    if (action === 'UpdateProhibitionBatch' || action === 'TransferProhibitionBatch') return { LogId: 54 }
    return {}
  })
  const module = createMyDomainModule(call)
  const listed = await module.list({ ...ctx, query: 'acme' })
  assert.equal(listed.total, 1)
  assert.equal(listed.items[0].title, 'acme.cn')
  assert.equal(listed.items[0].openLabel, '管理')
  assert.equal(listed.items[0].columns?.find((col) => col.label === '自动续费')?.value, '开')

  const none = await module.list({ ...ctx, query: 'no-such-name' })
  assert.equal(none.items.length, 0)
  assert.equal(none.total, 0)

  const all = await module.list({ ...ctx, query: '' })
  assert.equal(all.total, 2)

  const card = mapOwnedDomain((fixture('owned-domain-list.json').DomainSet as DomainListRow[])[0])
  assert.equal(card.kind, 'my-domain')
  assert.equal(filterOwned(fixture('owned-domain-list.json').DomainSet as DomainListRow[], 'OTHER').length, 1)

  const detail = await module.detail?.({ ...ctx, id: 'tencent.my-domain:domain-acme1', title: 'acme.cn' })
  assert.ok(detail?.fields.some((row) => row.label === '禁止更新锁' && row.value === '开'))
  assert.ok(detail?.fields.some((row) => row.label === '禁止转移锁' && row.value === '关'))
  assert.equal(detail?.card.extras?.updateLock, true)

  const renew = await module.execute?.('autorenew.set', { domainId: 'domain-acme1', autoRenew: true }, {
    ...ctx,
    id: 'tencent.my-domain:domain-acme1',
  })
  assert.equal(renew?.ok, true)
  const renewCall = calls.find((row) => row.action === 'SetDomainAutoRenew')
  assert.deepEqual(renewCall?.payload, { DomainId: 'domain-acme1', AutoRenew: 1 })

  const blocked = await module.execute?.('lock.transfer', {
    domain: 'acme.cn',
    enabled: true,
    updateLock: true,
  }, { ...ctx, id: 'tencent.my-domain:domain-acme1' })
  assert.equal(blocked?.ok, false)
  if (!blocked?.ok) assert.match(blocked.error, /更新锁已开/)

  const lock = await module.execute?.('lock.update', { domain: 'acme.cn', enabled: true }, {
    ...ctx,
    id: 'tencent.my-domain:domain-acme1',
  })
  assert.equal(lock?.ok, true)
  assert.equal(calls.some((row) => row.action === 'UpdateProhibitionBatch'), true)
})

test('g1.4 batch status labels stay async and never pretend WHOIS is instant', () => {
  assert.equal(batchStatusLabel('doing'), '进行中')
  assert.equal(batchStatusLabel('success'), '成功')
  assert.equal(batchStatusLabel('failed'), '失败')
  assert.equal(batchStatusLabel('pending'), '已提交')
})
