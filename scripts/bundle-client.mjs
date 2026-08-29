// 构建期把 echarts UMD 全量打进 lib/client.js。
// 需求约定:使用全量 echarts(不做 echarts/core 按需裁剪),由本仓 build 流程产出单文件客户端,
// 运行时不再从任何 CDN 拉取。做法:把 node_modules/echarts/dist/echarts.min.js 原样拼接在
// src/client.js 的 __ModuleLoader__.load(...) 包装之前,使浏览器加载该文件时先执行 echarts UMD
// (注册 window.echarts / globalThis.echarts),再执行插件工厂。
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const echartsPath = require.resolve('echarts/dist/echarts.min.js')
const echartsCode = readFileSync(echartsPath, 'utf8')
const clientCode = readFileSync(join(root, 'src/client.js'), 'utf8')

// 说明注释:记录 echarts 版本与来源,便于产物审计
const banner = `/* echarts ${require('echarts/package.json').version} bundled at build time (full build, no tree-shaking) */\n`
const out = `${banner}${echartsCode}\n;\n${clientCode}`
writeFileSync(join(root, 'lib/client.js'), out)
console.log(`[bundle-client] lib/client.js <= echarts.min.js(${(echartsCode.length / 1024).toFixed(0)}KB) + src/client.js(${(clientCode.length / 1024).toFixed(0)}KB) = ${(out.length / 1024).toFixed(0)}KB`)
