import assert from 'node:assert/strict'
import test from 'node:test'
import { withDefaults } from '../core/config-store.js'
import { queryResources, renderQuery } from '../core/query.js'
import { createRegistry } from '../core/registry.js'
import type { ResourceModule } from '../core/types.js'

test('queryResources fans out to a newly registered fake cloud without core changes', async () => {
  const source = createRegistry()
  source.registerProvider({
    id: 'fake',
    title: '假云',
    fields: [{ key: 'token', label: 'Token' }],
  })
  const module: ResourceModule = {
    id: 'fake.domain',
    provider: 'fake',
    kind: 'domain',
    title: '假云域名',
    implemented: true,
    async list(ctx) {
      return {
        items: [{
          id: 'fake.domain:1',
          moduleId: 'fake.domain',
          provider: 'fake',
          kind: 'domain',
          title: ctx.query || 'example.test',
          description: 'from fake',
          status: 'enable',
        }],
        total: 1,
        hasMore: false,
      }
    },
  }
  source.registerModule(module)
  const cfg = withDefaults({
    providers: { fake: { token: 'abc' } },
    modules: { 'fake.domain': true },
  })
  const result = await queryResources({ kind: 'domain', query: 'hello' }, cfg, undefined, source)
  assert.equal(result.items.length, 1)
  assert.equal(result.items[0].title, 'hello')
  assert.equal(result.items[0].provider, 'fake')
  assert.equal(result.errors.length, 0)
})

test('unimplemented modules are skipped unless explicitly requested', async () => {
  const source = createRegistry()
  source.registerProvider({ id: 'later', title: 'Later', fields: [{ key: 'k', label: 'K' }] })
  source.registerModule({
    id: 'later.domain',
    provider: 'later',
    kind: 'domain',
    title: 'Later 域名',
    implemented: false,
    async list() {
      return { items: [] }
    },
  })
  const cfg = withDefaults({ providers: { later: { k: '1' } } })
  const implicit = await queryResources({ kind: 'domain' }, cfg, undefined, source)
  assert.equal(implicit.items.length, 0)
  assert.match(implicit.errors[0]?.message || '', /没有可查询的模块|没有已启用/)
  const explicit = await queryResources({ kind: 'domain', provider: 'later' }, cfg, undefined, source)
  assert.match(explicit.errors.map((item) => item.message).join(' '), /尚未实现/)
})

test('missing credentials point the user at settings', async () => {
  const source = createRegistry()
  source.registerProvider({
    id: 'fake',
    title: '假云',
    fields: [{ key: 'token', label: 'Token' }],
  })
  source.registerModule({
    id: 'fake.domain',
    provider: 'fake',
    kind: 'domain',
    title: '假云域名',
    implemented: true,
    async list() {
      return { items: [{ id: 'x', moduleId: 'fake.domain', provider: 'fake', kind: 'domain', title: 'x', description: 'x' }] }
    },
  })
  const result = await queryResources({ kind: 'domain' }, withDefaults({}), undefined, source)
  assert.equal(result.items.length, 0)
  assert.match(result.errors[0]?.message || '', /设置/)
})

test('cert missing credentials mention existing SecretId/SecretKey not 设置页', async () => {
  const source = createRegistry()
  source.registerProvider({
    id: 'fake',
    title: '假云',
    fields: [{ key: 'secretId', label: 'SecretId' }, { key: 'secretKey', label: 'SecretKey' }],
  })
  source.registerModule({
    id: 'fake.cert',
    provider: 'fake',
    kind: 'cert',
    title: '假云证书',
    implemented: true,
    async list() {
      return { items: [] }
    },
  })
  const result = await queryResources({ kind: 'cert' }, withDefaults({}), undefined, source)
  assert.equal(result.items.length, 0)
  const message = result.errors[0]?.message || ''
  assert.match(message, /已有腾讯云 SecretId\/SecretKey/)
  assert.doesNotMatch(message, /设置/)
  const text = renderQuery(result)
  assert.doesNotMatch(text, /设置/)
  assert.doesNotMatch(text, /设置页/)
})
