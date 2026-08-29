import type { CloudProvider, ModuleMeta, PluginConfig, PluginMeta, ProviderMeta, ResourceModule } from './types.js'

export interface Registry {
  registerProvider: (provider: CloudProvider) => void
  registerModule: (module: ResourceModule) => void
  getProvider: (id: string) => CloudProvider | undefined
  getModule: (id: string) => ResourceModule | undefined
  listProviders: () => CloudProvider[]
  listModules: () => ResourceModule[]
  reset: () => void
}

export function createRegistry(): Registry {
  const providers = new Map<string, CloudProvider>()
  const modules = new Map<string, ResourceModule>()

  return {
    registerProvider(provider) {
      const id = String(provider.id || '').trim()
      if (!id) throw new Error('provider.id is required')
      providers.set(id, { ...provider, id, fields: provider.fields.map((field) => ({ ...field })) })
    },
    registerModule(module) {
      const id = String(module.id || '').trim()
      if (!id) throw new Error('module.id is required')
      if (!module.provider || !module.kind) throw new Error('module.provider and module.kind are required')
      modules.set(id, module)
    },
    getProvider(id) {
      return providers.get(id)
    },
    getModule(id) {
      return modules.get(id)
    },
    listProviders() {
      return [...providers.values()]
    },
    listModules() {
      return [...modules.values()]
    },
    reset() {
      providers.clear()
      modules.clear()
    },
  }
}

export const registry = createRegistry()

export function registerProvider(provider: CloudProvider): void {
  registry.registerProvider(provider)
}

export function registerModule(module: ResourceModule): void {
  registry.registerModule(module)
}

/** Resolve module id from an explicit id or a resource id such as tencent.image:personal:ap-guangzhou. */
export function resolveModuleId(moduleId: string | undefined, resourceId: string, source: Registry = registry): string {
  const explicit = String(moduleId || '').trim()
  if (explicit) return explicit
  const raw = String(resourceId || '').trim()
  if (!raw) return ''
  const ids = source.listModules().map((module) => module.id).sort((a, b) => b.length - a.length)
  for (const id of ids) {
    if (raw === id || raw.startsWith(`${id}:`)) return id
  }
  return ''
}

export function isModuleEnabled(module: ResourceModule, config: PluginConfig): boolean {
  if (config.modules[module.id] === false) return false
  if (config.modules[module.id] === true) return true
  return module.implemented
}

export function isProviderEnabled(providerId: string, config: PluginConfig, provider?: CloudProvider): boolean {
  const bucket = config.providers[providerId]
  if (bucket && typeof bucket.enabled === 'boolean') return bucket.enabled
  return provider?.enabledByDefault !== false
}

export function implementedModules(config: PluginConfig, source: Registry = registry): ResourceModule[] {
  return source.listModules().filter((module) => module.implemented && isModuleEnabled(module, config) && isProviderEnabled(module.provider, config, source.getProvider(module.provider)))
}

export function publicMeta(config: PluginConfig, source: Registry = registry): PluginMeta {
  const providers: ProviderMeta[] = source.listProviders().map((provider) => ({
    id: provider.id,
    title: provider.title,
    color: provider.color,
    enabledByDefault: provider.enabledByDefault,
    fields: provider.fields.map((field) => ({
      key: field.key,
      label: field.label,
      secret: !!field.secret,
      placeholder: field.placeholder,
    })),
  }))
  const modules: ModuleMeta[] = source.listModules().map((module) => ({
    id: module.id,
    provider: module.provider,
    kind: module.kind,
    title: module.title,
    implemented: module.implemented,
    enabled: isModuleEnabled(module, config),
    actions: module.actions,
    regions: module.regions,
  }))
  return { providers, modules }
}

export function supportedKinds(source: Registry = registry): string[] {
  return [...new Set(source.listModules().filter((module) => module.implemented).map((module) => module.kind))]
}

export function missingCredentialKeys(provider: CloudProvider, bucket: Record<string, string | boolean | undefined> | undefined): string[] {
  const missing: string[] = []
  for (const field of provider.fields) {
    const value = bucket?.[field.key]
    if (typeof value !== 'string' || !value.trim()) missing.push(field.label)
  }
  return missing
}

export function credentialMap(provider: CloudProvider, bucket: Record<string, string | boolean | undefined> | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  for (const field of provider.fields) {
    const value = bucket?.[field.key]
    if (typeof value === 'string' && value.trim()) out[field.key] = value.trim()
  }
  return out
}

export const SETTINGS_HINT = '请在 设置 → 插件 → 云资源 填写对应云厂商的 AccessKey'
export const CERT_CREDENTIAL_HINT = '请使用已有腾讯云 SecretId/SecretKey'

export function credentialHint(kind?: string): string {
  return kind === 'cert' ? CERT_CREDENTIAL_HINT : SETTINGS_HINT
}

