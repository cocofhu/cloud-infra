import { publicErrorMessage } from '../../../core/safe-error.js'
import { registerModule } from '../../../core/registry.js'
import type {
  ModuleContext,
  ResourceAction,
  ResourceCard,
  ResourceModule,
  ResourceStatus,
} from '../../../core/types.js'
import { domainCall } from '../client.js'

export const POPULAR_TLDS = ['.com', '.cn', '.net', '.xyz', '.top'] as const
export const AGREEMENT_URL = 'https://cloud.tencent.com/document/product/242/8458'
export const REGISTRAR_KIND = 'registrar'
export const MY_DOMAIN_KIND = 'my-domain'
export const REGISTRAR_MODULE_ID = 'tencent.registrar'
export const MY_DOMAIN_MODULE_ID = 'tencent.my-domain'

export interface CheckDomainResult {
  DomainName?: string
  Available?: boolean
  Reason?: string
  Premium?: boolean
  Price?: number
  BlackWord?: boolean
  RealPrice?: number
  Period?: number
  Describe?: string
}

export interface DomainListRow {
  DomainId?: string
  DomainName?: string
  ExpirationDate?: string
  CreationDate?: string
  AutoRenew?: number
  BuyStatus?: string
  Tld?: string
  IsPremium?: boolean
  CodeTld?: string
}

export interface DomainBaseInfo {
  DomainId?: string
  DomainName?: string
  RealNameAuditStatus?: string
  CreationDate?: string
  ExpirationDate?: string
  DomainStatus?: string[]
  BuyStatus?: string
  RegistrarType?: string
  NameServer?: string[]
  /** 注册局安全锁，不是禁止转移锁，读写两锁时禁止使用 */
  LockTransfer?: boolean
  LockEndTime?: string
}

export interface TemplateInfo {
  TemplateId?: string
  AuditStatus?: string
  Status?: string
  IsDefault?: string | boolean
  RegistrantType?: string
  Type?: string
  ContactInfo?: {
    RegistrantName?: string
    RegistrantNameCN?: string
    OrganizationNameCN?: string
    OrganizationName?: string
  }
}

export interface BatchStatusRow {
  LogId?: number
  Status?: string
  BatchAction?: string
  Message?: string
}

const REGISTRAR_ACTIONS: ResourceAction[] = [
  { id: 'templates.list', label: '信息模板', confirm: 'always' },
  { id: 'order.preview', label: '提交订单', confirm: 'always' },
  { id: 'order.create', label: '余额支付', confirm: 'always' },
  { id: 'order.status', label: '操作状态', confirm: 'always' },
]

const MY_DOMAIN_ACTIONS: ResourceAction[] = [
  { id: 'autorenew.set', label: '自动续费', confirm: 'always' },
  { id: 'lock.update', label: '禁止更新锁', confirm: 'always' },
  { id: 'lock.transfer', label: '禁止转移锁', confirm: 'always' },
]

export function normalizeKeyword(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .replace(/\.$/, '')
}

export function isBareName(name: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(name)
}

export function isFullDomain(name: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(name)
}

export function tldOf(domain: string): string {
  const idx = domain.lastIndexOf('.')
  return idx >= 0 ? domain.slice(idx) : ''
}

export function maxPeriodYears(domains: string[]): number {
  return domains.some((item) => tldOf(item) === '.co') ? 5 : 10
}

export function clampPeriod(period: number, domains: string[]): number {
  const max = maxPeriodYears(domains)
  const n = Math.floor(Number(period) || 1)
  return Math.min(max, Math.max(1, n))
}

export function availabilityKeyword(item: CheckDomainResult): 'available' | 'taken' | 'premium' | 'blocked' {
  if (item.BlackWord) return 'blocked'
  if (item.Premium) return 'premium'
  if (item.Available) return 'available'
  return 'taken'
}

export function availabilityLabel(kind: ReturnType<typeof availabilityKeyword>): string {
  if (kind === 'available') return '未注册'
  if (kind === 'premium') return '溢价词'
  if (kind === 'blocked') return '敏感词'
  return '已被注册'
}

export function availabilityAction(kind: ReturnType<typeof availabilityKeyword>): string {
  if (kind === 'available') return '立即加购'
  if (kind === 'premium') return '溢价词不可加购'
  if (kind === 'blocked') return '不可加购'
  return '已被注册'
}

export function mapCheckDomain(
  item: CheckDomainResult,
  moduleId = REGISTRAR_MODULE_ID,
  suggested = false,
): ResourceCard {
  const name = String(item.DomainName || '').trim().toLowerCase()
  const kind = availabilityKeyword(item)
  const price = Number(item.RealPrice ?? item.Price ?? 0)
  const status: ResourceStatus = kind === 'available' ? 'enable' : kind === 'premium' || kind === 'blocked' ? 'pause' : 'error'
  return {
    id: `${moduleId}:${name}`,
    moduleId,
    provider: 'tencent',
    kind: REGISTRAR_KIND,
    title: name,
    description: availabilityLabel(kind),
    status,
    badges: [availabilityLabel(kind)],
    columns: [
      { label: '状态', value: availabilityLabel(kind) },
      { label: '价格', value: price > 0 ? `¥${price}/年` : '-' },
    ],
    openLabel: kind === 'available' ? '立即加购' : '',
    extras: {
      available: kind === 'available',
      premium: kind === 'premium',
      blocked: kind === 'blocked',
      price,
      actionHint: availabilityAction(kind),
      suggested,
    },
  }
}

export function buyStatusLabel(status?: string): string {
  const value = String(status || '')
  const key = value.toLowerCase()
  if (key === 'abouttoexpire') return '即将到期'
  if (key === 'expired') return '已过期'
  if (key === 'binded' || key === 'ok' || key === 'normal') return '正常'
  if (key === 'notpay' || key === 'unpaid') return '未支付'
  if (key === 'refund') return '已退款'
  if (key === 'renewing') return '续费中'
  if (key === 'redemption') return '赎回期'
  if (key === 'pendingdelete') return '删除中'
  if (key === 'transferring') return '转移中'
  return value || '-'
}

/** 卡片 status 内部枚举与「状态」列 buyStatusLabel 同口径:异常/流程中状态不得显示为绿色 enable。 */
export function buyStatusToResourceStatus(status?: string): 'enable' | 'pause' | 'error' | 'unknown' {
  const key = String(status || '').toLowerCase()
  if (key === 'expired') return 'error'
  if (key === 'abouttoexpire' || key === 'redemption' || key === 'pendingdelete') return 'pause'
  if (key === 'binded' || key === 'ok' || key === 'normal') return 'enable'
  if (!key) return 'unknown'
  return 'unknown'
}

export function realNameLabel(status?: string): string {
  const value = String(status || '').trim()
  if (!value) return ''
  const key = value.toLowerCase()
  if (key === 'approved') return '已实名'
  if (key === 'inaudit') return '审核中'
  if (key === 'notupload' || key === 'reject') return '未实名'
  if (key === 'noaudit') return '无需实名'
  return value
}

export function domainStatusFlags(status: unknown): string[] {
  if (!Array.isArray(status)) return []
  return status.map((item) => String(item || '').trim()).filter(Boolean)
}

/** 禁止更新锁/禁止转移锁以 DomainStatus 为准；LockTransfer 是注册局安全锁，不能当转移锁。 */
export function locksFromDomainStatus(status: unknown): { updateLock: boolean; transferLock: boolean } {
  const flags = new Set(domainStatusFlags(status).map((item) => item.toLowerCase()))
  return {
    updateLock: flags.has('clientupdateprohibited'),
    transferLock: flags.has('clienttransferprohibited'),
  }
}

export function nameServerText(servers: unknown): string {
  if (!Array.isArray(servers)) return ''
  return servers.map((item) => String(item || '').trim()).filter(Boolean).join(' ')
}

/** 注册域名当前是否由 DNSPod 托管；用于在“我的域名”详情中开放解析记录入口。 */
export function isDnspodNameServers(servers: unknown): boolean {
  if (!Array.isArray(servers)) return false
  return servers.some((item) => {
    const host = String(item || '').trim().toLowerCase().replace(/\.$/, '')
    return /(^|\.)dnspod\.(com|net)$/.test(host) || /(^|\.)dnsv[1-5]\.com$/.test(host)
  })
}

export function mapOwnedDomain(item: DomainListRow, moduleId = MY_DOMAIN_MODULE_ID): ResourceCard {
  const domainId = String(item.DomainId || item.DomainName || '')
  const title = item.DomainName || domainId
  const autoRenew = Number(item.AutoRenew) === 1
  return {
    id: `${moduleId}:${domainId}`,
    moduleId,
    provider: 'tencent',
    kind: MY_DOMAIN_KIND,
    title,
    description: [buyStatusLabel(item.BuyStatus), autoRenew ? '自动续费开' : '自动续费关'].filter(Boolean).join(' · '),
    status: buyStatusToResourceStatus(item.BuyStatus),
    badges: [autoRenew ? '自动续费' : ''].filter(Boolean) as string[],
    columns: [
      { label: '状态', value: buyStatusLabel(item.BuyStatus) },
      { label: '到期', value: item.ExpirationDate || '-' },
      { label: '自动续费', value: autoRenew ? '开' : '关' },
    ],
    openLabel: '管理',
    expiresAt: item.ExpirationDate || undefined,
    extras: {
      domainId,
      autoRenew,
      creationDate: item.CreationDate || '',
    },
  }
}

export function parseOwnedRef(id: string): { moduleId: string; domainId: string } {
  const idx = id.lastIndexOf(':')
  const domainId = idx >= 0 ? id.slice(idx + 1) : id
  const moduleId = idx >= 0 ? id.slice(0, idx) : MY_DOMAIN_MODULE_ID
  return { moduleId, domainId }
}

/**
 * 要查的域名清单。第一项是用户真正输入的那个,后面是同名的其它热门后缀。
 *
 * 只查精确匹配的话,一次查询就回一行:卡片大半是空的,想看 .cn 还得自己改后缀再查一遍。
 * 控制台是连着给出其它后缀的可注册情况,这里对齐。
 * 只在「二级域 + 单段后缀」时补:example.com.cn / a.b.com 拆出来的名字没有意义。
 */
export function checkTargets(query: string): string[] {
  const keyword = normalizeKeyword(query)
  if (!keyword) return []
  if (isBareName(keyword)) return POPULAR_TLDS.map((tld) => `${keyword}${tld}`)
  if (!isFullDomain(keyword)) return []
  const tld = tldOf(keyword)
  const sld = keyword.slice(0, keyword.length - tld.length)
  if (!isBareName(sld)) return [keyword]
  return [keyword, ...POPULAR_TLDS.filter((item) => item !== tld).map((item) => `${sld}${item}`)]
}

/** 补出来的后缀行要标出来,前端才能把「精确匹配」和「其它后缀」分段展示。 */
export function isSuggestedTarget(query: string, name: string): boolean {
  const keyword = normalizeKeyword(query)
  if (!keyword || !isFullDomain(keyword)) return false
  return String(name || '').trim().toLowerCase() !== keyword
}

export function filterOwned(items: DomainListRow[], query: string): DomainListRow[] {
  const keyword = normalizeKeyword(query)
  if (!keyword) return items
  return items.filter((item) => String(item.DomainName || '').toLowerCase().includes(keyword))
}

export function approvedTemplates(list: TemplateInfo[]): TemplateInfo[] {
  return list.filter((item) => {
    const status = String(item.AuditStatus || item.Status || '')
    return status === 'Approved'
  })
}

export function templateLabel(item: TemplateInfo): string {
  const contact = item.ContactInfo || {}
  const name = contact.RegistrantNameCN || contact.OrganizationNameCN || contact.RegistrantName || contact.OrganizationName || ''
  const type = item.RegistrantType === 'E' || item.Type === 'E' ? '企业' : '个人'
  return [name || item.TemplateId, type, '已实名'].filter(Boolean).join(' · ')
}

export function batchStatusLabel(status?: string): string {
  const value = String(status || '').toLowerCase()
  if (value === 'success' || value === 'ok' || value === 'done') return '成功'
  if (value === 'failed' || value === 'fail' || value === 'error') return '失败'
  if (value === 'doing' || value === 'running' || value === 'processing') return '进行中'
  if (value === 'pending' || value === 'init' || value === 'created') return '已提交'
  return status ? '已提交' : '已提交'
}

function creds(ctx: ModuleContext): { secretId: string; secretKey: string } {
  return { secretId: ctx.creds.secretId, secretKey: ctx.creds.secretKey }
}

function opts(ctx: ModuleContext): { timeoutMs: number; signal?: AbortSignal } {
  return { timeoutMs: ctx.timeoutMs, signal: ctx.signal }
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean)
}

export function createRegistrarModule(call: typeof domainCall = domainCall): ResourceModule {
  const module: ResourceModule = {
    id: REGISTRAR_MODULE_ID,
    provider: 'tencent',
    kind: REGISTRAR_KIND,
    title: '腾讯云域名注册',
    implemented: true,
    actions: REGISTRAR_ACTIONS,
    async list(ctx) {
      const targets = checkTargets(ctx.query)
      if (!targets.length) {
        return { items: [], total: 0, offset: 0, hasMore: false }
      }
      const rows = await Promise.all(targets.map(async (name) => {
        const data = await call<CheckDomainResult>('CheckDomain', {
          DomainName: name,
          Period: '1',
        }, creds(ctx), opts(ctx))
        return mapCheckDomain(
          { ...data, DomainName: data.DomainName || name },
          module.id,
          isSuggestedTarget(ctx.query, name),
        )
      }))
      return {
        items: rows,
        total: rows.length,
        offset: 0,
        hasMore: false,
      }
    },
    async execute(actionId, payload, ctx) {
      try {
        if (actionId === 'templates.list') return await listTemplates(call, ctx)
        if (actionId === 'order.preview') return await previewOrder(call, payload, ctx)
        if (actionId === 'order.create') return await createOrder(call, payload, ctx)
        if (actionId === 'order.status') return await orderStatus(call, payload, ctx)
        return { ok: false, error: `未知动作 ${actionId}` }
      } catch (err) {
        return { ok: false, error: publicErrorMessage(err) }
      }
    },
  }
  return module
}

export function createMyDomainModule(call: typeof domainCall = domainCall): ResourceModule {
  const module: ResourceModule = {
    id: MY_DOMAIN_MODULE_ID,
    provider: 'tencent',
    kind: MY_DOMAIN_KIND,
    title: '腾讯云我的域名',
    implemented: true,
    actions: MY_DOMAIN_ACTIONS,
    async list(ctx) {
      const keyword = normalizeKeyword(ctx.query)
      if (keyword) {
        const data = await listOwnedPages(call, ctx)
        const filtered = filterOwned(data.rows, keyword)
        const start = ctx.offset
        const slice = filtered.slice(start, start + ctx.limit)
        return {
          items: slice.map((item) => mapOwnedDomain(item, module.id)),
          total: filtered.length,
          offset: start,
          hasMore: start + slice.length < filtered.length,
        }
      }
      const data = await call<{ DomainSet?: DomainListRow[]; TotalCount?: number }>('DescribeDomainNameList', {
        Offset: ctx.offset,
        Limit: Math.min(100, Math.max(1, ctx.limit)),
      }, creds(ctx), opts(ctx))
      const raw = data.DomainSet || []
      const total = Number(data.TotalCount ?? raw.length)
      return {
        items: raw.map((item) => mapOwnedDomain(item, module.id)),
        total,
        offset: ctx.offset,
        hasMore: ctx.offset + raw.length < total,
      }
    },
    async detail(ctx) {
      const { domainId } = parseOwnedRef(String(ctx.id || ''))
      const title = String(ctx.title || '').trim()
      const domain = title || domainId
      if (!domain) throw new Error('缺少域名')
      const info = await call<{ DomainInfo?: DomainBaseInfo } & DomainBaseInfo>('DescribeDomainBaseInfo', {
        Domain: domain.includes('.') ? domain : title,
      }, creds(ctx), opts(ctx))
      const base = info.DomainInfo || info
      const name = base.DomainName || title || domain
      const { updateLock, transferLock } = locksFromDomainStatus(base.DomainStatus)
      const dns = nameServerText(base.NameServer)
      let listRow: DomainListRow | undefined
      try {
        listRow = await findOwnedRow(call, name, String(base.DomainId || domainId), ctx)
      } catch {
        listRow = undefined
      }
      const card = mapOwnedDomain({
        DomainId: base.DomainId || listRow?.DomainId || domainId,
        DomainName: name,
        ExpirationDate: base.ExpirationDate || listRow?.ExpirationDate,
        CreationDate: base.CreationDate || listRow?.CreationDate,
        AutoRenew: listRow?.AutoRenew,
        BuyStatus: base.BuyStatus || listRow?.BuyStatus,
        IsPremium: listRow?.IsPremium,
      }, module.id)
      const autoRenew = Number(listRow?.AutoRenew) === 1
      const fields = [
        { label: '域名', value: name },
        { label: '域名 ID', value: String(base.DomainId || listRow?.DomainId || domainId) },
        { label: '状态', value: buyStatusLabel(base.BuyStatus || listRow?.BuyStatus) },
        { label: '实名', value: realNameLabel(base.RealNameAuditStatus) },
        { label: '注册时间', value: base.CreationDate || listRow?.CreationDate || '' },
        { label: '到期时间', value: base.ExpirationDate || listRow?.ExpirationDate || '' },
        { label: '自动续费', value: autoRenew ? '开' : '关' },
        { label: 'DNS', value: dns },
        { label: '禁止更新锁', value: updateLock ? '开' : '关' },
        { label: '禁止转移锁', value: transferLock ? '开' : '关' },
      ].filter((row) => row.value)
      card.extras = {
        ...card.extras,
        domainId: String(base.DomainId || listRow?.DomainId || domainId),
        updateLock,
        transferLock,
        autoRenew,
        dnspodHosted: isDnspodNameServers(base.NameServer),
      }
      return { card, fields }
    },
    async execute(actionId, payload, ctx) {
      try {
        if (actionId === 'autorenew.set') return await setAutoRenew(call, payload, ctx)
        if (actionId === 'lock.update') return await setLock(call, 'UpdateProhibitionBatch', payload, ctx)
        if (actionId === 'lock.transfer') return await setTransferLock(call, payload, ctx)
        return { ok: false, error: `未知动作 ${actionId}` }
      } catch (err) {
        return { ok: false, error: publicErrorMessage(err) }
      }
    },
  }
  return module
}

async function listTemplates(call: typeof domainCall, ctx: ModuleContext) {
  const data = await call<{ TemplateSet?: TemplateInfo[]; TotalCount?: number }>('DescribeTemplateList', {
    Offset: 0,
    Limit: 100,
    Status: 'Approved',
  }, creds(ctx), opts(ctx))
  const templates = approvedTemplates(data.TemplateSet || []).map((item) => ({
    templateId: item.TemplateId || '',
    label: templateLabel(item),
    isDefault: item.IsDefault === true || item.IsDefault === 'yes' || item.IsDefault === '1',
  })).filter((item) => item.templateId)
  if (!templates.length) {
    return { ok: false, error: '没有已实名信息模板。请先到腾讯云控制台「信息模板」完成实名，插件不创建模板。' }
  }
  return { ok: true as const, data: { templates, agreementUrl: AGREEMENT_URL } }
}

async function previewOrder(call: typeof domainCall, payload: Record<string, unknown>, ctx: ModuleContext) {
  const domains = stringList(payload.domains)
  if (!domains.length) return { ok: false, error: '购物车为空，不能提交订单' }
  if (payload.agree !== true && payload.agree !== 'true' && payload.agree !== 1) {
    return { ok: false, error: '未勾选协议，不能提交订单' }
  }
  const period = clampPeriod(Number(payload.period), domains)
  const maxYears = maxPeriodYears(domains)
  if (Number(payload.period) > maxYears) {
    return { ok: false, error: `时长最多 ${maxYears} 年` }
  }
  const checked = await Promise.all(domains.map(async (name) => {
    const data = await call<CheckDomainResult>('CheckDomain', { DomainName: name, Period: String(period) }, creds(ctx), opts(ctx))
    return { name, data: { ...data, DomainName: data.DomainName || name } }
  }))
  for (const row of checked) {
    const kind = availabilityKeyword(row.data)
    if (kind === 'premium') return { ok: false, error: `${row.name} 是溢价词，不可加购` }
    if (kind === 'blocked') return { ok: false, error: `${row.name} 不可加购` }
    if (kind !== 'available') return { ok: false, error: `${row.name} 已被注册` }
  }
  const templates = await listTemplates(call, ctx)
  if (!templates.ok) return templates
  const templateId = String(payload.templateId || '').trim()
  const list = (templates.data?.templates || []) as Array<{ templateId: string; label: string; isDefault?: boolean }>
  const picked = list.find((item) => item.templateId === templateId) || list.find((item) => item.isDefault) || list[0]
  const unit = checked.reduce((sum, row) => sum + Number(row.data.RealPrice ?? row.data.Price ?? 0), 0)
  return {
    ok: true as const,
    data: {
      domains,
      period,
      templateId: picked?.templateId || '',
      templateLabel: picked?.label || '',
      templates: list,
      unitPrice: unit,
      total: unit * period,
      payMode: 1,
      payHint: '将从账户余额扣费',
      autoRenew: payload.autoRenew !== false && payload.autoRenew !== 0 && payload.autoRenew !== '0',
      updateLock: payload.updateLock === true || payload.updateLock === 1 || payload.updateLock === '1',
      transferLock: payload.transferLock === true || payload.transferLock === 1 || payload.transferLock === '1',
      agreementUrl: AGREEMENT_URL,
    },
  }
}

async function createOrder(call: typeof domainCall, payload: Record<string, unknown>, ctx: ModuleContext) {
  const preview = await previewOrder(call, payload, ctx)
  if (!preview.ok) return preview
  const data = (preview.data || {}) as Record<string, unknown>
  const domains = stringList(data.domains)
  const templateId = String(payload.templateId || data.templateId || '').trim()
  if (!templateId) return { ok: false, error: '没有已实名信息模板。请先到腾讯云控制台「信息模板」完成实名，插件不创建模板。' }
  const period = Number(data.period) || 1
  const created = await call<{ LogId?: number }>('CreateDomainBatch', {
    TemplateId: templateId,
    Period: period,
    Domains: domains,
    PayMode: 1,
    AutoRenewFlag: data.autoRenew ? 1 : 0,
    UpdateProhibition: data.updateLock ? 1 : 0,
    TransferProhibition: data.transferLock ? 1 : 0,
  }, creds(ctx), opts(ctx))
  const logId = Number(created.LogId)
  let status = '已提交'
  let raw = 'pending'
  if (Number.isFinite(logId) && logId > 0) {
    const polled = await orderStatus(call, { logId }, ctx)
    if (polled.ok && polled.data) {
      status = String(polled.data.statusLabel || status)
      raw = String(polled.data.status || raw)
    }
  }
  return {
    ok: true as const,
    data: {
      logId: Number.isFinite(logId) ? logId : 0,
      status: raw,
      statusLabel: status,
      payMode: 1,
      domains,
      hint: '可到我的域名卡片刷新查看。注册不是瞬时生效。',
    },
  }
}

async function orderStatus(call: typeof domainCall, payload: Record<string, unknown>, ctx: ModuleContext) {
  const logId = Number(payload.logId)
  if (!Number.isFinite(logId) || logId <= 0) return { ok: false, error: '缺少操作日志' }
  const data = await call<{ StatusSet?: BatchStatusRow[] }>('CheckBatchStatus', {
    LogIds: [logId],
  }, creds(ctx), opts(ctx))
  const row = (data.StatusSet || [])[0] || {}
  const raw = String(row.Status || 'pending')
  const failed = /fail|error/i.test(raw)
  return {
    ok: true as const,
    data: {
      logId,
      status: raw,
      statusLabel: batchStatusLabel(raw),
      failed,
      reason: failed ? '注册失败，原因已脱敏。可到我的域名卡片刷新核对。' : '',
      hint: '可到我的域名卡片刷新查看。',
    },
  }
}

async function findOwnedRow(
  call: typeof domainCall,
  domainName: string,
  domainId: string,
  ctx: ModuleContext,
): Promise<DomainListRow | undefined> {
  const pageSize = 100
  let offset = 0
  let total = Number.POSITIVE_INFINITY
  const name = domainName.toLowerCase()
  while (offset < total) {
    const data = await call<{ DomainSet?: DomainListRow[]; TotalCount?: number }>('DescribeDomainNameList', {
      Offset: offset,
      Limit: pageSize,
    }, creds(ctx), opts(ctx))
    const chunk = data.DomainSet || []
    const found = chunk.find((item) => {
      if (domainId && item.DomainId && item.DomainId === domainId) return true
      return String(item.DomainName || '').toLowerCase() === name
    })
    if (found) return found
    const reported = Number(data.TotalCount)
    total = Number.isFinite(reported) ? reported : offset + chunk.length
    if (!chunk.length) break
    offset += chunk.length
  }
  return undefined
}

async function listOwnedPages(call: typeof domainCall, ctx: ModuleContext): Promise<{ rows: DomainListRow[]; total: number }> {
  const pageSize = 100
  // 防御上限:最多 50 页 / 5000 条,避免上游 TotalCount 异常或翻页口径错位导致死循环
  const maxPages = 50
  const rows: DomainListRow[] = []
  let offset = 0
  let total = Number.POSITIVE_INFINITY
  for (let page = 0; page < maxPages && offset < total; page += 1) {
    const data = await call<{ DomainSet?: DomainListRow[]; TotalCount?: number }>('DescribeDomainNameList', {
      Offset: offset,
      Limit: pageSize,
    }, creds(ctx), opts(ctx))
    const chunk = data.DomainSet || []
    const reported = Number(data.TotalCount)
    total = Number.isFinite(reported) ? reported : offset + chunk.length
    rows.push(...chunk)
    if (!chunk.length) break
    offset += chunk.length
  }
  return { rows, total: Number.isFinite(total) ? total : rows.length }
}

async function describeBaseInfo(call: typeof domainCall, domain: string, ctx: ModuleContext): Promise<DomainBaseInfo> {
  const info = await call<{ DomainInfo?: DomainBaseInfo } & DomainBaseInfo>('DescribeDomainBaseInfo', {
    Domain: domain,
  }, creds(ctx), opts(ctx))
  return info.DomainInfo || info
}

async function setAutoRenew(call: typeof domainCall, payload: Record<string, unknown>, ctx: ModuleContext) {
  const domainId = String(payload.domainId || parseOwnedRef(String(ctx.id || '')).domainId || '').trim()
  if (!domainId) return { ok: false, error: '缺少域名' }
  const on = payload.autoRenew === true || payload.autoRenew === 1 || payload.autoRenew === '1'
  await call('SetDomainAutoRenew', {
    DomainId: domainId,
    AutoRenew: on ? 1 : 2,
  }, creds(ctx), opts(ctx))
  return { ok: true as const, data: { autoRenew: on } }
}

async function setLock(
  call: typeof domainCall,
  action: 'UpdateProhibitionBatch' | 'TransferProhibitionBatch',
  payload: Record<string, unknown>,
  ctx: ModuleContext,
) {
  const domain = String(payload.domain || payload.title || '').trim().toLowerCase()
  if (!domain) return { ok: false, error: '缺少域名' }
  const on = payload.enabled === true || payload.enabled === 1 || payload.enabled === '1'
  const created = await call<{ LogId?: number }>(action, {
    Domains: [domain],
    Status: on,
  }, creds(ctx), opts(ctx))
  return { ok: true as const, data: { logId: created.LogId || 0, enabled: on } }
}

async function setTransferLock(call: typeof domainCall, payload: Record<string, unknown>, ctx: ModuleContext) {
  const domain = String(payload.domain || payload.title || '').trim().toLowerCase()
  if (!domain) return { ok: false, error: '缺少域名' }
  const base = await describeBaseInfo(call, domain, ctx)
  const { updateLock } = locksFromDomainStatus(base.DomainStatus)
  if (updateLock) {
    return { ok: false, error: '更新锁已开，不能改转移锁' }
  }
  return setLock(call, 'TransferProhibitionBatch', payload, ctx)
}

export const tencentRegistrarModule = createRegistrarModule()
export const tencentMyDomainModule = createMyDomainModule()
registerModule(tencentRegistrarModule)
registerModule(tencentMyDomainModule)
