import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { handleApi } from '../host.js'
import { withDefaults, writeOverlay } from '../core/config-store.js'
import { queryResources, renderQuery } from '../core/query.js'
import { callTencentApi, tkeCall } from '../providers/tencent/client.js'
import {
  buildClusterFilters,
  createTkeModule,
  mapClusterItem,
  matchNodeFilters,
  parseClusterRef,
  TKE_SIDEBAR_PAGES,
  validateCreatePayload,
  validateDeletePayload,
  type TkeClusterItem,
  type TkeInstanceItem,
} from '../providers/tencent/products/tke.js'

const dir = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => JSON.parse(readFileSync(join(dir, 'fixtures', name), 'utf8')) as Record<string, unknown>
const src = (rel: string) => readFileSync(join(dir, '../..', rel), 'utf8')

function ctx(extra: Record<string, unknown> = {}) {
  return {
    creds: { secretId: 'id', secretKey: 'key' },
    query: '',
    offset: 0,
    limit: 12,
    timeoutMs: 5000,
    region: 'ap-guangzhou',
    ...extra,
  }
}

function mockCall() {
  const calls: Array<{ action: string; payload: unknown; region?: string }> = []
  const call = async (action: string, payload: unknown, _creds: unknown, opts?: { region?: string }) => {
    calls.push({ action, payload, region: opts?.region })
    if (action === 'DescribeClusters') {
      const ids = (payload as { ClusterIds?: string[] }).ClusterIds
      const all = fixture('cluster-list.json')
      if (ids?.length) {
        const hit = (all.Clusters as TkeClusterItem[]).find((item) => item.ClusterId === ids[0])
        return { Clusters: hit ? [hit] : [], TotalCount: hit ? 1 : 0 }
      }
      return all
    }
    if (action === 'DescribeEKSClusters') return { Clusters: [], TotalCount: 0 }
    if (action === 'DescribeTKEEdgeClusters') return { Clusters: [], TotalCount: 0 }
    if (action === 'DescribeClusterInstances') {
      const clusterId = String((payload as { ClusterId?: string }).ClusterId || '')
      if (clusterId === 'cls-empty001') return { TotalCount: 0, InstanceSet: [] }
      return fixture('cluster-instances.json')
    }
    if (action === 'DescribeClusterNodePools') return fixture('node-pools.json')
    if (action === 'DescribeAddon') return fixture('addon-list.json')
    if (action === 'DescribeClusterEndpointStatus') return { Status: 'Created' }
    if (action === 'DescribeClusterSecurity') return { Kubeconfig: 'apiVersion: v1\nkind: Config\n' }
    if (action === 'ForwardApplicationRequestV3') {
      return { ResponseBody: JSON.stringify({ items: [{ metadata: { name: 'default' }, status: { phase: 'Active' } }] }) }
    }
    if (action === 'DescribeClusterRoleBindings') {
      return { ClusterRoleBindingSet: [{ Name: 'admin-bind', RoleName: 'tke:admin', Users: ['10000'] }] }
    }
    if (action === 'DescribePolicy') {
      return { PolicySet: [{ PolicyName: 'block-privileged', Enabled: true, Category: 'security' }] }
    }
    if (action === 'DescribeLogSwitches') {
      return { LogSwitches: [{ LogType: 'audit', Status: false }, { LogType: 'event', Status: true }] }
    }
    return {}
  }
  return { calls, call: call as never, module: createTkeModule(call as never) }
}

test('g1.1 g2.2 mapClusterItem uses console columns and encodes region in id', () => {
  const item = (fixture('cluster-list.json').Clusters as TkeClusterItem[])[0]
  const card = mapClusterItem(item, 'tencent.tke', 'ap-guangzhou')
  assert.equal(card.kind, 'cluster')
  assert.equal(card.id, 'tencent.tke:ap-guangzhou:cls-abc12345')
  assert.equal(card.openLabel, '管理')
  assert.deepEqual(card.columns?.map((col) => col.label), ['集群ID', '类型', 'Kubernetes 版本', '节点数', '所在网络', '创建时间', '标签'])
  assert.equal(card.columns?.find((col) => col.label === '所在网络')?.value, 'vpc-demo001')
  assert.deepEqual(parseClusterRef(card.id), { moduleId: 'tencent.tke', region: 'ap-guangzhou', clusterId: 'cls-abc12345' })
})

test('g1.1 list requires runtime region and forwards filters without writeOverlay', async () => {
  const { module, calls } = mockCall()
  await assert.rejects(() => module.list(ctx({ region: '' })), /缺少地域/)
  const listed = await module.list(ctx({
    query: 'prod',
    filters: { clusterType: '标准集群', status: 'Running', vpcId: 'vpc-demo001', tag: 'env:prod' },
  }))
  assert.equal(listed.items[0].title, 'prod-tke')
  const describe = calls.find((row) => row.action === 'DescribeClusters')
  assert.equal(describe?.region, 'ap-guangzhou')
  const filters = (describe?.payload as { Filters?: Array<{ Name: string; Values: string[] }> }).Filters || []
  assert.ok(filters.some((item) => item.Name === 'ClusterName' && item.Values[0] === 'prod'))
  assert.ok(filters.some((item) => item.Name === 'ClusterType' && item.Values[0] === 'MANAGED_CLUSTER'))
  assert.ok(filters.some((item) => item.Name === 'vpc-id'))
  assert.equal(src('src/core/query.ts').includes('writeOverlay'), false)
  const host = src('src/host.ts')
  const queryBlock = host.slice(host.indexOf("if (method === 'query')"), host.indexOf("if (method === 'detail')"))
  const actionBlock = host.slice(host.indexOf("if (method === 'action')"), host.indexOf('sendJson(res, 400, { ok: false, error: \'unknown method\' })'))
  assert.doesNotMatch(queryBlock, /writeOverlay/)
  assert.doesNotMatch(actionBlock, /writeOverlay/)
})

test('g1.2 detail uses sidebar pages instead of DNS records', async () => {
  const { module } = mockCall()
  const detail = await module.detail?.(ctx({ id: 'tencent.tke:ap-guangzhou:cls-abc12345', title: 'prod-tke' }))
  assert.ok(detail)
  assert.equal(detail?.records, undefined)
  assert.deepEqual(detail?.pages?.map((page) => page.id), TKE_SIDEBAR_PAGES.map((page) => page.id))
  assert.ok(detail?.blocks?.some((block) => block.id === 'cluster'))
  assert.ok(detail?.blocks?.some((block) => block.id === 'network'))
  assert.ok(detail?.blocks?.some((block) => block.id === 'apiserver'))
  assert.ok((detail?.cards?.nodes || []).length >= 1)
  assert.ok((detail?.cards?.nodePools || []).some((card) => card.id === 'np-regular1'))
  assert.ok((detail?.cards?.namespaces || []).some((card) => card.id === 'default'))
  assert.ok((detail?.cards?.addons || []).some((card) => card.id === 'CBS'))
  assert.ok((detail?.cards?.bindings || []).length >= 1)
  assert.ok((detail?.cards?.policies || []).length >= 1)
  assert.equal(detail?.flags?.deletionProtection, true)
  assert.doesNotMatch(JSON.stringify(detail), /apiVersion: v1/)
  assert.doesNotMatch(JSON.stringify(detail), /解析记录/)
})

test('g1.3 tool and prompt cover kind=cluster', () => {
  const host = src('src/host.ts')
  assert.match(host, /kind=cluster/)
  assert.match(host, /TKE/)
  assert.match(host, /region/)
  assert.match(src('src/core/query.ts'), /kind === 'cluster'/)
})

test('g2.1 tkeCall sends X-TC-Region', async () => {
  const seen: string[] = []
  await callTencentApi({
    service: 'tke',
    host: 'tke.tencentcloudapi.com',
    version: '2018-05-25',
    action: 'DescribeClusters',
    payload: {},
    secretId: 'id',
    secretKey: 'key',
    timeoutMs: 2000,
    region: 'ap-shanghai',
    fetchImpl: async (_url, init) => {
      const headers = init?.headers as Record<string, string>
      seen.push(headers['x-tc-region'] || '')
      return {
        ok: true,
        status: 200,
        json: async () => ({ Response: { Clusters: [], RequestId: 'r' } }),
      } as Response
    },
  })
  assert.deepEqual(seen, ['ap-shanghai'])
  assert.throws(() => {
    void tkeCall('DescribeClusters', {}, { secretId: 'id', secretKey: 'key' }, { timeoutMs: 1000, region: '' })
  }, /缺少地域/)
})

test('g2.3 create wizard rejects missing fields, SLA, and elastic/independent', async () => {
  assert.match(validateCreatePayload({ clusterType: 'SERVERLESS_CLUSTER', sla: true, clusterName: 'x', clusterVersion: '1.28', vpcId: 'vpc-1' }) || '', /弹性集群新建入口已关闭/)
  assert.match(validateCreatePayload({ clusterType: 'INDEPENDENT_CLUSTER', sla: true, clusterName: 'x', clusterVersion: '1.28', vpcId: 'vpc-1' }) || '', /独立集群已停新建/)
  assert.match(validateCreatePayload({ clusterType: 'MANAGED_CLUSTER', clusterName: 'x', clusterVersion: '1.28', vpcId: 'vpc-1' }) || '', /服务等级协议/)
  assert.match(validateCreatePayload({ sla: true, clusterVersion: '1.28', vpcId: 'vpc-1' }) || '', /缺少集群名称/)
  assert.match(validateCreatePayload({ sla: true, clusterName: 'x', vpcId: 'vpc-1' }) || '', /缺少 Kubernetes 版本/)
  assert.match(validateCreatePayload({ sla: true, clusterName: 'x', clusterVersion: '1.28' }) || '', /缺少 VPC/)
  assert.equal(validateCreatePayload({ sla: true, clusterName: 'edge', clusterVersion: '1.28', vpcId: 'vpc-1', clusterType: 'EDGE_CLUSTER' }), null)
  const { module, calls } = mockCall()
  const denied = await module.execute?.('cluster.create', { clusterType: 'elastic', sla: true, clusterName: 'nope', clusterVersion: '1.28', vpcId: 'vpc-1' }, ctx())
  assert.equal(denied?.ok, false)
  const created = await module.execute?.('cluster.create', {
    clusterType: 'MANAGED_CLUSTER',
    sla: true,
    clusterName: 'demo',
    clusterVersion: '1.28.3',
    vpcId: 'vpc-1',
    region: 'ap-guangzhou',
  }, ctx())
  assert.equal(created?.ok, true)
  assert.equal(calls.some((row) => row.action === 'CreateCluster'), true)
  const edge = await module.execute?.('cluster.create', {
    clusterType: 'EDGE_CLUSTER',
    sla: true,
    clusterName: 'edge',
    clusterVersion: '1.28.3',
    vpcId: 'vpc-1',
  }, ctx())
  assert.equal(edge?.ok, true)
  assert.equal(calls.some((row) => row.action === 'CreateTKEEdgeCluster'), true)
})

test('g2.4 delete wizard closes protection, rejects nodes, requires risk ack', async () => {
  const nodes = fixture('cluster-instances.json').InstanceSet as TkeInstanceItem[]
  assert.match(validateDeletePayload({ riskAck: true }, { DeletionProtection: true }, []) || '', /删除保护/)
  assert.match(validateDeletePayload({ riskAck: true }, { ClusterNodeNum: 2 }, nodes) || '', /先移除/)
  assert.match(validateDeletePayload({}, { DeletionProtection: false }, []) || '', /我已知晓风险/)
  assert.equal(validateDeletePayload({ riskAck: true, instanceDeleteMode: 'retain' }, { DeletionProtection: false, ClusterNodeNum: 0 }, []), null)
  const { module, calls } = mockCall()
  const blocked = await module.execute?.('cluster.delete', { riskAck: true }, ctx({ id: 'tencent.tke:ap-guangzhou:cls-abc12345' }))
  assert.equal(blocked?.ok, false)
  assert.match(String(blocked && 'error' in blocked ? blocked.error : ''), /删除保护|先移除/)
  const empty = await module.execute?.('cluster.delete', { riskAck: true, instanceDeleteMode: 'retain', retainCbs: true }, ctx({
    id: 'tencent.tke:ap-guangzhou:cls-empty001',
  }))
  assert.equal(empty?.ok, true)
  assert.equal(calls.some((row) => row.action === 'DeleteCluster'), true)
  const off = await module.execute?.('cluster.protection', { enable: false }, ctx({ id: 'tencent.tke:ap-guangzhou:cls-abc12345' }))
  assert.equal(off?.ok, true)
  assert.equal(calls.some((row) => row.action === 'DisableClusterDeletionProtection'), true)
})

test('g2.5 master/node upgrade and kubeconfig stay off the detail card', async () => {
  const { module, calls } = mockCall()
  const master = await module.execute?.('cluster.upgrade.master', { version: '1.30.0' }, ctx({ id: 'tencent.tke:ap-guangzhou:cls-empty001' }))
  assert.equal(master?.ok, true)
  assert.equal(calls.some((row) => row.action === 'UpdateClusterVersion'), true)
  const node = await module.execute?.('cluster.upgrade.node', { version: '1.30.0', upgradeType: 'in-place' }, ctx({ id: 'tencent.tke:ap-guangzhou:cls-empty001' }))
  assert.equal(node?.ok, true)
  const upgrade = calls.find((row) => row.action === 'UpgradeClusterInstances')
  assert.equal((upgrade?.payload as { UpgradeType?: string }).UpgradeType, 'inPlaceUpgrade')
  const kube = await module.execute?.('cluster.kubeconfig', {}, ctx({ id: 'tencent.tke:ap-guangzhou:cls-abc12345' }))
  assert.equal(kube?.ok, true)
  assert.ok(kube && 'data' in kube && kube.data?.kubeconfig)
  const detail = await module.detail?.(ctx({ id: 'tencent.tke:ap-guangzhou:cls-abc12345' }))
  assert.doesNotMatch(JSON.stringify(detail), /kind: Config/)
})

test('g2.6 node cordon/drain/add existing and three node pool types', async () => {
  const nodes = fixture('cluster-instances.json').InstanceSet as TkeInstanceItem[]
  assert.equal(matchNodeFilters(nodes[1], { unschedulable: 'yes', ip: '10.0.0.9' }), true)
  assert.equal(matchNodeFilters(nodes[0], { unschedulable: 'yes' }), false)
  const { module, calls } = mockCall()
  const id = 'tencent.tke:ap-guangzhou:cls-abc12345'
  assert.equal((await module.execute?.('node.cordon', { instanceId: 'ins-node1' }, ctx({ id })))?.ok, true)
  assert.equal((await module.execute?.('node.drain', { instanceId: 'ins-node1' }, ctx({ id })))?.ok, true)
  assert.equal((await module.execute?.('node.addExisted', { instanceIds: ['ins-old'] }, ctx({ id })))?.ok, true)
  const missingType = await module.execute?.('nodepool.create', { name: 'p1' }, ctx({ id }))
  assert.equal(missingType?.ok, false)
  for (const poolType of ['Regular', 'Native', 'Super']) {
    const created = await module.execute?.('nodepool.create', { poolType, name: poolType + '-pool' }, ctx({ id }))
    assert.equal(created?.ok, true)
  }
  assert.equal(calls.some((row) => row.action === 'DrainClusterNode'), true)
  assert.equal(calls.some((row) => row.action === 'AddExistedInstances'), true)
  assert.equal(calls.filter((row) => row.action === 'CreateClusterNodePool').length, 3)
})

test('g2.7 namespace quota, addon, rbac, policy confirm, audit switch', async () => {
  const { module, calls } = mockCall()
  const id = 'tencent.tke:ap-guangzhou:cls-abc12345'
  assert.equal((await module.execute?.('namespace.create', { name: 'app', quota: { cpu: '4' } }, ctx({ id })))?.ok, true)
  assert.equal((await module.execute?.('addon.install', { name: 'CBS', version: '1.1.4' }, ctx({ id })))?.ok, true)
  assert.equal((await module.execute?.('rbac.bind', { user: '10000', role: 'tke:admin' }, ctx({ id })))?.ok, true)
  const deny = await module.execute?.('policy.toggle', { name: 'block-privileged', enable: false }, ctx({ id }))
  assert.equal(deny?.ok, false)
  assert.match(String(deny && 'error' in deny ? deny.error : ''), /二次确认/)
  assert.equal((await module.execute?.('policy.toggle', { name: 'block-privileged', enable: false, confirmed: true }, ctx({ id })))?.ok, true)
  assert.equal((await module.execute?.('ops.audit', { enable: true }, ctx({ id })))?.ok, true)
  assert.equal(calls.some((row) => row.action === 'CreateAddon'), true)
  assert.equal(calls.some((row) => row.action === 'DisablePolicy'), true)
  assert.equal(calls.some((row) => row.action === 'EnableClusterAudit'), true)
})

test('g4.2 kind=cluster render has no 解析记录 and query does not write overlay', async () => {
  const text = renderQuery({
    query: '',
    kind: 'cluster',
    region: 'ap-guangzhou',
    items: [mapClusterItem((fixture('cluster-list.json').Clusters as TkeClusterItem[])[0], 'tencent.tke', 'ap-guangzhou')],
    errors: [],
    total: 1,
  })
  assert.doesNotMatch(text, /解析记录/)
  assert.match(text, /集群 ID/)
  assert.doesNotMatch(text, /kubeconfig/i)
  const dirName = mkdtempSync(join(tmpdir(), 'cloud-infra-tke-'))
  const prev = process.env.DSH_HOME
  process.env.DSH_HOME = dirName
  try {
    writeOverlay(withDefaults({ providers: { tencent: { secretId: 'AKIDabcdefghijklmnop', secretKey: 'super-secret-value-1234' } } }))
    const before = readFileSync(join(dirName, 'cloud-infra.json'), 'utf8')
    const req = {
      method: 'POST',
      url: '/cloud-infra',
      headers: { host: '127.0.0.1:3091', origin: 'http://127.0.0.1:3091' },
      socket: { remoteAddress: '127.0.0.1' },
      async *[Symbol.asyncIterator]() {
        yield Buffer.from(JSON.stringify({ method: 'query', kind: 'cluster', region: 'ap-guangzhou' }))
      },
    }
    const out = { status: 0, body: '' }
    const res = { statusCode: 0, setHeader() {}, end(text: string) { out.status = res.statusCode; out.body = String(text || '') } }
    await handleApi(req as never, res as never, withDefaults({
      timeoutMs: 800,
      providers: { tencent: { secretId: 'AKIDabcdefghijklmnop', secretKey: 'super-secret-value-1234' } },
    }))
    const after = readFileSync(join(dirName, 'cloud-infra.json'), 'utf8')
    assert.equal(after, before)
    assert.doesNotMatch(out.body, /解析记录/)
  } finally {
    process.env.DSH_HOME = prev
    rmSync(dirName, { recursive: true, force: true })
  }
})

test('g4.2 client ClusterConsole is independent of DetailView records table', () => {
  const client = src('src/client.js')
  assert.match(client, /function ClusterConsole/)
  assert.match(client, /function ClusterDetail/)
  assert.match(client, /function CreateWizard/)
  assert.match(client, /function DeleteWizard/)
  assert.match(client, /选择地域/)
  assert.match(client, /我已阅读并同意腾讯云 TKE 服务等级协议/)
  assert.match(client, /我已知晓风险/)
  assert.match(client, /ci-np-card/)
  assert.match(client, /ci-side-nav/)
  assert.match(client, /kind === "cluster"/)
  const start = client.indexOf('function ClusterConsole')
  const end = client.indexOf('function SearchToolView')
  const consoleSrc = client.slice(start, end)
  assert.doesNotMatch(consoleSrc, /api\("config"/)
  assert.doesNotMatch(consoleSrc, /解析记录/)
  assert.doesNotMatch(consoleSrc, /function DetailView/)
})

test('queryResources fans out kind=cluster to tencent.tke', async () => {
  const { module } = mockCall()
  const { createRegistry } = await import('../core/registry.js')
  const source = createRegistry()
  source.registerProvider({
    id: 'tencent',
    title: '腾讯云',
    fields: [{ key: 'secretId', label: 'SecretId' }, { key: 'secretKey', label: 'SecretKey' }],
  })
  source.registerModule(module)
  const result = await queryResources({
    kind: 'cluster',
    region: 'ap-guangzhou',
    query: 'prod',
  }, withDefaults({
    providers: { tencent: { secretId: 'id', secretKey: 'key' } },
    modules: { 'tencent.tke': true },
  }), undefined, source)
  assert.equal(result.kind, 'cluster')
  assert.equal(result.region, 'ap-guangzhou')
  assert.equal(result.items[0].kind, 'cluster')
  assert.doesNotMatch(renderQuery(result), /解析记录/)
})

test('buildClusterFilters maps console filter names', () => {
  const filters = buildClusterFilters(ctx({
    query: 'demo',
    filters: { clusterType: 'edge', status: 'Running', vpcId: 'vpc-1', tag: 'team:sre' },
  }))
  assert.deepEqual(filters.map((item) => item.Name), ['ClusterName', 'ClusterType', 'ClusterStatus', 'vpc-id', 'tag:team'])
})
