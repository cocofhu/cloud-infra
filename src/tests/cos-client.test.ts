import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import {
  aclLabelFromXml,
  bucketHost,
  buildFormatString,
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
