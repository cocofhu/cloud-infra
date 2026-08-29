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
  fetchImpl?: typeof fetch
  region?: string
}

export interface TencentCreds {
  secretId: string
  secretKey: string
}

export interface TencentCallContext {
  timeoutMs: number
  signal?: AbortSignal
  fetchImpl?: typeof fetch
  region?: string
}

export type TencentServiceOpts = TencentCallContext

export type TencentProductCall = <T = unknown>(
  action: string,
  payload: unknown,
  creds: TencentCreds,
  opts: TencentCallContext,
) => Promise<T>

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

function serviceCall<T>(
  service: string,
  host: string,
  version: string,
  action: string,
  payload: unknown,
  creds: TencentCreds,
  opts: TencentCallContext,
): Promise<T> {
  return callTencentApi<T>({
    service,
    host,
    version,
    action,
    payload,
    secretId: creds.secretId,
    secretKey: creds.secretKey,
    timeoutMs: opts.timeoutMs,
    signal: opts.signal,
    fetchImpl: opts.fetchImpl,
    region: opts.region,
  })
}

export function dnspodCall<T>(
  action: string,
  payload: unknown,
  creds: TencentCreds,
  opts: TencentCallContext,
): Promise<T> {
  return serviceCall('dnspod', 'dnspod.tencentcloudapi.com', '2021-03-23', action, payload, creds, opts)
}

export function tkeCall<T>(
  action: string,
  payload: unknown,
  creds: TencentCreds,
  opts: TencentCallContext & { region: string; version?: string },
): Promise<T> {
  const region = String(opts.region || '').trim()
  if (!region) throw new TencentApiError('缺少地域')
  return callTencentApi<T>({
    service: 'tke',
    host: 'tke.tencentcloudapi.com',
    version: opts.version || '2018-05-25',
    action,
    payload,
    secretId: creds.secretId,
    secretKey: creds.secretKey,
    timeoutMs: opts.timeoutMs,
    signal: opts.signal,
    fetchImpl: opts.fetchImpl,
    region,
  })
}

/** 腾讯云域名注册 Domain API：domain.tencentcloudapi.com / 2018-08-08 */
export function domainCall<T>(
  action: string,
  payload: unknown,
  creds: TencentCreds,
  opts: TencentCallContext,
): Promise<T> {
  return callTencentApi<T>({
    service: 'domain',
    host: 'domain.tencentcloudapi.com',
    version: '2018-08-08',
    action,
    payload,
    secretId: creds.secretId,
    secretKey: creds.secretKey,
    timeoutMs: opts.timeoutMs,
    signal: opts.signal,
    fetchImpl: opts.fetchImpl,
  })
}

export function cdbCall<T>(
  action: string,
  payload: unknown,
  creds: TencentCreds,
  opts: TencentCallContext,
): Promise<T> {
  return serviceCall('cdb', 'cdb.tencentcloudapi.com', '2017-03-20', action, payload, creds, opts)
}

export function monitorCall<T>(
  action: string,
  payload: unknown,
  creds: TencentCreds,
  opts: TencentCallContext,
): Promise<T> {
  return serviceCall('monitor', 'monitor.tencentcloudapi.com', '2018-07-24', action, payload, creds, opts)
}

export function lighthouseCall<T>(
  action: string,
  payload: unknown,
  creds: TencentCreds,
  opts: TencentCallContext,
): Promise<T> {
  return serviceCall('lighthouse', 'lighthouse.tencentcloudapi.com', '2020-03-24', action, payload, creds, opts)
}

export function cvmCall<T>(
  action: string,
  payload: unknown,
  creds: TencentCreds,
  opts: TencentCallContext,
): Promise<T> {
  return serviceCall('cvm', 'cvm.tencentcloudapi.com', '2017-03-12', action, payload, creds, opts)
}
