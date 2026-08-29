import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { withDefaults } from '../core/config-store.js'
import { registerModule } from '../core/registry.js'
import { handleApi, resolveModuleId } from '../host.js'
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

  const blockedSearch = res()
  await handleApi(req({ host: '127.0.0.1:3091' }, {
    body: JSON.stringify({ method: 'search', kind: 'cls' }),
  }), blockedSearch.response, cfg)
  assert.equal(blockedSearch.out.status, 403)

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
  assert.match(meta.out.body, /tencent\.cls/)
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

test('g1 readyModule fallback parses tencent.cos from resource id without moduleId', () => {
  assert.equal(resolveModuleId('tencent.cos', 'tencent.cos:ap-guangzhou:assets-1250000000'), 'tencent.cos')
  assert.equal(resolveModuleId('', 'tencent.cos:ap-guangzhou:assets-1250000000'), 'tencent.cos')
  assert.notEqual(resolveModuleId('', 'tencent.cos:ap-guangzhou:assets-1250000000'), 'tencent.cos:ap-guangzhou')
})

test('g2.3 handleApi keeps COS rename/folder-delete errors instead of 云厂商请求失败', async () => {
  registerModule({
    id: 'tencent.cos-err-passthrough',
    provider: 'tencent',
    kind: 'cos',
    title: '对象存储',
    implemented: true,
    async list() {
      return { items: [], total: 0, offset: 0, hasMore: false }
    },
    async execute(actionId) {
      if (actionId === 'object.rename') {
        return { ok: false, error: '已复制到新名称，但源对象删除失败，请手动删除源文件' }
      }
      if (actionId === 'folder.delete') {
        return { ok: false, error: '已删除 1 个对象，剩余 2 个未删尽，请重试' }
      }
      return { ok: false, error: '未知动作' }
    },
  })
  const cfg = withDefaults({
    providers: { tencent: { secretId: 'AKIDxxxxxxxx', secretKey: 'secret' } },
  })
  const headers = { host: '127.0.0.1:3091', origin: 'http://127.0.0.1:3091' }
  const renamed = res()
  await handleApi(req(headers, {
    remoteAddress: '127.0.0.1',
    body: JSON.stringify({
      method: 'action',
      moduleId: 'tencent.cos-err-passthrough',
      action: 'object.rename',
      id: 'tencent.cos:ap-guangzhou:assets-1250000000',
      payload: { key: 'a.txt', name: 'b.txt', region: 'ap-guangzhou', bucket: 'assets-1250000000' },
    }),
  }), renamed.response, cfg)
  assert.equal(renamed.out.status, 400)
  assert.match(renamed.out.body, /源对象删除失败/)
  assert.doesNotMatch(renamed.out.body, /云厂商请求失败/)

  const folder = res()
  await handleApi(req(headers, {
    remoteAddress: '127.0.0.1',
    body: JSON.stringify({
      method: 'action',
      moduleId: 'tencent.cos-err-passthrough',
      action: 'folder.delete',
      id: 'tencent.cos:ap-guangzhou:assets-1250000000',
      payload: { key: 'images/', region: 'ap-guangzhou', bucket: 'assets-1250000000' },
    }),
  }), folder.response, cfg)
  assert.equal(folder.out.status, 400)
  assert.match(folder.out.body, /未删尽/)
  assert.doesNotMatch(folder.out.body, /云厂商请求失败/)
})

test('handleApi query 响应包含 directItemId / notFoundQuery 字段', async () => {
  registerModule({
    id: 'tencent.cos',
    provider: 'tencent',
    kind: 'cos',
    title: '对象存储',
    implemented: true,
    async list(ctx) {
      const all = [
        {
          id: 'tencent.cos:ap-guangzhou:cloud-init-1251810746',
          moduleId: 'tencent.cos',
          provider: 'tencent',
          kind: 'cos',
          title: 'cloud-init-1251810746',
          description: '广州',
        },
        {
          id: 'tencent.cos:ap-guangzhou:assets-1250000000',
          moduleId: 'tencent.cos',
          provider: 'tencent',
          kind: 'cos',
          title: 'assets-1250000000',
          description: '广州',
        },
      ]
      const q = String(ctx.query || '').trim()
      return {
        items: q ? all.filter((item) => item.title.includes(q)) : all,
        total: q ? all.filter((item) => item.title.includes(q)).length : all.length,
        region: 'ap-guangzhou',
      }
    },
  })
  const cfg = withDefaults({
    providers: { tencent: { secretId: 'AKIDxxxxxxxx', secretKey: 'secret' } },
  })
  const headers = { host: '127.0.0.1:3091', origin: 'http://127.0.0.1:3091' }
  try {
    const hit = res()
    await handleApi(req(headers, {
      remoteAddress: '127.0.0.1',
      body: JSON.stringify({ method: 'query', kind: 'cos', query: 'cloud-init-1251810746', region: 'ap-guangzhou' }),
    }), hit.response, cfg)
    assert.equal(hit.out.status, 200)
    const hitBody = JSON.parse(hit.out.body || '{}')
    assert.equal(hitBody.ok, true)
    assert.equal(hitBody.directItemId, 'tencent.cos:ap-guangzhou:cloud-init-1251810746')
    assert.equal(hitBody.notFoundQuery, undefined)
    assert.equal(hitBody.items.length, 1)

    const miss = res()
    await handleApi(req(headers, {
      remoteAddress: '127.0.0.1',
      body: JSON.stringify({ method: 'query', kind: 'cos', query: 'no-such-bucket-xyz', region: 'ap-guangzhou' }),
    }), miss.response, cfg)
    assert.equal(miss.out.status, 200)
    const missBody = JSON.parse(miss.out.body || '{}')
    assert.equal(missBody.ok, true)
    assert.equal(missBody.notFoundQuery, 'no-such-bucket-xyz')
    assert.equal(missBody.directItemId, undefined)
    // 未命中回落：queryResources 以空 query 重拉一次，items 为该地域全量（f2 验收点）
    assert.equal(missBody.items.length, 2)
  } finally {
    // 恢复真实 cos 模块，避免影响其它用例
    const { tencentCosModule } = await import('../providers/tencent/products/cos.js')
    registerModule(tencentCosModule)
  }
})
