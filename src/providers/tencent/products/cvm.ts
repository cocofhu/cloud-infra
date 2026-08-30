import { publicErrorMessage } from '../../../core/safe-error.js'
import { registerModule } from '../../../core/registry.js'
import type { FieldGroup, ModuleContext, ResourceCard, ResourceDetail, ResourceModule } from '../../../core/types.js'
import { cvmCall, monitorCall, type TencentProductCall } from '../client.js'
import {
  HOST_METRICS,
  INSTANCE_ACTIONS,
  POWER_ACTIONS,
  chargeTypeLabel,
  consoleTime,
  credsOf,
  fetchMonitorSeries,
  firstIp,
  formatSpec,
  instanceCardId,
  listAllPages,
  listAllPagesTruncated,
  listAcrossRegions,
  listRegions,
  listZones,
  mapInstanceState,
  normalizeMonitorRange,
  instanceSearchText,
  matchInstanceQuery,
  matchRegion,
  optsOf,
  paginateItems,
  pickRegions,
  parseInstanceRef,
  powerAllowed,
  type CloudRegion,
} from './instance-common.js'

export interface CvmInstance {
  InstanceId?: string
  InstanceName?: string
  InstanceState?: string
  InstanceType?: string
  CPU?: number
  Memory?: number
  OsName?: string
  ImageId?: string
  CreatedTime?: string
  ExpiredTime?: string
  InstanceChargeType?: string
  Placement?: { Zone?: string }
  PrivateIpAddresses?: string[]
  PublicIpAddresses?: string[]
  IPv6Addresses?: string[]
  SystemDisk?: { DiskType?: string; DiskSize?: number }
  InternetAccessible?: { InternetChargeType?: string; InternetMaxBandwidthOut?: number }
}

export interface CvmMapContext {
  moduleId: string
  region: string
  regionName: string
  zoneName?: string
}

export function mapCvmItem(item: CvmInstance, ctx: CvmMapContext): ResourceCard {
  const instanceId = String(item.InstanceId || '')
  const title = item.InstanceName || instanceId
  const { status, stateLabel } = mapInstanceState(item.InstanceState)
  const zone = ctx.zoneName || item.Placement?.Zone || '-'
  const privateIp = firstIp(item.PrivateIpAddresses)
  const publicIp = firstIp(item.PublicIpAddresses)
  const spec = formatSpec(item.CPU, item.Memory)
  const charge = chargeTypeLabel(item.InstanceChargeType)
  const ipv4 = `内网：${privateIp || '-'}\n弹性：${publicIp || '-'}`
  return {
    id: instanceCardId(ctx.moduleId, ctx.region, instanceId),
    moduleId: ctx.moduleId,
    provider: 'tencent',
    kind: 'cvm',
    title,
    description: [stateLabel, zone, spec].filter(Boolean).join(' · '),
    status,
    stateLabel,
    region: ctx.region,
    regionName: ctx.regionName,
    instanceId,
    privateIp: privateIp || undefined,
    publicIp: publicIp || undefined,
    openLabel: '详情',
    expiresAt: item.ExpiredTime || undefined,
    columns: [
      { label: '可用区', value: zone },
      { label: '实例类型', value: item.InstanceType || '-' },
      { label: '操作系统', value: item.OsName || '-' },
      { label: '实例配置', value: spec },
      { label: '主IPv4地址', value: ipv4 },
      { label: '实例计费模式', value: charge },
    ],
  }
}

export function cvmDetailGroups(item: CvmInstance, card: ResourceCard): FieldGroup[] {
  const privateIp = card.privateIp || firstIp(item.PrivateIpAddresses) || '-'
  const publicIp = card.publicIp || firstIp(item.PublicIpAddresses) || '-'
  const ipv6 = firstIp(item.IPv6Addresses)
  const disk = item.SystemDisk
  const groups: FieldGroup[] = [
    {
      title: '实例信息',
      fields: [
        { label: 'ID', value: card.instanceId || String(item.InstanceId || '') },
        { label: '名称', value: card.title },
        { label: '状态', value: card.stateLabel || mapInstanceState(item.InstanceState).stateLabel },
        { label: '可用区', value: col(card, '可用区') },
        { label: '地域', value: card.regionName || card.region || '' },
      ],
    },
    {
      title: '网络信息',
      fields: [
        { label: '主内网 IPv4', value: privateIp },
        { label: '主公网 IPv4', value: publicIp },
        ...(ipv6 ? [{ label: '主 IPv6', value: ipv6 }] : []),
        ...(item.InternetAccessible?.InternetChargeType
          ? [{ label: '网络计费模式', value: chargeTypeLabel(item.InternetAccessible.InternetChargeType) }]
          : []),
      ],
    },
    {
      title: '配置信息',
      fields: [
        { label: '实例类型', value: item.InstanceType || col(card, '实例类型') },
        { label: '实例配置', value: col(card, '实例配置') },
        ...(disk?.DiskSize != null ? [{ label: '系统盘', value: `${disk.DiskSize}GB` }] : []),
      ],
    },
    {
      title: '镜像信息',
      fields: [
        { label: '操作系统', value: item.OsName || col(card, '操作系统') },
        ...(item.ImageId ? [{ label: '镜像 ID', value: item.ImageId }] : []),
      ],
    },
    {
      title: '计费信息',
      fields: [
        { label: '实例计费模式', value: col(card, '实例计费模式') },
        { label: '创建时间', value: consoleTime(item.CreatedTime) || '-' },
        { label: '到期时间', value: consoleTime(item.ExpiredTime) || '-' },
      ],
    },
  ]
  return groups.map((group) => ({
    ...group,
    fields: group.fields.filter((row) => row.value),
  }))
}

export function matchCvmQuery(card: ResourceCard, query: string): boolean {
  return matchInstanceQuery(instanceSearchText(card), query)
}

export function createCvmModule(call: TencentProductCall = cvmCall, monitor: TencentProductCall = monitorCall): ResourceModule {
  const module: ResourceModule = {
    id: 'tencent.cvm',
    provider: 'tencent',
    kind: 'cvm',
    title: '腾讯云云服务器',
    implemented: true,
    actions: INSTANCE_ACTIONS,
    async list(ctx) {
      const regions = await listRegions(call, credsOf(ctx), optsOf(ctx))
      const scoped = pickRegions(regions, ctx.region)
      const { items, errors } = await listAcrossRegions(scoped, async (region) => {
        const mapped = await loadCvmRegion(call, ctx, module.id, region)
        return ctx.clientLocalFilter === false
          ? mapped.filter((card) => matchCvmQuery(card, ctx.query) && matchRegion(card, ctx.region))
          : mapped.filter((card) => matchRegion(card, ctx.region))
      }, module.id)
      // 单地域超过拉取上限被截断时,明确提示而不是让用户以为「只有这些」
      if (listAllPagesTruncated.current) {
        errors.push({ moduleId: module.id, message: '实例数量超过单地域拉取上限(500),仅显示前 500 条;请按地域或关键字缩小范围。' })
      }
      return {
        ...paginateItems(items, ctx.offset, ctx.limit),
        errors,
        regions: regions.map((row) => row.regionName || row.region),
      }
    },
    async detail(ctx) {
      const raw = await loadOne(call, ctx, module.id)
      const card = raw.card
      const groups = cvmDetailGroups(raw.item, card)
      const detail = {
        card,
        fields: groups.flatMap((group) => group.fields),
        groups,
      } satisfies ResourceDetail
      const ref = parseInstanceRef(String(ctx.id || ''))
      if (String(ctx.tab || '') === '实例监控' && ref.region && ref.instanceId) {
        const range = normalizeMonitorRange(ctx.range)
        const monitorData = await fetchMonitorSeries(monitor, {
          namespace: 'QCE/CVM',
          metrics: HOST_METRICS,
          instanceId: ref.instanceId,
          region: ref.region,
          range,
          creds: credsOf(ctx),
          opts: optsOf(ctx),
        })
        return {
          ...detail,
          extra: {
            tab: '实例监控',
            tabs: ['实例详情', '实例监控'],
            tabData: {
              range: monitorData.range,
              metrics: HOST_METRICS,
              series: monitorData.series,
              errors: monitorData.metricErrors,
              note: monitorData.metricErrors.length === HOST_METRICS.length
                ? '无法拉取监控数据，请检查 CAM 云监控权限'
                : monitorData.metricErrors.length ? `部分指标拉取失败（${monitorData.metricErrors.length} 项）` : '',
            },
          },
        }
      }
      return { ...detail, extra: { tab: '实例详情', tabs: ['实例详情', '实例监控'] } }
    },
    async execute(actionId, payload, ctx) {
      return runPower(call, actionId, payload, ctx)
    },
  }
  return module
}

async function loadCvmRegion(
  call: TencentProductCall,
  ctx: ModuleContext,
  moduleId: string,
  region: CloudRegion,
): Promise<ResourceCard[]> {
  const zones = await listZones(call, credsOf(ctx), optsOf(ctx), region.region)
  const instances = await listAllPages<CvmInstance>(async (offset, limit) => {
    const data = await call<{ InstanceSet?: CvmInstance[]; TotalCount?: number }>(
      'DescribeInstances',
      { Offset: offset, Limit: limit },
      credsOf(ctx),
      optsOf(ctx, region.region),
    )
    return { items: data.InstanceSet || [], total: data.TotalCount }
  })
  return instances.map((item) => mapCvmItem(item, {
    moduleId,
    region: region.region,
    regionName: region.regionName,
    zoneName: item.Placement?.Zone ? zones.get(item.Placement.Zone) : undefined,
  }))
}

async function loadOne(call: TencentProductCall, ctx: ModuleContext, moduleId: string) {
  const ref = parseInstanceRef(String(ctx.id || ''))
  const region = ref.region
  const instanceId = ref.instanceId
  if (!region || !instanceId) throw new Error('缺少实例或地域')
  const data = await call<{ InstanceSet?: CvmInstance[] }>('DescribeInstances', {
    InstanceIds: [instanceId],
  }, credsOf(ctx), optsOf(ctx, region))
  const item = data.InstanceSet?.[0]
  if (!item) throw new Error('未找到实例')
  const [zones, regions] = await Promise.all([
    listZones(call, credsOf(ctx), optsOf(ctx), region),
    listRegions(call, credsOf(ctx), optsOf(ctx)).catch(() => [] as CloudRegion[]),
  ])
  const regionName = regions.find((row) => row.region === region)?.regionName || region
  const card = mapCvmItem(item, {
    moduleId,
    region,
    regionName,
    zoneName: item.Placement?.Zone ? zones.get(item.Placement.Zone) : undefined,
  })
  return { item, card }
}

async function runPower(
  call: TencentProductCall,
  actionId: string,
  payload: Record<string, unknown>,
  ctx: ModuleContext,
) {
  const api = POWER_ACTIONS[actionId]
  if (!api) return { ok: false as const, error: `未知动作 ${actionId}` }
  const ref = parseInstanceRef(String(ctx.id || payload.instanceId || ''))
  const region = String(payload.region || ref.region || '')
  const instanceId = String(payload.instanceId || ref.instanceId || '')
  if (!region || !instanceId) return { ok: false as const, error: '缺少实例或地域' }
  try {
    const data = await call<{ InstanceSet?: CvmInstance[] }>('DescribeInstances', {
      InstanceIds: [instanceId],
    }, credsOf(ctx), optsOf(ctx, region))
    const item = data.InstanceSet?.[0]
    if (!item) return { ok: false as const, error: '未找到实例' }
    const stateLabel = mapInstanceState(item.InstanceState).stateLabel
    if (!powerAllowed(stateLabel, actionId)) {
      const label = INSTANCE_ACTIONS.find((row) => row.id === actionId)?.label || actionId
      return { ok: false as const, error: `当前状态「${stateLabel}」不能${label}` }
    }
    await call(api, { InstanceIds: [instanceId] }, credsOf(ctx), optsOf(ctx, region))
    return { ok: true as const }
  } catch (err) {
    return { ok: false as const, error: publicErrorMessage(err) }
  }
}

function col(card: ResourceCard, label: string): string {
  return card.columns?.find((item) => item.label === label)?.value || ''
}

export const tencentCvmModule = createCvmModule()
registerModule(tencentCvmModule)
