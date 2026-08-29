import { publicErrorMessage } from '../../../core/safe-error.js'
import { registerModule } from '../../../core/registry.js'
import type {
  ActionResult,
  DetailBlock,
  DetailCard,
  DetailPage,
  ModuleContext,
  ResourceAction,
  ResourceCard,
  ResourceDetail,
  ResourceModule,
  ResourceStatus,
} from '../../../core/types.js'
import { tkeCall } from '../client.js'

export const TKE_SIDEBAR_PAGES: DetailPage[] = [
  { id: 'basic', title: '基本信息' },
  { id: 'nodes', title: '节点管理' },
  { id: 'pools', title: '节点池' },
  { id: 'namespaces', title: '命名空间' },
  { id: 'addons', title: '组件管理' },
  { id: 'rbac', title: '授权管理' },
  { id: 'policy', title: '策略管理' },
  { id: 'ops', title: '运维功能' },
]

export const TKE_CLUSTER_TYPES = {
  MANAGED_CLUSTER: '标准集群',
  INDEPENDENT_CLUSTER: '独立集群',
  SERVERLESS_CLUSTER: '弹性集群',
  EDGE_CLUSTER: '边缘集群',
  EXTERNAL_CLUSTER: '注册集群',
} as const

export const CREATE_BLOCKED_TYPES = new Set(['SERVERLESS_CLUSTER', 'INDEPENDENT_CLUSTER', 'EKS', 'elastic'])

const ACTIONS: ResourceAction[] = [
  { id: 'cluster.create', label: '新建集群', confirm: 'default' },
  { id: 'cluster.delete', label: '删除集群', confirm: 'always' },
  { id: 'cluster.protection', label: '删除保护', confirm: 'default' },
  { id: 'cluster.upgrade.master', label: 'Master 升级', confirm: 'default' },
  { id: 'cluster.upgrade.node', label: 'Node 升级', confirm: 'default' },
  { id: 'cluster.endpoint', label: 'APIServer 访问', confirm: 'default' },
  { id: 'cluster.kubeconfig', label: '复制凭证', confirm: 'default' },
  { id: 'node.cordon', label: '封锁节点', confirm: 'default' },
  { id: 'node.uncordon', label: '取消封锁', confirm: 'default' },
  { id: 'node.drain', label: '驱逐节点', confirm: 'always' },
  { id: 'node.remove', label: '移除节点', confirm: 'always' },
  { id: 'node.addExisted', label: '添加已有节点', confirm: 'default' },
  { id: 'node.create', label: '新建节点', confirm: 'default' },
  { id: 'nodepool.create', label: '新建节点池', confirm: 'default' },
  { id: 'nodepool.scale', label: '调整数量', confirm: 'default' },
  { id: 'nodepool.autoscale', label: '弹性伸缩', confirm: 'default' },
  { id: 'nodepool.protection', label: '节点池删除保护', confirm: 'default' },
  { id: 'nodepool.delete', label: '删除节点池', confirm: 'always' },
  { id: 'namespace.create', label: '新建命名空间', confirm: 'default' },
  { id: 'namespace.update', label: '更新配额', confirm: 'default' },
  { id: 'namespace.delete', label: '删除命名空间', confirm: 'always' },
  { id: 'addon.install', label: '安装组件', confirm: 'default' },
  { id: 'addon.upgrade', label: '升级组件', confirm: 'default' },
  { id: 'addon.uninstall', label: '卸载组件', confirm: 'always' },
  { id: 'rbac.bind', label: '绑定预设角色', confirm: 'default' },
  { id: 'rbac.unbind', label: '解除绑定', confirm: 'always' },
  { id: 'policy.toggle', label: '开关策略', confirm: 'always' },
  { id: 'ops.audit', label: '集群审计', confirm: 'default' },
  { id: 'ops.event', label: '事件投递', confirm: 'default' },
]

export interface TkeClusterItem {
  ClusterId?: string
  ClusterName?: string
  ClusterDescription?: string
  ClusterVersion?: string
  ClusterType?: string
  ClusterStatus?: string
  ClusterNodeNum?: number
  ClusterMaterNodeNum?: number
  CreatedTime?: string
  DeletionProtection?: boolean
  ContainerRuntime?: string
  Property?: string
  ClusterNetworkSettings?: {
    VpcId?: string
    ClusterCIDR?: string
    ServiceCIDR?: string
    MaxNodePodNum?: number
    MaxClusterServiceNum?: number
    Subnets?: string[]
    KubeProxyMode?: string
    Ipvs?: boolean
  }
  TagSpecification?: Array<{ Tags?: Array<{ Key?: string; Value?: string }> }>
}

export interface TkeInstanceItem {
  InstanceId?: string
  InstanceRole?: string
  InstanceState?: string
  LanIP?: string
  NodeName?: string
  Unschedulable?: boolean | number
  NodePoolId?: string
  InstanceType?: string
  CreatedTime?: string
  Labels?: Array<{ Name?: string; Value?: string }> | Record<string, string>
}

export interface TkeNodePoolItem {
  NodePoolId?: string
  Name?: string
  LifeState?: string
  NodePoolType?: string
  DesiredNodesNum?: number
  MinNodesNum?: number
  MaxNodesNum?: number
  InstanceTypes?: string[]
  DeletionProtection?: boolean
  AutoscalingGroupStatus?: string
  NodeCountSummary?: {
    AutoscalingAdded?: { Total?: number; Ready?: number }
    ManuallyAdded?: { Total?: number; Ready?: number }
  }
  Labels?: Array<{ Name?: string; Value?: string }>
  InstanceChargeType?: string
  ChargeType?: string
}

export interface TkeAddonItem {
  AddonName?: string
  AddonVersion?: string
  Phase?: string
  LatestVersion?: string
}

export function clusterTypeLabel(type?: string): string {
  const key = String(type || '').toUpperCase()
  if (key === 'EKS' || key === 'SERVERLESS') return TKE_CLUSTER_TYPES.SERVERLESS_CLUSTER
  if (key in TKE_CLUSTER_TYPES) return TKE_CLUSTER_TYPES[key as keyof typeof TKE_CLUSTER_TYPES]
  return type || '-'
}

export function mapClusterStatus(status?: string): ResourceStatus {
  const value = String(status || '').toLowerCase()
  if (value === 'running' || value === 'normal' || value === 'idling') return 'enable'
  if (value === 'initializing' || value === 'upgrading' || value === 'creating' || value === 'deleting') return 'pause'
  if (value === 'abnormal' || value === 'failed' || value === 'error' || value === 'idled') return 'error'
  return 'unknown'
}

export function parseClusterRef(id: string): { moduleId: string; region: string; clusterId: string } {
  const parts = String(id || '').split(':')
  if (parts.length >= 3) {
    return { moduleId: parts[0], region: parts[1], clusterId: parts.slice(2).join(':') }
  }
  if (parts.length === 2) {
    return { moduleId: parts[0], region: '', clusterId: parts[1] }
  }
  return { moduleId: 'tencent.tke', region: '', clusterId: String(id || '') }
}

export function mapClusterItem(item: TkeClusterItem, moduleId = 'tencent.tke', region = ''): ResourceCard {
  const clusterId = String(item.ClusterId || '')
  const title = item.ClusterName || clusterId
  const status = mapClusterStatus(item.ClusterStatus)
  const typeLabel = clusterTypeLabel(item.ClusterType)
  const vpc = item.ClusterNetworkSettings?.VpcId || '-'
  const nodes = item.ClusterNodeNum ?? 0
  const tags = (item.TagSpecification || []).flatMap((spec) => spec.Tags || []).map((tag) => `${tag.Key}=${tag.Value}`)
  return {
    id: region ? `${moduleId}:${region}:${clusterId}` : `${moduleId}:${clusterId}`,
    moduleId,
    provider: 'tencent',
    kind: 'cluster',
    title,
    description: [typeLabel, item.ClusterStatus, item.ClusterVersion].filter(Boolean).join(' · '),
    status,
    badges: [typeLabel, item.DeletionProtection ? '删除保护' : ''].filter(Boolean) as string[],
    columns: [
      { label: '集群ID', value: clusterId },
      { label: '类型', value: typeLabel },
      { label: 'Kubernetes 版本', value: item.ClusterVersion || '-' },
      { label: '节点数', value: String(nodes) },
      { label: '所在网络', value: vpc },
      { label: '创建时间', value: item.CreatedTime || '-' },
      { label: '标签', value: tags.join(',') },
    ],
    openLabel: '管理',
  }
}

export function mapNodeCard(item: TkeInstanceItem): DetailCard {
  const unschedulable = item.Unschedulable === true || item.Unschedulable === 1
  const labels = nodeLabelPairs(item)
  const nodeName = String(item.NodeName || item.LanIP || item.InstanceId || '')
  return {
    id: String(item.InstanceId || ''),
    title: String(item.InstanceId || ''),
    status: String(item.InstanceState || ''),
    badges: [item.InstanceRole, unschedulable ? '已封锁' : ''].filter(Boolean) as string[],
    columns: [
      { label: 'IP', value: item.LanIP || '-' },
      { label: '节点名', value: nodeName || '-' },
      { label: '封锁', value: unschedulable ? '是' : '否' },
      { label: '状态', value: item.InstanceState || '-' },
      { label: '节点池', value: item.NodePoolId || '-' },
      { label: 'Label', value: labels.join(',') || '-' },
    ],
    flags: {
      unschedulable,
      instanceRole: item.InstanceRole || '',
      lanIp: item.LanIP || '',
      nodeName,
      nodePoolId: item.NodePoolId || '',
      labels: labels.join(','),
    },
  }
}

export function mapNodePoolCard(item: TkeNodePoolItem): DetailCard {
  const ready = (item.NodeCountSummary?.AutoscalingAdded?.Ready ?? 0) + (item.NodeCountSummary?.ManuallyAdded?.Ready ?? 0)
  const total = (item.NodeCountSummary?.AutoscalingAdded?.Total ?? 0) + (item.NodeCountSummary?.ManuallyAdded?.Total ?? 0)
  const desired = item.DesiredNodesNum ?? total
  const autoscaling = String(item.AutoscalingGroupStatus || '').toUpperCase() === 'ENABLED'
    || String(item.AutoscalingGroupStatus || '').toUpperCase() === 'ENABLE'
  const charge = chargeTypeLabel(item.InstanceChargeType || item.ChargeType)
  return {
    id: String(item.NodePoolId || ''),
    title: item.Name || String(item.NodePoolId || ''),
    status: item.LifeState || '',
    badges: [nodePoolTypeLabel(item.NodePoolType), item.DeletionProtection ? '删除保护' : ''].filter(Boolean) as string[],
    columns: [
      { label: '节点池ID', value: String(item.NodePoolId || '') },
      { label: '可用/总数', value: `${ready}/${desired || total}` },
      { label: '机型', value: (item.InstanceTypes || []).join(',') || '-' },
      { label: '计费', value: charge },
      { label: '弹性伸缩', value: autoscaling ? '已开启' : '未开启' },
    ],
    flags: {
      type: item.NodePoolType || 'Regular',
      desired,
      ready,
      total,
      autoscaling,
      deletionProtection: !!item.DeletionProtection,
      min: item.MinNodesNum ?? 0,
      max: item.MaxNodesNum ?? desired,
      charge,
    },
  }
}

export function chargeTypeLabel(raw?: string): string {
  const value = String(raw || '').toUpperCase()
  if (value === 'PREPAID' || value === 'PREPAID_BY_MONTH' || value === 'UNDER_THE_PERIOD') return '包年包月'
  if (value === 'SPOTPAID' || value === 'SPOT') return '竞价'
  if (value === 'POSTPAID_BY_HOUR' || value === 'POSTPAID' || value === 'POSTPAID_BY_MONTH') return '按量计费'
  return raw || '-'
}

export function nodePoolTypeLabel(type?: string): string {
  const value = String(type || 'Regular').toLowerCase()
  if (value === 'native' || value === 'nativenodepool') return '原生节点'
  if (value === 'super' || value === 'supernode' || value === 'eklet') return '超级节点'
  if (value === 'external') return '注册节点'
  return '普通节点'
}

export function buildClusterFilters(ctx: ModuleContext): Array<{ Name: string; Values: string[] }> {
  const filters: Array<{ Name: string; Values: string[] }> = []
  const keyword = ctx.clientLocalFilter === false ? String(ctx.query || '').trim() : String(ctx.filters?.keyword || ctx.filters?.name || '').trim()
  if (keyword) filters.push({ Name: 'ClusterName', Values: [keyword] })
  const type = String(ctx.filters?.clusterType || ctx.filters?.type || '').trim()
  if (type) filters.push({ Name: 'ClusterType', Values: [normalizeClusterType(type)] })
  const status = String(ctx.filters?.status || '').trim()
  if (status) filters.push({ Name: 'ClusterStatus', Values: [status] })
  const vpc = String(ctx.filters?.vpcId || ctx.filters?.vpc || '').trim()
  if (vpc) filters.push({ Name: 'vpc-id', Values: [vpc] })
  const tag = String(ctx.filters?.tag || '').trim()
  if (tag) filters.push({ Name: tag.includes(':') ? `tag:${tag.split(':')[0]}` : 'tag-key', Values: [tag.includes(':') ? tag.split(':').slice(1).join(':') : tag] })
  return filters
}

export function normalizeClusterType(raw: string): string {
  const value = raw.trim().toUpperCase().replace(/[\s-]/g, '_')
  if (value === 'STANDARD' || value === 'MANAGED' || value === '托管' || value === '标准集群') return 'MANAGED_CLUSTER'
  if (value === 'INDEPENDENT' || value === '独立集群') return 'INDEPENDENT_CLUSTER'
  if (value === 'ELASTIC' || value === 'SERVERLESS' || value === 'EKS' || value === '弹性集群') return 'SERVERLESS_CLUSTER'
  if (value === 'EDGE' || value === '边缘集群') return 'EDGE_CLUSTER'
  if (value === 'REGISTER' || value === 'EXTERNAL' || value === '注册集群') return 'EXTERNAL_CLUSTER'
  return raw
}

export function validateCreatePayload(payload: Record<string, unknown>): string | null {
  const type = normalizeClusterType(String(payload.clusterType || payload.ClusterType || 'MANAGED_CLUSTER'))
  if (CREATE_BLOCKED_TYPES.has(type) || type === 'SERVERLESS_CLUSTER' || type === 'INDEPENDENT_CLUSTER') {
    return type === 'SERVERLESS_CLUSTER'
      ? '弹性集群新建入口已关闭，请改用标准集群并添加超级节点'
      : '独立集群已停新建'
  }
  if (payload.sla !== true && payload.agreeSLA !== true) return '请勾选服务等级协议后再创建'
  const name = String(payload.clusterName || payload.ClusterName || '').trim()
  if (!name) return '缺少集群名称'
  const version = String(payload.clusterVersion || payload.ClusterVersion || '').trim()
  if (!version) return '缺少 Kubernetes 版本'
  if (type === 'EXTERNAL_CLUSTER') return null
  const vpc = String(payload.vpcId || payload.VpcId || '').trim()
  if (!vpc) return '缺少 VPC'
  if (type === 'EDGE_CLUSTER') {
    const pod = String(payload.clusterCidr || payload.PodCIDR || payload.podCidr || '').trim()
    const service = String(payload.serviceCidr || payload.ServiceCIDR || '').trim()
    if (!pod) return '缺少 Pod 网段'
    if (!service) return '缺少 Service 网段'
  }
  return null
}

export function validateDeletePayload(
  payload: Record<string, unknown>,
  cluster?: { DeletionProtection?: boolean; ClusterNodeNum?: number },
  nodes: TkeInstanceItem[] = [],
): string | null {
  if (cluster?.DeletionProtection) return '请先关闭删除保护'
  const nodeCount = nodes.length || cluster?.ClusterNodeNum || 0
  if (nodeCount > 0) return '仍存在普通/原生/超级节点，请先移除后再删除'
  if (payload.riskAck !== true && payload.confirmRisk !== true) return '请勾选我已知晓风险'
  const mode = String(payload.instanceDeleteMode || payload.InstanceDeleteMode || '').trim()
  if (mode && mode !== 'retain' && mode !== 'terminate') return '资源保留策略无效'
  return null
}

export function matchNodeFilters(item: TkeInstanceItem, filters: Record<string, string> = {}): boolean {
  const ip = String(filters.ip || '').trim()
  if (ip && !String(item.LanIP || '').includes(ip) && !String(item.NodeName || '').includes(ip)) return false
  const label = String(filters.label || filters.labels || '').trim()
  if (label) {
    const hay = nodeLabelPairs(item).join(',').toLowerCase()
    if (!hay.includes(label.toLowerCase()) && !hay.replace(/=/g, ':').includes(label.toLowerCase())) return false
  }
  const state = String(filters.status || filters.instanceState || '').trim()
  if (state && String(item.InstanceState || '').toLowerCase() !== state.toLowerCase()) return false
  const cordon = String(filters.unschedulable || filters.cordon || '').trim().toLowerCase()
  if (cordon) {
    const locked = item.Unschedulable === true || item.Unschedulable === 1
    if (cordon === 'yes' || cordon === 'true' || cordon === '1' || cordon === '封锁') {
      if (!locked) return false
    } else if (cordon === 'no' || cordon === 'false' || cordon === '0' || cordon === '未封锁') {
      if (locked) return false
    }
  }
  return true
}

export function nodeLabelPairs(item: TkeInstanceItem): string[] {
  const labels = item.Labels
  if (Array.isArray(labels)) {
    return labels.map((row) => `${row.Name || ''}=${row.Value || ''}`).filter((row) => row !== '=')
  }
  if (labels && typeof labels === 'object') {
    return Object.entries(labels).map(([key, value]) => `${key}=${value}`)
  }
  return []
}

export function validateNodeCreatePayload(payload: Record<string, unknown>): string | null {
  const para = parseRunInstancePara(payload)
  if (!para) return '缺少机型/镜像/安全组/子网/可用区'
  if (!String(para.InstanceType || payload.instanceType || '').trim()) return '缺少机型'
  if (!String(para.ImageId || payload.imageId || '').trim()) return '缺少镜像'
  const vpc = para.VirtualPrivateCloud as Record<string, unknown> | undefined
  const subnet = String(vpc?.SubnetId || payload.subnetId || '').trim()
  const vpcId = String(vpc?.VpcId || payload.vpcId || '').trim()
  if (!subnet) return '缺少子网'
  if (!vpcId) return '缺少 VPC'
  const sgs = asStringArray(para.SecurityGroupIds || payload.securityGroupIds)
  if (!sgs.length) return '缺少安全组'
  const placement = para.Placement && typeof para.Placement === 'object' ? para.Placement as Record<string, unknown> : {}
  const zone = String(placement.Zone || para.Zone || payload.zone || payload.Zone || '').trim()
  if (!zone) return '缺少可用区'
  if (!nodeLoginSettings(para, payload)) return '缺少登录密钥或密码'
  return null
}

export function validateAddExistedPayload(payload: Record<string, unknown>): string | null {
  const ids = asStringArray(payload.instanceIds || payload.instanceId || payload.InstanceIds)
  if (!ids.length) return '缺少已有节点'
  const sgs = asStringArray(payload.securityGroupIds || payload.SecurityGroupIds)
  if (!sgs.length) return '缺少安全组'
  if (!nodeLoginSettings({}, payload)) return '缺少登录密钥或密码'
  return null
}

export function parseRunInstancePara(payload: Record<string, unknown>): Record<string, unknown> | null {
  const raw = payload.runInstancePara ?? payload.RunInstancePara
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      return null
    }
  }
  if (payload.instanceType || payload.imageId || payload.subnetId || payload.zone) {
    const login = nodeLoginSettings({}, payload)
    const zone = String(payload.zone || payload.Zone || '').trim()
    return {
      InstanceType: payload.instanceType,
      ImageId: payload.imageId,
      VirtualPrivateCloud: { VpcId: payload.vpcId, SubnetId: payload.subnetId },
      SecurityGroupIds: asStringArray(payload.securityGroupIds),
      InstanceCount: Number(payload.instanceCount || 1) || 1,
      Placement: zone ? { Zone: zone } : undefined,
      InstanceChargeType: payload.instanceChargeType || payload.InstanceChargeType || 'POSTPAID_BY_HOUR',
      LoginSettings: login || undefined,
    }
  }
  return null
}

export function validateNodePoolPayload(payload: Record<string, unknown>): string | null {
  const type = normalizePoolType(String(payload.poolType || payload.nodePoolType || payload.NodePoolType || ''))
  if (!type) return '请先选择普通、原生或超级节点'
  const name = String(payload.name || payload.Name || '').trim()
  if (!name) return '缺少节点池名称'
  if (type === 'Super') {
    if (!asStringArray(payload.securityGroupIds || payload.SecurityGroupIds).length) return '缺少安全组'
    return null
  }
  if (type === 'Native') {
    if (!asStringArray(payload.subnetIds || payload.SubnetIds || payload.subnetId).length) return '缺少子网'
    if (!asStringArray(payload.instanceTypes || payload.InstanceTypes || payload.instanceType).length) return '缺少机型'
    return null
  }
  if (!String(payload.vpcId || payload.VpcId || '').trim()) return '缺少 VPC'
  if (!asStringArray(payload.subnetIds || payload.SubnetIds || payload.subnetId).length) return '缺少子网'
  if (!String(payload.instanceType || payload.InstanceType || asStringArray(payload.instanceTypes)[0] || '').trim()) return '缺少机型'
  if (!String(payload.imageId || payload.ImageId || '').trim()) return '缺少镜像'
  if (!asStringArray(payload.securityGroupIds || payload.SecurityGroupIds).length) return '缺少安全组'
  return null
}

export function normalizePoolType(raw: string): string {
  const value = raw.trim().toLowerCase()
  if (value === 'regular' || value === '普通' || value === '普通节点') return 'Regular'
  if (value === 'native' || value === 'nativenodepool' || value === '原生' || value === '原生节点') return 'Native'
  if (value === 'super' || value === 'supernode' || value === 'eklet' || value === '超级' || value === '超级节点') return 'Super'
  if (value === 'external' || value === '注册' || value === '注册节点') return 'External'
  return raw.trim()
}

export function createTkeModule(call: typeof tkeCall = tkeCall): ResourceModule {
  const module: ResourceModule = {
    id: 'tencent.tke',
    provider: 'tencent',
    kind: 'cluster',
    title: '腾讯云 TKE',
    implemented: true,
    actions: ACTIONS,
    async list(ctx) {
      const region = requireRegion(ctx)
      const typeFilter = String(ctx.filters?.clusterType || ctx.filters?.type || '').trim()
      const want = typeFilter ? normalizeClusterType(typeFilter) : ''
      const apiFilters = buildClusterFilters(ctx)
      const settled = await Promise.allSettled([
        !want || want === 'MANAGED_CLUSTER' || want === 'INDEPENDENT_CLUSTER'
          ? listAllClusters(call, ctx, region, 'DescribeClusters', apiFilters.length ? { Filters: apiFilters } : {})
          : Promise.resolve([] as TkeClusterItem[]),
        !want || want === 'SERVERLESS_CLUSTER'
          ? listAllClusters(call, ctx, region, 'DescribeEKSClusters')
          : Promise.resolve([] as TkeClusterItem[]),
        !want || want === 'EDGE_CLUSTER'
          ? listAllClusters(call, ctx, region, 'DescribeTKEEdgeClusters')
          : Promise.resolve([] as TkeClusterItem[]),
        !want || want === 'EXTERNAL_CLUSTER'
          ? listAllClusters(call, ctx, region, 'DescribeClusters', { Filters: [{ Name: 'ClusterType', Values: ['EXTERNAL_CLUSTER'] }] })
          : Promise.resolve([] as TkeClusterItem[]),
      ])
      const buckets = settled.map((row, index) => {
        if (row.status === 'fulfilled') return { items: row.value, index }
        if (isEmptyTypeError(row.reason)) return { items: [] as TkeClusterItem[], index }
        return { error: row.reason, index }
      })
      const fatal = buckets.find((row) => 'error' in row && row.error)
      const anyOk = buckets.some((row) => !('error' in row))
      if (!anyOk && fatal && 'error' in fatal) throw fatal.error
      const seen = new Set<string>()
      const items: ResourceCard[] = []
      for (const bucket of buckets) {
        if ('error' in bucket) continue
        for (const item of bucket.items) {
          const clusterId = String(item.ClusterId || '')
          if (!clusterId || seen.has(clusterId)) continue
          seen.add(clusterId)
          const type = bucket.index === 1
            ? item.ClusterType || 'SERVERLESS_CLUSTER'
            : bucket.index === 2
              ? item.ClusterType || 'EDGE_CLUSTER'
              : bucket.index === 3
                ? item.ClusterType || 'EXTERNAL_CLUSTER'
                : item.ClusterType
          items.push(mapClusterItem({ ...item, ClusterType: type }, module.id, region))
        }
      }
      const filtered = applyClientFilters(items, ctx)
      const offset = Math.max(0, Number(ctx.offset) || 0)
      const limit = Math.max(1, Number(ctx.limit) || 12)
      const sliced = filtered.slice(offset, offset + limit)
      return {
        items: sliced,
        total: filtered.length,
        offset,
        hasMore: offset + sliced.length < filtered.length,
      }
    },
    async detail(ctx) {
      const region = requireRegion(ctx)
      const { clusterId } = parseClusterRef(String(ctx.id || ''))
      if (!clusterId) throw new Error('缺少集群')
      const cluster = await loadCluster(call, ctx, region, clusterId)
      const card = mapClusterItem(cluster, module.id, region)
      const [nodes, pools, addons, endpoint, namespaces, bindings, policies, ops] = await Promise.all([
        loadNodes(call, ctx, region, clusterId),
        loadNodePools(call, ctx, region, clusterId),
        loadAddons(call, ctx, region, clusterId),
        loadEndpoint(call, ctx, region, clusterId),
        loadNamespaces(call, ctx, region, clusterId),
        loadBindings(call, ctx, region, clusterId),
        loadPolicies(call, ctx, region, clusterId),
        loadOps(call, ctx, region, clusterId),
      ])
      const network = cluster.ClusterNetworkSettings || {}
      const blocks: DetailBlock[] = [
        {
          id: 'cluster',
          title: '集群信息',
          fields: [
            { label: '集群名称', value: cluster.ClusterName || card.title },
            { label: '集群 ID', value: String(cluster.ClusterId || clusterId) },
            { label: '类型', value: clusterTypeLabel(cluster.ClusterType) },
            { label: '状态', value: cluster.ClusterStatus || '' },
            { label: 'Kubernetes 版本', value: cluster.ClusterVersion || '' },
            { label: '容器运行时', value: cluster.ContainerRuntime || '' },
            { label: '删除保护', value: cluster.DeletionProtection ? '已开启' : '已关闭' },
            { label: '创建时间', value: cluster.CreatedTime || '' },
          ].filter((row) => row.value),
        },
        {
          id: 'network',
          title: '节点和网络信息',
          fields: [
            { label: '节点数', value: cluster.ClusterNodeNum != null ? String(cluster.ClusterNodeNum) : String(nodes.length) },
            { label: 'VPC', value: network.VpcId || '' },
            { label: '容器网段', value: network.ClusterCIDR || '' },
            { label: 'Service 网段', value: network.ServiceCIDR || '' },
            { label: '单节点 Pod 上限', value: network.MaxNodePodNum != null ? String(network.MaxNodePodNum) : '' },
            { label: 'kube-proxy', value: network.KubeProxyMode || (network.Ipvs ? 'ipvs' : '') },
          ].filter((row) => row.value),
        },
        {
          id: 'apiserver',
          title: '集群 APIServer 信息',
          fields: [
            { label: '内网访问', value: endpoint.intranet ? '已开启' : '未开启' },
            { label: '外网访问', value: endpoint.internet ? '已开启' : '未开启' },
            { label: 'kubeconfig', value: (endpoint.intranet || endpoint.internet) ? '可在受信界面复制或下载' : '未开启访问' },
          ],
        },
      ]
      const nodeCards = nodes.map(mapNodeCard)
      return {
        card,
        fields: blocks[0].fields,
        pages: TKE_SIDEBAR_PAGES,
        blocks,
        cards: {
          nodes: nodeCards,
          nodePools: pools.map(mapNodePoolCard),
          namespaces,
          addons,
          bindings,
          policies,
        },
        flags: {
          region,
          clusterType: cluster.ClusterType || '',
          deletionProtection: !!cluster.DeletionProtection,
          kubernetesVersion: cluster.ClusterVersion || '',
          intranet: !!endpoint.intranet,
          internet: !!endpoint.internet,
          kubeconfigAvailable: !!(endpoint.intranet || endpoint.internet),
          audit: !!ops.audit,
          event: !!ops.event,
          nodeCount: nodes.length,
        },
      } satisfies ResourceDetail
    },
    async execute(actionId, payload, ctx) {
      try {
        const region = requireRegion(ctx, payload)
        const clusterId = String(payload.clusterId || parseClusterRef(String(ctx.id || '')).clusterId || '').trim()
        if (actionId === 'cluster.create') return createCluster(call, ctx, region, payload)
        if (actionId === 'cluster.kubeconfig') return readKubeconfig(call, ctx, region, clusterId, payload)
        if (!clusterId && actionId !== 'cluster.create') return { ok: false, error: '缺少集群' }
        if (actionId === 'cluster.protection') {
          const enable = payload.enable === true || payload.enabled === true
          await call(enable ? 'EnableClusterDeletionProtection' : 'DisableClusterDeletionProtection', { ClusterId: clusterId }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'cluster.delete') return deleteCluster(call, ctx, region, clusterId, payload)
        if (actionId === 'cluster.upgrade.master') {
          const version = String(payload.version || payload.DstVersion || '').trim()
          if (!version) return { ok: false, error: '缺少目标版本' }
          await call('UpdateClusterVersion', { ClusterId: clusterId, DstVersion: version }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'cluster.upgrade.node') {
          const version = String(payload.version || payload.DstVersion || '').trim()
          if (!version) return { ok: false, error: '缺少目标版本' }
          const mode = String(payload.upgradeType || payload.UpgradeType || 'reset').toLowerCase()
          await call('UpgradeClusterInstances', {
            ClusterId: clusterId,
            InstanceIds: asStringArray(payload.instanceIds || payload.InstanceIds),
            UpgradeType: mode === 'in-place' || mode === 'inplace' ? 'inPlaceUpgrade' : 'reset',
            DstVersion: version,
          }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'cluster.endpoint') return toggleEndpoint(call, ctx, region, clusterId, payload)
        if (actionId === 'node.cordon' || actionId === 'node.uncordon') {
          const nodeName = await resolveK8sNodeName(call, ctx, region, clusterId, payload)
          if (!nodeName) return { ok: false, error: '缺少节点名' }
          await call('ForwardApplicationRequestV3', {
            ClusterName: clusterId,
            Method: 'PATCH',
            Path: `/api/v1/nodes/${encodeURIComponent(nodeName)}`,
            ContentType: 'application/strategic-merge-patch+json',
            RequestBody: JSON.stringify({ spec: { unschedulable: actionId === 'node.cordon' } }),
          }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'node.drain') {
          const instanceId = String(payload.instanceId || '').trim()
          if (!instanceId) return { ok: false, error: '缺少节点' }
          await call('DrainClusterNode', { ClusterId: clusterId, InstanceId: instanceId }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'node.remove') {
          const ids = asStringArray(payload.instanceIds || payload.instanceId)
          if (!ids.length) return { ok: false, error: '缺少节点' }
          await call('DeleteClusterInstances', {
            ClusterId: clusterId,
            InstanceIds: ids,
            InstanceDeleteMode: String(payload.instanceDeleteMode || 'retain'),
          }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'node.addExisted') {
          const invalid = validateAddExistedPayload(payload)
          if (invalid) return { ok: false, error: invalid }
          const ids = asStringArray(payload.instanceIds || payload.instanceId || payload.InstanceIds)
          const login = nodeLoginSettings({}, payload)
          await call('AddExistedInstances', {
            ClusterId: clusterId,
            InstanceIds: ids,
            LoginSettings: login,
            SecurityGroupIds: asStringArray(payload.securityGroupIds || payload.SecurityGroupIds),
          }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'node.create') {
          const invalid = validateNodeCreatePayload(payload)
          if (invalid) return { ok: false, error: invalid }
          const para = parseRunInstancePara(payload) || {}
          const instanceType = String(para.InstanceType || payload.instanceType || '').trim()
          const imageId = String(para.ImageId || payload.imageId || '').trim()
          const vpc = (para.VirtualPrivateCloud && typeof para.VirtualPrivateCloud === 'object'
            ? para.VirtualPrivateCloud as Record<string, unknown>
            : {})
          const vpcId = String(vpc.VpcId || payload.vpcId || '').trim()
          const subnetId = String(vpc.SubnetId || payload.subnetId || '').trim()
          const securityGroupIds = asStringArray(para.SecurityGroupIds || payload.securityGroupIds)
          const placement = para.Placement && typeof para.Placement === 'object' ? para.Placement as Record<string, unknown> : {}
          const zone = String(placement.Zone || para.Zone || payload.zone || payload.Zone || '').trim()
          const login = nodeLoginSettings(para, payload)
          const body = {
            InstanceType: instanceType,
            ImageId: imageId,
            Placement: { Zone: zone },
            VirtualPrivateCloud: { VpcId: vpcId, SubnetId: subnetId },
            SecurityGroupIds: securityGroupIds,
            InstanceCount: Number(para.InstanceCount || payload.instanceCount || 1) || 1,
            InstanceChargeType: String(para.InstanceChargeType || payload.instanceChargeType || payload.InstanceChargeType || 'POSTPAID_BY_HOUR'),
            LoginSettings: login,
          }
          await call('CreateClusterInstances', {
            ClusterId: clusterId,
            RunInstancePara: JSON.stringify(body),
          }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'nodepool.create') return createNodePool(call, ctx, region, clusterId, payload)
        if (actionId === 'nodepool.scale') return scaleNodePool(call, ctx, region, clusterId, payload)
        if (actionId === 'nodepool.autoscale' || actionId === 'nodepool.protection') {
          const nodePoolId = String(payload.nodePoolId || '').trim()
          if (!nodePoolId) return { ok: false, error: '缺少节点池' }
          const patch: Record<string, unknown> = { ClusterId: clusterId, NodePoolId: nodePoolId }
          if (actionId === 'nodepool.autoscale') patch.EnableAutoscale = payload.enable === true
          if (actionId === 'nodepool.protection') patch.DeletionProtection = payload.enable === true
          await call('ModifyClusterNodePool', patch, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'nodepool.delete') {
          const nodePoolId = String(payload.nodePoolId || '').trim()
          if (!nodePoolId) return { ok: false, error: '缺少节点池' }
          await call('DeleteClusterNodePool', { ClusterId: clusterId, NodePoolIds: [nodePoolId] }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'namespace.create' || actionId === 'namespace.update') {
          const name = String(payload.name || payload.namespace || '').trim()
          if (!name) return { ok: false, error: '缺少命名空间' }
          if (actionId === 'namespace.create') {
            await call('ForwardApplicationRequestV3', {
              ClusterName: clusterId,
              Method: 'POST',
              Path: '/api/v1/namespaces',
              RequestBody: JSON.stringify({ apiVersion: 'v1', kind: 'Namespace', metadata: { name } }),
            }, creds(ctx), opts(ctx, region))
          }
          const quota = payload.quota && typeof payload.quota === 'object' ? payload.quota as Record<string, string> : null
          if (quota && Object.keys(quota).length) {
            await call('ForwardApplicationRequestV3', {
              ClusterName: clusterId,
              Method: actionId === 'namespace.create' ? 'POST' : 'PUT',
              Path: actionId === 'namespace.create'
                ? `/api/v1/namespaces/${name}/resourcequotas`
                : `/api/v1/namespaces/${name}/resourcequotas/default`,
              RequestBody: JSON.stringify({
                apiVersion: 'v1',
                kind: 'ResourceQuota',
                metadata: { name: 'default', namespace: name },
                spec: { hard: quota },
              }),
            }, creds(ctx), opts(ctx, region))
          }
          return { ok: true }
        }
        if (actionId === 'namespace.delete') {
          const name = String(payload.name || payload.namespace || '').trim()
          if (!name) return { ok: false, error: '缺少命名空间' }
          await call('ForwardApplicationRequestV3', {
            ClusterName: clusterId,
            Method: 'DELETE',
            Path: `/api/v1/namespaces/${name}`,
          }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'addon.install') {
          const name = String(payload.name || payload.addonName || '').trim()
          if (!name) return { ok: false, error: '缺少组件' }
          await call('InstallAddon', {
            ClusterId: clusterId,
            AddonName: name,
            AddonVersion: String(payload.version || payload.addonVersion || '').trim() || undefined,
          }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'addon.upgrade') {
          const name = String(payload.name || payload.addonName || '').trim()
          if (!name) return { ok: false, error: '缺少组件' }
          await call('UpdateAddon', {
            ClusterId: clusterId,
            AddonName: name,
            AddonVersion: String(payload.version || payload.addonVersion || '').trim() || undefined,
          }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'addon.uninstall') {
          const name = String(payload.name || payload.addonName || '').trim()
          if (!name) return { ok: false, error: '缺少组件' }
          await call('DeleteAddon', { ClusterId: clusterId, AddonName: name }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'rbac.bind') {
          const role = String(payload.role || payload.clusterRole || 'tke:admin').trim()
          const user = String(payload.user || payload.subAccountUin || '').trim()
          if (!user) return { ok: false, error: '缺少授权对象' }
          const bindingName = String(payload.name || payload.bindingName || `${role.replace(/[^a-zA-Z0-9]+/g, '-')}-${user}`).trim()
          await call('ForwardApplicationRequestV3', {
            ClusterName: clusterId,
            Method: 'POST',
            Path: '/apis/rbac.authorization.k8s.io/v1/clusterrolebindings',
            RequestBody: JSON.stringify({
              apiVersion: 'rbac.authorization.k8s.io/v1',
              kind: 'ClusterRoleBinding',
              metadata: { name: bindingName },
              roleRef: { apiGroup: 'rbac.authorization.k8s.io', kind: 'ClusterRole', name: role },
              subjects: [{ kind: 'User', name: user }],
            }),
          }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'rbac.unbind') {
          const name = String(payload.name || payload.bindingName || '').trim()
          if (!name) return { ok: false, error: '缺少绑定' }
          await call('ForwardApplicationRequestV3', {
            ClusterName: clusterId,
            Method: 'DELETE',
            Path: `/apis/rbac.authorization.k8s.io/v1/clusterrolebindings/${encodeURIComponent(name)}`,
          }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'policy.toggle') {
          const name = String(payload.name || payload.policyName || '').trim()
          if (!name) return { ok: false, error: '缺少策略' }
          const enable = payload.enable === true
          if (!enable && payload.confirmed !== true) return { ok: false, error: '关闭策略需要二次确认' }
          const kind = String(payload.kind || payload.Kind || '').trim()
          await call('ModifyOpenPolicyList', {
            ClusterId: clusterId,
            Category: String(payload.category || payload.Category || '').trim() || undefined,
            OpenPolicyInfoList: [{
              Name: name,
              Kind: kind || undefined,
              EnforcementAction: enable ? 'deny' : 'dryrun',
              EnabledStatus: enable ? 'open' : 'close',
            }],
          }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'ops.audit') {
          await call(payload.enable === true ? 'EnableClusterAudit' : 'DisableClusterAudit', { ClusterId: clusterId }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'ops.event') {
          await call(payload.enable === true ? 'EnableEventPersistence' : 'DisableEventPersistence', { ClusterId: clusterId }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        return { ok: false, error: `未知动作 ${actionId}` }
      } catch (err) {
        return { ok: false, error: publicErrorMessage(err) }
      }
    },
  }
  return module
}

async function createCluster(
  call: typeof tkeCall,
  ctx: ModuleContext,
  region: string,
  payload: Record<string, unknown>,
): Promise<ActionResult> {
  const invalid = validateCreatePayload(payload)
  if (invalid) return { ok: false, error: invalid }
  const type = normalizeClusterType(String(payload.clusterType || payload.ClusterType || 'MANAGED_CLUSTER'))
  const name = String(payload.clusterName || payload.ClusterName || '').trim()
  const version = String(payload.clusterVersion || payload.ClusterVersion || '').trim()
  if (type === 'EXTERNAL_CLUSTER') {
    const created = await call<{ ClusterId?: string }>('CreateCluster', {
      ClusterType: 'EXTERNAL_CLUSTER',
      ClusterBasicSettings: {
        ClusterName: name,
        ClusterVersion: version,
        ClusterDescription: String(payload.description || payload.ClusterDescription || '').trim() || undefined,
      },
    }, creds(ctx), opts(ctx, region))
    const clusterId = String(created.ClusterId || payload.clusterId || payload.ClusterId || '').trim()
    if (!clusterId) return { ok: false, error: '创建注册集群未返回 ClusterId' }
    const spec = await call<{ Spec?: string; Yaml?: string; Command?: string; Config?: string }>(
      'DescribeExternalClusterSpec',
      {
        ClusterId: clusterId,
        IsExtranet: payload.isExtranet === true || payload.IsExtranet === true,
      },
      creds(ctx),
      opts(ctx, region),
    )
    const yaml = String(spec.Spec || spec.Yaml || spec.Config || spec.Command || '').trim()
    return { ok: true, data: { spec: yaml, clusterId, clusterName: name, filename: `${name || 'cluster'}.yaml` } }
  }
  if (type === 'EDGE_CLUSTER') {
    await call('CreateTKEEdgeCluster', {
      ClusterName: name,
      K8SVersion: version,
      VpcId: String(payload.vpcId || payload.VpcId || '').trim(),
      PodCIDR: String(payload.clusterCidr || payload.PodCIDR || payload.podCidr || '').trim(),
      ServiceCIDR: String(payload.serviceCidr || payload.ServiceCIDR || '').trim(),
      ClusterDesc: String(payload.description || '').trim() || undefined,
      MaxNodePodNum: Number(payload.maxNodePodNum || payload.MaxNodePodNum || 64) || 64,
    }, creds(ctx), opts(ctx, region))
    return { ok: true }
  }
  const maxNodePodNum = Number(payload.maxNodePodNum || payload.MaxNodePodNum || 64) || 64
  const maxClusterServiceNum = Number(payload.maxClusterServiceNum || payload.MaxClusterServiceNum || 256) || 256
  const body: Record<string, unknown> = {
    ClusterType: 'MANAGED_CLUSTER',
    ClusterBasicSettings: {
      ClusterName: name,
      ClusterVersion: version,
      VpcId: String(payload.vpcId || payload.VpcId || '').trim() || undefined,
      ClusterDescription: String(payload.description || '').trim() || undefined,
    },
    ClusterCIDRSettings: {
      ClusterCIDR: String(payload.clusterCidr || payload.ClusterCIDR || '').trim() || undefined,
      ServiceCIDR: String(payload.serviceCidr || payload.ServiceCIDR || '').trim() || undefined,
      MaxNodePodNum: maxNodePodNum,
      MaxClusterServiceNum: maxClusterServiceNum,
    },
    ClusterAdvancedSettings: {
      ContainerRuntime: String(payload.runtime || payload.ContainerRuntime || 'containerd'),
      NetworkType: String(payload.networkType || 'GR'),
    },
  }
  if (Array.isArray(payload.addons) && payload.addons.length) {
    body.ExtensionAddons = (payload.addons as unknown[]).map((addonName) => ({ AddonName: String(addonName) }))
  }
  await call('CreateCluster', body, creds(ctx), opts(ctx, region))
  return { ok: true }
}

async function deleteCluster(
  call: typeof tkeCall,
  ctx: ModuleContext,
  region: string,
  clusterId: string,
  payload: Record<string, unknown>,
): Promise<ActionResult> {
  const cluster = await loadCluster(call, ctx, region, clusterId).catch(() => undefined)
  const nodes = await loadNodes(call, ctx, region, clusterId)
  const invalid = validateDeletePayload(payload, cluster, nodes)
  if (invalid) return { ok: false, error: invalid }
  const mode = String(payload.instanceDeleteMode || payload.InstanceDeleteMode || 'retain')
  const keepDisk = payload.retainCbs !== false && payload.destroyCbs !== true
  const clusterType = normalizeClusterType(String(cluster?.ClusterType || payload.clusterType || payload.ClusterType || ''))
  if (clusterType === 'EDGE_CLUSTER') {
    await call('DeleteTKEEdgeCluster', { ClusterId: clusterId }, creds(ctx), opts(ctx, region))
    return { ok: true }
  }
  if (clusterType === 'SERVERLESS_CLUSTER') {
    await call('DeleteEKSCluster', { ClusterId: clusterId }, creds(ctx), opts(ctx, region))
    return { ok: true }
  }
  await call('DeleteCluster', {
    ClusterId: clusterId,
    InstanceDeleteMode: mode,
    ResourceDeleteOptions: [{ ResourceType: 'CBS', DeleteMode: keepDisk ? 'retain' : 'terminate' }],
  }, creds(ctx), opts(ctx, region))
  return { ok: true }
}

async function toggleEndpoint(
  call: typeof tkeCall,
  ctx: ModuleContext,
  region: string,
  clusterId: string,
  payload: Record<string, unknown>,
): Promise<ActionResult> {
  const scope = String(payload.scope || payload.kind || 'intranet').toLowerCase()
  const enable = payload.enable === true
  if (scope === 'internet' || scope === 'extranet') {
    await call(enable ? 'CreateClusterEndpointVip' : 'DeleteClusterEndpointVip', { ClusterId: clusterId }, creds(ctx), opts(ctx, region))
    return { ok: true }
  }
  await call(enable ? 'CreateClusterEndpoint' : 'DeleteClusterEndpoint', {
    ClusterId: clusterId,
    IsExtranet: false,
  }, creds(ctx), opts(ctx, region))
  return { ok: true }
}

async function readKubeconfig(
  call: typeof tkeCall,
  ctx: ModuleContext,
  region: string,
  clusterId: string,
  _payload: Record<string, unknown>,
): Promise<ActionResult> {
  if (!clusterId) return { ok: false, error: '缺少集群' }
  const endpoint = await loadEndpoint(call, ctx, region, clusterId)
  if (!endpoint.intranet && !endpoint.internet) return { ok: false, error: '未开启访问时不提供可用 kubeconfig' }
  const data = await call<{ Kubeconfig?: string }>('DescribeClusterSecurity', { ClusterId: clusterId }, creds(ctx), opts(ctx, region))
  const kubeconfig = String(data.Kubeconfig || '').trim()
  if (!kubeconfig) return { ok: false, error: '未开启访问时不提供可用 kubeconfig' }
  return { ok: true, data: { kubeconfig, filename: `${clusterId}.kubeconfig` } }
}

async function createNodePool(
  call: typeof tkeCall,
  ctx: ModuleContext,
  region: string,
  clusterId: string,
  payload: Record<string, unknown>,
): Promise<ActionResult> {
  const invalid = validateNodePoolPayload(payload)
  if (invalid) return { ok: false, error: invalid }
  const type = normalizePoolType(String(payload.poolType || payload.nodePoolType || payload.NodePoolType || ''))
  const name = String(payload.name || payload.Name || '').trim()
  const subnetIds = asStringArray(payload.subnetIds || payload.SubnetIds || payload.subnetId)
  const securityGroupIds = asStringArray(payload.securityGroupIds || payload.SecurityGroupIds)
  if (type === 'Super') {
    await call('CreateClusterVirtualNodePool', {
      ClusterId: clusterId,
      Name: name,
      SecurityGroupIds: securityGroupIds,
      SubnetIds: subnetIds.length ? subnetIds : undefined,
      DeletionProtection: payload.deletionProtection === true,
    }, creds(ctx), opts(ctx, region))
    return { ok: true }
  }
  if (type === 'Native') {
    const instanceTypes = asStringArray(payload.instanceTypes || payload.InstanceTypes || payload.instanceType)
    const desired = Number(payload.desired || payload.DesiredNodesNum || 0) || 0
    await call('CreateNodePool', {
      ClusterId: clusterId,
      Name: name,
      Type: 'Native',
      DeletionProtection: payload.deletionProtection === true,
      Native: {
        SubnetIds: subnetIds,
        InstanceTypes: instanceTypes,
        InstanceChargeType: String(payload.instanceChargeType || payload.InstanceChargeType || 'POSTPAID_BY_HOUR'),
        SystemDisk: {
          DiskType: String(payload.systemDiskType || 'CLOUD_PREMIUM'),
          DiskSize: Number(payload.systemDiskSize || 50) || 50,
        },
        Scaling: {
          MinReplicas: Number(payload.min || payload.MinNodesNum || 0) || 0,
          MaxReplicas: Number(payload.max || payload.MaxNodesNum || Math.max(desired, 1)) || 1,
          CreateReplicas: desired,
        },
      },
    }, creds(ctx), opts(ctx, region, { version: '2022-05-01' }))
    return { ok: true }
  }
  if (type === 'External') {
    await call('CreateExternalNodePool', {
      ClusterId: clusterId,
      Name: name,
      ContainerRuntime: String(payload.runtime || payload.ContainerRuntime || 'containerd'),
      RuntimeVersion: String(payload.runtimeVersion || payload.RuntimeVersion || '1.7.28'),
      DeletionProtection: payload.deletionProtection === true,
    }, creds(ctx), opts(ctx, region))
    return { ok: true }
  }
  const instanceType = String(payload.instanceType || payload.InstanceType || asStringArray(payload.instanceTypes)[0] || '').trim()
  const imageId = String(payload.imageId || payload.ImageId || '').trim()
  const vpcId = String(payload.vpcId || payload.VpcId || '').trim()
  const desired = Number(payload.desired || payload.DesiredNodesNum || 0) || 0
  const min = Number(payload.min || payload.MinNodesNum || 0) || 0
  const max = Number(payload.max || payload.MaxNodesNum || Math.max(desired, 1)) || 1
  await call('CreateClusterNodePool', {
    ClusterId: clusterId,
    Name: name,
    EnableAutoscale: payload.enableAutoscale === true,
    DeletionProtection: payload.deletionProtection === true,
    AutoScalingGroupPara: JSON.stringify({
      MinSize: min,
      MaxSize: max,
      DesiredCapacity: desired,
      VpcId: vpcId,
      SubnetIds: subnetIds,
    }),
    LaunchConfigurePara: JSON.stringify({
      InstanceType: instanceType,
      ImageId: imageId,
      SecurityGroupIds: securityGroupIds,
      InstanceChargeType: String(payload.instanceChargeType || payload.InstanceChargeType || 'POSTPAID_BY_HOUR'),
    }),
    InstanceAdvancedSettings: {},
  }, creds(ctx), opts(ctx, region))
  return { ok: true }
}

async function scaleNodePool(
  call: typeof tkeCall,
  ctx: ModuleContext,
  region: string,
  clusterId: string,
  payload: Record<string, unknown>,
): Promise<ActionResult> {
  const nodePoolId = String(payload.nodePoolId || payload.NodePoolId || '').trim()
  const desired = Number(payload.desired || payload.DesiredNodesNum)
  if (!nodePoolId) return { ok: false, error: '缺少节点池' }
  if (!Number.isFinite(desired) || desired < 0) return { ok: false, error: '缺少期望节点数' }
  let type = normalizePoolType(String(payload.poolType || payload.type || payload.NodePoolType || ''))
  if (type !== 'Regular' && type !== 'Native' && type !== 'Super' && type !== 'External') {
    const pools = await loadNodePools(call, ctx, region, clusterId)
    const hit = pools.find((item) => item.NodePoolId === nodePoolId)
    type = normalizePoolType(String(hit?.NodePoolType || 'Regular'))
  }
  if (type === 'Super') {
    return { ok: false, error: '超级节点池不按 ASG 期望节点数调整，请修改子网或安全组' }
  }
  if (type === 'External') {
    return { ok: false, error: '注册节点池不按 ASG 期望节点数调整' }
  }
  if (type === 'Native') {
    const min = Number(payload.min ?? payload.MinNodesNum ?? desired)
    const max = Number(payload.max ?? payload.MaxNodesNum ?? Math.max(desired, 1))
    await call('ModifyNodePool', {
      ClusterId: clusterId,
      NodePoolId: nodePoolId,
      Native: {
        Scaling: {
          MinReplicas: Number.isFinite(min) ? min : desired,
          MaxReplicas: Number.isFinite(max) && max >= (Number.isFinite(min) ? min : desired) ? max : Math.max(desired, 1),
        },
      },
    }, creds(ctx), opts(ctx, region, { version: '2022-05-01' }))
    return { ok: true }
  }
  await call('ModifyNodePoolDesiredCapacityAboutAsg', {
    ClusterId: clusterId,
    NodePoolId: nodePoolId,
    DesiredCapacity: desired,
  }, creds(ctx), opts(ctx, region))
  return { ok: true }
}

async function loadCluster(call: typeof tkeCall, ctx: ModuleContext, region: string, clusterId: string): Promise<TkeClusterItem> {
  const managed = await call<{ Clusters?: TkeClusterItem[] }>('DescribeClusters', { ClusterIds: [clusterId] }, creds(ctx), opts(ctx, region)).catch(() => ({ Clusters: [] as TkeClusterItem[] }))
  if (managed.Clusters?.[0]) return managed.Clusters[0]
  const eks = await call<{ Clusters?: TkeClusterItem[] }>('DescribeEKSClusters', { ClusterIds: [clusterId] }, creds(ctx), opts(ctx, region)).catch(() => ({ Clusters: [] as TkeClusterItem[] }))
  if (eks.Clusters?.[0]) return { ...eks.Clusters[0], ClusterType: eks.Clusters[0].ClusterType || 'SERVERLESS_CLUSTER' }
  const edge = await call<{ Clusters?: TkeClusterItem[] }>('DescribeTKEEdgeClusters', { ClusterIds: [clusterId] }, creds(ctx), opts(ctx, region)).catch(() => ({ Clusters: [] as TkeClusterItem[] }))
  if (edge.Clusters?.[0]) return { ...edge.Clusters[0], ClusterType: edge.Clusters[0].ClusterType || 'EDGE_CLUSTER' }
  throw new Error('资源不存在')
}

async function loadNodes(call: typeof tkeCall, ctx: ModuleContext, region: string, clusterId: string): Promise<TkeInstanceItem[]> {
  const out: TkeInstanceItem[] = []
  try {
    const pageSize = 100
    let offset = 0
    for (let page = 0; page < 20; page += 1) {
      const data = await call<{ InstanceSet?: TkeInstanceItem[]; TotalCount?: number }>(
        'DescribeClusterInstances',
        { ClusterId: clusterId, Offset: offset, Limit: pageSize },
        creds(ctx),
        opts(ctx, region),
      )
      const rows = data.InstanceSet || []
      out.push(...rows)
      const total = Number(data.TotalCount ?? out.length)
      if (rows.length < pageSize || out.length >= total) break
      offset += rows.length
    }
  } catch {
    // 边缘/注册等集群可能没有普通节点接口
  }
  try {
    const virt = await call<{ Nodes?: Array<{ Name?: string; NodeName?: string; VirtualNodeId?: string; NodePoolId?: string; Phase?: string }> }>(
      'DescribeClusterVirtualNode',
      { ClusterId: clusterId, Limit: 100 },
      creds(ctx),
      opts(ctx, region),
    )
    for (const node of virt.Nodes || []) {
      const id = String(node.VirtualNodeId || node.Name || node.NodeName || '').trim()
      if (!id) continue
      out.push({
        InstanceId: id,
        NodeName: String(node.NodeName || node.Name || id),
        InstanceState: node.Phase,
        NodePoolId: node.NodePoolId,
      })
    }
  } catch {
    // 无超级节点时接口可能不可用
  }
  return out.filter((item) => matchNodeFilters(item, ctx.filters || {}))
}

async function loadNodePools(call: typeof tkeCall, ctx: ModuleContext, region: string, clusterId: string): Promise<TkeNodePoolItem[]> {
  try {
    const data = await call<{ NodePoolSet?: TkeNodePoolItem[] }>('DescribeClusterNodePools', { ClusterId: clusterId }, creds(ctx), opts(ctx, region))
    return data.NodePoolSet || []
  } catch {
    return []
  }
}

async function loadAddons(call: typeof tkeCall, ctx: ModuleContext, region: string, clusterId: string): Promise<DetailCard[]> {
  try {
    const data = await call<{ Addons?: TkeAddonItem[] }>('DescribeAddon', { ClusterId: clusterId }, creds(ctx), opts(ctx, region))
    return (data.Addons || []).map((item) => ({
      id: String(item.AddonName || ''),
      title: String(item.AddonName || ''),
      status: item.Phase || '',
      columns: [
        { label: '版本', value: item.AddonVersion || '-' },
        { label: '最新版本', value: item.LatestVersion || '-' },
      ],
    }))
  } catch {
    return []
  }
}

async function loadEndpoint(call: typeof tkeCall, ctx: ModuleContext, region: string, clusterId: string): Promise<{ intranet: boolean; internet: boolean }> {
  const isCreated = (status?: string) => String(status || '').toLowerCase() === 'created'
  try {
    const [intranet, internet] = await Promise.all([
      call<{ Status?: string }>('DescribeClusterEndpointStatus', { ClusterId: clusterId, IsExtranet: false }, creds(ctx), opts(ctx, region)),
      call<{ Status?: string }>('DescribeClusterEndpointStatus', { ClusterId: clusterId, IsExtranet: true }, creds(ctx), opts(ctx, region)),
    ])
    return { intranet: isCreated(intranet.Status), internet: isCreated(internet.Status) }
  } catch {
    return { intranet: false, internet: false }
  }
}

async function loadNamespaces(call: typeof tkeCall, ctx: ModuleContext, region: string, clusterId: string): Promise<DetailCard[]> {
  try {
    const data = await call<{ ResponseBody?: string }>('ForwardApplicationRequestV3', {
      ClusterName: clusterId,
      Method: 'GET',
      Path: '/api/v1/namespaces',
    }, creds(ctx), opts(ctx, region))
    const parsed = parseJson(data.ResponseBody)
    const items = Array.isArray(parsed?.items) ? parsed.items as Array<{ metadata?: { name?: string }; status?: { phase?: string } }> : []
    return items.map((item) => ({
      id: String(item.metadata?.name || ''),
      title: String(item.metadata?.name || ''),
      status: item.status?.phase || '',
    })).filter((item) => item.id)
  } catch {
    return []
  }
}

async function loadBindings(call: typeof tkeCall, ctx: ModuleContext, region: string, clusterId: string): Promise<DetailCard[]> {
  try {
    const data = await call<{ ResponseBody?: string }>('ForwardApplicationRequestV3', {
      ClusterName: clusterId,
      Method: 'GET',
      Path: '/apis/rbac.authorization.k8s.io/v1/clusterrolebindings',
    }, creds(ctx), opts(ctx, region))
    const parsed = parseJson(data.ResponseBody)
    const items = Array.isArray(parsed?.items)
      ? parsed.items as Array<{
        metadata?: { name?: string }
        roleRef?: { name?: string }
        subjects?: Array<{ kind?: string; name?: string }>
      }>
      : []
    return items.map((item) => {
      const users = (item.subjects || []).map((row) => row.name).filter(Boolean)
      return {
        id: String(item.metadata?.name || ''),
        title: String(item.metadata?.name || item.roleRef?.name || ''),
        columns: [
          { label: '角色', value: item.roleRef?.name || '-' },
          { label: '对象', value: users.join(',') || '-' },
        ],
        flags: { role: item.roleRef?.name || '', users: users.join(',') },
      }
    }).filter((item) => item.id)
  } catch {
    return []
  }
}

async function loadPolicies(call: typeof tkeCall, ctx: ModuleContext, region: string, clusterId: string): Promise<DetailCard[]> {
  try {
    const data = await call<{
      OpenPolicyInfoList?: Array<{
        PolicyName?: string
        Name?: string
        Kind?: string
        EnabledStatus?: string
        EnforcementAction?: string
        PolicyCategory?: string
        Category?: string
      }>
    }>('DescribeOpenPolicyList', { ClusterId: clusterId }, creds(ctx), opts(ctx, region))
    return (data.OpenPolicyInfoList || []).map((item) => {
      const enabled = String(item.EnabledStatus || '').toLowerCase() === 'open'
        || String(item.EnforcementAction || '').toLowerCase() === 'deny'
      const name = String(item.Name || item.PolicyName || '')
      return {
        id: name,
        title: String(item.PolicyName || item.Name || ''),
        status: enabled ? 'enable' : 'pause',
        badges: [item.PolicyCategory || item.Category || ''].filter(Boolean),
        flags: {
          enabled,
          kind: item.Kind || '',
          name,
          category: item.PolicyCategory || item.Category || '',
          enforcementAction: item.EnforcementAction || '',
        },
      }
    }).filter((item) => item.id)
  } catch {
    return []
  }
}

async function loadOps(call: typeof tkeCall, ctx: ModuleContext, region: string, clusterId: string): Promise<{ audit: boolean; event: boolean }> {
  try {
    const data = await call<{
      SwitchSet?: Array<{ ClusterId?: string; Audit?: { Enable?: boolean }; Event?: { Enable?: boolean } }>
    }>('DescribeLogSwitches', { ClusterIds: [clusterId] }, creds(ctx), opts(ctx, region))
    const row = (data.SwitchSet || []).find((item) => !item.ClusterId || item.ClusterId === clusterId) || data.SwitchSet?.[0]
    return { audit: !!row?.Audit?.Enable, event: !!row?.Event?.Enable }
  } catch {
    return { audit: false, event: false }
  }
}

function applyClientFilters(items: ResourceCard[], ctx: ModuleContext): ResourceCard[] {
  const keyword = ctx.clientLocalFilter === false ? String(ctx.query || '').trim().toLowerCase() : String(ctx.filters?.keyword || ctx.filters?.name || '').trim().toLowerCase()
  const vpc = String(ctx.filters?.vpcId || ctx.filters?.vpc || '').trim()
  const tag = String(ctx.filters?.tag || '').trim()
  const type = String(ctx.filters?.clusterType || ctx.filters?.type || '').trim()
  const status = String(ctx.filters?.status || '').trim()
  return items.filter((item) => {
    if (keyword) {
      const id = columnValue(item, '集群ID').toLowerCase()
      const title = String(item.title || '').toLowerCase()
      if (!title.includes(keyword) && !id.includes(keyword) && !String(item.description || '').toLowerCase().includes(keyword)) return false
    }
    if (vpc && !columnValue(item, '所在网络').includes(vpc)) return false
    if (tag && !columnValue(item, '标签').includes(tag) && !columnValue(item, '标签').includes(tag.replace(':', '='))) return false
    if (type && columnValue(item, '类型') !== clusterTypeLabel(normalizeClusterType(type)) && columnValue(item, '类型') !== type) return false
    if (status && item.status !== mapClusterStatus(status) && String(item.description || '').toLowerCase().indexOf(status.toLowerCase()) < 0) return false
    return true
  })
}

function columnValue(item: ResourceCard, label: string): string {
  return String((item.columns || []).find((col) => col.label === label)?.value || '')
}

function requireRegion(ctx: ModuleContext, payload?: Record<string, unknown>): string {
  const fromCtx = String(ctx.region || '').trim()
  const fromPayload = String(payload?.region || '').trim()
  const fromId = parseClusterRef(String(ctx.id || '')).region
  const region = fromCtx || fromPayload || fromId
  if (!region) throw new Error('缺少地域')
  return region
}

function creds(ctx: ModuleContext): { secretId: string; secretKey: string } {
  return { secretId: ctx.creds.secretId, secretKey: ctx.creds.secretKey }
}

function opts(ctx: ModuleContext, region: string, extra: { version?: string } = {}): { timeoutMs: number; signal?: AbortSignal; region: string; version?: string } {
  return { timeoutMs: ctx.timeoutMs, signal: ctx.signal, region, ...extra }
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  const text = String(value || '').trim()
  return text ? [text] : []
}

function nodeLoginSettings(para: Record<string, unknown>, payload: Record<string, unknown>): Record<string, unknown> | null {
  const fromPara = para.LoginSettings && typeof para.LoginSettings === 'object' && !Array.isArray(para.LoginSettings)
    ? para.LoginSettings as Record<string, unknown>
    : {}
  const keyIds = asStringArray(fromPara.KeyIds || payload.loginKeyIds || payload.keyIds || payload.KeyIds)
  const password = String(fromPara.Password || payload.password || payload.Password || '').trim()
  if (keyIds.length) return { KeyIds: keyIds }
  if (password) return { Password: password }
  return null
}

function parseJson(raw?: string): { items?: unknown[] } | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as { items?: unknown[] }
  } catch {
    return null
  }
}

function isEmptyTypeError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err || '')
  return /不支持|not support|ResourceNotFound|不存在|暂无/i.test(message)
}

async function listAllClusters(
  call: typeof tkeCall,
  ctx: ModuleContext,
  region: string,
  action: string,
  extra: Record<string, unknown> = {},
): Promise<TkeClusterItem[]> {
  const pageSize = 100
  const out: TkeClusterItem[] = []
  let offset = 0
  for (let page = 0; page < 20; page += 1) {
    const data = await call<{ Clusters?: TkeClusterItem[]; TotalCount?: number }>(
      action,
      { Offset: offset, Limit: pageSize, ...extra },
      creds(ctx),
      opts(ctx, region),
    )
    const rows = data.Clusters || []
    out.push(...rows)
    const total = Number(data.TotalCount ?? out.length)
    if (rows.length < pageSize || out.length >= total) break
    offset += rows.length
  }
  return out
}

async function resolveK8sNodeName(
  call: typeof tkeCall,
  ctx: ModuleContext,
  region: string,
  clusterId: string,
  payload: Record<string, unknown>,
): Promise<string> {
  const explicit = String(payload.nodeName || payload.NodeName || '').trim()
  if (explicit && !/^ins-/i.test(explicit)) return explicit
  const instanceId = String(payload.instanceId || payload.InstanceId || explicit || '').trim()
  const nodes = await loadNodes(call, ctx, region, clusterId)
  const hit = nodes.find((item) => item.InstanceId === instanceId || item.InstanceId === explicit || item.NodeName === explicit)
  const resolved = String(hit?.NodeName || hit?.LanIP || '').trim()
  if (resolved) return resolved
  return explicit || instanceId
}

export const tencentTkeModule = createTkeModule()
registerModule(tencentTkeModule)
