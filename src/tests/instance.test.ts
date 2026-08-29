import assert from 'node:assert/strict'
import test from 'node:test'
import { withDefaults } from '../core/config-store.js'
import { queryResources, renderQuery } from '../core/query.js'
import { createRegistry } from '../core/registry.js'
import type { ModuleContext } from '../core/types.js'
import type { TencentProductCall } from '../providers/tencent/client.js'
import { createCvmModule, mapCvmItem, cvmDetailGroups, matchCvmQuery } from '../providers/tencent/products/cvm.js'
import {
  mapInstanceState,
  matchInstanceQuery,
  parseInstanceRef,
  pickRegions,
  powerAllowed,
} from '../providers/tencent/products/instance-common.js'
import { createLighthouseModule, lighthouseDetailGroups, mapLighthouseItem } from '../providers/tencent/products/lighthouse.js'

const ctx: ModuleContext = {
  creds: { secretId: 'id', secretKey: 'key' },
  query: '',
  offset: 0,
  limit: 12,
  timeoutMs: 5000,
}

function mockCall(handler: (action: string, payload: unknown, region?: string) => unknown): TencentProductCall {
  return (async (action, payload, _creds, opts) => handler(action, payload, opts.region)) as TencentProductCall
}

const cvmRunning = {
  InstanceId: 'ins-8k2m1a',
  InstanceName: 'api-prod',
  InstanceState: 'RUNNING',
  InstanceType: 'S5.MEDIUM4',
  CPU: 2,
  Memory: 4,
  OsName: 'TencentOS Server 3.1',
  ImageId: 'img-os',
  CreatedTime: '2025-01-12T10:21:03Z',
  ExpiredTime: '2026-01-12T10:21:03Z',
  InstanceChargeType: 'PREPAID',
  Placement: { Zone: 'ap-shanghai-3' },
  PrivateIpAddresses: ['172.16.0.8'],
  PublicIpAddresses: ['43.138.9.21'],
}

const cvmStopped = {
  ...cvmRunning,
  InstanceId: 'ins-0p9q2c',
  InstanceName: 'dev-box',
  InstanceState: 'STOPPED',
  InstanceChargeType: 'POSTPAID_BY_HOUR',
  PublicIpAddresses: [],
}

const lhRunning = {
  InstanceId: 'lhins-4r4p',
  InstanceName: 'blog-lh',
  InstanceState: 'RUNNING',
  CPU: 2,
  Memory: 4,
  OsName: 'Ubuntu 22.04',
  CreatedTime: '2025-03-01T00:00:00Z',
  ExpiredTime: '2026-03-01T00:00:00Z',
  InstanceChargeType: 'PREPAID',
  Zone: 'ap-guangzhou-3',
  PublicAddresses: ['1.14.2.8'],
  PrivateAddresses: ['10.0.0.8'],
  SystemDisk: { DiskSize: 60 },
  InstanceTrafficPackage: { TrafficPackageTotal: 1024, TrafficPackageMonthlyUsed: 12 },
}

test('mapInstanceState uses console Chinese labels', () => {
  assert.deepEqual(mapInstanceState('RUNNING'), { status: 'enable', stateLabel: '运行中' })
  assert.deepEqual(mapInstanceState('STOPPED'), { status: 'pause', stateLabel: '已关机' })
  assert.equal(mapInstanceState('STARTING').stateLabel, '开机中')
  assert.equal(mapInstanceState('STOPPING').stateLabel, '关机中')
  assert.equal(mapInstanceState('REBOOTING').stateLabel, '重启中')
  assert.equal(mapInstanceState('PENDING').stateLabel, '创建中')
  assert.equal(mapInstanceState('SHUTDOWN').stateLabel, '待回收')
})

test('powerAllowed disables illegal actions by console state', () => {
  assert.equal(powerAllowed('运行中', 'instance.start'), false)
  assert.equal(powerAllowed('运行中', 'instance.stop'), true)
  assert.equal(powerAllowed('运行中', 'instance.reboot'), true)
  assert.equal(powerAllowed('已关机', 'instance.start'), true)
  assert.equal(powerAllowed('已关机', 'instance.stop'), false)
  assert.equal(powerAllowed('已关机', 'instance.reboot'), false)
  assert.equal(powerAllowed('开机中', 'instance.start'), false)
  assert.equal(powerAllowed('重启中', 'instance.reboot'), false)
})

test('parseInstanceRef keeps region between module and id', () => {
  assert.deepEqual(parseInstanceRef('tencent.cvm:ap-shanghai:ins-8k2m1a'), {
    moduleId: 'tencent.cvm',
    region: 'ap-shanghai',
    instanceId: 'ins-8k2m1a',
  })
  assert.deepEqual(parseInstanceRef('tencent.lighthouse:ap-guangzhou:lhins-4r4p'), {
    moduleId: 'tencent.lighthouse',
    region: 'ap-guangzhou',
    instanceId: 'lhins-4r4p',
  })
})

test('mapCvmItem uses official default core columns and Chinese state', () => {
  const card = mapCvmItem(cvmRunning, {
    moduleId: 'tencent.cvm',
    region: 'ap-shanghai',
    regionName: '华东地区（上海）',
    zoneName: '上海三区',
  })
  assert.equal(card.id, 'tencent.cvm:ap-shanghai:ins-8k2m1a')
  assert.equal(card.kind, 'cvm')
  assert.equal(card.status, 'enable')
  assert.equal(card.stateLabel, '运行中')
  assert.equal(card.instanceId, 'ins-8k2m1a')
  assert.equal(card.privateIp, '172.16.0.8')
  assert.equal(card.publicIp, '43.138.9.21')
  assert.deepEqual(card.columns, [
    { label: '可用区', value: '上海三区' },
    { label: '实例类型', value: 'S5.MEDIUM4' },
    { label: '操作系统', value: 'TencentOS Server 3.1' },
    { label: '实例配置', value: '2核 4GB' },
    { label: '主IPv4地址', value: '内网：172.16.0.8\n弹性：43.138.9.21' },
    { label: '实例计费模式', value: '包年包月' },
  ])
  assert.equal(card.columns?.some((col) => /解析/.test(col.label)), false)
})

test('mapLighthouseItem exposes card fields for console cards', () => {
  const card = mapLighthouseItem(lhRunning, {
    moduleId: 'tencent.lighthouse',
    region: 'ap-guangzhou',
    regionName: '华南地区（广州）',
    zoneName: '广州三区',
  })
  assert.equal(card.kind, 'lighthouse')
  assert.equal(card.stateLabel, '运行中')
  assert.equal(card.publicIp, '1.14.2.8')
  assert.equal(card.columns?.find((col) => col.label === '套餐')?.value, '2核 4GB')
  assert.equal(card.columns?.find((col) => col.label === '到期时间')?.value, '2026-03-01 00:00:00')
  assert.equal(card.columns?.find((col) => col.label === '地域')?.value, '华南地区（广州）')
})

test('keyword matches name, ins-/lhins- id and ipv4', () => {
  const card = mapCvmItem(cvmRunning, {
    moduleId: 'tencent.cvm',
    region: 'ap-shanghai',
    regionName: '华东地区（上海）',
  })
  assert.equal(matchInstanceQuery([card.title, card.instanceId, card.privateIp, card.publicIp], 'api-prod'), true)
  assert.equal(matchInstanceQuery([card.title, card.instanceId, card.privateIp, card.publicIp], 'ins-8k2m1a'), true)
  assert.equal(matchInstanceQuery([card.title, card.instanceId, card.privateIp, card.publicIp], '43.138.9.21'), true)
  assert.equal(matchInstanceQuery([card.title, card.instanceId, card.privateIp, card.publicIp], '172.16.0.8'), true)
  assert.equal(matchInstanceQuery([card.title, card.instanceId, card.privateIp, card.publicIp], 'nope'), false)
  assert.equal(matchCvmQuery(card, '43.138.9.21'), true)
  assert.equal(matchCvmQuery({ ...card, publicIp: undefined, privateIp: undefined }, '43.138.9.21'), true)
})

test('cvm and lighthouse detail groups cover official sections and omit DNS records', async () => {
  const cvmCard = mapCvmItem(cvmRunning, {
    moduleId: 'tencent.cvm',
    region: 'ap-shanghai',
    regionName: '华东地区（上海）',
    zoneName: '上海三区',
  })
  const cvmGroups = cvmDetailGroups(cvmRunning, cvmCard)
  assert.deepEqual(cvmGroups.map((g) => g.title), ['实例信息', '网络信息', '配置信息', '镜像信息', '计费信息'])
  const lhCard = mapLighthouseItem(lhRunning, {
    moduleId: 'tencent.lighthouse',
    region: 'ap-guangzhou',
    regionName: '华南地区（广州）',
    zoneName: '广州三区',
  })
  const lhGroups = lighthouseDetailGroups(lhRunning, lhCard)
  const titles = lhGroups.map((g) => g.title)
  assert.ok(titles.includes('套餐类型'))
  assert.ok(titles.includes('实例规格'))
  assert.ok(titles.includes('系统盘'))
  assert.ok(titles.includes('流量包'))
  assert.ok(titles.includes('计费信息'))
  assert.equal(lhGroups.some((g) => /解析/.test(g.title)), false)

  const call = mockCall((action, payload, region) => {
    if (action === 'DescribeRegions') {
      return { RegionSet: [{ Region: region || 'ap-shanghai', RegionName: '华东地区(上海)', RegionState: 'AVAILABLE' }] }
    }
    if (action === 'DescribeZones') return { ZoneSet: [{ Zone: 'ap-shanghai-3', ZoneName: '上海三区' }] }
    if (action === 'DescribeInstances') return { InstanceSet: [cvmRunning], TotalCount: 1 }
    throw new Error(action)
  })
  const detail = await createCvmModule(call).detail?.({ ...ctx, id: 'tencent.cvm:ap-shanghai:ins-8k2m1a' })
  assert.ok(detail)
  assert.equal(detail.records, undefined)
  assert.equal(JSON.stringify(detail).includes('解析记录'), false)
  assert.equal(detail.groups?.length, 5)
})

test('pickRegions defaults to Guangzhou and honors an explicit region', () => {
  const regions = [
    { region: 'ap-shanghai', regionName: '华东地区（上海）' },
    { region: 'ap-guangzhou', regionName: '华南地区（广州）' },
    { region: 'ap-beijing', regionName: '华北地区（北京）' },
  ]
  assert.deepEqual(pickRegions(regions), [{ region: 'ap-guangzhou', regionName: '华南地区（广州）' }])
  assert.equal(pickRegions(regions, '华北地区（北京）')[0].region, 'ap-beijing')
  assert.equal(pickRegions(regions, 'ap-shanghai')[0].region, 'ap-shanghai')
  assert.equal(pickRegions(regions, 'all').length, 3)
  assert.equal(pickRegions([{ region: 'ap-shanghai', regionName: '华东地区（上海）' }])[0].region, 'ap-shanghai')
})

test('list defaults to Guangzhou and does not query other regions', async () => {
  const calls: Array<{ action: string; region?: string }> = []
  const call = mockCall((action, _payload, region) => {
    calls.push({ action, region })
    if (action === 'DescribeRegions') {
      return {
        RegionSet: [
          { Region: 'ap-shanghai', RegionName: '华东地区(上海)', RegionState: 'AVAILABLE' },
          { Region: 'ap-guangzhou', RegionName: '华南地区(广州)', RegionState: 'AVAILABLE' },
          { Region: 'ap-beijing', RegionName: '华北地区(北京)', RegionState: 'AVAILABLE' },
        ],
      }
    }
    if (action === 'DescribeZones') return { ZoneSet: [] }
    if (action === 'DescribeInstances') {
      if (region !== 'ap-guangzhou') throw new Error(`should not query ${region}`)
      return { InstanceSet: [cvmRunning], TotalCount: 1 }
    }
    throw new Error(action)
  })
  const listed = await createCvmModule(call).list(ctx)
  assert.equal(listed.items.length, 1)
  assert.ok(calls.some((row) => row.action === 'DescribeInstances' && row.region === 'ap-guangzhou'))
  assert.equal(calls.filter((row) => row.action === 'DescribeInstances' && row.region === 'ap-beijing').length, 0)
  assert.equal(calls.filter((row) => row.action === 'DescribeInstances' && row.region === 'ap-shanghai').length, 0)
  assert.ok(listed.regions?.some((name) => /广州/.test(name)))
})

test('list isolates a failed region and still returns the others', async () => {
  const calls: Array<{ action: string; region?: string }> = []
  const call = mockCall((action, _payload, region) => {
    calls.push({ action, region })
    if (action === 'DescribeRegions') {
      return {
        RegionSet: [
          { Region: 'ap-shanghai', RegionName: '华东地区(上海)', RegionState: 'AVAILABLE' },
          { Region: 'ap-beijing', RegionName: '华北地区(北京)', RegionState: 'AVAILABLE' },
        ],
      }
    }
    if (action === 'DescribeZones') return { ZoneSet: [] }
    if (action === 'DescribeInstances') {
      if (region === 'ap-beijing') throw new Error('UnauthorizedOperation')
      return { InstanceSet: [cvmRunning], TotalCount: 1 }
    }
    throw new Error(action)
  })
  const listed = await createCvmModule(call).list({ ...ctx, region: '华东地区（上海）' })
  assert.equal(listed.items.length, 1)
  assert.equal(listed.items[0].instanceId, 'ins-8k2m1a')
  assert.equal(listed.errors?.length || 0, 0)
  assert.ok(calls.some((row) => row.action === 'DescribeInstances' && row.region === 'ap-shanghai'))
  assert.equal(calls.filter((row) => row.action === 'DescribeInstances' && row.region === 'ap-beijing').length, 0)
})

test('keyword list filter keeps matching instances only', async () => {
  const call = mockCall((action, _payload, region) => {
    if (action === 'DescribeRegions') {
      return { RegionSet: [{ Region: 'ap-shanghai', RegionName: '华东地区(上海)', RegionState: 'AVAILABLE' }] }
    }
    if (action === 'DescribeZones') return { ZoneSet: [] }
    if (action === 'DescribeInstances') return { InstanceSet: [cvmRunning, cvmStopped], TotalCount: 2 }
    throw new Error(`${action}:${region}`)
  })
  const byIp = await createCvmModule(call).list({ ...ctx, query: '43.138.9.21' })
  assert.equal(byIp.items.length, 1)
  assert.equal(byIp.items[0].title, 'api-prod')
  const byId = await createCvmModule(call).list({ ...ctx, query: 'ins-0p9q2c' })
  assert.equal(byId.items[0].title, 'dev-box')
  const miss = await createCvmModule(call).list({ ...ctx, query: 'not-found-xx' })
  assert.equal(miss.items.length, 0)
})

test('start/stop/reboot call product APIs and reject illegal state', async () => {
  const calls: string[] = []
  const call = mockCall((action) => {
    calls.push(action)
    if (action === 'DescribeInstances') return { InstanceSet: [cvmRunning] }
    return {}
  })
  const module = createCvmModule(call)
  const reboot = await module.execute?.('instance.reboot', {}, { ...ctx, id: 'tencent.cvm:ap-shanghai:ins-8k2m1a' })
  assert.equal(reboot?.ok, true)
  assert.ok(calls.includes('RebootInstances'))
  const start = await module.execute?.('instance.start', {}, { ...ctx, id: 'tencent.cvm:ap-shanghai:ins-8k2m1a' })
  assert.equal(start?.ok, false)
  assert.match(String(start && 'error' in start ? start.error : ''), /运行中/)

  const lhCalls: string[] = []
  const lh = mockCall((action) => {
    lhCalls.push(action)
    if (action === 'DescribeInstances') return { InstanceSet: [{ ...lhRunning, InstanceState: 'STOPPED' }] }
    return {}
  })
  const started = await createLighthouseModule(lh).execute?.('instance.start', {
    instanceId: 'lhins-4r4p',
    region: 'ap-guangzhou',
  }, ctx)
  assert.equal(started?.ok, true)
  assert.ok(lhCalls.includes('StartInstances'))
  const stopped = await createLighthouseModule(lh).execute?.('instance.stop', {
    instanceId: 'lhins-4r4p',
    region: 'ap-guangzhou',
  }, ctx)
  assert.equal(stopped?.ok, false)
})

test('cvm and lighthouse list paginates with offset/limit and hasMore', async () => {
  const instances = Array.from({ length: 5 }, (_, i) => ({
    ...cvmRunning,
    InstanceId: `ins-${i}`,
    InstanceName: `host-${i}`,
    PrivateIpAddresses: [`10.0.0.${i}`],
    PublicIpAddresses: [`1.1.1.${i}`],
  }))
  const call = mockCall((action, payload) => {
    if (action === 'DescribeRegions') {
      return { RegionSet: [{ Region: 'ap-shanghai', RegionName: '华东地区(上海)', RegionState: 'AVAILABLE' }] }
    }
    if (action === 'DescribeZones') return { ZoneSet: [] }
    if (action === 'DescribeInstances') {
      const offset = Number((payload as { Offset?: number }).Offset || 0)
      const limit = Number((payload as { Limit?: number }).Limit || 100)
      return { InstanceSet: instances.slice(offset, offset + limit), TotalCount: instances.length }
    }
    throw new Error(action)
  })
  const first = await createCvmModule(call).list({ ...ctx, offset: 0, limit: 2 })
  assert.equal(first.items.length, 2)
  assert.equal(first.total, 5)
  assert.equal(first.offset, 0)
  assert.equal(first.hasMore, true)
  assert.equal(first.items[0].instanceId, 'ins-0')
  const second = await createCvmModule(call).list({ ...ctx, offset: 2, limit: 2 })
  assert.equal(second.items.map((item) => item.instanceId).join(','), 'ins-2,ins-3')
  assert.equal(second.hasMore, true)
  const last = await createCvmModule(call).list({ ...ctx, offset: 4, limit: 2 })
  assert.equal(last.items.length, 1)
  assert.equal(last.hasMore, false)
  const shanghai = await createCvmModule(call).list({ ...ctx, region: '华东地区（上海）', limit: 12 })
  assert.equal(shanghai.total, 5)
  const missRegion = await createCvmModule(call).list({ ...ctx, region: '华北地区（北京）', limit: 12 })
  assert.equal(missRegion.items.length, 0)
  assert.equal(missRegion.total, 0)

  const lights = Array.from({ length: 3 }, (_, i) => ({
    ...lhRunning,
    InstanceId: `lhins-${i}`,
    InstanceName: `lh-${i}`,
  }))
  const lhCall = mockCall((action, payload) => {
    if (action === 'DescribeRegions') {
      return { RegionSet: [{ Region: 'ap-guangzhou', RegionName: '华南地区(广州)', RegionState: 'AVAILABLE' }] }
    }
    if (action === 'DescribeZones') return { ZoneSet: [] }
    if (action === 'DescribeInstances') {
      const offset = Number((payload as { Offset?: number }).Offset || 0)
      const limit = Number((payload as { Limit?: number }).Limit || 100)
      return { InstanceSet: lights.slice(offset, offset + limit), TotalCount: lights.length }
    }
    throw new Error(action)
  })
  const lhPage = await createLighthouseModule(lhCall).list({ ...ctx, offset: 0, limit: 2 })
  assert.equal(lhPage.items.length, 2)
  assert.equal(lhPage.total, 3)
  assert.equal(lhPage.hasMore, true)
})

test('queryResources merges per-region list errors and keeps other items', async () => {
  const source = createRegistry()
  source.registerProvider({
    id: 'tencent',
    title: '腾讯云',
    fields: [{ key: 'secretId', label: 'SecretId' }, { key: 'secretKey', label: 'SecretKey' }],
  })
  const module = createCvmModule(mockCall((action, _payload, region) => {
    if (action === 'DescribeRegions') {
      return {
        RegionSet: [
          { Region: 'ap-guangzhou', RegionName: '华南地区(广州)', RegionState: 'AVAILABLE' },
          { Region: 'ap-beijing', RegionName: '华北地区(北京)', RegionState: 'AVAILABLE' },
        ],
      }
    }
    if (action === 'DescribeZones') return { ZoneSet: [] }
    if (region === 'ap-beijing') throw new Error('UnauthorizedOperation')
    if (region === 'ap-guangzhou') throw new Error('UnauthorizedOperation')
    return { InstanceSet: [cvmRunning], TotalCount: 1 }
  }))
  source.registerModule(module)
  const result = await queryResources({ kind: 'cvm' }, withDefaults({
    providers: { tencent: { secretId: 'id', secretKey: 'key' } },
    modules: { 'tencent.cvm': true },
  }), undefined, source)
  assert.equal(result.items.length, 0)
  assert.equal(result.errors.length, 1)
  assert.match(result.errors[0].message, /广州|权限|失败|频繁/)
})

test('queryResources slices cvm results and keeps total for the pager', async () => {
  const source = createRegistry()
  source.registerProvider({
    id: 'tencent',
    title: '腾讯云',
    fields: [{ key: 'secretId', label: 'SecretId' }, { key: 'secretKey', label: 'SecretKey' }],
  })
  const many = [cvmRunning, cvmStopped, {
    ...cvmRunning,
    InstanceId: 'ins-extra',
    InstanceName: 'extra',
    PrivateIpAddresses: ['10.0.0.9'],
    PublicIpAddresses: ['8.8.8.8'],
  }]
  source.registerModule(createCvmModule(mockCall((action) => {
    if (action === 'DescribeRegions') {
      return { RegionSet: [{ Region: 'ap-shanghai', RegionName: '华东地区(上海)', RegionState: 'AVAILABLE' }] }
    }
    if (action === 'DescribeZones') return { ZoneSet: [] }
    return { InstanceSet: many, TotalCount: many.length }
  })))
  const page = await queryResources({ kind: 'cvm', offset: 0, limit: 2 }, withDefaults({
    providers: { tencent: { secretId: 'id', secretKey: 'key' } },
    modules: { 'tencent.cvm': true },
  }), undefined, source)
  assert.equal(page.items.length, 2)
  assert.equal(page.total, 3)
  assert.equal(page.hasMore, true)
  assert.match(renderQuery(page), /第 1–2 条/)
  const next = await queryResources({ kind: 'cvm', offset: 2, limit: 2 }, withDefaults({
    providers: { tencent: { secretId: 'id', secretKey: 'key' } },
    modules: { 'tencent.cvm': true },
  }), undefined, source)
  assert.equal(next.items.length, 1)
  assert.equal(next.hasMore, false)
})

test('renderQuery still asks users to open DNS records for domain results', () => {
  const text = renderQuery({
    query: '',
    kind: 'domain',
    items: [{
      id: 'tencent.domain:1',
      moduleId: 'tencent.domain',
      provider: 'tencent',
      kind: 'domain',
      title: 'example.com',
      description: 'ok',
    }],
    errors: [],
    total: 1,
  })
  assert.match(text, /解析/)
})
