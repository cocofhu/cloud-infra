import type { RegionOption } from '../../core/types.js'
import {
  TENCENT_REGIONS,
  resolveRegion,
  regionLabel as sharedRegionLabel,
} from './regions-shared.js'

/**
 * 共享 COS 地域视图。`RegionOption` 的 `label` 字段与共享 source 的 `label` 保持一致；
 * 同时把共享 source 的 `group` 透传出去（`core/types.ts` 的 `RegionOption` 也允许缺省 `group`，这里仅做结构化映射）。
 */
export const COS_REGIONS: RegionOption[] = TENCENT_REGIONS.map((region) => ({
  id: region.id,
  label: region.label,
  aliases: region.aliases,
}))

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

/**
 * 仅接受完整 id / label / alias（不支持下拉「模糊子串」匹配命中即视为合法 region）。
 * 实现委托给共享 `resolveRegion`：返回值是共享 source 中的 RegionOption，保持共享 label / aliases。
 */
export function resolveCosRegion(raw: string | undefined, source: RegionOption[] = COS_REGIONS): RegionOption | undefined {
  const id = resolveRegion(raw)
  if (!id) return undefined
  return source.find((region) => region.id === id) || TENCENT_REGIONS.find((region) => region.id === id)
}

export function regionLabel(id: string, source: RegionOption[] = COS_REGIONS): string {
  const hit = source.find((region) => region.id === id)
  return hit?.label || sharedRegionLabel(id)
}
