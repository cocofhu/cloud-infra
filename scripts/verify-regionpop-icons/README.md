# RegionPicker 浮层原生搜索装饰自检(Chrome 像素级断言)

对应计划小目标 g1.2:在真实浏览器里确认 `.ci-regionpop-input`(type=search)展开后**不再渲染** WebKit 原生放大镜与 ✕ 清除图标,且占位符 / 过滤交互 / focus ring / 亮暗主题不受影响。

## 原理

1. `index.html` 提供最小 `window.__ModuleLoader__`,加载**真实构建产物** `lib/client.js`,取出插件工厂返回的 `SearchToolView`,以 CVM kind + 演示 regions 渲染真实 `RegionPicker`。
2. `control2.html` 是对照页:同一引擎下,一个带 `.fixed` 隐藏规则、一个不带,给像素阈值提供"有/无原生 ✕"的基线。
3. `verify.mjs` 用 chrome-headless-shell(CDP)驱动:展开浮层 → 空/非空/清空三个状态截图 → 对输入框端部条带做"相对局部背景的高对比油墨像素"统计 → 亮/暗主题各一轮。
4. 断言不依赖 `getComputedStyle(el, "::-webkit-search-*")`(Blink 内部伪元素在此 API 下不可靠),只信像素。

## 用法(仓库根)

```bash
pnpm install
pnpm build                       # 产出 lib/client.js
node scripts/verify-regionpop-icons/verify.mjs [/path/to/chrome-headless-shell]
```

Chrome 路径可用第一个参数或环境变量 `CHROME_BIN` 传入;缺省尝试常见安装位置(含 `/tmp/chrome/chrome-headless-shell-linux64/`)。

- 全部断言通过 → 退出码 0 并在 stderr 打 `PASS` 清单。
- 断言失败 → 退出码 1,`$TMPDIR/regionpop-icons-verify/shots/` 留有亮/暗主题浮层、输入框特写、基线对照截图供人工复核。

## 文件

- `index.html` — 插件挂载 harness(真实 lib/client.js + React UMD + 宿主 token 模拟,亮/暗主题)
- `control2.html` — 对照页(有/无隐藏规则各一)
- `drive-core.mjs` — 极简 CDP 客户端(静态服务 + chrome 进程 + Runtime.evaluate/截图/鼠标)
- `decode-png.mjs` — 无依赖 PNG 解码 + 相对背景油墨像素统计
- `verify.mjs` — 主脚本(基线 + 亮/暗主题 20 项断言)
