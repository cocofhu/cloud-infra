import type { IncomingMessage } from 'node:http'

function headerString(raw: string | string[] | undefined): string | undefined {
  if (raw === undefined) return undefined
  const value = Array.isArray(raw) ? raw[0] : raw
  const trimmed = String(value || '').trim()
  return trimmed === '' ? undefined : trimmed.split(',')[0]!.trim()
}

function parseHost(raw: string): { hostname: string; port: string } | null {
  try {
    const parsed = new URL(raw.includes('://') ? raw : `http://${raw}`)
    return { hostname: parsed.hostname.toLowerCase(), port: parsed.port }
  } catch {
    return null
  }
}

function hostsMatch(originHost: string, candidate: string): boolean {
  const a = parseHost(originHost)
  const b = parseHost(candidate)
  if (a === null || b === null) return false
  if (a.hostname !== b.hostname) return false
  if (a.port !== '' && b.port !== '' && a.port !== b.port) return false
  return true
}

function originHost(raw: string): string | undefined {
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined
    return parsed.host
  } catch {
    return undefined
  }
}

export function isLoopbackAddress(address?: string): boolean {
  const value = String(address || '').replace(/^::ffff:/i, '').toLowerCase()
  if (value === '::1' || value === 'localhost') return true
  // 127.0.0.0/8 整段都是 loopback(RFC 1122),不只 127.0.0.1
  if (/^127(?:\.\d{1,3}){0,3}$/.test(value)) {
    return value === '127' || value.split('.').every((part) => Number(part) <= 255)
  }
  return false
}

/** Same-origin UI (Origin/Referer matches Host), or loopback curl without Origin. */
export function trustedUiRequest(request: Pick<IncomingMessage, 'headers' | 'socket'>): boolean {
  const origin = headerString(request.headers.origin)
    || originHost(headerString(request.headers.referer) || '')
  if (origin) {
    const from = originHost(origin.includes('://') ? origin : `http://${origin}`)
    if (!from) return false
    // 只认 Host:请求经反代转发时 Host 已被重写为本地地址,此时与反代来源的 Origin 不同源,
    // 必须拒绝;绝不能信任客户端可伪造的 X-Forwarded-Host,否则远端攻击者可借此绕过同源校验。
    const host = headerString(request.headers.host)
    if (!host) return false
    return hostsMatch(from, host)
  }
  return isLoopbackAddress(request.socket?.remoteAddress)
}

export function isPost(request: Pick<IncomingMessage, 'method'>): boolean {
  return String(request.method || '').toUpperCase() === 'POST'
}
