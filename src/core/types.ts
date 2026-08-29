export interface CredentialField {
  key: string
  label: string
  secret?: boolean
  placeholder?: string
}

export interface CloudProvider {
  id: string
  title: string
  fields: CredentialField[]
  color?: string
  enabledByDefault?: boolean
}

export type ResourceStatus = 'enable' | 'pause' | 'error' | 'unknown'

export interface ResourceColumn {
  label: string
  value: string
}

export interface ResourceCard {
  id: string
  moduleId: string
  provider: string
  kind: string
  title: string
  description: string
  status?: ResourceStatus
  badges?: string[]
  columns?: ResourceColumn[]
  openLabel?: string
  expiresAt?: string
  extras?: Record<string, string | number | boolean | null | undefined>
  meta?: Record<string, string | number | boolean | null | undefined>
  region?: string
  regionName?: string
  stateLabel?: string
  instanceId?: string
  privateIp?: string
  publicIp?: string
}

export interface DnsRecord {
  id: string
  host: string
  type: string
  value: string
  ttl?: number
  line?: string
  mx?: number
  status?: string
  remark?: string
}

export interface LogHit {
  timeMs: number
  timeLabel: string
  content: string
  source?: string
  fileName?: string
  fields?: Record<string, string>
}

export interface ClsRegionOption {
  id: string
  name: string
  group: string
}

export interface DirEntry {
  kind: 'folder' | 'file'
  name: string
  key: string
  size?: number
  storageClass?: string
  lastModified?: string
  url?: string
}

export interface RegionOption {
  id: string
  label: string
  aliases?: string[]
}

export interface DetailSection {
  id: string
  title: string
  fields?: Array<{ label: string; value: string }>
  rows?: Array<{ label: string; value: string }>
  empty?: string
}

export interface FieldGroup {
  title: string
  fields: Array<{ label: string; value: string }>
}

export interface DetailPage {
  id: string
  title: string
}

export interface DetailBlock {
  id: string
  title: string
  fields: Array<{ label: string; value: string }>
}

export interface DetailCard {
  id: string
  title: string
  status?: string
  badges?: string[]
  columns?: ResourceColumn[]
  fields?: Array<{ label: string; value: string }>
  flags?: Record<string, string | number | boolean | undefined>
}

export interface ResourceScope {
  region?: string
  instanceId?: string
  namespace?: string
  repository?: string
  view?: string
}

export interface ResourceTableColumn {
  key: string
  label: string
}

export interface ResourceTableRow {
  id: string
  cells: Record<string, string>
  badges?: string[]
}

export interface ResourceTable {
  id: string
  title?: string
  columns: ResourceTableColumn[]
  rows: ResourceTableRow[]
  total?: number
  hasMore?: boolean
}

export interface ResourceDetail {
  card: ResourceCard
  fields: Array<{ label: string; value: string }>
  groups?: FieldGroup[]
  records?: DnsRecord[]
  tables?: ResourceTable[]
  scope?: ResourceScope
  logs?: LogHit[]
  entries?: DirEntry[]
  prefix?: string
  region?: string
  bucket?: string
  hasMore?: boolean
  nextMarker?: string
  sections?: DetailSection[]
  extra?: Record<string, unknown>
  pages?: DetailPage[]
  blocks?: DetailBlock[]
  cards?: Record<string, DetailCard[]>
  flags?: Record<string, string | number | boolean | undefined>
}

export interface ResourceAction {
  id: string
  label: string
  confirm: 'always' | 'default'
  fields?: CredentialField[]
}

export interface ListResult {
  items: ResourceCard[]
  total?: number
  offset?: number
  hasMore?: boolean
  /** True when kind needs a region pick in the card; list must not hit upstream. */
  needsRegion?: boolean
  warnings?: string[]
  errors?: ModuleError[]
  region?: string
  instanceId?: string
  regions?: Array<string | ClsRegionOption | RegionOption>
  view?: string
}

export interface ModuleError {
  moduleId: string
  message: string
}

export interface QueryResult {
  query: string
  kind: string
  items: ResourceCard[]
  errors: ModuleError[]
  total?: number
  offset?: number
  hasMore?: boolean
  needsRegion?: boolean
  view?: string
  region?: string
  regions?: Array<string | ClsRegionOption | RegionOption>
  topicId?: string
  topicName?: string
  queryString?: string
  range?: string
  from?: number
  to?: number
  logs?: LogHit[]
  context?: string
  fields?: string[]
  instanceId?: string
  /** query 与某条卡片的 title / id 尾部完全相等（不区分大小写）时，该卡片的 id。 */
  directItemId?: string
  /** query 非空但未精确命中任何条目时的原始 query（回落到全量列表时由客户端提示）。 */
  notFoundQuery?: string
}

export interface ModuleContext {
  creds: Record<string, string>
  query: string
  offset: number
  limit: number
  timeoutMs: number
  signal?: AbortSignal
  /**
   * query 关键字在哪里过滤：
   * - undefined / true：模块不按 query 过滤，返回全量集合；queryResources 层负责直达判定与未命中回落；
   * - false（显式）：模块按既有逻辑自行过滤（远端 API 参数或本地过滤），用于兼容既有调用方与测试。
   */
  clientLocalFilter?: boolean
  id?: string
  title?: string
  group?: string
  region?: string
  prefix?: string
  marker?: string
  bucket?: string
  tab?: string
  filters?: Record<string, string>
  topicId?: string
  queryString?: string
  from?: number
  to?: number
  range?: string
  context?: string
  view?: string
  instanceId?: string
  namespace?: string
  repository?: string
}

export type ActionResult = { ok: true; command?: string; data?: Record<string, unknown> } | { ok: false; error: string }

export interface SearchResult {
  card?: ResourceCard
  items?: ResourceCard[]
  topicId?: string
  topicName?: string
  region: string
  queryString: string
  range: string
  from: number
  to: number
  logs: LogHit[]
  context?: string
  hasMore?: boolean
  total?: number
  fields?: string[]
  regions?: ClsRegionOption[]
  error?: string
}

export interface ResourceModule {
  id: string
  provider: string
  kind: string
  title: string
  implemented: boolean
  list: (ctx: ModuleContext) => Promise<ListResult>
  detail?: (ctx: ModuleContext) => Promise<ResourceDetail>
  search?: (ctx: ModuleContext) => Promise<SearchResult>
  execute?: (actionId: string, payload: Record<string, unknown>, ctx: ModuleContext) => Promise<ActionResult>
  actions?: ResourceAction[]
  regions?: RegionOption[]
}

export type ProviderBucket = Record<string, string | boolean | undefined>

export interface PluginConfig {
  timeoutMs: number
  maxResults: number
  skipConfirm: boolean
  providers: Record<string, ProviderBucket>
  modules: Record<string, boolean>
}

export interface PublicProviderConfig {
  id: string
  enabled: boolean
  configured: boolean
  values: Record<string, string>
}

export interface PublicConfig {
  timeoutMs: number
  maxResults: number
  skipConfirm: boolean
  providers: PublicProviderConfig[]
  modules: Record<string, boolean>
}

export interface ProviderMeta {
  id: string
  title: string
  color?: string
  enabledByDefault?: boolean
  fields: CredentialField[]
}

export interface ModuleMeta {
  id: string
  provider: string
  kind: string
  title: string
  implemented: boolean
  enabled: boolean
  actions?: ResourceAction[]
  regions?: RegionOption[]
}

export interface PluginMeta {
  providers: ProviderMeta[]
  modules: ModuleMeta[]
}
