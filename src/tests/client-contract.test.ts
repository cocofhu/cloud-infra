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

test('ConfigCard credential rows share a host-isolated label+input grid (g1.1 g1.2 g1.3)', () => {
  const client = read('src/client.js')
  assert.match(client, /className:\s*"ci-cfg-row"/)
  assert.match(client, /\(provider\.fields\s*\|\|\s*\[\]\)\.map\(\(field\)\s*=>\s*h\("div",\s*\{\s*key:\s*field\.key,\s*className:\s*"ci-cfg-row"/)
  assert.match(client, /className:\s*"ci-cfg-row"[\s\S]{0,120}htmlFor:\s*"ci-max"[\s\S]{0,40}每页条数/)
  assert.match(client, /\.ci-cfg-row\{[^}]*display:grid/)
  assert.match(client, /\.ci-cfg-row\{[^}]*grid-template-columns:9\.5em 1fr/)
  assert.match(client, /\.ci-cfg-row\{[^}]*align-items:center/)
  assert.match(client, /\.ci-cfg-row\{[^}]*box-sizing:border-box/)
  assert.match(client, /\.ci-cfg-row\{[^}]*float:none/)
  assert.match(client, /\.ci-cfg-row\{[^}]*position:static/)
  assert.match(client, /\.ci-cfg-row>label\{[^}]*float:none/)
  assert.match(client, /\.ci-cfg-row>label\{[^}]*position:static/)
  assert.match(client, /\.ci-cfg-row>label\{[^}]*vertical-align:middle/)
  assert.match(client, /\.ci-cfg-row>input\[type=text\][^}]*width:100%/)
  assert.match(client, /\.ci-cfg-row>input\[type=text\][^}]*float:none/)
  assert.match(client, /\.ci-cfg-row>input\[type=text\][^}]*position:static/)
  const card = client.slice(client.indexOf('function ConfigCard()'))
  assert.match(card, /function ConfigCard\(/)
  assert.match(card, /h\("label",\s*\{\s*className:\s*"ci-cfg-src"\s*\},[\s\S]*?checked:\s*bucket\.enabled[\s\S]*?"启用"/)
  assert.doesNotMatch(card, /className:\s*"ci-cfg-row"[\s\S]{0,40}checked:\s*bucket\.enabled/)
  assert.match(card, /h\("label",\s*\{\s*className:\s*"ci-cfg-src"\s*\},[\s\S]*?draft\.skipConfirm[\s\S]*?写操作免确认/)
  assert.doesNotMatch(card, /className:\s*"ci-cfg-row"[\s\S]{0,80}draft\.skipConfirm/)
})

test('ConfigCard save still omits empty secrets so stored keys stay (g2.2)', () => {
  const client = read('src/client.js')
  assert.match(client, /placeholder:\s*bucket\.configured\s*\?\s*"已保存，留空则保持原值"/)
  assert.match(client, /if\s*\(String\(value\s*\|\|\s*""\)\.trim\(\)\)\s*next\[key\]\s*=\s*String\(value\)\.trim\(\)/)
  assert.match(client, /api\("config",\s*\{\s*save:\s*true/)
  assert.match(client, /className:\s*"ci-cfg-disc"/)
  assert.match(client, /className:\s*"ci-cfg-save"/)
})
