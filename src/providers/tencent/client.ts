import { tc3Headers } from './tc3.js'

export interface TencentCallOptions {
  service: string
  host: string
  version: string
  action: string
  payload?: unknown
  secretId: string
  secretKey: string
  timeoutMs: number
  signal?: AbortSignal
  timestamp?: number
  region?: string
  fetchImpl?: typeof fetch
}

export class TencentApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly requestId?: string,
  ) {
    super(message)
  }
}

export async function callTencentApi<T = unknown>(options: TencentCallOptions): Promise<T> {
  const payload = JSON.stringify(options.payload ?? {})
  const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000)
  const headers = tc3Headers({
    secretId: options.secretId,
    secretKey: options.secretKey,
    service: options.service,
    host: options.host,
    action: options.action,
    payload,
    timestamp,
    version: options.version,
    region: options.region,
  })
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), options.timeoutMs)
  const onAbort = () => ctrl.abort()
  options.signal?.addEventListener('abort', onAbort, { once: true })
  try {
    const fetchImpl = options.fetchImpl || fetch
    const res = await fetchImpl(`https://${options.host}`, {
      method: 'POST',
      headers,
      body: payload,
      signal: ctrl.signal,
    })
    const body = await res.json().catch(() => ({})) as {
      Response?: { Error?: { Code?: string; Message?: string }; RequestId?: string } & T
    }
    const error = body.Response?.Error
    if (error?.Message) {
      throw new TencentApiError(error.Message, error.Code, body.Response?.RequestId)
    }
    if (!res.ok) throw new TencentApiError(`HTTP ${res.status}`, String(res.status))
    if (!body.Response) throw new TencentApiError('empty Response')
    return body.Response as T
  } catch (err) {
    if (err instanceof TencentApiError) throw err
    const name = err instanceof Error ? err.name : ''
    if (name === 'AbortError') throw new TencentApiError(`timeout ${options.timeoutMs}ms`)
    throw new TencentApiError(err instanceof Error ? err.message : String(err))
  } finally {
    clearTimeout(timer)
    options.signal?.removeEventListener('abort', onAbort)
  }
}

export function dnspodCall<T>(
  action: string,
  payload: unknown,
  creds: { secretId: string; secretKey: string },
  opts: { timeoutMs: number; signal?: AbortSignal; fetchImpl?: typeof fetch },
): Promise<T> {
  return callTencentApi<T>({
    service: 'dnspod',
    host: 'dnspod.tencentcloudapi.com',
    version: '2021-03-23',
    action,
    payload,
    secretId: creds.secretId,
    secretKey: creds.secretKey,
    timeoutMs: opts.timeoutMs,
    signal: opts.signal,
    fetchImpl: opts.fetchImpl,
  })
}

export const CLS_HOST = 'cls.tencentcloudapi.com'
export const CLS_VERSION = '2020-10-16'

export function clsCall<T>(
  action: string,
  payload: unknown,
  creds: { secretId: string; secretKey: string },
  opts: { timeoutMs: number; signal?: AbortSignal; region: string; fetchImpl?: typeof fetch },
): Promise<T> {
  return callTencentApi<T>({
    service: 'cls',
    host: CLS_HOST,
    version: CLS_VERSION,
    action,
    payload,
    secretId: creds.secretId,
    secretKey: creds.secretKey,
    timeoutMs: opts.timeoutMs,
    signal: opts.signal,
    region: opts.region,
    fetchImpl: opts.fetchImpl,
  })
}
