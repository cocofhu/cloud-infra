import assert from 'node:assert/strict'
import test from 'node:test'
import { sha256Hex, tc3Authorization, tc3Headers, utcDate } from '../providers/tencent/tc3.js'

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

test('tc3Headers 固定请求中文返回,且语言头不进签名', () => {
  const input = {
    secretId: 'test-secret-id',
    secretKey: 'test-secret-key',
    service: 'cvm',
    host: 'cvm.tencentcloudapi.com',
    action: 'DescribeZones',
    payload: '{}',
    timestamp: 1551113065,
    version: '2017-03-12',
    region: 'ap-guangzhou',
  }
  const headers = tc3Headers(input)
  // 不传该头时云 API 会按账号默认语言返回,可用区列会出现 "Guangzhou Zone 3" 这类英文
  assert.equal(headers['x-tc-language'], 'zh-CN')
  assert.match(headers.authorization, /SignedHeaders=content-type;host;x-tc-action,/)
  assert.equal(headers.authorization, tc3Authorization(input))
})
