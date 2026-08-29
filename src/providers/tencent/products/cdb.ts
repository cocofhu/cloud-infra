import net from 'node:net'
import { publicErrorMessage } from '../../../core/safe-error.js'
import { registerModule } from '../../../core/registry.js'
import type {
  ActionResult,
  ModuleContext,
  ResourceAction,
  ResourceCard,
  ResourceModule,
  ResourceStatus,
} from '../../../core/types.js'
import { cdbCall, monitorCall, type TencentServiceOpts } from '../client.js'
import { deleteDmcSession, getDmcSession, putDmcSession, toPublicDmc } from '../dmc-session.js'

export interface CdbInstance {
  InstanceId?: string
  InstanceName?: string
  Status?: number
  StatusDesc?: string
  Zone?: string
  ZoneName?: string
  EngineVersion?: string
  Cpu?: number
  Memory?: number
  Volume?: number
  Vip?: string
  Vport?: number
  WanStatus?: number
  WanDomain?: string
  WanPort?: number
  DestroyProtect?: string | boolean | number
  PayType?: number
  InstanceType?: number
  ProjectId?: number
  DeadlineTime?: string
  CreateTime?: string
  DeviceType?: string
  TaskStatus?: number
  IsolateTime?: string
}

export interface CdbAccountItem {
  User?: string
  Host?: string
  Notes?: string
  MaxUserConnections?: number
}

export const CDB_OFFICIAL_TABS = [
  '实例详情',
  '实例监控',
  '账号管理',
  '数据库管理',
  '安全组',
  '备份恢复',
  '日志中心',
  '只读实例',
  '数据库代理',
  '数据安全',
  '连接检查',
] as const

export const CDB_REGIONS = [
  { id: 'ap-guangzhou', name: '广州' },
  { id: 'ap-shanghai', name: '上海' },
  { id: 'ap-nanjing', name: '南京' },
  { id: 'ap-beijing', name: '北京' },
  { id: 'ap-chengdu', name: '成都' },
  { id: 'ap-chongqing', name: '重庆' },
  { id: 'ap-hongkong', name: '香港' },
  { id: 'ap-singapore', name: '新加坡' },
  { id: 'ap-jakarta', name: '雅加达' },
  { id: 'ap-seoul', name: '首尔' },
  { id: 'ap-tokyo', name: '东京' },
  { id: 'ap-bangkok', name: '曼谷' },
  { id: 'ap-mumbai', name: '孟买' },
  { id: 'na-siliconvalley', name: '硅谷' },
  { id: 'na-ashburn', name: '弗吉尼亚' },
  { id: 'sa-saopaulo', name: '圣保罗' },
  { id: 'eu-frankfurt', name: '法兰克福' },
] as const

const ACTIONS: ResourceAction[] = [
  { id: 'instance.rename', label: '修改实例名称', confirm: 'default', fields: [{ key: 'instanceName', label: '实例名称' }] },
  { id: 'instance.openWan', label: '开启外网连接地址', confirm: 'default' },
  { id: 'instance.closeWan', label: '关闭外网连接地址', confirm: 'default' },
  { id: 'instance.port', label: '修改端口', confirm: 'default', fields: [{ key: 'port', label: '端口', placeholder: '3306' }] },
  { id: 'instance.restart', label: '重启', confirm: 'default' },
  { id: 'instance.project', label: '分配至项目', confirm: 'default', fields: [{ key: 'projectId', label: '项目 ID', placeholder: '0' }] },
  { id: 'instance.protect', label: '设置实例销毁保护', confirm: 'default', fields: [{ key: 'enable', label: '开启', placeholder: 'true / false' }] },
  { id: 'instance.destroy', label: '销毁实例', confirm: 'always' },
  { id: 'instance.buy', label: '新建实例', confirm: 'default' },
  { id: 'instance.renew', label: '续费', confirm: 'default' },
  { id: 'instance.buySame', label: '购买相同配置', confirm: 'default' },
  { id: 'account.create', label: '创建账号', confirm: 'default', fields: [
    { key: 'user', label: '账号' },
    { key: 'host', label: '主机', placeholder: '%' },
    { key: 'password', label: '密码', secret: true },
  ] },
  { id: 'account.password', label: '重置密码', confirm: 'always', fields: [{ key: 'password', label: '新密码', secret: true }] },
  { id: 'account.privileges', label: '修改权限', confirm: 'default', fields: [{ key: 'privileges', label: '全局权限', placeholder: 'SELECT,INSERT,UPDATE,DELETE' }] },
  { id: 'account.host', label: '修改授权主机', confirm: 'default', fields: [{ key: 'newHost', label: '新主机' }] },
  { id: 'account.delete', label: '删除账号', confirm: 'always' },
  { id: 'param.modify', label: '修改参数', confirm: 'default', fields: [
    { key: 'name', label: '参数名' },
    { key: 'value', label: '参数值' },
  ] },
  { id: 'sg.bind', label: '配置安全组', confirm: 'default', fields: [{ key: 'securityGroupIds', label: '安全组 ID', placeholder: 'sg-xxx,sg-yyy' }] },
  { id: 'backup.create', label: '手动备份', confirm: 'default' },
  { id: 'backup.delete', label: '删除手动备份', confirm: 'always' },
  { id: 'check.connect', label: '连接检查', confirm: 'default' },
  { id: 'dmc.login', label: '登录', confirm: 'default', fields: [
    { key: 'user', label: '账号' },
    { key: 'password', label: '密码', secret: true },
  ] },
  { id: 'dmc.logout', label: '退出登录', confirm: 'default' },
  { id: 'dmc.sql', label: '执行 SQL', confirm: 'default' },
  { id: 'dmc.schema', label: '库表目录', confirm: 'default' },
  { id: 'dmc.rows', label: '浏览数据', confirm: 'default' },
  { id: 'dmc.row.write', label: '维护行', confirm: 'default' },
]

export type CdbApi = typeof cdbCall
export type MonitorApi = typeof monitorCall

export interface DmcQueryResult {
  columns: string[]
  rows: unknown[][]
  affected?: number
}

export interface DmcDriver {
  ping: (opts: { host: string; port: number; user: string; password: string; timeoutMs: number }) => Promise<void>
  query: (opts: {
    host: string
    port: number
    user: string
    password: string
    database?: string
    sql: string
    timeoutMs: number
  }) => Promise<DmcQueryResult>
}

export function mapCdbStatus(status?: number): ResourceStatus {
  if (status === 1) return 'enable'
  if (status === 0 || status === 4) return 'pause'
  if (status === 5) return 'pause'
  return 'unknown'
}

export function cdbStatusLabel(status?: number, desc?: string): string {
  if (desc) return desc
  if (status === 0) return '创建中'
  if (status === 1) return '运行中'
  if (status === 4) return '隔离中'
  if (status === 5) return '已隔离'
  return status == null ? '-' : String(status)
}

export function zoneLabel(zone?: string, zoneName?: string): string {
  if (zoneName) return zoneName
  if (!zone) return '-'
  const matched = zone.match(/^(.*)-(\d+)$/)
  if (matched) {
    const city = CDB_REGIONS.find((row) => row.id === matched[1])?.name || matched[1]
    const index = Number(matched[2])
    const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
    const n = digits[index] || matched[2]
    return `${city}${n}区`
  }
  return zone
}

export function specLabel(item: CdbInstance): string {
  const cpu = item.Cpu != null ? `${item.Cpu}核` : ''
  const mem = item.Memory != null ? `${item.Memory}MB` : ''
  const vol = item.Volume != null ? `${item.Volume}GB` : ''
  return [cpu, mem].filter(Boolean).join(' ') + (vol ? ` / ${vol}` : '') || '-'
}

export function payLabel(payType?: number): string {
  if (payType === 0) return '包年包月'
  if (payType === 1) return '按量计费'
  return '-'
}

export function instanceTypeLabel(type?: number): string {
  if (type === 2) return '灾备实例'
  if (type === 3) return '只读实例'
  return '主实例'
}

export function mapCdbItem(item: CdbInstance, region: string, moduleId = 'tencent.cdb'): ResourceCard {
  const instanceId = String(item.InstanceId || '')
  const name = item.InstanceName || instanceId
  const vip = item.Vip || ''
  const vport = item.Vport ?? 3306
  const status = mapCdbStatus(item.Status)
  return {
    id: `${moduleId}:${region}:${instanceId}`,
    moduleId,
    provider: 'tencent',
    kind: 'cdb',
    title: instanceId,
    description: name,
    status,
    badges: [instanceTypeLabel(item.InstanceType)],
    columns: [
      { label: '运行状态', value: cdbStatusLabel(item.Status, item.StatusDesc) },
      { label: '可用区', value: zoneLabel(item.Zone, item.ZoneName) },
      { label: '数据库版本', value: item.EngineVersion || '-' },
      { label: '配置', value: specLabel(item) },
      { label: '内网地址', value: vip ? `${vip}:${vport}` : '-' },
      { label: '计费模式', value: payLabel(item.PayType) },
    ],
    openLabel: '管理',
    meta: {
      region,
      instanceName: name,
      vip,
      port: String(vport),
      wanStatus: String(item.WanStatus ?? 0),
      wanDomain: item.WanDomain || '',
      wanPort: item.WanPort != null ? String(item.WanPort) : '',
      destroyProtect: destroyProtectOn(item) ? 'on' : 'off',
      instanceType: String(item.InstanceType ?? 1),
      zone: item.Zone || '',
      projectId: item.ProjectId != null ? String(item.ProjectId) : '',
      engineVersion: item.EngineVersion || '',
    },
  }
}

export function parseCdbRef(id: string): { moduleId: string; region: string; instanceId: string } {
  const parts = String(id || '').split(':')
  if (parts.length >= 3) {
    return { moduleId: parts[0], region: parts[1], instanceId: parts.slice(2).join(':') }
  }
  return { moduleId: 'tencent.cdb', region: '', instanceId: parts[parts.length - 1] || '' }
}

export function isWriteSql(sql: string): boolean {
  const stripped = String(sql || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '').trim()
  return /^(insert|update|delete|replace|drop|alter|create|truncate|grant|revoke|rename|load|call|lock|unlock|set\s+global|set\s+persist)\b/i.test(stripped)
}

/** DROP/TRUNCATE/DELETE/ALTER always need confirm; skipConfirm must not skip these. */
export function isDestructiveSql(sql: string): boolean {
  const stripped = String(sql || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '').trim()
  return /^(drop|truncate|delete|alter)\b/i.test(stripped)
}

export function destroyProtectOn(item: Pick<CdbInstance, 'DestroyProtect'> | undefined): boolean {
  const value = item?.DestroyProtect
  if (value === true || value === 1) return true
  const s = String(value ?? '').trim().toLowerCase()
  return s === 'on' || s === 'true' || s === 'yes' || s === '1'
}

export function pickDmcEndpoint(input: {
  vip?: string
  port?: number | string
  wanStatus?: number | string
  wanDomain?: string
  wanPort?: number | string
}): { host: string; port: number; viaWan: boolean; wanOpen: boolean } {
  const wanOpen = Number(input.wanStatus) === 2
  const wanPort = Number(input.wanPort)
  const port = Number(input.port)
  if (wanOpen && String(input.wanDomain || '').trim()) {
    return {
      host: String(input.wanDomain).trim(),
      port: Number.isFinite(wanPort) && wanPort > 0 ? wanPort : 3306,
      viaWan: true,
      wanOpen: true,
    }
  }
  return {
    host: String(input.vip || '').trim(),
    port: Number.isFinite(port) && port > 0 ? port : 3306,
    viaWan: false,
    wanOpen,
  }
}

export function isConnectError(err: unknown): boolean {
  const rec = err && typeof err === 'object' ? err as { code?: unknown; message?: unknown } : {}
  const code = String(rec.code || '')
  const message = err instanceof Error ? err.message : String(err ?? '')
  return /ECONNREFUSED|ENETUNREACH|EHOSTUNREACH|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|ECONNRESET|connect E|getaddrinfo/i.test(`${code} ${message}`)
}

export function dmcConnectHint(opts: { wanOpen: boolean; viaWan: boolean }): string {
  if (!opts.wanOpen) return '未开外网：管理页仍可用，DMC 登录需插件主机可达实例内网，或先在管理页开启外网后再登录'
  if (opts.viaWan) return '外网地址不可达，请检查安全组、白名单或外网是否开通完成'
  return '无法连接实例地址，请确认网络可达或先开启外网'
}

export function metricValue(value: unknown): string {
  if (value == null) return '-'
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed || trimmed === '[object Object]') return '-'
    return trimmed
  }
  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i--) {
      const found = metricValue(value[i])
      if (found !== '-') return found
    }
    return '-'
  }
  if (typeof value === 'object') {
    const rec = value as Record<string, unknown>
    if (rec.Current != null) {
      const found = metricValue(rec.Current)
      if (found !== '-') return found
    }
    if (Array.isArray(rec.Avg)) {
      const found = metricValue(rec.Avg)
      if (found !== '-') return found
    }
    if (Array.isArray(rec.Values)) {
      const found = metricValue(rec.Values)
      if (found !== '-') return found
    }
    if (Array.isArray(rec.DataPoints)) {
      const found = metricValue(rec.DataPoints)
      if (found !== '-') return found
    }
    if (Array.isArray(rec.CpuRate)) {
      const found = metricValue(rec.CpuRate)
      if (found !== '-') return found
    }
    if (rec.Ratio != null) {
      const found = metricValue(rec.Ratio)
      if (found !== '-') return found
    }
    if (rec.Used != null && rec.Total != null) {
      const used = Number(rec.Used)
      const total = Number(rec.Total)
      if (Number.isFinite(used) && Number.isFinite(total) && total > 0) {
        return String(Math.round((used / total) * 1000) / 10)
      }
    }
  }
  return '-'
}

export function firstMetric(...values: unknown[]): string {
  for (const value of values) {
    const found = metricValue(value)
    if (found !== '-') return found
  }
  return '-'
}

export function explicitOpened(obj: unknown, keys: string[]): boolean | null {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null
  const rec = obj as Record<string, unknown>
  for (const key of keys) {
    if (!(key in rec)) continue
    const value = rec[key]
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    const s = String(value ?? '').trim().toLowerCase()
    if (!s) continue
    if (s === 'on' || s === 'true' || s === 'enabled' || s === 'yes' || s === '1') return true
    if (s === 'off' || s === 'false' || s === 'disabled' || s === 'no' || s === '0' || s === 'unset') return false
  }
  return null
}

export function looksLikeInstanceId(query: string): boolean {
  return /^(cdb|cdbro|cdbr)-[a-z0-9]+$/i.test(query.trim())
}

export function looksLikeIp(query: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(query.trim())
}

export function instanceMatchesQuery(item: CdbInstance, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const id = String(item.InstanceId || '').toLowerCase()
  const name = String(item.InstanceName || '').toLowerCase()
  const vip = String(item.Vip || '').toLowerCase()
  return id.includes(q) || name.includes(q) || vip.includes(q)
}

function creds(ctx: ModuleContext): { secretId: string; secretKey: string } {
  return { secretId: ctx.creds.secretId, secretKey: ctx.creds.secretKey }
}

function opts(ctx: ModuleContext, region?: string): TencentServiceOpts {
  return { timeoutMs: ctx.timeoutMs, signal: ctx.signal, region }
}

function buyOnly(): ActionResult {
  return { ok: false, error: '购买类操作不在插件内下单，请到腾讯云控制台完成。' }
}

function overviewFields(item: CdbInstance, region: string): Array<{ label: string; value: string }> {
  const regionName = CDB_REGIONS.find((row) => row.id === region)?.name || region
  return [
    { label: '实例 ID', value: item.InstanceId || '' },
    { label: '实例名称', value: item.InstanceName || '' },
    { label: '运行状态', value: cdbStatusLabel(item.Status, item.StatusDesc) },
    { label: '地域 / 可用区', value: `${regionName} / ${zoneLabel(item.Zone, item.ZoneName)}` },
    { label: '内网地址', value: item.Vip ? `${item.Vip}:${item.Vport ?? 3306}` : '' },
    { label: '外网地址', value: item.WanStatus === 2 && item.WanDomain ? `${item.WanDomain}:${item.WanPort || ''}` : '未开启' },
    { label: '销毁保护', value: destroyProtectOn(item) ? '开启' : '关闭' },
    { label: '实例配置', value: specLabel(item) },
    { label: '计费模式', value: payLabel(item.PayType) },
    { label: '数据库版本', value: item.EngineVersion || '' },
    { label: '实例类型', value: instanceTypeLabel(item.InstanceType) },
    { label: '项目 ID', value: item.ProjectId != null ? String(item.ProjectId) : '' },
    { label: '创建时间', value: item.CreateTime || '' },
  ].filter((row) => row.value)
}

async function mysqlDriver(): Promise<DmcDriver> {
  const mysql = await import('mysql2/promise')
  return {
    async ping(input) {
      const conn = await mysql.createConnection({
        host: input.host,
        port: input.port,
        user: input.user,
        password: input.password,
        connectTimeout: input.timeoutMs,
      })
      try {
        await conn.ping()
      } finally {
        await conn.end()
      }
    },
    async query(input) {
      const conn = await mysql.createConnection({
        host: input.host,
        port: input.port,
        user: input.user,
        password: input.password,
        database: input.database || undefined,
        connectTimeout: input.timeoutMs,
        multipleStatements: false,
      })
      try {
        const [raw, fields] = await conn.query(input.sql)
        if (Array.isArray(raw)) {
          const rows = raw as Array<Record<string, unknown>>
          const columns = Array.isArray(fields) && fields.length
            ? fields.map((field) => String((field as { name?: string }).name || ''))
            : (rows[0] ? Object.keys(rows[0]) : [])
          return {
            columns,
            rows: rows.map((row) => columns.map((col) => row[col])),
          }
        }
        const header = raw as { affectedRows?: number }
        return { columns: [], rows: [], affected: header.affectedRows }
      } finally {
        await conn.end()
      }
    },
  }
}

export async function tcpProbe(host: string, port: number, timeoutMs: number): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  return new Promise((resolve) => {
    const start = Date.now()
    const socket = net.connect({ host, port }, () => {
      const latencyMs = Date.now() - start
      socket.destroy()
      resolve({ ok: true, latencyMs })
    })
    socket.setTimeout(Math.max(1000, timeoutMs))
    socket.on('timeout', () => {
      socket.destroy()
      resolve({ ok: false, latencyMs: Date.now() - start, error: '连接超时' })
    })
    socket.on('error', () => {
      resolve({ ok: false, latencyMs: Date.now() - start, error: '连接失败' })
    })
  })
}

function tabKey(tab?: string): string {
  const value = String(tab || '实例详情').trim()
  const aliases: Record<string, string> = {
    overview: '实例详情',
    monitor: '实例监控',
    accounts: '账号管理',
    databases: '数据库管理',
    security: '安全组',
    backup: '备份恢复',
    logs: '日志中心',
    readonly: '只读实例',
    proxy: '数据库代理',
    dataSecurity: '数据安全',
    check: '连接检查',
  }
  return aliases[value] || value
}

function parseProtectEnable(value: unknown): boolean {
  if (value === false || value === 0) return false
  const s = String(value ?? '').trim().toLowerCase()
  if (s === 'false' || s === 'off' || s === 'no' || s === '0') return false
  if (s === 'true' || s === 'on' || s === 'yes' || s === '1') return true
  return true
}

async function listRegionInstances(
  call: CdbApi,
  ctx: ModuleContext,
  region: string,
): Promise<CdbInstance[]> {
  const pageSize = 100
  const collected: CdbInstance[] = []
  const q = ctx.query.trim()
  let offset = 0
  let total = Number.POSITIVE_INFINITY
  while (offset < total) {
    const payload: Record<string, unknown> = { Offset: offset, Limit: pageSize }
    if (looksLikeInstanceId(q)) payload.InstanceIds = [q]
    else if (looksLikeIp(q)) payload.Vips = [q]
    const data = await call<{ Items?: CdbInstance[]; TotalCount?: number }>('DescribeDBInstances', payload, creds(ctx), opts(ctx, region))
    const batch = data.Items || []
    total = data.TotalCount != null ? Number(data.TotalCount) : offset + batch.length
    collected.push(...batch)
    if (!batch.length) break
    offset += batch.length
    if (batch.length < pageSize) break
    if (looksLikeInstanceId(q) || looksLikeIp(q)) break
  }
  return collected.filter((item) => instanceMatchesQuery(item, ctx.query))
}

function logRows(items: unknown[]): Array<{ time: string; sql: string; user: string; extra: string }> {
  return (Array.isArray(items) ? items : []).map((raw) => {
    const row = raw && typeof raw === 'object' && !Array.isArray(raw)
      ? raw as Record<string, unknown>
      : { Content: raw }
    return {
      time: String(row.Timestamp ?? row.Time ?? row.ExecTime ?? row.Date ?? ''),
      sql: String(row.SqlText ?? row.Sql ?? row.Content ?? row.ErrorLog ?? ''),
      user: String(row.UserName ?? row.UserHost ?? row.User ?? ''),
      extra: String(row.QueryTime ?? row.QueryTimeMs ?? row.LockTime ?? ''),
    }
  })
}

/** Official DescribeSlowLogData / DescribeErrorLogData take Unix seconds, not date strings. */
export function lastDayRange(now = Date.now()): { StartTime: number; EndTime: number } {
  const end = Math.floor(now / 1000)
  const start = Math.floor((now - 864e5) / 1000)
  return { StartTime: start, EndTime: end }
}

export function createCdbModule(
  call: CdbApi = cdbCall,
  dmc: DmcDriver | (() => Promise<DmcDriver>) = mysqlDriver,
  monitor: MonitorApi = monitorCall,
): ResourceModule {
  const runDmc = async () => (typeof dmc === 'function' ? dmc() : dmc)

  const module: ResourceModule = {
    id: 'tencent.cdb',
    provider: 'tencent',
    kind: 'cdb',
    title: '腾讯云 CDB',
    implemented: true,
    actions: ACTIONS,
    async list(ctx) {
      const wanted = String(ctx.region || '').trim()
      const all = !wanted || wanted === 'all' || wanted === '全部地域'
      const regions = all ? CDB_REGIONS.map((row) => row.id) : [wanted]
      const warnings: string[] = []
      const collected: ResourceCard[] = []
      await Promise.all(regions.map(async (region) => {
        try {
          const raw = await listRegionInstances(call, ctx, region)
          collected.push(...raw.map((item) => mapCdbItem(item, region, module.id)))
        } catch (err) {
          warnings.push(`${CDB_REGIONS.find((row) => row.id === region)?.name || region}：${publicErrorMessage(err)}`)
        }
      }))
      collected.sort((a, b) => a.title.localeCompare(b.title))
      const total = collected.length
      const slice = collected.slice(ctx.offset, ctx.offset + ctx.limit)
      return {
        items: slice,
        total,
        offset: ctx.offset,
        hasMore: ctx.offset + slice.length < total,
        warnings,
      }
    },
    async detail(ctx) {
      const ref = parseCdbRef(String(ctx.id || ''))
      const region = ctx.region || ref.region
      const instanceId = ref.instanceId || String(ctx.title || '').trim()
      if (!instanceId) throw new Error('缺少实例')
      if (!region) throw new Error('缺少地域')
      const listed = await call<{ Items?: CdbInstance[] }>('DescribeDBInstances', {
        InstanceIds: [instanceId],
      }, creds(ctx), opts(ctx, region))
      const raw = listed.Items?.[0] || { InstanceId: instanceId }
      const card = mapCdbItem(raw, region, module.id)
      const fields = overviewFields(raw, region)
      const tab = tabKey(ctx.tab)
      const extra: Record<string, unknown> = {
        tab,
        tabs: [...CDB_OFFICIAL_TABS],
        region,
        instanceId,
        instance: raw,
        running: raw.Status === 1,
        wanOpen: raw.WanStatus === 2,
        destroyProtect: destroyProtectOn(raw),
        readonly: raw.InstanceType === 3,
        dmc: (() => {
          const session = getDmcSession(instanceId, region)
          return session ? toPublicDmc(session) : null
        })(),
      }
      try {
        extra.tabData = await loadTab(call, monitor, ctx, tab, instanceId, region, raw)
      } catch (err) {
        extra.tabError = publicErrorMessage(err)
        extra.tabData = { note: extra.tabError }
      }
      return { card, fields, extra }
    },
    async execute(actionId, payload, ctx) {
      const ref = parseCdbRef(String(ctx.id || payload.id || ''))
      const region = String(payload.region || ctx.region || ref.region || '')
      const instanceId = String(payload.instanceId || ref.instanceId || '')
      try {
        if (actionId === 'regions.list') {
          return { ok: true, data: { regions: CDB_REGIONS } }
        }
        if (actionId === 'instance.buy' || actionId === 'instance.renew' || actionId === 'instance.buySame') {
          return buyOnly()
        }
        if (!instanceId) return { ok: false, error: '缺少实例' }
        if (!region && actionId !== 'dmc.logout') return { ok: false, error: '缺少地域' }

        if (actionId === 'instance.rename') {
          const name = String(payload.instanceName || '').trim()
          if (!name) return { ok: false, error: '缺少实例名称' }
          await call('ModifyDBInstanceName', { InstanceId: instanceId, InstanceName: name }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'instance.openWan') {
          await call('OpenWanService', { InstanceId: instanceId }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'instance.closeWan') {
          await call('CloseWanService', { InstanceId: instanceId }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'instance.port') {
          const port = Number(payload.port)
          if (!Number.isFinite(port) || port <= 0) return { ok: false, error: '缺少端口' }
          await call('ModifyDBInstanceVipVport', { InstanceId: instanceId, DstPort: port }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'instance.restart') {
          await call('RestartDBInstances', { InstanceIds: [instanceId] }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'instance.project') {
          const projectId = Number(payload.projectId)
          if (!Number.isFinite(projectId)) return { ok: false, error: '缺少项目 ID' }
          await call('ModifyDBInstanceProject', { InstanceIds: [instanceId], NewProjectId: projectId }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'instance.protect') {
          const enable = parseProtectEnable(payload.enable)
          await call('ModifyInstanceDestroyProtect', {
            InstanceIds: [instanceId],
            DestroyProtect: enable ? 'on' : 'off',
          }, creds(ctx), opts(ctx, region))
          return { ok: true, data: { protect: enable } }
        }
        if (actionId === 'instance.destroy') {
          await call('IsolateDBInstance', { InstanceId: instanceId }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'account.create') {
          const user = String(payload.user || '').trim()
          const host = String(payload.host || '%').trim() || '%'
          const password = String(payload.password || '')
          if (!user) return { ok: false, error: '缺少账号' }
          if (!password) return { ok: false, error: '缺少密码' }
          await call('CreateAccounts', {
            InstanceId: instanceId,
            Accounts: [{ User: user, Host: host }],
            Password: password,
          }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'account.password') {
          const user = String(payload.user || '').trim()
          const host = String(payload.host || '%').trim() || '%'
          const password = String(payload.password || '')
          if (!user) return { ok: false, error: '缺少账号' }
          if (!password) return { ok: false, error: '缺少密码' }
          await call('ModifyAccountPassword', {
            InstanceId: instanceId,
            NewPassword: password,
            Accounts: [{ User: user, Host: host }],
          }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'account.privileges') {
          const user = String(payload.user || '').trim()
          const host = String(payload.host || '%').trim() || '%'
          const privileges = String(payload.privileges || '')
            .split(/[,，\s]+/)
            .map((item) => item.trim())
            .filter(Boolean)
          if (!user) return { ok: false, error: '缺少账号' }
          await call('ModifyAccountPrivileges', {
            InstanceId: instanceId,
            Accounts: [{ User: user, Host: host }],
            GlobalPrivileges: privileges,
          }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'account.host') {
          const user = String(payload.user || '').trim()
          const host = String(payload.host || '').trim()
          const newHost = String(payload.newHost || '').trim()
          if (!user || !host || !newHost) return { ok: false, error: '缺少账号或主机' }
          await call('ModifyAccountHost', {
            InstanceId: instanceId,
            User: user,
            Host: host,
            NewHost: newHost,
          }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'account.delete') {
          const user = String(payload.user || '').trim()
          const host = String(payload.host || '%').trim() || '%'
          if (!user) return { ok: false, error: '缺少账号' }
          await call('DeleteAccounts', {
            InstanceId: instanceId,
            Accounts: [{ User: user, Host: host }],
          }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'param.modify') {
          const name = String(payload.name || '').trim()
          const value = String(payload.value ?? '')
          if (!name) return { ok: false, error: '缺少参数名' }
          await call('ModifyInstanceParam', {
            InstanceIds: [instanceId],
            ParamList: [{ Name: name, CurrentValue: value }],
          }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'sg.bind') {
          const ids = String(payload.securityGroupIds || '')
            .split(/[,，\s]+/)
            .map((item) => item.trim())
            .filter(Boolean)
          await call('ModifyDBInstanceSecurityGroups', {
            InstanceId: instanceId,
            SecurityGroupIds: ids,
          }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'backup.create') {
          await call('CreateBackup', { InstanceId: instanceId, BackupMethod: 'logical' }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'backup.delete') {
          const backupId = Number(payload.backupId)
          if (!Number.isFinite(backupId)) return { ok: false, error: '缺少备份 ID' }
          await call('DeleteBackup', { InstanceId: instanceId, BackupId: backupId }, creds(ctx), opts(ctx, region))
          return { ok: true }
        }
        if (actionId === 'check.connect') {
          const vip = String(payload.host || payload.vip || '')
          const vport = Number(payload.port || 3306)
          const wanHost = String(payload.wanDomain || payload.wanHost || '')
          const wanPort = Number(payload.wanPort || 3306)
          if (!vip && !wanHost) return { ok: false, error: '缺少连接地址' }
          const timeout = Math.min(ctx.timeoutMs, 8000)
          const innerPort = Number.isFinite(vport) && vport > 0 ? vport : 3306
          const outerPort = Number.isFinite(wanPort) && wanPort > 0 ? wanPort : 3306
          const inner = vip
            ? await tcpProbe(vip, innerPort, timeout)
            : { ok: false, latencyMs: 0, error: '无内网地址' }
          const outer = wanHost
            ? await tcpProbe(wanHost, outerPort, timeout)
            : { ok: false, latencyMs: 0, error: '未开外网：管理页仍可用，DMC 登录提示网络原因' }
          return { ok: true, data: { inner, outer } }
        }
        if (actionId === 'dmc.login') {
          const user = String(payload.user || '').trim()
          const password = String(payload.password || '')
          if (!user) return { ok: false, error: '缺少库账号' }
          if (!password) return { ok: false, error: '缺少密码' }
          let instance: CdbInstance | undefined
          try {
            const listed = await call<{ Items?: CdbInstance[] }>('DescribeDBInstances', {
              InstanceIds: [instanceId],
            }, creds(ctx), opts(ctx, region))
            instance = listed.Items?.[0]
          } catch {
            instance = undefined
          }
          const endpoint = pickDmcEndpoint({
            vip: instance?.Vip || String(payload.vip || payload.host || ''),
            port: instance?.Vport ?? (payload.port as string | number | undefined),
            wanStatus: instance?.WanStatus ?? (payload.wanStatus as string | number | undefined),
            wanDomain: instance?.WanDomain || String(payload.wanDomain || ''),
            wanPort: instance?.WanPort ?? (payload.wanPort as string | number | undefined),
          })
          if (!endpoint.host) return { ok: false, error: '缺少连接地址' }
          try {
            const driver = await runDmc()
            await driver.ping({ host: endpoint.host, port: endpoint.port, user, password, timeoutMs: ctx.timeoutMs })
          } catch (err) {
            if (isConnectError(err)) return { ok: false, error: dmcConnectHint(endpoint) }
            throw err
          }
          const pub = putDmcSession({ instanceId, region, host: endpoint.host, port: endpoint.port, user, password })
          return { ok: true, data: { ...pub, viaWan: endpoint.viaWan, wanOpen: endpoint.wanOpen } }
        }
        if (actionId === 'dmc.logout') {
          deleteDmcSession(instanceId, region)
          return { ok: true }
        }
        if (actionId === 'dmc.sql' || actionId === 'dmc.schema' || actionId === 'dmc.rows' || actionId === 'dmc.row.write') {
          return runLoggedSql(actionId, payload, ctx, instanceId, region, await runDmc())
        }
        return { ok: false, error: `未知动作 ${actionId}` }
      } catch (err) {
        return { ok: false, error: publicErrorMessage(err) }
      }
    },
  }
  return module
}

async function runLoggedSql(
  actionId: string,
  payload: Record<string, unknown>,
  ctx: ModuleContext,
  instanceId: string,
  region: string,
  driver: DmcDriver,
): Promise<ActionResult> {
  const session = getDmcSession(instanceId, region)
  if (!session) return { ok: false, error: '未登录 DMC，请先登录' }
  const database = String(payload.database || session.database || '')
  if (actionId === 'dmc.schema') {
    if (!database) {
      const listed = await driver.query({
        ...session,
        sql: 'SHOW DATABASES',
        timeoutMs: ctx.timeoutMs,
      })
      return { ok: true, data: { databases: listed.rows.map((row) => String(row[0] || '')) } }
    }
    const listed = await driver.query({
      ...session,
      database,
      sql: 'SHOW TABLES',
      timeoutMs: ctx.timeoutMs,
    })
    return { ok: true, data: { database, tables: listed.rows.map((row) => String(row[0] || '')) } }
  }
  if (actionId === 'dmc.rows') {
    const table = String(payload.table || '').trim()
    if (!database || !table) return { ok: false, error: '缺少库表' }
    const offset = Math.max(0, Number(payload.offset) || 0)
    const limit = Math.min(100, Math.max(1, Number(payload.limit) || 50))
    const ident = `${qIdent(database)}.${qIdent(table)}`
    const result = await driver.query({
      ...session,
      database,
      sql: `SELECT * FROM ${ident} LIMIT ${limit} OFFSET ${offset}`,
      timeoutMs: ctx.timeoutMs,
    })
    return { ok: true, data: result }
  }
  if (actionId === 'dmc.row.write') {
    const table = String(payload.table || '').trim()
    if (!database || !table) return { ok: false, error: '缺少库表' }
    const op = String(payload.op || 'update')
    const values = (payload.values && typeof payload.values === 'object' && !Array.isArray(payload.values))
      ? payload.values as Record<string, unknown>
      : {}
    const where = (payload.where && typeof payload.where === 'object' && !Array.isArray(payload.where))
      ? payload.where as Record<string, unknown>
      : {}
    const ident = `${qIdent(database)}.${qIdent(table)}`
    let sql = ''
    if (op === 'insert') {
      const keys = Object.keys(values)
      sql = `INSERT INTO ${ident} (${keys.map(qIdent).join(',')}) VALUES (${keys.map((key) => qLiteral(values[key])).join(',')})`
    } else if (op === 'delete') {
      sql = `DELETE FROM ${ident} WHERE ${whereSql(where)}`
    } else {
      const sets = Object.keys(values).map((key) => `${qIdent(key)}=${qLiteral(values[key])}`)
      sql = `UPDATE ${ident} SET ${sets.join(',')} WHERE ${whereSql(where)}`
    }
    const result = await driver.query({ ...session, database, sql, timeoutMs: ctx.timeoutMs })
    return { ok: true, data: result }
  }
  const sql = String(payload.sql || '').trim()
  if (!sql) return { ok: false, error: '缺少 SQL' }
  const result = await driver.query({
    ...session,
    database: database || undefined,
    sql,
    timeoutMs: ctx.timeoutMs,
  })
  return { ok: true, data: { ...result, write: isWriteSql(sql), destructive: isDestructiveSql(sql) } }
}

function qIdent(value: string): string {
  return `\`${String(value).replace(/`/g, '``')}\``
}

function qLiteral(value: unknown): string {
  if (value == null) return 'NULL'
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`
}

function whereSql(where: Record<string, unknown>): string {
  const parts = Object.keys(where).map((key) => `${qIdent(key)}=${qLiteral(where[key])}`)
  return parts.length ? parts.join(' AND ') : '1=0'
}

async function loadTab(
  call: CdbApi,
  monitor: MonitorApi,
  ctx: ModuleContext,
  tab: string,
  instanceId: string,
  region: string,
  raw: CdbInstance,
): Promise<Record<string, unknown>> {
  const c = creds(ctx)
  const o = opts(ctx, region)
  if (tab === '实例详情') {
    return {
      wanOpen: raw.WanStatus === 2,
    }
  }
  if (tab === '实例监控') {
    const device = await call<Record<string, unknown>>('DescribeDeviceMonitorInfo', { InstanceId: instanceId }, c, o).catch(() => ({} as Record<string, unknown>))
    const metrics = ['CpuUseRate', 'MemoryUseRate', 'VolumeRate', 'ThreadsConnected']
    const points: Record<string, unknown> = {}
    await Promise.all(metrics.map(async (metric) => {
      try {
        const data = await monitor('GetMonitorData', {
          Namespace: 'QCE/CDB',
          MetricName: metric,
          Period: 60,
          Instances: [{ Dimensions: [{ Name: 'InstanceId', Value: instanceId }] }],
        }, c, o)
        points[metric] = data
      } catch {
        points[metric] = null
      }
    }))
    return {
      cpu: firstMetric(device.Cpu, device.CpuUseRate, points.CpuUseRate),
      memory: firstMetric(device.Memory, device.Mem, points.MemoryUseRate),
      disk: firstMetric(device.Disk, device.VolumeRate, points.VolumeRate),
      connections: firstMetric(device.Connections, device.ThreadsConnected, points.ThreadsConnected),
      device,
    }
  }
  if (tab === '账号管理') {
    const data = await call<{ Items?: CdbAccountItem[] }>('DescribeAccounts', { InstanceId: instanceId, Offset: 0, Limit: 100 }, c, o)
    return { accounts: data.Items || [] }
  }
  if (tab === '数据库管理') {
    if (raw.InstanceType === 3) {
      return { readonlyHint: '只读实例不支持库表接口', databases: [], parameters: [] }
    }
    const databases = await call<{ Items?: Array<{ DatabaseName?: string; CharacterSet?: string }> }>(
      'DescribeDatabases',
      { InstanceId: instanceId, Offset: 0, Limit: 100 },
      c,
      o,
    ).catch(() => ({ Items: [] as Array<{ DatabaseName?: string; CharacterSet?: string }> }))
    const parameters = await call<{ Items?: Array<{ Name?: string; CurrentValue?: string; Max?: string; Min?: string; NeedRestart?: string; Description?: string }> }>(
      'DescribeInstanceParams',
      { InstanceId: instanceId },
      c,
      o,
    ).catch(() => ({ Items: [] as Array<{ Name?: string }> }))
    return { databases: databases.Items || [], parameters: parameters.Items || [] }
  }
  if (tab === '安全组') {
    const data = await call<{ Groups?: Array<{ SecurityGroupId?: string; SecurityGroupName?: string; Inbound?: unknown; Outbound?: unknown }> }>(
      'DescribeDBSecurityGroups',
      { InstanceId: instanceId },
      c,
      o,
    )
    return { groups: data.Groups || [] }
  }
  if (tab === '备份恢复') {
    const data = await call<{ Items?: Array<{ BackupId?: number; Name?: string; Status?: string; Date?: string; Type?: string; Way?: string }> }>(
      'DescribeBackups',
      { InstanceId: instanceId, Offset: 0, Limit: 50 },
      c,
      o,
    )
    return {
      backups: data.Items || [],
    }
  }
  if (tab === '日志中心') {
    const range = lastDayRange()
    const loadLogs = async (action: 'DescribeSlowLogData' | 'DescribeErrorLogData') => {
      try {
        const data = await call<{ Items?: unknown[]; TotalCount?: number }>(
          action,
          { InstanceId: instanceId, Offset: 0, Limit: 20, ...range },
          c,
          o,
        )
        return { rows: logRows(data.Items || []), error: '' }
      } catch (err) {
        return { rows: [] as ReturnType<typeof logRows>, error: publicErrorMessage(err) }
      }
    }
    const slow = await loadLogs('DescribeSlowLogData')
    const errors = await loadLogs('DescribeErrorLogData')
    const hints = [
      slow.error ? `慢日志：${slow.error}` : '',
      errors.error ? `错误日志：${errors.error}` : '',
    ].filter(Boolean)
    return {
      slowLogs: slow.rows,
      errorLogs: errors.rows,
      slowLogError: slow.error || undefined,
      errorLogError: errors.error || undefined,
      tabError: hints.length ? hints.join('；') : undefined,
      note: '慢查询在日志中心，不是顶栏页签。',
    }
  }
  if (tab === '只读实例') {
    const data = await call<{ RoGroups?: Array<{ RoGroupId?: string; RoInstances?: CdbInstance[] }> }>(
      'DescribeRoGroups',
      { InstanceId: instanceId },
      c,
      o,
    ).catch(() => ({ RoGroups: [] as Array<{ RoInstances?: CdbInstance[] }> }))
    const rows = (data.RoGroups || []).flatMap((group) => group.RoInstances || [])
    return { readonlyInstances: rows, empty: rows.length ? '' : '暂无只读实例' }
  }
  if (tab === '数据库代理') {
    const data = await call<Record<string, unknown>>('DescribeCdbProxyInfo', { InstanceId: instanceId }, c, o).catch((err) => ({
      unopened: true,
      note: publicErrorMessage(err) === '当前密钥没有该操作的权限' ? '未开通或无权限' : '未开通数据库代理',
    }))
    return { proxy: data, opened: !('unopened' in data) }
  }
  if (tab === '数据安全') {
    const features = await call<Record<string, unknown>>('DescribeDBFeatures', { InstanceId: instanceId }, c, o).catch(() => ({} as Record<string, unknown>))
    const audit = await call<Record<string, unknown>>('DescribeAuditConfig', { InstanceId: instanceId }, c, o).catch(() => ({} as Record<string, unknown>))
    const auditOpened = explicitOpened(audit, ['opened', 'AuditStatus', 'LogAudit', 'AuditEnabled', 'Status'])
    const encryptionOpened = explicitOpened(features, ['Encryption', 'EncryptionStatus', 'IsEncryption'])
    return {
      features,
      audit,
      auditOpened,
      encryptionOpened,
      opened: auditOpened === true || encryptionOpened === true,
      note: '展示开通状态；审计全链不在范围内。',
    }
  }
  if (tab === '连接检查') {
    const vip = raw.Vip || ''
    const vport = raw.Vport ?? 3306
    const wan = raw.WanStatus === 2 ? { host: raw.WanDomain || '', port: raw.WanPort || 0 } : null
    const inner = vip ? await tcpProbe(vip, vport, Math.min(ctx.timeoutMs, 8000)) : { ok: false, latencyMs: 0, error: '无内网地址' }
    const outer = wan?.host
      ? await tcpProbe(wan.host, wan.port || 3306, Math.min(ctx.timeoutMs, 8000))
      : { ok: false, latencyMs: 0, error: '未开外网：管理页仍可用，DMC 登录提示网络原因' }
    return { inner, outer }
  }
  return { note: '未知页签' }
}

export const tencentCdbModule = createCdbModule()
registerModule(tencentCdbModule)
