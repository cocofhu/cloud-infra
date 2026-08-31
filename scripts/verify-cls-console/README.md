# CLS 检索分析视觉自检(真实 Chromium)

对应 `docs/ui.md` 2.14:确认 CLS 检索分析页保持腾讯云控制台的三段式形态——检索条压成一行、
日志时间分布是真的 echarts 柱状图、原始日志是「时间 + 原文」两列可展开表格。

## 原理

1. `index.html` 提供最小 `window.__ModuleLoader__`,加载**真实构建产物** `lib/client.js`,取出插件工厂的
   `SearchToolView`,喂一个 `kind=cls & view=search` 的 payload(含 26 条构造日志:一半 JSON 结构化、
   一半 nginx 纯文本,时间刻意分布不均)。宿主 token 用与 `verify-regionpop-icons` 相同的一套模拟,
   并且**故意不定义** `--dsw-alias-shadow`(复刻宿主主题的真实情况)。
2. `verify.mjs` 用 chrome-headless-shell(CDP)驱动:量 `getBoundingClientRect`、读 canvas 像素、
   点「全部展开」,断言布局与图表,并输出亮/暗 + 折叠/展开 + 空态四张截图。

## 断言清单

- 检索条:语句框 / 时间范围 / 按钮同一行(`bar.height < 110`),时间范围恒为 128px,语句框 36px 起步
- 时间分布:`.ci-cls-chart` 内确有 canvas 且撑起 104px;抽样柱顶像素,柱高必须有多个不同值
- 原始日志:折叠态每行 ≤ 40px;长原文靠列表横向滚动(`scrollWidth > clientWidth` 且滚动条占了高度),
  时间列/原文列起点逐行一致、表头宽度跟着整表(subgrid 生效的判据);展开后字段两列对齐、摘要行隐藏
- 换行开关:开了之后填满可视宽度自己折行,列表不再横向滚动
- 原文去重:`content` 是字段 JSON 的那条展开后不贴原文,纯文本那条必须贴
- 暗色:柱子颜色从元素上已解析的 `color` 取,主题切换后仍是 rgb 值
- 空态:给出「该时间窗没有匹配日志」且不画空图

## 用法(仓库根)

```bash
pnpm build                       # 产出 lib/client.js
node scripts/verify-cls-console/verify.mjs [/path/to/chrome-headless-shell]
```

Chrome 路径可用第一个参数或 `CHROME_BIN` 传入;缺省尝试常见安装位置。截图落在
`$TMPDIR/cls-console-verify/shots/`。运行前需要 `libgbm` / `libasound`(TencentOS:
`dnf install -y mesa-libgbm alsa-lib`)。
