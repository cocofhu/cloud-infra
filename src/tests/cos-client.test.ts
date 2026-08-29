import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import {
  aclLabelFromXml,
  bucketHost,
  buildFormatString,
  copySourceHeader,
  createCosClient,
  encodedObjectPath,
  parseListPage,
  presignCosUrl,
  shortName,
  signCosRequest,
} from '../providers/tencent/cos-client.js'

const dir = dirname(fileURLToPath(import.meta.url))
const xml = (name: string) => readFileSync(join(dir, 'fixtures', name), 'utf8')

test('g2.1 object request host contains the bucket region', () => {
  assert.equal(bucketHost('assets-1250000000', 'ap-guangzhou'), 'assets-1250000000.cos.ap-guangzhou.myqcloud.com')
  const url = presignCosUrl({
    method: 'GET',
    host: bucketHost('assets-1250000000', 'ap-guangzhou'),
    path: '/images/logo.png',
    creds: { secretId: 'AKIDxxxxxxxx', secretKey: 'secret' },
    timestamp: 1700000000,
    expiresSec: 900,
  })
  assert.match(url, /assets-1250000000\.cos\.ap-guangzhou\.myqcloud.com/)
  assert.match(url, /q-sign-algorithm=sha1/)
  assert.match(url, /q-signature=/)
})

test('g2.1 HMAC-SHA1 format string is stable', () => {
  const built = buildFormatString({
    method: 'GET',
    path: '/testfile',
    headers: { host: 'testbucket-1250000000.cos.ap-guangzhou.myqcloud.com' },
  })
  assert.equal(built.headerList, 'host')
  assert.match(built.formatString, /^get\n\/testfile\n\nhost=/)
  const signed = signCosRequest({
    method: 'GET',
    path: '/testfile',
    headers: { host: 'testbucket-1250000000.cos.ap-guangzhou.myqcloud.com' },
    secretId: 'AKIDxxxxxxxx',
    secretKey: 'secret',
    start: 1480932292,
    end: 1481012292,
  })
  assert.match(signed.authorization, /q-sign-algorithm=sha1/)
  assert.match(signed.authorization, /q-ak=AKIDxxxxxxxx/)
  assert.match(signed.authorization, /q-signature=[0-9a-f]{40}/)
})

test('g2.3 list page maps folders first and short names only', () => {
  const root = parseListPage(xml('cos-list.xml'), '')
  assert.equal(root.entries[0]?.kind, 'folder')
  assert.equal(root.entries[0]?.name, 'images')
  assert.equal(root.entries[0]?.key, 'images/')
  assert.equal(root.entries.some((item) => item.key === 'images/'), true)
  const file = root.entries.find((item) => item.kind === 'file')
  assert.equal(file?.name, 'readme.txt')
  assert.equal(file?.key, 'readme.txt')
  const nested = parseListPage(xml('cos-list-nested.xml'), 'images/')
  assert.equal(nested.entries.length, 1)
  assert.equal(nested.entries[0]?.name, 'logo.png')
  assert.equal(nested.entries[0]?.name.includes('/'), false)
  assert.equal(shortName('images/logo.png', 'images/'), 'logo.png')
})

test('g2.2 access permission label is read-only ACL mapping', () => {
  assert.equal(aclLabelFromXml('<AccessControlPolicy></AccessControlPolicy>'), '私有读写')
  assert.equal(aclLabelFromXml(`
    <AccessControlPolicy>
      <Grant><URI>http://cam.qcloud.com/groups/global/AllUsers</URI><Permission>READ</Permission></Grant>
    </AccessControlPolicy>
  `), '公有读私有写')
})

test('g2.1 copyObject x-cos-copy-source uses regional host and encoded object key', async () => {
  assert.equal(
    copySourceHeader('assets-1250000000', 'ap-guangzhou', 'folder/中文.txt'),
    'assets-1250000000.cos.ap-guangzhou.myqcloud.com/folder/%E4%B8%AD%E6%96%87.txt',
  )
  assert.equal(
    copySourceHeader('assets-1250000000', 'ap-guangzhou', '/readme.txt'),
    'assets-1250000000.cos.ap-guangzhou.myqcloud.com/readme.txt',
  )
  const recorded: Array<{ url: string; source?: string }> = []
  const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
    const headers = (init?.headers || {}) as Record<string, string>
    recorded.push({ url: String(url), source: headers['x-cos-copy-source'] })
    return new Response('<CopyObjectResult><ETag>"abc"</ETag></CopyObjectResult>', {
      status: 200,
      headers: { 'content-type': 'application/xml' },
    })
  }) as typeof fetch
  const client = createCosClient({ secretId: 'AKIDxxxxxxxx', secretKey: 'secret' }, fetchImpl)
  await client.copyObject('assets-1250000000', 'ap-guangzhou', 'folder/中文.txt', 'folder/new.txt', { timeoutMs: 5000 })
  assert.equal(recorded[0]?.source, 'assets-1250000000.cos.ap-guangzhou.myqcloud.com/folder/%E4%B8%AD%E6%96%87.txt')
  assert.doesNotMatch(recorded[0]?.source || '', /^\/assets-1250000000\//)
  assert.match(recorded[0]?.url || '', /\/folder\/new\.txt/)
})

test('g2.1 request URL and signature pathname share encodedObjectPath for Chinese keys', async () => {
  const path = encodedObjectPath('/文档/说明.txt')
  assert.equal(path, '/%E6%96%87%E6%A1%A3/%E8%AF%B4%E6%98%8E.txt')
  const built = buildFormatString({
    method: 'HEAD',
    path: '/文档/说明.txt',
    headers: { host: 'assets-1250000000.cos.ap-guangzhou.myqcloud.com' },
  })
  assert.match(built.formatString, /head\n\/%E6%96%87%E6%A1%A3\/%E8%AF%B4%E6%98%8E\.txt\n/)
  const recorded: string[] = []
  const fetchImpl = (async (url: string | URL) => {
    recorded.push(String(url))
    return new Response('', {
      status: 200,
      headers: { 'content-length': '1', 'last-modified': 'Wed, 01 Jan 2025 00:00:00 GMT' },
    })
  }) as typeof fetch
  const client = createCosClient({ secretId: 'AKIDxxxxxxxx', secretKey: 'secret' }, fetchImpl)
  await client.headObject('assets-1250000000', 'ap-guangzhou', '文档/说明.txt', { timeoutMs: 5000 })
  assert.match(recorded[0] || '', /\/%E6%96%87%E6%A1%A3\/%E8%AF%B4%E6%98%8E\.txt/)
  const signedUrl = presignCosUrl({
    method: 'GET',
    host: bucketHost('assets-1250000000', 'ap-guangzhou'),
    path: '/文档/说明.txt',
    creds: { secretId: 'AKIDxxxxxxxx', secretKey: 'secret' },
    timestamp: 1700000000,
    expiresSec: 900,
  })
  assert.match(signedUrl, /\/%E6%96%87%E6%A1%A3\/%E8%AF%B4%E6%98%8E\.txt\?/)
})

test('g2.3 deleteObjects posts Content-MD5 and delete query', async () => {
  const recorded: Array<{ url: string; method?: string; md5?: string; body?: string }> = []
  const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
    const headers = (init?.headers || {}) as Record<string, string>
    recorded.push({
      url: String(url),
      method: init?.method,
      md5: headers['content-md5'],
      body: typeof init?.body === 'string' ? init.body : '',
    })
    return new Response(
      '<DeleteResult><Deleted><Key>a.txt</Key></Deleted><Error><Key>b.txt</Key><Code>AccessDenied</Code><Message>denied</Message></Error></DeleteResult>',
      { status: 200, headers: { 'content-type': 'application/xml' } },
    )
  }) as typeof fetch
  const client = createCosClient({ secretId: 'AKIDxxxxxxxx', secretKey: 'secret' }, fetchImpl)
  const result = await client.deleteObjects('assets-1250000000', 'ap-guangzhou', ['a.txt', 'b.txt'], { timeoutMs: 5000 })
  assert.match(recorded[0]?.url || '', /[?&]delete=/)
  assert.equal(recorded[0]?.method, 'POST')
  assert.ok(recorded[0]?.md5)
  assert.match(recorded[0]?.body || '', /<Key>a\.txt<\/Key>/)
  assert.deepEqual(result.deleted, ['a.txt'])
  assert.equal(result.errors[0]?.key, 'b.txt')
})
