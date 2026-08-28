import assert from 'node:assert/strict'
import type { IncomingMessage } from 'node:http'
import test from 'node:test'
import { isLoopbackAddress, isPost, trustedUiRequest } from '../core/trusted-request.js'

function req(
  headers: Record<string, string | undefined>,
  remoteAddress = '203.0.113.8',
  method = 'POST',
): Pick<IncomingMessage, 'headers' | 'socket' | 'method'> {
  return { headers, socket: { remoteAddress }, method } as Pick<IncomingMessage, 'headers' | 'socket' | 'method'>
}

test('trustedUiRequest accepts same-origin UI and loopback curl', () => {
  assert.equal(trustedUiRequest(req({ host: '127.0.0.1:3091', origin: 'http://127.0.0.1:3091' })), true)
  assert.equal(trustedUiRequest(req({
    host: '127.0.0.1:3091',
    'x-forwarded-host': 'chat.example.com',
    origin: 'https://chat.example.com',
  })), true)
  assert.equal(trustedUiRequest(req({ host: '127.0.0.1:3091', referer: 'http://127.0.0.1:3091/chat' })), true)
  assert.equal(trustedUiRequest(req({ host: '127.0.0.1:3091' }, '127.0.0.1')), true)
  assert.equal(trustedUiRequest(req({ host: '127.0.0.1:3091' }, '::ffff:127.0.0.1')), true)
})

test('trustedUiRequest rejects cross-origin and remote requests without origin', () => {
  assert.equal(trustedUiRequest(req({ host: '127.0.0.1:3091', origin: 'http://evil.example' })), false)
  assert.equal(trustedUiRequest(req({ host: '127.0.0.1:3091', origin: 'file://127.0.0.1:3091' })), false)
  assert.equal(trustedUiRequest(req({ host: '127.0.0.1:3091' }, '203.0.113.8')), false)
  assert.equal(trustedUiRequest(req({ origin: 'http://127.0.0.1:3091' })), false)
})

test('isPost and isLoopbackAddress helpers', () => {
  assert.equal(isPost({ method: 'POST' }), true)
  assert.equal(isPost({ method: 'GET' }), false)
  assert.equal(isLoopbackAddress('127.0.0.1'), true)
  assert.equal(isLoopbackAddress('::1'), true)
  assert.equal(isLoopbackAddress('203.0.113.8'), false)
})
