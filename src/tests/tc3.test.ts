import assert from 'node:assert/strict'
import test from 'node:test'
import { sha256Hex, tc3Authorization, utcDate } from '../providers/tencent/tc3.js'

test('sha256 of empty json object', () => {
  assert.equal(sha256Hex('{}'), '44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a')
})

test('utcDate is YYYY-MM-DD from unix timestamp', () => {
  assert.equal(utcDate(1551113065), '2019-02-25')
})

test('tc3Authorization is stable and well-formed', () => {
  const input = {
    secretId: 'test-secret-id',
    secretKey: 'test-secret-key',
    service: 'dnspod',
    host: 'dnspod.tencentcloudapi.com',
    action: 'DescribeDomainList',
    payload: '{}',
    timestamp: 1551113065,
  }
  const first = tc3Authorization(input)
  assert.equal(first, tc3Authorization(input))
  assert.match(first, /^TC3-HMAC-SHA256 Credential=test-secret-id\/2019-02-25\/dnspod\/tc3_request, SignedHeaders=content-type;host;x-tc-action, Signature=[0-9a-f]{64}$/)
  assert.notEqual(first, tc3Authorization({ ...input, secretKey: 'other' }))
})
