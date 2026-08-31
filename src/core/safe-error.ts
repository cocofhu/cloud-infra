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
  '未登录',
  '未开外网',
  '外网地址不可达',
  '无法连接实例',
  '网络不可达',
  'unknown method',
  '日志主题',
  '请先选择地域',
  '存储桶',
  '文件夹',
  '不能超过',
  '不支持重命名',
  '未列尽',
  '未删尽',
  '源对象删除失败',
  '对象已存在',
  '缺少文件',
]

const CODE_HINTS: Record<string, string> = {
  AuthFailure: '云厂商鉴权失败，请检查设置中的密钥',
  // AuthFailure.* 里唯一「密钥没错、只是没授权」的分支:落到 AuthFailure 会误导用户去翻密钥
  'AuthFailure.UnauthorizedOperation': '当前密钥没有该操作的权限',
  UnauthorizedOperation: '当前密钥没有该操作的权限',
  FailedOperation: '云厂商操作失败',
  'FailedOperation.RegisterDomainFailed': '注册失败，请核对账户余额与域名是否仍可注册',
  'FailedOperation.InsufficientBalance': '账户余额不足',
  ResourceInsufficient: '账户余额不足',
  'UnsupportedOperation.DomainUpdateProhibitionLockStartOn': '更新锁已开，不能改转移锁',
  'UnsupportedOperation.ModifyDomainInfoOperateUnsupported': '当前域名状态不支持该操作',
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
  '检索语句语法错误',
  '没有找到该日志主题',
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
  if (/TopicNotExist|TopicNotFound/i.test(code)) return '没有找到该日志主题'
  if (/SyntaxError|QueryError/i.test(code)) return '检索语句语法错误'
  if (CODE_HINTS[code]) return CODE_HINTS[code]
  const head = code.split('.')[0] || ''
  return CODE_HINTS[head] || '云厂商请求失败'
}

function looksSafeLocal(message: string): boolean {
  if (message.length > 120 || SECRET_RE.test(message)) return false
  return SAFE_SNIPPETS.some((snippet) => message.includes(snippet))
}

function looksSafeBusinessCopy(message: string): boolean {
  if (!message || message.length > 120 || SECRET_RE.test(message)) return false
  if (PASSTHROUGH.has(message) || looksSafeLocal(message)) return true
  if (/^HTTP \d+/.test(message) || /\btimeout\b/i.test(message)) return false
  return /[\u4e00-\u9fff]/.test(message)
}

/** User-facing error: keep our own hints, drop raw upstream / secret-like text. */
export function publicErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? '')
  const message = raw.replace(/\s+/g, ' ').trim()
  const code = errorCode(err)
  if (PASSTHROUGH.has(message)) return message
  if (SECRET_RE.test(message)) return hintForCode(code)
  // 带厂商错误码即视为上游原文。云 API 已按 zh-CN 返回中文 Message,单看文案无法与本地
  // 提示区分(「缺少参数」等词也会命中 SAFE_SNIPPETS),因此有码时一律用我们自己的文案。
  if (code) return hintForCode(code)
  if (looksSafeLocal(message)) return message
  if (/timeout/i.test(message)) return '云厂商请求超时'
  if (/^HTTP \d+/.test(message)) return '云厂商请求失败'
  if (code) return hintForCode(code)
  return '云厂商请求失败'
}

/** Action 400: keep module-authored Chinese copy; sanitize thrown vendor/secret text only. */
export function actionErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? '')
  const message = raw.replace(/\s+/g, ' ').trim()
  if (!message) return '云厂商请求失败'
  if (!errorCode(err) && looksSafeBusinessCopy(message)) return message
  return publicErrorMessage(err)
}
