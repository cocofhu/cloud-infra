export interface ClsRegion {
  id: string
  name: string
  group: '大陆' | '港澳台' | '海外' | '金融' | '特殊'
}

export const DEFAULT_CLS_REGION = 'ap-guangzhou'

/** Official CLS region catalog (console groups). Session-only; never persisted. */
export const CLS_REGIONS: ClsRegion[] = [
  { id: 'ap-guangzhou', name: '广州', group: '大陆' },
  { id: 'ap-beijing', name: '北京', group: '大陆' },
  { id: 'ap-shanghai', name: '上海', group: '大陆' },
  { id: 'ap-chengdu', name: '成都', group: '大陆' },
  { id: 'ap-nanjing', name: '南京', group: '大陆' },
  { id: 'ap-chongqing', name: '重庆', group: '大陆' },
  { id: 'ap-zhongwei', name: '中卫', group: '大陆' },
  { id: 'ap-hongkong', name: '中国香港', group: '港澳台' },
  { id: 'ap-taipei', name: '中国台北', group: '港澳台' },
  { id: 'ap-singapore', name: '新加坡', group: '海外' },
  { id: 'ap-bangkok', name: '曼谷', group: '海外' },
  { id: 'ap-tokyo', name: '东京', group: '海外' },
  { id: 'ap-seoul', name: '首尔', group: '海外' },
  { id: 'ap-jakarta', name: '雅加达', group: '海外' },
  { id: 'sa-saopaulo', name: '圣保罗', group: '海外' },
  { id: 'eu-frankfurt', name: '法兰克福', group: '海外' },
  { id: 'na-siliconvalley', name: '硅谷', group: '海外' },
  { id: 'na-ashburn', name: '弗吉尼亚', group: '海外' },
  { id: 'me-riyadh', name: '利雅得', group: '海外' },
  { id: 'ap-shenzhen-fsi', name: '深圳金融', group: '金融' },
  { id: 'ap-shanghai-fsi', name: '上海金融', group: '金融' },
  { id: 'ap-beijing-fsi', name: '北京金融', group: '金融' },
  { id: 'ap-shanghai-adc', name: '上海自动驾驶云', group: '特殊' },
]

const GROUP_ORDER: ClsRegion['group'][] = ['大陆', '港澳台', '海外', '金融', '特殊']

const ALIAS: Record<string, string> = {
  'me-saudi-arabia': 'me-riyadh',
  广州: 'ap-guangzhou',
  北京: 'ap-beijing',
  上海: 'ap-shanghai',
  成都: 'ap-chengdu',
  南京: 'ap-nanjing',
  重庆: 'ap-chongqing',
  中卫: 'ap-zhongwei',
  香港: 'ap-hongkong',
  中国香港: 'ap-hongkong',
  台北: 'ap-taipei',
  台湾: 'ap-taipei',
  中国台北: 'ap-taipei',
  新加坡: 'ap-singapore',
  曼谷: 'ap-bangkok',
  东京: 'ap-tokyo',
  首尔: 'ap-seoul',
  雅加达: 'ap-jakarta',
  圣保罗: 'sa-saopaulo',
  法兰克福: 'eu-frankfurt',
  硅谷: 'na-siliconvalley',
  美西: 'na-siliconvalley',
  弗吉尼亚: 'na-ashburn',
  美东: 'na-ashburn',
  利雅得: 'me-riyadh',
  沙特: 'me-riyadh',
  深圳金融: 'ap-shenzhen-fsi',
  上海金融: 'ap-shanghai-fsi',
  北京金融: 'ap-beijing-fsi',
  自动驾驶: 'ap-shanghai-adc',
  上海自动驾驶云: 'ap-shanghai-adc',
}

for (const region of CLS_REGIONS) {
  ALIAS[region.id] = region.id
  ALIAS[region.id.toLowerCase()] = region.id
  ALIAS[region.name] = region.id
}

export function resolveClsRegion(input?: string): string {
  const raw = String(input || '').trim()
  if (!raw) return DEFAULT_CLS_REGION
  return ALIAS[raw] || ALIAS[raw.toLowerCase()] || DEFAULT_CLS_REGION
}

export function parseRegionHint(text: string): { region?: string; rest: string } {
  const src = String(text || '').trim()
  if (!src) return { rest: '' }
  const keys = Object.keys(ALIAS).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (key.length < 2) continue
    const idx = src.toLowerCase().indexOf(key.toLowerCase())
    if (idx < 0) continue
    const rest = `${src.slice(0, idx)} ${src.slice(idx + key.length)}`
      .replace(/的/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return { region: ALIAS[key] || ALIAS[key.toLowerCase()], rest }
  }
  return { rest: src }
}

export function regionLabel(id: string): string {
  const region = CLS_REGIONS.find((item) => item.id === id)
  return region?.name || id
}

export function regionGroups(list: ClsRegion[] = CLS_REGIONS): Array<{ group: string; items: ClsRegion[] }> {
  return GROUP_ORDER
    .map((group) => ({ group, items: list.filter((item) => item.group === group) }))
    .filter((row) => row.items.length)
}
