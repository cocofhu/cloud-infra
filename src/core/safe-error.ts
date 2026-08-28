const SAFE_SNIPPETS = [
  '未知模块',
  '未知云厂商',
  '未知动作',
  '缺少',
  '没有',
  '尚未',
  '不支持',
  '未配置',
  '未注册',
  'unknown method',
  '请先选择地域',
  '存储桶',
  '文件夹',
  '不能超过',
  '不支持重命名',
  '未列尽',
  '对象已存在',
  '缺少文件',
]

const CODE_HINTS: Record<string, string> = {
  AuthFailure: '云厂商鉴权失败，请检查设置中的密钥',
  UnauthorizedOperation: '当前密钥没有该操作的权限',
  FailedOperation: '云厂商操作失败',
  InvalidParameter: '请求参数无效',
  InvalidParameterValue: '请求参数无效',
  MissingParameter: '请求参数无效',
  ResourceNotFound: '资源不存在',
  RequestLimitExceeded: '请求过于频繁，请稍后重试',
  LimitExceeded: '超出配额',
  InternalError: '云厂商请求失败',
  AccessDenied: '当前密钥没有该操作的权限',
  NoSuchBucket: '存储桶不存在',
  NoSuchKey: '对象不存在',
  BucketNotEmpty: '存储桶非空，请先清空对象',
  EntityTooLarge: '上传文件不能超过 20MB',
}

const SECRET_RE = /AKID[0-9A-Za-z]{8,}|LTAI[0-9A-Za-z]{8,}|sk-[A-Za-z0-9]{16,}|-----BEGIN |\bsecret(?:id|key)\b\s*[:=]/i

const PASSTHROUGH = new Set([
  ...Object.values(CODE_HINTS),
  '云厂商请求失败',
  '云厂商请求超时',
  '请求来源不受信任',
  '写操作仅允许 POST',
  'unknown method',
])

function errorCode(err: unknown): string {
  if (!err || typeof err !== 'object') return ''
  const code = 'code' in err ? String((err as { code?: unknown }).code || '') : ''
  return code.trim()
}

function hintForCode(code: string): string {
  if (!code) return '云厂商请求失败'
  if (CODE_HINTS[code]) return CODE_HINTS[code]
  const head = code.split('.')[0] || ''
  return CODE_HINTS[head] || '云厂商请求失败'
}

function looksSafeLocal(message: string): boolean {
  if (message.length > 120 || SECRET_RE.test(message)) return false
  return SAFE_SNIPPETS.some((snippet) => message.includes(snippet))
}

/** User-facing error: keep our own hints, drop raw upstream / secret-like text. */
export function publicErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? '')
  const message = raw.replace(/\s+/g, ' ').trim()
  const code = errorCode(err)
  if (PASSTHROUGH.has(message)) return message
  if (SECRET_RE.test(message)) return hintForCode(code)
  if (looksSafeLocal(message)) return message
  if (/timeout/i.test(message)) return '云厂商请求超时'
  if (/^HTTP \d+/.test(message)) return '云厂商请求失败'
  if (code) return hintForCode(code)
  return '云厂商请求失败'
}
