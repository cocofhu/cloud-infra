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
  records?: DnsRecord[]
  tables?: ResourceTable[]
  scope?: ResourceScope
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
  region?: string
  instanceId?: string
  errors?: ModuleError[]
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
  region?: string
  instanceId?: string
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
  instanceId?: string
  view?: string
  namespace?: string
  repository?: string
}

export type ActionResult = { ok: true; command?: string } | { ok: false; error: string }

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
}

export interface PluginMeta {
  providers: ProviderMeta[]
  modules: ModuleMeta[]
}
