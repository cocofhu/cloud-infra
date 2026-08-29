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
  assert.equal(trustedUiRequest(req({ host: '127.0.0.1:3091', referer: 'http://127.0.0.1:3091/chat' })), true)
  assert.equal(trustedUiRequest(req({ host: '127.0.0.1:3091' }, '127.0.0.1')), true)
  assert.equal(trustedUiRequest(req({ host: '127.0.0.1:3091' }, '::ffff:127.0.0.1')), true)
  // 127.0.0.0/8 整段均为 loopback
  assert.equal(trustedUiRequest(req({ host: '127.0.0.2:3091' }, '127.0.0.2')), true)
})

test('trustedUiRequest rejects cross-origin and remote requests without origin', () => {
  assert.equal(trustedUiRequest(req({ host: '127.0.0.1:3091', origin: 'http://evil.example' })), false)
  assert.equal(trustedUiRequest(req({ host: '127.0.0.1:3091', origin: 'file://127.0.0.1:3091' })), false)
  assert.equal(trustedUiRequest(req({ host: '127.0.0.1:3091' }, '203.0.113.8')), false)
  assert.equal(trustedUiRequest(req({ origin: 'http://127.0.0.1:3091' })), false)
})

test('trustedUiRequest never trusts client-supplied x-forwarded-host', () => {
  // 远端攻击者伪造 x-forwarded-host 与 origin 一致时必须拒绝(原 CSRF 绕过)
  assert.equal(trustedUiRequest(req({
    host: '127.0.0.1:3091',
    'x-forwarded-host': 'attacker.example',
    origin: 'http://attacker.example',
  })), false)
  // 反代转发后 Host 被重写为内网地址:Origin 与 Host 不同源,拒绝
  assert.equal(trustedUiRequest(req({
    host: '127.0.0.1:3091',
    'x-forwarded-host': 'chat.example.com',
    origin: 'https://chat.example.com',
  })), false)
  // 即使 x-forwarded-host 恰好与 Host 一致也不影响判定(以 Host 为准,仍放行同源 UI)
  assert.equal(trustedUiRequest(req({
    host: '127.0.0.1:3091',
    'x-forwarded-host': '127.0.0.1:3091',
    origin: 'http://127.0.0.1:3091',
  })), true)
})

test('isPost and isLoopbackAddress helpers', () => {
  assert.equal(isPost({ method: 'POST' }), true)
  assert.equal(isPost({ method: 'GET' }), false)
  assert.equal(isLoopbackAddress('127.0.0.1'), true)
  assert.equal(isLoopbackAddress('127.0.0.2'), true)
  assert.equal(isLoopbackAddress('::1'), true)
  assert.equal(isLoopbackAddress('::ffff:127.0.0.1'), true)
  assert.equal(isLoopbackAddress('127.0.0.256'), false)
  assert.equal(isLoopbackAddress('203.0.113.8'), false)
})
