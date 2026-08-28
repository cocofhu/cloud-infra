import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const dir = dirname(fileURLToPath(import.meta.url))
const root = join(dir, '../..')

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8')
}

test('host and query core do not switch on vendor names', () => {
  const host = read('src/host.ts')
  const query = read('src/core/query.ts')
  assert.doesNotMatch(host, /if\s*\(.*provider\s*===\s*['"]tencent['"]/)
  assert.doesNotMatch(host, /if\s*\(.*provider\s*===\s*['"]aliyun['"]/)
  assert.doesNotMatch(query, /tencent\s*\|\s*aliyun/)
  assert.match(host, /settings\.register\('cloud-infra'/)
  assert.match(host, /cloud_infra_query/)
})

test('client settings card is schema-driven and uses key cloud-infra', () => {
  const client = read('src/client.js')
  assert.match(client, /key:\s*"cloud-infra"/)
  assert.match(client, /provider\.fields/)
  assert.doesNotMatch(client, /if\s*\(.*===\s*['"]tencent['"]/)
  assert.match(client, /confirm === "always"/)
  assert.match(client, /ci-row/)
  assert.match(client, /item\.columns/)
  assert.match(client, /上一页/)
  assert.match(client, /请输入域名关键字/)
})
