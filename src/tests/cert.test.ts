import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import {
  boundProductTypes,
  buildCertSections,
  canDeleteDirectly,
  canRenew,
  candidateZones,
  checkDnspodHosted,
  chainSummary,
  createCertModule,
  DEPLOYED_RESOURCE_TYPES,
  DNSPOD_AUTO_DNS_HINT,
  isDomainVerificationPassed,
  isFreeDomainValid,
  mapCertItem,
  needsCancelBeforeDelete,
  normalizeHostInstances,
  parseCertRef,
  parseDeployedResources,
  stripPem,
  toDeployedResourceType,
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
  assert.match(isFreeDomainValid('2001:db8::1'), /不支持 IP/)
  assert.match(isFreeDomainValid('::1'), /不支持 IP/)
  assert.match(isFreeDomainValid('[2001:db8::1]'), /不支持 IP/)
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
  const applyingDeploy = applying.find((section) => section.id === 'basic')?.fields?.find((row) => row.label === '是否可部署')
  assert.equal(applyingDeploy?.value, '否')
  const issuedDeploy = basic?.fields?.find((row) => row.label === '是否可部署')
  assert.equal(issuedDeploy?.value, '是')
  const blocked = buildCertSections({ item: { ...issued, Deployable: false }, bound: [] })
  assert.equal(blocked.find((section) => section.id === 'basic')?.fields?.find((row) => row.label === '是否可部署')?.value, '否')
  assert.doesNotMatch(JSON.stringify(sections), /-----BEGIN /)
})

test('createCertModule list/detail/actions talk SSL APIs without writing settings', async () => {
  const calls: Array<{ action: string; payload: unknown }> = []
  const call = async (action: string, payload: unknown) => {
    calls.push({ action, payload })
    if (action === 'DescribeCertificates') return fixture('cert-list.json')
    if (action === 'DescribeCertificateDetail' || action === 'DescribeCertificate') return fixture('cert-detail.json')
    if (action === 'DescribeDeployedResources') {
      const body = payload as { CertificateIds?: string[]; ResourceType?: string; CertificateId?: string }
      if (body.CertificateId) throw new Error('DescribeDeployedResources must use CertificateIds array')
      if (!Array.isArray(body.CertificateIds) || !body.CertificateIds.includes('QL8k2m')) {
        throw new Error('DescribeDeployedResources requires CertificateIds')
      }
      if (body.ResourceType === 'cdn') {
        return { DeployedResources: [{ CertificateId: 'QL8k2m', Type: 'cdn', Resources: ['www.example.com'], ResourceIds: ['www.example.com'], Count: 1 }] }
      }
      return { DeployedResources: [] }
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
  const boundSection = (detail.sections || []).find((section) => section.id === 'bound')
  assert.ok(boundSection?.fields?.some((row) => row.label === 'CDN' && row.value === 'www.example.com'))
  const deployedCalls = calls.filter((row) => row.action === 'DescribeDeployedResources')
  assert.equal(deployedCalls.length, DEPLOYED_RESOURCE_TYPES.length)
  assert.ok(deployedCalls.every((row) => {
    const body = row.payload as { CertificateIds?: string[]; CertificateId?: unknown; ResourceType?: string }
    return Array.isArray(body.CertificateIds) && body.CertificateIds[0] === 'QL8k2m' && body.CertificateId == null
  }))
  assert.deepEqual(
    deployedCalls.map((row) => (row.payload as { ResourceType: string }).ResourceType).sort(),
    [...DEPLOYED_RESOURCE_TYPES].sort(),
  )

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

  for (const action of ['cert.revoke', 'cert.delete', 'cert.cancel', 'cert.deploy.retry']) {
    const payload = action === 'cert.deploy.retry' ? { deployRecordId: 9 } : { certificateId: 'QL8k2m' }
    const result = await module.execute?.(action, payload, { ...ctx, id: 'tencent.cert:QL8k2m' })
    assert.equal(result?.ok, true, action)
  }
  const replaceMiss = await module.execute?.('cert.replace', { certificateId: 'QL8k2m' }, { ...ctx, id: 'tencent.cert:QL8k2m' })
  assert.equal(replaceMiss?.ok, false)
  if (!replaceMiss?.ok) assert.match(replaceMiss.error, /验证方式/)
  const replaced = await module.execute?.('cert.replace', {
    certificateId: 'QL8k2m',
    verifyType: 'DNS',
    domain: 'www.example.com',
  }, { ...ctx, id: 'tencent.cert:QL8k2m' })
  assert.equal(replaced?.ok, true)
  const replaceCall = calls.find((row) => row.action === 'ReplaceCertificate')?.payload as { ValidType?: string }
  assert.equal(replaceCall.ValidType, 'DNS')

  const src = readFileSync(join(dir, '../../src/providers/tencent/products/cert.ts'), 'utf8')
  assert.doesNotMatch(src, /writeOverlay|assignConfig|sanitizePatch/)
  assert.ok(calls.every((row) => row.action !== 'writeOverlay'))
})

test('normalizeHostInstances prefers checkbox keys over empty ids', () => {
  const rows = normalizeHostInstances('cdn', { InstanceList: [{ Domain: 'a.com', InstanceName: 'cdn' }] })
  assert.equal(rows[0].instanceId, 'a.com|off')
  assert.equal(rows[0].matched, true)
})

test('candidateZones and DNS_AUTO reject domains not on DNSPod', async () => {
  assert.deepEqual(candidateZones('www.example.com'), ['www.example.com', 'example.com'])
  assert.deepEqual(candidateZones('example.com'), ['example.com'])
  const missing = await checkDnspodHosted(
    (async () => { throw new Error('域名不存在') }) as never,
    'www.example.com',
    { secretId: 'id', secretKey: 'key' },
    { timeoutMs: 1000 },
  )
  assert.equal(missing, false)
  const hosted = await checkDnspodHosted(
    (async () => ({ DomainInfo: { Name: 'example.com' } })) as never,
    'www.example.com',
    { secretId: 'id', secretKey: 'key' },
    { timeoutMs: 1000 },
  )
  assert.equal(hosted, true)

  const ssl: string[] = []
  const sslStub = (async (action: string) => {
    ssl.push(action)
    return { CertificateId: 'X' }
  }) as never
  const dnsMissing = (async () => {
    throw new Error('域名不存在')
  }) as never
  const applyBlocked = await createCertModule(sslStub, dnsMissing).execute?.('cert.apply', {
    domain: 'www.example.com',
    verifyType: 'DNS_AUTO',
  }, ctx)
  assert.equal(applyBlocked?.ok, false)
  if (!applyBlocked?.ok) assert.equal(applyBlocked.error, DNSPOD_AUTO_DNS_HINT)
  assert.ok(!ssl.includes('ApplyCertificate'))

  const sslOk = (async () => ({ CertificateId: 'NEWauto' })) as never
  const dnsOk = (async () => ({})) as never
  const applyOk = await createCertModule(sslOk, dnsOk).execute?.('cert.apply', {
    domain: 'www.example.com',
    verifyType: 'DNS_AUTO',
  }, ctx)
  assert.equal(applyOk?.ok, true)
})

test('delete of applying cert requires cancel; verify completes manual DNS', async () => {
  assert.equal(needsCancelBeforeDelete(0), true)
  assert.equal(needsCancelBeforeDelete(1), false)
  const deleteCalls: string[] = []
  const deleteStub = (async (action: string) => {
    deleteCalls.push(action)
    if (action === 'DescribeCertificate') return { CertificateId: 'AP1pend', Status: 0 }
    throw new Error('should not ' + action)
  }) as never
  const blocked = await createCertModule(deleteStub).execute?.('cert.delete', { certificateId: 'AP1pend' }, { ...ctx, id: 'tencent.cert:AP1pend' })
  assert.equal(blocked?.ok, false)
  if (!blocked?.ok) assert.match(blocked.error, /取消审核/)
  assert.ok(!deleteCalls.includes('DeleteCertificate'))

  const verifyCalls: string[] = []
  const verifyStub = (async (action: string) => {
    verifyCalls.push(action)
    if (action === 'CheckCertificateDomainVerification') {
      return { VerificationResults: [{ Domain: 'pending.example.com', Status: 1, StatusName: '通过' }] }
    }
    return {}
  }) as never
  const module = createCertModule(verifyStub)
  const manual = await module.execute?.('cert.verify', {
    certificateId: 'AP1pend',
    verifyType: 'DNS',
    completeIfManual: true,
  }, { ...ctx, id: 'tencent.cert:AP1pend' })
  assert.equal(manual?.ok, true)
  if (manual?.ok) {
    assert.equal(manual.data?.passed, true)
    assert.equal(manual.data?.completed, true)
  }
  assert.ok(verifyCalls.includes('CompleteCertificate'))
  verifyCalls.length = 0
  const auto = await module.execute?.('cert.verify', {
    certificateId: 'AP1pend',
    verifyType: 'DNS_AUTO',
    completeIfManual: true,
  }, { ...ctx, id: 'tencent.cert:AP1pend' })
  assert.equal(auto?.ok, true)
  if (auto?.ok) assert.equal(auto.data?.completed, false)
  assert.ok(!verifyCalls.includes('CompleteCertificate'))
  assert.equal(isDomainVerificationPassed({ VerificationResults: [{ Status: 1 }] }), true)
  assert.equal(isDomainVerificationPassed({ VerificationResults: [{ StatusName: '失败' }] }), false)
})

test('detail treats BoundResource as product filter and parses official DescribeDeployedResources fields', async () => {
  assert.equal(toDeployedResourceType('ddos'), 'antiddos')
  assert.equal(toDeployedResourceType('clb'), 'clb')
  assert.equal(toDeployedResourceType('cdn-www.example.com'), null)
  assert.deepEqual(boundProductTypes(['clb', 'ddos', 'cdn-www.example.com']), ['clb', 'antiddos'])
  assert.deepEqual(
    parseDeployedResources({
      DeployedResources: [{ Type: 'clb', Resources: ['lb-8kdm7xxx'], ResourceIds: ['lb-8kdm7xxx'] }],
    }, 'clb'),
    [{ resourceType: 'clb', instanceId: 'lb-8kdm7xxx' }],
  )

  const calls: Array<{ action: string; payload: unknown }> = []
  const raw = fixture('cert-detail.json') as CertificatesItem
  const call = (async (action: string, payload: unknown) => {
    calls.push({ action, payload })
    if (action === 'DescribeCertificateDetail' || action === 'DescribeCertificate') {
      return { ...raw, BoundResource: ['clb'] }
    }
    if (action === 'DescribeDeployedResources') {
      const body = payload as { CertificateIds?: string[]; ResourceType?: string; CertificateId?: string }
      assert.deepEqual(body.CertificateIds, ['QL8k2m'])
      assert.equal(body.CertificateId, undefined)
      assert.equal(body.ResourceType, 'clb')
      return {
        DeployedResources: [{
          CertificateId: 'QL8k2m',
          Type: 'clb',
          Resources: ['lb-8kdm7xxx'],
          ResourceIds: ['lb-8kdm7xxx'],
          Count: 1,
        }],
      }
    }
    throw new Error('unexpected ' + action)
  }) as never
  const detail = await createCertModule(call).detail?.({ ...ctx, id: 'tencent.cert:QL8k2m', title: 'QL8k2m' })
  assert.ok(detail)
  const boundCalls = calls.filter((row) => row.action === 'DescribeDeployedResources')
  assert.equal(boundCalls.length, 1)
  const bound = (detail?.sections || []).find((section) => section.id === 'bound')
  assert.ok(bound?.fields?.some((row) => row.label === 'CLB' && row.value === 'lb-8kdm7xxx'))
  assert.ok(!bound?.fields?.some((row) => /clb/i.test(row.value) && row.value.length <= 4))
  const failed = buildCertSections({ item: raw, bound: [], boundFailed: true })
  assert.ok(failed.find((section) => section.id === 'bound')?.empty?.includes('可重试'))
})

test('invalid BoundResource is not treated as instance id', async () => {
  const types: string[] = []
  const raw = fixture('cert-detail.json') as CertificatesItem
  const call = (async (action: string, payload: unknown) => {
    if (action === 'DescribeCertificateDetail' || action === 'DescribeCertificate') {
      return { ...raw, BoundResource: ['cdn-www.example.com'] }
    }
    if (action === 'DescribeDeployedResources') {
      types.push(String((payload as { ResourceType?: string }).ResourceType || ''))
      return { DeployedResources: [] }
    }
    throw new Error('unexpected ' + action)
  }) as never
  const detail = await createCertModule(call).detail?.({ ...ctx, id: 'tencent.cert:QL8k2m', title: 'QL8k2m' })
  assert.deepEqual(types.sort(), [...DEPLOYED_RESOURCE_TYPES].sort())
  const bound = (detail?.sections || []).find((section) => section.id === 'bound')
  assert.ok(!bound?.fields?.some((row) => row.value === 'cdn-www.example.com'))
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
  const emptyCert = renderQuery({
    query: '',
    kind: 'cert',
    items: [],
    errors: [{ moduleId: 'tencent.cert', message: '腾讯云 未配置 SecretId、SecretKey。请使用已有腾讯云 SecretId/SecretKey' }],
    total: 0,
    hasMore: false,
  })
  assert.doesNotMatch(emptyCert, /设置页/)
  assert.doesNotMatch(emptyCert, /请到设置/)
  assert.match(emptyCert, /已有腾讯云 SecretId\/SecretKey/)
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
