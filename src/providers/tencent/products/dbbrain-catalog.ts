import type { DetailTab } from '../../../core/types.js'
import { DEFAULT_REGION, TENCENT_REGIONS, regionsFor } from '../regions-shared.js'

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
 * 卡片可共享「按 DBbrain 分组」过滤的地域列表。
 * 已收敛到共享数据源（不再包含 `{ id: '', label: '全地域' }` 的占位项），默认选中 `ap-guangzhou`。
 * 未改选的语义由调用层默认成 `DEFAULT_REGION`（`ap-guangzhou`），而不再是空串。
 */
export const DBBRAIN_REGIONS: DetailTab[] = regionsFor('dbbrain')
  .filter((region) => region.group !== '特殊')
  .map((region) => ({ id: region.id, label: region.label }))

export function catalogPairs(tabs: DetailTab[]): Array<[string, string]> {
  return tabs.map((tab) => [tab.id, tab.label])
}

/** DBbrain 卡片的地域默认选中（原「全地域」已移除） */
export const DBBRAIN_DEFAULT_REGION = DEFAULT_REGION

export { TENCENT_REGIONS }
