import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { withDefaults } from '../core/config-store.js'
import { registerModule } from '../core/registry.js'
import { handleApi } from '../host.js'
import { domainCall, TencentApiError } from '../providers/tencent/client.js'
import {
  createMyDomainModule,
  createRegistrarModule,
  tencentMyDomainModule,
  tencentRegistrarModule,
} from '../providers/tencent/products/registrar.js'

const dir = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => JSON.parse(readFileSync(join(dir, 'fixtures', name), 'utf8')) as Record<string, unknown>

function req(headers: Record<string, string | undefined>, opts: {
  method?: string
  remoteAddress?: string
  body?: string
} = {}): IncomingMessage {
  const chunks = opts.body ? [Buffer.from(opts.body)] : []
  return {
    method: opts.method || 'POST',
    url: '/cloud-infra',
    headers,
    socket: { remoteAddress: opts.remoteAddress || '203.0.113.8' },
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

function trusted(body: unknown): IncomingMessage {
  return req({
    host: '127.0.0.1:3091',
    origin: 'http://127.0.0.1:3091',
  }, { remoteAddress: '127.0.0.1', body: JSON.stringify(body) })
}

function mockCall(handler: (action: string, payload: unknown) => unknown) {
  const call = async (action: string, payload: unknown) => handler(action, payload)
  return call as typeof domainCall
}

test('handleApi rejects untrusted query and write, keeps meta public', async () => {
  const cfg = withDefaults()
  const blocked = res()
  await handleApi(req({ host: '127.0.0.1:3091' }, {
    body: JSON.stringify({ method: 'action', action: 'record.delete' }),
  }), blocked.response, cfg)
  assert.equal(blocked.out.status, 403)
  assert.match(blocked.out.body, /不受信任/)

  const getUrl = req({
    host: '127.0.0.1:3091',
    origin: 'http://127.0.0.1:3091',
  }, { method: 'GET', remoteAddress: '127.0.0.1' })
  getUrl.url = '/cloud-infra?method=action'
  const getAction = res()
  await handleApi(getUrl, getAction.response, cfg)
  assert.equal(getAction.out.status, 405)

  const meta = res()
  await handleApi(req({ host: '127.0.0.1:3091' }, {
    method: 'GET',
    body: '',
  }), meta.response, cfg)
  assert.equal(meta.out.status, 200)
  assert.match(meta.out.body, /"ok":true/)
})

test('handleApi action returns registrar business errors on HTTP 400', async () => {
  const call = mockCall((action, payload) => {
    if (action === 'CheckDomain') {
      const name = String((payload as { DomainName?: string }).DomainName)
      if (name.includes('hot')) return fixture('check-domain-premium.json')
      if (name.includes('taken')) return fixture('check-domain-taken.json')
      return { ...fixture('check-domain-available.json'), DomainName: name }
    }
    if (action === 'DescribeTemplateList') return fixture('template-list.json')
    if (action === 'DescribeDomainBaseInfo') return fixture('domain-base-info.json')
    if (action === 'CreateDomainBatch') throw new TencentApiError('balance not enough AKIDabcdefgh', 'ResourceInsufficient')
    return {}
  })
  registerModule(createRegistrarModule(call))
  registerModule(createMyDomainModule(call))
  const cfg = withDefaults({
    providers: { tencent: { secretId: 'id', secretKey: 'key', enabled: true } },
  })
  const post = async (moduleId: string, action: string, payload: Record<string, unknown>, id = '') => {
    const boxed = res()
    await handleApi(trusted({ method: 'action', moduleId, action, id, payload }), boxed.response, cfg)
    return { status: boxed.out.status, body: JSON.parse(boxed.out.body || '{}') as { ok?: boolean; error?: string } }
  }
  try {
    const empty = await post('tencent.registrar', 'order.create', { domains: [], agree: true, period: 1 })
    assert.equal(empty.status, 400)
    assert.equal(empty.body.error, '购物车为空，不能提交订单')

    const noAgree = await post('tencent.registrar', 'order.create', { domains: ['example.com'], agree: false, period: 1 })
    assert.equal(noAgree.status, 400)
    assert.equal(noAgree.body.error, '未勾选协议，不能提交订单')

    const premium = await post('tencent.registrar', 'order.create', { domains: ['hot.xyz'], agree: true, period: 1 })
    assert.equal(premium.status, 400)
    assert.equal(premium.body.error, 'hot.xyz 是溢价词，不可加购')

    const taken = await post('tencent.registrar', 'order.create', { domains: ['taken.cn'], agree: true, period: 1 })
    assert.equal(taken.status, 400)
    assert.equal(taken.body.error, 'taken.cn 已被注册')

    const locked = await post('tencent.my-domain', 'lock.transfer', { domain: 'acme.cn', enabled: true }, 'tencent.my-domain:domain-acme1')
    assert.equal(locked.status, 400)
    assert.equal(locked.body.error, '更新锁已开，不能改转移锁')

    const broke = await post('tencent.registrar', 'order.create', {
      domains: ['example.com'],
      agree: true,
      period: 1,
      templateId: 'tmpl-ok',
    })
    assert.equal(broke.status, 400)
    assert.equal(broke.body.error, '账户余额不足')
    assert.doesNotMatch(String(broke.body.error), /AKID/)
  } finally {
    registerModule(tencentRegistrarModule)
    registerModule(tencentMyDomainModule)
  }
})
