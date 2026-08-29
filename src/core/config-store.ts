import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import type { CloudProvider, PluginConfig, PublicConfig, PublicProviderConfig } from './types.js'
import { registry, type Registry } from './registry.js'

export function dshHome(): string {
  return process.env.DSH_HOME || join(homedir(), '.dsh')
}

export function overlayPath(): string {
  return join(dshHome(), 'cloud-infra.json')
}

export function withDefaults(config: Partial<PluginConfig> = {}): PluginConfig {
  return {
    timeoutMs: Number.isFinite(config.timeoutMs) ? Number(config.timeoutMs) : 20000,
    maxResults: Number.isFinite(config.maxResults) ? Number(config.maxResults) : 12,
    skipConfirm: config.skipConfirm === true,
    providers: cloneBuckets(config.providers),
    modules: { ...(config.modules || {}) },
  }
}

export function readOverlay(): Partial<PluginConfig> {
  try {
    const raw = JSON.parse(readFileSync(overlayPath(), 'utf8')) as Record<string, unknown>
    return sanitizePatch(raw)
  } catch {
    return {}
  }
}

export function writeOverlay(cfg: PluginConfig): void {
  const path = overlayPath()
  mkdirSync(dirname(path), { recursive: true })
  const body = `${JSON.stringify(persistable(cfg), null, 2)}\n`
  writeFileSync(path, body)
  try {
    chmodSync(path, 0o600)
  } catch {
    /* best-effort on platforms without chmod */
  }
}

export function persistable(cfg: PluginConfig): Pick<PluginConfig, 'timeoutMs' | 'maxResults' | 'skipConfirm' | 'providers' | 'modules'> {
  return {
    timeoutMs: cfg.timeoutMs,
    maxResults: cfg.maxResults,
    skipConfirm: cfg.skipConfirm,
    providers: cloneBuckets(cfg.providers),
    modules: { ...cfg.modules },
  }
}

/** Overlay never stores CLS region; dialog query/search/detail must not call writeOverlay. */

export function sanitizePatch(raw: Record<string, unknown>, source: Registry = registry): Partial<PluginConfig> {
  const out: Partial<PluginConfig> = {}
  const timeout = Number(raw.timeoutMs)
  if (Number.isFinite(timeout) && timeout >= 3000) out.timeoutMs = Math.min(timeout, 120000)
  const max = Number(raw.maxResults)
  if (Number.isFinite(max) && max >= 1) out.maxResults = Math.min(Math.floor(max), 80)
  if (typeof raw.skipConfirm === 'boolean') out.skipConfirm = raw.skipConfirm
  if (raw.modules && typeof raw.modules === 'object' && !Array.isArray(raw.modules)) {
    const modules: Record<string, boolean> = {}
    for (const [key, value] of Object.entries(raw.modules as Record<string, unknown>)) {
      if (typeof value === 'boolean') modules[key] = value
    }
    out.modules = modules
  }
  if (raw.providers && typeof raw.providers === 'object' && !Array.isArray(raw.providers)) {
    out.providers = sanitizeProviders(raw.providers as Record<string, unknown>, source)
  }
  return out
}

export function assignConfig(live: PluginConfig, patch: Partial<PluginConfig>, source: Registry = registry): PluginConfig {
  if (patch.timeoutMs != null) live.timeoutMs = patch.timeoutMs
  if (patch.maxResults != null) live.maxResults = patch.maxResults
  if (patch.skipConfirm != null) live.skipConfirm = patch.skipConfirm
  if (patch.modules) Object.assign(live.modules, patch.modules)
  if (patch.providers) mergeProviders(live, patch.providers, source)
  return live
}

export function publicConfig(cfg: PluginConfig, source: Registry = registry): PublicConfig {
  const known = source.listProviders()
  const seen = new Set<string>()
  const providers: PublicProviderConfig[] = []
  for (const provider of known) {
    seen.add(provider.id)
    providers.push(publicProvider(provider, cfg.providers[provider.id]))
  }
  for (const [id, bucket] of Object.entries(cfg.providers)) {
    if (seen.has(id)) continue
    providers.push(publicProvider({ id, title: id, fields: inferFields(bucket) }, bucket))
  }
  return {
    timeoutMs: cfg.timeoutMs,
    maxResults: cfg.maxResults,
    skipConfirm: cfg.skipConfirm,
    providers,
    modules: { ...cfg.modules },
  }
}

export function maskSecret(value: string): string {
  const text = value.trim()
  if (!text) return ''
  if (text.length <= 8) return '****'
  return `${text.slice(0, 4)}****${text.slice(-4)}`
}

function sanitizeProviders(raw: Record<string, unknown>, source: Registry): PluginConfig['providers'] {
  const out: PluginConfig['providers'] = {}
  for (const [id, value] of Object.entries(raw)) {
    if (!id.trim() || !value || typeof value !== 'object' || Array.isArray(value)) continue
    const bucket = value as Record<string, unknown>
    const provider = source.getProvider(id)
    const next: PluginConfig['providers'][string] = {}
    if (typeof bucket.enabled === 'boolean') next.enabled = bucket.enabled
    const keys = provider ? provider.fields.map((field) => field.key) : Object.keys(bucket).filter((key) => key !== 'enabled')
    for (const key of keys) {
      const item = bucket[key]
      if (typeof item === 'string' && item.trim()) next[key] = item.trim()
    }
    out[id] = next
  }
  return out
}

function mergeProviders(live: PluginConfig, patch: PluginConfig['providers'], source: Registry): void {
  for (const [id, bucket] of Object.entries(patch)) {
    const current = { ...(live.providers[id] || {}) }
    const provider = source.getProvider(id)
    if (typeof bucket.enabled === 'boolean') current.enabled = bucket.enabled
    const fields = provider?.fields || Object.keys(bucket).filter((key) => key !== 'enabled').map((key) => ({ key, secret: true }))
    for (const field of fields) {
      const next = bucket[field.key]
      if (typeof next !== 'string') continue
      const trimmed = next.trim()
      if (!trimmed) continue
      current[field.key] = trimmed
    }
    live.providers[id] = current
  }
}

function publicProvider(provider: CloudProvider, bucket: PluginConfig['providers'][string] | undefined): PublicProviderConfig {
  const values: Record<string, string> = {}
  let configured = provider.fields.length === 0
  let filled = 0
  for (const field of provider.fields) {
    const raw = bucket?.[field.key]
    const text = typeof raw === 'string' ? raw : ''
    if (text) filled += 1
    values[field.key] = text ? maskSecret(text) : ''
  }
  if (provider.fields.length) configured = filled === provider.fields.length
  return {
    id: provider.id,
    enabled: typeof bucket?.enabled === 'boolean' ? bucket.enabled : provider.enabledByDefault !== false,
    configured,
    values,
  }
}

function inferFields(bucket: PluginConfig['providers'][string] | undefined): CloudProvider['fields'] {
  if (!bucket) return []
  return Object.keys(bucket)
    .filter((key) => key !== 'enabled')
    .map((key) => ({ key, label: key, secret: true }))
}

function cloneBuckets(raw: PluginConfig['providers'] | undefined): PluginConfig['providers'] {
  const out: PluginConfig['providers'] = {}
  if (!raw) return out
  for (const [id, bucket] of Object.entries(raw)) {
    out[id] = { ...bucket }
  }
  return out
}
