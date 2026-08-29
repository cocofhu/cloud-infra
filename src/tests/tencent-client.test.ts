import assert from 'node:assert/strict'
import test from 'node:test'
import { callTencentApi, cvmCall, dnspodCall, lighthouseCall } from '../providers/tencent/client.js'

function fakeFetch(capture: { headers?: Record<string, string>; url?: string }): typeof fetch {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    capture.url = String(url)
    capture.headers = init?.headers as Record<string, string> | undefined
    return {
      ok: true,
      status: 200,
      json: async () => ({ Response: { RequestId: 'req-1', ok: true } }),
    } as Response
  }) as typeof fetch
}

test('callTencentApi sends x-tc-region when region is set', async () => {
  const capture: { headers?: Record<string, string> } = {}
  await callTencentApi({
    service: 'cvm',
    host: 'cvm.tencentcloudapi.com',
    version: '2017-03-12',
    action: 'DescribeInstances',
    region: 'ap-shanghai',
    secretId: 'id',
    secretKey: 'key',
    timeoutMs: 5000,
    timestamp: 1551113065,
    fetchImpl: fakeFetch(capture),
  })
  assert.equal(capture.headers?.['x-tc-region'], 'ap-shanghai')
  assert.equal(capture.headers?.['x-tc-version'], '2017-03-12')
})

test('dnspodCall does not send x-tc-region', async () => {
  const capture: { headers?: Record<string, string> } = {}
  await dnspodCall('DescribeDomainList', {}, { secretId: 'id', secretKey: 'key' }, {
    timeoutMs: 5000,
    fetchImpl: fakeFetch(capture),
  })
  assert.equal(capture.headers?.['x-tc-region'], undefined)
  assert.equal(capture.headers?.['x-tc-version'], '2021-03-23')
})

test('lighthouseCall and cvmCall pin product version and pass region', async () => {
  const lh: { headers?: Record<string, string>; url?: string } = {}
  await lighthouseCall('DescribeRegions', {}, { secretId: 'id', secretKey: 'key' }, {
    timeoutMs: 5000,
    region: 'ap-guangzhou',
    fetchImpl: fakeFetch(lh),
  })
  assert.equal(lh.url, 'https://lighthouse.tencentcloudapi.com')
  assert.equal(lh.headers?.['x-tc-version'], '2020-03-24')
  assert.equal(lh.headers?.['x-tc-region'], 'ap-guangzhou')
  assert.equal(lh.headers?.['x-tc-action'], 'DescribeRegions')

  const cvm: { headers?: Record<string, string>; url?: string } = {}
  await cvmCall('DescribeInstances', {}, { secretId: 'id', secretKey: 'key' }, {
    timeoutMs: 5000,
    region: 'ap-beijing',
    fetchImpl: fakeFetch(cvm),
  })
  assert.equal(cvm.url, 'https://cvm.tencentcloudapi.com')
  assert.equal(cvm.headers?.['x-tc-version'], '2017-03-12')
  assert.equal(cvm.headers?.['x-tc-region'], 'ap-beijing')
})
