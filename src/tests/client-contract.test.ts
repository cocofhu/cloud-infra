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

test('cdb conversation UI uses official login/manage and 11 tabs g1-g3', () => {
  const client = read('src/client.js')
  assert.match(client, /const CDB_OFFICIAL_TABS = \[/)
  for (const tab of ['实例详情', '实例监控', '账号管理', '数据库管理', '安全组', '备份恢复', '日志中心', '只读实例', '数据库代理', '数据安全', '连接检查']) {
    assert.match(client, new RegExp(tab))
  }
  assert.match(client, /登录/)
  assert.match(client, /管理/)
  assert.match(client, /实例 ID \/ 实例名 \/ 内网 IP/)
  assert.match(client, /全部地域/)
  assert.match(client, /登录数据库（DMC）/)
  assert.match(client, /数据库类型/)
  assert.match(client, /密码登录/)
  assert.match(client, /SQL 窗口/)
  assert.match(client, /kind === "cdb"/)
  assert.match(client, /const CDB_TAB_GROUPS/)
  assert.match(client, /function cdbTabGroup/)
  assert.match(client, /className: "ci-subnav"/)
  assert.doesNotMatch(client, /CDB_OFFICIAL_TABS[\s\S]{0,500}在线查询/)
  assert.doesNotMatch(client, /CDB_OFFICIAL_TABS[\s\S]{0,500}慢查询/)
  assert.doesNotMatch(client, /if\s*\(.*===\s*['"]tencent['"]/)
})

test('settings card still has no region or db account fields g4.1', () => {
  const client = read('src/client.js')
  const start = client.indexOf('function ConfigCard')
  const end = client.indexOf('const inject')
  const settings = client.slice(start, end)
  assert.match(settings, /provider\.fields/)
  assert.doesNotMatch(settings, /库账号|库密码|DMC/)
  assert.doesNotMatch(settings, /placeholder: "ap-/)
  assert.match(client, /腾讯云 CDB|matchModule/)
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

test('cdb review fixes: WAN DMC, destroy protect toggle, project form, destructive SQL', () => {
  const client = read('src/client.js')
  assert.match(client, /function pickDmcEndpoint/)
  assert.match(client, /function isDestructiveSql/)
  assert.match(client, /关闭实例销毁保护/)
  assert.match(client, /开启实例销毁保护/)
  assert.match(client, /setListForm/)
  assert.match(client, /SqlText/)
  assert.match(client, /auditOpened/)
  assert.match(client, /未开外网时需插件主机可达内网/)
  assert.match(client, /skip && !always/)
  assert.doesNotMatch(client, /if \(skip && action !== "dmc\.row\.write"\)/)
  assert.match(client, /onClick: \(\) => onReload\(tab\) \}, "重新检查"\)/)
  assert.match(client, /tabData\.slowLogError/)
  assert.match(client, /const body = !detail \? null : \(\(\) =>/)
  assert.match(client, /loading: true, tab: nextTab/)
  assert.match(client, /加载中…/)
})
