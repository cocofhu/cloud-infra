import type { DetailTab } from '../../../core/types.js'

/** Official DBbrain product lines shown in the chat card type filter. */
export const DBBRAIN_PRODUCTS: DetailTab[] = [
  { id: 'mysql', label: 'MySQL' },
  { id: 'cynosdb', label: 'TDSQL-C' },
  { id: 'mariadb', label: 'MariaDB' },
  { id: 'dcdb', label: 'TDSQL MySQL' },
  { id: 'redis', label: 'Redis' },
  { id: 'mongodb', label: 'MongoDB' },
  { id: 'postgres', label: 'PostgreSQL' },
  { id: 'dbbrain-mysql', label: '自建 MySQL' },
]

/**
 * Regions the card can filter by. Unknown instance Region ids still render as-is.
 * Includes finance / overseas ids from the official DBbrain region matrix.
 */
export const DBBRAIN_REGIONS: DetailTab[] = [
  { id: '', label: '全地域' },
  { id: 'ap-guangzhou', label: '广州' },
  { id: 'ap-qingyuan', label: '清远' },
  { id: 'ap-shenzhen', label: '深圳' },
  { id: 'ap-shanghai', label: '上海' },
  { id: 'ap-nanjing', label: '南京' },
  { id: 'ap-hangzhou', label: '杭州' },
  { id: 'ap-qingdao', label: '青岛' },
  { id: 'ap-beijing', label: '北京' },
  { id: 'ap-tianjin', label: '天津' },
  { id: 'ap-chengdu', label: '成都' },
  { id: 'ap-chongqing', label: '重庆' },
  { id: 'ap-zhongwei', label: '中卫' },
  { id: 'ap-hongkong', label: '香港' },
  { id: 'ap-taipei', label: '台北' },
  { id: 'ap-shanghai-fsi', label: '上海金融' },
  { id: 'ap-shenzhen-fsi', label: '深圳金融' },
  { id: 'ap-beijing-fsi', label: '北京金融' },
  { id: 'ap-singapore', label: '新加坡' },
  { id: 'ap-jakarta', label: '雅加达' },
  { id: 'ap-bangkok', label: '曼谷' },
  { id: 'ap-seoul', label: '首尔' },
  { id: 'ap-tokyo', label: '东京' },
  { id: 'na-siliconvalley', label: '硅谷' },
  { id: 'na-ashburn', label: '弗吉尼亚' },
  { id: 'sa-saopaulo', label: '圣保罗' },
  { id: 'eu-frankfurt', label: '法兰克福' },
]

export function catalogPairs(tabs: DetailTab[]): Array<[string, string]> {
  return tabs.map((tab) => [tab.id, tab.label])
}
