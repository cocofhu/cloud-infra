import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import {
  buildCertSections,
  canDeleteDirectly,
  canRenew,
  chainSummary,
  createCertModule,
  isFreeDomainValid,
  mapCertItem,
  normalizeHostInstances,
  parseCertRef,
  stripPem,
  type CertificatesItem,
} from '../providers/tencent/products/cert.js'
import { renderQuery } from '../core/query.js'

const dir = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => JSON.parse(readFileSync(join(dir, 'fixtures', name), 'utf8')) as Record<string, unknown>

const ctx = {
  creds: { secretId: 'id', secretKey: 'key' },
  query: '',
  offset: 0,
  limit: 12,
  timeoutMs: 5000,
}

test('sslCall targets ssl.tencentcloudapi.com / 2019-12-05', () => {
  const src = readFileSync(join(dir, '../../src/providers/tencent/client.ts'), 'utf8')
  assert.match(src, /export function sslCall/)
  assert.match(src, /ssl\.tencentcloudapi\.com/)
  assert.match(src, /2019-12-05/)
  assert.match(src, /service: 'ssl'/)
})

test('mapCertItem aligns 我的证书 columns and clickable id/domain', () => {
  const list = fixture('cert-list.json')
  const item = (list.Certificates as CertificatesItem[])[0]
  const card = mapCertItem(item)
  assert.equal(card.id, 'tencent.cert:QL8k2m')
  assert.equal(card.kind, 'cert')
  assert.equal(card.title, 'QL8k2m')
  assert.equal(card.openLabel, '详情')
  assert.notEqual(card.openLabel, '解析')
  const labels = (card.columns || []).map((col) => col.label)
  assert.deepEqual(labels, ['证书 ID', '绑定域名', '备注', '类型/品牌', '状态', '有效期'])
  assert.equal(card.columns?.find((col) => col.label === '绑定域名')?.value, 'www.example.com')
  assert.equal(card.meta?.deployable, true)
  assert.equal(card.meta?.downloadable, true)
})

test('parseCertRef and free-domain guards', () => {
  assert.deepEqual(parseCertRef('tencent.cert:QL8k2m'), { moduleId: 'tencent.cert', certificateId: 'QL8k2m' })
  assert.equal(isFreeDomainValid('www.example.com'), '')
  assert.match(isFreeDomainValid('1.2.3.4'), /不支持 IP/)
  assert.match(isFreeDomainValid('*.example.com'), /泛域名/)
  assert.match(isFreeDomainValid(''), /缺少绑定域名/)
})

test('canRenew only within 30 days; delete-direct statuses', () => {
  const end = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 19).replace('T', ' ')
  assert.equal(canRenew({ Status: 1, RenewAble: true, IsDv: true, CertEndTime: end }), true)
  assert.equal(canRenew({ Status: 1, RenewAble: true, IsDv: true, CertEndTime: '2028-01-01 00:00:00' }), false)
  assert.equal(canDeleteDirectly(3), true)
  assert.equal(canDeleteDirectly(7), true)
  assert.equal(canDeleteDirectly(10), true)
  assert.equal(canDeleteDirectly(1), false)
})

test('stripPem and chainSummary never leak PEM', () => {
  const raw = fixture('cert-detail.json')
  const cleaned = stripPem(raw)
  const text = JSON.stringify(cleaned)
  assert.doesNotMatch(text, /-----BEGIN /)
  assert.doesNotMatch(text, /SHOULDNEVERLEAK/)
  const chain = chainSummary(String((raw as { Certificate?: string }).Certificate))
  assert.ok(chain)
  assert.match(chain.subject, /www\.example\.com/)
  assert.match(chain.issuer, /TrustAsia|www\.example\.com/)
  assert.equal(chain.fingerprint, '6b76088222a872b8806bd01d621b843aa0582b0716e0876dd07a4c360bbb9f6d')
  assert.doesNotMatch(JSON.stringify(chain), /-----BEGIN /)
})

test('buildCertSections covers full console blocks', () => {
  const issued = fixture('cert-detail.json') as CertificatesItem
  const sections = buildCertSections({
    item: issued,
    chain: { issuer: 'TrustAsia DV TLS RSA CA', subject: 'www.example.com', fingerprint: 'abc', validFrom: 'a', validTo: 'b' },
    bound: [{ resourceType: 'cdn', instanceId: 'www.example.com' }],
  })
  const ids = sections.map((section) => section.id)
  assert.ok(ids.includes('basic'))
  assert.ok(ids.includes('domains'))
  assert.ok(ids.includes('chain'))
  assert.ok(ids.includes('bound'))
  const basic = sections.find((section) => section.id === 'basic')
  const labels = (basic?.fields || []).map((row) => row.label)
  for (const need of ['证书 ID', '备注', '证书类型', '品牌', '状态', '来源', '项目', '是否可部署', '申请时间', '生效时间', '过期时间', '有效期（月）']) {
    assert.ok(labels.includes(need), `missing ${need}`)
  }
  const applying = buildCertSections({
    item: { CertificateId: 'AP1pend', Status: 0, VerifyType: 'DNS', Domain: 'pending.example.com', DvAuthDetail: { DvAuthKey: '_dnsauth', DvAuthValue: 'xyz', DvAuthDomain: 'example.com' } },
    bound: [],
  })
  assert.ok(applying.some((section) => section.id === 'validation'))
  assert.doesNotMatch(JSON.stringify(sections), /-----BEGIN /)
})

test('createCertModule list/detail/actions talk SSL APIs without writing settings', async () => {
  const calls: Array<{ action: string; payload: unknown }> = []
  const call = async (action: string, payload: unknown) => {
    calls.push({ action, payload })
    if (action === 'DescribeCertificates') return fixture('cert-list.json')
    if (action === 'DescribeCertificateDetail' || action === 'DescribeCertificate') return fixture('cert-detail.json')
    if (action === 'DescribeDeployedResources') {
      return { DeployedResources: [{ ResourceType: 'cdn', ResourceIdList: ['www.example.com'] }] }
    }
    if (action === 'ApplyCertificate') return { CertificateId: 'NEWfree' }
    if (action === 'UploadCertificate') return { CertificateId: 'UPsm' }
    if (action === 'DescribeHostCdnInstanceList') {
      return { InstanceList: [{ Domain: 'www.example.com', InstanceName: 'cdn-1' }] }
    }
    if (action === 'DeployCertificateInstance') return { DeployRecordId: 9 }
    if (action === 'DescribeHostDeployRecord') {
      return { DeployRecordList: [{ DeployRecordId: 9, ResourceType: 'cdn', StatusName: '失败', InstanceId: 'www.example.com|off' }], TotalCount: 1 }
    }
    if (action === 'DownloadCertificate') return { Content: 'UEsA', ContentType: 'application/zip' }
    return {}
  }
  const module = createCertModule(call as never)
  assert.equal(module.id, 'tencent.cert')
  assert.equal(module.kind, 'cert')
  const listed = await module.list({ ...ctx, query: 'example', group: 'issued' })
  assert.equal(listed.items[0].title, 'QL8k2m')
  assert.equal(listed.items[0].kind, 'cert')
  const statusFilter = calls.find((row) => row.action === 'DescribeCertificates')?.payload as { CertificateStatus?: number[]; SearchKey?: string }
  assert.deepEqual(statusFilter.CertificateStatus, [1])
  assert.equal(statusFilter.SearchKey, 'example')

  const detail = await module.detail?.({ ...ctx, id: 'tencent.cert:QL8k2m', title: 'QL8k2m' })
  assert.ok(detail)
  const sectionIds = (detail.sections || []).map((section) => section.id)
  assert.ok(sectionIds.includes('basic'))
  assert.ok(sectionIds.includes('domains'))
  assert.ok(sectionIds.includes('chain'))
  assert.ok(sectionIds.includes('bound'))
  assert.doesNotMatch(JSON.stringify(detail), /-----BEGIN /)
  assert.doesNotMatch(JSON.stringify(detail), /SHOULDNEVERLEAK/)
  assert.ok((detail.sections || []).find((section) => section.id === 'chain')?.fields?.some((row) => row.label === '颁发者'))

  const applyBad = await module.execute?.('cert.apply', { domain: '*.x.com' }, { ...ctx })
  assert.equal(applyBad?.ok, false)
  const apply = await module.execute?.('cert.apply', {
    domain: 'new.example.com',
    verifyType: 'DNS',
    algorithm: 'RSA',
    alias: 'note',
  }, { ...ctx })
  assert.equal(apply?.ok, true)
  if (apply?.ok) assert.equal(apply.data?.certificateId, 'NEWfree')
  const applyCall = calls.find((row) => row.action === 'ApplyCertificate')?.payload as Record<string, unknown>
  assert.equal(applyCall.DvAuthMethod, 'DNS')
  assert.equal(applyCall.DomainName, 'new.example.com')
  assert.equal(applyCall.CsrEncryptAlgo, 'RSA')

  const uploadMiss = await module.execute?.('cert.upload', { publicKey: 'CERT', certificateType: 'SVR' }, { ...ctx })
  assert.equal(uploadMiss?.ok, false)
  const uploadSm = await module.execute?.('cert.upload', {
    standard: 'sm2',
    certificateType: 'SVR',
    publicKey: 'SIGN',
    privateKey: 'SIGNKEY',
    encryptPublicKey: 'ENC',
    encryptPrivateKey: 'ENCKEY',
    alias: 'sm',
  }, { ...ctx })
  assert.equal(uploadSm?.ok, true)
  const uploadCall = calls.find((row) => row.action === 'UploadCertificate')?.payload as Record<string, unknown>
  assert.equal(uploadCall.CertificateEncryptPublicKey, 'ENC')

  const hosts = await module.execute?.('cert.hosts', { certificateId: 'QL8k2m', resourceType: 'cdn' }, { ...ctx, id: 'tencent.cert:QL8k2m' })
  assert.equal(hosts?.ok, true)
  if (hosts?.ok) {
    const instances = hosts.data?.instances as Array<{ instanceId: string; matched: boolean }>
    assert.ok(instances[0].instanceId)
    assert.equal(instances[0].matched, true)
    assert.doesNotMatch(instances[0].instanceId, /^\s*$/)
  }

  const deployed = await module.execute?.('cert.deploy', {
    certificateId: 'QL8k2m',
    resourceType: 'cdn',
    instanceIds: ['www.example.com|off'],
  }, { ...ctx, id: 'tencent.cert:QL8k2m' })
  assert.equal(deployed?.ok, true)
  const deployCall = calls.find((row) => row.action === 'DeployCertificateInstance')?.payload as { InstanceIdList?: string[] }
  assert.deepEqual(deployCall.InstanceIdList, ['www.example.com|off'])

  const records = await module.execute?.('cert.deploy.records', { certificateId: 'QL8k2m' }, { ...ctx, id: 'tencent.cert:QL8k2m' })
  assert.equal(records?.ok, true)

  const downloaded = await module.execute?.('cert.download', { certificateId: 'QL8k2m' }, { ...ctx, id: 'tencent.cert:QL8k2m' })
  assert.equal(downloaded?.ok, true)
  if (downloaded?.ok) {
    assert.equal(downloaded.data?.filename, 'QL8k2m.zip')
    assert.equal(downloaded.data?.content, 'UEsA')
  }

  for (const action of ['cert.revoke', 'cert.replace', 'cert.delete', 'cert.cancel', 'cert.deploy.retry']) {
    const payload = action === 'cert.deploy.retry' ? { deployRecordId: 9 } : { certificateId: 'QL8k2m' }
    const result = await module.execute?.(action, payload, { ...ctx, id: 'tencent.cert:QL8k2m' })
    assert.equal(result?.ok, true, action)
  }

  const src = readFileSync(join(dir, '../../src/providers/tencent/products/cert.ts'), 'utf8')
  assert.doesNotMatch(src, /writeOverlay|assignConfig|sanitizePatch/)
  assert.ok(calls.every((row) => row.action !== 'writeOverlay'))
})

test('normalizeHostInstances prefers checkbox keys over empty ids', () => {
  const rows = normalizeHostInstances('cdn', { InstanceList: [{ Domain: 'a.com', InstanceName: 'cdn' }] })
  assert.equal(rows[0].instanceId, 'a.com|off')
  assert.equal(rows[0].matched, true)
})

test('renderQuery for cert does not guide 解析 or settings', () => {
  const text = renderQuery({
    query: '',
    kind: 'cert',
    items: [{
      id: 'tencent.cert:QL8k2m',
      moduleId: 'tencent.cert',
      provider: 'tencent',
      kind: 'cert',
      title: 'QL8k2m',
      description: 'www.example.com',
    }],
    errors: [],
    total: 1,
    hasMore: false,
  })
  assert.match(text, /证书 ID/)
  assert.doesNotMatch(text, /解析/)
  assert.doesNotMatch(text, /设置页/)
  assert.doesNotMatch(text, /PEM/)
  const domainText = renderQuery({
    query: '',
    kind: 'domain',
    items: [{
      id: 'tencent.domain:1',
      moduleId: 'tencent.domain',
      provider: 'tencent',
      kind: 'domain',
      title: 'dnspod.com',
      description: 'x',
    }],
    errors: [],
    total: 1,
  })
  assert.match(domainText, /解析/)
})
