import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

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

test('ConfigCard credential rows share a host-isolated label+input grid (g1.1 g1.2 g1.3)', () => {
  const client = read('src/client.js')
  assert.match(client, /className:\s*"ci-cfg-row"/)
  assert.match(client, /\(provider\.fields\s*\|\|\s*\[\]\)\.map\(\(field\)\s*=>\s*h\("div",\s*\{\s*key:\s*field\.key,\s*className:\s*"ci-cfg-row"/)
  assert.match(client, /className:\s*"ci-cfg-row"[\s\S]{0,120}htmlFor:\s*"ci-max"[\s\S]{0,40}每页条数/)
  assert.match(client, /\.ci-cfg-row\{[^}]*display:grid/)
  assert.match(client, /\.ci-cfg-row\{[^}]*grid-template-columns:9\.5em 1fr/)
  assert.match(client, /\.ci-cfg-row\{[^}]*align-items:center/)
  assert.match(client, /\.ci-cfg-row\{[^}]*box-sizing:border-box/)
  assert.match(client, /\.ci-cfg-row\{[^}]*float:none/)
  assert.match(client, /\.ci-cfg-row\{[^}]*position:static/)
  assert.match(client, /\.ci-cfg-row>label\{[^}]*float:none/)
  assert.match(client, /\.ci-cfg-row>label\{[^}]*position:static/)
  assert.match(client, /\.ci-cfg-row>label\{[^}]*vertical-align:middle/)
  assert.match(client, /\.ci-cfg-row>input\[type=text\][^}]*width:100%/)
  assert.match(client, /\.ci-cfg-row>input\[type=text\][^}]*float:none/)
  assert.match(client, /\.ci-cfg-row>input\[type=text\][^}]*position:static/)
  const card = client.slice(client.indexOf('function ConfigCard()'))
  assert.match(card, /function ConfigCard\(/)
  assert.match(card, /h\("label",\s*\{\s*className:\s*"ci-cfg-src"\s*\},[\s\S]*?checked:\s*bucket\.enabled[\s\S]*?"启用"/)
  assert.doesNotMatch(card, /className:\s*"ci-cfg-row"[\s\S]{0,40}checked:\s*bucket\.enabled/)
  assert.match(card, /h\("label",\s*\{\s*className:\s*"ci-cfg-src"\s*\},[\s\S]*?draft\.skipConfirm[\s\S]*?写操作免确认/)
  assert.doesNotMatch(card, /className:\s*"ci-cfg-row"[\s\S]{0,80}draft\.skipConfirm/)
})

test('ConfigCard save still omits empty secrets so stored keys stay (g2.2)', () => {
  const client = read('src/client.js')
  assert.match(client, /placeholder:\s*bucket\.configured\s*\?\s*"已保存，留空则保持原值"/)
  assert.match(client, /if\s*\(String\(value\s*\|\|\s*""\)\.trim\(\)\)\s*next\[key\]\s*=\s*String\(value\)\.trim\(\)/)
  assert.match(client, /api\("config",\s*\{\s*save:\s*true/)
  assert.match(client, /className:\s*"ci-cfg-disc"/)
  assert.match(client, /className:\s*"ci-cfg-save"/)
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

test('g1.2 g3 image kind renders a chat card with region-first instance wall and search', () => {
  const client = read('src/client.js')
  const host = read('src/host.ts')
  assert.match(host, /kind=image/)
  assert.match(host, /Default kind is domain/)
  assert.match(host, /kind: args\.kind != null \? String\(args\.kind\) : 'domain'/)
  assert.match(host, /resourceKind/)
  assert.match(host, /kind: 'cloud-infra-query'/)
  assert.match(client, /function ImageToolView/)
  assert.match(client, /kind === "image"/)
  assert.match(client, /args\.kind \|\| payload\?\.resourceKind/)
  assert.match(client, /容器镜像/)
  assert.match(client, /当前范围内的实例、仓库与版本/)
  assert.match(client, /"地域"/)
  assert.match(client, /ap-guangzhou/)
  assert.match(client, /ap-shanghai/)
  assert.match(client, /ap-beijing/)
  assert.match(client, /ap-nanjing/)
  assert.match(client, /ap-chengdu/)
  assert.match(client, /搜索实例名称/)
  assert.match(client, /搜索命名空间/)
  assert.match(client, /搜索仓库名称/)
  assert.match(client, /搜索镜像版本/)
  assert.match(client, /className: "ci-grid"/)
  assert.match(client, /className: "ci-ic"/)
  assert.match(client, /镜像仓库/)
  assert.match(client, /版本管理/)
  assert.match(client, /拉取指令/)
  assert.match(client, /DIGEST_WARNING/)
  assert.match(client, /相同镜像 ID（SHA256）/)
  assert.match(client, /docker pull/)
  assert.doesNotMatch(client, /腾讯云控制台站点|整页控制台/)
  assert.match(client, /请输入域名关键字/)
  assert.match(client, /没有解析记录/)
})

test('review v1-v2 pickPayload binds empty image errors and search box stays empty', () => {
  const src = read('src/client.js')
  const start = src.indexOf('function isQueryPayload')
  assert.ok(start >= 0)
  const end = src.indexOf('\n    function ChevronDown', start)
  const fn = new Function('props', `${src.slice(start, end)}\nreturn pickPayload(props)`) as (props: unknown) => {
    items?: unknown[]
    errors?: Array<{ message: string }>
    kind?: string
  } | null
  const emptyImage = fn({
    meta: {
      kind: 'image',
      items: [],
      errors: [{ moduleId: 'tencent.image', message: '腾讯云 未配置 SecretId、SecretKey。请在 设置 → 插件 → 云资源 填写对应云厂商的 AccessKey' }],
      query: '查一下我的镜像',
      region: 'ap-guangzhou',
    },
  })
  assert.ok(emptyImage)
  assert.equal(emptyImage?.items?.length, 0)
  assert.equal(emptyImage?.errors?.length, 1)
  const presented = fn({
    presentationMeta: {
      kind: 'cloud-infra-query',
      resourceKind: 'image',
      items: [],
      errors: [{ message: 'x' }],
    },
  })
  assert.ok(presented)
  assert.equal(presented?.kind, 'cloud-infra-query')
  const imageView = src.slice(src.indexOf('function ImageToolView'))
  assert.match(imageView, /setDraftQ\(""\)/)
  assert.doesNotMatch(imageView.slice(0, imageView.indexOf('const loadInstances')), /setDraftQ\(initialQuery/)
  assert.match(imageView, /query:\s*""/)
  assert.match(imageView, /无法加载实例/)
  assert.match(imageView, /className: "ci-err"/)
  assert.match(src, /仅显示前 100 条/)
  assert.match(src, /"Tag 数"/)
  assert.match(src, /"创建时间"/)
  assert.match(src, /"更新时间"/)
})

test('g3.3 instance h3 uses dual-theme title color and ConfigCard stays unchanged', () => {
  const client = read('src/client.js')
  assert.match(client, /\.ci-ic h3\{[^}]*color:var\(--ci-title\)/)
  assert.match(client, /\.ci-ic h3\{[^}]*-webkit-text-fill-color:var\(--ci-title\)/)
  assert.match(client, /html\[data-theme=light\] \.ci-ic h3\{color:#0f1419;-webkit-text-fill-color:#0f1419\}/)
  assert.match(client, /html\[data-theme=dark\] \.ci-ic h3\{color:#f7f8fb;-webkit-text-fill-color:#f7f8fb\}/)
  assert.match(client, /--ci-title:var\(--dsw-alias-label-primary,#0f1419\)/)
  const card = client.slice(client.indexOf('function ConfigCard()'))
  assert.match(card, /function ConfigCard\(/)
  assert.match(card, /查询域名与解析记录/)
  assert.match(card, /key:\s*"cloud-infra"/)
  assert.match(card, /写操作免确认（删除仍会确认）/)
  assert.doesNotMatch(card, /ap-guangzhou/)
  assert.doesNotMatch(card, /个人版实例/)
  const provider = read('src/providers/tencent/index.ts')
  assert.match(provider, /products\/image/)
  assert.match(provider, /key: 'secretId'/)
  assert.match(provider, /key: 'secretKey'/)
  assert.doesNotMatch(provider, /region/)
})

test('g4.3 README documents chat card, region-first and TCR CAM', () => {
  const readme = read('README.md')
  assert.match(readme, /容器镜像卡片/)
  assert.match(readme, /先选地域/)
  assert.match(readme, /kind=image/)
  assert.match(readme, /个人版实例只出现在广州/)
  assert.match(readme, /同 Digest/)
  assert.match(readme, /不在设置页增加地域/)
})
