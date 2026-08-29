import assert from 'node:assert/strict'
import test from 'node:test'
import { renderQuery } from '../core/query.js'
import { mapOwnedDomain } from '../providers/tencent/products/registrar.js'
import type { QueryResult } from '../core/types.js'

// 回归:「我的域名」卡片 216 条/18 页,摘要却写「12 个域名 + 启用/暂停」。
// 根因:(A) 模型拿本页行数(items.length=12=maxResults)当总数;(B) 内部 status 枚举
// enable/pause 被翻译成「启用/暂停」,与卡片 buyStatusLabel(即将到期/正常)两套口径并存。
// 修复:话术必须以 result.total 为唯一总数、以卡片「状态」列(buyStatusLabel)为唯一状态口径。

function myDomainResult(): QueryResult {
  const rows = [
    { DomainId: 'd1', DomainName: 'acme.cn', BuyStatus: 'ok', AutoRenew: 1, ExpirationDate: '2027-08-11' },
    { DomainId: 'd2', DomainName: 'other.com', BuyStatus: 'AboutToExpire', AutoRenew: 0, ExpirationDate: '2026-01-01' },
    { DomainId: 'd3', DomainName: 'third.net', BuyStatus: 'Expired', AutoRenew: 0, ExpirationDate: '2025-01-01' },
  ]
  return {
    query: '',
    kind: 'my-domain',
    items: rows.map((row) => mapOwnedDomain(row)),
    errors: [],
    total: 216,
    offset: 0,
    hasMore: true,
    view: 'list',
  }
}

test('renderQuery my-domain 总数口径:必须用 total 216,禁止用本页行数', () => {
  const text = renderQuery(myDomainResult())
  assert.match(text, /216/)
  assert.match(text, /必须使用总数 216/)
  assert.match(text, /禁止用.*行数/)
  // 不得把本页 3 条当总数呈现
  assert.doesNotMatch(text, /一共 3 条/)
  // 翻页话术给出下一页 offset
  assert.match(text, /offset=3/)
})

test('renderQuery my-domain 状态口径:用卡片 buyStatusLabel,不暴露内部枚举', () => {
  const text = renderQuery(myDomainResult())
  // 与卡片「状态」列完全一致的展示文案
  assert.match(text, /正常/)
  assert.match(text, /即将到期/)
  assert.match(text, /已过期/)
  // 内部枚举与其旧翻译一律不得出现
  assert.doesNotMatch(text, /\benable\b/)
  assert.doesNotMatch(text, /\bpause\b/)
  assert.doesNotMatch(text, /启用/)
  assert.doesNotMatch(text, /暂停/)
})

test('renderQuery 通用列表:hasMore 时强调总数与本页区间', () => {
  const text = renderQuery({
    query: '',
    kind: 'domain',
    items: [
      {
        id: 'tencent.domain:1',
        moduleId: 'tencent.domain',
        provider: 'tencent',
        kind: 'domain',
        title: 'a.com',
        description: 'a.com',
        status: 'enable',
        columns: [{ label: 'DNS状态', value: '正常' }],
      },
    ],
    errors: [],
    total: 42,
    offset: 0,
    hasMore: true,
    view: 'list',
  })
  assert.match(text, /找到 42 条/)
  assert.match(text, /必须使用总数 42/)
  assert.match(text, /第 1–1 条/)
  assert.match(text, /offset=1/)
  // 无「状态」列的卡片不再追加任何状态词
  assert.doesNotMatch(text, /1\. a\.com enable/)
})

test('renderQuery 通用列表:翻完时给出总数而非行数', () => {
  const text = renderQuery({
    query: '',
    kind: 'domain',
    items: [
      {
        id: 'tencent.domain:1',
        moduleId: 'tencent.domain',
        provider: 'tencent',
        kind: 'domain',
        title: 'a.com',
        description: 'a.com',
        status: 'enable',
      },
    ],
    errors: [],
    total: 7,
    offset: 6,
    hasMore: false,
    view: 'list',
  })
  assert.match(text, /一共 7 条/)
  assert.match(text, /禁止用列表行数当总数/)
  assert.doesNotMatch(text, /一共 1 条/)
})

test('renderQuery my-domain 空结果话术保持不变', () => {
  const empty = renderQuery({
    query: 'abc',
    kind: 'my-domain',
    items: [],
    errors: [],
    total: 0,
    offset: 0,
    hasMore: false,
    view: 'list',
  })
  assert.match(empty, /没有匹配「abc」的已购域名/)
})
