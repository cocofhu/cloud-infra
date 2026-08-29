import assert from 'node:assert/strict'
import { mkdtempSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { overlayPath, withDefaults } from '../core/config-store.js'
import { queryResources } from '../core/query.js'
import { createCosModule, mapBucketItem, parseCosRef } from '../providers/tencent/products/cos.js'
import type { CosClient } from '../providers/tencent/cos-client.js'

function fakeClient(calls: Array<{ op: string; args: unknown[] }>, overrides: Partial<CosClient> = {}): CosClient {
  const base: CosClient = {
    async listBuckets(region) {
      calls.push({ op: 'listBuckets', args: [region] })
      return [
        { name: 'assets-1250000000', region: 'ap-guangzhou', creationDate: '2024-03-12T10:21:08Z' },
        { name: 'cdn-1250000000', region: 'ap-guangzhou', creationDate: '2025-01-08T14:02:11Z' },
        { name: 'logs-1250000000', region: 'ap-beijing', creationDate: '2024-08-01T00:00:00Z' },
      ]
    },
    async getBucketAclLabel(bucket, region) {
      calls.push({ op: 'getBucketAclLabel', args: [bucket, region] })
      return '私有读写'
    },
    async createBucket(bucket, region) {
      calls.push({ op: 'createBucket', args: [bucket, region] })
    },
    async deleteBucket(bucket, region) {
      calls.push({ op: 'deleteBucket', args: [bucket, region] })
    },
    async listCurrent(bucket, region, prefix) {
      calls.push({ op: 'listCurrent', args: [bucket, region, prefix] })
      if (prefix === 'images/') {
        return {
          entries: [{ kind: 'file', name: 'logo.png', key: 'images/logo.png', size: 2048, storageClass: 'STANDARD_IA' }],
          isTruncated: false,
          keys: ['images/logo.png'],
        }
      }
      return {
        entries: [
          { kind: 'folder', name: 'images', key: 'images/' },
          { kind: 'file', name: 'readme.txt', key: 'readme.txt', size: 128, storageClass: 'STANDARD' },
        ],
        isTruncated: false,
        keys: ['readme.txt', 'images/'],
      }
    },
    async listAllKeys(bucket, region, prefix) {
      calls.push({ op: 'listAllKeys', args: [bucket, region, prefix] })
      if (prefix === 'images/') return ['images/a.png', 'images/b.png', 'images/']
      if (!prefix) return ['readme.txt', 'images/', 'images/a.png']
      return []
    },
    async putObject(bucket, region, key) {
      calls.push({ op: 'putObject', args: [bucket, region, key] })
    },
    async deleteObject(bucket, region, key) {
      calls.push({ op: 'deleteObject', args: [bucket, region, key] })
    },
    async copyObject(bucket, region, source, dest) {
      calls.push({ op: 'copyObject', args: [bucket, region, source, dest] })
    },
    async headObject(bucket, region, key) {
      calls.push({ op: 'headObject', args: [bucket, region, key] })
      if (key === 'readme.txt' || key === 'images/logo.png') {
        return {
          key,
          size: 10,
          storageClass: 'STANDARD',
          lastModified: '2025-02-01T00:00:00Z',
          url: `https://${bucket}.cos.${region}.myqcloud.com/${key}`,
        }
      }
      throw new Error('NoSuchKey')
    },
    presignGet(bucket, region, key) {
      calls.push({ op: 'presignGet', args: [bucket, region, key] })
      return `https://${bucket}.cos.${region}.myqcloud.com/${key}?q-signature=demo`
    },
  }
  return { ...base, ...overrides }
}

function ctx(extra: Record<string, unknown> = {}) {
  return {
    creds: { secretId: 'id', secretKey: 'key' },
    query: '',
    offset: 0,
    limit: 12,
    timeoutMs: 5000,
    ...extra,
  }
}

test('g1.1 g2.2 list requires a selected region and only maps that region', async () => {
  const calls: Array<{ op: string; args: unknown[] }> = []
  const module = createCosModule(() => fakeClient(calls))
  const missing = await module.list(ctx())
  assert.equal(missing.items.length, 0)
  assert.equal(missing.needsRegion, true)
  assert.equal(calls.some((row) => row.op === 'listBuckets'), false)
  const freeText = await module.list(ctx({ region: '广' }))
  assert.equal(freeText.items.length, 0)
  assert.equal(freeText.needsRegion, true)
  assert.equal(calls.some((row) => row.op === 'listBuckets'), false)
  const listed = await module.list(ctx({ region: 'ap-guangzhou' }))
  assert.equal(listed.items.length, 2)
  assert.equal(listed.needsRegion, undefined)
  assert.equal(listed.items.every((item) => item.kind === 'cos'), true)
  assert.equal(listed.items.some((item) => item.title === 'logs-1250000000'), false)
  assert.deepEqual(listed.items[0].columns?.map((col) => col.label), ['地域', '创建时间', '访问权限'])
  assert.equal(calls[0]?.args[0], 'ap-guangzhou')
})

test('g1.2 detail returns current prefix layer with short names and region', async () => {
  const calls: Array<{ op: string; args: unknown[] }> = []
  const module = createCosModule(() => fakeClient(calls))
  const root = await module.detail?.(ctx({
    id: 'tencent.cos:ap-guangzhou:assets-1250000000',
    title: 'assets-1250000000',
    region: 'ap-guangzhou',
    prefix: '',
  }))
  assert.equal(root?.entries?.[0]?.kind, 'folder')
  assert.equal(root?.entries?.[0]?.name, 'images')
  assert.equal(root?.region, 'ap-guangzhou')
  assert.equal(root?.bucket, 'assets-1250000000')
  const nested = await module.detail?.(ctx({
    id: 'tencent.cos:ap-guangzhou:assets-1250000000',
    region: 'ap-guangzhou',
    prefix: 'images/',
  }))
  assert.equal(nested?.entries?.length, 1)
  assert.equal(nested?.entries?.[0]?.name, 'logo.png')
  assert.equal(nested?.entries?.[0]?.name.includes('/'), false)
})

test('g2.2 create bucket payload uses prefilled region; empty bucket delete', async () => {
  const calls: Array<{ op: string; args: unknown[] }> = []
  const module = createCosModule(() => fakeClient(calls))
  const created = await module.execute?.('bucket.create', { name: 'new-1250000000', region: 'ap-guangzhou' }, ctx())
  assert.equal(created?.ok, true)
  assert.deepEqual(calls.find((row) => row.op === 'createBucket')?.args, ['new-1250000000', 'ap-guangzhou'])
  const nonempty = await module.execute?.('bucket.delete', {}, ctx({
    id: 'tencent.cos:ap-guangzhou:assets-1250000000',
    region: 'ap-guangzhou',
  }))
  assert.equal(nonempty?.ok, false)
  if (nonempty && !nonempty.ok) assert.match(nonempty.error, /先清空/)
  const emptyCalls: Array<{ op: string; args: unknown[] }> = []
  const emptyModule = createCosModule(() => fakeClient(emptyCalls, {
    async listAllKeys() {
      emptyCalls.push({ op: 'listAllKeys', args: [] })
      return []
    },
    async listCurrent() {
      return { entries: [], isTruncated: false, keys: [] }
    },
  }))
  const deleted = await emptyModule.execute?.('bucket.delete', { bucket: 'empty-1250000000', region: 'ap-guangzhou' }, ctx())
  assert.equal(deleted?.ok, true)
})

test('g2.3 upload folder rename delete and 15-minute presign stay on current prefix', async () => {
  const calls: Array<{ op: string; args: unknown[] }> = []
  const module = createCosModule(() => fakeClient(calls))
  const tooBig = await module.execute?.('object.upload', {
    name: 'big.bin',
    prefix: 'images/',
    region: 'ap-guangzhou',
    bucket: 'assets-1250000000',
    contentBase64: Buffer.alloc(20 * 1024 * 1024 + 1).toString('base64'),
  }, ctx())
  assert.equal(tooBig?.ok, false)
  if (tooBig && !tooBig.ok) assert.match(tooBig.error, /20MB/)
  const uploaded = await module.execute?.('object.upload', {
    name: 'logo.png',
    prefix: 'images/',
    region: 'ap-guangzhou',
    bucket: 'assets-1250000000',
    contentBase64: Buffer.from('hi').toString('base64'),
  }, ctx())
  assert.equal(uploaded?.ok, true)
  assert.equal(calls.find((row) => row.op === 'putObject')?.args[2], 'images/logo.png')
  const folder = await module.execute?.('folder.create', {
    name: 'docs',
    prefix: '',
    region: 'ap-guangzhou',
    bucket: 'assets-1250000000',
  }, ctx())
  assert.equal(folder?.ok, true)
  assert.equal(calls.some((row) => row.op === 'putObject' && row.args[2] === 'docs/'), true)
  const renamed = await module.execute?.('object.rename', {
    key: 'readme.txt',
    name: 'note.txt',
    region: 'ap-guangzhou',
    bucket: 'assets-1250000000',
  }, ctx())
  assert.equal(renamed?.ok, true)
  assert.deepEqual(calls.find((row) => row.op === 'copyObject')?.args.slice(2), ['readme.txt', 'note.txt'])
  const noRename = await module.execute?.('object.rename', {
    key: 'images/',
    name: 'pics',
    region: 'ap-guangzhou',
    bucket: 'assets-1250000000',
  }, ctx())
  assert.equal(noRename?.ok, false)
  const signed = await module.execute?.('object.presign', {
    key: 'readme.txt',
    region: 'ap-guangzhou',
    bucket: 'assets-1250000000',
  }, ctx())
  assert.equal(signed?.ok, true)
  if (signed?.ok) {
    assert.match(String(signed.data?.url || ''), /cos\.ap-guangzhou\.myqcloud.com/)
    assert.equal(signed.data?.expiresSec, 900)
  }
  const removed = await module.execute?.('folder.delete', {
    key: 'images/',
    region: 'ap-guangzhou',
    bucket: 'assets-1250000000',
  }, ctx())
  assert.equal(removed?.ok, true)
  const listed = calls.filter((row) => row.op === 'listAllKeys')
  assert.equal(listed.length >= 1, true)
  assert.equal(calls.filter((row) => row.op === 'deleteObject' && String(row.args[2]).startsWith('images/')).length, 3)
})

test('g1.3 action and region change do not write overlay', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cloud-infra-cos-'))
  const prev = process.env.DSH_HOME
  process.env.DSH_HOME = dir
  try {
    const calls: Array<{ op: string; args: unknown[] }> = []
    const module = createCosModule(() => fakeClient(calls))
    await module.list(ctx({ region: 'ap-shanghai' }))
    await module.execute?.('object.delete', {
      key: 'readme.txt',
      region: 'ap-guangzhou',
      bucket: 'assets-1250000000',
    }, ctx())
    assert.equal(existsSync(overlayPath()), false)
    const { createRegistry } = await import('../core/registry.js')
    const source = createRegistry()
    source.registerProvider({
      id: 'tencent',
      title: '腾讯云',
      fields: [
        { key: 'secretId', label: 'SecretId' },
        { key: 'secretKey', label: 'SecretKey' },
      ],
    })
    source.registerModule(createCosModule(() => fakeClient(calls)))
    const cfg = withDefaults({
      providers: { tencent: { secretId: 'id', secretKey: 'key' } },
    })
    const result = await queryResources({ kind: 'cos', region: 'not-real' }, cfg, undefined, source)
    assert.equal(result.items.length, 0)
    assert.equal(result.needsRegion, true)
    assert.equal(result.errors.length, 0)
    assert.equal(existsSync(overlayPath()), false)
  } finally {
    process.env.DSH_HOME = prev
    rmSync(dir, { recursive: true, force: true })
  }
})

test('g1.1 parseCosRef and mapBucketItem keep console columns', () => {
  assert.deepEqual(parseCosRef('tencent.cos:ap-guangzhou:assets-1250000000'), {
    moduleId: 'tencent.cos',
    region: 'ap-guangzhou',
    bucket: 'assets-1250000000',
  })
  const card = mapBucketItem({ name: 'assets-1250000000', region: 'ap-guangzhou', creationDate: '2024-03-12T10:21:08Z' }, 'tencent.cos', '私有读写')
  assert.equal(card.kind, 'cos')
  assert.equal(card.openLabel, '文件')
  assert.equal(card.columns?.[2]?.value, '私有读写')
})

test('g1.1 queryResources kind=cos without region never hits GetService', async () => {
  const { createRegistry } = await import('../core/registry.js')
  const { renderQuery } = await import('../core/query.js')
  const source = createRegistry()
  source.registerProvider({
    id: 'tencent',
    title: '腾讯云',
    fields: [
      { key: 'secretId', label: 'SecretId' },
      { key: 'secretKey', label: 'SecretKey' },
    ],
  })
  const calls: Array<{ op: string; args: unknown[] }> = []
  source.registerModule(createCosModule(() => fakeClient(calls)))
  const cfg = withDefaults({
    providers: { tencent: { secretId: 'id', secretKey: 'key' } },
  })
  const missing = await queryResources({ kind: 'cos' }, cfg, undefined, source)
  assert.equal(missing.items.length, 0)
  assert.equal(missing.kind, 'cos')
  assert.equal(missing.needsRegion, true)
  assert.equal(missing.errors.length, 0)
  assert.equal(calls.length, 0)
  assert.match(renderQuery(missing), /请输入并选择地域/)
  assert.match(renderQuery(missing), /Ask question/)
  assert.doesNotMatch(renderQuery(missing), /缺少合法地域/)
  const ok = await queryResources({ kind: 'cos', region: 'ap-guangzhou' }, cfg, undefined, source)
  assert.equal(ok.items.length, 2)
  assert.equal(ok.needsRegion, undefined)
  assert.equal(calls[0]?.op, 'listBuckets')
})
