/**
 * 运行时拉取云 API（DescribeRegions）的封装：失败即报错，不做本地快照兜底。
 *
 * - 每个产品（CLS / COS / DBbrain）通过 `fetchSharedRegions(call, ...)` 拉自己的列表
 * - 响应通过 `normalizeUpstream` 合入 `TENCENT_REGIONS`：id 在共享 source 中存在则沿用共享的 group/label/aliases，
 *   上游多出的新 id 则以「海外」分组占位（等待 sync 脚本下次跑时人工 update，避免运行时擅自改共享 source 的分组语义）
 * - 错误统一封装为 `RegionFetchError`，UI 看到 message 后能明确知悉是云 API 拉取失败
 */

import {
  DEFAULT_REGION,
  RegionFetchError,
  TENCENT_REGIONS,
  type RegionOption,
  type RegionProduct,
  detectAliasConflicts,
  regionsFor,
  resolveRegion,
} from './regions-shared.js'
import { callTencentApi, type TencentCallContext, type TencentCreds, type TencentProductCall } from './client.js'

/** DescribeRegions 的产品 → 服务/版本/主机 映射 */
export const REGIONS_API: Record<RegionProduct, { service: string; host: string; version: string }> = {
  cls: { service: 'cls', host: 'cls.tencentcloudapi.com', version: '2020-10-16' },
  cos: { service: 'cos', host: 'cos.tencentcloudapi.com', version: '2018-11-26' },
  dbbrain: { service: 'dbbrain', host: 'dbbrain.tencentcloudapi.com', version: '2021-05-27' },
  cdb: { service: 'cdb', host: 'cdb.tencentcloudapi.com', version: '2017-03-20' },
  cvm: { service: 'cvm', host: 'cvm.tencentcloudapi.com', version: '2017-03-12' },
  lighthouse: { service: 'lighthouse', host: 'lighthouse.tencentcloudapi.com', version: '2020-03-24' },
  tke: { service: 'tke', host: 'tke.tencentcloudapi.com', version: '2018-05-25' },
}

/**
 * 各产品是否暴露官方「DescribeRegions」:
 *   - `cvm`: 在华北/华南/海外都有独立的 DescribeRegions,覆盖全镇。
 *   - `cdb/cls/dbbrain/...`: 实际 API 网关对该 action 返回 InvalidAction(2026-08 实测),
 *     所以统一落到 cvm,再按共享 source 的 group/products 过滤。
 *
 * 这是真实云 API 行为,与「以云 API 文档为准」一致:文档= API 真返回。
 */
const PRIMARY_REGION_PRODUCT: RegionProduct = 'cvm'

export interface UpstreamRegion {
  Region?: string
  RegionName?: string
  RegionState?: string
}

interface DescribeRegionsResponse {
  RegionSet?: UpstreamRegion[]
}

/** 把云 API 返回的 RegionSet 与共享 source 合并：共享 source 中的项放在首位（保序），上游多出的新 id 追加到尾部 */
export function normalizeUpstream(data: DescribeRegionsResponse): RegionOption[] {
  const upstreamIds: string[] = []
  for (const upstream of data.RegionSet || []) {
    const id = String(upstream.Region || '').trim()
    if (!id) continue
    if (String(upstream.RegionState || 'AVAILABLE').toUpperCase() === 'UNAVAILABLE') continue
    if (!upstreamIds.includes(id)) upstreamIds.push(id)
  }
  if (!upstreamIds.length) throw new RegionFetchError('云 API 返回了空的地域列表', 'shared')

  const sharedById = new Map(TENCENT_REGIONS.map((row) => [row.id, row]))
  const ordered: RegionOption[] = []
  for (const shared of TENCENT_REGIONS) if (upstreamIds.includes(shared.id)) ordered.push(shared)
  for (const id of upstreamIds) {
    if (!ordered.some((row) => row.id === id)) {
      const hit = sharedById.get(id)
      ordered.push(hit || { id, label: id, group: '海外', aliases: [id] })
    }
  }

  const conflicts = detectAliasConflicts(ordered)
  if (conflicts.length) {
    const first = conflicts[0]
    throw new RegionFetchError(
      `地域列表存在别名冲突："${first.alias}" 同时映射 ${first.first} 与 ${first.second}`,
      'shared',
    )
  }
  return ordered
}

/**
 * 运行时拉取指定产品的 DescribeRegions 列表。
 * 失败即抛 `RegionFetchError`，调用方不得静默兜底到本地快照。
 *
 * 等价于:
 *   cosCall('DescribeRegions', {}, creds, opts)   // 但把 host/version 带上
 */
export async function fetchSharedRegions(
  product: RegionProduct,
  creds: TencentCreds,
  opts: TencentCallContext,
): Promise<RegionOption[]> {
  const meta = REGIONS_API[product]
  if (!meta) throw new RegionFetchError(`未知产品 ${product}`, product)
  // 先按产品自身;若该产品的 API 网关不支持 DescribeRegions(InvalidAction),降级到 cvm(覆盖全镇)。
  const chain: RegionProduct[] = product === PRIMARY_REGION_PRODUCT
    ? [PRIMARY_REGION_PRODUCT]
    : [product, PRIMARY_REGION_PRODUCT]

  let lastErr: unknown = null
  for (const target of chain) {
    const meta = REGIONS_API[target]
    try {
      const data = await callTencentApi<DescribeRegionsResponse>({
        service: meta.service,
        host: meta.host,
        version: meta.version,
        action: 'DescribeRegions',
        payload: {},
        secretId: creds.secretId,
        secretKey: creds.secretKey,
        timeoutMs: opts.timeoutMs,
        signal: opts.signal,
        fetchImpl: opts.fetchImpl,
      })
      const merged = normalizeUpstream(data)
      if (target !== product && product !== PRIMARY_REGION_PRODUCT) {
        // 滤回当前产品可用的部分(共享 source 已注 products 的产品子集;未标 products=全部)
        return regionsFor(product).filter((row) => merged.some((m) => m.id === row.id))
      }
      return merged
    } catch (err) {
      lastErr = err
      // 云 API 按 zh-CN 返回 Message,「该产品没有 DescribeRegions」的判定以错误码为主、文案兜底
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code?: unknown }).code || '') : ''
      if (/InvalidAction|UnsupportedOperation/i.test(code)) continue
      if (err instanceof Error && /InvalidAction|invalid or not found|不支持|无此接口|不存在/i.test(err.message)) continue
      break
    }
  }
  throw new RegionFetchError(
    `地域列表拉取失败（${product}）：${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
    product,
    lastErr,
  )
}

/** 校验输入是否命中共享 source。命中返回规范 id；未命中返回 undefined；空输入返回 DEFAULT_REGION。 */
export function resolveRegionOrDefault(input?: string, fallback: string = DEFAULT_REGION): string {
  return resolveRegion(input) || fallback
}

/** 让 CLS / COS / DBbrain 共享一份 list source；主要产品都可按 `regionsFor` 过滤 */
export function sharedRegionsFor(product?: RegionProduct): RegionOption[] {
  return regionsFor(product)
}
