# src/ui — 前端 UI 基元目录(布局)

当前 cloud-infra 插件的 UI 代码是单文件 `src/client.js`(构建期被 bundle-client.mjs 拼入
echarts UMD 生成 lib/client.js)。本目录把"设计 token / 共享组件 / 视图约定"以
**文档形式**拆出,作为后续真正物理拆分的前置参考。

## 目录

| 文件 | 说明 |
|---|---|
| `src/ui/tokens.md` | `--ci-*` 设计 token 层完整定义与使用规则 |
| `src/ui/components/RegionPicker.md` | RegionPicker 共享组件的 props / 交互 / a11y 规范 |

## 当前组件(运行时仍位于 `src/client.js`)

- `Bar` / `BarCount` / `BarActions`(标题 / 计数 / 右侧操作)
- `Button`(`variant: primary | default | danger | ghost | link | mini`)
- `Tabs` / `SubTabs`(统一蓝色下划线选中)
- `Modal`(`role=dialog` + Esc 关闭 + 焦点归还)
- `Empty` / `Notice` / `Pagination`
- `Tag` / `Badge` / `Dot`
- `KeyValue` / `Section` / `Chip`
- `RegionPicker` — 全量使用,见 `components/RegionPicker.md`

## 符合度

- 0 处 `#[0-9a-f]{3,8}` 硬编码 hex(`grep -P '#[0-9a-fA-F]{3,8}' src/client.js` 必须为空)
- 0 处 `@media (prefers-color-scheme)`
- 圆角仅 6 档 `--ci-radius-{sm,md,lg,xl,2xl,pill}`
- 间距仅 4 的倍数 `--ci-space-{1..8}`
- 字号仅 `--ci-font-{xs..xl}`

## 后续拆分规划(G5.1)

待物理拆分(需要 build pipeline 支持):

```
src/ui/tokens.css.js   — 导出一个 const CSS_BLOCK = `...` 字符串(被 src/client.js 注入)
src/ui/components/*.js — Button / Tabs / Modal / RegionPicker 等(纯 UI,不依赖业务)
src/ui/views/*.js      — CosConsoleView / ClusterConsole / ClsCard / CdbManageView / InstanceDetailView / ImageToolView / DbbrainDetailView / Registrar 等
src/ui/index.js        — 聚合入口,组装成 factory 闭包内容
```

bundle-client.mjs 将调整为:把 `src/ui/index.js` 与 echarts 拼接产出 `lib/client.js`,src/client.js 保持为「当前形态」的镜像,供契约测试读取。
