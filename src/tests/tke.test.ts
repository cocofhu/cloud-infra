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
  mapNodePoolCard,
  matchNodeFilters,
  parseClusterRef,
  TKE_SIDEBAR_PAGES,
  validateCreatePayload,
  validateDeletePayload,
  validateNodeCreatePayload,
  validateNodePoolPayload,
  validateAddExistedPayload,
  type TkeClusterItem,
  type TkeInstanceItem,
  type TkeNodePoolItem,
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
  const calls: Array<{ action: string; payload: unknown; region?: string; version?: string }> = []
  const call = async (action: string, payload: unknown, _creds: unknown, opts?: { region?: string; version?: string }) => {
    calls.push({ action, payload, region: opts?.region, version: opts?.version })
    if (action === 'DescribeClusters') {
      const ids = (payload as { ClusterIds?: string[] }).ClusterIds
      const filters = (payload as { Filters?: Array<{ Name: string; Values: string[] }> }).Filters || []
      const all = fixture('cluster-list.json')
      if (ids?.length) {
        const hit = (all.Clusters as TkeClusterItem[]).find((item) => item.ClusterId === ids[0])
        return { Clusters: hit ? [hit] : [], TotalCount: hit ? 1 : 0 }
      }
      if (filters.some((item) => item.Name === 'ClusterType' && item.Values.includes('EXTERNAL_CLUSTER'))) {
        return { Clusters: [], TotalCount: 0 }
      }
      return all
    }
    if (action === 'DescribeEKSClusters') {
      const ids = (payload as { ClusterIds?: string[] }).ClusterIds
      if (ids?.includes('cls-eks0001')) {
        return {
          Clusters: [{
            ClusterId: 'cls-eks0001',
            ClusterName: 'eks-empty',
            ClusterType: 'SERVERLESS_CLUSTER',
            ClusterStatus: 'Running',
            ClusterNodeNum: 0,
            DeletionProtection: false,
          }],
          TotalCount: 1,
        }
      }
      return { Clusters: [], TotalCount: 0 }
    }
    if (action === 'DescribeTKEEdgeClusters') {
      const ids = (payload as { ClusterIds?: string[] }).ClusterIds
      if (ids?.includes('cls-edge0001')) {
        return {
          Clusters: [{
            ClusterId: 'cls-edge0001',
            ClusterName: 'edge-empty',
            ClusterType: 'EDGE_CLUSTER',
            ClusterStatus: 'Running',
            ClusterNodeNum: 0,
            DeletionProtection: false,
          }],
          TotalCount: 1,
        }
      }
      return { Clusters: [], TotalCount: 0 }
    }
    if (action === 'CreateCluster') {
      const type = String((payload as { ClusterType?: string }).ClusterType || '')
      return { ClusterId: type === 'EXTERNAL_CLUSTER' ? 'cls-ext00001' : 'cls-created01' }
    }
    if (action === 'DescribeClusterInstances') {
      const clusterId = String((payload as { ClusterId?: string }).ClusterId || '')
      if (clusterId === 'cls-empty001' || clusterId === 'cls-edge0001' || clusterId === 'cls-eks0001') return { TotalCount: 0, InstanceSet: [] }
      return fixture('cluster-instances.json')
    }
    if (action === 'DescribeClusterNodePools') return fixture('node-pools.json')
    if (action === 'DescribeAddon') return fixture('addon-list.json')
    if (action === 'DescribeClusterEndpointStatus') {
      const extra = (payload as { IsExtranet?: boolean }).IsExtranet === true
      return { Status: extra ? 'NotFound' : 'Created' }
    }
    if (action === 'DescribeClusterSecurity') return { Kubeconfig: 'apiVersion: v1\nkind: Config\n' }
    if (action === 'DescribeExternalClusterSpec') return { Spec: 'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: tke-register\n' }
    if (action === 'ForwardApplicationRequestV3') {
      const path = String((payload as { Path?: string }).Path || '')
      if (path.includes('clusterrolebindings')) {
        return {
          ResponseBody: JSON.stringify({
            items: [{
              metadata: { name: 'tke-admin-10000' },
              roleRef: { name: 'tke:admin' },
              subjects: [{ kind: 'User', name: '10000' }],
            }],
          }),
        }
      }
      return { ResponseBody: JSON.stringify({ items: [{ metadata: { name: 'default' }, status: { phase: 'Active' } }] }) }
    }
    if (action === 'DescribeOpenPolicyList') {
      return {
        OpenPolicyInfoList: [{
          PolicyName: '存在节点的集群不允许删除',
          Name: 'block-cluster-deletion-rule',
          Kind: 'blockclusterdeletion',
          EnabledStatus: 'open',
          EnforcementAction: 'deny',
          PolicyCategory: 'cluster',
        }],
      }
    }
    if (action === 'DescribeLogSwitches') {
      return {
        SwitchSet: [{
          ClusterId: 'cls-abc12345',
          Audit: { Enable: false },
          Event: { Enable: true },
        }],
      }
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
  const { module, calls } = mockCall()
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
  assert.equal(detail?.flags?.intranet, true)
  assert.equal(detail?.flags?.internet, false)
  assert.ok((detail?.cards?.nodePools || []).some((card) => (card.columns || []).some((col) => col.label === '计费' && col.value === '按量计费')))
  assert.equal(detail?.flags?.audit, false)
  assert.equal(detail?.flags?.event, true)
  const logCall = calls.find((row) => row.action === 'DescribeLogSwitches')
  assert.deepEqual((logCall?.payload as { ClusterIds?: string[] }).ClusterIds, ['cls-abc12345'])
  const endpoints = calls.filter((row) => row.action === 'DescribeClusterEndpointStatus')
  assert.equal(endpoints.length, 2)
  assert.ok(endpoints.some((row) => (row.payload as { IsExtranet?: boolean }).IsExtranet === true))
  assert.ok(endpoints.some((row) => (row.payload as { IsExtranet?: boolean }).IsExtranet === false))
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
  assert.equal(validateCreatePayload({ sla: true, clusterName: 'edge', clusterVersion: '1.28', vpcId: 'vpc-1', clusterType: 'EDGE_CLUSTER' }), '缺少 Pod 网段')
  assert.equal(validateCreatePayload({ sla: true, clusterName: 'edge', clusterVersion: '1.28', vpcId: 'vpc-1', clusterCidr: '172.16.0.0/20', serviceCidr: '192.168.0.0/18', clusterType: 'EDGE_CLUSTER' }), null)
  const { module, calls } = mockCall()
  const denied = await module.execute?.('cluster.create', { clusterType: 'elastic', sla: true, clusterName: 'nope', clusterVersion: '1.28', vpcId: 'vpc-1' }, ctx())
  assert.equal(denied?.ok, false)
  const created = await module.execute?.('cluster.create', {
    clusterType: 'MANAGED_CLUSTER',
    sla: true,
    clusterName: 'demo',
    clusterVersion: '1.28.3',
    vpcId: 'vpc-1',
    clusterCidr: '172.16.0.0/16',
    maxNodePodNum: 64,
    maxClusterServiceNum: 256,
    region: 'ap-guangzhou',
  }, ctx())
  assert.equal(created?.ok, true)
  assert.equal(calls.some((row) => row.action === 'CreateCluster'), true)
  const createdBody = calls.find((row) => row.action === 'CreateCluster')?.payload as { ClusterCIDRSettings?: { MaxNodePodNum?: number; MaxClusterServiceNum?: number } }
  assert.equal(createdBody.ClusterCIDRSettings?.MaxNodePodNum, 64)
  assert.equal(createdBody.ClusterCIDRSettings?.MaxClusterServiceNum, 256)
  const edge = await module.execute?.('cluster.create', {
    clusterType: 'EDGE_CLUSTER',
    sla: true,
    clusterName: 'edge',
    clusterVersion: '1.28.3',
    vpcId: 'vpc-1',
    clusterCidr: '172.16.0.0/20',
    serviceCidr: '192.168.0.0/18',
  }, ctx())
  assert.equal(edge?.ok, true)
  const edgeBody = calls.find((row) => row.action === 'CreateTKEEdgeCluster')?.payload as { PodCIDR?: string; ServiceCIDR?: string; VpcId?: string }
  assert.equal(edgeBody.PodCIDR, '172.16.0.0/20')
  assert.equal(edgeBody.ServiceCIDR, '192.168.0.0/18')
  const registered = await module.execute?.('cluster.create', {
    clusterType: 'EXTERNAL_CLUSTER',
    sla: true,
    clusterName: 'ext',
    clusterVersion: '1.28.3',
  }, ctx())
  assert.equal(registered?.ok, true)
  const extCreate = calls.find((row) => row.action === 'CreateCluster' && (row.payload as { ClusterType?: string }).ClusterType === 'EXTERNAL_CLUSTER')
  assert.ok(extCreate)
  assert.equal((extCreate?.payload as { ClusterBasicSettings?: { ClusterName?: string; ClusterVersion?: string } }).ClusterBasicSettings?.ClusterName, 'ext')
  assert.equal((extCreate?.payload as { ClusterBasicSettings?: { ClusterVersion?: string } }).ClusterBasicSettings?.ClusterVersion, '1.28.3')
  const specCall = calls.find((row) => row.action === 'DescribeExternalClusterSpec')
  assert.equal((specCall?.payload as { ClusterId?: string }).ClusterId, 'cls-ext00001')
  assert.equal((specCall?.payload as { ClusterName?: string }).ClusterName, undefined)
  assert.equal((specCall?.payload as { IsExtranet?: boolean }).IsExtranet, false)
  const registeredData = registered && 'data' in registered && registered.data && typeof registered.data === 'object'
    ? registered.data as { spec?: string; clusterId?: string }
    : undefined
  assert.ok(registeredData?.spec)
  assert.equal(registeredData?.clusterId, 'cls-ext00001')
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
  const edgeDel = await module.execute?.('cluster.delete', { riskAck: true, instanceDeleteMode: 'retain' }, ctx({
    id: 'tencent.tke:ap-guangzhou:cls-edge0001',
  }))
  assert.equal(edgeDel?.ok, true)
  const edgeAction = calls.find((row) => row.action === 'DeleteTKEEdgeCluster')
  assert.equal((edgeAction?.payload as { ClusterId?: string }).ClusterId, 'cls-edge0001')
  assert.equal(calls.filter((row) => row.action === 'DeleteCluster' && (row.payload as { ClusterId?: string }).ClusterId === 'cls-edge0001').length, 0)
  const eksDel = await module.execute?.('cluster.delete', { riskAck: true }, ctx({
    id: 'tencent.tke:ap-guangzhou:cls-eks0001',
  }))
  assert.equal(eksDel?.ok, true)
  assert.equal(calls.some((row) => row.action === 'DeleteEKSCluster'), true)
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
  const kubeData = kube && 'data' in kube && kube.data && typeof kube.data === 'object'
    ? kube.data as { kubeconfig?: string }
    : undefined
  assert.ok(kubeData?.kubeconfig)
  const detail = await module.detail?.(ctx({ id: 'tencent.tke:ap-guangzhou:cls-abc12345' }))
  assert.doesNotMatch(JSON.stringify(detail), /kind: Config/)
})

test('g2.6 node cordon/drain/add existing and three node pool types', async () => {
  const nodes = fixture('cluster-instances.json').InstanceSet as TkeInstanceItem[]
  assert.equal(matchNodeFilters(nodes[1], { unschedulable: 'yes', ip: '10.0.0.9' }), true)
  assert.equal(matchNodeFilters(nodes[0], { unschedulable: 'yes' }), false)
  assert.equal(matchNodeFilters(nodes[0], { label: 'role=worker' }), true)
  assert.equal(matchNodeFilters(nodes[0], { label: 'role=db' }), false)
  const { module, calls } = mockCall()
  const id = 'tencent.tke:ap-guangzhou:cls-abc12345'
  assert.equal((await module.execute?.('node.cordon', { instanceId: 'ins-node1' }, ctx({ id })))?.ok, true)
  const cordon = calls.find((row) => row.action === 'ForwardApplicationRequestV3' && String((row.payload as { Path?: string }).Path || '').includes('/api/v1/nodes/'))
  assert.match(String((cordon?.payload as { Path?: string }).Path || ''), /10\.0\.0\.8/)
  assert.doesNotMatch(String((cordon?.payload as { Path?: string }).Path || ''), /ins-node1/)
  assert.equal((await module.execute?.('node.drain', { instanceId: 'ins-node1' }, ctx({ id })))?.ok, true)
  assert.match(validateAddExistedPayload({ instanceIds: ['ins-old'] }) || '', /安全组|登录/)
  const noLogin = await module.execute?.('node.addExisted', { instanceIds: ['ins-old'] }, ctx({ id }))
  assert.equal(noLogin?.ok, false)
  assert.equal((await module.execute?.('node.addExisted', {
    instanceIds: ['ins-old'],
    securityGroupIds: ['sg-1'],
    loginKeyIds: ['skey-1'],
  }, ctx({ id })))?.ok, true)
  const addExisted = calls.find((row) => row.action === 'AddExistedInstances')?.payload as { LoginSettings?: { KeyIds?: string[] }; SecurityGroupIds?: string[] }
  assert.deepEqual(addExisted.SecurityGroupIds, ['sg-1'])
  assert.deepEqual(addExisted.LoginSettings?.KeyIds, ['skey-1'])
  assert.match(validateNodeCreatePayload({ runInstancePara: {} }) || '', /机型|镜像|安全组|子网|可用区/)
  assert.match(validateNodeCreatePayload({
    instanceType: 'S5.MEDIUM2',
    imageId: 'img-demo',
    vpcId: 'vpc-1',
    subnetId: 'subnet-1',
    securityGroupIds: 'sg-1',
  }) || '', /可用区/)
  const emptyNode = await module.execute?.('node.create', { runInstancePara: {} }, ctx({ id }))
  assert.equal(emptyNode?.ok, false)
  const createdNode = await module.execute?.('node.create', {
    instanceType: 'S5.MEDIUM2',
    imageId: 'img-demo',
    vpcId: 'vpc-1',
    subnetId: 'subnet-1',
    securityGroupIds: 'sg-1',
    zone: 'ap-guangzhou-3',
    loginKeyIds: 'skey-1',
    instanceChargeType: 'POSTPAID_BY_HOUR',
  }, ctx({ id }))
  assert.equal(createdNode?.ok, true)
  const runPara = calls.find((row) => row.action === 'CreateClusterInstances')?.payload as { RunInstancePara?: string }
  assert.equal(typeof runPara.RunInstancePara, 'string')
  assert.match(String(runPara.RunInstancePara), /S5\.MEDIUM2/)
  const runBody = JSON.parse(String(runPara.RunInstancePara)) as { Placement?: { Zone?: string }; LoginSettings?: { KeyIds?: string[] } }
  assert.equal(runBody.Placement?.Zone, 'ap-guangzhou-3')
  assert.deepEqual(runBody.LoginSettings?.KeyIds, ['skey-1'])
  assert.equal((await module.execute?.('nodepool.create', { name: 'p1' }, ctx({ id })))?.ok, false)
  assert.match(validateNodePoolPayload({ poolType: 'Regular', name: 'p1' }) || '', /VPC|子网|机型|镜像|安全组/)
  const regular = await module.execute?.('nodepool.create', {
    poolType: 'Regular',
    name: 'Regular-pool',
    vpcId: 'vpc-1',
    subnetId: 'subnet-1',
    instanceType: 'S5.MEDIUM2',
    imageId: 'img-demo',
    securityGroupIds: 'sg-1',
  }, ctx({ id }))
  assert.equal(regular?.ok, true)
  const native = await module.execute?.('nodepool.create', {
    poolType: 'Native',
    name: 'Native-pool',
    subnetIds: ['subnet-1'],
    instanceTypes: ['S5.MEDIUM2'],
  }, ctx({ id }))
  assert.equal(native?.ok, true)
  const superPool = await module.execute?.('nodepool.create', {
    poolType: 'Super',
    name: 'Super-pool',
    securityGroupIds: ['sg-1'],
    subnetIds: ['subnet-1'],
  }, ctx({ id }))
  assert.equal(superPool?.ok, true)
  assert.equal(calls.some((row) => row.action === 'DrainClusterNode'), true)
  assert.equal(calls.some((row) => row.action === 'AddExistedInstances'), true)
  assert.equal(calls.filter((row) => row.action === 'CreateClusterNodePool').length, 1)
  assert.equal(calls.filter((row) => row.action === 'CreateNodePool').length, 1)
  assert.equal(calls.find((row) => row.action === 'CreateNodePool')?.version, '2022-05-01')
  assert.equal(calls.filter((row) => row.action === 'CreateClusterVirtualNodePool').length, 1)
  const asg = calls.find((row) => row.action === 'CreateClusterNodePool')?.payload as { AutoScalingGroupPara?: string; LaunchConfigurePara?: string }
  assert.equal(typeof asg.AutoScalingGroupPara, 'string')
  assert.equal(typeof asg.LaunchConfigurePara, 'string')
  assert.equal((await module.execute?.('nodepool.scale', { nodePoolId: 'np-regular1', desired: 3, poolType: 'Regular' }, ctx({ id })))?.ok, true)
  const asgScale = calls.find((row) => row.action === 'ModifyNodePoolDesiredCapacityAboutAsg')
  assert.equal((asgScale?.payload as { NodePoolId?: string; DesiredCapacity?: number }).NodePoolId, 'np-regular1')
  assert.equal((asgScale?.payload as { DesiredCapacity?: number }).DesiredCapacity, 3)
  assert.equal((await module.execute?.('nodepool.scale', { nodePoolId: 'np-native1', desired: 2, poolType: 'Native' }, ctx({ id })))?.ok, true)
  const nativeScale = calls.find((row) => row.action === 'ModifyNodePool')
  assert.equal(nativeScale?.version, '2022-05-01')
  assert.equal((nativeScale?.payload as { NodePoolId?: string }).NodePoolId, 'np-native1')
  const superScale = await module.execute?.('nodepool.scale', { nodePoolId: 'np-super1', desired: 2, poolType: 'Super' }, ctx({ id }))
  assert.equal(superScale?.ok, false)
  assert.match(String(superScale && 'error' in superScale ? superScale.error : ''), /超级节点池/)
  assert.equal(calls.filter((row) => row.action === 'ModifyNodePoolDesiredCapacityAboutAsg' && (row.payload as { NodePoolId?: string }).NodePoolId === 'np-super1').length, 0)
  const nativeById = await module.execute?.('nodepool.scale', { nodePoolId: 'np-native1', desired: 1 }, ctx({ id }))
  assert.equal(nativeById?.ok, true)
  assert.equal(calls.filter((row) => row.action === 'ModifyNodePool').length, 2)
})

test('g2.7 namespace quota, addon, rbac, policy confirm, audit switch', async () => {
  const { module, calls } = mockCall()
  const id = 'tencent.tke:ap-guangzhou:cls-abc12345'
  assert.equal((await module.execute?.('namespace.create', { name: 'app', quota: { cpu: '4' } }, ctx({ id })))?.ok, true)
  assert.equal((await module.execute?.('addon.install', { name: 'CBS', version: '1.1.4' }, ctx({ id })))?.ok, true)
  assert.equal((await module.execute?.('rbac.bind', { user: '10000', role: 'tke:admin' }, ctx({ id })))?.ok, true)
  const deny = await module.execute?.('policy.toggle', { name: 'block-cluster-deletion-rule', kind: 'blockclusterdeletion', enable: false }, ctx({ id }))
  assert.equal(deny?.ok, false)
  assert.match(String(deny && 'error' in deny ? deny.error : ''), /二次确认/)
  assert.equal((await module.execute?.('policy.toggle', { name: 'block-cluster-deletion-rule', kind: 'blockclusterdeletion', enable: false, confirmed: true }, ctx({ id })))?.ok, true)
  assert.equal((await module.execute?.('ops.audit', { enable: true }, ctx({ id })))?.ok, true)
  assert.equal(calls.some((row) => row.action === 'InstallAddon'), true)
  assert.equal(calls.some((row) => row.action === 'CreateAddon'), false)
  assert.equal(calls.some((row) => row.action === 'ModifyOpenPolicyList'), true)
  assert.equal(calls.some((row) => row.action === 'DisablePolicy' || row.action === 'EnablePolicy'), false)
  const bind = calls.find((row) => row.action === 'ForwardApplicationRequestV3' && String((row.payload as { Path?: string }).Path || '').includes('clusterrolebindings') && (row.payload as { Method?: string }).Method === 'POST')
  assert.ok(bind)
  assert.equal(calls.some((row) => row.action === 'CreateClusterRoleBinding'), false)
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
  assert.match(client, /function FormPanel/)
  assert.match(client, /选择地域/)
  assert.match(client, /我已阅读并同意腾讯云 TKE 服务等级协议/)
  assert.match(client, /我已知晓风险/)
  assert.match(client, /ci-np-card/)
  assert.match(client, /ci-side-nav/)
  assert.match(client, /kind === "cluster"/)
  assert.match(client, /单节点 Pod 上限/)
  assert.match(client, /生成导入配置/)
  assert.match(client, /先创建注册集群拿到 ClusterId/)
  assert.match(client, /可用区/)
  assert.match(client, /登录密钥/)
  assert.match(client, /超级节点池不按 ASG/)
  assert.match(client, /重装滚动/)
  assert.match(client, /计费/)
  assert.doesNotMatch(client, /而不是走 CreateCluster/)
  const start = client.indexOf('function CreateWizard')
  const end = client.indexOf('function SearchToolView')
  const consoleSrc = client.slice(start, end)
  assert.doesNotMatch(consoleSrc, /api\("config"/)
  assert.doesNotMatch(consoleSrc, /解析记录/)
  assert.doesNotMatch(consoleSrc, /function DetailView/)
  assert.doesNotMatch(consoleSrc, /window\.prompt/)
})

test('g2.2 list paginates merged results in memory', async () => {
  const { module } = mockCall()
  const first = await module.list(ctx({ offset: 0, limit: 1 }))
  assert.equal(first.items.length, 1)
  assert.equal(first.total, 2)
  assert.equal(first.hasMore, true)
  const second = await module.list(ctx({ offset: 1, limit: 1 }))
  assert.equal(second.items.length, 1)
  assert.equal(second.hasMore, false)
  const filtered = await module.list(ctx({
    offset: 0,
    limit: 12,
    query: 'prod',
    filters: { clusterType: '标准集群', vpcId: 'vpc-demo001' },
  }))
  assert.equal(filtered.hasMore, false)
  assert.ok((filtered.total || 0) >= 1)
})

test('g1.1 three-part cluster id resolves module without lastIndexOf slice', async () => {
  const req = {
    method: 'POST',
    url: '/cloud-infra',
    headers: { host: '127.0.0.1:3091', origin: 'http://127.0.0.1:3091' },
    socket: { remoteAddress: '127.0.0.1' },
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(JSON.stringify({ method: 'detail', id: 'tencent.tke:ap-guangzhou:cls-abc12345' }))
    },
  }
  const out = { status: 0, body: '' }
  const res = { statusCode: 0, setHeader() {}, end(text: string) { out.status = res.statusCode; out.body = String(text || '') } }
  await handleApi(req as never, res as never, withDefaults({ timeoutMs: 800 }))
  assert.doesNotMatch(out.body, /未知模块/)
  assert.match(out.body, /未配置/)
})

test('g2.6 node pool card includes billing', () => {
  const card = mapNodePoolCard((fixture('node-pools.json').NodePoolSet as TkeNodePoolItem[])[0])
  assert.equal(card.columns?.find((col) => col.label === '计费')?.value, '按量计费')
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
