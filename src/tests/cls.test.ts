import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { persistable, sanitizePatch, withDefaults, writeOverlay } from '../core/config-store.js'
import { renderQuery, wantsSearch } from '../core/query.js'
import { registry } from '../core/registry.js'
import { handleApi } from '../host.js'
import { clsCall } from '../providers/tencent/client.js'
import {
  createClsModule,
  mapLogHit,
  mapTopicItem,
  normalizeCql,
  parseTopicRef,
  periodLabel,
  resolveTimeRange,
  storageLabel,
  type SearchLogItem,
  type TopicListItem,
} from '../providers/tencent/products/cls.js'
import { CLS_REGIONS, DEFAULT_CLS_REGION, parseRegionHint, resolveClsRegion } from '../providers/tencent/regions.js'

const dir = dirname(fileURLToPath(import.meta.url))
const root = join(dir, '../..')
const fixture = (name: string) => JSON.parse(readFileSync(join(dir, 'fixtures', name), 'utf8')) as Record<string, unknown>

function fakeCall(calls: Array<{ action: string; payload: unknown; region: string }>) {
  return async (action: string, payload: unknown, _creds: unknown, opts: { region: string }) => {
    calls.push({ action, payload, region: opts.region })
    if (action === 'DescribeTopics') {
      const all = fixture('cls-topics.json')
      let topics = (all.Topics as TopicListItem[])
      const filter = (payload as { Filters?: Array<{ Key: string; Values: string[] }> }).Filters?.[0]
      if (filter?.Key === 'topicId') topics = topics.filter((item) => filter.Values.includes(String(item.TopicId)))
      if (filter?.Key === 'topicName') topics = topics.filter((item) => String(item.TopicName || '').includes(filter.Values[0] || ''))
      if (filter?.Key === 'logsetName') topics = topics.filter((item) => String(item.LogsetName || '').includes(filter.Values[0] || ''))
      return { Topics: topics, TotalCount: topics.filter((item) => item.BizType !== 1).length }
    }
    if (action === 'DescribeLogsets') return fixture('cls-logsets.json')
    if (action === 'SearchLog') return fixture('cls-search.json')
    return {}
  }
}

function trustedReq(body: unknown): IncomingMessage {
  const raw = JSON.stringify(body)
  return {
    method: 'POST',
    url: '/cloud-infra',
    headers: { host: '127.0.0.1:3091', origin: 'http://127.0.0.1:3091' },
    socket: { remoteAddress: '127.0.0.1' },
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(raw)
    },
  } as IncomingMessage
}

function res() {
  const out = { status: 0, body: '' }
  const response = {
    statusCode: 0,
    setHeader() {},
    end(text: string) {
      out.status = response.statusCode
      out.body = String(text || '')
    },
  }
  return { response: response as unknown as ServerResponse, out }
}

test('mapTopicItem maps console 日志主题 columns (g1.2)', () => {
  const item = (fixture('cls-topics.json').Topics as TopicListItem[])[0]
  const card = mapTopicItem({ ...item, LogsetName: 'prod-web' }, 'ap-guangzhou')
  assert.equal(card.kind, 'cls')
  assert.equal(card.title, 'nginx-access')
  assert.equal(card.openLabel, '检索分析')
  assert.equal(card.id, 'tencent.cls:ap-guangzhou:cce2db26-4a11-43f3-ae7d-3502a4b424fd')
  assert.deepEqual(card.columns, [
    { label: '主题ID', value: 'cce2db26-4a11-43f3-ae7d-3502a4b424fd' },
    { label: '日志集', value: 'prod-web' },
    { label: '存储类型', value: '标准存储' },
    { label: '保存时间', value: '30 天' },
    { label: '创建时间', value: '2026-01-12 10:03:11' },
  ])
  assert.equal(storageLabel('cold'), '低频存储')
  assert.equal(periodLabel(14), '14 天')
})

test('mapLogHit keeps time source fields and raw (g1.3)', () => {
  const hit = mapLogHit((fixture('cls-search.json').Results as SearchLogItem[])[0])
  assert.equal(hit.timeMs, 1756385463182)
  assert.equal(hit.source, '10.0.1.8')
  assert.equal(hit.content, '10.0.1.8 POST /api/pay 500 902ms')
  assert.equal(hit.fields?.status, '500')
  assert.match(hit.timeLabel, /2026|2025|2024/)
})

test('parseTopicRef and default region (g1.1)', () => {
  assert.deepEqual(parseTopicRef('tencent.cls:ap-beijing:cce2db26-4a11-43f3-ae7d-3502a4b424fd'), {
    moduleId: 'tencent.cls',
    region: 'ap-beijing',
    topicId: 'cce2db26-4a11-43f3-ae7d-3502a4b424fd',
  })
  assert.equal(DEFAULT_CLS_REGION, 'ap-guangzhou')
  assert.equal(resolveClsRegion('北京'), 'ap-beijing')
  assert.equal(resolveClsRegion('me-saudi-arabia'), 'me-riyadh')
  assert.equal(parseRegionHint('北京的 CLS').region, 'ap-beijing')
  assert.equal(resolveTimeRange(undefined).range, '1h')
})

test('official region catalog covers 大陆/港澳台/海外/金融/特殊 (g1.1)', () => {
  const groups = new Set(CLS_REGIONS.map((item) => item.group))
  for (const group of ['大陆', '港澳台', '海外', '金融', '特殊'] as const) assert.equal(groups.has(group), true)
  assert.ok(CLS_REGIONS.some((item) => item.id === 'ap-guangzhou'))
  assert.ok(CLS_REGIONS.some((item) => item.id === 'ap-beijing-fsi'))
  assert.ok(CLS_REGIONS.some((item) => item.id === 'ap-shanghai-adc'))
})

test('clsCall sends x-tc-region (g1.1)', async () => {
  let headers: Record<string, string> | undefined
  const fetchImpl = (async (_url: string, init?: RequestInit) => {
    headers = init?.headers as Record<string, string>
    return {
      ok: true,
      json: async () => ({ Response: { Topics: [], TotalCount: 0 } }),
    }
  }) as typeof fetch
  await clsCall('DescribeTopics', {}, { secretId: 'id', secretKey: 'key' }, {
    timeoutMs: 1000,
    region: 'ap-beijing',
    fetchImpl,
  })
  assert.equal(headers?.['x-tc-region'], 'ap-beijing')
})

test('createClsModule list maps DescribeTopics and skips metric topics (g1.2)', async () => {
  const calls: Array<{ action: string; payload: unknown; region: string }> = []
  const module = createClsModule(fakeCall(calls) as never)
  const listed = await module.list({
    creds: { secretId: 'id', secretKey: 'key' },
    query: '',
    offset: 0,
    limit: 12,
    timeoutMs: 5000,
    region: 'ap-guangzhou',
  })
  assert.equal(listed.view, 'list')
  assert.equal(listed.region, 'ap-guangzhou')
  assert.equal(listed.items.length, 3)
  assert.equal(listed.items[0].title, 'nginx-access')
  assert.equal(listed.items[0].columns?.find((col) => col.label === '日志集')?.value, 'prod-web')
  assert.equal(listed.items.some((item) => item.title === 'cpu-metric'), false)
  assert.equal(calls[0]?.action, 'DescribeTopics')
  assert.equal(calls[0]?.region, 'ap-guangzhou')
  assert.ok(listed.regions?.some((item) => item.group === '金融'))
})

test('createClsModule search sends SearchLog TopicId/From/To/CQL (g1.3)', async () => {
  const calls: Array<{ action: string; payload: unknown; region: string }> = []
  const module = createClsModule(fakeCall(calls) as never)
  const searched = await module.search?.({
    creds: { secretId: 'id', secretKey: 'key' },
    query: 'nginx-access',
    offset: 0,
    limit: 12,
    timeoutMs: 5000,
    region: 'ap-guangzhou',
    queryString: 'status:500',
    range: '1h',
  })
  const searchCall = calls.find((row) => row.action === 'SearchLog')
  assert.ok(searchCall)
  const payload = searchCall!.payload as {
    TopicId?: string
    TopicIds?: string[]
    From?: number
    To?: number
    Query?: string
    QueryString?: string
    QuerySyntax?: number
    SyntaxRule?: number
  }
  assert.equal(payload.TopicId, 'cce2db26-4a11-43f3-ae7d-3502a4b424fd')
  assert.equal(payload.QueryString, 'status:500')
  assert.equal(payload.QuerySyntax, 1)
  assert.equal(payload.Query, undefined)
  assert.equal(payload.SyntaxRule, undefined)
  assert.equal(payload.TopicIds, undefined)
  assert.ok((payload.From || 0) > 0)
  assert.ok((payload.To || 0) > (payload.From || 0))
  assert.equal(searchCall!.region, 'ap-guangzhou')
  assert.equal(searched?.logs.length, 2)
  assert.equal(searched?.hasMore, true)
  assert.equal(searched?.context, 'next-page-token')
})

test('empty CQL still searches the window (g1.3)', async () => {
  const calls: Array<{ action: string; payload: unknown; region: string }> = []
  const module = createClsModule(fakeCall(calls) as never)
  await module.search?.({
    creds: { secretId: 'id', secretKey: 'key' },
    query: '',
    offset: 0,
    limit: 12,
    timeoutMs: 5000,
    topicId: 'cce2db26-4a11-43f3-ae7d-3502a4b424fd',
    region: 'ap-beijing',
    queryString: '',
    range: '15m',
  })
  const payload = calls.find((row) => row.action === 'SearchLog')?.payload as {
    QueryString?: string
    QuerySyntax?: number
    TopicIds?: string[]
  }
  assert.equal(payload.QueryString, '')
  assert.equal(payload.QuerySyntax, 1)
  assert.equal(payload.TopicIds, undefined)
  assert.equal(calls.find((row) => row.action === 'SearchLog')?.region, 'ap-beijing')
})

test('normalizeCql maps Chinese 或 to CQL OR', () => {
  assert.equal(normalizeCql('status:500 或 level:ERROR'), 'status:500 OR level:ERROR')
  assert.equal(normalizeCql('  '), '')
})

test('duplicate topic names ask for id or logset (g1.3)', async () => {
  const call = async (action: string) => {
    if (action === 'DescribeTopics') {
      return {
        Topics: [
          { TopicId: 'aaa', TopicName: 'nginx-access', LogsetId: 'one', BizType: 0 },
          { TopicId: 'bbb', TopicName: 'nginx-access', LogsetId: 'two', BizType: 0 },
        ],
        TotalCount: 2,
      }
    }
    if (action === 'DescribeLogsets') {
      return {
        Logsets: [
          { LogsetId: 'one', LogsetName: 'prod-web' },
          { LogsetId: 'two', LogsetName: 'prod-edge' },
        ],
      }
    }
    throw new Error('should not SearchLog')
  }
  const module = createClsModule(call as never)
  const searched = await module.search?.({
    creds: { secretId: 'id', secretKey: 'key' },
    query: 'nginx-access',
    offset: 0,
    limit: 12,
    timeoutMs: 5000,
    queryString: 'status:500',
    range: '1h',
  })
  assert.match(searched?.error || '', /主题 ID 或日志集/)
  assert.equal(searched?.items?.length, 2)
  assert.equal(searched?.logs.length, 0)
})

test('Region is not a tencent required credential (g1.1 g1.4)', () => {
  const tencent = registry.getProvider('tencent')
  assert.ok(tencent)
  assert.deepEqual(tencent!.fields.map((field) => field.key).sort(), ['secretId', 'secretKey'])
  const cfg = withDefaults({
    providers: { tencent: { secretId: 'AKIDabcdefghijklmnop', secretKey: 'keep-me-secret-key' } },
  })
  assert.doesNotMatch(JSON.stringify(persistable(cfg)), /clsRegion|"region"/)
  const patch = sanitizePatch({
    region: 'ap-beijing',
    clsRegion: 'ap-beijing',
    providers: { tencent: { secretId: 'AKIDabcdefghijklmnop', region: 'ap-beijing' } },
  })
  assert.equal((patch as { region?: string }).region, undefined)
  assert.equal((patch as { clsRegion?: string }).clsRegion, undefined)
  assert.equal((patch.providers?.tencent as { region?: string } | undefined)?.region, undefined)
})

test('query/search/detail never write overlay (g1.4)', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'cloud-infra-cls-'))
  const prev = process.env.DSH_HOME
  process.env.DSH_HOME = tmp
  try {
    const cfg = withDefaults({
      timeoutMs: 2000,
      providers: { tencent: { secretId: 'AKIDabcdefghijklmnop', secretKey: 'keep-me-secret-key' } },
    })
    writeOverlay(cfg)
    const before = readFileSync(join(tmp, 'cloud-infra.json'), 'utf8')
    const dry = withDefaults({
      timeoutMs: 2000,
      providers: { tencent: { enabled: true } },
    })
    for (const method of ['query', 'search', 'detail'] as const) {
      const boxed = res()
      await handleApi(trustedReq({
        method,
        kind: 'cls',
        region: 'ap-beijing',
        query: 'nginx-access',
        topicId: 'cce2db26-4a11-43f3-ae7d-3502a4b424fd',
        id: 'tencent.cls:ap-beijing:cce2db26-4a11-43f3-ae7d-3502a4b424fd',
        moduleId: 'tencent.cls',
        queryString: 'status:500',
        range: '1h',
      }), boxed.response, dry)
      assert.ok(boxed.out.status === 200 || boxed.out.status >= 400)
    }
    const after = readFileSync(join(tmp, 'cloud-infra.json'), 'utf8')
    assert.equal(after, before)
    assert.doesNotMatch(after, /ap-beijing/)
  } finally {
    process.env.DSH_HOME = prev
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('wantsSearch and default kind stay domain (g2.1)', () => {
  assert.equal(wantsSearch({ kind: 'cls' }), false)
  assert.equal(wantsSearch({ kind: 'cls', query: 'nginx-access' }), false)
  assert.equal(wantsSearch({ kind: 'cls', query: 'nginx-access', range: '1h' }), true)
  assert.equal(wantsSearch({ kind: 'cls', topicId: 'abc', queryString: '' }), true)
  assert.equal(wantsSearch({ kind: 'cls', view: 'list', range: '1h', query: 'x' }), false)
  assert.equal(wantsSearch({ kind: 'domain' }), false)
})

test('queryResources kind default stays domain; CLS render stays on the chat card (g2.1 g2.2)', () => {
  assert.equal(wantsSearch({ kind: 'cls' }), false)
  const text = renderQuery({
    query: '',
    kind: 'cls',
    view: 'list',
    region: 'ap-guangzhou',
    items: [{
      id: 'tencent.cls:ap-guangzhou:1',
      moduleId: 'tencent.cls',
      provider: 'tencent',
      kind: 'cls',
      title: 'nginx-access',
      description: '',
      openLabel: '检索分析',
      columns: [{ label: '主题ID', value: '1' }],
    }],
    errors: [],
    total: 1,
  })
  assert.match(text, /对话卡片/)
  assert.match(text, /检索分析/)
  assert.doesNotMatch(text, /点击「解析」/)
  const searchText = renderQuery({
    query: 'nginx-access',
    kind: 'cls',
    view: 'search',
    topicName: 'nginx-access',
    logs: [{ timeMs: 1, timeLabel: '', content: 'x' }],
    items: [],
    errors: [],
  })
  assert.match(searchText, /检索分析/)
  assert.match(searchText, /对话卡片/)
})

test('host tool and prompt route CLS to the chat card (g2.2)', () => {
  const host = readFileSync(join(root, 'src/host.ts'), 'utf8')
  assert.match(host, /kind=domain \(default\)/)
  assert.match(host, /kind=cls/)
  assert.match(host, /日志主题/)
  assert.match(host, /检索分析/)
  assert.match(host, /conversation tool card/)
  assert.match(host, /Do not write settings/)
  assert.match(host, /args\.kind != null \? String\(args\.kind\) : 'domain'/)
  assert.doesNotMatch(host, /if\s*\(.*provider\s*===\s*['"]tencent['"]/)
})

test('client CLS card stays inside ci-panel and does not save config (g2.3 g1.4)', () => {
  const client = readFileSync(join(root, 'src/client.js'), 'utf8')
  assert.match(client, /日志主题/)
  assert.match(client, /检索分析/)
  assert.match(client, /语句模式 · CQL · 空则查全部/)
  assert.match(client, /日志时间/)
  assert.match(client, /原始日志倒排/)
  assert.match(client, /不写设置/)
  assert.match(client, /主题名 \/ ID \/ 日志集/)
  assert.match(client, /optgroup/)
  assert.match(client, /kind === "cls"/)
  assert.match(client, /api\("search"/)
  assert.match(client, /api\("query"/)
  assert.match(client, /view: "list"/)
  assert.match(client, /继续拉取/)
  assert.match(client, /近 15 分钟/)
  assert.match(client, /自定义/)
  assert.match(client, /status:500 OR level:ERROR/)
  assert.doesNotMatch(client, /status:500 {2}或/)
  assert.match(client, /\.ci-table-scroll\{overflow-x:auto/)
  assert.match(client, /\.ci-table\{width:max-content;min-width:100%/)
  assert.match(client, /\.ci-table th,\.ci-table td\{[^}]*white-space:nowrap/)
  assert.match(client, /className: "ci-search-bar"/)
  assert.match(client, /ci-empty-search/)
  assert.match(client, /function keepClsTopic/)
  assert.match(client, /function topicCaption/)
  const hostSrc = readFileSync(join(root, 'src/host.ts'), 'utf8')
  assert.match(hostSrc, /title: String\(body.title/)
  const start = client.indexOf('function ClsCard')
  const end = client.indexOf('function SearchToolView', start)
  const clsCard = client.slice(start, end > start ? end : undefined)
  assert.ok(start >= 0 && end > start)
  assert.doesNotMatch(clsCard, /save:\s*true/)
  assert.doesNotMatch(clsCard, /method:\s*"config"/)
  assert.doesNotMatch(client, /if\s*\(.*===\s*['"]tencent['"]/)
  assert.match(client, /域名解析/)
  assert.match(client, /请输入域名关键字/)
  assert.match(client, /function DetailView/)
})

test('tencent.cls is registered and settings can toggle it (g2.4)', () => {
  const module = registry.getModule('tencent.cls')
  assert.equal(module?.kind, 'cls')
  assert.equal(module?.title, '腾讯云 CLS')
  assert.equal(module?.implemented, true)
  assert.ok(registry.getModule('tencent.domain'))
  const client = readFileSync(join(root, 'src/client.js'), 'utf8')
  assert.match(client, /key:\s*"cloud-infra"/)
  assert.match(client, /draft\.modules\[module\.id\] !== false/)
})
