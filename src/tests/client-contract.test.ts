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

test('cvm and lighthouse consoles use two skins and console Chinese status', () => {
  const client = read('src/client.js')
  assert.match(client, /function CvmConsole/)
  assert.match(client, /function LhConsole/)
  assert.match(client, /function InstanceDetailView/)
  assert.match(client, /function MoreMenu/)
  assert.match(client, /ID\/名称/)
  assert.match(client, /主IPv4地址/)
  assert.match(client, /可用区/)
  assert.match(client, /实例类型/)
  assert.match(client, /实例配置/)
  assert.match(client, /实例计费模式/)
  assert.match(client, /华南地区（广州）/)
  assert.match(client, /function RegionSelect/)
  assert.match(client, /function KindTabs/)
  assert.match(client, /全部地域/)
  assert.match(client, /云服务器/)
  assert.match(client, /轻量应用服务器/)
  assert.match(client, /搜索 ID \/ 名称 \/ IP/)
  assert.doesNotMatch(client, /卡片视图/)
  assert.doesNotMatch(client, /function RegionTabs/)
  assert.match(client, /运行中/)
  assert.match(client, /已关机/)
  assert.match(client, /"更多"/)
  assert.match(client, /instance\.start/)
  assert.match(client, /instance\.stop/)
  assert.match(client, /instance\.reboot/)
  assert.match(client, /kind === "cvm"/)
  assert.match(client, /kind === "lighthouse"/)
  assert.match(client, /kind === "auto"/)
  assert.match(client, /ci-dense/)
  assert.match(client, /min-width:980px/)
  assert.match(client, /\.ci-select\{[^}]*max-width:180px/)
  assert.match(client, /region: listRegion/)
  assert.match(client, /onQuery: onDraft/)
  const toolStart = client.indexOf('function SearchToolView')
  const toolEnd = client.indexOf('function matchModule', toolStart)
  const tool = client.slice(toolStart, toolEnd)
  assert.match(tool, /h\(KindTabs/)
  assert.match(tool, /h\(Pager/)
  assert.match(tool, /region: useRegion/)
  assert.match(tool, /trimmed \? "all"/)
  assert.match(tool, /kind === "auto"/)
  assert.match(tool, /kind !== "auto"/)
  assert.match(tool, /tabToKind/)
  assert.match(tool, /kind: nextKind/)
  assert.match(tool, /onChange: \(next\)/)
  assert.match(tool, /usableInstanceQuery/)
  assert.match(client, /function usableInstanceQuery/)
  assert.match(tool, /华南地区（广州）/)
  assert.match(tool, /onSubmit: runSearch/)
  assert.match(tool, /setTimeout\(\(\) => runSearch\(value\), 800\)/)
  assert.match(client, /function SearchField/)
  assert.match(client, /function ListPane/)
  assert.match(client, /ci-list-mask/)
  assert.doesNotMatch(tool, /showDomain = kind === "domain" \|\| \(!showCvm && !showLh\)/)
})

test('instance detail uses official groups and never renders DNS records', () => {
  const client = read('src/client.js')
  const start = client.indexOf('function InstanceDetailView')
  const end = client.indexOf('function SearchToolView', start)
  assert.ok(start > 0 && end > start)
  const body = client.slice(start, end)
  assert.match(body, /h\(ChevronLeft/)
  assert.match(body, /aria-label": "返回"/)
  assert.doesNotMatch(body, /返回实例列表/)
  assert.match(body, /detail\?\.groups/)
  assert.match(body, /开机/)
  assert.match(body, /关机/)
  assert.match(body, /重启/)
  assert.doesNotMatch(body, /解析记录/)
  assert.doesNotMatch(body, /添加记录/)
  assert.doesNotMatch(body, /ci-chips/)
})

test('settings card still has no region picker or power buttons', () => {
  const client = read('src/client.js')
  const start = client.indexOf('function ConfigCard')
  assert.ok(start > 0)
  const body = client.slice(start)
  assert.match(body, /产品模块/)
  assert.match(body, /SecretId|provider\.fields/)
  assert.doesNotMatch(body, /全部地域/)
  assert.doesNotMatch(body, /instance\.start/)
  assert.doesNotMatch(body, /卡片视图/)
  assert.doesNotMatch(body, /开机/)
  assert.doesNotMatch(body, /地域多选/)
})

test('instancePower and matchLocalInstance cover console states and IP search', () => {
  const src = read('src/client.js')
  const powerStart = src.indexOf('function instancePower')
  const powerEnd = src.indexOf('\n    function groupByRegion', powerStart)
  const power = new Function('item', `${src.slice(powerStart, powerEnd)}\nreturn instancePower(item)`) as (item: {
    status?: string
    stateLabel?: string
  }) => { start: boolean; stop: boolean; reboot: boolean }
  assert.deepEqual(power({ stateLabel: '运行中', status: 'enable' }), { start: true, stop: false, reboot: false })
  assert.deepEqual(power({ stateLabel: '已关机', status: 'pause' }), { start: false, stop: true, reboot: true })
  assert.deepEqual(power({ stateLabel: '开机中', status: 'unknown' }), { start: true, stop: true, reboot: true })
  const matchStart = src.indexOf('function matchLocalInstance')
  const matchEnd = src.indexOf('\n    function actionLabel', matchStart)
  const match = new Function('item', 'q', `${src.slice(matchStart, matchEnd)}\nreturn matchLocalInstance(item, q)`) as (
    item: {
      title?: string
      instanceId?: string
      id?: string
      privateIp?: string
      publicIp?: string
      columns?: Array<{ value?: string }>
    },
    q: string,
  ) => boolean
  assert.equal(match({ title: 'api-prod', instanceId: 'ins-8k2m1a', publicIp: '43.138.9.21' }, '43.138'), true)
  assert.equal(match({ title: 'api-prod', instanceId: 'ins-8k2m1a' }, 'lhins-'), false)
  assert.equal(match({
    title: 'unnamed',
    columns: [{ value: '内网：10.0.0.1\n弹性：106.55.252.113' }],
  }, '106.55.252.113'), true)
})

test('host tool kind lists domain lighthouse cvm auto and default stays domain', () => {
  const host = read('src/host.ts')
  assert.match(host, /kind=domain/)
  assert.match(host, /kind=cvm/)
  assert.match(host, /kind=lighthouse/)
  assert.match(host, /kind=auto/)
  assert.match(host, /default domain/)
  assert.match(host, /查一下我的服务器/)
  assert.match(host, /never kind=domain/)
  assert.match(host, /args\.kind != null \? String\(args\.kind\) : 'domain'/)
  assert.match(host, /云服务器 \/ 轻量 \/ CVM \/ 实例/)
  assert.doesNotMatch(host, /if\s*\(.*provider\s*===\s*['"]tencent['"]/)
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
