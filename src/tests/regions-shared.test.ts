import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_REGION,
  TENCENT_REGIONS,
  detectAliasConflicts,
  parseRegionHint,
  regionLabel,
  regionsFor,
  resolveRegion,
} from '../providers/tencent/regions-shared.js'
import { CLS_REGIONS, regionGroups, resolveClsRegion } from '../providers/tencent/regions.js'
import { COS_REGIONS, resolveCosRegion } from '../providers/tencent/cos-regions.js'
import { DBBRAIN_REGIONS } from '../providers/tencent/products/dbbrain.js'

// —— g2.1 / g2.4: 共享 resolveRegion 命中标准语义 ——

test('resolveRegion: 广州 / gz / ap-guangzhou 三种输入均返回 ap-guangzhou', () => {
  assert.equal(resolveRegion('广州'), 'ap-guangzhou')
  assert.equal(resolveRegion('gz'), 'ap-guangzhou')
  assert.equal(resolveRegion('ap-guangzhou'), 'ap-guangzhou')
})

test('resolveRegion: 大小写不敏感', () => {
  assert.equal(resolveRegion('GZ'), 'ap-guangzhou')
  assert.equal(resolveRegion('BeiJing'), 'ap-beijing')
  assert.equal(resolveRegion('AP-GUANGZHOU'), 'ap-guangzhou')
  assert.equal(resolveRegion('HK'), 'ap-hongkong')
})

test('resolveRegion: 北京 / 上海 / 香港 / 台北 / 台湾 命中', () => {
  assert.equal(resolveRegion('beijing'), 'ap-beijing')
  assert.equal(resolveRegion('北京'), 'ap-beijing')
  assert.equal(resolveRegion('sh'), 'ap-shanghai')
  assert.equal(resolveRegion('上海'), 'ap-shanghai')
  assert.equal(resolveRegion('香港'), 'ap-hongkong')
  assert.equal(resolveRegion('中国香港'), 'ap-hongkong')
  assert.equal(resolveRegion('hongkong'), 'ap-hongkong')
  assert.equal(resolveRegion('台北'), 'ap-taipei')
  assert.equal(resolveRegion('台湾'), 'ap-taipei')
  assert.equal(resolveRegion('中国台北'), 'ap-taipei')
})

test('resolveRegion: 繁体/历史别名（如 me-saudi-arabia / 美西 / 美东 / 自动驾驶）', () => {
  assert.equal(resolveRegion('me-saudi-arabia'), 'me-riyadh')
  assert.equal(resolveRegion('美西'), 'na-siliconvalley')
  assert.equal(resolveRegion('美东'), 'na-ashburn')
  assert.equal(resolveRegion('自动驾驶'), 'ap-shanghai-adc')
  assert.equal(resolveRegion('沙特'), 'me-riyadh')
})

test('resolveRegion: unknown 与空输入返回 undefined', () => {
  assert.equal(resolveRegion('unknown'), undefined)
  assert.equal(resolveRegion('no-such-region'), undefined)
  assert.equal(resolveRegion(''), undefined)
  assert.equal(resolveRegion('   '), undefined)
  assert.equal(resolveRegion(undefined), undefined)
})

test('resolveRegion: 「全地域」不命中任何具体地域(占位项已移除)', () => {
  assert.equal(resolveRegion('全地域'), undefined)
})

test('resolveRegion: FSI 金融区别名命中(对齐 COS 历史)', () => {
  assert.equal(resolveRegion('sh-fsi'), 'ap-shanghai-fsi')
  assert.equal(resolveRegion('shanghai-fsi'), 'ap-shanghai-fsi')
  assert.equal(resolveRegion('bj-fsi'), 'ap-beijing-fsi')
  assert.equal(resolveRegion('sz-fsi'), 'ap-shenzhen-fsi')
})

// —— g2.4: 现有 CLS / COS / DBbrain 别名无回归 ——

test('resolveRegion: 原 CLS_REGIONS 23 项 id 全命中', () => {
  for (const row of CLS_REGIONS) {
    assert.equal(resolveRegion(row.id), row.id, `CLS_REGIONS ${row.id}`)
  }
})

test('resolveRegion: 原 COS_REGIONS 全部 aliases 无回归', () => {
  for (const row of COS_REGIONS) {
    for (const alias of [row.id, row.label, ...(row.aliases || [])]) {
      // 部分 alias (e.g. "id"=印尼) 现与新增「雅加达」对齐,仍应命中雅加达
      const resolved = resolveRegion(String(alias))
      assert.ok(resolved, `COS_REGIONS alias "${alias}" for ${row.id} 命中失败`)
    }
  }
  // 抽样断言仍然回到原 id:
  assert.equal(resolveRegion('gz'), 'ap-guangzhou')
  assert.equal(resolveRegion('guangzhou'), 'ap-guangzhou')
  assert.equal(resolveRegion('canton'), 'ap-guangzhou')
  assert.equal(resolveRegion('pek'), 'ap-beijing')
  assert.equal(resolveRegion('beijing'), 'ap-beijing')
  assert.equal(resolveRegion('shanghai'), 'ap-shanghai')
  assert.equal(resolveRegion('hongkong'), 'ap-hongkong')
  assert.equal(resolveRegion('hong kong'), 'ap-hongkong')
  assert.equal(resolveRegion('usw'), 'na-siliconvalley')
  assert.equal(resolveRegion('use'), 'na-ashburn')
  assert.equal(resolveRegion('mumbai'), 'ap-mumbai')
  assert.equal(resolveRegion('toronto'), 'na-toronto')
  assert.equal(resolveRegion('rio'), undefined) // sao paulo 里没有 rio 别名,未来 sync 可加
})

test('resolveRegion: 共享 source 中 group 分布(确保 CLS 分组口径仍可用)', () => {
  const groups = new Set(TENCENT_REGIONS.map((row) => row.group))
  for (const group of ['大陆', '港澳台', '海外', '金融', '特殊'] as const) {
    assert.ok(groups.has(group), `缺少 group=${group}`)
  }
  // DBbrain 排除「特殊」之外的 region,分组分布应仍可被分发出来
  assert.ok(regionsFor('dbbrain').length > 0)
  assert.ok(regionsFor('dbbrain').every((row) => row.group !== '特殊' || row.id === 'ap-shanghai-adc'))
})

// —— g1.4: 各产品原 API 共享同一份 source ——

test('CLS_REGIONS 是共享 TENCENT_REGIONS 的 id/label/group 投影', () => {
  assert.equal(CLS_REGIONS.length, TENCENT_REGIONS.length)
  for (const cls of CLS_REGIONS) {
    const shared = TENCENT_REGIONS.find((row) => row.id === cls.id)
    assert.ok(shared, `CLS_REGIONS ${cls.id} 缺共享对齐`)
    assert.equal(cls.name, shared.label)
    assert.equal(cls.group, shared.group)
  }
})

test('COS_REGIONS 与共享 TENCENT_REGIONS id 集合一致', () => {
  const sharedIds = new Set(TENCENT_REGIONS.map((row) => row.id))
  for (const cos of COS_REGIONS) {
    assert.ok(sharedIds.has(cos.id), `COS_REGIONS ${cos.id} 不在共享 source`)
  }
})

test('DBBRAIN_REGIONS 不含「全地域」空 id 项,默认广州', () => {
  const empty = DBBRAIN_REGIONS.find((row) => !row.id)
  assert.equal(empty, undefined, 'DBBRAIN_REGIONS 不允许 id=\'\' 的「全地域」')
  assert.equal(DEFAULT_REGION, 'ap-guangzhou')
  assert.ok(DBBRAIN_REGIONS.some((row) => row.id === 'ap-guangzhou'))
})

// —— g2.2: 老 API 委托,签名兼容 ——

test('resolveClsRegion / resolveCosRegion 内部走共享 resolveRegion,命名一致', () => {
  assert.equal(resolveClsRegion('gz'), 'ap-guangzhou')
  assert.equal(resolveClsRegion('北京'), 'ap-beijing')
  assert.equal(resolveClsRegion(''), DEFAULT_REGION)
  assert.equal(resolveClsRegion('not-a-region'), DEFAULT_REGION) // sofa 兼容: 旧版也走 default
  const cosGz = resolveCosRegion('gz')
  assert.equal(cosGz?.id, 'ap-guangzhou')
  assert.equal(cosGz?.label, '广州')
  // cls 版 label 从 group 视图取到了中文:
  assert.equal(regionLabel('ap-hongkong'), '中国香港')
})

// —— g2.4 / 边界: parseRegionHint 与 regionGroups 正常运作 ——

test('parseRegionHint 在文本中命中 alias,返回剩余文本', () => {
  const hit = parseRegionHint('北京的 CLS')
  assert.equal(hit.region, 'ap-beijing')
  assert.ok(!/北京/.test(hit.rest))
  const gzHit = parseRegionHint('帮忙查一下广州 CLS 的日志主题')
  assert.equal(gzHit.region, 'ap-guangzhou')
})

test('parseRegionHint: 英文/拼音 alias 不参与自由文本子串命中(英文查询回归防护)', () => {
  // 评审回归: "show me logs" 含 "sh"(上海)、 "india" 既含 "in" 又是孟买完整 alias,均不得啃查询词。
  for (const query of [
    'show me logs',
    'india logs',
    'find the error',     // 含 "th"(曼谷)
    'get identity',       // 含 "id"(雅加达)
    'error code de',      // 含 "de"(法兰克福)
    'ca bundle issue',    // 含 "ca"(多伦多)
    'use the tokyo api',  // use(弗吉尼亚)/tokyo(东京) 同为单词型 alias,不参与
  ]) {
    const hit = parseRegionHint(query)
    assert.equal(hit.region, undefined, `「${query}」不应命中任何地域`)
    assert.equal(hit.rest, query, `「${query}」的 rest 应保持原文不变`)
  }
  // 英文 alias 仍可通过 resolveRegion 精确匹配(语义区分: 精确 vs 自由文本抽取)
  assert.equal(resolveRegion('sh'), 'ap-shanghai')
  assert.equal(resolveRegion('gz'), 'ap-guangzhou')
  assert.equal(resolveRegion('tokyo'), 'ap-tokyo')
  // 中文别名与完整 region id 仍参与自由文本抽取
  assert.equal(parseRegionHint('帮忙查一下上海 CLS 的日志').region, 'ap-shanghai')
  assert.equal(parseRegionHint('查 ap-guangzhou 的日志').region, 'ap-guangzhou')
})

test('regionGroups 按 CLS 分组顺序返回,不出现空分组', () => {
  const groups = regionGroups()
  assert.deepEqual(groups.map((row) => row.group), ['大陆', '港澳台', '海外', '金融', '特殊'])
  for (const row of groups) assert.ok(row.items.length > 0, row.group)
})

test('detectAliasConflicts: 正常数据源无冲突;冲突场景 sync 脚本应报错', () => {
  const clean = detectAliasConflicts(TENCENT_REGIONS)
  assert.equal(clean.length, 0, `TENCENT_REGIONS 应按设计无冲突: ${JSON.stringify(clean)}`)
  // 构造一个 id 相同但 alias 冲突的 case:
  const conflict = detectAliasConflicts([
    { id: 'a', label: 'A', group: '海外', aliases: ['x'] },
    { id: 'b', label: 'B', group: '海外', aliases: ['X'] },
  ])
  assert.equal(conflict.length, 1)
  assert.equal(conflict[0].alias, 'x')
})
