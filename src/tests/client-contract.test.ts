import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { COS_REGIONS } from '../providers/tencent/cos-regions.js'

const dir = dirname(fileURLToPath(import.meta.url))
const root = join(dir, '../..')

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8')
}

test('host and query core do not switch on vendor names', () => {
  const host = read('src/host.ts')
  const query = read('src/core/query.ts')
  assert.doesNotMatch(host, /if\s*\(.*provider\s*===\s*['"]tencent['"]/)
  assert.doesNotMatch(host, /if\s*\(.*provider\s*===\s*['"]aliyun['"]/)
  assert.doesNotMatch(query, /tencent\s*\|\s*aliyun/)
  assert.match(host, /settings\.register\('cloud-infra'/)
  assert.match(host, /cloud_infra_query/)
  assert.match(host, /kind=cos/)
  assert.match(host, /OMIT region/)
  assert.match(host, /Never use Ask question/)
  assert.match(host, /still call kind=cos and omit region/)
  assert.doesNotMatch(host, /Do not call kind=cos without/)
  assert.doesNotMatch(host, /MUST pass a valid official region/)
  assert.doesNotMatch(host, /Required for kind=cos/)
  assert.match(query, /region: input\.region/)
  const writeAt = host.indexOf('writeOverlay(cfg)')
  const saveAt = host.indexOf('if (body.save)')
  assert.ok(writeAt > 0 && saveAt > 0 && writeAt > saveAt)
  assert.equal(host.split('writeOverlay(cfg)').length - 1, 1)
})

test('client settings card is schema-driven and uses key cloud-infra', () => {
  const client = read('src/client.js')
  assert.match(client, /key:\s*"cloud-infra"/)
  assert.match(client, /provider\.fields/)
  assert.doesNotMatch(client, /if\s*\(.*===\s*['"]tencent['"]/)
  assert.match(client, /confirm === "always"/)
  assert.match(client, /ci-row/)
  assert.match(client, /item\.columns/)
  assert.match(client, /上一页/)
  assert.match(client, /请输入域名关键字/)
})

test('product module list is a vertical checkbox stack with truncated titles', () => {
  const client = read('src/client.js')
  assert.match(client, /"产品模块"/)
  assert.match(client, /className: "ci-cfg-mod-row"/)
  assert.match(client, /\.ci-cfg-mod-row\{display:flex;align-items:center/)
  assert.match(client, /\.ci-cfg-mod-title\{overflow:hidden;text-overflow:ellipsis;white-space:nowrap/)
  assert.match(client, /draft\.modules\[module\.id\] !== false/)
  assert.match(client, /module\.title \|\| module\.id/)
  assert.doesNotMatch(client, /className: "ci-cfg-src"[\s\S]{0,120}modules\.map/)
})

test('product module list scrolls inside a max-height box and keeps footer outside', () => {
  const client = read('src/client.js')
  assert.match(client, /\.ci-cfg-mod-list\{max-height:196px;overflow-y:auto/)
  assert.doesNotMatch(client, /\.ci-cfg-mod-list\{[^}]*min-height/)
  assert.doesNotMatch(client, /\.ci-cfg-mod-list\{[^}]*overflow-y:scroll/)
  const listAt = client.indexOf('className: "ci-cfg-mod-list"')
  const footAt = client.indexOf('className: "ci-cfg-ft"')
  assert.ok(listAt > 0 && footAt > listAt, 'footer stays after the module list')
  assert.match(client, /放弃修改/)
  assert.match(client, /className: "ci-cfg-save"/)
  assert.match(client, /setDraft\(saved\)/)
})

test('product module filter is local and does not clear checked draft.modules', () => {
  const client = read('src/client.js')
  assert.match(client, /className: "ci-cfg-mod-q"/)
  assert.match(client, /placeholder: "筛选模块名称"/)
  assert.match(client, /onChange: \(e\) => setModQ\(e\.target\.value\)/)
  assert.match(client, /没有匹配的模块/)
  assert.match(client, /已启用 \$\{enabledModCount\} \/ \$\{modules\.length\}/)
  assert.match(client, /筛选中/)
  assert.match(client, /function matchModule/)
  assert.match(client, /title\.includes\(needle\) \|\| id\.includes\(needle\)/)
  const filterChange = client.slice(client.indexOf('placeholder: "筛选模块名称"'), client.indexOf('className: "ci-cfg-mod-list"'))
  assert.doesNotMatch(filterChange, /api\(/)
})

test('matchModule filters by title or id without dropping other checked modules', () => {
  const src = read('src/client.js')
  const start = src.indexOf('function matchModule')
  assert.ok(start >= 0)
  const end = src.indexOf('\n    function configToDraft', start)
  const fn = new Function('module', 'q', `${src.slice(start, end)}\nreturn matchModule(module, q)`) as (
    module: { id: string; title?: string },
    q: string,
  ) => boolean
  assert.equal(fn({ id: 'tencent.domain', title: '腾讯云域名' }, ''), true)
  assert.equal(fn({ id: 'tencent.domain', title: '腾讯云域名' }, '域名'), true)
  assert.equal(fn({ id: 'tencent.domain', title: '腾讯云域名' }, 'TENCENT'), true)
  assert.equal(fn({ id: 'aliyun.dns', title: '阿里云解析' }, '域名'), false)
  assert.equal(fn({ id: 'aliyun.dns', title: '阿里云解析' }, '   '), true)
})

test('config contract stays modules Record and hides unimplemented entries', () => {
  const client = read('src/client.js')
  const host = read('src/host.ts')
  const store = read('src/core/config-store.ts')
  assert.match(client, /key:\s*"cloud-infra"/)
  assert.match(client, /m\.implemented !== false/)
  assert.match(client, /modules: draft\.modules/)
  assert.match(client, /modules\.length \? h\("div"/)
  assert.match(host, /settings\.register\('cloud-infra'/)
  assert.match(store, /modules: Record<string, boolean>/)
  assert.doesNotMatch(client, /if\s*\(.*===\s*['"]tencent['"]/)
})

test('settings card save/discard and single-or-many module cases stay wired', () => {
  const client = read('src/client.js')
  assert.match(client, /disabled: !dirty \|\| saving/)
  assert.match(client, /onClick: \(\) => setDraft\(saved\)/)
  assert.match(client, /onClick: save/)
  assert.match(client, /visibleModules\.map/)
  assert.match(client, /checked: draft\.modules\[module\.id\] !== false/)
  const listRule = client.match(/\.ci-cfg-mod-list\{[^}]+\}/)?.[0] || ''
  assert.match(listRule, /max-height:196px/)
  assert.doesNotMatch(listRule.replace(/max-height:\d+px/g, ''), /height:\d+px/)
  assert.doesNotMatch(listRule, /min-height/)
})

test('g1 client uses official DSH tokens without typo or light hex fills', () => {
  const client = read('src/client.js')
  assert.match(client, /--dsw-alias-brand-primary[);,\s]/)
  assert.match(client, /--dsw-alias-button-primary-fill/)
  assert.match(client, /--dsw-alias-state-success-primary/)
  assert.match(client, /--dsw-alias-state-warn-label/)
  assert.match(client, /--dsw-alias-state-error-primary/)
  assert.doesNotMatch(client, /brand-primary-new-colorprimary-new-color/)
  assert.doesNotMatch(client, /#2563eb|#fff\b|#ffffff\b/)
})

test('g2-g3 list chrome and in-card DetailView replace fullscreen drawer', () => {
  const client = read('src/client.js')
  assert.match(client, /域名解析/)
  assert.match(client, /ci-bar-count/)
  assert.match(client, /没有匹配「/)
  assert.match(client, /加载列表/)
  assert.match(client, /function DetailView/)
  assert.match(client, /ci-crumb/)
  assert.match(client, /ci-back/)
  assert.match(client, /返回/)
  assert.match(client, /加载详情/)
  assert.match(client, /没有解析记录/)
  assert.match(client, /onBack:\s*\(\)\s*=>\s*setSession\(null\)/)
  assert.doesNotMatch(client, /ci-overlay|ci-drawer|function Drawer\b/)
  assert.doesNotMatch(client, /2147483|86vh/)
})

test('g3 COS console two pages use region combo and file list, not an expand tree', () => {
  const client = read('src/client.js')
  const host = read('src/host.ts')
  const readme = read('README.md')
  assert.match(client, /function CosConsoleView/)
  assert.match(client, /function CosRegionCombo/)
  assert.match(client, /function CosBucketTable/)
  assert.match(client, /function CosFileTable/)
  assert.match(client, /请输入并选择地域/)
  assert.match(client, /DEFAULT_COS_REGION_ID = "ap-guangzhou"/)
  assert.match(client, /function defaultCosRegion/)
  assert.match(client, /useState\(\(\) => defaultCosRegion/)
  assert.match(client, /comboNeedle/)
  assert.match(client, /创建存储桶/)
  assert.match(client, /请输入存储桶名称/)
  assert.match(client, /"名称"/)
  assert.match(client, /"访问权限"/)
  assert.match(client, /上传文件/)
  assert.match(client, /创建文件夹/)
  assert.match(client, /搜索文件名/)
  assert.match(client, /"文件名"/)
  assert.match(client, /"存储类型"/)
  assert.match(client, /"最后修改时间"/)
  assert.match(client, /复制临时链接/)
  assert.match(client, /kind === "cos"/)
  assert.match(client, /id: "ci-cos-region"/)
  assert.match(client, /htmlFor: "ci-cos-region"/)
  assert.match(client, /prefixCrumbs/)
  assert.doesNotMatch(client, /function CosTree\b|ci-tree-expand|展开全部/)
  assert.doesNotMatch(client, /if\s*\(.*===\s*['"]tencent['"]/)
  assert.match(host, /对象存储/)
  assert.match(host, /defaults #ci-cos-region to 广州/)
  assert.match(host, /stays selectable/)
  assert.doesNotMatch(host, /对象存储 · 请选择地域/)
  assert.match(host, /needsRegion/)
  assert.match(readme, /可以不带 region/)
  assert.match(readme, /默认选中广州/)
  assert.match(readme, /禁止用 Ask question/)
  assert.match(readme, /加载更多/)
  assert.match(readme, /设置 → 插件 → 云资源/)
  assert.match(readme, /x-cos-copy-source/)
  assert.match(client, /加载更多/)
  assert.match(client, /仅搜索已加载的文件/)
  assert.match(client, /id: "ci-cos-load-more"/)
  assert.match(client, /id: "ci-cos-cred-err"/)
  assert.match(client, /result\.errors/)
  assert.match(client, /function formatFileTime/)
  assert.match(client, /na-siliconvalley/)
  assert.match(client, /eu-frankfurt/)
  assert.match(client, /ap-beijing-fsi/)
  assert.match(client, /setTimeout\(\(\) => fetchBuckets/)
  assert.match(client, /id: "ci-cos-presign-url"/)
  assert.match(client, /readOnly: true/)
  assert.match(client, /剪贴板不可用/)
  assert.match(client, /stat\.copied === false && stat\.expiresSec/)
  assert.match(client, /function isPresignStat/)
  assert.match(client, /function detailStatRows/)
  assert.match(client, /stat\.address/)
  assert.doesNotMatch(client, /stat\.url && !stat\.copied/)
  assert.match(client, /fileSeq/)
  assert.match(client, /if \(n !== fileSeq\.current\) return/)
  assert.match(client, /withoutAp\.replace\(\/-\/g, ""\)/)
  assert.match(client, /列表已截断，但未返回下一页标记/)
  assert.match(host, /对象存储 · 请先配置凭证/)
})

test('g3.2 object.stat modal is not the presign clipboard-fail dialog', () => {
  const src = read('src/client.js')
  const start = src.indexOf('function isPresignStat')
  const end = src.indexOf('\n    function matchCosRegion', start)
  assert.ok(start >= 0 && end > start)
  const helpers = new Function(`
    ${src.slice(start, end)}
    return { isPresignStat, detailStatRows };
  `)() as {
    isPresignStat: (stat: unknown) => boolean
    detailStatRows: (stat: unknown) => Array<[string, unknown]>
  }
  const stat = {
    name: 'readme.txt',
    sizeLabel: '10 B',
    storageClass: '标准存储',
    lastModified: '2025-02-01 00:00:00',
    address: 'https://assets-1250000000.cos.ap-guangzhou.myqcloud.com/readme.txt',
    url: 'https://assets-1250000000.cos.ap-guangzhou.myqcloud.com/readme.txt',
  }
  assert.equal(helpers.isPresignStat(stat), false)
  const rows = helpers.detailStatRows(stat)
  assert.deepEqual(rows.map((row) => row[0]), ['名称', '大小', '存储类型', '修改时间', '对象地址'])
  assert.equal(rows[0][1], 'readme.txt')
  assert.equal(rows[1][1], '10 B')
  assert.doesNotMatch(JSON.stringify(rows), /剪贴板不可用/)
  const presignFail = { url: 'https://signed.example/tmp', copied: false, expiresSec: 900 }
  assert.equal(helpers.isPresignStat(presignFail), true)
  assert.deepEqual(helpers.detailStatRows(presignFail), [])
})

test('g3.1 client region fallback ids and compact tokens stay aligned with COS_REGIONS', () => {
  const client = read('src/client.js')
  for (const region of COS_REGIONS) {
    assert.match(client, new RegExp(`id: "${region.id}"`))
  }
  const start = client.indexOf('function normRegion')
  const end = client.indexOf('\n    function isPresignStat', start)
  const regionTokens = new Function('region', `${client.slice(start, end)}\nreturn regionTokens(region);`) as (
    region: { id: string; label: string; aliases?: string[] },
  ) => string[]
  const tokens = regionTokens({ id: 'ap-beijing-fsi', label: '北京金融', aliases: ['beijing-fsi'] })
  assert.equal(tokens.includes('beijingfsi'), true)
  assert.equal(tokens.includes('ap-beijing-fsi'), true)
})

test('g1.3 settings card fields and layout stay schema-driven without COS extras', () => {
  const client = read('src/client.js')
  const start = client.indexOf('function ConfigCard')
  const end = client.indexOf('const inject = ["slots"]')
  const card = client.slice(start, end)
  assert.match(card, /配置各云厂商 AccessKey，查询域名与解析记录/)
  assert.match(card, /provider\.fields/)
  assert.match(card, /SecretId|field\.label/)
  assert.doesNotMatch(card, /默认地域|defaultRegion|COS 地域/)
  assert.doesNotMatch(card, /创建存储桶|文件列表|CosRegionCombo/)
  assert.match(card, /"产品模块"/)
  assert.match(card, /className: "ci-cfg-mod-list"/)
  assert.match(card, /写操作免确认（删除仍会确认）/)
})

test('g4 lightweight form/confirm overlay and g5 skipConfirm live update', () => {
  const client = read('src/client.js')
  assert.match(client, /min\(400px,100%\)/)
  assert.match(client, /Escape/)
  assert.match(client, /e\.target === e\.currentTarget/)
  assert.match(client, /cloud-infra-config/)
  assert.match(client, /function publicErrorMessage/)
  assert.match(client, /写操作免确认（删除仍会确认）/)
  assert.match(client, /未保存/)
})
