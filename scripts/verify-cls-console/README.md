# CLS 检索分析视觉自检(真实 Chromium)

对应 `docs/ui.md` 2.14:确认 CLS 检索分析页保持腾讯云控制台的三段式形态——检索条压成一行、
日志时间分布是真的 echarts 柱状图、原始日志是「时间 + 原文」两列可展开表格。

## 原理

1. `index.html` 提供最小 `window.__ModuleLoader__`,加载**真实构建产物** `lib/client.js`,取出插件工厂的
   `SearchToolView`,喂一个 `kind=cls & view=search` 的 payload(含 26 条构造日志:一半 JSON 结构化、
   一半 nginx 纯文本,时间刻意分布不均)。宿主 token 用与 `verify-regionpop-icons` 相同的一套模拟,
   并且**故意不定义** `--dsw-alias-shadow`(复刻宿主主题的真实情况)。
2. `index.html` 还带一个假后端(只接 `/cloud-infra`):`search` 按 CLS 的 `Context` 游标发页,
   并记录每次请求的 context —— 触底续拉一旦锁失效,同一个 context 会被打出好几次,这里能抓到。
3. `verify.mjs` 用 chrome-headless-shell(CDP)驱动:量 `getBoundingClientRect`、读 canvas 像素、
   点「全部展开」、把日志容器滚到底,断言布局、图表与续拉,并输出亮/暗 + 折叠/展开 + 空态四张截图。

## 断言清单

- 检索条:语句框 / 时间范围 / 按钮同一行(`bar.height < 110`),时间范围恒为 128px,语句框 36px 起步
- 时间分布:`.ci-cls-chart` 内确有 canvas 且撑起 104px;抽样柱顶像素,柱高必须有多个不同值
- 原始日志:折叠态每行 ≤ 40px;长原文靠列表横向滚动(`scrollWidth > clientWidth` 且滚动条占了高度),
  时间列/原文列起点逐行一致、表头宽度跟着整表(subgrid 生效的判据);展开后字段两列对齐、摘要行隐藏
- 换行开关:开了之后填满可视宽度自己折行,列表不再横向滚动
- 原文去重:`content` 是字段 JSON 的那条展开后不贴原文,纯文本那条必须贴
- 触底续拉:没有「继续拉取」按钮与 `.ci-footbar`;空闲时底部不留提示行;一次触底连派 5 个 `scroll`
  只能产生 1 个请求(锁生效),取的过程中底部出现「加载更多日志…」,取完提示行收掉;
  取到最后一页后再怎么滚都不再请求;首屏只有 2 条(滚不动、没有 scroll 事件)时由 effect 自动补到能滚
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
