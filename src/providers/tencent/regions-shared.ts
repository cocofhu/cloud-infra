/**
 * 共享地域数据源（以云 API 文档为准）。
 *
 * - 所有产品卡片（CLS / COS / DBbrain 等）统一消费这一份 `RegionOption[]`
 * - `aliases` 合并了 CLS 现有中文命名 + COS 现有 88 个英文/拼音缩写，且与云 API 文档逐步对齐
 * - `group` 沿用 CLS 现有分组（大陆 / 港澳台 / 海外 / 金融 / 特殊）
 * - 已移除 DBbrain 的「全地域」占位项（不再存在 id === '' 的项）
 *
 * 更新方式：`node scripts/sync-regions.mjs`（从腾讯云 DescribeRegions 拉最新清单 diff/写回）。
 * 运行时也通过 `fetchSharedRegions(...)` 直接拉云 API；失败时报错，不做本地快照兜底。
 */

export interface RegionOption {
  /** 腾讯云 region id，全局唯一 */
  id: string
  /** 显示名，全局唯一（如「中国香港」而非「香港」混用） */
  label: string
  /** 分组（沿用 CLS 的分组口径） */
  group: '大陆' | '港澳台' | '海外' | '金融' | '特殊'
  /** 别名：id / 中文 / 拼音缩写 / 英文代号 / 历史别名，全部小写不区分大小写 */
  aliases: string[]
  /** 该地域在哪些产品可用（可选，缺省表示全部产品） */
  products?: Array<'cls' | 'cos' | 'dbbrain' | 'cdb' | 'cvm' | 'lighthouse' | 'tke'>
}

export type RegionProduct = 'cls' | 'cos' | 'dbbrain' | 'cdb' | 'cvm' | 'lighthouse' | 'tke'

/** 移除「全地域」后的默认选中项 */
export const DEFAULT_REGION = 'ap-guangzhou'

/**
 * 共享地域数据源（手工记录 + sync 脚本自动更新）。
 *
 * 合并来源：
 *   - 原 `CLS_REGIONS`（23 项，含分组）：大陆 7 + 港澳台 2 + 海外 9 + 金融 3 + 特殊 1，外加 DBbrain 补充的
 *     `ap-shenzhen`（深圳）与 `ap-qingyuan`（清远）、`ap-hangzhou`（杭州）、`ap-qingdao`（青岛）、
 *     `ap-tianjin`（天津）、`ap-mumbai`（孟买）等
 *   - 原 `COS_REGIONS`（21 项）的 aliases：`gz`/`guangzhou`/`canton`/`bj`/`beijing`/`pek`/`sh`/`shanghai`... 等
 *   - 原 `DBBRAIN_REGIONS`：补齐 `ap-shenzhen`、`ap-qingyuan` 等地域，去掉 `{ id: '', label: '全地域' }`
 *
 * 命名口径统一：`ap-hongkong` → 「中国香港」（而非「香港」/「香港」混用）、`ap-taipei` → 「中国台北」。
 */
export const TENCENT_REGIONS: RegionOption[] = [
  // —— 大陆 ——
  {
    id: 'ap-guangzhou',
    label: '广州',
    group: '大陆',
    aliases: ['gz', 'guangzhou', 'canton', '广州', 'ap-guangzhou'],
  },
  {
    id: 'ap-beijing',
    label: '北京',
    group: '大陆',
    aliases: ['bj', 'beijing', 'pek', '北京', 'ap-beijing'],
  },
  {
    id: 'ap-shanghai',
    label: '上海',
    group: '大陆',
    aliases: ['sh', 'shanghai', '上海', 'ap-shanghai'],
  },
  {
    id: 'ap-shenzhen',
    label: '深圳',
    group: '大陆',
    aliases: ['sz', 'shenzhen', '深圳', 'ap-shenzhen'],
  },
  {
    id: 'ap-qingyuan',
    label: '清远',
    group: '大陆',
    aliases: ['qy', 'qingyuan', '清远', 'ap-qingyuan'],
  },
  {
    id: 'ap-chengdu',
    label: '成都',
    group: '大陆',
    aliases: ['cd', 'chengdu', '成都', 'ap-chengdu'],
  },
  {
    id: 'ap-nanjing',
    label: '南京',
    group: '大陆',
    aliases: ['nj', 'nanjing', '南京', 'ap-nanjing'],
  },
  {
    id: 'ap-chongqing',
    label: '重庆',
    group: '大陆',
    aliases: ['cq', 'chongqing', '重庆', 'ap-chongqing'],
  },
  {
    id: 'ap-hangzhou',
    label: '杭州',
    group: '大陆',
    aliases: ['hz', 'hangzhou', '杭州', 'ap-hangzhou'],
  },
  {
    id: 'ap-qingdao',
    label: '青岛',
    group: '大陆',
    aliases: ['qd', 'qingdao', '青岛', 'ap-qingdao'],
  },
  {
    id: 'ap-tianjin',
    label: '天津',
    group: '大陆',
    aliases: ['tj', 'tianjin', '天津', 'ap-tianjin'],
  },
  {
    id: 'ap-zhongwei',
    label: '中卫',
    group: '大陆',
    aliases: ['zhongwei', 'zw', '中卫', 'ap-zhongwei'],
  },
  // —— 港澳台 ——
  {
    id: 'ap-hongkong',
    label: '中国香港',
    group: '港澳台',
    aliases: ['hk', 'hongkong', 'hong kong', '香港', '中国香港', 'ap-hongkong'],
  },
  {
    id: 'ap-taipei',
    label: '中国台北',
    group: '港澳台',
    aliases: ['taipei', 'tw', 'tp', '台北', '台湾', '中国台北', 'ap-taipei'],
  },
  // —— 海外 ——
  {
    id: 'ap-singapore',
    label: '新加坡',
    group: '海外',
    aliases: ['sg', 'singapore', '新加坡', 'ap-singapore'],
  },
  {
    id: 'ap-bangkok',
    label: '曼谷',
    group: '海外',
    aliases: ['th', 'bangkok', '曼谷', 'ap-bangkok'],
  },
  {
    id: 'ap-tokyo',
    label: '东京',
    group: '海外',
    aliases: ['jp', 'tokyo', '东京', 'ap-tokyo'],
  },
  {
    id: 'ap-seoul',
    label: '首尔',
    group: '海外',
    aliases: ['kr', 'seoul', '首尔', 'ap-seoul'],
  },
  {
    id: 'ap-jakarta',
    label: '雅加达',
    group: '海外',
    aliases: ['id', 'jakarta', '雅加达', 'ap-jakarta'],
  },
  {
    id: 'ap-mumbai',
    label: '孟买',
    group: '海外',
    aliases: ['in', 'mumbai', 'india', '孟买', 'ap-mumbai'],
  },
  {
    id: 'sa-saopaulo',
    label: '圣保罗',
    group: '海外',
    aliases: ['br', 'saopaulo', 'sao paulo', '圣保罗', 'sa-saopaulo'],
  },
  {
    id: 'eu-frankfurt',
    label: '法兰克福',
    group: '海外',
    aliases: ['de', 'frankfurt', '法兰克福', 'eu-frankfurt'],
  },
  {
    id: 'na-siliconvalley',
    label: '硅谷',
    group: '海外',
    aliases: ['usw', 'siliconvalley', 'silicon valley', '美西', '硅谷', 'na-siliconvalley'],
  },
  {
    id: 'na-ashburn',
    label: '弗吉尼亚',
    group: '海外',
    aliases: ['use', 'ashburn', 'virginia', '美东', '弗吉尼亚', 'na-ashburn'],
  },
  {
    id: 'na-toronto',
    label: '多伦多',
    group: '海外',
    aliases: ['ca', 'toronto', '多伦多', 'na-toronto'],
  },
  {
    id: 'me-riyadh',
    label: '利雅得',
    group: '海外',
    aliases: ['riyadh', 'me-saudi-arabia', 'saudi', '沙特', '利雅得', 'me-riyadh'],
  },
  // —— 金融 ——
  {
    id: 'ap-shanghai-fsi',
    label: '上海金融',
    group: '金融',
    aliases: ['sh-fsi', 'shanghai-fsi', 'shanghaifsi', '上海金融', 'ap-shanghai-fsi'],
  },
  {
    id: 'ap-shenzhen-fsi',
    label: '深圳金融',
    group: '金融',
    aliases: ['sz-fsi', 'shenzhen-fsi', 'shenzhenfsi', '深圳金融', 'ap-shenzhen-fsi'],
  },
  {
    id: 'ap-beijing-fsi',
    label: '北京金融',
    group: '金融',
    aliases: ['bj-fsi', 'beijing-fsi', 'beijingfsi', '北京金融', 'ap-beijing-fsi'],
  },
  // —— 特殊 ——
  {
    id: 'ap-shanghai-adc',
    label: '上海自动驾驶云',
    group: '特殊',
    aliases: ['sh-adc', 'shanghai-adc', '自动驾驶', '上海自动驾驶云', 'ap-shanghai-adc'],
  },
]

function norm(value: string): string {
  return String(value || '').trim().toLowerCase()
}

/**
 * 按规范化后的 alias 建立 lookup。
 * 每个 alias 只能映射到唯一地域；同一 alias 出现在多处会在 sync 脚本中被检测并报错。
 */
const ALIAS_MAP: Map<string, string> = (() => {
  const map = new Map<string, string>()
  for (const region of TENCENT_REGIONS) {
    const tokens = [region.id, region.label, ...region.aliases]
    for (const token of tokens) {
      const key = norm(token)
      if (!key) continue
      if (!map.has(key)) map.set(key, region.id)
    }
  }
  return map
})()

/** 按 alias 长度倒序返回所有 key（供 `parseRegionHint` 做最长匹配） */
export const ALIAS_KEYS: string[] = Array.from(ALIAS_MAP.keys()).sort((a, b) => b.length - a.length)

/**
 * 统一的「输出补全」解析 —— 替代原 `resolveClsRegion` / `resolveCosRegion`。
 *
 * 行为：
 *   - 输入规范化（去空白，小写）
 *   - 命中 id / label / aliases 任一 → 返回规范化 Region id
 *   - 未命中 → 返回 `undefined`（不静默 fallback 到 DEFAULT，由调用方决定）
 *   - 「全地域」/ `''` → 返回 `undefined`（已废弃“不过滤”语义，调用方需自行决定是否走默认）
 */
export function resolveRegion(input?: string): string | undefined {
  const raw = norm(String(input || ''))
  if (!raw) return undefined
  return ALIAS_MAP.get(raw)
}

/**
 * 老用法兼容：在一段文本里找第一个命中的 alias。
 * 为了防止「商业化广州的实例」这类文本被「商业」错误命中，只允许长度 ≥ 2 的 alias 参与匹配。
 */
export function parseRegionHint(text: string): { region?: string; rest: string } {
  const src = String(text || '').trim()
  if (!src) return { rest: '' }
  for (const key of ALIAS_KEYS) {
    if (key.length < 2) continue
    const idx = src.toLowerCase().indexOf(key.toLowerCase())
    if (idx < 0) continue
    const rest = `${src.slice(0, idx)} ${src.slice(idx + key.length)}`
      .replace(/的/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return { region: ALIAS_MAP.get(key), rest }
  }
  return { rest: src }
}

export function getRegion(id: string): RegionOption | undefined {
  const normId = norm(id)
  return TENCENT_REGIONS.find((region) => region.id === normId)
}

export function regionLabel(id: string): string {
  return getRegion(id)?.label || id
}

export const GROUP_ORDER: Array<RegionOption['group']> = ['大陆', '港澳台', '海外', '金融', '特殊']

export function regionGroups(
  list: RegionOption[] = TENCENT_REGIONS,
): Array<{ group: RegionOption['group']; items: RegionOption[] }> {
  return GROUP_ORDER
    .map((group) => ({ group, items: list.filter((item) => item.group === group) }))
    .filter((row) => row.items.length)
}

/** 按产品过滤共享数据源（缺省返回全部） */
export function regionsFor(product?: RegionProduct): RegionOption[] {
  if (!product) return TENCENT_REGIONS
  return TENCENT_REGIONS.filter((region) => !region.products || region.products.includes(product))
}

/** 检测 alias 冲突（同一 alias 命中多个地域）。冲突时抛出，sync 脚本内会拒绝合并。 */
export function detectAliasConflicts(
  list: RegionOption[] = TENCENT_REGIONS,
): Array<{ alias: string; first: string; second: string }> {
  const seen = new Map<string, string>()
  const conflicts: Array<{ alias: string; first: string; second: string }> = []
  for (const region of list) {
    for (const alias of [region.id, region.label, ...region.aliases]) {
      const key = norm(String(alias || ''))
      if (!key) continue
      const prev = seen.get(key)
      if (prev && prev !== region.id) conflicts.push({ alias: key, first: prev, second: region.id })
      else if (!prev) seen.set(key, region.id)
    }
  }
  return conflicts
}

/** 错误类型：运行时拉取云 API 失败时抛出 */
export class RegionFetchError extends Error {
  readonly product: RegionProduct | 'shared' | string
  readonly cause?: unknown
  constructor(message: string, product: string, cause?: unknown) {
    super(message)
    this.name = 'RegionFetchError'
    this.product = product
    this.cause = cause
  }
}

/** 供卡片 UI 显示的用户态错误文案 */
export function regionFetchErrorMessage(product: RegionProduct | 'shared' | string): string {
  return `地域列表拉取失败（${product}）：请检查网络或云 API 状态后重试`
}
