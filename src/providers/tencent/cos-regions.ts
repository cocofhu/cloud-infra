import type { RegionOption } from '../../core/types.js'

export const COS_REGIONS: RegionOption[] = [
  { id: 'ap-beijing', label: '北京', aliases: ['bj', 'beijing', 'pek'] },
  { id: 'ap-beijing-fsi', label: '北京金融', aliases: ['beijing-fsi'] },
  { id: 'ap-nanjing', label: '南京', aliases: ['nj', 'nanjing'] },
  { id: 'ap-shanghai', label: '上海', aliases: ['sh', 'shanghai'] },
  { id: 'ap-shanghai-fsi', label: '上海金融', aliases: ['shanghai-fsi'] },
  { id: 'ap-guangzhou', label: '广州', aliases: ['gz', 'guangzhou', 'canton'] },
  { id: 'ap-shenzhen-fsi', label: '深圳金融', aliases: ['sz-fsi', 'shenzhen-fsi'] },
  { id: 'ap-chengdu', label: '成都', aliases: ['cd', 'chengdu'] },
  { id: 'ap-chongqing', label: '重庆', aliases: ['cq', 'chongqing'] },
  { id: 'ap-hongkong', label: '中国香港', aliases: ['hk', 'hongkong', 'hong kong', '香港'] },
  { id: 'ap-singapore', label: '新加坡', aliases: ['sg', 'singapore'] },
  { id: 'ap-mumbai', label: '孟买', aliases: ['in', 'mumbai', 'india'] },
  { id: 'ap-jakarta', label: '雅加达', aliases: ['id', 'jakarta'] },
  { id: 'ap-seoul', label: '首尔', aliases: ['kr', 'seoul'] },
  { id: 'ap-bangkok', label: '曼谷', aliases: ['th', 'bangkok'] },
  { id: 'ap-tokyo', label: '东京', aliases: ['jp', 'tokyo'] },
  { id: 'na-siliconvalley', label: '硅谷', aliases: ['usw', 'siliconvalley', 'silicon valley'] },
  { id: 'na-ashburn', label: '弗吉尼亚', aliases: ['use', 'ashburn', 'virginia'] },
  { id: 'na-toronto', label: '多伦多', aliases: ['ca', 'toronto'] },
  { id: 'sa-saopaulo', label: '圣保罗', aliases: ['br', 'saopaulo', 'sao paulo'] },
  { id: 'eu-frankfurt', label: '法兰克福', aliases: ['de', 'frankfurt'] },
]

function norm(value: string): string {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '')
}

function tokens(region: RegionOption): string[] {
  const id = norm(region.id)
  const compact = id.replace(/-/g, '')
  const withoutAp = id.replace(/^ap-/, '')
  return [
    id,
    compact,
    withoutAp,
    withoutAp.replace(/-/g, ''),
    norm(region.label),
    ...(region.aliases || []).map(norm),
  ].filter(Boolean)
}

export function matchCosRegion(region: RegionOption, needle: string): boolean {
  const q = norm(needle)
  if (!q) return true
  return tokens(region).some((token) => token.includes(q))
}

export function filterCosRegions(needle: string, source: RegionOption[] = COS_REGIONS): RegionOption[] {
  return source.filter((region) => matchCosRegion(region, needle))
}

/** Only exact id / label / alias counts as a selected region. Substring input is not sent to COS. */
export function resolveCosRegion(raw: string | undefined, source: RegionOption[] = COS_REGIONS): RegionOption | undefined {
  const q = norm(raw || '')
  if (!q) return undefined
  return source.find((region) => tokens(region).includes(q))
}

export function regionLabel(id: string, source: RegionOption[] = COS_REGIONS): string {
  return source.find((region) => region.id === id)?.label || id
}
