import { X509Certificate } from 'node:crypto'
import { publicErrorMessage } from '../../../core/safe-error.js'
import { registerModule } from '../../../core/registry.js'
import type {
  DetailSection,
  ModuleContext,
  ResourceAction,
  ResourceCard,
  ResourceDetail,
  ResourceModule,
  ResourceStatus,
} from '../../../core/types.js'
import { sslCall } from '../client.js'

export type SslCall = typeof sslCall

export interface CertificatesItem {
  CertificateId?: string
  Domain?: string
  Alias?: string
  Status?: number
  StatusName?: string
  StatusMsg?: string
  CertificateType?: string
  ProductZhName?: string
  PackageType?: string
  PackageTypeName?: string
  From?: string
  CertBeginTime?: string
  CertEndTime?: string
  ValidityPeriod?: string
  InsertTime?: string
  Deployable?: boolean
  RenewAble?: boolean
  AllowDownload?: boolean
  IsDv?: boolean
  IsWildcard?: boolean
  IsSM?: boolean
  VerifyType?: string
  SubjectAltName?: string[]
  CertSANs?: string[]
  BoundResource?: string[]
  ProjectInfo?: { ProjectName?: string; ProjectId?: string }
  ProjectId?: string
  EncryptAlgorithm?: string
  DVAuthDeadline?: string
  Certificate?: string
  CertificatePrivateKey?: string
}

export interface DvAuthDetail {
  DvAuthKey?: string
  DvAuthValue?: string
  DvAuthDomain?: string
  DvAuthPath?: string
  DvAuthKeySubDomain?: string
  DvAuths?: Array<{
    DvAuthKey?: string
    DvAuthValue?: string
    DvAuthDomain?: string
    DvAuthPath?: string
    DvAuthSubDomain?: string
    DvAuthVerifyType?: string
  }>
}

export interface CertificateDetailRaw extends CertificatesItem {
  DvAuthDetail?: DvAuthDetail
  SubmittedData?: { Csr?: string }
}

export const CERT_STATUS = {
  reviewing: 0,
  issued: 1,
  failed: 2,
  expired: 3,
  dnsAdded: 4,
  enterprisePending: 5,
  cancelling: 6,
  cancelled: 7,
  docsSubmitted: 8,
  revokePending: 9,
  revoked: 10,
  replacing: 11,
  revokeLetter: 12,
  freePending: 13,
  refunded: 14,
  migrating: 15,
} as const

export const GROUP_STATUSES: Record<string, number[]> = {
  applying: [0, 2, 4, 5, 6, 8, 9, 11, 12, 13],
  issued: [1],
  expired: [3],
}

export const HOST_PRODUCTS: Array<{ id: string; label: string; action: string }> = [
  { id: 'clb', label: 'CLB', action: 'DescribeHostClbInstanceList' },
  { id: 'cdn', label: 'CDN', action: 'DescribeHostCdnInstanceList' },
  { id: 'waf', label: 'WAF', action: 'DescribeHostWafInstanceList' },
  { id: 'teo', label: 'EdgeOne', action: 'DescribeHostTeoInstanceList' },
  { id: 'cos', label: 'COS', action: 'DescribeHostCosInstanceList' },
  { id: 'tke', label: 'TKE', action: 'DescribeHostTkeInstanceList' },
  { id: 'live', label: 'LIVE', action: 'DescribeHostLiveInstanceList' },
  { id: 'vod', label: 'VOD', action: 'DescribeHostVodInstanceList' },
  { id: 'ddos', label: 'DDoS', action: 'DescribeHostDdosInstanceList' },
  { id: 'lighthouse', label: 'Lighthouse', action: 'DescribeHostLighthouseInstanceList' },
  { id: 'tcb', label: 'TCB', action: 'DescribeHostTcbInstanceList' },
  { id: 'apigateway', label: 'API 网关', action: 'DescribeHostApiGatewayInstanceList' },
]

const PEM_RE = /-----BEGIN [A-Z0-9 ]+-----[\s\S]*?-----END [A-Z0-9 ]+-----/g
const SECRET_KEYS = /^(Certificate|CertificatePrivateKey|CertificatePublicKey|CertificateEncryptPublicKey|CertificateEncryptPrivateKey|PrivateKey|PublicKey|Csr|Content|CertificateEncryptCert)$/i

const ACTIONS: ResourceAction[] = [
  { id: 'cert.apply', label: '申请免费证书', confirm: 'default' },
  { id: 'cert.upload', label: '上传证书', confirm: 'default' },
  { id: 'cert.deploy', label: '部署', confirm: 'default' },
  { id: 'cert.hosts', label: '匹配实例', confirm: 'default' },
  { id: 'cert.deploy.records', label: '部署记录', confirm: 'default' },
  { id: 'cert.deploy.retry', label: '重试部署', confirm: 'default' },
  { id: 'cert.download', label: '下载', confirm: 'default' },
  { id: 'cert.revoke', label: '吊销', confirm: 'always' },
  { id: 'cert.replace', label: '重颁发', confirm: 'always' },
  { id: 'cert.delete', label: '删除', confirm: 'always' },
  { id: 'cert.cancel', label: '取消审核', confirm: 'always' },
  { id: 'cert.renew', label: '快速续期', confirm: 'default' },
  { id: 'cert.verify', label: '查看验证状态', confirm: 'default' },
]

export function parseCertRef(id: string): { certificateId: string; moduleId: string } {
  const idx = id.lastIndexOf(':')
  const certificateId = idx >= 0 ? id.slice(idx + 1) : id
  const moduleId = idx >= 0 ? id.slice(0, idx) : 'tencent.cert'
  return { certificateId, moduleId }
}

export function mapCertStatus(status?: number): ResourceStatus {
  if (status === CERT_STATUS.issued) return 'enable'
  if (status === CERT_STATUS.expired || status === CERT_STATUS.failed) return 'error'
  if (status === CERT_STATUS.revoked || status === CERT_STATUS.cancelled) return 'pause'
  return 'unknown'
}

export function sourceLabel(from?: string): string {
  const value = String(from || '').toLowerCase()
  if (value === 'upload') return '用户上传'
  if (value === 'trustasia' || value === 'buy') return '腾讯云申请'
  if (value === 'wosign') return '沃通'
  if (value === 'sheca') return '上海 CA'
  return from || ''
}

export function typeLabel(type?: string): string {
  const value = String(type || '').toUpperCase()
  if (value === 'CA') return 'CA'
  if (value === 'SVR' || value === 'SERVER') return '服务端 SVR'
  return type || ''
}

export function statusNameOf(item: CertificatesItem): string {
  if (item.StatusName) return item.StatusName
  const map: Record<number, string> = {
    0: '审核中',
    1: '已签发',
    2: '审核失败',
    3: '已过期',
    4: '已添加 DNS 记录',
    5: '待提交',
    6: '订单取消中',
    7: '已取消审核',
    8: '已提交资料',
    9: '证书吊销中',
    10: '已吊销',
    11: '重颁发中',
    12: '待上传吊销确认函',
    13: '待提交资料',
    14: '已退款',
    15: '迁移中',
  }
  return map[item.Status ?? -1] || String(item.Status ?? '')
}

export function verifyTypeLabel(value?: string): string {
  const raw = String(value || '').toUpperCase()
  if (raw === 'DNS_AUTO') return '自动 DNS'
  if (raw === 'DNS') return '手动 DNS'
  if (raw === 'FILE') return '文件验证'
  return value || ''
}

export function isFreeDomainValid(domain: string): string {
  const name = domain.trim().toLowerCase()
  if (!name) return '缺少绑定域名'
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(name)) return '免费证书仅支持单域名，不支持 IP 与泛域名'
  if (name.includes('*')) return '免费证书仅支持单域名，不支持 IP 与泛域名'
  return ''
}

export function daysUntil(date?: string): number | null {
  if (!date) return null
  const ts = Date.parse(date.replace(' ', 'T'))
  if (!Number.isFinite(ts)) return null
  return Math.ceil((ts - Date.now()) / 86400000)
}

export function canDeploy(item: CertificatesItem): boolean {
  return item.Status === CERT_STATUS.issued && item.Deployable !== false
}

export function canDownload(item: CertificatesItem): boolean {
  if (item.AllowDownload === false) return false
  return item.Status === CERT_STATUS.issued || item.Status === CERT_STATUS.expired
}

export function canRenew(item: CertificatesItem, now = Date.now()): boolean {
  if (!item.RenewAble || item.IsDv === false) return false
  if (item.Status !== CERT_STATUS.issued) return false
  const days = daysUntil(item.CertEndTime)
  if (days == null) return false
  const skew = Math.abs(now - Date.now()) < 2000 ? 0 : now - Date.now()
  return days - Math.round(skew / 86400000) <= 30 && days >= 0
}

export function canDeleteDirectly(status?: number): boolean {
  return status === CERT_STATUS.expired
    || status === CERT_STATUS.revoked
    || status === CERT_STATUS.cancelled
}

export function needsCancelBeforeDelete(status?: number): boolean {
  return status === CERT_STATUS.reviewing
    || status === CERT_STATUS.dnsAdded
    || status === CERT_STATUS.failed
    || status === CERT_STATUS.enterprisePending
    || status === CERT_STATUS.docsSubmitted
    || status === CERT_STATUS.freePending
}

export function sansOf(item: CertificatesItem): string[] {
  const raw = [...(item.SubjectAltName || []), ...(item.CertSANs || [])]
    .map((name) => String(name || '').trim())
    .filter(Boolean)
  return [...new Set(raw)]
}

export function looksLikePem(value: unknown): boolean {
  return typeof value === 'string' && /-----BEGIN /i.test(value)
}

export function stripPem<T>(value: T): T {
  if (value == null) return value
  if (typeof value === 'string') {
    if (looksLikePem(value)) return '' as T
    return value.replace(PEM_RE, '') as T
  }
  if (Array.isArray(value)) return value.map((item) => stripPem(item)) as T
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEYS.test(key) || looksLikePem(item)) continue
      out[key] = stripPem(item)
    }
    return out as T
  }
  return value
}

export function chainSummary(pem?: string): { issuer: string; subject: string; fingerprint: string; validFrom: string; validTo: string } | null {
  if (!pem || !looksLikePem(pem)) return null
  try {
    const cert = new X509Certificate(pem)
    return {
      issuer: compactDn(cert.issuer),
      subject: compactDn(cert.subject),
      fingerprint: cert.fingerprint256.replace(/:/g, '').toLowerCase(),
      validFrom: cert.validFrom,
      validTo: cert.validTo,
    }
  } catch {
    return null
  }
}

export function compactDn(dn: string): string {
  const cn = dn.split(/\n/).map((part) => part.trim()).find((part) => /^CN=/i.test(part))
  return cn ? cn.replace(/^CN=/i, '') : dn.replace(/\n/g, ', ')
}

export function mapCertItem(item: CertificatesItem, moduleId = 'tencent.cert'): ResourceCard {
  const certificateId = String(item.CertificateId || '')
  const domain = item.Domain || ''
  const alias = item.Alias || ''
  const product = item.ProductZhName || item.PackageTypeName || ''
  const type = typeLabel(item.CertificateType)
  const statusName = statusNameOf(item)
  const validTo = item.CertEndTime || ''
  return {
    id: `${moduleId}:${certificateId}`,
    moduleId,
    provider: 'tencent',
    kind: 'cert',
    title: certificateId || domain || '证书',
    description: [domain, alias, statusName].filter(Boolean).join(' · '),
    status: mapCertStatus(item.Status),
    badges: [product, statusName].filter(Boolean),
    columns: [
      { label: '证书 ID', value: certificateId },
      { label: '绑定域名', value: domain || '—' },
      { label: '备注', value: alias || '—' },
      { label: '类型/品牌', value: [type, product].filter(Boolean).join(' · ') || '—' },
      { label: '状态', value: statusName || '—' },
      { label: '有效期', value: validTo || '—' },
    ],
    openLabel: '详情',
    expiresAt: validTo || undefined,
    meta: {
      certificateId,
      domain,
      alias,
      status: item.Status ?? '',
      statusName,
      statusMsg: item.StatusMsg || '',
      certificateType: item.CertificateType || '',
      productName: product,
      source: sourceLabel(item.From),
      validFrom: item.CertBeginTime || '',
      validTo,
      deployable: canDeploy(item),
      downloadable: canDownload(item),
      renewable: canRenew(item),
      cancelable: needsCancelBeforeDelete(item.Status),
      deleteDirect: canDeleteDirectly(item.Status),
      verifyType: item.VerifyType || '',
    },
  }
}

export function buildCertSections(input: {
  item: CertificateDetailRaw
  chain?: { issuer: string; subject: string; fingerprint: string; validFrom: string; validTo: string } | null
  bound?: Array<{ resourceType: string; instanceId: string }>
}): DetailSection[] {
  const { item, chain, bound } = input
  const status = item.Status
  const applying = GROUP_STATUSES.applying.includes(status ?? -1)
  const issued = status === CERT_STATUS.issued
  const sans = sansOf(item)
  const basic: DetailSection = {
    id: 'basic',
    title: '基本信息',
    fields: [
      { label: '证书 ID', value: item.CertificateId || '' },
      { label: '备注', value: item.Alias || '—' },
      { label: '证书类型', value: typeLabel(item.CertificateType) || '—' },
      { label: '品牌', value: item.ProductZhName || item.PackageTypeName || '—' },
      { label: '状态', value: statusNameOf(item) || '—' },
      { label: '状态说明', value: item.StatusMsg || '—' },
      { label: '来源', value: sourceLabel(item.From) || '—' },
      { label: '项目', value: item.ProjectInfo?.ProjectName || item.ProjectId || '—' },
      { label: '是否可部署', value: item.Deployable === false ? '否' : '是' },
      { label: '申请时间', value: item.InsertTime || '—' },
      { label: '生效时间', value: item.CertBeginTime || '—' },
      { label: '过期时间', value: item.CertEndTime || '—' },
      { label: '有效期（月）', value: item.ValidityPeriod ? `${item.ValidityPeriod}` : '—' },
    ],
  }
  const domains: DetailSection = {
    id: 'domains',
    title: '域名信息',
    fields: [
      { label: '绑定域名', value: item.Domain || '—' },
      { label: 'SAN', value: sans.filter((name) => name !== item.Domain).join(', ') || '—' },
      { label: '泛域名', value: item.IsWildcard ? '是' : '否' },
    ],
  }
  const sections = [basic, domains]
  if (applying) {
    const auth = item.DvAuthDetail || {}
    const rows = (auth.DvAuths || []).map((row) => ({
      label: verifyTypeLabel(row.DvAuthVerifyType || item.VerifyType) || '验证',
      value: [row.DvAuthDomain || row.DvAuthSubDomain, row.DvAuthKey, row.DvAuthValue, row.DvAuthPath].filter(Boolean).join(' · ') || '—',
    }))
    sections.push({
      id: 'validation',
      title: '域名验证',
      fields: [
        { label: '验证方式', value: verifyTypeLabel(item.VerifyType) || '—' },
        { label: '主机记录', value: auth.DvAuthKey || auth.DvAuthKeySubDomain || '—' },
        { label: '记录值', value: auth.DvAuthValue || '—' },
        { label: '验证域名', value: auth.DvAuthDomain || '—' },
        { label: '文件路径', value: auth.DvAuthPath || '—' },
        { label: '截止时间', value: item.DVAuthDeadline || '—' },
      ],
      rows: rows.length ? rows : undefined,
    })
  }
  if (issued || chain) {
    sections.push({
      id: 'chain',
      title: '证书链摘要',
      fields: chain
        ? [
          { label: '颁发者', value: chain.issuer || '—' },
          { label: '颁发给', value: chain.subject || '—' },
          { label: '指纹', value: chain.fingerprint || '—' },
          { label: '链有效期', value: [chain.validFrom, chain.validTo].filter(Boolean).join(' ~ ') || '—' },
        ]
        : [{ label: '摘要', value: '暂无' }],
      empty: chain ? undefined : '暂无',
    })
  }
  sections.push({
    id: 'bound',
    title: '关联云资源',
    fields: (bound && bound.length)
      ? bound.map((row) => ({ label: row.resourceType.toUpperCase(), value: row.instanceId || '—' }))
      : undefined,
    empty: '暂无',
  })
  return stripPem(sections)
}

export function createCertModule(call: SslCall = sslCall): ResourceModule {
  const module: ResourceModule = {
    id: 'tencent.cert',
    provider: 'tencent',
    kind: 'cert',
    title: '腾讯云证书',
    implemented: true,
    actions: ACTIONS,
    async list(ctx) {
      const statuses = GROUP_STATUSES[ctx.group || '']
      const data = await call<{ Certificates?: CertificatesItem[]; TotalCount?: number }>('DescribeCertificates', {
        SearchKey: ctx.query || undefined,
        Offset: ctx.offset,
        Limit: ctx.limit,
        ...(statuses ? { CertificateStatus: statuses } : {}),
      }, creds(ctx), opts(ctx))
      const raw = data.Certificates || []
      const items = raw.map((item) => mapCertItem(item, module.id))
      const total = Number.isFinite(Number(data.TotalCount)) ? Number(data.TotalCount) : items.length
      return {
        items,
        total,
        offset: ctx.offset,
        hasMore: ctx.offset + items.length < total,
      }
    },
    async detail(ctx) {
      return loadDetail(call, module.id, ctx)
    },
    async execute(actionId, payload, ctx) {
      const certificateId = String(payload.certificateId || parseCertRef(String(ctx.id || '')).certificateId).trim()
      try {
        if (actionId === 'cert.apply' || actionId === 'cert.renew') {
          const domain = String(payload.domain || payload.DomainName || '').trim()
          const invalid = isFreeDomainValid(domain)
          if (invalid) return { ok: false, error: invalid }
          const alias = String(payload.alias || '').trim()
          if (alias.length > 200) return { ok: false, error: '备注名不能超过 200 字' }
          const method = normalizeVerify(String(payload.verifyType || payload.DvAuthMethod || 'DNS_AUTO'))
          const algo = String(payload.algorithm || payload.CsrEncryptAlgo || 'RSA').trim().toUpperCase() || 'RSA'
          const data = await call<{ CertificateId?: string }>('ApplyCertificate', {
            DvAuthMethod: method,
            DomainName: domain,
            PackageType: '83',
            Alias: alias || undefined,
            CsrEncryptAlgo: algo,
            ...(actionId === 'cert.renew' || payload.oldCertificateId
              ? { OldCertificateId: String(payload.oldCertificateId || certificateId) }
              : {}),
          }, creds(ctx), opts(ctx))
          return { ok: true, data: { certificateId: data.CertificateId || '' } }
        }
        if (actionId === 'cert.upload') {
          const pub = String(payload.publicKey || payload.CertificatePublicKey || '').trim()
          const priv = String(payload.privateKey || payload.CertificatePrivateKey || '').trim()
          const type = String(payload.certificateType || payload.CertificateType || 'SVR').trim().toUpperCase() || 'SVR'
          const sm = String(payload.standard || '').toLowerCase() === 'sm2' || payload.isSM === true
          if (!pub) return { ok: false, error: '缺少签名证书' }
          if (type !== 'CA' && !priv) return { ok: false, error: '服务端证书需要签名私钥' }
          const encryptPub = String(payload.encryptPublicKey || payload.CertificateEncryptPublicKey || '').trim()
          const encryptPriv = String(payload.encryptPrivateKey || payload.CertificateEncryptPrivateKey || '').trim()
          if (sm && (!encryptPub || !encryptPriv)) return { ok: false, error: '国密证书还需填写加密证书与加密私钥' }
          const data = await call<{ CertificateId?: string }>('UploadCertificate', {
            CertificatePublicKey: pub,
            ...(priv ? { CertificatePrivateKey: priv } : {}),
            CertificateType: type,
            Alias: String(payload.alias || '').trim() || undefined,
            Repeatable: true,
            ...(sm ? {
              CertificateEncryptPublicKey: encryptPub,
              CertificateEncryptPrivateKey: encryptPriv,
            } : {}),
          }, creds(ctx), opts(ctx))
          return { ok: true, data: { certificateId: data.CertificateId || '' } }
        }
        if (!certificateId) return { ok: false, error: '缺少证书 ID' }
        if (actionId === 'cert.download') {
          const data = await call<{ Content?: string; ContentType?: string }>('DownloadCertificate', {
            CertificateId: certificateId,
          }, creds(ctx), opts(ctx))
          return {
            ok: true,
            data: {
              filename: `${certificateId}.zip`,
              contentType: data.ContentType || 'application/zip',
              content: data.Content || '',
            },
          }
        }
        if (actionId === 'cert.hosts') {
          const resourceType = String(payload.resourceType || 'cdn').trim().toLowerCase()
          const product = HOST_PRODUCTS.find((item) => item.id === resourceType)
          if (!product) return { ok: false, error: '不支持的云产品' }
          const data = await call<Record<string, unknown>>(product.action, {
            CertificateId: certificateId,
            Offset: Number(payload.offset) || 0,
            Limit: Number(payload.limit) || 50,
          }, creds(ctx), opts(ctx))
          return { ok: true, data: { resourceType, instances: normalizeHostInstances(resourceType, data) } }
        }
        if (actionId === 'cert.deploy') {
          const resourceType = String(payload.resourceType || '').trim().toLowerCase()
          const instanceIds = asStringList(payload.instanceIds || payload.InstanceIdList)
          if (!resourceType) return { ok: false, error: '缺少云产品' }
          if (!instanceIds.length) return { ok: false, error: '请勾选匹配实例' }
          const data = await call<{ DeployRecordId?: number; TaskId?: number }>('DeployCertificateInstance', {
            CertificateId: certificateId,
            InstanceIdList: instanceIds,
            ResourceType: resourceType,
          }, creds(ctx), opts(ctx))
          return { ok: true, data: { deployRecordId: data.DeployRecordId ?? data.TaskId ?? '' } }
        }
        if (actionId === 'cert.deploy.records') {
          const data = await call<{ DeployRecordList?: Array<Record<string, unknown>>; TotalCount?: number }>('DescribeHostDeployRecord', {
            CertificateId: certificateId,
            Offset: Number(payload.offset) || 0,
            Limit: Number(payload.limit) || 50,
            ResourceType: payload.resourceType ? String(payload.resourceType) : undefined,
          }, creds(ctx), opts(ctx))
          return {
            ok: true,
            data: {
              records: (data.DeployRecordList || []).map(mapDeployRecord),
              total: Number(data.TotalCount) || 0,
            },
          }
        }
        if (actionId === 'cert.deploy.retry') {
          const recordId = Number(payload.deployRecordId || payload.DeployRecordId)
          if (!recordId) return { ok: false, error: '缺少部署记录' }
          await call('DeployCertificateRecordRetry', { DeployRecordId: recordId }, creds(ctx), opts(ctx))
          return { ok: true }
        }
        if (actionId === 'cert.revoke') {
          await call('RevokeCertificate', {
            CertificateId: certificateId,
            Reason: String(payload.reason || '用户在对话内确认吊销'),
          }, creds(ctx), opts(ctx))
          return { ok: true }
        }
        if (actionId === 'cert.replace') {
          await call('ReplaceCertificate', {
            CertificateId: certificateId,
            ValidType: normalizeVerify(String(payload.verifyType || payload.ValidType || 'DNS_AUTO')),
            CsrType: String(payload.csrType || 'Original'),
            Reason: String(payload.reason || ''),
          }, creds(ctx), opts(ctx))
          return { ok: true }
        }
        if (actionId === 'cert.delete') {
          await call('DeleteCertificate', { CertificateId: certificateId }, creds(ctx), opts(ctx))
          return { ok: true }
        }
        if (actionId === 'cert.cancel') {
          await call('CancelCertificateOrder', { CertificateId: certificateId }, creds(ctx), opts(ctx)).catch(async () => {
            await call('CancelAuditCertificate', { CertificateId: certificateId }, creds(ctx), opts(ctx))
          })
          return { ok: true }
        }
        if (actionId === 'cert.verify') {
          const data = await call<Record<string, unknown>>('CheckCertificateDomainVerification', {
            CertificateId: certificateId,
          }, creds(ctx), opts(ctx))
          return { ok: true, data: stripPem(data) as Record<string, unknown> }
        }
        return { ok: false, error: `未知动作 ${actionId}` }
      } catch (err) {
        return { ok: false, error: publicErrorMessage(err) }
      }
    },
  }
  return module
}

async function loadDetail(call: SslCall, moduleId: string, ctx: ModuleContext): Promise<ResourceDetail> {
  const certificateId = parseCertRef(String(ctx.id || ctx.title || '')).certificateId || String(ctx.title || '').trim()
  if (!certificateId) throw new Error('缺少证书 ID')
  const detail = await call<CertificateDetailRaw>('DescribeCertificateDetail', {
    CertificateId: certificateId,
  }, creds(ctx), opts(ctx)).catch(async () => call<CertificateDetailRaw>('DescribeCertificate', {
    CertificateId: certificateId,
  }, creds(ctx), opts(ctx)))
  const raw = { ...detail, CertificateId: detail.CertificateId || certificateId }
  let pem = typeof raw.Certificate === 'string' ? raw.Certificate : ''
  if (!pem && raw.Status === CERT_STATUS.issued) {
    const extra = await call<CertificateDetailRaw>('DescribeCertificate', {
      CertificateId: certificateId,
    }, creds(ctx), opts(ctx)).catch(() => null)
    pem = extra && typeof extra.Certificate === 'string' ? extra.Certificate : ''
  }
  const chain = chainSummary(pem)
  const bound = await loadBound(call, certificateId, raw, ctx)
  const card = mapCertItem(stripPem(raw), moduleId)
  const sections = buildCertSections({ item: raw, chain, bound })
  const fields = sections.flatMap((section) => section.fields || [])
  const safe: ResourceDetail = stripPem({
    card,
    fields,
    sections,
  })
  assertNoPem(safe)
  return safe
}

async function loadBound(
  call: SslCall,
  certificateId: string,
  raw: CertificatesItem,
  ctx: ModuleContext,
): Promise<Array<{ resourceType: string; instanceId: string }>> {
  const types = HOST_PRODUCTS.map((item) => item.id)
  const rows: Array<{ resourceType: string; instanceId: string }> = []
  await Promise.all(types.map(async (resourceType) => {
    try {
      const data = await call<{
        DeployedResources?: Array<{ ResourceType?: string; ResourceIdList?: string[]; Domain?: string }>
      }>('DescribeDeployedResources', { CertificateId: certificateId, ResourceType: resourceType }, creds(ctx), opts(ctx))
      for (const item of data.DeployedResources || []) {
        const ids = item.ResourceIdList?.filter(Boolean) || (item.Domain ? [item.Domain] : [])
        for (const instanceId of ids) rows.push({ resourceType: item.ResourceType || resourceType, instanceId })
      }
    } catch {
      /* product may be unauthorized; fall back below */
    }
  }))
  if (!rows.length) {
    for (const instanceId of raw.BoundResource || []) {
      if (instanceId) rows.push({ resourceType: 'bound', instanceId })
    }
  }
  return rows
}

export function normalizeHostInstances(resourceType: string, data: Record<string, unknown>): Array<{
  resourceType: string
  instanceId: string
  name: string
  domain: string
  matched: boolean
}> {
  const list = firstArray(data, [
    'InstanceList',
    'CdnInstanceList',
    'ClbInstanceList',
    'WafInstanceList',
    'TeoInstanceList',
    'CosInstanceList',
    'TkeInstanceList',
    'LiveInstanceList',
    'VodInstanceList',
    'DdosInstanceList',
    'LighthouseInstanceList',
    'TcbInstanceList',
    'ApiGatewayInstanceList',
  ])
  return list.map((row) => {
    const rec = row as Record<string, unknown>
    const domain = String(rec.Domain || rec.DomainName || '')
    const name = String(rec.InstanceName || rec.Name || rec.Alias || domain || rec.InstanceId || '')
    const instanceId = deployKey(resourceType, rec)
    return { resourceType, instanceId, name, domain, matched: true }
  }).filter((row) => row.instanceId)
}

function deployKey(resourceType: string, rec: Record<string, unknown>): string {
  const preset = String(rec.InstanceId || rec.DeployInstanceId || rec.Id || '')
  if (preset.includes('|')) return preset
  if (resourceType === 'cdn') {
    const domain = String(rec.Domain || rec.DomainName || preset)
    return domain ? `${domain}|off` : ''
  }
  if (resourceType === 'clb') {
    const lb = String(rec.LoadBalancerId || rec.InstanceId || '')
    const listener = String(rec.ListenerId || '')
    const domain = String(rec.Domain || '')
    return [lb, listener, domain].filter(Boolean).join('|')
  }
  if (resourceType === 'teo' || resourceType === 'live' || resourceType === 'vod' || resourceType === 'waf') {
    return String(rec.Domain || rec.DomainName || preset)
  }
  if (resourceType === 'cos') {
    return [rec.Region, rec.Bucket, rec.Domain].map((item) => String(item || '')).filter(Boolean).join('|')
  }
  if (resourceType === 'tke') {
    return [rec.ClusterId, rec.Namespace || rec.NameSpace, rec.SecretName].map((item) => String(item || '')).filter(Boolean).join('|')
  }
  if (resourceType === 'lighthouse') {
    return [rec.Region, rec.InstanceId, rec.Domain].map((item) => String(item || '')).filter(Boolean).join('|')
  }
  if (resourceType === 'apigateway') {
    return [rec.ServiceId, rec.Domain].map((item) => String(item || '')).filter(Boolean).join('|')
  }
  if (resourceType === 'tcb') {
    return [rec.Type, rec.Region, rec.EnvId, rec.Domain].map((item) => String(item || '')).filter(Boolean).join('|')
  }
  if (resourceType === 'ddos') {
    return [rec.InsId || rec.InstanceId, rec.Domain, rec.VirtualPort].map((item) => String(item || '')).filter(Boolean).join('|')
  }
  return preset
}

function mapDeployRecord(row: Record<string, unknown>): Record<string, unknown> {
  return {
    deployRecordId: row.DeployRecordId ?? row.Id ?? '',
    resourceType: row.ResourceType || '',
    status: row.Status ?? row.StatusName ?? '',
    statusName: row.StatusName || '',
    createTime: row.CreateTime || row.CreatedOn || '',
    instanceId: row.InstanceId || row.Domain || '',
  }
}

function firstArray(data: Record<string, unknown>, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = data[key]
    if (Array.isArray(value)) return value
  }
  return []
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean)
  return []
}

function normalizeVerify(value: string): string {
  const raw = value.trim().toUpperCase()
  if (raw === 'FILE' || raw === 'FILE_VERIFY') return 'FILE'
  if (raw === 'DNS' || raw === 'DNS_MANUAL') return 'DNS'
  return 'DNS_AUTO'
}

function assertNoPem(value: unknown): void {
  const text = JSON.stringify(value)
  if (/-----BEGIN /i.test(text)) throw new Error('详情不能包含 PEM')
}

function creds(ctx: ModuleContext): { secretId: string; secretKey: string } {
  return { secretId: ctx.creds.secretId, secretKey: ctx.creds.secretKey }
}

function opts(ctx: ModuleContext): { timeoutMs: number; signal?: AbortSignal } {
  return { timeoutMs: ctx.timeoutMs, signal: ctx.signal }
}

export const tencentCertModule = createCertModule()
registerModule(tencentCertModule)
