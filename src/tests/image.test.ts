import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { tcrCall } from '../providers/tencent/client.js'
import {
  createImageModule,
  formatSize,
  inferRegion,
  isPersonalInstance,
  parseInstanceRef,
  personalCard,
  PERSONAL_INSTANCE_ID,
  pullCommand,
  TCR_REGIONS,
} from '../providers/tencent/products/image.js'

const dir = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => JSON.parse(readFileSync(join(dir, 'fixtures', name), 'utf8')) as Record<string, unknown>

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

test('g2.1 tcrCall uses TCR host version and Region header', async () => {
  const seen: Record<string, string>[] = []
  const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
    seen.push(Object.fromEntries(Object.entries((init?.headers || {}) as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v])))
    assert.match(String(url), /tcr\.tencentcloudapi\.com/)
    return {
      ok: true,
      json: async () => ({ Response: { Registries: [] } }),
    } as Response
  }) as typeof fetch
  await tcrCall('DescribeInstances', {}, { secretId: 'id', secretKey: 'key' }, {
    timeoutMs: 3000,
    region: 'ap-shanghai',
    fetchImpl,
  })
  assert.equal(seen[0]['x-tc-version'], '2019-09-24')
  assert.equal(seen[0]['x-tc-action'], 'DescribeInstances')
  assert.equal(seen[0]['x-tc-region'], 'ap-shanghai')
})

test('g2.2 guangzhou list includes personal instance; shanghai does not', async () => {
  const calls: Array<{ action: string; region?: string; payload: unknown }> = []
  const call = async (action: string, payload: unknown, _creds: unknown, opts: { region?: string }) => {
    calls.push({ action, payload, region: opts.region })
    if (action === 'DescribeInstances' && opts.region === 'ap-shanghai') return fixture('tcr-instances-shanghai.json')
    if (action === 'DescribeInstances') return fixture('tcr-instances-guangzhou.json')
    return {}
  }
  const module = createImageModule(call as never)
  const gz = await module.list(ctx({ region: 'ap-guangzhou' }))
  assert.equal(gz.region, 'ap-guangzhou')
  assert.equal(gz.items.some((item) => item.id.endsWith(PERSONAL_INSTANCE_ID)), true)
  assert.equal(gz.items.some((item) => item.title === '个人版实例'), true)
  assert.equal(gz.items.some((item) => item.title === 'prod-tcr'), true)
  const sh = await module.list(ctx({ region: 'ap-shanghai' }))
  assert.equal(sh.items.some((item) => isPersonalInstance(item.id)), false)
  assert.equal(sh.items[0].title, 'sh-tcr')
  assert.equal(calls.find((row) => row.action === 'DescribeInstances' && row.region === 'ap-shanghai')?.region, 'ap-shanghai')
})

test('inferRegion reads 上海 from query and defaults to guangzhou', () => {
  assert.deepEqual(inferRegion('上海 nginx'), { region: 'ap-shanghai', rest: 'nginx' })
  assert.equal(inferRegion('').region, 'ap-guangzhou')
  assert.equal(personalCard().columns?.find((col) => col.label === '访问域名')?.value, 'ccr.ccs.tencentyun.com')
  assert.deepEqual(parseInstanceRef('tencent.image:tcr-prod'), { moduleId: 'tencent.image', instanceId: 'tcr-prod' })
  assert.equal(TCR_REGIONS.map((item) => item.id).join(','), 'ap-guangzhou,ap-shanghai,ap-beijing,ap-nanjing,ap-chengdu')
})

test('g2.3 namespaces repos and version search stay in current instance', async () => {
  const calls: Array<{ action: string; payload: unknown; region?: string }> = []
  const call = async (action: string, payload: unknown, _creds: unknown, opts: { region?: string }) => {
    calls.push({ action, payload, region: opts.region })
    if (action === 'DescribeNamespacePersonal') return fixture('tcr-personal-namespaces.json')
    if (action === 'DescribeRepositoryOwnerPersonal') return fixture('tcr-personal-repos.json')
    if (action === 'DescribeImagePersonal') return fixture('tcr-personal-images.json')
    if (action === 'DescribeNamespaces') return fixture('tcr-enterprise-namespaces.json')
    if (action === 'DescribeRepositories') return fixture('tcr-enterprise-repos.json')
    if (action === 'DescribeImages') return fixture('tcr-enterprise-images.json')
    if (action === 'DescribeInstances') return fixture('tcr-instances-shanghai.json')
    return {}
  }
  const module = createImageModule(call as never)
  const ns = await module.detail?.(ctx({
    id: `tencent.image:${PERSONAL_INSTANCE_ID}`,
    region: 'ap-guangzhou',
    view: 'namespaces',
  }))
  assert.equal(ns?.tables?.[0].rows.some((row) => row.cells.name === 'team-01'), true)
  const repos = await module.detail?.(ctx({
    id: `tencent.image:${PERSONAL_INSTANCE_ID}`,
    region: 'ap-guangzhou',
    view: 'repos',
    query: 'nginx',
  }))
  assert.equal(repos?.tables?.[0].rows.length, 1)
  assert.equal(repos?.tables?.[0].rows[0].cells.name, 'team-01/nginx')
  const tags = await module.detail?.(ctx({
    id: `tencent.image:${PERSONAL_INSTANCE_ID}`,
    region: 'ap-guangzhou',
    view: 'tags',
    namespace: 'team-01',
    repository: 'nginx',
    query: '1.2',
  }))
  assert.equal(tags?.tables?.[0].rows.length, 1)
  assert.equal(tags?.tables?.[0].rows[0].cells.version, '1.2.0')
  assert.match(String(tags?.tables?.[0].rows[0].cells.size), /MB/)
  const ent = await module.detail?.(ctx({
    id: 'tencent.image:tcr-sh',
    region: 'ap-shanghai',
    view: 'repos',
  }))
  assert.equal(ent?.tables?.[0].rows[0].cells.name, 'pay/api')
  assert.equal(calls.find((row) => row.action === 'DescribeRepositories')?.region, 'ap-shanghai')
  assert.equal(formatSize(10485760), '10 MB')
})

test('g2.4 delete uses Personal vs enterprise API and pull command matches edition', async () => {
  const calls: Array<{ action: string; payload: unknown; region?: string }> = []
  const call = async (action: string, payload: unknown, _creds: unknown, opts: { region?: string }) => {
    calls.push({ action, payload, region: opts.region })
    return {}
  }
  const module = createImageModule(call as never)
  const personalDel = await module.execute?.('image.delete', {
    namespace: 'team-01',
    repository: 'nginx',
    tag: '1.2.0',
    instanceId: PERSONAL_INSTANCE_ID,
    region: 'ap-guangzhou',
  }, ctx({ id: `tencent.image:${PERSONAL_INSTANCE_ID}` }))
  assert.equal(personalDel?.ok, true)
  const personalCall = calls.find((row) => row.action === 'DeleteImagePersonal')
  assert.deepEqual(personalCall?.payload, { RepoName: 'team-01/nginx', Tag: '1.2.0' })
  const entDel = await module.execute?.('image.delete', {
    namespace: 'pay',
    repository: 'api',
    tag: '0.9.1',
    instanceId: 'tcr-sh',
    region: 'ap-shanghai',
  }, ctx({ id: 'tencent.image:tcr-sh' }))
  assert.equal(entDel?.ok, true)
  const entCall = calls.find((row) => row.action === 'DeleteImage')
  assert.equal(entCall?.region, 'ap-shanghai')
  assert.equal((entCall?.payload as { ImageVersion?: string }).ImageVersion, '0.9.1')
  const pull = await module.execute?.('image.pull', {
    namespace: 'team-01',
    repository: 'nginx',
    tag: '1.2.0',
    instanceId: PERSONAL_INSTANCE_ID,
  }, ctx())
  assert.equal(pull?.ok, true)
  assert.equal(pull && 'command' in pull ? pull.command : '', 'docker pull ccr.ccs.tencentyun.com/team-01/nginx:1.2.0')
  assert.equal(pullCommand({
    personal: false,
    publicDomain: 'sh-tcr.tencentcloudcr.com',
    namespace: 'pay',
    repository: 'api',
    tag: '0.9.1',
  }), 'docker pull sh-tcr.tencentcloudcr.com/pay/api:0.9.1')
  assert.equal(module.actions?.find((item) => item.id === 'image.delete')?.confirm, 'always')
})
