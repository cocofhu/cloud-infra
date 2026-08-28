import assert from 'node:assert/strict'
import type { IncomingMessage, ServerResponse } from 'node:http'
import test from 'node:test'
import { handleApi } from '../host.js'
import { withDefaults } from '../core/config-store.js'

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
