import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
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

/** 从 src[from] 处那次 h(...) 调用起做括号配平,返回该调用结束的下标(跳过字符串与行注释里的括号)。 */
function balancedEnd(src: string, from: number): number {
  let depth = 0
  let quote = ''
  for (let i = src.indexOf('(', from); i < src.length; i += 1) {
    const c = src[i]
    if (quote) {
      if (c === '\\') i += 1
      else if (c === quote) quote = ''
      continue
    }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if (c === '/' && src[i + 1] === '/') i = src.indexOf('\n', i)
    else if (c === '(') depth += 1
    else if (c === ')' && --depth === 0) return i
  }
  return src.length
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
  assert.match(host, /kind=registrar/)
  assert.match(host, /kind=my-domain/)
  assert.match(host, /do not send them to settings/i)
  assert.match(host, /timeoutMs: Schema.number/)
  assert.match(host, /maxResults: Schema.number/)
  assert.match(host, /skipConfirm: Schema.boolean/)
  assert.doesNotMatch(host, /registrarSearch|domainCart|templateId/)
  assert.match(query, /立即加购/)
  assert.match(query, /我的域名/)
})

test('g3 registrar search / checkout stay on the chat tool card, not SettingsCard', () => {
  const client = read('src/client.js')
  const toolStart = client.indexOf('function searchPlaceholderOf')
  const settingsStart = client.indexOf('function ConfigCard')
  assert.ok(toolStart > 0 && settingsStart > toolStart)
  const tool = client.slice(toolStart, settingsStart)
  const settings = client.slice(settingsStart)
  assert.match(tool, /域名或名称，如 example\.com/)
  assert.match(tool, /请输入域名关键字/)
  assert.match(tool, /立即加购/)
  assert.match(tool, /购物车/)
  // 加购之后必须还有出路:行内能直接移除,列表下沿常驻结算入口(不再靠顶栏那个小链接)
  assert.match(tool, /function CartBar/)
  assert.match(tool, /inCart \? "移除" : "立即加购"/)
  assert.match(tool, /onRemove: removeCart/)
  assert.match(tool, /className: "ci-mini primary", disabled: busy, onClick: onOpen \}, "去结算"/)
  // 加购不再自动弹购物车:连着加几个域名时会被弹窗反复打断
  const addCart = tool.match(/const addCart = \(item\) => \{[\s\S]*?\n      \};/)![0]
  assert.doesNotMatch(addCart, /setFlow/)
  // 补出来的其它后缀单独分一段,别混在精确匹配里
  assert.match(tool, /extraOf\(item, "suggested", false\) === true/)
  assert.match(tool, /className: "ci-subhead" \}, "其他后缀"/)
  // 只有几行且不翻页,不留 160px 高度地板和「共 N 条」页脚
  assert.match(tool, /compact: kind === "registrar"/)
  assert.match(client, /\.ci-list-body\.compact\{min-height:0\}/)
  assert.match(tool, /kind === "registrar"\s*\n\s*\? h\(CartBar/)
  assert.match(tool, /提交订单/)
  assert.match(tool, /核对信息/)
  assert.match(tool, /账户余额支付/)
  assert.match(tool, /将从账户余额扣费/)
  assert.match(tool, /未勾选协议，不能提交订单/)
  assert.match(tool, /基本信息/)
  assert.match(tool, /域名安全/)
  assert.match(tool, /function RegistrarTable/)
  assert.match(tool, /function MyDomainTable/)
  assert.match(tool, /function OwnedDetailView/)
  assert.match(tool, /onChange: \(\) => setDraft\(\{ \.\.\.draft, updateLock: !draft\.updateLock \}\)/)
  assert.match(tool, /onChange: \(\) => setDraft\(\{ \.\.\.draft, transferLock: !draft\.transferLock \}\)/)
  assert.doesNotMatch(tool, /transferLock: draft\.updateLock \? draft\.transferLock : false/)
  assert.doesNotMatch(tool, /disabled: busy \|\| !!draft\.updateLock/)
  assert.match(tool, /disabled: busy \|\| updateLock/)
  assert.match(tool, /h\("div", \{ className: "ci-cell" \}, "状态"\)/)
  assert.doesNotMatch(settings, /立即加购/)
  assert.doesNotMatch(settings, /请输入域名或后缀/)
  assert.doesNotMatch(settings, /账户余额支付/)
  assert.doesNotMatch(settings, /function RegistrarTable/)
  assert.doesNotMatch(client, /save:\s*true[\s\S]{0,80}order\.create/)
  assert.doesNotMatch(client, /if\s*\(.*===\s*['"]tencent['"]/)
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
  assert.equal(fn({ id: 'tencent.domain', title: '腾讯云域名解析' }, ''), true)
  assert.equal(fn({ id: 'tencent.domain', title: '腾讯云域名解析' }, '域名'), true)
  assert.equal(fn({ id: 'tencent.domain', title: '腾讯云域名解析' }, 'TENCENT'), true)
  assert.equal(fn({ id: 'tencent.domain', title: '腾讯云域名解析' }, '解析'), true)
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

test('g6 dbbrain stays in the chat card with type+region filters and tabs (全地域 removed, 默认广州)', () => {
  const client = read('src/client.js')
  assert.match(client, /kind === "dbbrain"/)
  assert.match(client, /实例管理/)
  assert.doesNotMatch(client, /\["", "全地域"\]/)
  assert.match(client, /诊断优化/)
  assert.match(client, /function DbbrainDetailView/)
  assert.match(client, /function DbbrainTable/)
  assert.match(client, /异常诊断/)
  assert.match(client, /内存分析/)
  assert.match(client, /索引推荐/)
  assert.match(client, /session\.kill/)
  assert.match(client, /confirm === "always"/)
  assert.match(client, /实例 ID \/ 名称/)
  assert.match(client, /填写云厂商 AccessKey。地域在对话卡片里选，不写入设置。/)
  assert.match(client, /ap-shanghai-fsi/)
  assert.match(client, /ap-jakarta/)
  assert.match(client, /item\.hasReport/)
  assert.match(client, /canKillSession/)
  assert.match(client, /创建中断任务/)
  assert.match(client, /function DbbrainNav/)
  assert.match(client, /TAB_GROUPS/)
  assert.match(client, /label: "诊断"/)
  assert.match(client, /label: "治理"/)
  assert.match(client, /loading: true/)
  assert.match(client, /加载中…/)
  assert.match(client, /range: ""/)
  assert.match(client, /sessionId: row\.sessionId/)
  assert.doesNotMatch(client, /function hasReportTab/)
  assert.doesNotMatch(client, /sessionId: row\.sessionId,\s*host:/)
  assert.doesNotMatch(client, /ci-sidenav|实例概览|监控告警/)
  assert.doesNotMatch(client, /if\s*\(.*===\s*['"]tencent['"]/)
  const card = client.slice(client.indexOf('function ConfigCard()'))
  assert.doesNotMatch(card, /htmlFor:\s*"ci-.*region"/)
  assert.doesNotMatch(card, /className:\s*"ci-cfg-row"[\s\S]{0,80}地域/)
})

test('client.js parses so DSH can load 我的证书 card', () => {
  const check = spawnSync(process.execPath, ['--check', join(root, 'src/client.js')], { encoding: 'utf8' })
  assert.equal(check.status, 0, check.stderr || check.stdout || 'node --check src/client.js failed')
  const client = read('src/client.js')
  const verify = client.slice(client.indexOf('function VerifyCertDialog'), client.indexOf('function ReplaceCertDialog'))
  assert.match(verify, /查看验证状态/)
  assert.match(verify, /document\.body\);\s*\}\s*$/)
  assert.doesNotMatch(verify, /document\.body\);\s*\}\s+\),/)
  assert.match(client, /function ReplaceCertDialog/)
  assert.match(client, /type: "replace"/)
  assert.match(client, /请确认验证方式/)
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
  assert.match(ops, /CertMoreMenu/)
  assert.doesNotMatch(ops, /"详情"/)
  const more = client.slice(client.indexOf('function CertMoreMenu'), client.indexOf('function CertOps'))
  assert.match(more, /cert\.verify/)
  assert.match(more, /cancelable/)
  assert.match(more, /else \{\s*items\.push\(\{ id: "cert\.delete"/)
  // 证书菜单曾被后声明的同名实例菜单整体顶掉:证书行里冒出「开机/关机/重启」,吊销和删除全没了。
  // 同一作用域内函数声明后者胜,所以这里直接禁掉重名。
  const declared = [...client.matchAll(/^ {4}function ([A-Za-z0-9_]+)/gm)].map((m) => m[1])
  assert.deepEqual(declared.filter((name, i) => declared.indexOf(name) !== i), [])
  const instanceMenu = client.slice(client.indexOf('function InstanceMoreMenu'))
  assert.match(instanceMenu.slice(0, 900), /instance\.(start|stop|reboot)/)
  assert.doesNotMatch(more, /开机|关机|重启/)
  const onMore = client.slice(client.indexOf('const onMore ='), client.indexOf('const onDownload'))
  assert.match(onMore, /cert\.replace/)
  assert.match(onMore, /type: "replace"/)
  assert.doesNotMatch(onMore, /askConfirm\(item, row, "确定重颁发该证书/)
  const dl = client.slice(client.indexOf('function triggerDownload'), client.indexOf('\n    function FieldInput'))
  assert.match(dl, /if \(\/-----BEGIN \/i\.test\(raw\)\) throw/)
  assert.match(dl, /不支持明文下发/)
  assert.doesNotMatch(dl, /if \(!content \|\| \/-----BEGIN/)
  // 兜底链接分支:只认 https,且不能用 a[download](跨域会被忽略),要新标签页交给浏览器
  assert.match(dl, /if \(!content && href\)/)
  assert.match(dl, /\/\^https:\\\/\\\/\/i\.test\(link\)/)
  assert.match(dl, /a\.target = "_blank"/)
  assert.match(dl, /rel = "noopener noreferrer"/)
  assert.match(client, /triggerDownload\(data\.filename, data\.content, data\.contentType, data\.url\)/)
})

test('g3 ClusterConsole is a separate console tree and never saves settings', () => {
  const client = read('src/client.js')
  assert.match(client, /function ClusterConsole/)
  assert.match(client, /function ClusterListTable/)
  assert.match(client, /function CreateWizard/)
  assert.match(client, /function DeleteWizard/)
  assert.match(client, /function ClusterDetail/)
  assert.match(client, /选择地域/)
  assert.match(client, /ci-type-card/)
  assert.match(client, /我已阅读并同意腾讯云 TKE 服务等级协议/)
  assert.match(client, /我已知晓风险/)
  assert.match(client, /ci-side-nav/)
  assert.match(client, /ci-np-card/)
  assert.match(client, /function FormPanel/)
  assert.match(client, /单节点 Pod 上限/)
  assert.match(client, /可用区/)
  assert.match(client, /登录密钥/)
  assert.doesNotMatch(client.slice(client.indexOf('function CreateWizard'), client.indexOf('function SearchToolView')), /window\.prompt/)
  assert.match(client, /kind === "cluster"/)
  assert.match(client, /填写云厂商 AccessKey。地域在对话卡片里选，不写入设置。/)
  const start = client.indexOf('function ClusterConsole')
  const end = client.indexOf('function SearchToolView')
  const consoleSrc = client.slice(start, end)
  assert.doesNotMatch(consoleSrc, /api\("config"/)
  assert.doesNotMatch(consoleSrc, /writeOverlay/)
  assert.doesNotMatch(consoleSrc, /解析记录/)
  assert.doesNotMatch(consoleSrc, /function DetailView/)
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
  const cdbUi = client.slice(client.indexOf('const CDB_OFFICIAL_TABS'), client.indexOf('function extraOf'))
  assert.doesNotMatch(cdbUi, /新建实例|续费|购买相同配置|分配至项目|配置安全组/)
  assert.doesNotMatch(client, /购买类操作不在插件内下单/)
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

test('cvm and lighthouse consoles share one dual-tab instance card', () => {
  const client = read('src/client.js')
  assert.match(client, /function CvmConsole/)
  assert.match(client, /function LhConsole/)
  assert.match(client, /function InstanceDetailView/)
  assert.match(client, /function InstanceMoreMenu/)
  assert.match(client, /ID\/名称/)
  assert.match(client, /主IPv4地址/)
  assert.match(client, /可用区/)
  assert.match(client, /实例类型/)
  assert.match(client, /实例配置/)
  assert.match(client, /实例计费模式/)
  assert.match(client, /华南地区（广州）/)
  assert.match(client, /function RegionSelect/)
  assert.match(client, /function KindTabs/)
  // 「全部地域」已下线:RegionSelect 不再提供 all 哨兵,CVM/轻量/CDB 下拉里不出现
  assert.doesNotMatch(client, /id: "all", label: "全部地域"/)
  // 状态列筛选:控制台式多选浮层,云服务器与轻量共用同一个表头组件
  assert.match(client, /function ColumnFilter/)
  assert.match(client, /function InstanceHead/)
  assert.match(client, /\(全选\)/)
  assert.match(client, /"确定"/)
  assert.match(client, /"重置"/)
  assert.match(client, /INSTANCE_STATUS_OPTIONS = \["运行中", "待回收", "已关机"\]/)
  // 浮层必须 portal 到 body:th 与 .ci-scroll 都会裁剪绝对定位的下拉
  assert.match(client, /className: "ci-colfilter"[\s\S]{0,400}?createPortal|createPortal\(h\("div", \{\s*className: "ci-colfilter"/)
  assert.match(client, /\.ci-colfilter\{position:fixed/)
  assert.doesNotMatch(client, /label: "全部地域"/)
  // 切 Tab 不能再撞「未开通」的死路:两条链地域集合不同(CVM 44 / 轻量 18),清单按 Tab 分开缓存,
  // 目标产品不支持当前地域时就地收敛并说明,而不是报错让用户自己重选
  assert.doesNotMatch(client, /未开通\/不可用，请重新选择地域/)
  assert.match(client, /const regionCache = useRef\(\{ cvm: \[\], lighthouse: \[\] \}\)/)
  assert.match(client, /const regionMemo = useRef\(\{ cvm: "", lighthouse: "" \}\)/)
  assert.match(client, /function resolveRegionForOptions/)
  assert.match(client, /const options = \(regionCache\.current\[useKind\] \|\| \[\]\)\.filter\(Boolean\)/)
  // 按字符串比而不是按 reason:后端按地域名字符串过滤,同一地域的两种写法也必须换成目标产品的原文
  assert.match(client, /if \(fixed\.region && fixed\.region !== wanted\)/)
  assert.match(client, /function regionFixWorthTelling/)
  assert.match(client, /if \(regionFixWorthTelling\(fixed\.reason\)\) setRegionFix/)
  // 首次进某个 Tab 时清单还没回来,只能等结果到手再收敛并重拉一次
  assert.match(client, /regionCache\.current\[useKind\] = names/)
  assert.match(client, /fetchList\(0, trimmed, fixed\.region, useTab\)/)
  // 说明文案是派生的,不额外维护清理逻辑
  assert.match(client, /function regionSwitchNote/)
  assert.match(client, /\.ci-region-note\{margin:8px 14px/)
  assert.match(client, /云服务器/)
  assert.match(client, /轻量应用服务器/)
  assert.match(client, /搜索 ID \/ 名称 \/ IP/)
  assert.doesNotMatch(client, /卡片视图/)
  assert.doesNotMatch(client, /function RegionTabs/)
  // 常驻双 Tab:KindTabs 不再要求两类数据同卡才显示
  assert.doesNotMatch(client, /if \(!\(showCvm && showLh\)\) return null/)
  // 去冗余标题:实例卡内不再出现「实例」「服务器」两个 bar 标题
  assert.doesNotMatch(client, /className: "ci-bar-title" \}, "实例"\)/)
  assert.doesNotMatch(client, /className: "ci-bar-title" \}, "服务器"\)/)
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
  const toolStart = client.indexOf('function SearchToolView')
  const toolEnd = client.indexOf('function matchModule', toolStart)
  const tool = client.slice(toolStart, toolEnd)
  // 切 Tab 时先换清单、记住离开那个 Tab 的地域,回来能复用
  assert.match(tool, /regionMemo\.current\[tabToKind\(kindTab\)\] = safeText\(listRegion\)/)
  assert.match(tool, /const cached = \(regionCache\.current\[tabToKind\(next\)\] \|\| \[\]\)\.filter\(Boolean\)/)
  assert.match(tool, /const regionNote = regionFix/)
  assert.match(tool, /h\(KindTabs/)
  assert.match(tool, /h\(Pager/)
  assert.match(tool, /region: useRegion/)
  // 「全部地域」已下线:搜索时不再切到 "all",始终使用当前选中地域
  assert.doesNotMatch(tool, /trimmed \? "all"/)
  assert.match(tool, /kind === "auto"/)
  assert.match(tool, /kind !== "auto"/)
  assert.match(tool, /tabToKind/)
  assert.match(tool, /kind: nextKind/)
  assert.match(tool, /onChange: \(next\)/)
  assert.match(tool, /usableInstanceQuery/)
  assert.match(client, /function usableInstanceQuery/)
  assert.match(tool, /华南地区（广州）/)
  assert.match(tool, /setTimeout\(\(\) => runSearch\(value\), 800\)/)
  assert.match(client, /function SearchField/)
  assert.match(client, /function ListPane/)
  assert.match(client, /加载列表/)
  // 翻页不得让卡片抖动:列表区高度锚定 + 分页条常驻(加载中只置灰,不卸载)
  assert.match(client, /function ListPane\(\{ busy, hold, compact, children \}\)/)
  assert.match(client, /minHeight: floor/)
  assert.match(tool, /hold: pageCount > 1/)
  assert.doesNotMatch(tool, /!listBusy \? h\(Pager/)
  // 服务器卡只展示自己模块的错误(kind=auto 曾把 tke 的「缺少地域」显示在已选广州的卡上)
  assert.match(tool, /instanceErrors/)
  assert.doesNotMatch(tool, /errors\.length \? h\("div", \{ key: "perr"/)
  // 状态筛选:随 query 请求下发 filters.status,且改筛选回到第 1 页
  assert.match(tool, /status: useStatus\.join\(","\)/)
  assert.match(tool, /onStatus: onInstStatus/)
  assert.match(tool, /const onInstStatus = \(next\) => \{[\s\S]{0,220}?fetchList\(0, String\(activeQ \|\| ""\)\.trim\(\), undefined, undefined, \{ status: list \}\)/)
  assert.doesNotMatch(client, /ci-list-mask/)
  assert.doesNotMatch(tool, /showDomain = kind === "domain" \|\| \(!showCvm && !showLh\)/)
  // Tab 行为主行,下行统一「地域下拉 + 搜索框」:一套 RegionSelect + SearchField 由 KindTabs 下层的 ci-bar 渲染
  assert.match(tool, /h\("div", \{ key: "bar", className: "ci-bar" \}/)
  assert.match(tool, /h\(RegionSelect, \{[\s\S]*h\(SearchField, \{/)
  // 切 Tab 按需拉取另一类型,保留搜索词与地域(onChange 内 fetchList 带 next tab)
  assert.match(tool, /onChange: \(next\) => \{[\s\S]{0,320}?setKindTab\(next\)[\s\S]{0,320}?fetchList\(0, String\(activeQ \|\| ""\)\.trim\(\), undefined, next\)/)
  // 切 Tab 时不再因 showCvm/showLh 之一缺失而退回单 Tab
  assert.match(tool, /kindTab === "cvm" \? h\(CvmConsole/)
  // 轻量空态与云服务器一致(没有匹配…的实例)
  assert.match(tool, /emptyHint[\s\S]{0,80}?没有匹配「\$\{activeQ \|\| draftQ\}」的实例[\s\S]{0,80}?没有匹配的实例/)
  // 空态必须留在 .ci-scroll 里:横向滚动条画在容器下沿,空态挂到容器外面时容器只包住表头,
  // 滚动条就会紧贴表头下沿(看着像表头上长了根滚动条);sticky 让提示横滚时不被推出可视区
  for (const fn of ['CvmConsole', 'LhConsole']) {
    const body = client.slice(client.indexOf(`function ${fn}(`))
    const scrollAt = body.indexOf('h("div", { className: "ci-scroll" }')
    const emptyAt = body.indexOf('className: "ci-empty" }, instanceEmptyHint')
    assert.ok(scrollAt > 0 && emptyAt > scrollAt, `${fn}: 找不到 .ci-scroll 或空态`)
    assert.ok(emptyAt < balancedEnd(body, scrollAt), `${fn}: 空态落在 .ci-scroll 之外,滚动条会贴在表头下沿`)
  }
  assert.match(client, /\.ci-scroll>\.ci-empty\{position:sticky;left:0/)
  // 地域命名统一:客户端按控制台全称归一,短名(如「广州」)映射为「华南地区（广州）」
  assert.match(client, /function canonicalRegionName/)
  assert.match(client, /\["广州", "华南地区（广州）"\]/)
})

test('canonicalRegionName maps short names to console full names and RegionSelect dedupes by canonical', () => {
  const src = read('src/client.js')
  const fnStart = src.indexOf('function canonicalRegionName')
  const fnEnd = src.indexOf('function RegionSelect', fnStart)
  const tableStart = src.indexOf('const REGION_CITY_TO_DISPLAY')
  const tableEnd = src.indexOf('];', tableStart) + 2
  assert.ok(fnStart > tableStart && tableStart > 0 && fnEnd > fnStart)
  const factory = new Function(`${src.slice(tableStart, tableEnd)}\n${src.slice(fnStart, fnEnd)}\nreturn canonicalRegionName`)
  const canonical = factory() as (name: string) => string
  // 短名归一为控制台全称
  assert.equal(canonical('广州'), '华南地区（广州）')
  assert.equal(canonical('上海'), '华东地区（上海）')
  assert.equal(canonical('北京'), '华北地区（北京）')
  // 已全称按原样,半角括号转全角
  assert.equal(canonical('华南地区(广州)'), '华南地区（广州）')
  assert.equal(canonical('华南地区（广州）'), '华南地区（广州）')
  // 官方 region id 不动
  assert.equal(canonical('ap-guangzhou'), 'ap-guangzhou')
  // 未知文本原样返回(不映射避免误判)
  assert.equal(canonical('其它地域'), '其它地域')
})

test('instance detail uses official groups and never renders DNS records', () => {
  const client = read('src/client.js')
  const start = client.indexOf('function InstanceDetailView')
  const end = client.indexOf('function OwnedDetailView', start)
  assert.ok(start > 0 && end > start)
  const body = client.slice(start, end)
  assert.match(body, /h\(BackButton, \{ onClick: onBack \}\)/)
  assert.doesNotMatch(body, /返回实例列表/)
  assert.match(client, /function BackButton\(\{ onClick, className, \.\.\.rest \}\)/)
  assert.match(client, /aria-label": "返回"/)
  assert.match(client, /h\(ChevronLeft\)/)
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
  assert.match(host, /云服务器\/轻量\/CVM\/实例|云服务器 \/ 轻量 \/ CVM \/ 实例|云服务器\|轻量应用服务器/)
  assert.doesNotMatch(host, /if\s*\(.*provider\s*===\s*['"]tencent['"]/)
})

test('host prompt guides one kind=auto call for server queries and references dual tabs', () => {
  const host = read('src/host.ts')
  // 工具 description 内的关键句
  assert.match(host, /kind=auto queries the server modules only \(CVM and Lighthouse\)/)
  assert.doesNotMatch(host, /kind=auto to query every enabled module/)
  assert.match(host, /ONE call with kind=auto/)
  assert.match(host, /do NOT split into two calls/)
  assert.match(host, /云服务器 \| 轻量应用服务器 tabs/)
  assert.match(host, /switch between them inside the same card/)
  // systemPrompt 同步段落,与 description 表述一致
  const promptStart = host.indexOf("name: 'tool:cloud-infra'")
  const promptEnd = host.indexOf("ctx.inject(['webServer']", promptStart)
  assert.ok(promptStart > 0 && promptEnd > promptStart)
  const prompt = host.slice(promptStart, promptEnd)
  assert.match(prompt, /ONE call with kind=auto/)
  assert.match(prompt, /do NOT split into two calls/)
  assert.match(prompt, /云服务器 \| 轻量应用服务器 tabs/)
  assert.match(prompt, /switch between them inside the same card/)
})

test('g3 COS console two pages use region combo and file list, not an expand tree', () => {
  const client = read('src/client.js')
  const host = read('src/host.ts')
  const readme = read('README.md')
  assert.match(client, /function CosConsoleView/)
  assert.match(client, /function CosRegionCombo/)
  assert.match(client, /function CosBucketTable/)
  assert.match(client, /function CosFileTable/)
  assert.match(client, /\.ci-table-wrap\{[^}]*overflow-x:auto/)
  assert.match(client, /\.ci-table\{[^}]*table-layout:fixed/)
  assert.match(client, /\.ci-table th,\.ci-table td\{[^}]*white-space:nowrap/)
  assert.match(client, /\.ci-table th,\.ci-table td\{[^}]*text-overflow:ellipsis/)
  assert.match(client, /请输入并选择地域/)
  assert.match(client, /DEFAULT_COS_REGION_ID = "ap-guangzhou"/)
  assert.match(client, /function defaultCosRegion/)
  assert.match(client, /useState\(\(\) => defaultCosRegion/)
  // CosRegionCombo 统一走共享 RegionPicker(不再经过旧 RegionCombo/comboNeedle)
  assert.doesNotMatch(client, /comboNeedle/)
  assert.match(client, /function RegionPicker\(/)
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
  assert.match(client, /\.ci-bar\{[^}]*flex-wrap:nowrap/)
  assert.match(client, /\.ci-regionbar label\{[^}]*font-size:13px/)
  assert.match(client, /\.ci-combo input\{[^}]*font-size:13px/)
  assert.match(client, /\.ci-mini\{[^}]*font-size:13px/)
  assert.match(client, /\.ci-search\{[^}]*font-size:13px/)
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
  assert.match(readme, /上一页 \/ 下一页/)
  assert.match(readme, /设置 → 插件 → Cloud Infra/)
  assert.match(readme, /x-cos-copy-source/)
  assert.match(client, /下一页/)
  assert.match(client, /id: "ci-cos-file-next"/)
  assert.match(client, /id: "ci-cos-file-prev"/)
  assert.doesNotMatch(client, /className: "ci-page-btns" \},\)/)
  assert.doesNotMatch(client, /id: "ci-cos-load-more"/)
  // 「不许加载更多」这条只约束 COS 文件列表(它必须是上一页/下一页),
  // 别把整份 client.js 都禁掉 —— CLS 原始日志就是靠触底续拉的
  const cosView = client.slice(client.indexOf('function CosConsoleView'), client.indexOf('function ClusterConsole'))
  assert.ok(cosView.length > 1000)
  assert.doesNotMatch(cosView, /加载更多/)
  assert.doesNotMatch(client, /一层过多可翻页/)
  assert.doesNotMatch(client, /已加载 \$\{/)
  assert.match(client, /仅搜索当前页的文件/)
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
  assert.match(card, /填写云厂商 AccessKey。地域在对话卡片里选，不写入设置。/)
  assert.match(card, /provider\.fields/)
  assert.match(card, /SecretId|field\.label/)
  assert.doesNotMatch(card, /默认地域|defaultRegion|COS 地域/)
  assert.doesNotMatch(card, /创建存储桶|文件列表|CosRegionCombo/)
  assert.match(card, /"产品模块"/)
  assert.match(card, /className: "ci-cfg-mod-list"/)
  assert.match(card, /写操作免确认（删除仍会确认）/)
  // 设置卡标题与模块列表:不要 kind=xxx 这种实现细节,简介也别堆产品名
  assert.match(card, /"Cloud Infra"/)
  assert.doesNotMatch(card, /kindHint|\(kind=/)
  assert.doesNotMatch(card, /ci-cfg-mod-hint2/)
  assert.match(card, /勾选后参与对话查询。/)
  assert.doesNotMatch(card, /条目增多时在框内滚动/)
})

test('设置卡在宿主槽里仍有圆角 token(不依赖 .ci-root 包裹)', () => {
  const client = read('src/client.js')
  // ConfigCard 挂在 settings.plugin.item,外面没有 .ci-root;漏了 --ci-radius-* 会整张直角
  assert.match(client, /\.ci-root,\.ci-regionpop,\.ci-modal-mask,\.ci-more-menu,\.ci-colfilter,\.ci-menu-portal,\.ci-winframe,\.ci-cfg\{--ci-fg:/)
  assert.match(client, /,\.ci-cfg\{--dsw-alias-brand-primary:var\(--dsw-alias-button-info-fill\)/)
  assert.match(client, /\.ci-cfg\{[^}]*border-radius:var\(--ci-radius-xl\)/)
  assert.match(client, /\.ci-cfg-f input\[type=text\][^}]*border-radius:var\(--ci-radius-lg\)/)
  assert.match(client, /\.ci-cfg-mod-list\{[^}]*border-radius:var\(--ci-radius-lg\)/)
  assert.match(client, /\.ci-cfg-save\{[^}]*border-radius:var\(--ci-radius-lg\)/)
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

test('g6 host query tool hits dbbrain keywords without vendor branches', () => {
  const host = read('src/host.ts')
  const query = read('src/core/query.ts')
  assert.match(host, /kind=dbbrain/)
  assert.match(host, /慢SQL/)
  assert.match(host, /异常诊断/)
  assert.match(query, /kind === 'dbbrain'/)
  assert.doesNotMatch(host, /if\s*\(.*provider\s*===\s*['"]tencent['"]/)
})

test('cdb review fixes: WAN DMC, destroy protect toggle, project form, destructive SQL', () => {
  const client = read('src/client.js')
  assert.match(client, /function pickDmcEndpoint/)
  assert.match(client, /function isDestructiveSql/)
  assert.match(client, /关闭实例销毁保护/)
  assert.match(client, /开启实例销毁保护/)
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
  assert.match(client, /ap-hongkong/)
  assert.match(client, /payload\?\.regions/)
  assert.match(client, /result\.regions/)
  assert.match(client, /搜索实例名称/)
  assert.match(client, /搜索命名空间/)
  assert.match(client, /搜索仓库名称/)
  assert.match(client, /搜索镜像版本/)
  assert.match(client, /className: "ci-grid"/)
  assert.match(client, /className: "ci-ic"/)
  assert.match(client, /镜像仓库/)
  assert.match(client, /版本管理/)
  assert.match(client, /className: "ci-detail-meta"/)
  assert.match(client, /className: "ci-act"/)
  assert.match(client, /function prettyTime/)
  assert.match(client, /拉取指令/)
  assert.match(client, /DIGEST_WARNING/)
  assert.match(client, /相同镜像 ID（SHA256）/)
  assert.match(client, /docker pull/)
  assert.match(client, /\.ci-table-wrap\{[^}]*overflow-x:auto/)
  assert.match(client, /\.ci-list\{[^}]*overflow-x:auto/)
  assert.match(client, /\.ci-table\{[^}]*table-layout:fixed/)
  assert.match(client, /\.ci-table th,\.ci-table td\{[^}]*white-space:nowrap/)
  assert.match(client, /\.ci-table th,\.ci-table td\{[^}]*text-overflow:ellipsis/)
  assert.match(client, /\.ci-table td\.ci-ops-cell,\.ci-table th\.ci-ops-cell\{[^}]*overflow:visible/)
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
      errors: [{ moduleId: 'tencent.image', message: '腾讯云 未配置 SecretId、SecretKey。请在 设置 → 插件 → Cloud Infra 填写对应云厂商的 AccessKey' }],
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
  assert.match(imageView, /fontSize:\s*12/)
  assert.match(src, /\.ci-root \.ci-err,\.ci-panel \.ci-err[\s\S]{0,240}font-size:12px/)
  assert.match(src, /\.ci-root \.ci-err,\.ci-panel \.ci-err[\s\S]{0,240}font-weight:400/)
  assert.match(src, /\.ci-tab\{[^}]*font-size:13px/)
  assert.match(src, /仅显示前 100 条/)
  assert.match(src, /"Tag 数"/)
  assert.match(src, /"创建时间"/)
  assert.match(src, /"更新时间"/)
})

test('g3.3 instance h3 uses dual-theme title color and ConfigCard stays unchanged', () => {
  const client = read('src/client.js')
  assert.match(client, /\.ci-ic h3\{[^}]*color:var\(--ci-title\)/)
  assert.match(client, /\.ci-ic h3\{[^}]*-webkit-text-fill-color:var\(--ci-title\)/)
  // G1.3:ci-image/ci-ic 反色 fallback 与 prefers-color-scheme 特例已统一下沉到 --ci-title(指向 --dsw-alias-label-primary),
  // 不再保留独立的 html[data-theme] 兜底规则,也不再有硬编码 hex
  assert.doesNotMatch(client, /html\[data-theme=light\] \.ci-ic h3\{color:#0f1419/)
  assert.doesNotMatch(client, /html\[data-theme=dark\] \.ci-ic h3\{color:#f7f8fb/)
  assert.doesNotMatch(client, /html\[data-theme=light\] \.ci-image/)
  assert.doesNotMatch(client, /html\[data-theme=dark\] \.ci-image/)
  assert.match(client, /--ci-title:var\(--ci-fg\)/)
  const card = client.slice(client.indexOf('function ConfigCard()'))
  assert.match(card, /function ConfigCard\(/)
  assert.match(card, /填写云厂商 AccessKey。地域在对话卡片里选，不写入设置。/)
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

test('monitor charts: MonitorPanel/MonitorChart shared by CDB and instance detail', () => {
  const client = read('src/client.js')
  assert.match(client, /function MonitorChart\(/)
  assert.match(client, /function MonitorPanel\(/)
  assert.match(client, /MONITOR_RANGES/)
  assert.match(client, /"1h"/)
  assert.match(client, /"6h"/)
  assert.match(client, /"24h"/)
  // echarts 由构建期打包进 lib/client.js,不允许出现任何运行时 CDN 注入
  assert.doesNotMatch(client, /cdn\.jsdelivr\.net/)
  assert.doesNotMatch(client, /createElement\("script"\)/)
  assert.doesNotMatch(client, /ECHARTS_URL/)
  assert.match(client, /chart\.dispose\(\)/)
  assert.match(client, /暂无监控数据/)
  assert.match(client, /ci-monitor-grid/)
  // CDB 与 CVM/轻量都走同一个 MonitorPanel
  assert.equal(client.split('h(MonitorPanel').length - 1 >= 2, true)
  // 实例详情带「实例详情 / 实例监控」两个 Tab
  assert.match(client, /\["实例详情", "实例监控"\]/)
  // 时间窗切换走 reload(tab, { range })
  assert.match(client, /onRangeChange: \(range\) => onReload\("实例监控", \{ range \}\)/)
  // seriesMap 由 buildMonitorSeriesMap 统一构造,以 MetricDef.key 为键
  assert.match(client, /function buildMonitorSeriesMap\(/)
  assert.equal(client.split('buildMonitorSeriesMap(tabData.metrics, tabData.series)').length - 1, 2)
  assert.match(client, /map\[m\.key\]/)
})

test('region pickers unify on RegionPicker; 全部地域哨兵已下线', () => {
  const client = read('src/client.js')
  // 旧 RegionCombo/RegionComboById/REGION_ALL_ID 已随「全部地域」一同移除
  assert.doesNotMatch(client, /function RegionCombo\(/)
  assert.doesNotMatch(client, /function RegionComboById\(/)
  assert.doesNotMatch(client, /REGION_ALL_ID/)
  assert.doesNotMatch(client, /allowAll/)
  assert.match(client, /function matchRegionItems\(/)
  assert.match(client, /function RegionPicker\(/)
  assert.match(client, /function RegionSelect/)
  assert.match(client, /function ClsRegionSelect/)
  assert.match(client, /function CosRegionCombo/)
  assert.match(client, /clsRegionGroups/)
  // 任何地域下拉里都不再出现「全部地域」
  assert.doesNotMatch(client, /label: "全部地域"/)
  assert.doesNotMatch(client, /"全部地域"/)
  // 注释允许保留说明文字,这里断言的是可执行代码中不生成全部地域选项
  assert.equal((client.match(/RegionPicker/g) || []).length >= 6, true)
})

test('G2.6 RegionPicker 共享组件存在并被 6+ 个产品卡片接入', () => {
  const client = read('src/client.js')
  // 组件本身存在且创建 Portal 到 body(避免被 overflow:hidden 母容器裁切)
  assert.match(client, /function RegionPicker\(/)
  assert.match(client, /createPortal/)
  assert.match(client, /ci-regionpop/)
  assert.match(client, /ci-regionpick-btn/)
  // 胶囊模式 + 展开箭头;🌍 图标已移除(g1.2)
  assert.doesNotMatch(client, /ci-regionpick-globe/)
  // 箭头用 SVG 而不是「▾」字符:字形随字体漂移,基线对不齐
  assert.match(client, /className: "ci-regionpick-caret"[\s\S]{0,200}?viewBox: "0 0 10 10"/)
  assert.doesNotMatch(client, /"ci-regionpick-caret" \}, "▾"/)
  assert.match(client, /\.ci-regionpick-btn\.open \.ci-regionpick-caret\{transform:rotate\(180deg\)\}/)
  // 弹层必须不透明(g1.1):Portal 后 token 自解析 + 背景双写兜底
  // token 作用域必须覆盖所有 portal 到 body 的浮层,否则 var(--ci-radius-*) 失效、圆角掉成直角
  assert.match(client, /\.ci-root,\.ci-regionpop,\.ci-modal-mask,\.ci-more-menu,\.ci-colfilter,\.ci-menu-portal,\.ci-winframe,\.ci-cfg\{--ci-fg:/)
  assert.match(client, /background-color:var\(--dsw-alias-bg-layer-1\)/)
  assert.match(client, /background-color:var\(--ci-bg\)/)
  // 模糊搜索:input / placeholder 中专有字符串
  assert.match(client, /搜索地域:中文 \/ 拼音 \/ 缩写 \/ id/)
  // A11y:listbox/option/combobox 语义
  assert.match(client, /aria-expanded/)
  assert.match(client, /aria-haspopup.*listbox|aria-haspopup="listbox"/)
  assert.match(client, /role: "listbox"/)
  assert.match(client, /role: "option"/)
  assert.match(client, /role: "tablist"/)
  // Esc 关闭、键盘 ↑↓、Enter 选中
  assert.match(client, /e\.key === "Escape"/)
  assert.match(client, /e\.key === "ArrowDown"/)
  assert.match(client, /e\.key === "ArrowUp"/)
  assert.match(client, /e\.key === "Enter"/)
  // 至少 6 处实例化(COS/TKE/CLS/CDB/TCR/DBbrain/CVM 等);所有实例化点共享同一 RegionPicker
  const pickers = client.split('h(RegionPicker').length - 1
  assert.ok(pickers >= 6, `expected >= 6 RegionPicker instantiation sites, got ${pickers}`)
  // 各产品不再通过 inline width 各自改尺寸；统一 140px、8px 圆角，focus 不画双层 outline
  assert.doesNotMatch(client, /additionalStyle/)
  assert.match(client, /\.ci-regionpick\{[^}]*width:140px[^}]*min-width:140px[^}]*max-width:140px/)
  // 收起态只显示城市名:「华南地区（广州）」在固定宽度里必然截断,全称留给 title 与浮层
  assert.match(client, /function shortRegionLabel/)
  assert.match(client, /const displayLabel = valueObj \? shortRegionLabel\(valueObj\.label\)/)
  assert.match(client, /id: inputId, title: fullLabel,/)
  assert.match(client, /h\("span", \{ className: "ci-regionpop-label" \}, r\.label \|\| r\.id\)/)
  assert.match(client, /\.ci-regionpick-btn\{[^}]*width:100%[^}]*border-radius:var\(--ci-radius-lg\)/)
  assert.match(client, /\.ci-regionpick-btn:focus-visible\{outline:none[^}]*box-shadow:/)
  assert.match(client, /\.ci-regionpick-text\{[^}]*text-overflow:ellipsis/)
  // 默认地域值仍兼容:空 value → fallback 到调用方传入的 "ap-guangzhou"
  assert.match(client, /ap-guangzhou/)
})

test('G4.1 深色模式:0 处硬编码 hex 与 prefers-color-scheme 已下沉', () => {
  const client = read('src/client.js')
  // 除 echarts 内部色板与 inject 的 SVG data URI 外,UI 不允许出现 #xxxxxx
  // 已确认 echarts 走构建期打包,src/client.js 不含 echarts dist;脚本 sources 不动 echarts 二进制
  const hexes = client.match(/#[0-9a-fA-F]{3,8}\b/g) || []
  // 唯一允许:#000/#fff 在 mask SVG data URI / fallback 数组,已由 color-mix / dsw 收编
  assert.ok(hexes.length === 0, `expected 0 hardcoded hex, got ${hexes.slice(0,8).join(",")}`)
  // 不允许出现 prefers-color-scheme 媒体查询兜底(明/暗由宿主 dsw 全量驱动)
  // 注意 src 中允许 [data-theme=...] 属性选择器
  assert.doesNotMatch(client, /@media \(prefers-color-scheme/)
})

test('阴影与遮罩收敛到 --ci-shadow-*/--ci-mask,不再引用宿主未定义的 --dsw-alias-shadow', () => {
  const client = read('src/client.js')
  // 宿主主题包里没有 --dsw-alias-shadow:引用它的整条 box-shadow 声明无效,弹窗/菜单/开关会一点投影都没有
  assert.doesNotMatch(client, /var\(--dsw-alias-shadow\)/)
  // 三级阴影 + 遮罩都在 token 层定义;遮罩取 bg-mask-1,bg-mask-3 是 48% 纯黑,会把整张对话卡片压暗
  assert.match(client, /--ci-shadow-0:0 1px 2px rgba\(0,0,0,\.12\)/)
  assert.match(client, /--ci-shadow-1:0 2px 8px rgba\(0,0,0,\.08\)/)
  assert.match(client, /--ci-shadow-2:0 4px 16px rgba\(0,0,0,\.1\)/)
  assert.match(client, /--ci-mask:var\(--dsw-alias-bg-mask-1\)/)
  assert.doesNotMatch(client, /var\(--dsw-alias-bg-mask-3\)/)
  assert.match(client, /\.ci-modal-mask\{[^}]*background:var\(--ci-mask\)/)
  // 使用点一律走 token:黑色只允许出现在 token 定义那一行
  for (const rule of ['\\.ci-modal\\{', '\\.ci-more-menu\\{', '\\.ci-colfilter\\{']) {
    assert.match(client, new RegExp(rule + '[^}]*box-shadow:var\\(--ci-shadow-2\\)'))
  }
  for (const rule of ['\\.ci-menu\\{', '\\.ci-drop-menu\\{', '\\.ci-more-list\\{']) {
    assert.match(client, new RegExp(rule + '[^}]*box-shadow:var\\(--ci-shadow-1\\)'))
  }
  assert.match(client, /\.ci-toggle i\{[^}]*box-shadow:var\(--ci-shadow-0\)/)
  assert.match(client, /\.ci-monitor-range\.active\{[^}]*box-shadow:var\(--ci-shadow-0\)/)
  const blackLines = client.split('\n').filter((line) => /rgba\(0,0,0/.test(line) && !/--ci-shadow-0:/.test(line))
  assert.equal(blackLines.length, 0, `硬编码黑色应只留在 token 行:${blackLines.slice(0, 2).join(' | ')}`)
  // portal 到 body 的 .ci-menu 也要落在 token 作用域内,否则 shadow/圆角双双失效
  assert.match(client, /"ci-menu" \+ \(pos \? " ci-menu-portal" : ""\)/)
  assert.match(client, /,\.ci-menu-portal,\.ci-winframe,\.ci-cfg\{--ci-fg:/)
})

test('G4.2 / G4.3 a11y:dialog 角色 + focus-visible + Esc 链 + aria-modal', () => {
  const client = read('src/client.js')
  // Modal 已带 role=dialog / aria-modal + Esc + focus 归还
  assert.match(client, /role: "dialog"/)
  assert.match(client, /aria-modal/)
  // focus-visible 至少出现于 Button/Tab/RegionPicker/搜索等
  const n = (client.match(/:focus-visible/g) || []).length
  assert.ok(n >= 4, `expected >= 4 :focus-visible rules, got ${n}`)
  // Esc 出现在 Modal(全局) 与 RegionPicker
  assert.match(client, /e\.key === "Escape"/)
  // RegionPicker a11y 完整链
  assert.match(client, /aria-haspopup.*listbox|aria-haspopup="listbox"/)
  assert.match(client, /aria-expanded/)
  assert.match(client, /role: "listbox"/)
  assert.match(client, /role: "option"/)
})

test('G2.3 Tabs/SubTabs 统一蓝色下划线样式并应用到所有 ci-tab 用法', () => {
  const client = read('src/client.js')
  // 蓝色下划线已应用于统一 .ci-tab(G2.3 / FR-3):border-bottom:2px solid transparent + on 时 border-bottom-color:var(--ci-brand)
  assert.match(client, /\.ci-tab\{[^}]*border-bottom:2px solid transparent/)
  assert.match(client, /\.ci-tab\.on,{0,1}\.ci-tab\.active\{[^}]*border-bottom-color:var\(--ci-brand\)/)
  assert.match(client, /\.ci-tab-v2\{[^}]*border-bottom:2px solid transparent/)
  assert.match(client, /\.ci-tab-v2\.on\{[^}]*border-bottom-color:var\(--ci-brand\)/)
  // 共享 Tabs 组件存在(role=tablist + aria-selected)
  assert.match(client, /function Tabs\(\{ items, active, onPick/)
  assert.match(client, /role: "tablist"/)
  assert.match(client, /aria-selected/)
  // TS 端 TKE/CDB/DBbrain/CLS 等详情确实在用 ci-tab
  assert.match(client, /className:\s*"ci-tab"/)
})

test('Tab 条不出现滚动条,禁用态不跟随 hover 变色', () => {
  const client = read('src/client.js')
  // .ci-tab 用 margin-bottom:-1px 压容器边框,放在滚动容器里会溢出 1px 并挂上滚动条
  const tabs = client.match(/\n\.ci-tabs\{[^}]*\}/)![0]
  const tabsV2 = client.match(/\n\.ci-tabs-v2\{[^}]*\}/)![0]
  for (const rule of [tabs, tabsV2]) {
    assert.doesNotMatch(rule, /overflow/)
    assert.match(rule, /flex-wrap:wrap/)
  }
  assert.match(client, /\.ci-tab:hover:not\(:disabled\)\{color:var\(--ci-brand\)\}/)
  assert.match(client, /\.ci-tab-v2:hover:not\(:disabled\)\{color:var\(--ci-brand\)\}/)
  // 服务器 Tab:中文标签 + 产品代号只放在 title 里
  assert.match(client, /title: "云服务器 CVM"/)
  assert.match(client, /title: "轻量应用服务器 Lighthouse"/)
})

test('文字链与正文可区分:brand token 重映射到宿主蓝色并有 hover 反馈', () => {
  const client = read('src/client.js')
  // 宿主 --dsw-alias-brand-primary == label-primary(近黑),直接用会让「部署/下载/更多」与正文同色
  assert.match(client, /--dsw-alias-brand-primary:var\(--dsw-alias-button-info-fill\)/)
  assert.match(client, /--dsw-alias-button-primary-fill:var\(--dsw-alias-button-info-fill\)/)
  assert.match(client, /--ci-brand-hover:color-mix\(in srgb,var\(--dsw-alias-button-info-fill\)/)
  assert.match(client, /\.ci-link:hover:not\(:disabled\)\{color:var\(--ci-brand-hover\);text-decoration:underline\}/)
  // 证书列表操作列不再是固定 128px,避免「下载中」把有效期列挤掉
  assert.match(client, /minmax\(130px,1fr\) minmax\(128px,max-content\)/)
})

test('RegionSelect defaults to Guangzhou via RegionPicker and blocks unavailable regions', () => {
  const client = read('src/client.js')
  // RegionSelect 已统一切到共享 RegionPicker,默认走 defaultRegionName(广州优先,不可用回退第一个)
  const regionSel = client.match(/function RegionSelect[\s\S]*?\n    \}/)![0]
  assert.match(regionSel, /RegionPicker/)
  assert.match(regionSel, /defaultRegionName/)
  // 不再提供「全部地域」选项
  assert.doesNotMatch(regionSel, /all/)
  // defaultRegionName 广州优先 + 回退列表第一项
  const defRegion = client.match(/function defaultRegionName[\s\S]*?\n    \}/)![0]
  assert.match(defRegion, /广州/)
  assert.match(defRegion, /ap-guangzhou/)
  assert.match(defRegion, /list\[0\]/)
  // 地域收敛优先级:同一地域 → 同城(专区回落主城)→ 该 Tab 上次选的 → 该 Tab 默认
  const resolve = client.match(/function resolveRegionForOptions[\s\S]*?\n    \}/)![0]
  assert.match(resolve, /reason: "same"/)
  assert.match(resolve, /reason: "alias"/)
  assert.match(resolve, /reason: "city"/)
  assert.match(resolve, /reason: "remembered"/)
  assert.match(resolve, /reason: "default"/)
  assert.match(resolve, /city\.length >= 2 && wantCity\.length > city\.length && wantCity\.startsWith\(city\)/)
  assert.match(resolve, /defaultRegionName\(list\)/)
  // 返回的是清单自己的写法:CVM 说「华南地区（广州）」,轻量说「广州」,回传后端必须用目标产品的原文
  const optionMatch = client.match(/function regionOptionMatch[\s\S]*?\n    \}/)![0]
  assert.match(optionMatch, /return name/)
  // CDB 下拉不再注入「全部地域」特殊项
  const cdbPick = client.match(/inputId: "ci-cdb-region"[\s\S]{0,350}?onChange/)![0]
  assert.doesNotMatch(cdbPick, /全部地域/)
  // CLS 圆角已纳入统一 --ci-radius-lg(G1.2/g1.4),不再是独立硬编码
  assert.doesNotMatch(client, /\.ci-cls-control\{[^}]*border-radius:[0-9]+px/)
  assert.match(client, /\.ci-cls-control\{[^}]*width:100%[^}]*height:36px[^}]*border-radius:var\(--ci-radius-lg\)/)
  // TCR 曾把 RegionPicker 套进自带边框的 ci-chip-sel，产生双边框；地域组件现在直接挂在筛选行
  const imageRegionAt = client.indexOf('inputId: "ci-image-region"')
  assert.ok(imageRegionAt > 0)
  const imageRegion = client.slice(imageRegionAt - 280, imageRegionAt)
  assert.doesNotMatch(imageRegion, /ci-chip-sel/)
})

test('DNSPod 托管域名可从我的域名详情直达解析记录', () => {
  const client = read('src/client.js')
  assert.match(client, /extras\.dnspodHosted \? h\("button"/)
  assert.match(client, /title: "打开 DNSPod 解析记录"/)
  assert.match(client, /function OwnedDetailView\(\{[^}]*onOpenDns/)
  assert.match(client, /const openDnsRecords = \(owned\) => openItem\(\{/)
  assert.match(client, /moduleId: "tencent\.domain"/)
  assert.match(client, /onOpenDns: openDnsRecords/)
})

test('MySQL 行内操作与编辑弹窗使用统一紧凑样式', () => {
  const client = read('src/client.js')
  assert.match(client, /\.ci-inline-action\{margin-left:10px;font-size:12px/)
  assert.match(client, /className: "ci-link ci-inline-action"/)
  assert.match(client, /className: "ci-modal ci-form-modal"/)
  assert.match(client, /\.ci-form-modal \.ci-field input\{[^}]*height:36px[^}]*box-sizing:border-box/)
  assert.match(client, /\.ci-form-modal \.ci-modal-actions\{[^}]*border-top:1px solid var\(--ci-border\)/)
})

test('g1/g2 列表横向滚动 hover 连续与 .ci-mini 品牌色 hover 契约', () => {
  const client = read('src/client.js')
  // 横向滚动容器仍允许溢出滚动,hover 背景随内容宽度延展
  assert.match(client, /\.ci-table-wrap\{[^}]*overflow-x:auto/)
  assert.match(client, /\.ci-list\{[^}]*overflow-x:auto/)
  // 三类列表 hover 背景覆盖整行(含横向滚动后区域):行宽随内容延展 + td 上下同色 box-shadow 弥合接缝
  assert.match(client, /\.ci-table\{[^}]*width:max-content/)
  assert.match(client, /\.ci-row\{[^}]*min-width:max-content/)
  assert.match(client, /\.ci-table tbody tr:hover td\{[^}]*box-shadow:[^}]*var\(--dsw-alias-interactive-bg-hover\)/)
  assert.match(client, /\.ci-dense tbody tr:hover td\{[^}]*box-shadow:[^}]*var\(--dsw-alias-interactive-bg-hover\)/)
  // .ci-mini 默认 hover:品牌色浅色底(color-mix 品牌色 8-12%)+ 品牌主色文字;disabled 不响应
  assert.match(client, /\.ci-mini:hover:not\(:disabled\)\{[^}]*background:var\(--ci-brand-soft\)[^}]*color:var\(--dsw-alias-brand-primary\)/)
  assert.match(client, /--ci-brand-soft:color-mix\(in srgb,var\(--dsw-alias-brand-primary\) 12%,transparent\)/)
  // primary / danger 变体 hover 各符合语义,无 filter 硬编码
  assert.match(client, /\.ci-mini\.primary:hover:not\(:disabled\)\{[^}]*background:color-mix\(in srgb,var\(--dsw-alias-button-primary-fill\)/)
  assert.match(client, /\.ci-mini\.danger:hover:not\(:disabled\)\{[^}]*color-mix\(in srgb,var\(--dsw-alias-state-error-primary\) 10%,transparent\)/)
  const miniHover = client.match(/\.ci-mini[^,{]*:hover[^}]*\}/g)!.join('\n')
  assert.doesNotMatch(miniHover, /filter:/)
  // 操作列不许 background:inherit —— 那是把半透明行底色(hover 6% / 已选 12%)在子盒里再画一遍,
  // 结果操作列位置多出一块更深的色块,看着像按钮自己带了 hover
  assert.doesNotMatch(client, /[;{]background:inherit/)
  assert.match(client, /\.ci-cell\.ci-ops-cell\{overflow:visible;min-width:0\}/)
  assert.match(client, /\.ci-ops\{display:flex;align-items:center;gap:8px;flex-wrap:nowrap;white-space:nowrap\}/)
  // 已选行的 hover 在自己的品牌色上加深,不被中性 hover 顶掉
  assert.match(client, /\.ci-row\.picked:hover\{background:var\(--ci-brand-soft-14\)\}/)
})

test('面板可窗口化 / 全屏:所有产品卡共用 PanelFrame,且不盖住自己的弹窗', () => {
  const client = read('src/client.js')
  assert.match(client, /function PanelFrame\(\{ title, className, children \}\)/)
  // 三态:inline / window / full,窗口态 portal 到 body
  assert.match(client, /const \[mode, setMode\] = useState\("inline"\)/)
  assert.match(client, /createPortal\(node, document\.body\)/)
  assert.match(client, /className: "ci-win" \+ \(full \? " full" : ""\)/)
  // 每个根视图都要接入,否则某些产品卡打不开窗口(数量与 kind 一起长)
  const frames = client.match(/h\(PanelFrame, \{ title: /g) || []
  assert.ok(frames.length >= 6, `PanelFrame 接入点只有 ${frames.length} 处`)
  assert.doesNotMatch(client, /className: "ci-root ci-tool/)
  // z-index 必须压在弹窗之下:否则面板内部的确认框/表单会被自己的窗口盖住
  assert.match(client, /--ci-z-window:30;--ci-z-modal:40/)
  assert.match(client, /\.ci-winframe\{position:fixed;inset:0;z-index:var\(--ci-z-window\)/)
  // 拖动按尺寸夹位置、缩放按位置夹尺寸;反过来会变成「往右下拉,窗口往左上跑」
  assert.match(client, /function clampWinRect\(rect, mode\)/)
  assert.match(client, /if \(mode === "size"\)/)
  assert.match(client, /clampWinRect\(\{ x: from\.x \+ dx, y: from\.y \+ dy, w: from\.w, h: from\.h \}, "move"\)/)
  assert.match(client, /\}, "size"\)/)
  // 手势挂 document:指针移出窗口边界后仍要跟手
  assert.match(client, /document\.addEventListener\("mousemove", onMove\)/)
  assert.match(client, /document\.addEventListener\("mouseup", onUp\)/)
  // Esc 非捕获,让内层弹窗先消费；只 preventDefault 的 Modal 也不能连带关闭窗口
  const frame = client.match(/function PanelFrame[\s\S]*?\n    function useOverlayKeys/)![0]
  assert.match(frame, /document\.addEventListener\("keydown", onKey\)\;/)
  assert.doesNotMatch(frame, /addEventListener\("keydown", onKey, true\)/)
  assert.match(frame, /e\.defaultPrevented/)
  assert.match(frame, /document\.querySelector\("\.ci-modal-mask,.ci-regionpop,.ci-more-menu,.ci-colfilter"\)/)
  // 浮层期间按引用计数锁宿主滚动，关闭任意一张卡不会提前解锁
  assert.match(client, /let bodyScrollLocks = 0/)
  assert.match(client, /function lockBodyScroll\(\)/)
  assert.match(frame, /const unlockBodyScroll = lockBodyScroll\(\)/)
  assert.match(frame, /unlockBodyScroll\(\)/)
  // 面板搬走后卡片要留占位,否则卡片塌成 0 高会把对话滚动条拽到底
  assert.match(frame, /className: "ci-win-away"/)
  assert.match(client, /\.ci-win-away\{[^}]*border:1px dashed/)
  // a11y:窗口是 dialog,标题栏按钮都有中文 title/aria-label
  assert.match(frame, /role: "dialog"/)
  assert.match(frame, /"aria-label": "在窗口中打开"/)
  assert.match(frame, /"aria-label": "全屏打开"/)
  assert.match(frame, /"aria-label": "还原为窗口"/)
  assert.match(frame, /"aria-label": "收回对话卡片"/)
  // 行为回归:node scripts/verify-list-layout/verify.mjs 走拖拽/缩放/全屏/弹窗层级
  assert.match(read('scripts/verify-list-layout/verify.mjs'), /window\.__winDrag\(/)
})
