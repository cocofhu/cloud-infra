import assert from 'node:assert/strict'
import type { IncomingMessage, ServerResponse } from 'node:http'
import test from 'node:test'
import { handleApi, resolveModuleId } from '../host.js'
import { withDefaults } from '../core/config-store.js'
import { registerModule } from '../core/registry.js'

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
