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

test('g1 client uses official DSH tokens without typo or light hex fills', () => {
  const client = read('src/client.js')
  assert.match(client, /--dsw-alias-brand-primary[);,\s]/)
  assert.match(client, /--dsw-alias-button-primary-fill/)
  assert.match(client, /--dsw-alias-state-success-primary/)
  assert.match(client, /--dsw-alias-state-warn-label/)
  assert.match(client, /--dsw-alias-state-error-primary/)
  assert.doesNotMatch(client, /brand-primary-new-colorprimary-new-color/)
  assert.doesNotMatch(client, /#2563eb|#fff\b|#ffffff\b/)
})

test('g2-g3 list chrome and in-card DetailView replace fullscreen drawer', () => {
  const client = read('src/client.js')
  assert.match(client, /域名解析/)
  assert.match(client, /ci-bar-count/)
  assert.match(client, /没有匹配「/)
  assert.match(client, /加载列表/)
  assert.match(client, /function DetailView/)
  assert.match(client, /ci-crumb/)
  assert.match(client, /ci-back/)
  assert.match(client, /返回/)
  assert.match(client, /加载详情/)
  assert.match(client, /没有解析记录/)
  assert.match(client, /onBack:\s*\(\)\s*=>\s*setSession\(null\)/)
  assert.doesNotMatch(client, /ci-overlay|ci-drawer|function Drawer\b/)
  assert.doesNotMatch(client, /2147483|86vh/)
})

test('g4 lightweight form/confirm overlay and g5 skipConfirm live update', () => {
  const client = read('src/client.js')
  assert.match(client, /min\(400px,100%\)/)
  assert.match(client, /Escape/)
  assert.match(client, /e\.target === e\.currentTarget/)
  assert.match(client, /cloud-infra-config/)
  assert.match(client, /function publicErrorMessage/)
  assert.match(client, /写操作免确认（删除仍会确认）/)
  assert.match(client, /未保存/)
})
