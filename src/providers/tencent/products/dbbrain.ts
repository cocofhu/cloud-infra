import { publicErrorMessage } from '../../../core/safe-error.js'
import { registerModule } from '../../../core/registry.js'
import type {
  DetailTab,
  DetailTable,
  ModuleContext,
  ResourceAction,
  ResourceCard,
  ResourceDetail,
  ResourceModule,
  ResourceStatus,
} from '../../../core/types.js'
import { dbbrainCall } from '../client.js'

export const LIST_REGION = 'ap-guangzhou'
export const MISSING_REGION = '缺少实例地域，无法发起诊断。不会默认使用广州。'
export const MODULE_ID = 'tencent.dbbrain'

export const DBBRAIN_PRODUCTS: DetailTab[] = [
  { id: 'mysql', label: 'MySQL' },
  { id: 'cynosdb', label: 'TDSQL-C' },
  { id: 'mariadb', label: 'MariaDB' },
  { id: 'dcdb', label: 'TDSQL MySQL' },
  { id: 'redis', label: 'Redis' },
  { id: 'mongodb', label: 'MongoDB' },
  { id: 'postgres', label: 'PostgreSQL' },
  { id: 'dbbrain-mysql', label: '自建 MySQL' },
]

export const DBBRAIN_REGIONS: DetailTab[] = [
  { id: '', label: '全地域' },
  { id: 'ap-guangzhou', label: '广州' },
  { id: 'ap-shanghai', label: '上海' },
  { id: 'ap-beijing', label: '北京' },
  { id: 'ap-chengdu', label: '成都' },
  { id: 'ap-chongqing', label: '重庆' },
  { id: 'ap-nanjing', label: '南京' },
  { id: 'ap-hongkong', label: '香港' },
  { id: 'ap-singapore', label: '新加坡' },
  { id: 'ap-tokyo', label: '东京' },
  { id: 'na-siliconvalley', label: '硅谷' },
  { id: 'na-ashburn', label: '弗吉尼亚' },
  { id: 'eu-frankfurt', label: '法兰克福' },
]

export const SLOW_RANGES: DetailTab[] = [
  { id: 'today', label: '今天' },
  { id: '5m', label: '近五分' },
  { id: '10m', label: '近十分' },
  { id: '1h', label: '近一小时' },
  { id: '3h', label: '近三小时' },
  { id: '24h', label: '近二十四小时' },
  { id: '3d', label: '近三天' },
  { id: 'custom', label: '自定义' },
]

const SPACE_SUBTABS: DetailTab[] = [
  { id: 'disk', label: '磁盘概览' },
  { id: 'topTable', label: 'TOP表' },
  { id: 'topSchema', label: 'TOP库' },
  { id: 'nopk', label: '无主键表' },
  { id: 'search', label: '表检索' },
]

const SESSION_SUBTABS: DetailTab[] = [
  { id: 'list', label: '会话列表' },
  { id: 'user', label: '用户统计' },
  { id: 'host', label: '来源统计' },
]

const DIAG_SUBTABS: DetailTab[] = [
  { id: 'live', label: '实时' },
  { id: 'history', label: '历史' },
]

const MYSQL_LIKE = new Set(['mysql', 'cynosdb', 'mariadb', 'dcdb', 'dbbrain-mysql'])

const ACTIONS: ResourceAction[] = [
  { id: 'session.kill', label: 'Kill 会话', confirm: 'always' },
  { id: 'report.delete', label: '删除报告', confirm: 'always' },
  { id: 'report.create', label: '生成健康报告', confirm: 'default' },
  { id: 'event.ignore', label: '忽略', confirm: 'default' },
  { id: 'sql.advise', label: 'SQL优化', confirm: 'default' },
]

export interface InstanceInfo {
  InstanceId?: string
  InstanceName?: string
  Region?: string
  Product?: string
  HealthScore?: number
  EventCount?: number
  Status?: number
  EngineVersion?: string
  Cpu?: number
  Memory?: number
  Volume?: number
  InstanceConf?: { DailyInspection?: string; OverviewDisplay?: string }
  IsSupported?: boolean
  ClusterId?: string
  ClusterName?: string
  Vip?: string
  Source?: string
}

export type DbbrainCaller = typeof dbbrainCall

export function encodeInstanceRef(product: string, region: string, instanceId: string, moduleId = MODULE_ID): string {
  return `${moduleId}:${product || 'mysql'}:${region || ''}:${instanceId}`
}

export function parseInstanceRef(id: string): { moduleId: string; product: string; region: string; instanceId: string } {
  const raw = String(id || '')
  const cut = raw.indexOf(':')
  const moduleId = cut >= 0 ? raw.slice(0, cut) : MODULE_ID
  const rest = cut >= 0 ? raw.slice(cut + 1) : raw
  const parts = rest.split(':')
  if (parts.length >= 3) {
    return {
      moduleId: moduleId || MODULE_ID,
      product: parts[0] || '',
      region: parts[1] || '',
      instanceId: parts.slice(2).join(':'),
    }
  }
  if (parts.length === 2) {
    return { moduleId: moduleId || MODULE_ID, product: '', region: parts[0] || '', instanceId: parts[1] || '' }
  }
  return { moduleId: moduleId || MODULE_ID, product: '', region: '', instanceId: rest }
}

export function regionLabel(region?: string): string {
  const id = String(region || '').trim()
  if (!id) return ''
  return DBBRAIN_REGIONS.find((item) => item.id === id)?.label || id
}

export function productLabel(product?: string): string {
  const id = String(product || '').trim().toLowerCase()
  if (!id) return ''
  return DBBRAIN_PRODUCTS.find((item) => item.id === id)?.label || product || ''
}

export function normalizeProduct(raw?: string, fallback = 'mysql'): string {
  const value = String(raw || '').trim()
  if (!value) return fallback
  const lower = value.toLowerCase()
  if (lower === 'postgresql') return 'postgres'
  const known = DBBRAIN_PRODUCTS.find((item) => item.id === lower || item.label.toLowerCase() === lower)
  if (known) return known.id
  if (lower === 'tdsql-c' || lower === 'cynosdb for mysql') return 'cynosdb'
  if (lower.includes('mysql') && lower.includes('tdsql')) return 'dcdb'
  if (lower === 'self' || lower === 'user mysql') return 'dbbrain-mysql'
  return lower
}

export function mapInstanceStatus(item: InstanceInfo): { status: ResourceStatus; label: string } {
  const inspection = String(item.InstanceConf?.DailyInspection || '')
  if (/^yes$/i.test(inspection)) return { status: 'enable', label: '巡检开' }
  if (/^no$/i.test(inspection)) return { status: 'pause', label: '巡检关' }
  if (item.Status === 1) return { status: 'enable', label: '运行中' }
  if (item.Status === 0) return { status: 'pause', label: '已停止' }
  return { status: 'unknown', label: item.Status != null ? String(item.Status) : '-' }
}

export function mapInstanceItem(item: InstanceInfo, product: string, moduleId = MODULE_ID): ResourceCard {
  const instanceId = String(item.InstanceId || item.ClusterId || '')
  const region = String(item.Region || '').trim()
  const prod = normalizeProduct(item.Product, product)
  const mapped = mapInstanceStatus(item)
  const score = item.HealthScore != null ? String(item.HealthScore) : '-'
  const alarms = item.EventCount != null ? String(item.EventCount) : '0'
  return {
    id: encodeInstanceRef(prod, region, instanceId, moduleId),
    moduleId,
    provider: 'tencent',
    kind: 'dbbrain',
    title: item.InstanceName || instanceId || '-',
    description: [mapped.label, regionLabel(region) || region, item.EngineVersion].filter(Boolean).join(' · '),
    status: mapped.status,
    region,
    product: prod,
    openLabel: '诊断优化',
    columns: [
      { label: '状态', value: mapped.label },
      { label: '健康分', value: score },
      { label: '异常告警', value: alarms },
      { label: '地域', value: regionLabel(region) || region || '-' },
    ],
  }
}

export function tabsForProduct(product: string): DetailTab[] {
  const id = normalizeProduct(product)
  if (id === 'redis') {
    return [
      { id: 'memory', label: '内存分析' },
      { id: 'access', label: '访问分析' },
      { id: 'slow', label: '慢日志分析' },
    ]
  }
  if (id === 'mongodb') {
    return [
      { id: 'index', label: '索引推荐' },
      { id: 'session', label: '会话' },
    ]
  }
  if (id === 'postgres') {
    return [
      { id: 'diag', label: '异常诊断' },
      { id: 'slow', label: '慢SQL分析' },
      { id: 'report', label: '健康报告' },
    ]
  }
  return [
    { id: 'diag', label: '异常诊断' },
    { id: 'trend', label: '性能趋势' },
    { id: 'session', label: '实时会话' },
    { id: 'slow', label: '慢SQL分析' },
    { id: 'space', label: '空间分析' },
    { id: 'sqlopt', label: 'SQL优化' },
    { id: 'autonomy', label: '自治中心' },
    { id: 'deadlock', label: '死锁可视化' },
    { id: 'notify', label: '事件通知' },
    { id: 'report', label: '健康报告' },
  ]
}

export function resolveTab(product: string, wanted?: string): string {
  const tabs = tabsForProduct(product)
  if (wanted && tabs.some((tab) => tab.id === wanted)) return wanted
  return tabs[0]?.id || 'diag'
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatTs(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

export function timeRange(key: string, custom?: { start?: string; end?: string }): { start: string; end: string } {
  if (key === 'custom' && custom?.start && custom?.end) {
    return { start: custom.start, end: custom.end }
  }
  const end = new Date()
  const start = new Date(end.getTime())
  if (key === '5m') start.setMinutes(start.getMinutes() - 5)
  else if (key === '10m') start.setMinutes(start.getMinutes() - 10)
  else if (key === '1h') start.setHours(start.getHours() - 1)
  else if (key === '3h') start.setHours(start.getHours() - 3)
  else if (key === '24h') start.setHours(start.getHours() - 24)
  else if (key === '3d') start.setDate(start.getDate() - 3)
  else if (key === 'today') start.setHours(0, 0, 0, 0)
  else start.setHours(start.getHours() - 1)
  return { start: formatTs(start), end: formatTs(end) }
}

export function requireRegion(ctx: ModuleContext, payload?: Record<string, unknown>): string {
  const parsed = parseInstanceRef(String(ctx.id || ''))
  const region = parsed.region || String(ctx.filters?.region || payload?.region || '').trim()
  if (!region) throw new Error(MISSING_REGION)
  return region
}

function creds(ctx: ModuleContext): { secretId: string; secretKey: string } {
  return { secretId: ctx.creds.secretId, secretKey: ctx.creds.secretKey }
}

function callOpts(ctx: ModuleContext, region: string): { timeoutMs: number; signal?: AbortSignal; region: string } {
  return { timeoutMs: ctx.timeoutMs, signal: ctx.signal, region }
}

function keywordPayload(query: string): Record<string, unknown> {
  const q = String(query || '').trim()
  if (!q) return {}
  if (/^[a-z][a-z0-9]*-[a-z0-9]+/i.test(q)) return { InstanceIds: [q] }
  return { InstanceNames: [q] }
}

function cell(value: unknown): string {
  if (value == null || value === '') return ''
  if (Array.isArray(value)) return value.map((item) => cell(item)).filter(Boolean).join(' / ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function severityLabel(raw: unknown): string {
  const text = String(raw ?? '').trim()
  const n = Number(raw)
  if (n === 1 || /fatal|emergency|紧急/i.test(text)) return '紧急'
  if (n === 2 || /critical|严重/i.test(text)) return '严重'
  if (n === 3 || /warn|alarm|告警/i.test(text)) return '告警'
  if (n === 4 || /notice|提醒/i.test(text)) return '提醒'
  if (n === 5 || /healthy|info|健康|normal/i.test(text)) return '健康'
  return text || '-'
}

function table(id: string, title: string, columns: string[], rows: Array<Record<string, string>>, empty?: string): DetailTable {
  return { id, title, columns, rows, empty: empty || '暂无数据' }
}

function pickRows(list: unknown, map: (item: Record<string, unknown>) => Record<string, string>): Array<Record<string, string>> {
  if (!Array.isArray(list)) return []
  return list.filter((item) => item && typeof item === 'object').map((item) => map(item as Record<string, unknown>))
}

async function safeCall<T>(
  call: DbbrainCaller,
  action: string,
  payload: unknown,
  ctx: ModuleContext,
  region: string,
): Promise<T | { error: string }> {
  try {
    return await call<T>(action, payload, creds(ctx), callOpts(ctx, region))
  } catch (err) {
    return { error: publicErrorMessage(err) }
  }
}

function isErr<T>(value: T | { error: string }): value is { error: string } {
  return !!value && typeof value === 'object' && 'error' in value && typeof (value as { error: unknown }).error === 'string'
    && !('RequestId' in (value as object))
}

export function createDbbrainModule(call: DbbrainCaller = dbbrainCall): ResourceModule {
  const module: ResourceModule = {
    id: MODULE_ID,
    provider: 'tencent',
    kind: 'dbbrain',
    title: '腾讯云 DBbrain',
    implemented: true,
    actions: ACTIONS,
    async list(ctx) {
      const product = normalizeProduct(ctx.filters?.product, 'mysql')
      const filterRegion = String(ctx.filters?.region || '').trim()
      const payload: Record<string, unknown> = {
        IsSupported: true,
        Product: product,
        Offset: ctx.offset,
        Limit: Math.min(ctx.limit, 100),
        ...keywordPayload(ctx.query),
      }
      if (filterRegion) payload.Regions = [filterRegion]
      const data = await call<{ TotalCount?: number; Items?: InstanceInfo[] }>(
        'DescribeDiagDBInstances',
        payload,
        creds(ctx),
        callOpts(ctx, LIST_REGION),
      )
      const raw = data.Items || []
      const items = raw.map((item) => mapInstanceItem(item, product, module.id))
      const total = Number.isFinite(Number(data.TotalCount)) ? Number(data.TotalCount) : items.length
      return {
        items,
        total,
        offset: ctx.offset,
        hasMore: ctx.offset + items.length < total,
      }
    },
    async detail(ctx) {
      const parsed = parseInstanceRef(String(ctx.id || ''))
      const product = normalizeProduct(parsed.product || ctx.filters?.product, 'mysql')
      const instanceId = parsed.instanceId || String(ctx.title || '').trim()
      const region = requireRegion(ctx)
      if (!instanceId) throw new Error('缺少实例')
      const tab = resolveTab(product, ctx.filters?.tab)
      const rangeKey = ctx.filters?.range || (tab === 'diag' ? '1h' : '1h')
      const window = timeRange(rangeKey, { start: ctx.filters?.startTime, end: ctx.filters?.endTime })
      const card = mapInstanceItem({
        InstanceId: instanceId,
        InstanceName: ctx.title,
        Region: region,
        Product: product,
      }, product, module.id)
      const fields = [
        { label: '实例', value: instanceId },
        { label: '地域', value: region },
        { label: '类型', value: productLabel(product) || product },
      ]
      const loaded = await loadTab(call, ctx, { product, region, instanceId, tab, rangeKey, window })
      return {
        card: { ...card, title: ctx.title || card.title, region, product },
        fields: [...fields, ...(loaded.fields || [])].filter((row) => row.value),
        tabs: tabsForProduct(product),
        activeTab: tab,
        subTabs: loaded.subTabs,
        activeSubTab: loaded.activeSubTab,
        ranges: loaded.ranges,
        activeRange: loaded.activeRange,
        tables: loaded.tables,
        hints: loaded.hints,
        form: loaded.form,
      } satisfies ResourceDetail
    },
    async execute(actionId, payload, ctx) {
      try {
        const parsed = parseInstanceRef(String(ctx.id || payload.instanceId || ''))
        const product = normalizeProduct(String(payload.product || parsed.product || ''), 'mysql')
        const instanceId = String(payload.instanceId || parsed.instanceId || '').trim()
        const region = requireRegion(ctx, payload)
        if (!instanceId) return { ok: false, error: '缺少实例' }
        const base = { InstanceId: instanceId, Product: product }
        if (actionId === 'session.kill') {
          const sessionId = String(payload.sessionId || payload.SessionId || '').trim()
          if (!sessionId) return { ok: false, error: '缺少会话' }
          if (product === 'mongodb') {
            await call('KillMongoDBThreads', { ...base, SessionIds: [sessionId] }, creds(ctx), callOpts(ctx, region))
          } else {
            await call('KillMySqlThreads', { ...base, SessionIds: [sessionId] }, creds(ctx), callOpts(ctx, region))
          }
          return { ok: true }
        }
        if (actionId === 'report.create') {
          const window = timeRange(String(payload.range || '24h'), {
            start: String(payload.startTime || ''),
            end: String(payload.endTime || ''),
          })
          await call('CreateDBDiagReportTask', {
            ...base,
            StartTime: window.start,
            EndTime: window.end,
          }, creds(ctx), callOpts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'report.delete') {
          const taskId = Number(payload.taskId || payload.TaskId)
          if (!taskId) return { ok: false, error: '缺少任务' }
          await call('DeleteDBDiagReportTasks', { ...base, TaskIds: [taskId] }, creds(ctx), callOpts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'event.ignore') {
          const eventId = Number(payload.eventId || payload.EventId)
          if (!eventId) return { ok: false, error: '缺少事件' }
          await call('UpdateDiagEventStatus', {
            ...base,
            EventId: eventId,
            Status: String(payload.status || 'ignored'),
          }, creds(ctx), callOpts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'sql.advise') {
          const sql = String(payload.sql || '').trim()
          if (!sql) return { ok: false, error: '缺少 SQL' }
          await call('DescribeUserSqlAdvice', { ...base, Sql: sql }, creds(ctx), callOpts(ctx, region))
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

interface TabLoad {
  tables?: DetailTable[]
  hints?: string[]
  fields?: Array<{ label: string; value: string }>
  subTabs?: DetailTab[]
  activeSubTab?: string
  ranges?: DetailTab[]
  activeRange?: string
  form?: ResourceDetail['form']
}

async function loadTab(
  call: DbbrainCaller,
  ctx: ModuleContext,
  args: { product: string; region: string; instanceId: string; tab: string; rangeKey: string; window: { start: string; end: string } },
): Promise<TabLoad> {
  const { product, region, instanceId, tab, rangeKey, window } = args
  const base = { InstanceId: instanceId, Product: product }
  if (tab === 'diag') return loadDiag(call, ctx, region, base, ctx.filters?.subTab || 'live', window)
  if (tab === 'trend') return loadTrend(call, ctx, region, base, window)
  if (tab === 'session') return loadSession(call, ctx, region, product, base, ctx.filters?.subTab || 'list')
  if (tab === 'slow') return loadSlow(call, ctx, region, product, base, rangeKey, window)
  if (tab === 'space') return loadSpace(call, ctx, region, base, ctx.filters?.subTab || 'disk')
  if (tab === 'sqlopt') return loadSqlOpt(call, ctx, region, base, ctx.filters?.sql || '')
  if (tab === 'autonomy') return loadAutonomy(call, ctx, region, base, window)
  if (tab === 'deadlock') return loadDeadlock(call, ctx, region, base)
  if (tab === 'notify') {
    return {
      hints: ['事件通知若上游可返回则展示；账号级联系人与推送不在对话卡片内配置。'],
      tables: [table('notify', '事件通知', ['说明'], [], '该实例暂无事件通知，或需在腾讯云控制台查看。')],
    }
  }
  if (tab === 'report') return loadReport(call, ctx, region, base, window)
  if (tab === 'memory') return loadRedisMemory(call, ctx, region, base)
  if (tab === 'access') return loadRedisAccess(call, ctx, region, base, window)
  if (tab === 'index') return loadMongoIndex(call, ctx, region, base)
  return { hints: [`当前产品线不支持「${tab}」页签。`], tables: [] }
}

async function loadDiag(
  call: DbbrainCaller,
  ctx: ModuleContext,
  region: string,
  base: Record<string, unknown>,
  subTab: string,
  window: { start: string; end: string },
): Promise<TabLoad> {
  const live = subTab !== 'history'
  const action = live ? 'DescribeDBDiagEvents' : 'DescribeDBDiagHistory'
  const payload = live
    ? { ...base, StartTime: window.start, EndTime: window.end }
    : { InstanceId: base.InstanceId, Product: base.Product, StartTime: window.start, EndTime: window.end }
  const data = await safeCall<Record<string, unknown>>(call, action, payload, ctx, region)
  if (isErr(data)) {
    return {
      subTabs: DIAG_SUBTABS,
      activeSubTab: live ? 'live' : 'history',
      hints: [data.error],
      tables: [table('events', live ? '实时诊断' : '历史诊断', ['等级', '诊断项', '开始', '最后发生'], [], data.error)],
    }
  }
  const list = data.Events || data.Items || data.List || []
  const rows = pickRows(list, (item) => ({
    eventId: cell(item.EventId ?? item.DiagEventId ?? item.Id),
    等级: severityLabel(item.Severity ?? item.Level ?? item.Grade ?? item.EventLevel),
    诊断项: cell(item.DiagItem ?? item.DiagType ?? item.Outline ?? item.EventName),
    开始: cell(item.StartTime ?? item.FirstOccurTime),
    最后发生: cell(item.EndTime ?? item.LastOccurTime ?? item.OccurTime),
    指标: cell(item.Metric ?? item.MetricName),
  }))
  const eventId = String(ctx.filters?.eventId || '').trim()
  const extra: TabLoad = {
    subTabs: DIAG_SUBTABS,
    activeSubTab: live ? 'live' : 'history',
    tables: [table('events', live ? '实时诊断' : '历史诊断', ['等级', '诊断项', '开始', '最后发生', '指标'], rows)],
    hints: ['详情分现象 / 原因 / 建议三区。点诊断项可拉取事件详情。五级：紧急、严重、告警、提醒、健康。'],
  }
  if (!eventId) return extra
  const detail = await safeCall<Record<string, unknown>>(call, 'DescribeDBDiagEvent', {
    ...base,
    EventId: Number(eventId) || eventId,
  }, ctx, region)
  if (isErr(detail)) {
    extra.hints = [...(extra.hints || []), detail.error]
    return extra
  }
  extra.tables = [
    ...(extra.tables || []),
    table('phenomenon', '现象', ['内容'], [{ 内容: cell(detail.Outline ?? detail.Problem ?? detail.DiagItem ?? detail.Metric) }]),
    table('cause', '原因', ['内容'], [{ 内容: cell(detail.Reason ?? detail.Cause ?? detail.Explanation ?? detail.DiagType) }]),
    table('advice', '建议', ['内容'], [{ 内容: cell(detail.Suggestion ?? detail.Advice ?? detail.Solution ?? detail.Explanation) }]),
  ]
  extra.fields = [
    { label: '事件', value: eventId },
    { label: '等级', value: severityLabel(detail.Severity ?? detail.Level) },
    { label: '指标', value: cell(detail.Metric ?? detail.MetricValue) },
  ]
  return extra
}

async function loadTrend(
  call: DbbrainCaller,
  ctx: ModuleContext,
  region: string,
  base: Record<string, unknown>,
  window: { start: string; end: string },
): Promise<TabLoad> {
  const score = await safeCall<Record<string, unknown>>(call, 'DescribeHealthScore', {
    InstanceId: base.InstanceId,
    Time: window.end,
    Product: base.Product,
  }, ctx, region)
  if (isErr(score)) {
    return { hints: [score.error, '性能趋势用数值和表展示，不画控制台折线。'] }
  }
  const rows = [
    { 指标: '健康分', 数值: cell(score.HealthScore ?? score.Score ?? score.HealthStatus) },
    { 指标: '时间', 数值: cell(score.Time ?? window.end) },
  ]
  const issues = score.IssueTypes || score.Events || score.Items
  const extra = pickRows(issues, (item) => ({
    指标: cell(item.Metric ?? item.Name ?? item.IssueType),
    数值: cell(item.Score ?? item.Value ?? item.Count),
  }))
  return {
    hints: ['性能趋势用数值和表展示，不画控制台折线。'],
    tables: [table('trend', '健康与指标', ['指标', '数值'], extra.length ? extra : rows)],
    fields: [{ label: '健康分', value: cell(score.HealthScore ?? score.Score) }],
  }
}

async function loadSession(
  call: DbbrainCaller,
  ctx: ModuleContext,
  region: string,
  product: string,
  base: Record<string, unknown>,
  subTab: string,
): Promise<TabLoad> {
  const action = product === 'mongodb' ? 'DescribeMongoDBProcessList' : product === 'redis' ? 'DescribeRedisProcessList' : 'DescribeMySqlProcessList'
  const data = await safeCall<Record<string, unknown>>(call, action, { ...base, Limit: 50 }, ctx, region)
  if (isErr(data)) {
    return {
      subTabs: product === 'mongodb' ? undefined : SESSION_SUBTABS,
      activeSubTab: subTab,
      hints: [data.error],
      tables: [table('sessions', '实时会话', ['会话ID', '用户', '耗时'], [], data.error)],
    }
  }
  const list = data.ProcessList || data.Sessions || data.Items || []
  const rows = pickRows(list, (item) => ({
    sessionId: cell(item.Id ?? item.SessionId ?? item.ProcessId ?? item.Tid),
    会话ID: cell(item.Id ?? item.SessionId ?? item.ProcessId ?? item.Tid),
    用户: cell(item.User ?? item.UserName),
    来源: cell(item.Host ?? item.Address ?? item.Client),
    库: cell(item.DB ?? item.Namespace),
    状态: cell(item.State ?? item.Command),
    耗时: cell(item.Time ?? item.CostTime ?? item.Duration),
    SQL: cell(item.Info ?? item.Sql ?? item.Command),
  }))
  const stats = Array.isArray(data.Statistics) ? data.Statistics as Array<Record<string, unknown>> : []
  const userRows = pickRows(stats.filter((item) => /user/i.test(cell(item.Dimension ?? item.Name))), (item) => ({
    用户: cell(item.Value ?? item.Name),
    数量: cell(item.Count ?? item.Total),
  }))
  const hostRows = pickRows(stats.filter((item) => /host|ip|address/i.test(cell(item.Dimension ?? item.Name))), (item) => ({
    来源: cell(item.Value ?? item.Name),
    数量: cell(item.Count ?? item.Total),
  }))
  const tables: DetailTable[] = []
  if (subTab === 'user') tables.push(table('session-user', '用户统计', ['用户', '数量'], userRows.length ? userRows : summarize(rows, '用户')))
  else if (subTab === 'host') tables.push(table('session-host', '来源统计', ['来源', '数量'], hostRows.length ? hostRows : summarize(rows, '来源')))
  else tables.push(table('sessions', '会话列表', ['会话ID', '用户', '来源', '库', '状态', '耗时', 'SQL'], rows))
  return {
    subTabs: product === 'mongodb' ? undefined : SESSION_SUBTABS,
    activeSubTab: subTab,
    tables,
    hints: ['Kill 使用对话确认弹层，始终二次确认。'],
  }
}

function summarize(rows: Array<Record<string, string>>, key: string): Array<Record<string, string>> {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const name = row[key] || '-'
    counts.set(name, (counts.get(name) || 0) + 1)
  }
  return [...counts.entries()].map(([name, count]) => ({ [key]: name, 数量: String(count) }))
}

async function loadSlow(
  call: DbbrainCaller,
  ctx: ModuleContext,
  region: string,
  product: string,
  base: Record<string, unknown>,
  rangeKey: string,
  window: { start: string; end: string },
): Promise<TabLoad> {
  const subTab = ctx.filters?.subTab || 'top'
  const action = product === 'redis'
    ? 'DescribeRedisSlowLogTopSqls'
    : product === 'mongodb'
      ? 'DescribeMongoDBSlowLogTopSqlList'
      : 'DescribeSlowLogTopSqls'
  const data = await safeCall<Record<string, unknown>>(call, action, {
    ...base,
    StartTime: window.start,
    EndTime: window.end,
    Limit: 20,
    Offset: 0,
    SortBy: 'QueryTime',
    OrderBy: 'DESC',
  }, ctx, region)
  const stats = product === 'redis' || product === 'mongodb'
    ? null
    : await safeCall<Record<string, unknown>>(call, 'DescribeSlowLogTimeSeriesStats', {
      InstanceId: base.InstanceId,
      StartTime: window.start,
      EndTime: window.end,
      Product: base.Product,
    }, ctx, region)
  const hints = isErr(data) ? [data.error] : []
  if (stats && isErr(stats)) hints.push(stats.error)
  const list = isErr(data) ? [] : (data.Rows || data.Items || data.SlowLogs || data.TopSqls || [])
  const rows = pickRows(list, (item) => ({
    模板: cell(item.SqlTemplate ?? item.SqlText ?? item.FingerPrint ?? item.Cmd),
    次数: cell(item.ExecTimes ?? item.Count ?? item.Cnt),
    耗时: cell(item.QueryTime ?? item.QueryTimeMax ?? item.CostTime ?? item.QueryTimeAvg),
    扫描行: cell(item.RowsExamined ?? item.RowsExaminedAvg),
    库: cell(item.Schema ?? item.DB),
  }))
  const tables: DetailTable[] = []
  if (subTab === 'stats' && stats && !isErr(stats)) {
    const series = stats.TimeSeries || stats.SeriesData || stats.Items || []
    tables.push(table('slow-stats', '慢SQL统计', ['时间', '次数'], pickRows(series, (item) => ({
      时间: cell(item.Time ?? item.Timestamp ?? item.Count),
      次数: cell(item.Count ?? item.Value ?? item.Total),
    }))))
  } else {
    tables.push(table('slow', product === 'redis' ? '慢日志分析' : '慢SQL分析', ['模板', '次数', '耗时', '扫描行', '库'], rows))
  }
  return {
    ranges: SLOW_RANGES,
    activeRange: rangeKey,
    subTabs: product === 'mysql' || MYSQL_LIKE.has(product)
      ? [{ id: 'top', label: '明细' }, { id: 'stats', label: '统计' }, { id: 'analysis', label: '分析' }]
      : undefined,
    activeSubTab: subTab,
    tables,
    hints: hints.length ? hints : [`时间窗 ${window.start} ~ ${window.end}`],
  }
}

async function loadSpace(
  call: DbbrainCaller,
  ctx: ModuleContext,
  region: string,
  base: Record<string, unknown>,
  subTab: string,
): Promise<TabLoad> {
  const hints: string[] = []
  const tables: DetailTable[] = []
  if (subTab === 'topTable' || subTab === 'search') {
    const data = await safeCall<Record<string, unknown>>(call, 'DescribeTopSpaceTables', {
      ...base,
      Limit: 20,
      SortBy: 'DataLength',
    }, ctx, region)
    if (isErr(data)) hints.push(data.error)
    else {
      const needle = String(ctx.filters?.table || ctx.filters?.sql || '').trim().toLowerCase()
      let rows = pickRows(data.TopSpaceTables || data.Items || data.TableRows, (item) => ({
        表: cell(item.TableName ?? item.Table),
        库: cell(item.TableSchema ?? item.Schema),
        引擎: cell(item.Engine),
        数据: cell(item.DataLength ?? item.DataLen),
        索引: cell(item.IndexLength),
        碎片: cell(item.DataFree),
      }))
      if (subTab === 'search' && needle) rows = rows.filter((row) => `${row.表} ${row.库}`.toLowerCase().includes(needle))
      tables.push(table('top-table', subTab === 'search' ? '表检索' : 'TOP表', ['表', '库', '引擎', '数据', '索引', '碎片'], rows))
    }
  } else if (subTab === 'topSchema') {
    const data = await safeCall<Record<string, unknown>>(call, 'DescribeTopSpaceSchemas', { ...base, Limit: 20 }, ctx, region)
    if (isErr(data)) hints.push(data.error)
    else {
      tables.push(table('top-schema', 'TOP库', ['库', '数据', '索引', '碎片'], pickRows(data.TopSpaceSchemas || data.Items, (item) => ({
        库: cell(item.TableSchema ?? item.Schema),
        数据: cell(item.DataLength),
        索引: cell(item.IndexLength),
        碎片: cell(item.DataFree),
      }))))
    }
  } else if (subTab === 'nopk') {
    const data = await safeCall<Record<string, unknown>>(call, 'DescribeNoPrimaryKeyTables', { ...base, Limit: 50 }, ctx, region)
    if (isErr(data)) hints.push(data.error)
    else {
      tables.push(table('nopk', '无主键表', ['表', '库'], pickRows(data.NoPrimaryKeyTables || data.Items || data.TableNames, (item) => ({
        表: cell(item.TableName ?? item.Table ?? item),
        库: cell(item.TableSchema ?? item.Schema),
      }))))
    }
  } else {
    const data = await safeCall<Record<string, unknown>>(call, 'DescribeDBSpaceStatus', {
      InstanceId: base.InstanceId,
      Product: base.Product,
    }, ctx, region)
    if (isErr(data)) hints.push(data.error)
    else {
      tables.push(table('disk', '磁盘概览', ['指标', '数值'], [
        { 指标: '磁盘增长', 数值: cell(data.Growth ?? data.DiskGrowth ?? data.Available) },
        { 指标: '剩余天数', 数值: cell(data.RemainDays ?? data.Remain) },
        { 指标: '总空间', 数值: cell(data.TotalSpace ?? data.DiskCapacity) },
        { 指标: '已用', 数值: cell(data.UsedSpace ?? data.DiskUsed) },
        { 指标: '可用', 数值: cell(data.AvailableSpace ?? data.Available) },
      ].filter((row) => row.数值)))
    }
  }
  return { subTabs: SPACE_SUBTABS, activeSubTab: subTab, tables, hints }
}

async function loadSqlOpt(
  call: DbbrainCaller,
  ctx: ModuleContext,
  region: string,
  base: Record<string, unknown>,
  sql: string,
): Promise<TabLoad> {
  const form: ResourceDetail['form'] = {
    id: 'sqlopt',
    title: 'SQL优化',
    submitLabel: '分析',
    action: 'sql.advise',
    fields: [{ key: 'sql', label: 'SQL', placeholder: '粘贴一条 SQL', kind: 'textarea' }],
    values: { sql },
  }
  if (!sql.trim()) {
    return { form, hints: ['独立粘贴 SQL，不依赖当前会话。'], tables: [] }
  }
  const data = await safeCall<Record<string, unknown>>(call, 'DescribeUserSqlAdvice', { ...base, Sql: sql }, ctx, region)
  if (isErr(data)) return { form, hints: [data.error] }
  return {
    form,
    tables: [table('sqlopt', '优化建议', ['项', '内容'], [
      { 项: '评分', 内容: cell(data.Score ?? (data.SqlAdvice as Record<string, unknown> | undefined)?.Score) },
      { 项: '建议', 内容: cell(data.Advice ?? data.Comments ?? data.SqlAdvice ?? data.Remark) },
      { 项: '索引', 内容: cell(data.Indexes ?? data.IndexAdvices) },
    ].filter((row) => row.内容))],
  }
}

async function loadAutonomy(
  call: DbbrainCaller,
  ctx: ModuleContext,
  region: string,
  base: Record<string, unknown>,
  window: { start: string; end: string },
): Promise<TabLoad> {
  const data = await safeCall<Record<string, unknown>>(call, 'DescribeDBAutonomyEvents', {
    ...base,
    StartTime: window.start,
    EndTime: window.end,
  }, ctx, region)
  if (isErr(data)) {
    return { hints: [data.error, '自治中心与 SQL 限流分开，不合并展示。'] }
  }
  const rows = pickRows(data.Events || data.Items || data.Actions, (item) => ({
    事件: cell(item.EventId ?? item.ActionId ?? item.Id),
    类型: cell(item.Type ?? item.EventType),
    状态: cell(item.Status),
    原因: cell(item.Reason ?? item.TriggerReason),
    时间: cell(item.TriggerTime ?? item.CreateTime),
  }))
  return {
    tables: [table('autonomy', '自治事件', ['事件', '类型', '状态', '原因', '时间'], rows)],
    hints: ['自治中心与 SQL 限流分开，不合并展示。'],
  }
}

async function loadDeadlock(
  call: DbbrainCaller,
  ctx: ModuleContext,
  region: string,
  base: Record<string, unknown>,
): Promise<TabLoad> {
  const data = await safeCall<Record<string, unknown>>(call, 'DescribeDeadLockTrxSqls', base, ctx, region)
  if (isErr(data)) {
    return {
      hints: ['死锁可视化拓扑图不在对话卡片内绘制。上游未返回时显示空态。', data.error],
      tables: [table('deadlock', '死锁 SQL', ['事务', 'SQL'], [], '暂无死锁数据')],
    }
  }
  const rows = pickRows(data.Items || data.Sqls || data.DeadLockLogs, (item) => ({
    事务: cell(item.TrxId ?? item.Id),
    SQL: cell(item.Sql ?? item.SqlText ?? item.Info),
  }))
  return {
    tables: [table('deadlock', '死锁 SQL', ['事务', 'SQL'], rows, '暂无死锁数据')],
    hints: ['死锁可视化拓扑图不在对话卡片内绘制，这里列出上游返回的事务 SQL。'],
  }
}

async function loadReport(
  call: DbbrainCaller,
  ctx: ModuleContext,
  region: string,
  base: Record<string, unknown>,
  window: { start: string; end: string },
): Promise<TabLoad> {
  const data = await safeCall<Record<string, unknown>>(call, 'DescribeDBDiagReportTasks', {
    ...base,
    StartTime: window.start,
    EndTime: window.end,
    Limit: 20,
    Offset: 0,
  }, ctx, region)
  if (isErr(data)) {
    return { hints: [data.error, '健康报告任务在卡片内创建；浏览地址若必须外开，先给状态再给链接。'] }
  }
  const rows = pickRows(data.Tasks || data.List || data.Items, (item) => ({
    taskId: cell(item.AsyncRequestId ?? item.TaskId ?? item.Id),
    任务ID: cell(item.AsyncRequestId ?? item.TaskId ?? item.Id),
    时间窗: `${cell(item.StartTime)} ~ ${cell(item.EndTime)}`,
    状态: cell(item.Status ?? item.Progress),
    链接: cell(item.ReportUrl ?? item.Url),
  }))
  return {
    tables: [table('reports', '健康报告任务', ['任务ID', '时间窗', '状态', '链接'], rows)],
    hints: ['在卡片内查看任务状态。PDF 若必须外开，使用返回的链接。'],
  }
}

async function loadRedisMemory(
  call: DbbrainCaller,
  ctx: ModuleContext,
  region: string,
  base: Record<string, unknown>,
): Promise<TabLoad> {
  const big = await safeCall<Record<string, unknown>>(call, 'DescribeRedisTopBigKeys', {
    ...base,
    Limit: 20,
    SortBy: 'Capacity',
  }, ctx, region)
  const prefix = await safeCall<Record<string, unknown>>(call, 'DescribeRedisTopKeyPrefixList', { ...base, Limit: 20 }, ctx, region)
  const hints: string[] = []
  const tables: DetailTable[] = []
  if (isErr(big)) hints.push(big.error)
  else {
    tables.push(table('bigkey', '大 Key', ['Key', '类型', '内存', '元素'], pickRows(big.TopKeys || big.Items, (item) => ({
      Key: cell(item.Key ?? item.KeyName),
      类型: cell(item.Type ?? item.KeyType),
      内存: cell(item.Length ?? item.Capacity ?? item.ItemCount),
      元素: cell(item.ItemCount ?? item.ElementCount),
    }))))
  }
  if (isErr(prefix)) hints.push(prefix.error)
  else {
    tables.push(table('prefix', 'Key 前缀', ['前缀', '内存', '数量'], pickRows(prefix.Items || prefix.PrefixList || prefix.TopKeyPrefixList, (item) => ({
      前缀: cell(item.KeyPrefix ?? item.Prefix),
      内存: cell(item.Length ?? item.Capacity),
      数量: cell(item.ItemCount ?? item.Count),
    }))))
  }
  return { tables, hints: hints.length ? hints : ['内存分析对齐控制台：大 Key 与前缀。'] }
}

async function loadRedisAccess(
  call: DbbrainCaller,
  ctx: ModuleContext,
  region: string,
  base: Record<string, unknown>,
  window: { start: string; end: string },
): Promise<TabLoad> {
  const data = await safeCall<Record<string, unknown>>(call, 'DescribeRedisCommandOverview', {
    ...base,
    StartTime: window.start,
    EndTime: window.end,
  }, ctx, region)
  const cost = await safeCall<Record<string, unknown>>(call, 'DescribeRedisTopCostCommands', {
    ...base,
    StartTime: window.start,
    EndTime: window.end,
    Limit: 20,
  }, ctx, region)
  const hints: string[] = []
  const tables: DetailTable[] = []
  if (isErr(data)) hints.push(data.error)
  else {
    tables.push(table('cmd', '访问命令', ['命令', '次数'], pickRows(data.Items || data.CmdList || data.CommandList, (item) => ({
      命令: cell(item.Command ?? item.Cmd ?? item.Name),
      次数: cell(item.Count ?? item.Calls),
    }))))
  }
  if (isErr(cost)) hints.push(cost.error)
  else {
    tables.push(table('cost', '耗时命令', ['命令', '耗时'], pickRows(cost.Items || cost.TopCostCommands, (item) => ({
      命令: cell(item.Command ?? item.Cmd),
      耗时: cell(item.CostTime ?? item.QueryTime ?? item.AvgTime),
    }))))
  }
  return { tables, hints }
}

async function loadMongoIndex(
  call: DbbrainCaller,
  ctx: ModuleContext,
  region: string,
  base: Record<string, unknown>,
): Promise<TabLoad> {
  const data = await safeCall<Record<string, unknown>>(call, 'DescribeIndexRecommendInfo', base, ctx, region)
  if (isErr(data)) {
    return { hints: [data.error], tables: [table('index', '索引推荐', ['集合', '建议'], [], data.error)] }
  }
  const rows = pickRows(data.Items || data.Indexes, (item) => ({
    集合: cell(item.Collection ?? item.Ns ?? item.Name),
    建议: cell(item.Index ?? item.IndexCmd ?? item.Recommend),
    级别: cell(item.Level ?? item.Score),
  }))
  return {
    tables: [table('index', '索引推荐', ['集合', '建议', '级别'], rows)],
    fields: [
      { label: '集合数', value: cell(data.CollectionNum) },
      { label: '推荐数', value: cell(data.IndexNum) },
    ],
  }
}

export const tencentDbbrainModule = createDbbrainModule()
registerModule(tencentDbbrainModule)
