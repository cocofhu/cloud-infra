import { publicErrorMessage } from '../../../core/safe-error.js'
import { registerModule } from '../../../core/registry.js'
import type {
  ActionResult,
  ModuleContext,
  ResourceAction,
  ResourceCard,
  ResourceDetail,
  ResourceModule,
} from '../../../core/types.js'
import {
  CosApiError,
  bucketHost,
  createCosClient,
  type CosBucketInfo,
  type CosClient,
} from '../cos-client.js'
import { COS_REGIONS, regionLabel, resolveCosRegion } from '../cos-regions.js'

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
const PRESIGN_SEC = 15 * 60
const FOLDER_NAME_RE = /^[^\\/:*?"<>|]{1,255}$/

export const COS_SAFE_ERRORS = [
  '缺少合法地域，请先选择地域',
  '缺少存储桶或地域',
  '缺少对象',
  '存储桶非空，请先清空对象',
  '上传文件不能超过 20MB',
  '文件夹名称不符合规则',
  '文件夹不支持重命名',
  '删除文件夹未列尽全部对象，请重试',
  '对象已存在',
  '缺少文件内容',
  '已复制到新名称，但源对象删除失败，请手动删除源文件',
]

const ACTIONS: ResourceAction[] = [
  {
    id: 'bucket.create',
    label: '创建存储桶',
    confirm: 'default',
    fields: [
      { key: 'name', label: '名称', placeholder: 'bucket-1250000000' },
      { key: 'region', label: '地域' },
    ],
  },
  { id: 'bucket.delete', label: '删除', confirm: 'always' },
  { id: 'object.upload', label: '上传文件', confirm: 'default' },
  { id: 'folder.create', label: '创建文件夹', confirm: 'default' },
  { id: 'object.stat', label: '详情', confirm: 'default' },
  { id: 'object.presign', label: '下载', confirm: 'default' },
  { id: 'object.rename', label: '重命名', confirm: 'default' },
  { id: 'object.delete', label: '删除', confirm: 'always' },
  { id: 'folder.delete', label: '删除文件夹', confirm: 'always' },
]

export function parseCosRef(id: string): { moduleId: string; region: string; bucket: string } {
  const parts = String(id || '').split(':')
  if (parts.length >= 3) {
    return {
      moduleId: parts[0] || 'tencent.cos',
      region: parts[1] || '',
      bucket: parts.slice(2).join(':'),
    }
  }
  return { moduleId: 'tencent.cos', region: '', bucket: String(id || '') }
}

export function mapBucketItem(item: CosBucketInfo, moduleId = 'tencent.cos', aclLabel = ''): ResourceCard {
  const region = item.region
  return {
    id: `${moduleId}:${region}:${item.name}`,
    moduleId,
    provider: 'tencent',
    kind: 'cos',
    title: item.name,
    description: regionLabel(region),
    columns: [
      { label: '地域', value: regionLabel(region) },
      { label: '创建时间', value: formatTime(item.creationDate) },
      { label: '访问权限', value: aclLabel || '-' },
    ],
    openLabel: '文件',
  }
}

export function formatTime(raw?: string): string {
  if (!raw) return '-'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw.replace('T', ' ').replace(/Z$/, '')
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function formatSize(bytes?: number): string {
  if (bytes == null || !Number.isFinite(bytes)) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function storageClassLabel(value?: string): string {
  const raw = String(value || 'STANDARD').toUpperCase()
  if (raw === 'STANDARD') return '标准存储'
  if (raw === 'STANDARD_IA') return '低频存储'
  if (raw === 'INTELLIGENT_TIERING') return '智能分层'
  if (raw === 'ARCHIVE') return '归档存储'
  if (raw === 'DEEP_ARCHIVE') return '深度归档'
  if (raw === 'MAZ_STANDARD') return '标准存储（多 AZ）'
  return raw
}

export function joinPrefix(prefix: string, name: string): string {
  const base = prefix && !prefix.endsWith('/') ? `${prefix}/` : prefix
  return `${base}${name}`
}

export function parentPrefix(prefix: string): string {
  const trimmed = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix
  const idx = trimmed.lastIndexOf('/')
  return idx >= 0 ? `${trimmed.slice(0, idx + 1)}` : ''
}

export function createCosModule(clientFor: (ctx: ModuleContext) => CosClient = defaultClient): ResourceModule {
  const aclCache = new Map<string, { label: string; exp: number }>()
  const module: ResourceModule = {
    id: 'tencent.cos',
    provider: 'tencent',
    kind: 'cos',
    title: '腾讯云 COS',
    implemented: true,
    actions: ACTIONS,
    regions: COS_REGIONS,
    async list(ctx) {
      const region = resolveCosRegion(ctx.region)
      if (!region) {
        return { items: [], total: 0, offset: ctx.offset, hasMore: false, needsRegion: true }
      }
      const client = clientFor(ctx)
      const all = await client.listBuckets(region.id, opts(ctx))
      const buckets = all.filter((item) => (item.region || region.id) === region.id)
      const needle = String(ctx.query || '').trim().toLowerCase()
      const filtered = needle
        ? buckets.filter((item) => item.name.toLowerCase().includes(needle))
        : buckets
      const sliced = filtered.slice(ctx.offset, ctx.offset + ctx.limit)
      const items = await mapPool(sliced, 4, async (item) => {
        const bucketRegion = item.region || region.id
        const cacheKey = `${bucketRegion}:${item.name}`
        const hit = aclCache.get(cacheKey)
        let acl = '-'
        if (hit && hit.exp > Date.now()) {
          acl = hit.label
        } else {
          acl = await client.getBucketAclLabel(item.name, bucketRegion, opts(ctx)).catch(() => '-')
          aclCache.set(cacheKey, { label: acl, exp: Date.now() + 60_000 })
        }
        return mapBucketItem({ ...item, region: bucketRegion }, module.id, acl)
      })
      return {
        items,
        total: filtered.length,
        offset: ctx.offset,
        hasMore: ctx.offset + items.length < filtered.length,
      }
    },
    async detail(ctx) {
      const { bucket, region } = resolveBucket(ctx)
      const prefix = normalizePrefix(ctx.prefix)
      const client = clientFor(ctx)
      const page = await client.listCurrent(bucket, region, prefix, {
        ...opts(ctx),
        limit: ctx.limit,
        marker: ctx.marker,
      })
      const card = mapBucketItem({ name: bucket, region }, module.id)
      return {
        card,
        fields: [
          { label: '存储桶', value: bucket },
          { label: '地域', value: regionLabel(region) },
          { label: '当前目录', value: prefix || '/' },
        ],
        entries: page.entries.map((entry) => ({
          ...entry,
          lastModified: entry.lastModified ? formatTime(entry.lastModified) : entry.lastModified,
        })),
        prefix,
        region,
        bucket,
        hasMore: page.isTruncated,
        nextMarker: page.nextMarker,
      } satisfies ResourceDetail
    },
    async execute(actionId, payload, ctx) {
      try {
        return await runAction(actionId, payload, ctx, clientFor(ctx))
      } catch (err) {
        if (err instanceof CosApiError && err.message && COS_SAFE_ERRORS.includes(err.message)) {
          return { ok: false, error: err.message }
        }
        if (err instanceof CosApiError && /未删尽/.test(err.message)) {
          return { ok: false, error: err.message }
        }
        const code = err instanceof CosApiError ? err.code : ''
        if (code === 'BucketNotEmpty' || code === 'BucketNotEmptyError') {
          return { ok: false, error: '存储桶非空，请先清空对象' }
        }
        if (code === 'EntityTooLarge') return { ok: false, error: '上传文件不能超过 20MB' }
        return { ok: false, error: publicErrorMessage(err) }
      }
    },
  }
  return module
}

async function runAction(
  actionId: string,
  payload: Record<string, unknown>,
  ctx: ModuleContext,
  client: CosClient,
): Promise<ActionResult> {
  if (actionId === 'bucket.create') {
    const region = requireRegion(String(payload.region || ctx.region || ''))
    const name = String(payload.name || payload.bucket || '').trim()
    if (!name) return { ok: false, error: '缺少存储桶或地域' }
    await client.createBucket(name, region.id, opts(ctx))
    return { ok: true }
  }

  const { bucket, region } = resolveBucket(ctx, payload)
  if (actionId === 'bucket.delete') {
    const page = await client.listCurrent(bucket, region, '', { ...opts(ctx), limit: 2 })
    const all = await client.listAllKeys(bucket, region, '', opts(ctx)).catch(() => page.keys)
    if (all.length) return { ok: false, error: '存储桶非空，请先清空对象' }
    await client.deleteBucket(bucket, region, opts(ctx))
    return { ok: true }
  }

  if (actionId === 'object.upload') {
    const prefix = normalizePrefix(String(payload.prefix ?? ctx.prefix ?? ''))
    const name = basename(String(payload.name || payload.filename || ''))
    if (!name) return { ok: false, error: '缺少对象' }
    const body = decodeUpload(payload)
    if (body.length > MAX_UPLOAD_BYTES) return { ok: false, error: '上传文件不能超过 20MB' }
    const key = joinPrefix(prefix, name)
    await client.putObject(bucket, region, key, body, {
      ...opts(ctx),
      contentType: String(payload.contentType || 'application/octet-stream'),
    })
    return { ok: true }
  }

  if (actionId === 'folder.create') {
    const prefix = normalizePrefix(String(payload.prefix ?? ctx.prefix ?? ''))
    const name = String(payload.name || '').trim()
    if (!FOLDER_NAME_RE.test(name) || name === '.' || name === '..' || name.startsWith('.') || name.endsWith('.')) {
      return { ok: false, error: '文件夹名称不符合规则' }
    }
    await client.putObject(bucket, region, `${joinPrefix(prefix, name)}/`, Buffer.alloc(0), {
      ...opts(ctx),
      contentType: 'application/x-directory',
    })
    return { ok: true }
  }

  if (actionId === 'object.stat') {
    const key = String(payload.key || '').trim()
    if (!key) return { ok: false, error: '缺少对象' }
    const stat = await client.headObject(bucket, region, key, opts(ctx))
    return {
      ok: true,
      data: {
        name: shortLeaf(key),
        key: stat.key,
        size: stat.size,
        sizeLabel: formatSize(stat.size),
        storageClass: storageClassLabel(stat.storageClass),
        lastModified: formatTime(stat.lastModified),
        address: stat.url,
      },
    }
  }

  if (actionId === 'object.presign' || actionId === 'object.download') {
    const key = String(payload.key || '').trim()
    if (!key) return { ok: false, error: '缺少对象' }
    const url = client.presignGet(bucket, region, key, PRESIGN_SEC)
    return { ok: true, data: { url, expiresSec: PRESIGN_SEC, host: bucketHost(bucket, region) } }
  }

  if (actionId === 'object.rename') {
    const key = String(payload.key || '').trim()
    const nextName = basename(String(payload.name || payload.nextName || ''))
    if (!key || !nextName) return { ok: false, error: '缺少对象' }
    if (key.endsWith('/')) return { ok: false, error: '文件夹不支持重命名' }
    const dest = joinPrefix(parentPrefix(key), nextName)
    if (dest === key) return { ok: true }
    const exists = await client.headObject(bucket, region, dest, opts(ctx)).then(() => true).catch(() => false)
    if (exists) return { ok: false, error: '对象已存在' }
    await client.copyObject(bucket, region, key, dest, opts(ctx))
    try {
      await client.deleteObject(bucket, region, key, opts(ctx))
    } catch {
      throw new CosApiError('已复制到新名称，但源对象删除失败，请手动删除源文件')
    }
    return { ok: true }
  }

  if (actionId === 'object.delete') {
    const key = String(payload.key || '').trim()
    if (!key) return { ok: false, error: '缺少对象' }
    await client.deleteObject(bucket, region, key, opts(ctx))
    return { ok: true }
  }

  if (actionId === 'folder.delete') {
    const key = normalizePrefix(String(payload.key || payload.prefix || ''))
    if (!key) return { ok: false, error: '缺少对象' }
    const keys = await client.listAllKeys(bucket, region, key, opts(ctx))
    if (!keys.length) {
      await client.deleteObject(bucket, region, key, opts(ctx)).catch(() => undefined)
      return { ok: true }
    }
    let deleted = 0
    let failed = 0
    for (let i = 0; i < keys.length; i += 1000) {
      const chunk = keys.slice(i, i + 1000)
      const batch = await client.deleteObjects(bucket, region, chunk, opts(ctx))
      deleted += batch.deleted.length
      failed += batch.errors.length
    }
    const remaining = Math.max(failed, keys.length - deleted)
    if (remaining > 0) {
      return { ok: false, error: `已删除 ${deleted} 个对象，剩余 ${remaining} 个未删尽，请重试` }
    }
    return { ok: true }
  }

  return { ok: false, error: `未知动作 ${actionId}` }
}

function defaultClient(ctx: ModuleContext): CosClient {
  return createCosClient({ secretId: ctx.creds.secretId, secretKey: ctx.creds.secretKey })
}

function opts(ctx: ModuleContext): { timeoutMs: number; signal?: AbortSignal } {
  return { timeoutMs: ctx.timeoutMs, signal: ctx.signal }
}

function requireRegion(raw: string | undefined) {
  const region = resolveCosRegion(raw)
  if (!region) throw new CosApiError('缺少合法地域，请先选择地域')
  return region
}

function resolveBucket(ctx: ModuleContext, payload: Record<string, unknown> = {}) {
  const parsed = parseCosRef(String(ctx.id || ''))
  const bucket = String(payload.bucket || ctx.bucket || ctx.title || parsed.bucket || '').trim()
  const regionRaw = String(payload.region || ctx.region || parsed.region || '')
  const region = resolveCosRegion(regionRaw)
  if (!bucket || !region) throw new CosApiError('缺少存储桶或地域')
  return { bucket, region: region.id }
}

function normalizePrefix(prefix?: string): string {
  const value = String(prefix || '')
  if (!value || value === '/') return ''
  return value.endsWith('/') ? value : `${value}/`
}

function basename(name: string): string {
  const trimmed = String(name || '').trim().replace(/\\/g, '/')
  const parts = trimmed.split('/').filter(Boolean)
  return parts[parts.length - 1] || ''
}

function shortLeaf(key: string): string {
  const trimmed = key.endsWith('/') ? key.slice(0, -1) : key
  const idx = trimmed.lastIndexOf('/')
  return idx >= 0 ? trimmed.slice(idx + 1) : trimmed
}

function decodeUpload(payload: Record<string, unknown>): Buffer {
  const base64 = String(payload.contentBase64 || payload.content || '').trim()
  if (!base64) throw new CosApiError('缺少文件内容')
  const raw = base64.includes(',') ? base64.slice(base64.indexOf(',') + 1) : base64
  const buf = Buffer.from(raw, 'base64')
  if (!buf.length) throw new CosApiError('缺少文件内容')
  return buf
}

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  if (!items.length) return []
  const out: R[] = new Array(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const index = next
      next += 1
      out[index] = await fn(items[index])
    }
  })
  await Promise.all(workers)
  return out
}

export const tencentCosModule = createCosModule()
registerModule(tencentCosModule)
