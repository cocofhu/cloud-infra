import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
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

test('client.js parses so DSH can load 我的证书 card', () => {
  const check = spawnSync(process.execPath, ['--check', join(root, 'src/client.js')], { encoding: 'utf8' })
  assert.equal(check.status, 0, check.stderr || check.stdout || 'node --check src/client.js failed')
  const client = read('src/client.js')
  const verify = client.slice(client.indexOf('function VerifyCertDialog'), client.indexOf('function UploadCertDialog'))
  assert.match(verify, /查看验证状态/)
  assert.match(verify, /document\.body\);\s*\}\s*$/)
  assert.doesNotMatch(verify, /document\.body\);\s*\}\s+\),/)
})

test('conversation card clones 我的证书 while ConfigCard stays frozen', () => {
  const client = read('src/client.js')
  const host = read('src/host.ts')
  assert.match(client, /我的证书/)
  assert.match(client, /申请免费证书/)
  assert.match(client, /上传证书/)
  assert.match(client, /证书详情/)
  assert.match(client, /function CertTable/)
  assert.match(client, /function CertDetailView/)
  assert.match(client, /基本信息/)
  assert.match(client, /域名验证/)
  assert.match(client, /证书链摘要/)
  assert.match(client, /关联云资源/)
  assert.match(client, /function triggerDownload/)
  assert.match(client, /国密 SM2/)
  assert.match(client, /搜索证书 ID \/ 备注 \/ 域名/)
  assert.match(host, /kind=cert/)
  assert.match(host, /查证书必须传 kind=cert/)
  assert.match(host, /未传 kind 仍默认 domain/)
  const cardStart = client.indexOf('function ConfigCard()')
  const cardEnd = client.indexOf('const inject = ["slots"]')
  const card = client.slice(cardStart, cardEnd)
  assert.ok(cardStart > 0 && cardEnd > cardStart)
  assert.doesNotMatch(card, /申请免费证书|上传证书|我的证书|CertTable|证书详情/)
  const handle = host.slice(host.indexOf('export async function handleApi'), host.indexOf('async function runDetail'))
  const queryBlock = handle.slice(handle.indexOf("if (method === 'query')"), handle.indexOf("if (method === 'detail')"))
  const detailBlock = handle.slice(handle.indexOf("if (method === 'detail')"), handle.indexOf("if (method === 'action')"))
  const actionBlock = handle.slice(handle.indexOf("if (method === 'action')"))
  assert.doesNotMatch(queryBlock, /writeOverlay|assignConfig/)
  assert.doesNotMatch(detailBlock, /writeOverlay|assignConfig/)
  assert.doesNotMatch(actionBlock, /writeOverlay|assignConfig/)
})

test('empty cert query still paints 我的证书 card and pickPayload keeps resourceKind', () => {
  const client = read('src/client.js')
  const host = read('src/host.ts')
  assert.match(host, /kind: 'cloud-infra-query'/)
  assert.match(host, /resourceKind:/)
  assert.doesNotMatch(host, /kind: 'cloud-infra-query', \.\.\.\(value/)
  assert.match(client, /function isCloudInfraPayload/)
  assert.match(client, /if \(!isCert && !fromTool/)
  assert.match(client, /function VerifyCertDialog/)
  assert.match(client, /查看验证状态/)
  assert.match(client, /完成审核/)
  assert.match(client, /completeIfManual: true/)
  const start = client.indexOf('function isCloudInfraPayload')
  const end = client.indexOf('\n    function ChevronDown', start)
  const pick = new Function('props', `${client.slice(start, end)}\nreturn pickPayload(props)`) as (props: unknown) => {
    resourceKind?: string
    items?: unknown[]
    kind?: string
  } | null
  const empty = pick({
    presentationMeta: {
      kind: 'cloud-infra-query',
      resourceKind: 'cert',
      items: [],
      errors: [{ moduleId: 'tencent.cert', message: '未配置 SecretId' }],
      query: '',
    },
  })
  assert.ok(empty)
  assert.equal(empty?.resourceKind, 'cert')
  assert.equal(empty?.items?.length, 0)
  const legacyEmpty = pick({
    kind: 'cert',
    items: [],
    errors: [{ moduleId: 'tencent.cert', message: '未配置 SecretId' }],
  })
  assert.ok(legacyEmpty)
  assert.equal(legacyEmpty?.kind, 'cert')
  const ops = client.slice(client.indexOf('function CertOps'), client.indexOf('function CertTable'))
  assert.match(ops, /部署/)
  assert.match(ops, /下载/)
  assert.match(ops, /MoreMenu/)
  assert.doesNotMatch(ops, /"详情"/)
  const more = client.slice(client.indexOf('function MoreMenu'), client.indexOf('function CertOps'))
  assert.match(more, /cert\.verify/)
  assert.match(more, /cancelable/)
  assert.match(more, /else \{\s*items\.push\(\{ id: "cert\.delete"/)
  const dl = client.slice(client.indexOf('function triggerDownload'), client.indexOf('\n    function FieldInput'))
  assert.match(dl, /if \(\/-----BEGIN \/i\.test\(raw\)\) throw/)
  assert.match(dl, /不支持明文下发/)
  assert.doesNotMatch(dl, /if \(!content \|\| \/-----BEGIN/)
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
