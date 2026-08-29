import assert from 'node:assert/strict'
import test from 'node:test'
import { detectDirectHit, queryResources, renderQuery } from '../core/query.js'
import { createRegistry } from '../core/registry.js'
import { withDefaults } from '../core/config-store.js'
import type { ModuleContext, ResourceCard } from '../core/types.js'

function card(id: string, title: string, kind = 'cos'): ResourceCard {
  return {
    id,
    moduleId: id.split(':')[0] || 'tencent.cos',
    provider: 'tencent',
    kind,
    title,
    description: '',
  }
}

test('detectDirectHit 空 query 返回 {}', () => {
  assert.deepEqual(detectDirectHit([card('tencent.cos:ap-guangzhou:a-1', 'a-1')], ''), {})
  assert.deepEqual(detectDirectHit([card('tencent.cos:ap-guangzhou:a-1', 'a-1')], '   '), {})
  assert.deepEqual(detectDirectHit([], ''), {})
})

test('detectDirectHit 精确命中 title', () => {
  const items = [card('tencent.cos:ap-guangzhou:cloud-init-1251810746', 'cloud-init-1251810746')]
  assert.deepEqual(detectDirectHit(items, 'cloud-init-1251810746'), {
    directItemId: 'tencent.cos:ap-guangzhou:cloud-init-1251810746',
  })
})

test('detectDirectHit 不区分大小写', () => {
  const items = [card('tencent.cvm:ap-guangzhou:ins-AbC123', 'my-host', 'cvm')]
  assert.deepEqual(detectDirectHit(items, 'INS-ABC123'), { directItemId: 'tencent.cvm:ap-guangzhou:ins-AbC123' })
  assert.deepEqual(detectDirectHit(items, 'MY-HOST'), { directItemId: 'tencent.cvm:ap-guangzhou:ins-AbC123' })
})

test('detectDirectHit 命中 id 尾段（证书 ID / 实例 ID）', () => {
  const items = [card('tencent.cert:abcDEF123', 'abcDEF123', 'cert')]
  assert.deepEqual(detectDirectHit(items, 'abcdef123'), { directItemId: 'tencent.cert:abcDEF123' })
})

test('detectDirectHit 仅 contains 不算命中', () => {
  const items = [card('tencent.cos:ap-guangzhou:cloud-init-1251810746', 'cloud-init-1251810746')]
  assert.deepEqual(detectDirectHit(items, 'cloud-init'), { notFoundQuery: 'cloud-init' })
  assert.deepEqual(detectDirectHit(items, '1251810746'), { notFoundQuery: '1251810746' })
})

test('detectDirectHit 多结果无精确返回 notFoundQuery', () => {
  const items = [
    card('tencent.cdb:ap-guangzhou:cdb-aaa', 'cdb-aaa', 'cdb'),
    card('tencent.cdb:ap-guangzhou:cdb-bbb', 'cdb-bbb', 'cdb'),
  ]
  assert.deepEqual(detectDirectHit(items, 'cdb-ccc'), { notFoundQuery: 'cdb-ccc' })
})

test('detectDirectHit 多结果有精确返回首项 id', () => {
  const items = [
    card('tencent.cdb:ap-guangzhou:cdb-aaa', 'cdb-aaa', 'cdb'),
    card('tencent.cdb:ap-shanghai:cdb-bbb', 'cdb-bbb', 'cdb'),
  ]
  assert.deepEqual(detectDirectHit(items, 'cdb-bbb'), { directItemId: 'tencent.cdb:ap-shanghai:cdb-bbb' })
  // title 与 id 尾段同时出现两个候选时，取列表顺序的第一条
  const dup = [
    card('tencent.cos:ap-guangzhou:alpha-1', 'alpha-1'),
    card('tencent.cos:ap-shanghai:alpha-1', 'alpha-1'),
  ]
  assert.deepEqual(detectDirectHit(dup, 'alpha-1'), { directItemId: 'tencent.cos:ap-guangzhou:alpha-1' })
})

function registryWithItems(items: ResourceCard[], kind = 'cos') {
  const source = createRegistry()
  source.registerProvider({
    id: 'tencent',
    title: '腾讯云',
    fields: [
      { key: 'secretId', label: 'SecretId' },
      { key: 'secretKey', label: 'SecretKey' },
    ],
  })
  source.registerModule({
    id: `tencent.${kind}`,
    provider: 'tencent',
    kind,
    title: `测试 ${kind}`,
    implemented: true,
    list: async (ctx: ModuleContext) => ({
      items: ctx.query
        ? items.filter((item) => item.title.includes(ctx.query) || item.id.includes(ctx.query))
        : items,
      region: ctx.region,
    }),
  })
  return source
}

const cfg = () => withDefaults({ providers: { tencent: { secretId: 'id', secretKey: 'key' } } })

test('queryResources 精确命中时附带 directItemId', async () => {
  const items = [card('tencent.cos:ap-guangzhou:cloud-init-1251810746', 'cloud-init-1251810746')]
  const result = await queryResources(
    { kind: 'cos', query: 'cloud-init-1251810746', region: 'ap-guangzhou' },
    cfg(), undefined, registryWithItems(items),
  )
  assert.equal(result.directItemId, 'tencent.cos:ap-guangzhou:cloud-init-1251810746')
  assert.equal(result.notFoundQuery, undefined)
  assert.match(renderQuery(result), /完全匹配/)
  assert.match(renderQuery(result), /自动定位到「cloud-init-1251810746」/)
})

test('queryResources 未命中时附带 notFoundQuery 并回落全量列表', async () => {
  const items = [
    card('tencent.cos:ap-guangzhou:assets-1250000000', 'assets-1250000000'),
    card('tencent.cos:ap-guangzhou:logs-1250000000', 'logs-1250000000'),
  ]
  // 模块先按 query 本地过滤（为空），query.ts 检测到未命中后以空 query 重拉回落全量
  const result = await queryResources(
    { kind: 'cos', query: 'no-such-bucket-xyz', region: 'ap-guangzhou' },
    cfg(), undefined, registryWithItems(items),
  )
  assert.equal(result.notFoundQuery, 'no-such-bucket-xyz')
  assert.equal(result.directItemId, undefined)
  assert.equal(result.items.length, 2)
  assert.deepEqual(result.items.map((item) => item.title).sort(), ['assets-1250000000', 'logs-1250000000'])
  const rendered = renderQuery(result)
  assert.match(rendered, /no-such-bucket-xyz/)
  assert.match(rendered, /完全匹配/)
  assert.match(rendered, /全量列表/)
})

test('queryResources 未命中且模块返回全量时，文案说明回落到全量列表', async () => {
  const items = [card('tencent.cert:cert-a', 'cert-a', 'cert')]
  const source = createRegistry()
  source.registerProvider({
    id: 'tencent',
    title: '腾讯云',
    fields: [
      { key: 'secretId', label: 'SecretId' },
      { key: 'secretKey', label: 'SecretKey' },
    ],
  })
  source.registerModule({
    id: 'tencent.cert',
    provider: 'tencent',
    kind: 'cert',
    title: '测试证书',
    implemented: true,
    // 远程过滤失败时模块仍可能返回全量列表
    list: async () => ({ items }),
  })
  const result = await queryResources({ kind: 'cert', query: 'no-such-cert' }, cfg(), undefined, source)
  assert.equal(result.notFoundQuery, 'no-such-cert')
  assert.equal(result.items.length, 1)
  assert.match(renderQuery(result), /未找到与您输入的「no-such-cert」完全匹配的资源/)
  assert.match(renderQuery(result), /全量列表/)
})

test('queryResources 未命中且回落重拉失败时保留原空结果', async () => {
  const items = [card('tencent.cos:ap-guangzhou:assets-1', 'assets-1')]
  const source = createRegistry()
  source.registerProvider({
    id: 'tencent',
    title: '腾讯云',
    fields: [
      { key: 'secretId', label: 'SecretId' },
      { key: 'secretKey', label: 'SecretKey' },
    ],
  })
  let calls = 0
  source.registerModule({
    id: 'tencent.cos',
    provider: 'tencent',
    kind: 'cos',
    title: '测试 cos',
    implemented: true,
    list: async (ctx: ModuleContext) => {
      calls += 1
      if (!ctx.query) throw new Error('重拉网络异常')
      return { items: items.filter((item) => item.title.includes(ctx.query)) }
    },
  })
  const result = await queryResources(
    { kind: 'cos', query: 'no-such', region: 'ap-guangzhou' },
    cfg(), undefined, source,
  )
  assert.equal(result.notFoundQuery, 'no-such')
  assert.equal(result.items.length, 0)
  assert.equal(calls, 2)
})

test('queryResources 非直达 kind 未命中时不回落重拉', async () => {
  const items = [card('tencent.domain:example.com', 'example.com', 'domain')]
  let calls = 0
  const source = createRegistry()
  source.registerProvider({
    id: 'tencent',
    title: '腾讯云',
    fields: [
      { key: 'secretId', label: 'SecretId' },
      { key: 'secretKey', label: 'SecretKey' },
    ],
  })
  source.registerModule({
    id: 'tencent.domain',
    provider: 'tencent',
    kind: 'domain',
    title: '测试域名',
    implemented: true,
    list: async (ctx: ModuleContext) => {
      calls += 1
      return { items: ctx.query ? items.filter((item) => item.title.includes(ctx.query)) : items }
    },
  })
  const result = await queryResources({ kind: 'domain', query: 'no-such-domain' }, cfg(), undefined, source)
  assert.equal(result.notFoundQuery, 'no-such-domain')
  assert.equal(result.items.length, 0)
  assert.equal(calls, 1)
})

test('queryResources 空 query 不产生直达字段', async () => {
  const items = [card('tencent.cos:ap-guangzhou:assets-1', 'assets-1')]
  const result = await queryResources(
    { kind: 'cos', region: 'ap-guangzhou' },
    cfg(), undefined, registryWithItems(items),
  )
  assert.equal(result.directItemId, undefined)
  assert.equal(result.notFoundQuery, undefined)
  assert.doesNotMatch(renderQuery(result), /完全匹配/)
})
