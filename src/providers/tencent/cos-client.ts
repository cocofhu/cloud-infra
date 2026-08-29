import { createHmac, createHash } from 'node:crypto'

export interface CosCreds {
  secretId: string
  secretKey: string
}

export interface CosRequestOptions {
  method: string
  host: string
  path?: string
  query?: Record<string, string | undefined>
  headers?: Record<string, string>
  body?: Buffer | string
  creds: CosCreds
  timeoutMs: number
  signal?: AbortSignal
  signExpiresSec?: number
  timestamp?: number
  fetchImpl?: typeof fetch
}

export class CosApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly requestId?: string,
  ) {
    super(message)
  }
}

export function cosEncode(value: string, encodeSlash = true): string {
  const encoded = encodeURIComponent(value)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
  return encodeSlash ? encoded : encoded.replace(/%2F/gi, '/')
}

export function serviceHost(): string {
  return 'service.cos.myqcloud.com'
}

export function bucketHost(bucket: string, region: string): string {
  return `${bucket}.cos.${region}.myqcloud.com`
}

/** Pathname used both in HMAC-SHA1 and in the HTTPS request URL. */
export function encodedObjectPath(path: string): string {
  return cosEncode(normalizePath(path), false)
}

/**
 * Official PUT Object - Copy header:
 * `<BucketName-APPID>.cos.<Region>.myqcloud.com/<ObjectKey>` (ObjectKey URL-encoded).
 */
export function copySourceHeader(bucket: string, region: string, sourceKey: string): string {
  const trimmed = String(sourceKey || '').replace(/^\/+/, '')
  return `${bucketHost(bucket, region)}/${cosEncode(trimmed, false)}`
}

function hmacSha1Hex(key: string | Buffer, message: string): string {
  return createHmac('sha1', key).update(message, 'utf8').digest('hex')
}

function sha1Hex(message: string): string {
  return createHash('sha1').update(message, 'utf8').digest('hex')
}

function normalizePath(path: string): string {
  if (!path || path === '/') return '/'
  return path.startsWith('/') ? path : `/${path}`
}

function sortedQuery(query: Record<string, string | undefined> | undefined): Array<[string, string]> {
  const pairs: Array<[string, string]> = []
  for (const [key, value] of Object.entries(query || {})) {
    if (value == null) continue
    pairs.push([key.toLowerCase(), String(value)])
  }
  pairs.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)
  return pairs
}

export function buildFormatString(input: {
  method: string
  path: string
  query?: Record<string, string | undefined>
  headers: Record<string, string>
}): { formatString: string; headerList: string; paramList: string } {
  const method = input.method.toLowerCase()
  const pathname = encodedObjectPath(input.path)
  const params = sortedQuery(input.query)
  const paramList = params.map(([key]) => key).join(';')
  const httpParameters = params.map(([key, value]) => `${cosEncode(key)}=${cosEncode(value)}`).join('&')
  const headerPairs = Object.entries(input.headers)
    .map(([key, value]) => [key.toLowerCase(), String(value).trim()] as const)
    .sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)
  const headerList = headerPairs.map(([key]) => key).join(';')
  const httpHeaders = headerPairs.map(([key, value]) => `${cosEncode(key)}=${cosEncode(value)}`).join('&')
  const formatString = `${method}\n${pathname}\n${httpParameters}\n${httpHeaders}\n`
  return { formatString, headerList, paramList }
}

export function signCosRequest(input: {
  method: string
  path: string
  query?: Record<string, string | undefined>
  headers: Record<string, string>
  secretId: string
  secretKey: string
  start: number
  end: number
}): { authorization: string; signTime: string } {
  const signTime = `${input.start};${input.end}`
  const { formatString, headerList, paramList } = buildFormatString(input)
  const signKey = hmacSha1Hex(input.secretKey, signTime)
  const stringToSign = `sha1\n${signTime}\n${sha1Hex(formatString)}\n`
  const signature = hmacSha1Hex(signKey, stringToSign)
  const authorization = [
    'q-sign-algorithm=sha1',
    `q-ak=${input.secretId}`,
    `q-sign-time=${signTime}`,
    `q-key-time=${signTime}`,
    `q-header-list=${headerList}`,
    `q-url-param-list=${paramList}`,
    `q-signature=${signature}`,
  ].join('&')
  return { authorization, signTime }
}

export function presignCosUrl(input: {
  method: string
  host: string
  path: string
  query?: Record<string, string | undefined>
  creds: CosCreds
  expiresSec?: number
  timestamp?: number
}): string {
  const start = input.timestamp ?? Math.floor(Date.now() / 1000)
  const end = start + Math.max(60, input.expiresSec ?? 900)
  const headers = { host: input.host }
  const signed = signCosRequest({
    method: input.method,
    path: input.path,
    query: input.query,
    headers,
    secretId: input.creds.secretId,
    secretKey: input.creds.secretKey,
    start,
    end,
  })
  const signature = signed.authorization.replace(/^[\s\S]*q-signature=/, '')
  const extra = [
    `q-sign-algorithm=sha1`,
    `q-ak=${cosEncode(input.creds.secretId)}`,
    `q-sign-time=${signed.signTime}`,
    `q-key-time=${signed.signTime}`,
    `q-header-list=host`,
    `q-url-param-list=`,
    `q-signature=${signature}`,
  ]
  const baseQuery = sortedQuery(input.query).map(([key, value]) => `${cosEncode(key)}=${cosEncode(value)}`)
  const qs = [...baseQuery, ...extra].join('&')
  return `https://${input.host}${encodedObjectPath(input.path)}?${qs}`
}

function queryString(query: Record<string, string | undefined> | undefined): string {
  const pairs = sortedQuery(query)
  if (!pairs.length) return ''
  return `?${pairs.map(([key, value]) => `${cosEncode(key)}=${cosEncode(value)}`).join('&')}`
}

export async function cosRequest(options: CosRequestOptions): Promise<{ status: number; headers: Headers; text: string; buffer: Buffer }> {
  const method = options.method.toUpperCase()
  const path = normalizePath(options.path || '/')
  const urlPath = encodedObjectPath(path)
  const start = options.timestamp ?? Math.floor(Date.now() / 1000)
  const end = start + Math.max(60, options.signExpiresSec ?? 600)
  const headers: Record<string, string> = { host: options.host, ...(options.headers || {}) }
  const signed = signCosRequest({
    method,
    path,
    query: options.query,
    headers: { host: options.host, ...pickSignedHeaders(options.headers) },
    secretId: options.creds.secretId,
    secretKey: options.creds.secretKey,
    start,
    end,
  })
  headers.authorization = signed.authorization
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), options.timeoutMs)
  const onAbort = () => ctrl.abort()
  options.signal?.addEventListener('abort', onAbort, { once: true })
  try {
    const fetchImpl = options.fetchImpl || fetch
    const body = options.body == null ? undefined : (Buffer.isBuffer(options.body) ? new Uint8Array(options.body) : options.body)
    const res = await fetchImpl(`https://${options.host}${urlPath}${queryString(options.query)}`, {
      method,
      headers,
      body,
      signal: ctrl.signal,
    })
    const buffer = Buffer.from(await res.arrayBuffer())
    const text = buffer.toString('utf8')
    if (res.status >= 400) {
      const code = xmlText(text, 'Code')
      const message = xmlText(text, 'Message') || `HTTP ${res.status}`
      throw new CosApiError(message, code, xmlText(text, 'RequestId'))
    }
    return { status: res.status, headers: res.headers, text, buffer }
  } catch (err) {
    if (err instanceof CosApiError) throw err
    const name = err instanceof Error ? err.name : ''
    if (name === 'AbortError') throw new CosApiError(`timeout ${options.timeoutMs}ms`)
    throw new CosApiError(err instanceof Error ? err.message : String(err))
  } finally {
    clearTimeout(timer)
    options.signal?.removeEventListener('abort', onAbort)
  }
}

function pickSignedHeaders(headers?: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers || {})) {
    const name = key.toLowerCase()
    if (name === 'host' || name.startsWith('x-cos-') || name === 'content-md5') out[name] = value
  }
  return out
}

export function xmlText(xml: string, tag: string): string {
  const cdata = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i'))
  if (cdata) return decodeXml(cdata[1] || '')
  const plain = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'))
  return plain ? decodeXml(plain[1] || '') : ''
}

export function xmlBlocks(xml: string, tag: string): string[] {
  return xml.match(new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`, 'gi')) || []
}

export function decodeXml(value: string): string {
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, '\'')
    .replace(/&amp;/g, '&')
}

export interface CosBucketInfo {
  name: string
  region: string
  creationDate?: string
}

export interface CosListEntry {
  kind: 'folder' | 'file'
  name: string
  key: string
  size?: number
  storageClass?: string
  lastModified?: string
}

export interface CosListPage {
  entries: CosListEntry[]
  isTruncated: boolean
  nextMarker?: string
  keys: string[]
}

export interface CosObjectStat {
  key: string
  size?: number
  storageClass?: string
  lastModified?: string
  contentType?: string
  url: string
}

export interface CosClient {
  listBuckets: (region: string, opts: { timeoutMs: number; signal?: AbortSignal }) => Promise<CosBucketInfo[]>
  getBucketAclLabel: (bucket: string, region: string, opts: { timeoutMs: number; signal?: AbortSignal }) => Promise<string>
  createBucket: (bucket: string, region: string, opts: { timeoutMs: number; signal?: AbortSignal }) => Promise<void>
  deleteBucket: (bucket: string, region: string, opts: { timeoutMs: number; signal?: AbortSignal }) => Promise<void>
  listCurrent: (bucket: string, region: string, prefix: string, opts: { timeoutMs: number; signal?: AbortSignal; limit?: number; marker?: string }) => Promise<CosListPage>
  listAllKeys: (bucket: string, region: string, prefix: string, opts: { timeoutMs: number; signal?: AbortSignal }) => Promise<string[]>
  putObject: (bucket: string, region: string, key: string, body: Buffer, opts: { timeoutMs: number; signal?: AbortSignal; contentType?: string }) => Promise<void>
  deleteObject: (bucket: string, region: string, key: string, opts: { timeoutMs: number; signal?: AbortSignal }) => Promise<void>
  deleteObjects: (bucket: string, region: string, keys: string[], opts: { timeoutMs: number; signal?: AbortSignal }) => Promise<CosDeleteBatchResult>
  copyObject: (bucket: string, region: string, sourceKey: string, destKey: string, opts: { timeoutMs: number; signal?: AbortSignal }) => Promise<void>
  headObject: (bucket: string, region: string, key: string, opts: { timeoutMs: number; signal?: AbortSignal }) => Promise<CosObjectStat>
  presignGet: (bucket: string, region: string, key: string, expiresSec?: number) => string
}

export interface CosDeleteBatchResult {
  deleted: string[]
  errors: Array<{ key: string; code?: string; message: string }>
}

export function createCosClient(
  creds: CosCreds,
  fetchImpl?: typeof fetch,
): CosClient {
  const req = (options: Omit<CosRequestOptions, 'creds' | 'fetchImpl'>) => cosRequest({
    ...options,
    creds,
    fetchImpl,
  })

  return {
    async listBuckets(region, opts) {
      const res = await req({
        method: 'GET',
        host: serviceHost(),
        path: '/',
        query: { region },
        timeoutMs: opts.timeoutMs,
        signal: opts.signal,
      })
      return xmlBlocks(res.text, 'Bucket').map((block) => ({
        name: xmlText(block, 'Name'),
        region: xmlText(block, 'Location') || region,
        creationDate: xmlText(block, 'CreationDate') || undefined,
      })).filter((item) => item.name)
    },
    async getBucketAclLabel(bucket, region, opts) {
      const res = await req({
        method: 'GET',
        host: bucketHost(bucket, region),
        path: '/',
        query: { acl: '' },
        timeoutMs: opts.timeoutMs,
        signal: opts.signal,
      })
      return aclLabelFromXml(res.text)
    },
    async createBucket(bucket, region, opts) {
      const body = `<CreateBucketConfiguration><LocationConstraint>${escapeXml(region)}</LocationConstraint></CreateBucketConfiguration>`
      await req({
        method: 'PUT',
        host: bucketHost(bucket, region),
        path: '/',
        headers: { 'content-type': 'application/xml' },
        body,
        timeoutMs: opts.timeoutMs,
        signal: opts.signal,
      })
    },
    async deleteBucket(bucket, region, opts) {
      await req({
        method: 'DELETE',
        host: bucketHost(bucket, region),
        path: '/',
        timeoutMs: opts.timeoutMs,
        signal: opts.signal,
      })
    },
    async listCurrent(bucket, region, prefix, opts) {
      const query: Record<string, string | undefined> = {
        delimiter: '/',
        prefix: prefix || '',
        'max-keys': String(Math.max(1, Math.min(opts.limit || 100, 1000))),
      }
      if (opts.marker) query.marker = opts.marker
      const res = await req({
        method: 'GET',
        host: bucketHost(bucket, region),
        path: '/',
        query,
        timeoutMs: opts.timeoutMs,
        signal: opts.signal,
      })
      return parseListPage(res.text, prefix || '')
    },
    async listAllKeys(bucket, region, prefix, opts) {
      const keys: string[] = []
      let marker = ''
      for (let i = 0; i < 200; i += 1) {
        const query: Record<string, string | undefined> = {
          prefix: prefix || '',
          'max-keys': '1000',
        }
        if (marker) query.marker = marker
        const res = await req({
          method: 'GET',
          host: bucketHost(bucket, region),
          path: '/',
          query,
          timeoutMs: opts.timeoutMs,
          signal: opts.signal,
        })
        const page = parseListPage(res.text, prefix || '', false)
        keys.push(...page.keys)
        if (!page.isTruncated) return keys
        marker = page.nextMarker || page.keys[page.keys.length - 1] || ''
        if (!marker) throw new CosApiError('删除文件夹未列尽全部对象，请重试')
      }
      throw new CosApiError('删除文件夹未列尽全部对象，请重试')
    },
    async putObject(bucket, region, key, body, opts) {
      await req({
        method: 'PUT',
        host: bucketHost(bucket, region),
        path: `/${key}`,
        headers: {
          'content-type': opts.contentType || 'application/octet-stream',
          'content-length': String(body.length),
        },
        body,
        timeoutMs: opts.timeoutMs,
        signal: opts.signal,
      })
    },
    async deleteObject(bucket, region, key, opts) {
      await req({
        method: 'DELETE',
        host: bucketHost(bucket, region),
        path: `/${key}`,
        timeoutMs: opts.timeoutMs,
        signal: opts.signal,
      })
    },
    async deleteObjects(bucket, region, keys, opts) {
      const unique = [...new Set(keys.map((key) => String(key || '')).filter(Boolean))]
      const deleted: string[] = []
      const errors: Array<{ key: string; code?: string; message: string }> = []
      for (let i = 0; i < unique.length; i += 1000) {
        const chunk = unique.slice(i, i + 1000)
        const body = `<?xml version="1.0" encoding="utf-8"?><Delete><Quiet>false</Quiet>${chunk.map((key) => `<Object><Key>${escapeXml(key)}</Key></Object>`).join('')}</Delete>`
        const md5 = createHash('md5').update(body).digest('base64')
        const res = await req({
          method: 'POST',
          host: bucketHost(bucket, region),
          path: '/',
          query: { delete: '' },
          headers: {
            'content-type': 'application/xml',
            'content-md5': md5,
            'content-length': String(Buffer.byteLength(body)),
          },
          body,
          timeoutMs: opts.timeoutMs,
          signal: opts.signal,
        })
        const gone = xmlBlocks(res.text, 'Deleted').map((block) => xmlText(block, 'Key')).filter(Boolean)
        const failed = xmlBlocks(res.text, 'Error').map((block) => ({
          key: xmlText(block, 'Key'),
          code: xmlText(block, 'Code') || undefined,
          message: xmlText(block, 'Message') || '删除失败',
        }))
        deleted.push(...gone)
        errors.push(...failed)
        if (!gone.length && !failed.length) deleted.push(...chunk)
      }
      return { deleted, errors }
    },
    async copyObject(bucket, region, sourceKey, destKey, opts) {
      await req({
        method: 'PUT',
        host: bucketHost(bucket, region),
        path: `/${destKey}`,
        headers: { 'x-cos-copy-source': copySourceHeader(bucket, region, sourceKey) },
        timeoutMs: opts.timeoutMs,
        signal: opts.signal,
      })
    },
    async headObject(bucket, region, key, opts) {
      const res = await req({
        method: 'HEAD',
        host: bucketHost(bucket, region),
        path: `/${key}`,
        timeoutMs: opts.timeoutMs,
        signal: opts.signal,
      })
      const sizeRaw = res.headers.get('content-length')
      const size = sizeRaw != null ? Number(sizeRaw) : undefined
      return {
        key,
        size: Number.isFinite(size) ? size : undefined,
        storageClass: res.headers.get('x-cos-storage-class') || 'STANDARD',
        lastModified: res.headers.get('last-modified') || undefined,
        contentType: res.headers.get('content-type') || undefined,
        url: `https://${bucketHost(bucket, region)}${encodedObjectPath(`/${key}`)}`,
      }
    },
    presignGet(bucket, region, key, expiresSec = 900) {
      return presignCosUrl({
        method: 'GET',
        host: bucketHost(bucket, region),
        path: `/${key}`,
        creds,
        expiresSec,
      })
    },
  }
}

export function parseListPage(xml: string, prefix: string, currentLayer = true): CosListPage {
  const folders: CosListEntry[] = []
  const files: CosListEntry[] = []
  const keys: string[] = []
  if (currentLayer) {
    for (const block of xmlBlocks(xml, 'CommonPrefixes')) {
      const key = xmlText(block, 'Prefix')
      if (!key) continue
      folders.push({
        kind: 'folder',
        name: shortName(key, prefix),
        key,
      })
    }
  }
  for (const block of xmlBlocks(xml, 'Contents')) {
    const key = xmlText(block, 'Key')
    if (!key) continue
    keys.push(key)
    if (key === prefix) continue
    const size = Number(xmlText(block, 'Size') || '0')
    if (currentLayer && key.endsWith('/') && size === 0) continue
    if (currentLayer) {
      files.push({
        kind: 'file',
        name: shortName(key, prefix),
        key,
        size: Number.isFinite(size) ? size : undefined,
        storageClass: xmlText(block, 'StorageClass') || 'STANDARD',
        lastModified: xmlText(block, 'LastModified') || undefined,
      })
    }
  }
  const isTruncated = /<IsTruncated>\s*true\s*<\/IsTruncated>/i.test(xml)
  const entries = currentLayer ? [...folders, ...files] : []
  const lastKey = keys[keys.length - 1] || entries[entries.length - 1]?.key || ''
  const nextMarker = xmlText(xml, 'NextMarker') || (isTruncated ? lastKey : '') || undefined
  return {
    entries,
    isTruncated,
    nextMarker,
    keys,
  }
}

export function shortName(key: string, prefix: string): string {
  let name = key.startsWith(prefix) ? key.slice(prefix.length) : key
  if (name.endsWith('/')) name = name.slice(0, -1)
  const slash = name.lastIndexOf('/')
  return slash >= 0 ? name.slice(slash + 1) : name
}

export function aclLabelFromXml(xml: string): string {
  const grants = xmlBlocks(xml, 'Grant')
  let publicRead = false
  let publicWrite = false
  for (const grant of grants) {
    const uri = xmlText(grant, 'URI')
    const perm = xmlText(grant, 'Permission').toUpperCase()
    if (!/AllUsers/i.test(uri)) continue
    if (perm === 'READ' || perm === 'FULL_CONTROL') publicRead = true
    if (perm === 'WRITE' || perm === 'FULL_CONTROL') publicWrite = true
  }
  if (publicRead && publicWrite) return '公有读写'
  if (publicRead) return '公有读私有写'
  return '私有读写'
}

function escapeXml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
