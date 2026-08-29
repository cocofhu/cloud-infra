import { publicErrorMessage } from '../../../core/safe-error.js'
import { registerModule } from '../../../core/registry.js'
import type { FieldGroup, ModuleContext, ResourceCard, ResourceDetail, ResourceModule } from '../../../core/types.js'
import { lighthouseCall, monitorCall, type TencentProductCall } from '../client.js'
import {
  LIGHTHOUSE_METRICS,
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

export interface LighthouseInstance {
  InstanceId?: string
  InstanceName?: string
  InstanceState?: string
  BundleId?: string
  CPU?: number
  Memory?: number
  OsName?: string
  CreatedTime?: string
  ExpiredTime?: string
  InstanceChargeType?: string
  Zone?: string
  PublicAddresses?: string[]
  PrivateAddresses?: string[]
  SystemDisk?: { DiskType?: string; DiskSize?: number }
  InternetAccessible?: { InternetChargeType?: string; InternetMaxBandwidthOut?: number }
  InstanceTrafficPackage?: { TrafficPackageMonthlyUsed?: number; TrafficPackageTotal?: number }
}

export interface LighthouseMapContext {
  moduleId: string
  region: string
  regionName: string
  zoneName?: string
}

export function mapLighthouseItem(item: LighthouseInstance, ctx: LighthouseMapContext): ResourceCard {
  const instanceId = String(item.InstanceId || '')
  const title = item.InstanceName || instanceId
  const { status, stateLabel } = mapInstanceState(item.InstanceState)
  const publicIp = firstIp(item.PublicAddresses)
  const privateIp = firstIp(item.PrivateAddresses)
  const bundle = formatSpec(item.CPU, item.Memory)
  const expire = consoleTime(item.ExpiredTime) || '-'
  return {
    id: instanceCardId(ctx.moduleId, ctx.region, instanceId),
    moduleId: ctx.moduleId,
    provider: 'tencent',
    kind: 'lighthouse',
    title,
    description: [stateLabel, publicIp, bundle].filter(Boolean).join(' · '),
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
      { label: '公网 IP', value: publicIp || '-' },
      { label: '套餐', value: bundle },
      { label: '到期时间', value: expire },
      { label: '地域', value: ctx.regionName },
      ...(ctx.zoneName || item.Zone ? [{ label: '可用区', value: ctx.zoneName || item.Zone || '' }] : []),
    ],
  }
}

export function lighthouseDetailGroups(item: LighthouseInstance, card: ResourceCard): FieldGroup[] {
  const disk = item.SystemDisk
  const traffic = trafficLabel(item)
  const groups: FieldGroup[] = [
    {
      title: '实例信息',
      fields: [
        { label: '名称', value: card.title },
        { label: 'ID', value: card.instanceId || String(item.InstanceId || '') },
        { label: '状态', value: card.stateLabel || mapInstanceState(item.InstanceState).stateLabel },
      ],
    },
    {
      title: '地域和可用区',
      fields: [
        { label: '地域', value: card.regionName || card.region || '' },
        { label: '可用区', value: card.columns?.find((row) => row.label === '可用区')?.value || item.Zone || '' },
      ],
    },
    {
      title: '套餐类型',
      fields: [{ label: '套餐', value: col(card, '套餐') }],
    },
    {
      title: '实例规格',
      fields: [
        { label: 'CPU', value: item.CPU != null ? `${item.CPU}核` : '' },
        { label: '内存', value: item.Memory != null ? `${item.Memory}GB` : '' },
      ],
    },
    {
      title: '系统盘',
      fields: disk?.DiskSize != null ? [{ label: '系统盘', value: `${disk.DiskSize}GB` }] : [],
    },
    {
      title: '流量包',
      fields: traffic ? [{ label: '流量包', value: traffic }] : [],
    },
    {
      title: '网络信息',
      fields: [
        { label: '公网 IP', value: card.publicIp || firstIp(item.PublicAddresses) || '-' },
        { label: '内网 IP', value: card.privateIp || firstIp(item.PrivateAddresses) || '-' },
      ],
    },
    {
      title: '计费信息',
      fields: [
        { label: '实例计费模式', value: chargeTypeLabel(item.InstanceChargeType) },
        { label: '到期时间', value: consoleTime(item.ExpiredTime) || '-' },
      ],
    },
  ]
  return groups
    .map((group) => ({ ...group, fields: group.fields.filter((row) => row.value) }))
    .filter((group) => group.fields.length)
}

export function matchLighthouseQuery(card: ResourceCard, query: string): boolean {
  return matchInstanceQuery(instanceSearchText(card), query)
}

export function createLighthouseModule(call: TencentProductCall = lighthouseCall, monitor: TencentProductCall = monitorCall): ResourceModule {
  const module: ResourceModule = {
    id: 'tencent.lighthouse',
    provider: 'tencent',
    kind: 'lighthouse',
    title: '腾讯云轻量应用服务器',
    implemented: true,
    actions: INSTANCE_ACTIONS,
    async list(ctx) {
      const regions = await listRegions(call, credsOf(ctx), optsOf(ctx))
      const scoped = pickRegions(regions, ctx.region)
      const { items, errors } = await listAcrossRegions(scoped, async (region) => {
        const mapped = await loadLhRegion(call, ctx, module.id, region)
        return ctx.clientLocalFilter === false
          ? mapped.filter((card) => matchLighthouseQuery(card, ctx.query) && matchRegion(card, ctx.region))
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
      const groups = lighthouseDetailGroups(raw.item, raw.card)
      const detail = {
        card: raw.card,
        fields: groups.flatMap((group) => group.fields),
        groups,
      } satisfies ResourceDetail
      const ref = parseInstanceRef(String(ctx.id || ''))
      if (String(ctx.tab || '') === '实例监控' && ref.region && ref.instanceId) {
        const range = normalizeMonitorRange(ctx.range)
        const monitorData = await fetchMonitorSeries(monitor, {
          namespace: 'QCE/LIGHTHOUSE',
          metrics: LIGHTHOUSE_METRICS,
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
              metrics: LIGHTHOUSE_METRICS,
              series: monitorData.series,
              errors: monitorData.metricErrors,
              note: monitorData.metricErrors.length === LIGHTHOUSE_METRICS.length
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

async function loadLhRegion(
  call: TencentProductCall,
  ctx: ModuleContext,
  moduleId: string,
  region: CloudRegion,
): Promise<ResourceCard[]> {
  const zones = await listZones(call, credsOf(ctx), optsOf(ctx), region.region)
  const instances = await listAllPages<LighthouseInstance>(async (offset, limit) => {
    const data = await call<{ InstanceSet?: LighthouseInstance[]; TotalCount?: number }>(
      'DescribeInstances',
      { Offset: offset, Limit: limit },
      credsOf(ctx),
      optsOf(ctx, region.region),
    )
    return { items: data.InstanceSet || [], total: data.TotalCount }
  })
  return instances.map((item) => {
    return mapLighthouseItem(item, {
      moduleId,
      region: region.region,
      regionName: region.regionName,
      zoneName: item.Zone ? (zones.get(item.Zone) || item.Zone) : undefined,
    })
  })
}

async function loadOne(call: TencentProductCall, ctx: ModuleContext, moduleId: string) {
  const ref = parseInstanceRef(String(ctx.id || ''))
  const region = ref.region
  const instanceId = ref.instanceId
  if (!region || !instanceId) throw new Error('缺少实例或地域')
  const data = await call<{ InstanceSet?: LighthouseInstance[] }>('DescribeInstances', {
    InstanceIds: [instanceId],
  }, credsOf(ctx), optsOf(ctx, region))
  const item = data.InstanceSet?.[0]
  if (!item) throw new Error('未找到实例')
  const [zones, regions] = await Promise.all([
    listZones(call, credsOf(ctx), optsOf(ctx), region),
    listRegions(call, credsOf(ctx), optsOf(ctx)).catch(() => [] as CloudRegion[]),
  ])
  const regionName = regions.find((row) => row.region === region)?.regionName || region
  const card = mapLighthouseItem(item, {
    moduleId,
    region,
    regionName,
    zoneName: item.Zone ? (zones.get(item.Zone) || item.Zone) : undefined,
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
    const data = await call<{ InstanceSet?: LighthouseInstance[] }>('DescribeInstances', {
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

function trafficLabel(item: LighthouseInstance): string {
  const pack = item.InstanceTrafficPackage
  if (pack?.TrafficPackageTotal != null) {
    const used = pack.TrafficPackageMonthlyUsed != null ? `${pack.TrafficPackageMonthlyUsed}GB / ` : ''
    return `${used}${pack.TrafficPackageTotal}GB`
  }
  const bw = item.InternetAccessible?.InternetMaxBandwidthOut
  if (bw != null) return `${bw}Mbps`
  return ''
}

export const tencentLighthouseModule = createLighthouseModule()
registerModule(tencentLighthouseModule)
