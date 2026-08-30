import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 对象输入渲染回归:宿主经 tool.call.toolview 注入的 payload/props 可能把 {id,label}
 * 这类对象塞进本应渲染字符串的位置(region/regions/title/query 等),历史上直接交给
 * React 会渲染成 [object Object] 或触发受控组件告警。修复后渲染层(safeText/safeField
 * + normalizeListItems)必须保证任何脏输入都不会出现在最终 HTML 里。
 * 手法与 monitor-flow.test.ts 一致:捕获 lib/client.js factory → 取 SearchToolView →
 * react-dom/server 渲染 → 断言输出不含 [object Object]。
 */

const dir = dirname(fileURLToPath(import.meta.url))
const root = join(dir, '../..')
const require = createRequire(import.meta.url)

interface ModuleDef { id: string; factory: (req: (name: string) => unknown) => Record<string, unknown> }

let moduleLoadSeq = 0
async function loadSearchToolView(): Promise<(props: unknown) => unknown> {
  let captured: ModuleDef | undefined
  const w = globalThis as { window?: unknown; fetch?: unknown }
  const prevWindow = w.window
  const prevFetch = w.fetch
  w.window = {
    addEventListener() {},
    removeEventListener() {},
    __ModuleLoader__: {
      load(def: ModuleDef) { captured = def },
    },
  }
  // 首渲染 refreshSkip 会调用 api("meta") → fetch;测试环境必须可控且失败静默
  w.fetch = async () => ({ ok: false, status: 500, json: async () => ({}) })
  try {
    const url = pathToFileURL(join(root, 'lib/client.js')).href + `?t=${process.pid}-${++moduleLoadSeq}`
    await import(url)
  } finally {
    w.window = prevWindow
    w.fetch = prevFetch
  }
  assert.ok(captured, 'lib/client.js 应调用 window.__ModuleLoader__.load')
  const react = require('react')
  const fakeRequire = (name: string) => (name === 'react' ? react : require(name))
  const api = (captured as ModuleDef).factory(fakeRequire) as { SearchToolView?: unknown }
  assert.ok(typeof api.SearchToolView === 'function', 'factory 应暴露 SearchToolView')
  return api.SearchToolView as (props: unknown) => unknown
}

// DBbrain 实例管理首屏:payload.regions 为对象数组、payload.region 为对象、
// item.title 为对象——修复前标题/地域/输入框会出现 [object Object]。
test('dbbrain 首屏:对象型 region/regions/title/query 渲染为安全字符串', async () => {
  const view = await loadSearchToolView()
  const React = require('react') as { createElement: (...args: unknown[]) => unknown }
  const { renderToStaticMarkup } = require('react-dom/server') as { renderToStaticMarkup: (node: unknown) => string }
  const payload = {
    kind: 'cloud-infra-query',
    resourceKind: 'dbbrain',
    query: { id: 'q1' }, // 对象型 query → 输入框受控值不得为对象
    region: { id: 'ap-guangzhou', label: '华南地区（广州）' }, // 对象型 region
    regions: [{ id: 'ap-guangzhou', label: '华南地区（广州）' }, { id: 'ap-shanghai', label: '华东地区（上海）' }],
    total: 2,
    items: [
      {
        id: 'tencent.dbbrain:mysql:ap-guangzhou:cdb-1',
        kind: 'dbbrain',
        product: 'mysql',
        region: 'ap-guangzhou',
        title: { label: '生产主库' }, // 对象型标题 → safeField 取 label
        status: 'enable',
        columns: [
          { label: '状态', value: { text: 'ChineseLanguagePack' } }, // 对象型列值 → 兜底空串
          { label: '地域', value: { id: 'ap-guangzhou' } },
        ],
      },
      {
        id: 'tencent.dbbrain:mysql:ap-guangzhou:cdb-2',
        kind: 'dbbrain',
        product: 'mysql',
        region: 'ap-guangzhou',
        title: '灾备库',
        status: 'enable',
        columns: [{ label: '健康分', value: 96 }],
      },
    ],
  }
  const block = {
    kind: 'cloud_infra_query',
    call: { argsRaw: JSON.stringify({ kind: 'dbbrain', query: '' }) },
    result: payload,
  }
  const html = renderToStaticMarkup(React.createElement(view as never, { block }))
  assert.doesNotMatch(html, /\[object Object\]/, '渲染结果不得包含 [object Object]')
  assert.doesNotMatch(html, /ChineseLanguagePack/, '异常字段名不得透出')
  assert.match(html, /实例管理/, 'DBbrain 卡片标题应正常渲染')
  assert.match(html, /实例 ID \/ 名称/, '搜索框 placeholder 应正常渲染')
  assert.match(html, /生产主库/, '对象型标题应取 label 渲染')
  assert.match(html, /灾备库/, '正常字符串标题应原样渲染')
})

test('cvm 卡片:对象型 regions 注入 RegionSelect 不渲染 [object Object]', async () => {
  const view = await loadSearchToolView()
  const React = require('react') as { createElement: (...args: unknown[]) => unknown }
  const { renderToStaticMarkup } = require('react-dom/server') as { renderToStaticMarkup: (node: unknown) => string }
  const payload = {
    kind: 'cloud-infra-query',
    resourceKind: 'cvm',
    query: '',
    region: { id: 'ap-guangzhou' },
    regions: [{ id: 'ap-guangzhou', label: '华南地区（广州）' }, { id: 'ap-beijing', label: '华北地区（北京）' }],
    total: 1,
    items: [{
      id: 'tencent.cvm:ap-guangzhou:ins-1',
      kind: 'cvm',
      title: { label: 'web-01' },
      status: 'enable',
      columns: [],
    }],
  }
  const block = {
    kind: 'cloud_infra_query',
    call: { argsRaw: JSON.stringify({ kind: 'cvm', query: '' }) },
    result: payload,
  }
  const html = renderToStaticMarkup(React.createElement(view as never, { block }))
  assert.doesNotMatch(html, /\[object Object\]/)
  assert.match(html, /web-01/)
})

test('cdb 卡片:对象型 region 不进入 RegionComboById 受控值', async () => {
  const view = await loadSearchToolView()
  const React = require('react') as { createElement: (...args: unknown[]) => unknown }
  const { renderToStaticMarkup } = require('react-dom/server') as { renderToStaticMarkup: (node: unknown) => string }
  const payload = {
    kind: 'cloud-infra-query',
    resourceKind: 'cdb',
    query: '',
    region: { id: 'ap-guangzhou', label: '广州' },
    regions: [{ id: 'ap-guangzhou', label: '广州' }],
    total: 1,
    items: [{
      id: 'tencent.cdb:ap-guangzhou:cdb-x',
      kind: 'cdb',
      title: 'cdb-x',
      status: 'enable',
      columns: [],
    }],
  }
  const block = {
    kind: 'cloud_infra_query',
    call: { argsRaw: JSON.stringify({ kind: 'cdb', query: '' }) },
    result: payload,
  }
  const html = renderToStaticMarkup(React.createElement(view as never, { block }))
  assert.doesNotMatch(html, /\[object Object\]/)
  assert.match(html, /云数据库 MySQL/)
})

test('cls 卡片:对象型 region/regions 注入 ClsRegionSelect 不渲染 [object Object]', async () => {
  const view = await loadSearchToolView()
  const React = require('react') as { createElement: (...args: unknown[]) => unknown }
  const { renderToStaticMarkup } = require('react-dom/server') as { renderToStaticMarkup: (node: unknown) => string }
  const payload = {
    kind: 'cls',
    resourceKind: 'cls',
    query: '',
    region: { id: 'ap-guangzhou' },
    regions: [{ id: 'ap-guangzhou', name: { label: '广州' }, group: '大陆' }],
    total: 1,
    items: [{
      id: 'tencent.cls:ap-guangzhou:topic-1',
      kind: 'cls',
      title: 'nginx 访问日志',
      status: 'enable',
      columns: [],
    }],
  }
  const block = {
    kind: 'cloud_infra_query',
    call: { argsRaw: JSON.stringify({ kind: 'cls', query: '' }) },
    result: payload,
  }
  const html = renderToStaticMarkup(React.createElement(view as never, { block }))
  assert.doesNotMatch(html, /\[object Object\]/)
})

test('image(tcr) 卡片:对象型 regions 经 normalizeRegions 归一后不渲染 [object Object]', async () => {
  const view = await loadSearchToolView()
  const React = require('react') as { createElement: (...args: unknown[]) => unknown }
  const { renderToStaticMarkup } = require('react-dom/server') as { renderToStaticMarkup: (node: unknown) => string }
  const payload = {
    kind: 'image',
    resourceKind: 'image',
    query: '',
    region: { id: 'ap-guangzhou' },
    regions: [{ id: { id: 'ap-guangzhou' }, label: { label: '广州' } }],
    total: 1,
    items: [{
      id: 'tencent.image:ap-guangzhou:tcr-1',
      kind: 'image',
      title: { label: 'personal-registry' },
      status: 'enable',
      columns: [],
    }],
  }
  const block = {
    kind: 'cloud_infra_query',
    call: { argsRaw: JSON.stringify({ kind: 'image', query: '' }) },
    result: payload,
  }
  const html = renderToStaticMarkup(React.createElement(view as never, { block }))
  assert.doesNotMatch(html, /\[object Object\]/)
  assert.match(html, /personal-registry/)
})

test('safeText 边界:任意对象/数组/数字/null 输入均归一为字符串', async () => {
  // 通过 SearchToolView 的渲染结果间接验证;直接单测 safeText 走 factory 内部,这里用
  // 对象型 title 数字/数组/null 组合确认不抛错、不渲染 [object Object]。
  const view = await loadSearchToolView()
  const React = require('react') as { createElement: (...args: unknown[]) => unknown }
  const { renderToStaticMarkup } = require('react-dom/server') as { renderToStaticMarkup: (node: unknown) => string }
  const payload = {
    kind: 'cloud-infra-query',
    resourceKind: 'domain',
    query: ['a', 'b'], // 数组型 query
    regions: [],
    total: 3,
    items: [
      { id: 'tencent.domain:1', kind: 'domain', title: 123, status: 'enable', columns: [] },
      { id: 'tencent.domain:2', kind: 'domain', title: ['x'], status: 'pause', columns: [] },
      { id: 'tencent.domain:3', kind: 'domain', title: null, status: 'enable', columns: [] },
    ],
  }
  const block = {
    kind: 'cloud_infra_query',
    call: { argsRaw: JSON.stringify({ kind: 'domain', query: '' }) },
    result: payload,
  }
  const html = renderToStaticMarkup(React.createElement(view as never, { block }))
  assert.doesNotMatch(html, /\[object Object\]/)
  assert.match(html, />123</, '数字标题应渲染为字符串')
})
