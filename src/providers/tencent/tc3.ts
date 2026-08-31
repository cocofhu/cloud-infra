import { createHash, createHmac } from 'node:crypto'

export interface Tc3Input {
  secretId: string
  secretKey: string
  service: string
  host: string
  action: string
  payload: string
  timestamp: number
}

export function sha256Hex(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

export function hmacSha256(key: string | Buffer, message: string): Buffer {
  return createHmac('sha256', key).update(message, 'utf8').digest()
}

export function utcDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().slice(0, 10)
}

export function tc3Authorization(input: Tc3Input): string {
  const { secretId, secretKey, service, host, action, payload, timestamp } = input
  const date = utcDate(timestamp)
  const hashedPayload = sha256Hex(payload)
  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${host}\nx-tc-action:${action.toLowerCase()}\n`
  const signedHeaders = 'content-type;host;x-tc-action'
  const canonicalRequest = ['POST', '/', '', canonicalHeaders, signedHeaders, hashedPayload].join('\n')
  const credentialScope = `${date}/${service}/tc3_request`
  const stringToSign = ['TC3-HMAC-SHA256', String(timestamp), credentialScope, sha256Hex(canonicalRequest)].join('\n')
  const secretDate = hmacSha256(`TC3${secretKey}`, date)
  const secretService = hmacSha256(secretDate, service)
  const secretSigning = hmacSha256(secretService, 'tc3_request')
  const signature = hmacSha256(secretSigning, stringToSign).toString('hex')
  return `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
}

export function tc3Headers(input: Tc3Input & { version: string; region?: string }): Record<string, string> {
  const headers: Record<string, string> = {
    authorization: tc3Authorization(input),
    'content-type': 'application/json; charset=utf-8',
    host: input.host,
    'x-tc-action': input.action,
    'x-tc-timestamp': String(input.timestamp),
    'x-tc-version': input.version,
    // 云 API 按该头返回本地化字段(可用区名、状态描述、错误 Message):
    // 不传时本账号默认 en-US,可用区列会显示 "Guangzhou Zone 3" 而不是「广州三区」。
    // 该头不在签名范围内(SignedHeaders 固定为 content-type;host;x-tc-action)。
    'x-tc-language': 'zh-CN',
  }
  if (input.region) headers['x-tc-region'] = input.region
  return headers
}
