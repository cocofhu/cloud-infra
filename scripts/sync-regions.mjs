#!/usr/bin/env node
/**
 * sync 脚本 — 从腾讯云 DescribeRegions 拉最新地域清单,与共享 source diff,差异时更新文件。
 *
 * 用法:
 *   TENCENT_SECRET_ID=xxx TENCENT_SECRET_KEY=yyy node scripts/sync-regions.mjs [--write] [--product cos|cls|dbbrain]
 *
 * 设计:
 *   1. 调用云 API(用 tc3 签名,凭证通过 env 或 --secret-id/--secret-key)
 *   2. 与当前共享 source diff
 *   3. 打印人类可读 diff(打印 id/label/group/aliases 的 +/-),默认不写文件
 *   4. `--write` 时把 upstream 中多出的新 region 追加到 source(标注 TODO sync),aliases 冲突则报错中止
 *   5. 不写时也可成功退出,作为 CI/人工 review 入口
 *
 * 运行时拉失败语义:脚本不会用本地快照兜底 — 拉不到就直接报错退出(与运行时语义一致)。
 */

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const dir = dirname(fileURLToPath(import.meta.url))
const root = join(dir, '..')

function parseArgs(argv) {
  const args = { write: false, product: 'cos', secretId: '', secretKey: '', regionApi: '' }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--write') args.write = true
    else if (arg === '--secret-id') args.secretId = argv[++i] || ''
    else if (arg === '--secret-key') args.secretKey = argv[++i] || ''
    else if (arg === '--product') args.product = argv[++i] || 'cos'
  }
  if (!args.secretId) args.secretId = process.env.TENCENT_SECRET_ID || process.env.SECRET_ID || ''
  if (!args.secretKey) args.secretKey = process.env.TENCENT_SECRET_KEY || process.env.SECRET_KEY || ''
  return args
}

async function loadShared() {
  const mod = await import(new URL('../lib/providers/tencent/regions-shared.js', import.meta.url).href)
  return mod
}

async function loadFetch() {
  const mod = await import(new URL('../lib/providers/tencent/regions-fetch.js', import.meta.url).href)
  return mod
}

function renderDiff(current, merged) {
  const currentIds = new Set(current.map((row) => row.id))
  const mergedIds = new Set(merged.map((row) => row.id))
  const added = merged.filter((row) => !currentIds.has(row.id))
  const removed = current.filter((row) => !mergedIds.has(row.id))
  const kept = merged.filter((row) => currentIds.has(row.id))
  const lines = []
  if (added.length) {
    lines.push('新增地域:')
    for (const row of added) {
      lines.push(`  + ${row.id}  label=${row.label}  group=${row.group}  aliases=${JSON.stringify(row.aliases)}`)
    }
  }
  if (removed.length) {
    lines.push('移除地域:')
    for (const row of removed) lines.push(`  - ${row.id}  label=${row.label}`)
  }
  // alias 变化
  const aliasChanged = []
  for (const row of kept) {
    const old = current.find((r) => r.id === row.id)
    if (!old) continue
    const a = JSON.stringify([...(old.aliases || [])].sort())
    const b = JSON.stringify([...(row.aliases || [])].sort())
    if (a !== b || old.label !== row.label || old.group !== row.group) {
      aliasChanged.push({ id: row.id, from: old, to: row })
    }
  }
  for (const row of aliasChanged) {
    lines.push(`  ~ ${row.id}: labels ${row.from.label} → ${row.to.label}; aliases ${JSON.stringify(row.from.aliases)} → ${JSON.stringify(row.to.aliases)}`)
  }
  if (!lines.length) lines.push('共享数据源已是最新,无需修改。')
  return { added, removed, kept, lines }
}

function buildUpdatedSource(current, merged) {
  // 策略:新 id 直接追加到「海外」分组占位,人工 review 时再决定分组;
  // 保留现有 aliases(不删历史/不减少),只增不删。
  const appended = []
  for (const row of merged) {
    if (!current.some((r) => r.id === row.id)) appended.push(row)
  }
  if (!appended.length) return null
  return appended
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const shared = await loadShared()
  const fetch = await loadFetch()
  const product = args.product

  console.log(`[sync] 拉取 ${product} DescribeRegions ...`)
  let regions
  if (!args.secretId || !args.secretKey) {
    console.warn('[sync] 未提供凭证,跳过云端拉取。如需真实同步,请通过 TENCENT_SECRET_ID/TENCENT_SECRET_KEY 提供。')
    regions = []
  } else {
    try {
      regions = await fetch.fetchSharedRegions(product, { secretId: args.secretId, secretKey: args.secretKey }, { timeoutMs: 15000 })
    } catch (err) {
      console.error(`[sync] 拉取失败:${err.message}`)
      process.exit(1)
    }
  }

  const current = shared.TENCENT_REGIONS
  const merged = regions.length ? regions : current
  const diff = renderDiff(current, merged)
  console.log(diff.lines.join('\n'))
  console.log(`[sync] 合计: 现有 ${current.length} 项 / 拉取 ${merged.length} 项`)

  if (!diff.added.length && !diff.removed.length) return
  if (!args.write) {
    console.log('[sync] 未加 --write,不修改 regions-shared.ts。请 review 后再执行。')
    return
  }

  // 冲突检测:同一 alias 不能命中多个 id
  const conflicts = shared.detectAliasConflicts(merged)
  if (conflicts.length) {
    console.error('[sync] 别名冲突,拒绝合并:')
    for (const row of conflicts) console.error(`  "${row.alias}" 同时映射 ${row.first} 与 ${row.second}`)
    process.exit(1)
  }

  const toAppend = buildUpdatedSource(current, merged)
  if (!toAppend) {
    console.log('[sync] 无需写回。')
    return
  }

  // 把新项追加到 regions-shared.ts 中。简单的实现:在「特殊」分组条目之前插入「TODO sync 待归组」块
  const target = join(root, 'src/providers/tencent/regions-shared.ts')
  const src = readFileSync(target, 'utf8')
  const marker = '  // —— 特殊 ——'
  const insertion = toAppend.map((row) => (
    `  // TODO[sync]: 新区,请人工归类 group 与补全 aliases(当前以「海外」占位)\n` +
    `  {\n` +
    `    id: '${row.id}',\n` +
    `    label: '${row.label.replace(/'/g, "\\'")}',\n` +
    `    group: '海外',\n` +
    `    aliases: ${JSON.stringify(row.aliases)},\n` +
    `  },\n`
  )).join('')
  if (!src.includes(marker)) {
    console.error('[sync] 无法定位 regions-shared.ts 的插入锚点(marker 缺失),拒绝自动写回。')
    process.exit(1)
  }
  const next = src.replace(marker, `${insertion}${marker}`)
  writeFileSync(target, next)
  console.log(`[sync] 已把 ${toAppend.length} 个新 region 追加到 ${target}`)
  console.log('[sync] 建议下一步: git diff 检查变更,再 pnpm test 验证')

  // 写回后跑单测验证(失败即报错退出,与「失败即报错」一致)
  try {
    execSync('node --test lib/tests/*.test.js', { cwd: root, stdio: 'inherit' })
    console.log('[sync] pnpm test 通过。')
  } catch {
    console.error('[sync] pnpm test 失败,请人工 review 后修复。')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('[sync] 失败:', err.message)
  process.exit(1)
})
