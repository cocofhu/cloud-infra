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
  meta?: Record<string, string>
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

export interface ResourceDetail {
  card: ResourceCard
  fields: Array<{ label: string; value: string }>
  groups?: FieldGroup[]
  records?: DnsRecord[]
  entries?: DirEntry[]
  prefix?: string
  region?: string
  bucket?: string
  hasMore?: boolean
  nextMarker?: string
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
  regions?: string[]
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
  region?: string
  regions?: string[]
}

export interface ModuleContext {
  creds: Record<string, string>
  query: string
  offset: number
  limit: number
  timeoutMs: number
  signal?: AbortSignal
  id?: string
  title?: string
  region?: string
  prefix?: string
  marker?: string
  bucket?: string
  tab?: string
  filters?: Record<string, string>
}

export type ActionResult = { ok: true; data?: Record<string, unknown> } | { ok: false; error: string }

export interface ResourceModule {
  id: string
  provider: string
  kind: string
  title: string
  implemented: boolean
  list: (ctx: ModuleContext) => Promise<ListResult>
  detail?: (ctx: ModuleContext) => Promise<ResourceDetail>
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
