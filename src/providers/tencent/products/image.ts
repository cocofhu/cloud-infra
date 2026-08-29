import { publicErrorMessage } from '../../../core/safe-error.js'
import { registerModule } from '../../../core/registry.js'
import type {
  ModuleContext,
  ModuleError,
  ResourceAction,
  ResourceCard,
  ResourceDetail,
  ResourceModule,
  ResourceTable,
  ResourceTableRow,
} from '../../../core/types.js'
import { tcrCall } from '../client.js'

export const TCR_VERSION = '2019-09-24'
export const PERSONAL_INSTANCE_ID = 'personal:ap-guangzhou'
export const PERSONAL_DOMAIN = 'ccr.ccs.tencentyun.com'
export const DEFAULT_REGION = 'ap-guangzhou'
export const MODULE_ID = 'tencent.image'
export const LIST_PAGE_SIZE = 100
export const TRUNCATED_HINT = '仅显示前 100 条'

export const TCR_REGIONS = [
  { id: 'ap-guangzhou', label: '广州' },
  { id: 'ap-shanghai', label: '上海' },
  { id: 'ap-beijing', label: '北京' },
  { id: 'ap-nanjing', label: '南京' },
  { id: 'ap-chengdu', label: '成都' },
] as const

export type TcrCall = typeof tcrCall

export interface RegistryItem {
  RegistryId?: string
  RegistryName?: string
  RegistryType?: string
  Status?: string
  PublicDomain?: string
  RegionName?: string
}

export interface NamespaceItem {
  Name?: string
  Namespace?: string
  Public?: boolean | number
  CreationTime?: string
  NamespaceId?: string
}

export interface RepositoryItem {
  Name?: string
  RepoName?: string
  Namespace?: string
  Public?: boolean | number
  CreationTime?: string
  CreateTime?: string
  UpdateTime?: string
  TagCount?: number
}

export interface ImageItem {
  ImageVersion?: string
  TagName?: string
  Digest?: string
  Size?: number
  UpdateTime?: string
}

const ACTIONS: ResourceAction[] = [
  { id: 'image.delete', label: '删除镜像版本', confirm: 'always' },
  { id: 'image.pull', label: '拉取指令', confirm: 'default' },
]

export const DIGEST_WARNING = '注意：删除指定版本可能同时删除相同镜像 ID（SHA256）的其它版本。'

export function regionLabel(id: string): string {
  return TCR_REGIONS.find((item) => item.id === id)?.label || id
}

export function inferRegion(query: string): { region: string; rest: string } {
  const text = String(query || '').trim()
  const pairs: Array<[RegExp, string]> = [
    [/广州|guangzhou/i, 'ap-guangzhou'],
    [/上海|shanghai/i, 'ap-shanghai'],
    [/北京|beijing/i, 'ap-beijing'],
    [/南京|nanjing/i, 'ap-nanjing'],
    [/成都|chengdu/i, 'ap-chengdu'],
  ]
  for (const [re, id] of pairs) {
    if (re.test(text)) return { region: id, rest: text.replace(re, ' ').replace(/\s+/g, ' ').trim() }
  }
  return { region: DEFAULT_REGION, rest: text }
}

const UTTERANCE_PHRASES = [
  '镜像仓库',
  '容器镜像',
  '镜像服务',
  '查一下',
  '看一下',
  '请帮我',
  '腾讯云',
  '查下',
  '看看',
  '帮我',
  '列出',
  '列表',
  '查询',
  '我的',
  '一下',
  '请',
  '镜像',
  '实例',
  '仓库',
  '版本',
]

/** Strip chat filler / region words so "查一下我的镜像" is not used as an instance keyword. */
export function resourceKeyword(query: string): string {
  let { rest } = inferRegion(query)
  for (const phrase of UTTERANCE_PHRASES) rest = rest.split(phrase).join(' ')
  rest = rest.replace(/\b(?:listing|list|images?|registry|tencent)\b/gi, ' ')
  rest = rest.replace(/(?:^|\s)TCR(?:\s|$)/gi, ' ')
  return rest.replace(/[，。！？、]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function parseInstanceRef(id: string): { moduleId: string; instanceId: string } {
  const raw = String(id || '').trim()
  const prefix = `${MODULE_ID}:`
  if (raw.startsWith(prefix)) return { moduleId: MODULE_ID, instanceId: raw.slice(prefix.length) }
  return { moduleId: MODULE_ID, instanceId: raw || PERSONAL_INSTANCE_ID }
}

export function isPersonalInstance(id: string): boolean {
  const { instanceId } = parseInstanceRef(id)
  return instanceId === PERSONAL_INSTANCE_ID || instanceId === 'personal' || instanceId.startsWith('personal:')
}

export function formatSize(bytes?: number): string {
  if (bytes == null || !Number.isFinite(Number(bytes))) return '-'
  let n = Number(bytes)
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i += 1
  }
  const value = i === 0 || n >= 10 ? String(Math.round(n)) : n.toFixed(1)
  return `${value} ${units[i]}`
}

export function accessLabel(value: boolean | number | undefined): string {
  if (value === true || value === 1 || String(value).toLowerCase() === 'true') return '公有'
  return '私有'
}

export function instanceStatus(status?: string): ResourceCard['status'] {
  const value = String(status || '').toLowerCase()
  if (!value || value === 'running' || value === 'enable' || value === 'normal') return 'enable'
  if (value === 'paused' || value === 'pause' || value === 'stopped') return 'pause'
  if (value === 'error' || value === 'failed' || value === 'abnormal') return 'error'
  return 'unknown'
}

export function personalCard(moduleId = MODULE_ID): ResourceCard {
  return {
    id: `${moduleId}:${PERSONAL_INSTANCE_ID}`,
    moduleId,
    provider: 'tencent',
    kind: 'image',
    title: '个人版实例',
    description: PERSONAL_DOMAIN,
    status: 'enable',
    badges: ['运行中', '个人版'],
    columns: [
      { label: '类型', value: '个人版' },
      { label: '访问域名', value: PERSONAL_DOMAIN },
      { label: '地域', value: '广州' },
    ],
    openLabel: '仓库',
  }
}

export function mapEnterpriseInstance(item: RegistryItem, region: string, moduleId = MODULE_ID): ResourceCard {
  const registryId = String(item.RegistryId || '')
  const title = item.RegistryName || registryId
  const domain = item.PublicDomain || ''
  const status = instanceStatus(item.Status)
  return {
    id: `${moduleId}:${registryId}`,
    moduleId,
    provider: 'tencent',
    kind: 'image',
    title,
    description: domain || title,
    status,
    badges: [status === 'enable' ? '运行中' : (item.Status || ''), '企业版'].filter(Boolean),
    columns: [
      { label: '类型', value: '企业版' },
      { label: '访问域名', value: domain },
      { label: '地域', value: regionLabel(item.RegionName || region) },
      { label: '实例ID', value: registryId },
    ],
    openLabel: '仓库',
  }
}

export function splitRepoName(raw: string, namespace?: string): { namespace: string; name: string; full: string } {
  const text = String(raw || '').replace(/^\//, '')
  if (namespace && text && !text.includes('/')) {
    return { namespace, name: text, full: `${namespace}/${text}` }
  }
  const idx = text.indexOf('/')
  if (idx > 0) {
    return { namespace: text.slice(0, idx), name: text.slice(idx + 1), full: text }
  }
  return { namespace: namespace || '', name: text, full: text }
}

export function pullCommand(opts: {
  personal: boolean
  publicDomain?: string
  namespace: string
  repository: string
  tag: string
}): string {
  const host = opts.personal ? PERSONAL_DOMAIN : String(opts.publicDomain || '').trim()
  const path = [opts.namespace, opts.repository].filter(Boolean).join('/')
  const tag = String(opts.tag || '').trim() || 'latest'
  if (!host) return `docker pull ${path}:${tag}`
  return `docker pull ${host}/${path}:${tag}`
}

function matchesQuery(query: string, ...values: Array<string | undefined>): boolean {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return true
  return values.some((value) => String(value || '').toLowerCase().includes(q))
}

export function createImageModule(call: TcrCall = tcrCall): ResourceModule {
  const module: ResourceModule = {
    id: MODULE_ID,
    provider: 'tencent',
    kind: 'image',
    title: '腾讯云容器镜像',
    implemented: true,
    actions: ACTIONS,
    async list(ctx) {
      const inferred = inferRegion(ctx.query)
      const region = (ctx.region || '').trim() || inferred.region
      const items: ResourceCard[] = []
      const errors: ModuleError[] = []
      if (region === DEFAULT_REGION) items.push(personalCard(module.id))
      try {
        const data = await call<{ Registries?: RegistryItem[]; TotalCount?: number }>(
          'DescribeInstances',
          { Offset: 0, Limit: LIST_PAGE_SIZE },
          creds(ctx),
          opts(ctx, region),
        )
        const registries = data.Registries || []
        for (const item of registries) {
          items.push(mapEnterpriseInstance(item, region, module.id))
        }
        const fetched = registries.length
        const totalCount = data.TotalCount ?? fetched
        return {
          items,
          total: items.length,
          offset: 0,
          hasMore: totalCount > fetched,
          region,
          errors,
        }
      } catch (err) {
        if (!items.length) throw err
        errors.push({ moduleId: module.id, message: publicErrorMessage(err) })
        return {
          items,
          total: items.length,
          offset: 0,
          hasMore: false,
          region,
          errors,
        }
      }
    },
    async detail(ctx) {
      const inferred = inferRegion(ctx.query)
      const region = (ctx.region || '').trim() || inferred.region
      const keyword = resourceKeyword(ctx.query)
      const { instanceId } = parseInstanceRef(String(ctx.instanceId || ctx.id || ''))
      const view = normalizeView(ctx.view)
      const personal = isPersonalInstance(instanceId)
      if (personal && region !== DEFAULT_REGION) {
        return emptyDetail(personalCard(module.id), region, instanceId, view, '个人版实例仅在广州可用')
      }
      const card = personal
        ? personalCard(module.id)
        : await loadEnterpriseCard(call, ctx, region, instanceId)
      if (view === 'namespaces') {
        const table = personal
          ? await listPersonalNamespaces(call, ctx, keyword)
          : await listEnterpriseNamespaces(call, ctx, region, instanceId, keyword)
        return withTable(card, region, instanceId, view, table, namespaceFields(card))
      }
      if (view === 'tags') {
        const ns = String(ctx.namespace || '').trim()
        const repo = String(ctx.repository || '').trim()
        if (!ns || !repo) return withTable(card, region, instanceId, view, emptyTable('tags', TAG_COLUMNS), repoFields(ns, repo, card))
        const table = personal
          ? await listPersonalTags(call, ctx, ns, repo, keyword)
          : await listEnterpriseTags(call, ctx, region, instanceId, ns, repo, keyword)
        return withTable(card, region, instanceId, view, table, repoFields(ns, repo, card), { namespace: ns, repository: repo })
      }
      const nsFilter = String(ctx.namespace || '').trim()
      const table = personal
        ? await listPersonalRepos(call, ctx, keyword, nsFilter)
        : await listEnterpriseRepos(call, ctx, region, instanceId, keyword, nsFilter)
      return withTable(card, region, instanceId, view, table, namespaceFields(card), nsFilter ? { namespace: nsFilter } : undefined)
    },
    async execute(actionId, payload, ctx) {
      const region = String(payload.region || ctx.region || DEFAULT_REGION)
      const { instanceId } = parseInstanceRef(String(payload.instanceId || ctx.instanceId || ctx.id || ''))
      const personal = isPersonalInstance(instanceId)
      const namespace = String(payload.namespace || ctx.namespace || '').trim()
      const repository = String(payload.repository || ctx.repository || '').trim()
      const tag = String(payload.tag || payload.imageVersion || payload.version || '').trim()
      const publicDomain = String(payload.publicDomain || (personal ? PERSONAL_DOMAIN : '')).trim()
      try {
        if (actionId === 'image.pull') {
          if (!namespace || !repository || !tag) return { ok: false, error: '缺少仓库或版本' }
          return {
            ok: true,
            command: pullCommand({ personal, publicDomain, namespace, repository, tag }),
          }
        }
        if (actionId === 'image.delete') {
          if (!namespace || !repository || !tag) return { ok: false, error: '缺少仓库或版本' }
          if (personal) {
            await call('DeleteImagePersonal', {
              RepoName: `${namespace}/${repository}`,
              Tag: tag,
            }, creds(ctx), opts(ctx, DEFAULT_REGION))
            return { ok: true }
          }
          await call('DeleteImage', {
            RegistryId: instanceId,
            NamespaceName: namespace,
            RepositoryName: repository,
            ImageVersion: tag,
          }, creds(ctx), opts(ctx, region))
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

const NS_COLUMNS = [
  { key: 'name', label: '名称' },
  { key: 'access', label: '访问级别' },
]

const REPO_COLUMNS = [
  { key: 'name', label: '仓库名称' },
  { key: 'namespace', label: '命名空间' },
  { key: 'access', label: '类型' },
  { key: 'tags', label: 'Tag 数' },
  { key: 'created', label: '创建时间' },
  { key: 'updated', label: '更新时间' },
]

const TAG_COLUMNS = [
  { key: 'version', label: '镜像版本' },
  { key: 'digest', label: '镜像ID' },
  { key: 'size', label: '大小' },
  { key: 'updated', label: '更新时间' },
]

function normalizeView(view?: string): 'namespaces' | 'repos' | 'tags' {
  const value = String(view || '').toLowerCase()
  if (view === 'ns' || value === 'namespaces' || value === 'namespace') return 'namespaces'
  if (value === 'tags' || value === 'tag' || value === 'versions' || value === 'detail') return 'tags'
  return 'repos'
}

function emptyTable(id: string, columns: ResourceTable['columns']): ResourceTable {
  return { id, columns, rows: [], total: 0, hasMore: false }
}

function pagedTable(
  id: string,
  columns: ResourceTable['columns'],
  rows: ResourceTableRow[],
  totalCount: number | undefined,
  fetched: number,
): ResourceTable {
  const total = Number.isFinite(Number(totalCount)) ? Number(totalCount) : fetched
  const hasMore = total > fetched
  return {
    id,
    columns,
    rows,
    total,
    hasMore,
    title: hasMore ? TRUNCATED_HINT : undefined,
  }
}

function namespaceFields(card: ResourceCard) {
  return [
    { label: '实例', value: card.title },
    { label: '类型', value: col(card, '类型') },
    { label: '访问域名', value: col(card, '访问域名') || card.description },
  ].filter((row) => row.value)
}

function repoFields(namespace: string, repository: string, card: ResourceCard) {
  return [
    { label: '仓库', value: [namespace, repository].filter(Boolean).join('/') },
    { label: '命名空间', value: namespace },
    { label: '实例', value: card.title },
    { label: '访问域名', value: col(card, '访问域名') || card.description },
  ].filter((row) => row.value)
}

function withTable(
  card: ResourceCard,
  region: string,
  instanceId: string,
  view: string,
  table: ResourceTable,
  fields: Array<{ label: string; value: string }>,
  extra: { namespace?: string; repository?: string } = {},
): ResourceDetail {
  return {
    card,
    fields,
    tables: [table],
    scope: {
      region,
      instanceId,
      view,
      namespace: extra.namespace,
      repository: extra.repository,
    },
  }
}

function emptyDetail(card: ResourceCard, region: string, instanceId: string, view: string, message: string): ResourceDetail {
  return {
    card,
    fields: [{ label: '说明', value: message }],
    tables: [emptyTable(view === 'namespaces' ? 'namespaces' : view === 'tags' ? 'tags' : 'repos', view === 'namespaces' ? NS_COLUMNS : view === 'tags' ? TAG_COLUMNS : REPO_COLUMNS)],
    scope: { region, instanceId, view },
  }
}

async function loadEnterpriseCard(call: TcrCall, ctx: ModuleContext, region: string, instanceId: string): Promise<ResourceCard> {
  const data = await call<{ Registries?: RegistryItem[] }>(
    'DescribeInstances',
    { Offset: 0, Limit: LIST_PAGE_SIZE },
    creds(ctx),
    opts(ctx, region),
  )
  const found = (data.Registries || []).find((item) => String(item.RegistryId) === instanceId)
  if (found) return mapEnterpriseInstance(itemOr(found), region, MODULE_ID)
  return mapEnterpriseInstance({ RegistryId: instanceId, RegistryName: instanceId, Status: 'Running' }, region, MODULE_ID)
}

function itemOr(item: RegistryItem): RegistryItem {
  return item
}

async function listPersonalNamespaces(call: TcrCall, ctx: ModuleContext, keyword: string): Promise<ResourceTable> {
  const data = await call<{ Data?: { NamespaceInfo?: NamespaceItem[]; NamespaceCount?: number } }>(
    'DescribeNamespacePersonal',
    { Offset: 0, Limit: LIST_PAGE_SIZE, Namespace: keyword || undefined },
    creds(ctx),
    opts(ctx, DEFAULT_REGION),
  )
  const raw = data.Data?.NamespaceInfo || []
  const rows = raw
    .map((item) => {
      const name = String(item.Namespace || item.Name || '')
      return {
        id: name,
        cells: { name, access: accessLabel(item.Public) },
      } satisfies ResourceTableRow
    })
    .filter((row) => matchesQuery(keyword, row.cells.name))
  return pagedTable('namespaces', NS_COLUMNS, rows, data.Data?.NamespaceCount ?? raw.length, raw.length)
}

async function listEnterpriseNamespaces(call: TcrCall, ctx: ModuleContext, region: string, instanceId: string, keyword: string): Promise<ResourceTable> {
  const data = await call<{ NamespaceList?: NamespaceItem[]; TotalCount?: number }>(
    'DescribeNamespaces',
    { RegistryId: instanceId, NamespaceName: keyword || undefined, Offset: 0, Limit: LIST_PAGE_SIZE },
    creds(ctx),
    opts(ctx, region),
  )
  const raw = data.NamespaceList || []
  const rows = raw
    .map((item) => {
      const name = String(item.Name || item.Namespace || '')
      return {
        id: name,
        cells: { name, access: accessLabel(item.Public) },
      } satisfies ResourceTableRow
    })
    .filter((row) => matchesQuery(keyword, row.cells.name))
  return pagedTable('namespaces', NS_COLUMNS, rows, data.TotalCount ?? raw.length, raw.length)
}

async function listPersonalRepos(call: TcrCall, ctx: ModuleContext, keyword: string, nsFilter: string): Promise<ResourceTable> {
  const data = await call<{ Data?: { RepoInfo?: RepositoryItem[]; TotalCount?: number } }>(
    'DescribeRepositoryOwnerPersonal',
    { Offset: 0, Limit: LIST_PAGE_SIZE, RepoName: keyword || undefined },
    creds(ctx),
    opts(ctx, DEFAULT_REGION),
  )
  const raw = data.Data?.RepoInfo || []
  const rows = raw
    .map((item) => mapRepoRow(item))
    .filter((row) => {
      if (nsFilter && row.cells.namespace !== nsFilter) return false
      return matchesQuery(keyword, row.cells.name, row.cells.namespace)
    })
  return pagedTable('repos', REPO_COLUMNS, rows, data.Data?.TotalCount ?? raw.length, raw.length)
}

async function listEnterpriseRepos(call: TcrCall, ctx: ModuleContext, region: string, instanceId: string, keyword: string, nsFilter: string): Promise<ResourceTable> {
  const data = await call<{ RepositoryList?: RepositoryItem[]; TotalCount?: number }>(
    'DescribeRepositories',
    {
      RegistryId: instanceId,
      NamespaceName: nsFilter || undefined,
      RepositoryName: keyword || undefined,
      Offset: 0,
      Limit: LIST_PAGE_SIZE,
    },
    creds(ctx),
    opts(ctx, region),
  )
  const raw = data.RepositoryList || []
  const rows = raw
    .map((item) => mapRepoRow(item))
    .filter((row) => {
      if (nsFilter && row.cells.namespace !== nsFilter) return false
      return matchesQuery(keyword, row.cells.name, row.cells.namespace)
    })
  return pagedTable('repos', REPO_COLUMNS, rows, data.TotalCount ?? raw.length, raw.length)
}

function mapRepoRow(item: RepositoryItem): ResourceTableRow {
  const parsed = splitRepoName(String(item.RepoName || item.Name || ''), item.Namespace)
  return {
    id: parsed.full,
    cells: {
      name: parsed.full,
      namespace: parsed.namespace,
      access: accessLabel(item.Public),
      tags: item.TagCount != null ? String(item.TagCount) : '-',
      created: String(item.CreationTime || item.CreateTime || ''),
      updated: String(item.UpdateTime || ''),
    },
  }
}

async function listPersonalTags(call: TcrCall, ctx: ModuleContext, namespace: string, repository: string, keyword: string): Promise<ResourceTable> {
  const data = await call<{ Data?: { TagInfo?: ImageItem[]; TagCount?: number } }>(
    'DescribeImagePersonal',
    { RepoName: `${namespace}/${repository}`, Offset: 0, Limit: LIST_PAGE_SIZE, Tag: keyword || undefined },
    creds(ctx),
    opts(ctx, DEFAULT_REGION),
  )
  const raw = data.Data?.TagInfo || []
  const rows = raw
    .map(mapTagRow)
    .filter((row) => matchesQuery(keyword, row.cells.version, row.cells.digest))
  return pagedTable('tags', TAG_COLUMNS, rows, data.Data?.TagCount ?? raw.length, raw.length)
}

async function listEnterpriseTags(call: TcrCall, ctx: ModuleContext, region: string, instanceId: string, namespace: string, repository: string, keyword: string): Promise<ResourceTable> {
  const data = await call<{ ImageInfoList?: ImageItem[]; TotalCount?: number }>(
    'DescribeImages',
    {
      RegistryId: instanceId,
      NamespaceName: namespace,
      RepositoryName: repository,
      ImageVersion: keyword || undefined,
      Offset: 0,
      Limit: LIST_PAGE_SIZE,
    },
    creds(ctx),
    opts(ctx, region),
  )
  const raw = data.ImageInfoList || []
  const rows = raw
    .map(mapTagRow)
    .filter((row) => matchesQuery(keyword, row.cells.version, row.cells.digest))
  return pagedTable('tags', TAG_COLUMNS, rows, data.TotalCount ?? raw.length, raw.length)
}

function mapTagRow(item: ImageItem): ResourceTableRow {
  const version = String(item.ImageVersion || item.TagName || '')
  return {
    id: version,
    cells: {
      version,
      digest: String(item.Digest || ''),
      size: formatSize(item.Size),
      updated: String(item.UpdateTime || ''),
    },
  }
}

function creds(ctx: ModuleContext): { secretId: string; secretKey: string } {
  return { secretId: ctx.creds.secretId, secretKey: ctx.creds.secretKey }
}

function opts(ctx: ModuleContext, region: string): { timeoutMs: number; signal?: AbortSignal; region: string } {
  return { timeoutMs: ctx.timeoutMs, signal: ctx.signal, region }
}

function col(card: ResourceCard, label: string): string {
  return card.columns?.find((item) => item.label === label)?.value || ''
}

export const tencentImageModule = createImageModule()
registerModule(tencentImageModule)
