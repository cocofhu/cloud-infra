/**
 * 旧 CLS 地域 API 的向后兼容层。
 *
 * 共享数据源在 `regions-shared.ts`；这里仅保持原有导出签名（`CLS_REGIONS` / `resolveClsRegion` / `parseRegionHint`
 * / `regionLabel` / `regionGroups`），内部全部委托给共享实现，调用方无需改动。
 */

import {
  DEFAULT_REGION,
  TENCENT_REGIONS,
  parseRegionHint as sharedParseRegionHint,
  regionGroups as sharedRegionGroups,
  regionLabel as sharedRegionLabel,
  type RegionOption,
} from './regions-shared.js'
import { resolveRegion } from './regions-shared.js'

export interface ClsRegion {
  id: string
  name: string
  group: '大陆' | '港澳台' | '海外' | '金融' | '特殊'
}

export const DEFAULT_CLS_REGION = DEFAULT_REGION

/** 与旧版 CLS_REGIONS 等同的视图（id/name/group），数据来自共享 TENCENT_REGIONS。 */
export const CLS_REGIONS: ClsRegion[] = TENCENT_REGIONS.map((region) => ({
  id: region.id,
  name: region.label,
  group: region.group,
}))

export function resolveClsRegion(input?: string): string {
  return resolveRegion(input) || DEFAULT_CLS_REGION
}

export function parseRegionHint(text: string): { region?: string; rest: string } {
  return sharedParseRegionHint(text)
}

export function regionLabel(id: string): string {
  return sharedRegionLabel(id)
}

export function regionGroups(
  list: ClsRegion[] | RegionOption[] = CLS_REGIONS,
): Array<{ group: string; items: ClsRegion[] }> {
  const asCls = (item: ClsRegion | RegionOption): ClsRegion => {
    if ('name' in item) return item as ClsRegion
    const option = item as RegionOption
    return { id: option.id, name: option.label, group: option.group }
  }
  const groups = sharedRegionGroups(list.map((item) => {
    if ('name' in item) {
      const cls = item as ClsRegion
      const shared = TENCENT_REGIONS.find((row) => row.id === cls.id)
      return shared || { id: cls.id, label: cls.name, group: cls.group, aliases: [cls.id, cls.name] }
    }
    return item as RegionOption
  }))
  return groups.map((row) => ({ group: row.group, items: row.items.map(asCls) }))
}
