import { publicErrorMessage } from '../../../core/safe-error.js'
import { registerModule } from '../../../core/registry.js'
import type { DnsRecord, ModuleContext, ResourceAction, ResourceCard, ResourceDetail, ResourceModule, ResourceStatus } from '../../../core/types.js'
import { dnspodCall } from '../client.js'

export interface DomainListItem {
  DomainId?: number
  Name?: string
  Status?: string
  DNSStatus?: string
  RecordCount?: number
  GradeTitle?: string
  Remark?: string
  Punycode?: string
  VipEndAt?: string
  CreatedOn?: string
  UpdatedOn?: string
  TTL?: number
  EffectiveDNS?: string[]
}

export interface RecordListItem {
  RecordId?: number
  Name?: string
  Type?: string
  Value?: string
  TTL?: number
  Line?: string
  MX?: number
  Status?: string
  Remark?: string
}

const ACTIONS: ResourceAction[] = [
  {
    id: 'record.create',
    label: '添加记录',
    confirm: 'default',
    fields: [
      { key: 'host', label: '主机', placeholder: '@ 或 www' },
      { key: 'type', label: '类型', placeholder: 'A / CNAME / MX / TXT' },
      { key: 'value', label: '记录值' },
      { key: 'line', label: '线路', placeholder: '默认' },
      { key: 'ttl', label: 'TTL', placeholder: '600' },
    ],
  },
  {
    id: 'record.update',
    label: '修改记录',
    confirm: 'default',
    fields: [
      { key: 'host', label: '主机' },
      { key: 'type', label: '类型' },
      { key: 'value', label: '记录值' },
      { key: 'line', label: '线路', placeholder: '默认' },
      { key: 'ttl', label: 'TTL' },
    ],
  },
  { id: 'record.status', label: '启停记录', confirm: 'default' },
  { id: 'record.delete', label: '删除记录', confirm: 'always' },
]

export function mapDomainStatus(status?: string, dnsStatus?: string): ResourceStatus {
  if (dnsStatus && /error/i.test(dnsStatus)) return 'error'
  const value = String(status || '').toUpperCase()
  if (value === 'ENABLE') return 'enable'
  if (value === 'PAUSE' || value === 'DISABLE') return 'pause'
  if (value === 'DNSERROR') return 'error'
  return 'unknown'
}

export function mapDomainItem(item: DomainListItem, moduleId = 'tencent.domain'): ResourceCard {
  const domainId = String(item.DomainId ?? '')
  const title = item.Name || item.Punycode || domainId
  const recordCount = item.RecordCount ?? 0
  const status = mapDomainStatus(item.Status, item.DNSStatus)
  const grade = item.GradeTitle || '-'
  const badges = [item.GradeTitle, recordCount ? `${recordCount} 条记录` : ''].filter(Boolean) as string[]
  const description = [item.Remark, statusLabel(status), item.DNSStatus && item.DNSStatus !== 'ENABLE' ? item.DNSStatus : '']
    .filter(Boolean)
    .join(' · ')
  return {
    id: `${moduleId}:${domainId}`,
    moduleId,
    provider: 'tencent',
    kind: 'domain',
    title,
    description: description || title,
    status,
    badges,
    columns: [
      { label: 'DNS状态', value: dnsStatusLabel(item.DNSStatus) },
      { label: '套餐', value: grade },
      { label: '记录数', value: String(recordCount) },
    ],
    openLabel: '解析',
    expiresAt: item.VipEndAt || undefined,
  }
}

export function mapRecordItem(item: RecordListItem): DnsRecord {
  return {
    id: String(item.RecordId ?? ''),
    host: item.Name || '@',
    type: item.Type || '',
    value: item.Value || '',
    ttl: item.TTL,
    line: item.Line,
    mx: item.MX,
    status: String(item.Status || '').toLowerCase(),
    remark: item.Remark || undefined,
  }
}

export function parseDomainRef(id: string): { domainId: number; moduleId: string } {
  const idx = id.lastIndexOf(':')
  const domainId = Number(idx >= 0 ? id.slice(idx + 1) : id)
  const moduleId = idx >= 0 ? id.slice(0, idx) : 'tencent.domain'
  return { domainId, moduleId }
}

export function createDomainModule(call: typeof dnspodCall = dnspodCall): ResourceModule {
  const module: ResourceModule = {
    id: 'tencent.domain',
    provider: 'tencent',
    kind: 'domain',
    title: '腾讯云域名',
    implemented: true,
    actions: ACTIONS,
    async list(ctx) {
      const data = await call<{
        DomainList?: DomainListItem[]
        DomainCountInfo?: { DomainTotal?: number; AllTotal?: number }
      }>('DescribeDomainList', {
        Type: 'ALL',
        Keyword: ctx.query || undefined,
        Offset: ctx.offset,
        Limit: ctx.limit,
      }, creds(ctx), opts(ctx))
      const raw = data.DomainList || []
      const items = raw.map((item) => mapDomainItem(item, module.id))
      const counts = data.DomainCountInfo || {}
      const rawTotal = ctx.query ? counts.DomainTotal : (counts.AllTotal ?? counts.DomainTotal)
      const total = Number.isFinite(Number(rawTotal)) ? Number(rawTotal) : items.length
      return {
        items,
        total,
        offset: ctx.offset,
        hasMore: ctx.offset + items.length < total,
      }
    },
    async detail(ctx) {
      const { domainId } = parseDomainRef(String(ctx.id || ''))
      const domainName = String(ctx.title || '').trim()
      if (!domainName && !(Number.isFinite(domainId) && domainId > 0)) throw new Error('缺少域名')
      const lookup: Record<string, unknown> = {}
      if (domainName) lookup.Domain = domainName
      if (Number.isFinite(domainId) && domainId > 0) lookup.DomainId = domainId
      const info = await call<{ DomainInfo?: DomainListItem & { Name?: string } }>('DescribeDomain', lookup, creds(ctx), opts(ctx))
      const domain = info.DomainInfo || { DomainId: domainId || undefined, Name: domainName }
      const name = domain.Name || domainName || String(domainId)
      const records = await call<{ RecordList?: RecordListItem[] }>('DescribeRecordList', {
        Domain: name,
        ...(Number.isFinite(domainId) && domainId > 0 ? { DomainId: domainId } : {}),
        ErrorOnEmpty: 'no',
        Limit: 3000,
      }, creds(ctx), opts(ctx)).catch(() => ({ RecordList: [] as RecordListItem[] }))
      const card = mapDomainItem(domain, module.id)
      const fields = [
        { label: '域名', value: domain.Name || card.title },
        { label: '域名 ID', value: String(domain.DomainId ?? (domainId || '')) },
        { label: '状态', value: domain.Status || '' },
        { label: 'DNS 状态', value: domain.DNSStatus || '' },
        { label: '套餐', value: domain.GradeTitle || '' },
        { label: '记录数', value: String(domain.RecordCount ?? records.RecordList?.length ?? '') },
        { label: '备注', value: domain.Remark || '' },
        { label: 'DNS', value: (domain.EffectiveDNS || []).join(' ') },
        { label: 'TTL', value: domain.TTL != null ? String(domain.TTL) : '' },
        { label: '创建时间', value: domain.CreatedOn || '' },
      ].filter((row) => row.value)
      return {
        card,
        fields,
        records: (records.RecordList || []).map(mapRecordItem),
      }
    },
    async execute(actionId, payload, ctx) {
      const domain = String(payload.domain || '').trim()
      const domainId = Number(payload.domainId || parseDomainRef(String(ctx.id || '')).domainId)
      if (!domain && !domainId) return { ok: false, error: '缺少域名' }
      const base: Record<string, unknown> = {}
      if (domain) base.Domain = domain
      if (Number.isFinite(domainId) && domainId > 0) base.DomainId = domainId
      try {
        if (actionId === 'record.create') {
          await call('CreateRecord', {
            ...base,
            SubDomain: String(payload.host || '@').trim() || '@',
            RecordType: String(payload.type || 'A').trim().toUpperCase(),
            RecordLine: String(payload.line || '默认').trim() || '默认',
            Value: String(payload.value || '').trim(),
            ...optionalTtlMx(payload),
          }, creds(ctx), opts(ctx))
          return { ok: true }
        }
        if (actionId === 'record.update') {
          const recordId = Number(payload.recordId)
          if (!recordId) return { ok: false, error: '缺少记录 id' }
          await call('ModifyRecord', {
            ...base,
            RecordId: recordId,
            SubDomain: String(payload.host || '@').trim() || '@',
            RecordType: String(payload.type || 'A').trim().toUpperCase(),
            RecordLine: String(payload.line || '默认').trim() || '默认',
            Value: String(payload.value || '').trim(),
            ...optionalTtlMx(payload),
          }, creds(ctx), opts(ctx))
          return { ok: true }
        }
        if (actionId === 'record.delete') {
          const recordId = Number(payload.recordId)
          if (!recordId) return { ok: false, error: '缺少记录 id' }
          await call('DeleteRecord', { ...base, RecordId: recordId }, creds(ctx), opts(ctx))
          return { ok: true }
        }
        if (actionId === 'record.status') {
          const recordId = Number(payload.recordId)
          if (!recordId) return { ok: false, error: '缺少记录 id' }
          const status = String(payload.status || '').toUpperCase() === 'ENABLE' ? 'ENABLE' : 'DISABLE'
          await call('ModifyRecordStatus', { ...base, RecordId: recordId, Status: status }, creds(ctx), opts(ctx))
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

function creds(ctx: ModuleContext): { secretId: string; secretKey: string } {
  return { secretId: ctx.creds.secretId, secretKey: ctx.creds.secretKey }
}

function opts(ctx: ModuleContext): { timeoutMs: number; signal?: AbortSignal } {
  return { timeoutMs: ctx.timeoutMs, signal: ctx.signal }
}

function optionalTtlMx(payload: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {}
  const ttl = Number(payload.ttl)
  if (Number.isFinite(ttl) && ttl > 0) out.TTL = ttl
  const mx = Number(payload.mx)
  if (Number.isFinite(mx) && mx > 0) out.MX = mx
  return out
}

function statusLabel(status: ResourceStatus): string {
  if (status === 'enable') return '已启用'
  if (status === 'pause') return '已暂停'
  if (status === 'error') return 'DNS 异常'
  return ''
}

function dnsStatusLabel(dns?: string): string {
  if (!dns || String(dns).toUpperCase() === 'ENABLE') return '正常'
  if (/error/i.test(String(dns))) return '异常'
  return String(dns)
}

export const tencentDomainModule = createDomainModule()
registerModule(tencentDomainModule)
