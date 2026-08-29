import { publicErrorMessage } from '../../../core/safe-error.js'
import { registerModule } from '../../../core/registry.js'
import type {
  CredentialField,
  DetailSection,
  ModuleContext,
  ResourceAction,
  ResourceCard,
  ResourceDetail,
  ResourceModule,
  ResourceStatus,
} from '../../../core/types.js'
import { catCall, monitorCall, TencentApiError } from '../client.js'

export const CAT_MODULE_ID = 'tencent.cat'

export interface ProbeTaskItem {
  Name?: string
  TaskId?: string
  TaskType?: number
  Nodes?: string[]
  NodeIpType?: number
  Interval?: number
  Parameters?: string
  Status?: number
  TargetAddress?: string
  PayMode?: number
  TaskCategory?: number
  CreatedAt?: string
  Cron?: string
  CronState?: number
  TagInfoList?: Array<{ TagKey?: string; TagValue?: string }>
}

export interface NodeDefineItem {
  Name?: string
  Code?: string
  Type?: number
  NetService?: string
  District?: string
  City?: string
}

export interface InstantTaskItem {
  TaskId?: string
  TargetAddress?: string
  TaskType?: number
  ProbeTime?: number
  Status?: string
  SuccessRate?: number
  NodeCount?: number
  TaskCategory?: number
}

export interface AlarmPolicyItem {
  PolicyId?: string
  PolicyName?: string
  Namespace?: string
  Enable?: number
  Condition?: { Rules?: Array<{ MetricName?: string; Operator?: string; Value?: string }> }
  Remark?: string
}

export type CatScope = 'task' | 'instant' | 'alarm'

const TASK_TYPES: Record<number, string> = {
  1: '页面性能',
  2: '文件上传',
  3: '文件下载',
  4: '端口性能',
  5: '网络质量',
  6: '音视频体验',
  7: '域名 whois',
}

const INSTANT_TYPES = [1, 3, 4, 5, 7] as const

const INTERVAL_LABELS: Record<number, string> = {
  1: '1分钟',
  5: '5分钟',
  10: '10分钟',
  15: '15分钟',
  30: '30分钟',
  60: '1小时',
  120: '2小时',
  240: '4小时',
}

const NODE_TYPE_LABELS: Record<number, string> = {
  1: 'IDC',
  2: 'LastMile',
  3: '移动端',
}

const ANALYZE_TYPE: Record<number, string> = {
  1: 'AnalyzeTaskType_Browse',
  2: 'AnalyzeTaskType_UploadDownload',
  3: 'AnalyzeTaskType_UploadDownload',
  4: 'AnalyzeTaskType_Transport',
  5: 'AnalyzeTaskType_Network',
  6: 'AnalyzeTaskType_MediaStream',
}

const METRIC_FIELDS: Record<number, Array<{ label: string; field: string }>> = {
  1: [
    { label: '可用性', field: 'avg(available)' },
    { label: '整体时延', field: 'avg(first_screen_time)' },
    { label: '错误数', field: 'sum("error_count")' },
  ],
  2: [
    { label: '可用性', field: 'avg(available)' },
    { label: '传输时延', field: 'avg(transfer_time)' },
    { label: '错误数', field: 'sum("error_count")' },
  ],
  3: [
    { label: '可用性', field: 'avg(available)' },
    { label: '传输时延', field: 'avg(transfer_time)' },
    { label: '错误数', field: 'sum("error_count")' },
  ],
  4: [
    { label: '可用性', field: 'avg(available)' },
    { label: '整体时延', field: 'avg(ping_time)' },
    { label: '错误数', field: 'sum("error_count")' },
  ],
  5: [
    { label: '可用性', field: 'avg(available)' },
    { label: '整体时延', field: 'avg(ping_time)' },
    { label: '错误数', field: 'sum("error_count")' },
  ],
  6: [
    { label: '可用性', field: 'avg(available)' },
    { label: '播放时延', field: 'avg(stream_time)' },
    { label: '错误数', field: 'sum("error_count")' },
  ],
}

const STATUS_LABELS: Record<number, string> = {
  1: '创建中',
  2: '运行中',
  3: '运行异常',
  4: '暂停中',
  5: '暂停异常',
  6: '已暂停',
  7: '删除中',
  8: '删除异常',
  9: '已删除',
  10: '定时任务暂停中',
}

const OPT = (items: Array<[string, string]>) => items.map(([value, label]) => ({ value, label }))

const INTERVAL_OPTIONS = OPT([
  ['1', '1分钟'],
  ['5', '5分钟'],
  ['10', '10分钟'],
  ['15', '15分钟'],
  ['30', '30分钟'],
  ['60', '1小时'],
  ['120', '2小时'],
  ['240', '4小时'],
])

const TASK_TYPE_OPTIONS = OPT(Object.entries(TASK_TYPES).map(([value, label]) => [value, label]))
const INSTANT_TYPE_OPTIONS = OPT(INSTANT_TYPES.map((value) => [String(value), TASK_TYPES[value]]))

function field(group: string, key: string, label: string, extra: Partial<CredentialField> = {}): CredentialField {
  return { key, label, group, ...extra }
}

const BASIC_FIELDS: CredentialField[] = [
  field('基本信息', 'probeKind', '拨测类型', { options: OPT([['custom', '自定义'], ['quick', '快速拨测']]) }),
  field('基本信息', 'taskType', '任务类型', { options: TASK_TYPE_OPTIONS }),
  field('基本信息', 'name', '任务名称', { placeholder: '控制台任务名称' }),
  field('基本信息', 'targetAddress', '拨测地址', { placeholder: 'https://example.com' }),
  field('基本信息', 'interval', '拨测频率', { options: INTERVAL_OPTIONS }),
  field('基本信息', 'cron', '自定义执行', { placeholder: 'cron，可空' }),
  field('基本信息', 'tags', '标签', { placeholder: 'env=prod,app=web' }),
  field('基本信息', 'packageHint', '套餐包', { placeholder: '快速拨测展示套餐包，不内嵌购买' }),
]

const NODE_FIELDS: CredentialField[] = [
  field('拨测点', 'nodeSelect', '点组', { options: OPT([['recommend', '推荐'], ['custom', '自定义组']]) }),
  field('拨测点', 'nodeType', '点类型', { options: OPT([['1', 'IDC'], ['2', 'LastMile'], ['3', '移动端']]) }),
  field('拨测点', 'nodes', '拨测点', { placeholder: '节点编码，逗号分隔；失败回退编码' }),
  field('拨测点', 'nodeIpType', 'IP 类型', { options: OPT([['0', '不限'], ['1', 'IPv4'], ['2', 'IPv6']]) }),
]

const PARAM_FIELDS: CredentialField[] = [
  field('拨测参数 · 通用', 'ipType', 'IP类型', { options: OPT([['0', '自动'], ['1', 'IPv4'], ['2', 'IPv6']]) }),
  field('拨测参数 · 通用', 'grabBag', '抓包', { options: OPT([['0', '关闭'], ['1', '开启']]) }),
  field('拨测参数 · 页面性能', 'navCustomHost', '自定义 Host', { options: OPT([['0', '随机'], ['1', '轮询']]) }),
  field('拨测参数 · 页面性能', 'navCustomHostIp', '自定义 Host 内容'),
  field('拨测参数 · 页面性能', 'whiteList', '劫持白名单'),
  field('拨测参数 · 页面性能', 'blackList', '劫持黑名单'),
  field('拨测参数 · 文件上传', 'uploadType', '上传方法', { placeholder: 'POST / PUT' }),
  field('拨测参数 · 文件上传', 'uploadCustomHost', '上传自定义 Host', { options: OPT([['0', '随机'], ['1', '轮询']]) }),
  field('拨测参数 · 文件上传', 'uploadCustomHostIp', '上传 Host 内容'),
  field('拨测参数 · 文件上传', 'uploadTransmissionSize', '传输大小(KB)', { placeholder: '1024' }),
  field('拨测参数 · 文件上传', 'uploadSpecificFileUrl', '指定文件地址'),
  field('拨测参数 · 文件上传', 'monitorTimeout', '检测超时(秒)', { placeholder: '60' }),
  field('拨测参数 · 文件下载', 'downloadTransmissionSize', '下载传输大小(KB)', { placeholder: '1024' }),
  field('拨测参数 · 文件下载', 'downloadCustomHost', '下载自定义 Host', { options: OPT([['0', '随机'], ['1', '轮询']]) }),
  field('拨测参数 · 文件下载', 'downloadCustomHostIp', '下载 Host 内容'),
  field('拨测参数 · 端口性能', 'protocolType', '协议类型', { options: OPT([['0', 'TCP'], ['1', 'SSL'], ['2', 'UDP'], ['3', 'HTTP']]) }),
  field('拨测参数 · 端口性能', 'protocolRequestType', '请求类型', { placeholder: 'T:' }),
  field('拨测参数 · 端口性能', 'protocolRequestContent', '请求内容'),
  field('拨测参数 · 端口性能', 'protocolCustomHost', '端口自定义 Host', { options: OPT([['0', '随机'], ['1', '轮询']]) }),
  field('拨测参数 · 端口性能', 'protocolVerifyWay', '校验方式', { placeholder: '0' }),
  field('拨测参数 · 端口性能', 'protocolVerifyText', '校验内容'),
  field('拨测参数 · 网络质量', 'netIcmpOn', '启用 Ping', { options: OPT([['1', '启用'], ['0', '不启用']]) }),
  field('拨测参数 · 网络质量', 'netIcmpActivex', 'Ping 协议', { options: OPT([['0', 'icmp'], ['1', 'tcp'], ['2', 'udp']]) }),
  field('拨测参数 · 网络质量', 'netIcmpTimeout', 'Ping 超时(秒)', { placeholder: '20' }),
  field('拨测参数 · 网络质量', 'netIcmpNum', '包数量', { placeholder: '20' }),
  field('拨测参数 · 网络质量', 'netDnsOn', '启用 DNS', { options: OPT([['1', '启用'], ['0', '不启用']]) }),
  field('拨测参数 · 网络质量', 'netTracertOn', '启用 Tracert', { options: OPT([['1', '启用'], ['0', '不启用']]) }),
  field('拨测参数 · 音视频', 'streamType', '资源类型', { options: OPT([['0', '音频'], ['1', '视频']]) }),
  field('拨测参数 · 音视频', 'streamAddressType', '地址类型', { options: OPT([['0', '页面地址'], ['1', '资源地址']]) }),
  field('拨测参数 · 音视频', 'streamMonitorTimeout', '播放超时(秒)', { placeholder: '30' }),
  field('拨测参数 · 音视频', 'streamCustomHost', '流媒体自定义 Host', { options: OPT([['0', '随机'], ['1', '轮询']]) }),
]

const TASK_FORM_FIELDS = [...BASIC_FIELDS, ...NODE_FIELDS, ...PARAM_FIELDS]

const INSTANT_FIELDS: CredentialField[] = [
  field('即时拨测', 'taskType', '任务类型', { options: INSTANT_TYPE_OPTIONS }),
  field('即时拨测', 'name', '任务名称', { placeholder: '可空，默认用地址' }),
  field('即时拨测', 'targetAddress', '拨测地址'),
  field('即时拨测', 'nodes', '拨测点', { placeholder: '节点编码，逗号分隔' }),
  field('即时拨测', 'nodeType', '点类型', { options: OPT([['1', 'IDC'], ['2', 'LastMile'], ['3', '移动端']]) }),
  field('即时拨测', 'billingHint', '计费说明', { placeholder: '按量计费，不接支付' }),
  ...PARAM_FIELDS,
]

const ALARM_FIELDS: CredentialField[] = [
  field('告警配置', 'name', '策略名称'),
  field('告警配置', 'taskId', '任务', { placeholder: 'task-xxx' }),
  field('告警配置', 'metric', '指标', { options: OPT([['availability', '可用性'], ['latency', '整体时延'], ['error', '错误数']]) }),
  field('告警配置', 'operator', '比较', { options: OPT([['lt', '<'], ['le', '<='], ['gt', '>'], ['ge', '>=']]) }),
  field('告警配置', 'threshold', '阈值', { placeholder: '99' }),
]

const ACTIONS: ResourceAction[] = [
  { id: 'task.create', label: '新建任务', confirm: 'default', fields: TASK_FORM_FIELDS },
  { id: 'task.update', label: '配置', confirm: 'default', fields: TASK_FORM_FIELDS },
  { id: 'task.suspend', label: '暂停', confirm: 'default' },
  { id: 'task.resume', label: '恢复', confirm: 'default' },
  { id: 'task.delete', label: '删除', confirm: 'always' },
  { id: 'task.batchSuspend', label: '批量暂停', confirm: 'always' },
  { id: 'instant.create', label: '开始测试', confirm: 'default', fields: INSTANT_FIELDS },
  { id: 'alarm.create', label: '新建告警', confirm: 'default', fields: ALARM_FIELDS },
]

export function taskTypeLabel(type?: number): string {
  if (type == null) return '-'
  return TASK_TYPES[type] || `类型 ${type}`
}

export function intervalLabel(minutes?: number): string {
  if (minutes == null) return '-'
  return INTERVAL_LABELS[minutes] || `${minutes}分钟`
}

export function mapTaskStatus(status?: number): ResourceStatus {
  if (status === 2) return 'enable'
  if (status === 3 || status === 5 || status === 8) return 'error'
  if (status === 4 || status === 6 || status === 10) return 'pause'
  return 'unknown'
}

export function taskStatusLabel(status?: number): string {
  if (status == null) return '-'
  return STATUS_LABELS[status] || String(status)
}

export function parseCatRef(id: string): { moduleId: string; scope: CatScope; ref: string } {
  const text = String(id || '')
  const prefix = `${CAT_MODULE_ID}:`
  const rest = text.startsWith(prefix) ? text.slice(prefix.length) : text
  const idx = rest.indexOf(':')
  if (idx < 0) return { moduleId: CAT_MODULE_ID, scope: 'task', ref: rest }
  const head = rest.slice(0, idx)
  const ref = rest.slice(idx + 1)
  if (head === 'instant' || head === 'alarm' || head === 'task') return { moduleId: CAT_MODULE_ID, scope: head, ref }
  return { moduleId: CAT_MODULE_ID, scope: 'task', ref: rest }
}

export function catCardId(scope: CatScope, ref: string): string {
  return `${CAT_MODULE_ID}:${scope}:${ref}`
}

export function resolveCatScope(kind: string, query: string): CatScope {
  const k = String(kind || '').trim().toLowerCase()
  if (k === 'cat.instant' || k === 'instant') return 'instant'
  if (k === 'cat.alarm' || k === 'alarm') return 'alarm'
  if (k === 'cat.task' || k === 'probe') return 'task'
  const q = String(query || '').trim()
  if (q === '即时拨测' || /^(即时|instant)\b/i.test(q)) return 'instant'
  if (q === '告警配置' || /^(告警|alarm)\b/i.test(q)) return 'alarm'
  return 'task'
}

export function mapProbeTask(item: ProbeTaskItem, nodeNames: Record<string, string> = {}): ResourceCard {
  const taskId = String(item.TaskId || '')
  const nodes = item.Nodes || []
  const nodeText = nodes.length
    ? nodes.map((code) => nodeNames[code] || code).join('、')
    : '-'
  const status = mapTaskStatus(item.Status)
  return {
    id: catCardId('task', taskId),
    moduleId: CAT_MODULE_ID,
    provider: 'tencent',
    kind: 'cat',
    title: item.Name || taskId || '-',
    description: [taskTypeLabel(item.TaskType), item.TargetAddress, taskStatusLabel(item.Status)].filter(Boolean).join(' · '),
    status,
    badges: [taskTypeLabel(item.TaskType), intervalLabel(item.Interval)].filter((x) => x !== '-'),
    columns: [
      { label: '任务类型', value: taskTypeLabel(item.TaskType) },
      { label: '拨测地址', value: item.TargetAddress || '-' },
      { label: '拨测频率', value: intervalLabel(item.Interval) },
      { label: '拨测点', value: nodeText },
    ],
    openLabel: '配置',
    actions: ACTIONS.filter((a) => a.id.startsWith('task.') || a.id === 'alarm.create'),
  }
}

export function mapInstantTask(item: InstantTaskItem): ResourceCard {
  const taskId = String(item.TaskId || '')
  const when = formatProbeTime(item.ProbeTime)
  return {
    id: catCardId('instant', taskId),
    moduleId: CAT_MODULE_ID,
    provider: 'tencent',
    kind: 'cat.instant',
    title: item.TargetAddress || taskId || '即时拨测',
    description: [taskTypeLabel(item.TaskType), when, instantStatusLabel(item.Status)].filter(Boolean).join(' · '),
    status: instantStatus(item.Status),
    badges: [taskTypeLabel(item.TaskType)],
    columns: [
      { label: '任务类型', value: taskTypeLabel(item.TaskType) },
      { label: '拨测地址', value: item.TargetAddress || '-' },
      { label: '创建时间', value: when },
      { label: '成功率', value: item.SuccessRate != null ? `${item.SuccessRate}%` : '-' },
    ],
    openLabel: '诊断',
  }
}

export function mapAlarmPolicy(item: AlarmPolicyItem): ResourceCard {
  const policyId = String(item.PolicyId || '')
  const rule = item.Condition?.Rules?.[0]
  const metric = alarmMetricLabel(rule?.MetricName)
  const threshold = rule ? `${operatorLabel(rule.Operator)} ${rule.Value || ''}`.trim() : '-'
  return {
    id: catCardId('alarm', policyId),
    moduleId: CAT_MODULE_ID,
    provider: 'tencent',
    kind: 'cat.alarm',
    title: item.PolicyName || policyId || '告警策略',
    description: [metric, threshold, item.Enable === 0 ? '已停用' : '已启用'].filter(Boolean).join(' · '),
    status: item.Enable === 0 ? 'pause' : 'enable',
    columns: [
      { label: '任务', value: extractTaskId(item.Remark) || '-' },
      { label: '指标', value: metric },
      { label: '阈值', value: threshold },
    ],
    openLabel: '历史',
  }
}

export function defaultParameters(taskType: number): Record<string, unknown> {
  const base = { ipType: 0, grabBag: 0 }
  if (taskType === 1) return { ...base, navCustomHost: 1, navCustomHostIp: '', whiteList: '', blackList: '' }
  if (taskType === 2) {
    return { ...base, uploadType: 'POST', uploadCustomHost: 1, uploadCustomHostIp: '', uploadTransmissionSize: 1024, monitorTimeout: 60 }
  }
  if (taskType === 3) {
    return { ...base, downloadTransmissionSize: 1024, downloadCustomHost: 1, downloadCustomHostIp: '', whiteList: '', blackList: '', monitorTimeout: 60 }
  }
  if (taskType === 4) {
    return {
      ...base,
      protocolRequestType: 'T:',
      protocolCharacterEncoding: 0,
      protocolType: 1,
      protocolRequestContent: '',
      protocolCustomHost: 1,
      protocolCustomHostIp: '',
      protocolVerifyWay: 0,
      protocolVerifyText: '',
    }
  }
  if (taskType === 5) {
    return {
      ...base,
      netIcmpOn: 1,
      netIcmpActivex: 0,
      netIcmpTimeout: 20,
      netIcmpInterval: 0.5,
      netIcmpNum: 20,
      netIcmpSize: 32,
      netIcmpDataCut: 1,
      netDnsOn: 1,
      netDnsTimeout: 20,
      netDnsQuerymethod: 1,
      netDnsNs: '',
      netDigOn: 0,
      netDnsServer: 2,
      netTracertOn: 1,
      netTracertTimeout: 20,
      netTracertNum: 30,
      whiteList: '',
      blackList: '',
      netIcmpActivexStr: '',
    }
  }
  if (taskType === 6) {
    return { ...base, streamType: 0, streamMonitorTimeout: 30, streamAddressType: 0, streamCustomHost: 1, streamCustomHostIp: '', whiteList: '', blackList: '' }
  }
  return { ...base }
}

export function mergeParameters(taskType: number, payload: Record<string, unknown>, existing?: string): string {
  const current = parseJson(existing)
  const next = { ...defaultParameters(taskType), ...current }
  const keys = paramKeysFor(taskType)
  for (const key of keys) {
    if (payload[key] == null || payload[key] === '') continue
    next[key] = coerceParam(key, payload[key])
  }
  if (payload.ipType != null && payload.ipType !== '') next.ipType = Number(payload.ipType)
  if (payload.grabBag != null && payload.grabBag !== '') next.grabBag = Number(payload.grabBag)
  return JSON.stringify(next)
}

export function paramFieldsFromJson(taskType: number, raw?: string): Array<{ label: string; value: string }> {
  const data = parseJson(raw)
  const labels = paramConsoleLabels(taskType)
  return labels.map(({ key, label }) => ({ label, value: formatParamValue(key, data[key]) })).filter((row) => row.value !== '')
}

export function createCatModule(
  call: typeof catCall = catCall,
  monitor: typeof monitorCall = monitorCall,
): ResourceModule {
  const module: ResourceModule = {
    id: CAT_MODULE_ID,
    provider: 'tencent',
    kind: 'cat',
    title: '腾讯云云拨测',
    implemented: true,
    actions: ACTIONS,
    async list(ctx) {
      const scope = resolveCatScope(ctx.kind || '', ctx.query)
      if (scope === 'instant') return listInstant(call, ctx)
      if (scope === 'alarm') return listAlarms(monitor, ctx)
      return listTasks(call, ctx)
    },
    async detail(ctx) {
      const parsed = parseCatRef(String(ctx.id || ''))
      if (parsed.scope === 'instant') return instantDetail(call, ctx, parsed.ref)
      if (parsed.scope === 'alarm') return alarmDetail(monitor, ctx, parsed.ref)
      return taskDetail(call, monitor, ctx, parsed.ref)
    },
    async execute(actionId, payload, ctx) {
      try {
        if (actionId === 'task.create') return createTask(call, payload, ctx)
        if (actionId === 'task.update') return updateTask(call, payload, ctx)
        if (actionId === 'task.suspend') return taskIdsAction(call, 'SuspendProbeTask', payload, ctx, 'write')
        if (actionId === 'task.resume') return taskIdsAction(call, 'ResumeProbeTask', payload, ctx, 'write')
        if (actionId === 'task.delete') return taskIdsAction(call, 'DeleteProbeTask', payload, ctx, 'write')
        if (actionId === 'task.batchSuspend') return taskIdsAction(call, 'SuspendProbeTask', payload, ctx, 'write')
        if (actionId === 'instant.create') return createInstant(call, payload, ctx)
        if (actionId === 'alarm.create') return createAlarm(monitor, payload, ctx)
        return { ok: false, error: `未知动作 ${actionId}` }
      } catch (err) {
        return { ok: false, error: catPublicError(err, areaOf(actionId)) }
      }
    },
  }
  return module
}

async function listTasks(call: typeof catCall, ctx: ModuleContext) {
  const data = await wrap('read', () => call<{ TaskSet?: ProbeTaskItem[]; Total?: number }>('DescribeProbeTasks', {
    TaskName: ctx.query || undefined,
    Offset: ctx.offset,
    Limit: ctx.limit,
  }, creds(ctx), opts(ctx)))
  const nodes = await loadNodeMap(call, ctx).catch(() => ({} as Record<string, string>))
  const raw = data.TaskSet || []
  const items = raw.map((item) => mapProbeTask(item, nodes))
  const total = Number(data.Total ?? items.length)
  return { items, total, offset: ctx.offset, hasMore: ctx.offset + items.length < total }
}

async function listInstant(call: typeof catCall, ctx: ModuleContext) {
  const data = await wrap('read', () => call<{ Tasks?: InstantTaskItem[]; Total?: number }>('DescribeInstantTasks', {
    Limit: ctx.limit,
    Offset: Math.max(0, ctx.offset),
  }, creds(ctx), opts(ctx)))
  const needle = String(ctx.query || '').replace(/^(即时拨测|即时|instant)\s*/i, '').trim()
  const raw = (data.Tasks || []).filter((item) => {
    if (!needle) return true
    return `${item.TargetAddress || ''} ${item.TaskId || ''}`.includes(needle)
  })
  const items = raw.map(mapInstantTask)
  const total = Number(data.Total ?? items.length)
  return { items, total, offset: ctx.offset, hasMore: ctx.offset + items.length < total }
}

async function listAlarms(monitor: typeof monitorCall, ctx: ModuleContext) {
  try {
    const data = await monitor<{ Policies?: AlarmPolicyItem[]; TotalCount?: number; Total?: number }>('DescribeAlarmPolicies', {
      Module: 'monitor',
      PageNumber: Math.floor(ctx.offset / Math.max(ctx.limit, 1)) + 1,
      PageSize: ctx.limit,
      MonitorTypes: ['MT_QCE'],
      Namespaces: ['cat'],
      PolicyName: stripAlarmQuery(ctx.query) || undefined,
    }, creds(ctx), opts(ctx))
    const raw = (data.Policies || []).filter(isCatAlarm)
    const items = raw.map(mapAlarmPolicy)
    const total = Number(data.TotalCount ?? data.Total ?? items.length)
    return { items, total, offset: ctx.offset, hasMore: ctx.offset + items.length < total }
  } catch (err) {
    if (isNotOpened(err)) throw new Error('当前账号尚未开通云拨测告警，请到可观测平台开通。对话不会改插件设置。')
    throw err
  }
}

async function taskDetail(call: typeof catCall, monitor: typeof monitorCall, ctx: ModuleContext, taskId: string): Promise<ResourceDetail> {
  if (!taskId) throw new Error('缺少任务')
  const data = await wrap('read', () => call<{ TaskSet?: ProbeTaskItem[] }>('DescribeProbeTasks', {
    TaskIDs: [taskId],
  }, creds(ctx), opts(ctx)))
  const task = data.TaskSet?.[0]
  if (!task) throw new Error('没有找到拨测任务')
  const nodeMap = await loadNodeMap(call, ctx).catch(() => ({} as Record<string, string>))
  const card = mapProbeTask(task, nodeMap)
  const nodes = task.Nodes || []
  const nodeRows = nodes.map((code) => {
    const name = nodeMap[code]
    return {
      id: code,
      cells: [
        { label: '拨测点', value: name || code },
        { label: '编码', value: code },
        { label: '点类型', value: inferNodeType(name || code) },
      ],
    }
  })
  const basic: DetailSection = {
    title: '基本信息',
    fields: [
      { label: '拨测类型', value: task.PayMode === 2 ? '快速拨测' : '自定义' },
      { label: '任务类型', value: taskTypeLabel(task.TaskType) },
      { label: '任务名称', value: task.Name || '' },
      { label: '拨测地址', value: task.TargetAddress || '' },
      { label: '拨测频率', value: intervalLabel(task.Interval) },
      { label: '自定义执行', value: task.Cron || '未设置' },
      { label: '标签', value: (task.TagInfoList || []).map((t) => `${t.TagKey}=${t.TagValue}`).join(', ') || '无' },
      { label: '套餐包', value: task.PayMode === 2 ? '付费套餐包（不内嵌购买）' : '自定义，不展示购买' },
      { label: '状态', value: taskStatusLabel(task.Status) },
    ].filter((row) => row.value),
  }
  const point: DetailSection = {
    title: '拨测点',
    fields: [
      { label: '点组', value: nodes.length ? '自定义组' : '未选择' },
      { label: 'IP 类型', value: task.NodeIpType === 1 ? 'IPv4' : task.NodeIpType === 2 ? 'IPv6' : '不限' },
    ],
    rows: nodeRows,
    hint: nodeRows.length ? undefined : '尚未选择拨测点。解析节点名失败时回退显示编码。',
  }
  const params: DetailSection = {
    title: '拨测参数',
    fields: paramFieldsFromJson(task.TaskType || 1, task.Parameters),
    hint: paramFieldsFromJson(task.TaskType || 1, task.Parameters).length ? undefined : '当前任务未返回拨测参数',
  }
  const analysis = await loadAnalysis(call, ctx, task)
  const alarms = await loadTaskAlarms(monitor, ctx, taskId)
  const fields = [
    { label: '任务类型', value: taskTypeLabel(task.TaskType) },
    { label: '状态', value: taskStatusLabel(task.Status) },
    { label: '拨测地址', value: task.TargetAddress || '' },
    { label: '拨测频率', value: intervalLabel(task.Interval) },
  ].filter((row) => row.value)
  return { card, fields, sections: [basic, point, params, analysis, alarms] }
}

async function instantDetail(call: typeof catCall, ctx: ModuleContext, taskId: string): Promise<ResourceDetail> {
  if (!taskId) throw new Error('缺少即时拨测')
  const data = await wrap('read', () => call<{ Tasks?: InstantTaskItem[] }>('DescribeInstantTasks', {
    Limit: 50,
    Offset: 0,
  }, creds(ctx), opts(ctx)))
  const item = (data.Tasks || []).find((row) => String(row.TaskId) === taskId) || { TaskId: taskId }
  const card = mapInstantTask(item)
  const logs = await loadSingleLogs(call, ctx, item.TaskType || 1, [taskId]).catch(() => [] as Array<{ id?: string; cells: Array<{ label: string; value: string }> }>)
  return {
    card,
    fields: [
      { label: '任务类型', value: taskTypeLabel(item.TaskType) },
      { label: '拨测地址', value: item.TargetAddress || '' },
      { label: '创建时间', value: formatProbeTime(item.ProbeTime) },
      { label: '诊断状态', value: instantStatusLabel(item.Status) },
      { label: '成功率', value: item.SuccessRate != null ? `${item.SuccessRate}%` : '-' },
    ].filter((row) => row.value),
    sections: [
      {
        title: '历史诊断',
        fields: [
          { label: '节点数', value: item.NodeCount != null ? String(item.NodeCount) : '-' },
          { label: '计费', value: '按量计费，不接支付' },
        ],
        rows: logs,
        hint: logs.length ? '等待 1–3 分钟后刷新可看到更完整诊断。' : '暂无诊断样本。即时拨测完成后约 1–3 分钟可查看历史。',
      },
    ],
  }
}

async function alarmDetail(monitor: typeof monitorCall, ctx: ModuleContext, policyId: string): Promise<ResourceDetail> {
  if (!policyId) throw new Error('缺少告警策略')
  let policy: AlarmPolicyItem | undefined
  try {
    const data = await monitor<{ Policies?: AlarmPolicyItem[] }>('DescribeAlarmPolicies', {
      Module: 'monitor',
      PageNumber: 1,
      PageSize: 50,
      MonitorTypes: ['MT_QCE'],
      Namespaces: ['cat'],
    }, creds(ctx), opts(ctx))
    policy = (data.Policies || []).find((row) => String(row.PolicyId) === policyId)
  } catch (err) {
    if (isNotOpened(err)) throw new Error('当前账号尚未开通云拨测告警，请到可观测平台开通。')
    throw err
  }
  const item = policy || { PolicyId: policyId, PolicyName: ctx.title }
  const card = mapAlarmPolicy(item)
  const history = await loadAlarmHistory(monitor, ctx, policyId)
  const rule = item.Condition?.Rules?.[0]
  return {
    card,
    fields: [
      { label: '策略', value: item.PolicyName || policyId },
      { label: '指标', value: alarmMetricLabel(rule?.MetricName) },
      { label: '阈值', value: rule ? `${operatorLabel(rule.Operator)} ${rule.Value || ''}` : '-' },
    ],
    sections: [
      {
        title: '告警策略',
        fields: [
          { label: '策略名称', value: item.PolicyName || '' },
          { label: '任务', value: extractTaskId(item.Remark) || '-' },
          { label: '指标', value: alarmMetricLabel(rule?.MetricName) },
          { label: '阈值', value: rule ? `${operatorLabel(rule.Operator)} ${rule.Value || ''}` : '-' },
          { label: '状态', value: item.Enable === 0 ? '已停用' : '已启用' },
        ].filter((row) => row.value),
      },
      {
        title: '告警历史',
        rows: history,
        hint: history.length ? undefined : '暂无告警历史。',
      },
    ],
  }
}

async function createTask(call: typeof catCall, payload: Record<string, unknown>, ctx: ModuleContext) {
  const taskType = Number(payload.taskType || 1)
  const name = String(payload.name || '').trim()
  const target = String(payload.targetAddress || '').trim()
  if (!target) return { ok: false, error: '缺少拨测地址' }
  const nodes = await resolveNodes(call, payload, ctx)
  if (!nodes.length) return { ok: false, error: '缺少拨测点，请填写节点编码或改用推荐点' }
  await wrap('write', () => call('CreateProbeTasks', {
    BatchTasks: [{ Name: name || target, TargetAddress: target }],
    TaskType: taskType,
    Nodes: nodes,
    Interval: Number(payload.interval || 5),
    Parameters: mergeParameters(taskType, payload),
    TaskCategory: 1,
    Cron: String(payload.cron || '').trim() || undefined,
    NodeIpType: Number(payload.nodeIpType || 0),
    ProbeType: 0,
    Tag: parseTags(payload.tags),
  }, creds(ctx), opts(ctx)))
  return { ok: true as const }
}

async function updateTask(call: typeof catCall, payload: Record<string, unknown>, ctx: ModuleContext) {
  const taskId = firstTaskId(payload, ctx)
  if (!taskId) return { ok: false, error: '缺少任务' }
  const current = await wrap('read', () => call<{ TaskSet?: ProbeTaskItem[] }>('DescribeProbeTasks', {
    TaskIDs: [taskId],
  }, creds(ctx), opts(ctx)))
  const task = current.TaskSet?.[0]
  if (!task) return { ok: false, error: '没有找到拨测任务' }
  const taskType = Number(payload.taskType || task.TaskType || 1)
  const nodes = await resolveNodes(call, payload, ctx, task.Nodes)
  const name = String(payload.name || '').trim()
  if (name && name !== task.Name) {
    await wrap('write', () => call('UpdateProbeTaskAttributes', { TaskId: taskId, Name: name }, creds(ctx), opts(ctx)))
  }
  await wrap('write', () => call('UpdateProbeTaskConfigurationList', {
    TaskIds: [taskId],
    Nodes: nodes.length ? nodes : (task.Nodes || []),
    Interval: Number(payload.interval || task.Interval || 5),
    Parameters: mergeParameters(taskType, payload, task.Parameters),
    Cron: String(payload.cron || task.Cron || '').trim() || undefined,
    NodeIpType: payload.nodeIpType != null && payload.nodeIpType !== '' ? Number(payload.nodeIpType) : task.NodeIpType,
  }, creds(ctx), opts(ctx)))
  return { ok: true as const }
}

async function createInstant(call: typeof catCall, payload: Record<string, unknown>, ctx: ModuleContext) {
  const taskType = Number(payload.taskType || 5)
  if (!INSTANT_TYPES.includes(taskType as typeof INSTANT_TYPES[number])) {
    return { ok: false, error: '即时拨测仅支持网络质量、页面性能、端口、文件下载、whois' }
  }
  const target = String(payload.targetAddress || '').trim()
  if (!target) return { ok: false, error: '缺少拨测地址' }
  const nodes = await resolveNodes(call, payload, ctx)
  if (!nodes.length) return { ok: false, error: '缺少拨测点' }
  await wrap('write', () => call('CreateProbeTasks', {
    BatchTasks: [{ Name: String(payload.name || '').trim() || `即时-${target}`, TargetAddress: target }],
    TaskType: taskType,
    Nodes: nodes,
    Interval: 1,
    Parameters: mergeParameters(taskType, payload),
    TaskCategory: 1,
    ProbeType: 1,
  }, creds(ctx), opts(ctx)))
  return { ok: true as const }
}

async function createAlarm(monitor: typeof monitorCall, payload: Record<string, unknown>, ctx: ModuleContext) {
  const name = String(payload.name || '').trim()
  const taskId = String(payload.taskId || firstTaskId(payload, ctx) || '').trim()
  const threshold = String(payload.threshold || '').trim()
  if (!name) return { ok: false, error: '缺少策略名称' }
  if (!threshold) return { ok: false, error: '缺少阈值' }
  const metricKey = String(payload.metric || 'availability')
  const metricName = metricKey === 'latency' ? 'AvgTime' : metricKey === 'error' ? 'ErrorCount' : 'Availability'
  try {
    await monitor('CreateAlarmPolicy', {
      Module: 'monitor',
      PolicyName: name,
      MonitorType: 'MT_QCE',
      Namespace: 'cat',
      Enable: 1,
      Remark: taskId ? `taskId=${taskId}` : 'cloud-infra cat',
      Condition: {
        IsUnionRule: 1,
        Rules: [{
          MetricName: metricName,
          Period: 60,
          Operator: String(payload.operator || 'lt'),
          Value: threshold,
          ContinuePeriod: 1,
          NoticeFrequency: 3600,
        }],
      },
    }, creds(ctx), opts(ctx))
    return { ok: true as const }
  } catch (err) {
    if (isNotOpened(err)) return { ok: false, error: '当前账号尚未开通云拨测告警，请到可观测平台开通。对话不会改插件设置。' }
    throw err
  }
}

async function taskIdsAction(
  call: typeof catCall,
  action: string,
  payload: Record<string, unknown>,
  ctx: ModuleContext,
  area: ErrorArea,
) {
  const ids = collectTaskIds(payload, ctx)
  if (!ids.length) return { ok: false, error: '缺少任务' }
  const results = await wrap(area, () => call<{ Results?: Array<{ TaskId?: string; Success?: boolean; ErrorMessage?: string }> }>(
    action,
    { TaskIds: ids },
    creds(ctx),
    opts(ctx),
  ))
  const failed = (results.Results || []).filter((row) => row.Success === false)
  if (failed.length) {
    const reason = failed.map((row) => row.ErrorMessage || '状态不允许').join('；')
    return { ok: false, error: reason || '当前状态不允许该操作' }
  }
  return { ok: true as const }
}

async function loadAnalysis(call: typeof catCall, ctx: ModuleContext, task: ProbeTaskItem): Promise<DetailSection> {
  const type = task.TaskType || 1
  const analyze = ANALYZE_TYPE[type]
  if (!analyze) {
    return { title: '多维分析', hint: '域名 whois 不提供多维分析指标。' }
  }
  const host = task.TargetAddress || ''
  const metrics: Array<{ label: string; value: string }> = []
  for (const item of METRIC_FIELDS[type] || []) {
    try {
      const data = await call<{ MetricSet?: string }>('DescribeProbeMetricData', {
        AnalyzeTaskType: analyze,
        MetricType: 'gauge',
        Field: item.field,
        GroupBy: 'time(60m)',
        Filters: [
          host ? `"host" = '${escapeQuote(host)}'` : `taskId = '${task.TaskId || ''}'`,
          'time >= now()-24h',
        ],
      }, creds(ctx), opts(ctx))
      metrics.push({ label: item.label, value: formatMetricSet(data.MetricSet) })
    } catch (err) {
      if (isDenied(err)) {
        return { title: '多维分析', hint: '当前密钥缺少云拨测分析权限（DescribeProbeMetricData）。' }
      }
      metrics.push({ label: item.label, value: '无数据' })
    }
  }
  const dims: Array<{ label: string; value: string }> = []
  for (const key of ['area', 'operator'] as const) {
    try {
      const data = await call<{ TagValueSet?: string }>('DescribeProbeMetricTagValues', {
        AnalyzeTaskType: analyze,
        Key: key,
        Filters: [host ? `"host" = '${escapeQuote(host)}'` : `taskId = '${task.TaskId || ''}'`, 'time >= now()-24h'],
      }, creds(ctx), opts(ctx))
      dims.push({ label: key === 'area' ? '地区' : '运营商', value: formatTagValues(data.TagValueSet) })
    } catch {
      dims.push({ label: key === 'area' ? '地区' : '运营商', value: '无数据' })
    }
  }
  const logs = await loadSingleLogs(call, ctx, type, task.TaskId ? [task.TaskId] : []).catch(() => [])
  const hasValue = metrics.some((row) => row.value && row.value !== '无数据')
  return {
    title: '多维分析',
    fields: [...metrics, ...dims, { label: '多任务对比', value: hasValue ? `${task.Name || task.TaskId} ${metrics.map((m) => `${m.label} ${m.value}`).join(' / ')}` : '仅当前任务，暂无对比样本' }],
    rows: logs,
    hint: hasValue ? undefined : '任务尚未产生分析数据。请确认任务已运行，且时间范围内有拨测样本。',
  }
}

async function loadSingleLogs(call: typeof catCall, ctx: ModuleContext, taskType: number, taskIds: string[]) {
  const analyze = ANALYZE_TYPE[taskType]
  if (!analyze) return []
  const end = Date.now()
  const begin = end - 24 * 3600 * 1000
  const data = await wrap('analysis', () => call<{ DataSet?: Array<{ ProbeTime?: number; Labels?: Array<{ Name?: string; Value?: string }>; Fields?: Array<{ Name?: string; Value?: number }> }> }>('DescribeDetailedSingleProbeData', {
    BeginTime: begin,
    EndTime: end,
    TaskType: analyze,
    SortField: 'ProbeTime',
    Ascending: false,
    SelectedFields: ['ProbeTime', 'TransferTime', 'ErrorInfo', 'District', 'Operator'],
    Offset: 0,
    Limit: 10,
    TaskID: taskIds.length ? taskIds : undefined,
  }, creds(ctx), opts(ctx)))
  return (data.DataSet || []).map((row, index) => {
    const labels = Object.fromEntries((row.Labels || []).map((item) => [item.Name || '', item.Value || '']))
    const fields = Object.fromEntries((row.Fields || []).map((item) => [item.Name || '', item.Value]))
    return {
      id: String(row.ProbeTime || index),
      cells: [
        { label: '时间', value: formatProbeTime(row.ProbeTime) },
        { label: '地区', value: labels.District || labels.area || '-' },
        { label: '运营商', value: labels.Operator || labels.operator || '-' },
        { label: '时延', value: fields.TransferTime != null ? String(fields.TransferTime) : '-' },
        { label: '错误', value: labels.ErrorInfo || labels.errorInfo || '-' },
      ],
    }
  })
}

async function loadTaskAlarms(monitor: typeof monitorCall, ctx: ModuleContext, taskId: string): Promise<DetailSection> {
  try {
    const data = await monitor<{ Policies?: AlarmPolicyItem[] }>('DescribeAlarmPolicies', {
      Module: 'monitor',
      PageNumber: 1,
      PageSize: 50,
      MonitorTypes: ['MT_QCE'],
      Namespaces: ['cat'],
    }, creds(ctx), opts(ctx))
    const rows = (data.Policies || []).filter((item) => isCatAlarm(item) && (!taskId || (item.Remark || '').includes(taskId) || true)).slice(0, 8)
    return {
      title: '告警配置',
      rows: rows.map((item) => {
        const rule = item.Condition?.Rules?.[0]
        return {
          id: item.PolicyId,
          cells: [
            { label: '策略', value: item.PolicyName || item.PolicyId || '-' },
            { label: '指标', value: alarmMetricLabel(rule?.MetricName) },
            { label: '阈值', value: rule ? `${operatorLabel(rule.Operator)} ${rule.Value || ''}` : '-' },
          ],
        }
      }),
      hint: rows.length ? undefined : '尚未为该任务配置告警策略。',
    }
  } catch (err) {
    if (isNotOpened(err)) return { title: '告警配置', hint: '当前账号尚未开通云拨测告警，请到可观测平台开通。对话不会改插件设置。' }
    if (isDenied(err)) return { title: '告警配置', hint: '当前密钥缺少可观测平台告警权限。' }
    return { title: '告警配置', hint: '告警策略暂时无法加载。' }
  }
}

async function loadAlarmHistory(monitor: typeof monitorCall, ctx: ModuleContext, policyId: string) {
  try {
    const data = await monitor<{ Histories?: Array<{ AlarmId?: string; AlarmStatus?: string; FirstOccurTime?: string; Content?: string; PolicyName?: string }> }>('DescribeAlarmHistories', {
      Module: 'monitor',
      PageNumber: 1,
      PageSize: 20,
      MonitorTypes: ['MT_QCE'],
      PolicyIds: [policyId],
    }, creds(ctx), opts(ctx))
    return (data.Histories || []).map((row) => ({
      id: row.AlarmId,
      cells: [
        { label: '时间', value: row.FirstOccurTime || '-' },
        { label: '状态', value: row.AlarmStatus || '-' },
        { label: '内容', value: row.Content || row.PolicyName || '-' },
      ],
    }))
  } catch (err) {
    if (isNotOpened(err)) throw new Error('当前账号尚未开通云拨测告警，请到可观测平台开通。')
    return []
  }
}

async function loadNodeMap(call: typeof catCall, ctx: ModuleContext): Promise<Record<string, string>> {
  const data = await call<{ NodeSet?: NodeDefineItem[] }>('DescribeNodes', {}, creds(ctx), opts(ctx))
  const out: Record<string, string> = {}
  for (const node of data.NodeSet || []) {
    if (node.Code) out[node.Code] = formatNodeName(node)
  }
  return out
}

async function resolveNodes(
  call: typeof catCall,
  payload: Record<string, unknown>,
  ctx: ModuleContext,
  fallback: string[] = [],
): Promise<string[]> {
  const typed = splitCodes(payload.nodes)
  if (typed.length) return typed
  if (String(payload.nodeSelect || '') !== 'recommend' && fallback.length) return fallback
  try {
    const nodeType = Number(payload.nodeType || 1)
    const data = await call<{ NodeSet?: NodeDefineItem[] }>('DescribeNodes', {
      NodeType: nodeType || undefined,
    }, creds(ctx), opts(ctx))
    const codes = (data.NodeSet || []).map((node) => node.Code).filter((code): code is string => !!code).slice(0, 3)
    return codes.length ? codes : fallback
  } catch {
    return fallback
  }
}

function firstTaskId(payload: Record<string, unknown>, ctx: ModuleContext): string {
  const fromPayload = String(payload.taskId || payload.TaskId || '').trim()
  if (fromPayload) return fromPayload
  const ids = collectTaskIds(payload, ctx)
  return ids[0] || ''
}

function collectTaskIds(payload: Record<string, unknown>, ctx: ModuleContext): string[] {
  const raw = payload.taskIds ?? payload.TaskIds ?? payload.nodes
  const listed = Array.isArray(raw)
    ? raw.map((item) => String(item || '').trim())
    : splitCodes(raw)
  const fromCtx = parseCatRef(String(ctx.id || '')).ref
  const fromPayload = String(payload.taskId || payload.domainId || '').trim()
  const all = [...listed, fromPayload, fromCtx].map((id) => id.replace(/^tencent\.cat:(task:)?/, '')).filter(Boolean)
  return [...new Set(all)]
}

function creds(ctx: ModuleContext): { secretId: string; secretKey: string } {
  return { secretId: ctx.creds.secretId, secretKey: ctx.creds.secretKey }
}

function opts(ctx: ModuleContext): { timeoutMs: number; signal?: AbortSignal } {
  return { timeoutMs: ctx.timeoutMs, signal: ctx.signal }
}

type ErrorArea = 'read' | 'write' | 'analysis' | 'alarm'

function areaOf(actionId: string): ErrorArea {
  if (actionId.startsWith('alarm.')) return 'alarm'
  if (actionId.includes('metric') || actionId.includes('analysis')) return 'analysis'
  if (actionId.startsWith('task.') || actionId.startsWith('instant.')) return 'write'
  return 'read'
}

async function wrap<T>(area: ErrorArea, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    throw new Error(catPublicError(err, area))
  }
}

export function catPublicError(err: unknown, area: ErrorArea): string {
  if (isDenied(err)) {
    if (area === 'write') return '当前密钥缺少云拨测写权限。'
    if (area === 'analysis') return '当前密钥缺少云拨测分析权限。'
    if (area === 'alarm') return '当前密钥缺少可观测平台告警权限。'
    return '当前密钥缺少云拨测读权限。'
  }
  if (isNotOpened(err)) return '当前账号尚未开通云拨测告警，请到可观测平台开通。对话不会改插件设置。'
  const local = err instanceof Error ? err.message : String(err || '')
  if (/缺少|没有|尚未|不支持|未知|状态不允许/.test(local) && local.length <= 120) return local
  return publicErrorMessage(err)
}

function isDenied(err: unknown): boolean {
  const code = err instanceof TencentApiError ? err.code || '' : ''
  return /UnauthorizedOperation|AuthFailure|CamNo/.test(code)
}

function isNotOpened(err: unknown): boolean {
  const code = err instanceof TencentApiError ? err.code || '' : ''
  const msg = err instanceof Error ? err.message : String(err || '')
  return /未开通|not.?activ|UnsupportedOperation|ResourceUnavailable|FailedOperation.Product/.test(`${code} ${msg}`)
}

function parseJson(raw?: string): Record<string, unknown> {
  if (!raw) return {}
  try {
    const value = JSON.parse(raw) as unknown
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

function paramKeysFor(taskType: number): string[] {
  return paramConsoleLabels(taskType).map((item) => item.key)
}

function paramConsoleLabels(taskType: number): Array<{ key: string; label: string }> {
  const common = [
    { key: 'ipType', label: 'IP类型' },
    { key: 'grabBag', label: '抓包' },
  ]
  if (taskType === 1) {
    return [...common, { key: 'navCustomHost', label: '自定义 Host' }, { key: 'navCustomHostIp', label: '自定义 Host 内容' }, { key: 'whiteList', label: '劫持白名单' }, { key: 'blackList', label: '劫持黑名单' }]
  }
  if (taskType === 2) {
    return [...common, { key: 'uploadType', label: '上传方法' }, { key: 'uploadCustomHost', label: '自定义 Host' }, { key: 'uploadTransmissionSize', label: '传输大小(KB)' }, { key: 'uploadSpecificFileUrl', label: '指定文件地址' }, { key: 'monitorTimeout', label: '检测超时' }]
  }
  if (taskType === 3) {
    return [...common, { key: 'downloadTransmissionSize', label: '传输大小(KB)' }, { key: 'downloadCustomHost', label: '自定义 Host' }, { key: 'downloadCustomHostIp', label: '自定义 Host 内容' }, { key: 'monitorTimeout', label: '检测超时' }]
  }
  if (taskType === 4) {
    return [...common, { key: 'protocolType', label: '协议类型' }, { key: 'protocolRequestType', label: '请求类型' }, { key: 'protocolRequestContent', label: '请求内容' }, { key: 'protocolCustomHost', label: '自定义 Host' }, { key: 'protocolVerifyText', label: '校验内容' }]
  }
  if (taskType === 5) {
    return [...common, { key: 'netIcmpOn', label: '启用 Ping' }, { key: 'netIcmpActivex', label: 'Ping 协议' }, { key: 'netIcmpTimeout', label: 'Ping 超时' }, { key: 'netIcmpNum', label: '包数量' }, { key: 'netDnsOn', label: '启用 DNS' }, { key: 'netTracertOn', label: '启用 Tracert' }]
  }
  if (taskType === 6) {
    return [...common, { key: 'streamType', label: '资源类型' }, { key: 'streamAddressType', label: '地址类型' }, { key: 'streamMonitorTimeout', label: '播放超时' }, { key: 'streamCustomHost', label: '自定义 Host' }]
  }
  return common
}

function coerceParam(key: string, value: unknown): unknown {
  if (typeof value === 'number') return value
  const text = String(value)
  if (/^(ipType|grabBag|navCustomHost|uploadCustomHost|uploadTransmissionSize|monitorTimeout|downloadTransmissionSize|downloadCustomHost|protocolType|protocolCharacterEncoding|protocolCustomHost|protocolVerifyWay|netIcmpOn|netIcmpActivex|netIcmpTimeout|netIcmpNum|netIcmpSize|netIcmpDataCut|netDnsOn|netDnsTimeout|netDnsQuerymethod|netDigOn|netDnsServer|netTracertOn|netTracertTimeout|netTracertNum|streamType|streamMonitorTimeout|streamAddressType|streamCustomHost)$/.test(key)) {
    const num = Number(text)
    return Number.isFinite(num) ? num : text
  }
  if (key === 'netIcmpInterval') {
    const num = Number(text)
    return Number.isFinite(num) ? num : 0.5
  }
  return text
}

function formatParamValue(key: string, value: unknown): string {
  if (value == null || value === '') return ''
  if (key === 'grabBag') return Number(value) === 1 ? '开启' : '关闭'
  if (key === 'navCustomHost' || key === 'uploadCustomHost' || key === 'downloadCustomHost' || key === 'protocolCustomHost' || key === 'streamCustomHost') {
    return Number(value) === 1 ? '轮询' : '随机'
  }
  if (key === 'ipType') return Number(value) === 1 ? 'IPv4' : Number(value) === 2 ? 'IPv6' : '自动'
  if (key === 'netIcmpOn' || key === 'netDnsOn' || key === 'netTracertOn') return Number(value) === 1 ? '启用' : '不启用'
  if (key === 'netIcmpActivex') return Number(value) === 1 ? 'tcp' : Number(value) === 2 ? 'udp' : 'icmp'
  if (key === 'protocolType') return ['TCP', 'SSL', 'UDP', 'HTTP'][Number(value)] || String(value)
  if (key === 'streamType') return Number(value) === 1 ? '视频' : '音频'
  if (key === 'streamAddressType') return Number(value) === 1 ? '资源地址' : '页面地址'
  return String(value)
}

function formatNodeName(node: NodeDefineItem): string {
  const type = NODE_TYPE_LABELS[node.Type || 0] || ''
  const place = [node.City || node.District, node.NetService, type].filter(Boolean).join(' ')
  return place || node.Name || node.Code || ''
}

function inferNodeType(text: string): string {
  if (/IDC/i.test(text)) return 'IDC'
  if (/LastMile|Last Mile|家庭/i.test(text)) return 'LastMile'
  if (/移动|Mobile/i.test(text)) return '移动端'
  return '-'
}

function formatProbeTime(value?: number): string {
  if (!value) return '-'
  const ms = value > 1e12 ? value : value * 1000
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toISOString().replace('T', ' ').slice(0, 19)
}

function instantStatus(status?: string): ResourceStatus {
  const value = String(status || '')
  if (value === '1' || /success|ok|成功/i.test(value)) return 'enable'
  if (/fail|error|失败/i.test(value)) return 'error'
  if (/wait|pending|进行/i.test(value)) return 'unknown'
  return 'unknown'
}

function instantStatusLabel(status?: string): string {
  const value = String(status || '')
  if (value === '1') return '成功'
  if (value === '0') return '进行中'
  return value || '等待诊断'
}

function alarmMetricLabel(name?: string): string {
  if (!name) return '-'
  if (/avail|succ/i.test(name)) return '可用性'
  if (/time|latency|delay/i.test(name)) return '整体时延'
  if (/error/i.test(name)) return '错误数'
  return name
}

function operatorLabel(op?: string): string {
  if (op === 'lt') return '<'
  if (op === 'le') return '<='
  if (op === 'gt') return '>'
  if (op === 'ge') return '>='
  if (op === 'eq') return '='
  return op || ''
}

function extractTaskId(remark?: string): string {
  const match = String(remark || '').match(/task-[A-Za-z0-9]+/)
  return match?.[0] || ''
}

function isCatAlarm(item: AlarmPolicyItem): boolean {
  const ns = String(item.Namespace || '').toLowerCase()
  return !ns || /cat/.test(ns)
}

function stripAlarmQuery(query: string): string {
  return String(query || '').replace(/^(告警配置|告警|alarm)\s*/i, '').trim()
}

function splitCodes(value: unknown): string[] {
  return String(value || '').split(/[,，\s]+/).map((item) => item.trim()).filter(Boolean)
}

function parseTags(raw: unknown): Array<{ TagKey: string; TagValue: string }> | undefined {
  const text = String(raw || '').trim()
  if (!text) return undefined
  const tags = text.split(/[,，]/).map((part) => {
    const [key, ...rest] = part.split('=')
    return { TagKey: key.trim(), TagValue: rest.join('=').trim() }
  }).filter((item) => item.TagKey)
  return tags.length ? tags : undefined
}

function formatMetricSet(raw?: string): string {
  if (!raw) return '无数据'
  try {
    const rows = JSON.parse(raw) as Array<{ values?: Array<Array<number | string>> }>
    const values = rows?.[0]?.values || []
    const last = values[values.length - 1]
    if (!last || last.length < 2 || last[1] == null) return '无数据'
    const num = Number(last[1])
    if (!Number.isFinite(num)) return String(last[1])
    return Number.isInteger(num) ? String(num) : num.toFixed(2)
  } catch {
    return '无数据'
  }
}

function formatTagValues(raw?: string): string {
  if (!raw) return '无数据'
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean).slice(0, 8).join(' / ') || '无数据'
    if (typeof parsed === 'string') return parsed || '无数据'
    return String(raw)
  } catch {
    return raw
  }
}

function escapeQuote(value: string): string {
  return value.replace(/'/g, "\\'")
}

export const tencentCatModule = createCatModule()
registerModule(tencentCatModule)
