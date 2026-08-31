# cloud-infra 共享 UI 组件与约定

本文档给 cloud-infra 插件的所有视图共享的 UI 基元。所有组件均通过「--ci-* 设计 token 层」把颜色 / 间距 / 圆角 / 字号 / 阴影映射到 DeepSeek Harness 宿主的 `--dsw-alias-` token，实现深色模式自动适配与视觉统一。

## 1. 设计 token 层(--ci-*)

所有卡片 / 视图都必须使用 `--ci-*` 语义 token,**禁止硬编码 hex**。token 的命名与来源:

### 颜色

| token | 语义 | 来源 |
|---|---|---|
| `--ci-fg` | 主文字 | `--dsw-alias-label-primary` |
| `--ci-fg-2` | 次要文字 | `--dsw-alias-label-secondary` |
| `--ci-fg-3` | 弱化文字 | `--dsw-alias-label-tertiary` |
| `--ci-fg-4` | 最弱文字(placeholder) | `--dsw-alias-label-caption` |
| `--ci-bg` / `--ci-bg-2` / `--ci-bg-3` | 三层背景 | `--dsw-alias-bg-layer-{1,2,3}` |
| `--ci-border` / `--ci-border-2` | 两级边框 | `--dsw-alias-border-l{1,2}` |
| `--ci-brand` / `--ci-brand-fill` / `--ci-brand-fg` | 品牌色 / 品牌填充 / 品牌反色 | `--dsw-alias-brand-primary` 家族 |
| `--ci-brand-soft` / `--ci-brand-soft-14` / `--ci-brand-ring` | 品牌色低饱和 / ring | color-mix 计算 |
| `--ci-success` / `--ci-success-bg` | 成功 | `--dsw-alias-state-success-*` |
| `--ci-warn` / `--ci-warn-bg` | 警告 | `--dsw-alias-state-warn-*` |
| `--ci-error` | 错误 | `--dsw-alias-state-error-primary` |
| `--ci-info` / `--ci-info-bg` | 信息(默认 brand) | brand 派生 |

### 圆角比例尺

统一的圆角只允许使用以下 6 档:

| token | 值 | 适用 |
|---|---|---|
| `--ci-radius-sm` | 4px | 小按钮 / Tag |
| `--ci-radius-md` | 6px | Chip / 输入控件 |
| `--ci-radius-lg` | 8px | 按钮 / 输入 / 卡片 |
| `--ci-radius-xl` | 12px | 面板 / 卡片 |
| `--ci-radius-2xl` | 14px | Modal / 大型卡片 |
| `--ci-radius-pill` | 999px | 胶囊(RegionPicker 等) |

### 间距比例尺(4 的倍数)

`--ci-space-1`(4)/`--ci-space-2`(8)/`--ci-space-3`(12)/`--ci-space-4`(16)/`--ci-space-5`(20)/`--ci-space-6`(24)/`--ci-space-7`(32)/`--ci-space-8`(40)。

### 字号

`--ci-font-xs`(12)/`--ci-font-sm`(13)/`--ci-font-md`(14)/`--ci-font-lg`(16)/`--ci-font-xl`(18)。

### 阴影与层级

`--ci-shadow-0`(滑块 / 分段选中)/ `--ci-shadow-1`(菜单)/ `--ci-shadow-2`(浮层与弹窗),`--ci-mask`(弹窗遮罩),
`--ci-z-modal`(40)/ `--ci-z-popover`(60)。

宿主主题**没有** `--dsw-alias-shadow`,引用它的 `box-shadow` 整条无效,所以阴影一律走上面三档 token;
遮罩取 `--dsw-alias-bg-mask-1` 而不是 `bg-mask-3`(后者是 48% 纯黑,插件嵌在对话卡片里会把整张卡压暗)。

## 2. 共享组件(props 签名 + 用法)

所有组件均定义在 `src/client.js`(单 factory 闭包)中,可通过 `h(XXX, props)` 直接使用。下面列出每个的语义。

### 2.1 Bar — 顶栏(标题 + 计数 + 操作)

```js
h(Bar, {
  title: "集群",
  count: 12,
  left: null,          // 可选额外左侧节点
  actions: [           // 可选右侧操作区
    h(Button, { variant: "default", onClick: refresh }, "刷新"),
    h(Button, { variant: "primary", onClick: create }, "新建"),
  ],
})
```

输出 `.ci-bar` > `.ci-bar-left`(标题+计数+自定义) + `.ci-bar-actions`。

### 2.2 Button — 按钮(三档权重)

`variant` 取值:

| 值 | 语义 | 样式 |
|---|---|---|
| `primary` | 详情页**唯一主操作**(≤1 个) | 品牌填色 |
| `default` | 次要操作 | 描边 |
| `danger` | 危险操作 | 描边红字 |
| `ghost` | 无背景 low-emphasis | 仅 hover 有底 |
| `link` | 文本链 | 仅品牌色文字 |
| `mini` | 小号按钮(28px) | 同 default 描边 |

```js
h(Button, { variant: "primary", onClick: save }, "保存")
h(Button, { variant: "danger", onClick: del }, "删除")
```

### 2.3 Tabs / SubTabs — 统一蓝色下划线 Tab

```js
h(Tabs, {
  items: [{ id: "basic", label: "基本信息" }, { id: "node", label: "节点" }],
  active: tab,
  onPick: (id) => setTab(id),
})
```

视觉 = **2px 品牌色下划线 + 品牌色文字**,等同腾讯云控制台 Detail 页 Tab。已自动应用:
- TKE 详情(基本 / 节点 / 节点池 / 命名空间 / 组件 / 授权 / 策略 / 运维)
- CDB 11 页签(实例详情 / 监控 / 数据库 / 参数 / 任务 / 备份 / 日志 / 账号 / 安全组 / 只读 / 连接)
- DBbrain 诊断优化分组
- CLS 检索分析(主题列表 / 检索分析)
- TCR 实例 / 命名空间 / 镜像仓库
- CVM / Lighthouse 双 Tab

`SubTabs` 是 Tabs 的紧凑版(继承同一 CSS 基调)。

### 2.4 Modal — 弹窗(遮罩 + Esc + 焦点圈定 + 焦点归还)

```js
h(Modal, {
  open: !!confirm,
  title: "删除集群",
  onClose: () => setConfirm(null),
},
  h("p", null, "确认删除该集群?该操作不可恢复。"),
  h("div", { className: "ci-modal-actions" },
    h(Button, { variant: "default", onClick: () => setConfirm(null) }, "取消"),
    h(Button, { variant: "danger", onClick: deleteIt }, "删除")),
)
```

特性:`role=dialog` + `aria-modal=true` + Esc 关闭 + 打开时焦点入、关闭焦点归。`width: "wizard"` 时切换为宽体向导容器。

### 2.5 Empty — 空态

```js
h(Empty, { text: "该地域下没有存储桶", hint: "试试切换地域", actionLabel: "重试", onAction: retry })
```

### 2.6 Notice — 行内提示

`type: "info" | "warn" | "error"`。例:

```js
h(Notice, { type: "error" }, "拉取地域失败,请稍后重试")
```

### 2.7 Pagination — 分页

```js
h(Pagination, { page: 3, pages: 8, total: 256, onPage: go });
```

### 2.8 Tag / Badge / Dot — 状态标识

```js
h(Tag, { type: "ok" }, "正常")
h(Tag, { type: "warn" }, "即将到期")
h(Tag, { type: "error" }, "已过期")
h(Dot, { type: "success" })
```

### 2.9 KeyValue — 键值对

```js
h(KeyValue, { pairs: [["实例 ID", "ins-xxx"], ["地域", "广州"], ["可用区", "二区"]], cols: 2 })
```

### 2.10 Section — 分块

```js
h(Section, { title: "基本信息", extra: h(Link, {}, "更多") },
  h(KeyValue, { pairs: [...] }),
)
```

### 2.11 Chip — 选中 Chip

```js
h(Chip, { on: id === active, onClick: () => pick(id) }, "全部")
```

### 2.12 RegionPicker — 共享地域选择(G2.6)

所有 13 张卡唯一地域选择组件。**胶囊按钮(默认广州) + 搜索 + 分组 + 端口浮层**。

```js
h(RegionPicker, {
  regions: DBBRAIN_REGIONS,      // RegionOption[];来自共享 regions-shared.ts
  value: region,                  // string (region id) 或 {id, label}
  regionAsString: true,           // 默认 true,onChange(id)
  placeholder: "选择地域",
  inputId: "ci-cdb-region",       // 可选,便于自动化测试
  disabled: false,
  onChange: (idOrRegion) => setRegion(...),
})
```

特性:
- 默认 `value = DEFAULT_REGION = "ap-guangzhou"`(由上层的 useState 初始化承担)
- 数据源:统一从 `regions-shared.ts` 的 `TENCENT_REGIONS`(21 项)做 subset;个别产品直接用自己的静态数组
- 浮层 = SearchInput 自动 focus + 分组(大陆/港澳台/海外/金融/特殊)+ 模糊匹配(中文 / 拼音 / 英文缩写 / id,大小写不敏感)
- 键盘 ↑↓ 移动 / Enter 选中 / Esc 关闭
- Portal 到 `document.body`,避免卡片 `overflow:hidden` 裁切
- A11y:`aria-haspopup="listbox"` + `aria-expanded` + `role=listbox|option` + 焦点归还

### 2.13 SearchInput — 胶囊搜索框

复用 `.ci-search-wrap > .ci-search` 模式(`SearchField` 组件),已统一:
- 白底 + 1px `--ci-border-2` 边框 + 内嵌 SVG icon
- focus 时 `--ci-brand` 边 + 4px 外发光(`--ci-brand-ring`)
- 不再使用灰底 / 双边框样式

### 2.14 CLS 检索分析 — 控制台三段式

`ClsCard` 的 `view === "search"` 分支按腾讯云 CLS 控制台的三段式排布,类名与职责:

| 区块 | 类名 | 要点 |
| --- | --- | --- |
| 检索条 | `.ci-cls-bar` | 一行放齐语句框 / 128px 时间范围 / 主按钮;`.ci-cql` 单行起步,随输入长到 120px |
| 时间分布 | `.ci-cls-dist` + `LogHistogram` | echarts 柱状图,桶宽由 `CLS_BUCKET_STEPS` 取整到秒/分/时刻度,空桶不画柱 |
| 原始日志 | `.ci-logtable` + `ClsLogRow` | `20px / 172px / max-content` 三列(展开箭头、时间、原文),sticky 表头,逐条展开出 `.ci-logkv` 字段表 |

约定:
- 长原文**允许列表自己横向滚动**,不再一律截成省略号:第三列取 `max-content`,`.ci-logtable` 自己 `overflow:auto`。
  表头与每一行用 `grid-template-columns:subgrid` 借外层网格的列 —— 各行若自行 `max-content`,列会逐行错位、
  表头背景也会在右侧断掉。`@supports not (subgrid)` 兜底退回固定三列 + 省略号(宁可截断也不要错位)。
- 开「换行」时用 `:has(.ci-logrow.wrap)` 把第三列换回 `minmax(0,1fr)`,填满可视宽度自己折行,此时没有横向滚动。
- 卡片里不写实现说明(「不写设置」「仅当前对话」「点检索分析仍在这张卡片里打开」这类文案已移除),
  页脚只留真正的信息量(如 `原始日志倒排 · N 条`)。
- 柱子颜色不写死,`LogHistogram` 读 `.ci-cls-chart` 上已解析的 `color`(canvas 不认 `var()`)交给 echarts,明暗自动跟随。
- 结构化日志展开后只列字段表;`content` 是 fields 的 JSON 原文时不再重复贴一遍原文。
- `换行` / `全部展开` 两个开关在表头右侧(`.ci-cls-tools`),分别控制 `.ci-logrow.wrap` 与逐条展开态。
- **续拉靠触底,不放「继续拉取」按钮**:`.ci-logtable` 自己就是滚动容器,离底 96px 内即取下一页。
  三个坑:①`logBusy` 是 state,同一帧的连续 `scroll` 事件读到的都是旧值,必须再用 `moreLock` ref 上锁,
  否则一次触底会用同一个 CLS `Context` 打出好几个请求;②首屏不足一屏时滚不动、永远等不到 `scroll` 事件,
  要用 effect 补到能滚为止;③底部提示行只在**真的在取**时出现(`.ci-log-more`,sticky left 跟着横向滚动),
  空闲不留提示、取完也不留「没有更多」,列表底部就是最后一条日志。
- 视觉回归:`node scripts/verify-cls-console/verify.mjs [chrome]`(真实 Chromium + 真实构建产物,断言 + 亮/暗截图)。

### 2.15 宽表横向滚动 — 滚动条只能长在表格底部

实例表 `.ci-dense` 有 `min-width:980px`,窄卡片里必然出现横向滚动条。滚动条画在 `.ci-scroll` 的**下沿**,
所以凡是与表格同属一块的内容(尤其是空态 `.ci-empty`)都必须放进 `.ci-scroll` 里:
放到外面时容器就只包住 `<thead>`,滚动条会紧贴表头下沿,看着像"表头上长了根滚动条"。

- `.ci-scroll > .ci-empty` 带 `position:sticky;left:0`,横滚表头时提示文案不会被推出可视区。
- 契约由 `client-contract.test.ts` 做括号配平检查(空态节点必须落在 `.ci-scroll` 的调用范围内)。
- 视觉回归:`node scripts/verify-list-layout/verify.mjs [chrome]`,空/非空各量一次滚动条位置。

### 2.16 实例卡双 Tab — 地域按 Tab 独立

云服务器与轻量的可用地域**不是一套**(同一账号实测 CVM 44 个 / 轻量 18 个,`清远信安`、`上海自动驾驶云`
这类专区只有 CVM 有),两边的文案口径也不同(CVM 给 `华南地区（广州）`,轻量给 `广州`)。所以:

- 地域清单按 Tab 缓存在 `regionCache`(ref,因为切 Tab 后同一轮就要发请求),切 Tab 立刻换成目标产品的清单。
- 选中地域由 `resolveRegionForOptions()` 收敛:同一地域 → 同城异写 → 同城专区回落主城(`清远信安` → `清远`)
  → 该 Tab 上次选过的(`regionMemo`)→ 该 Tab 默认(广州优先)。
- **发给后端的一定是目标产品清单里的原文**:后端 `pickRegions` 按字符串比 `region` / `regionName`,
  拿轻量的 `广州` 去查 CVM 会一条都查不到。
- 只有城市真的变了才提示(`.ci-region-note`,次要文字色不是红字);纯写法差异静默处理。
  提示文案由 `regionFix` + 当前 Tab/地域推导,用户改地域或切 Tab 后自然消失,不需要清理逻辑。
- `tabToKind()` 对实例卡一律按 Tab 决定查哪个产品;卡片自己的 `kind` 只决定初始 Tab。
- 视觉与行为回归:`node scripts/verify-list-layout/verify.mjs [chrome]`(假后端给两条链不同地域集合,
  完整走「CVM 选清远信安 → 切轻量 → 切回」这条链)。

### 2.17 域名注册卡 — 加购之后必须还有出路

原来的链路是断的:点「立即加购」会立刻弹出购物车弹窗(连着加几个域名就被反复打断),关掉之后那一行只剩
一个灰掉的「已加购」,想结算得回顶栏找那个小小的 `购物车(1)` 文字链。现在:

- **加购不弹窗**,`addCart` 只改 state;已加购的行原地变成可点的 **移除**,行底色用 `--ci-brand-soft`,
  域名后跟一枚 `已加购` 标签。
- 结算入口是列表下沿常驻的 `.ci-cartbar`(件数 + 合计 + 清空 / 去结算),**去结算** 才打开购物车弹窗。
- 后端补出来的同名其它后缀带 `extras.suggested`,前端拆成两段,中间插 `.ci-subhead`「其他后缀」,
  免得看着像用户没搜过的东西混进了结果。
- 这张卡不翻页(一次最多几行),所以 `ListPane` 传 `compact` 去掉 160px 高度地板,页脚也不放 `Pager`
  —— 否则单行结果下面是一大块空白加一句「共 1 条」。
- 状态列用 `.ci-st`:可注册绿、溢价/敏感词黄、`已被注册` 走中性灰(后端那边它是 `error`,
  但对用户只是个事实,不该用报错色)。
- 关键字不是域名时空态直接说清怎么输(`registrarEmptyHint`),不再一律「没有匹配的资源」。
- 行为回归:`node scripts/verify-list-layout/verify.mjs [chrome]` 走完「加购 → 再加一个 → 行内移除 →
  去结算开弹窗」,并量列表容器高度是否贴着内容。

### 2.18 面板窗口化 / 全屏(PanelFrame)

对话卡片只有几百像素宽,实例表 `min-width:980px`、监控图、CLS 原始日志在里面永远要横向滚。
`PanelFrame` 把**同一棵面板**搬到 `body` 上的浮层里,面板自己完全不知道这件事:

- 三态 `inline / window / full`。inline 时卡片右上角一条极轻的图标条(`.ci-winctl`,只有图标+`title`);
  window 时 portal 到 body,标题栏可拖、右/下/右下三个把手可缩放、双击标题栏切全屏;full 铺满视口
  (宽屏上内容 `max-width:1440px` 居中,不把表格拉成一条)。
- **z-index 必须压在 `--ci-z-modal` 之下**(`--ci-z-window:30`)。面板内部的确认框 / 表单弹窗 / 地域浮层
  都是 portal 到 body 的独立层,窗口一旦盖过去,「更多 → 关机」这类写操作就点不了了。
- **拖动按尺寸夹位置,缩放按位置夹尺寸**(`clampWinRect(rect, mode)`)。用同一套夹法会出现
  「往右下拉把手,窗口反而向左上跑」——因为超出视口时它去改的是 x/y。
- 手势的 `mousemove/mouseup` 挂在 `document` 上,指针移出窗口边界后仍然跟手。
- Esc 用**非捕获**监听:内层弹窗是捕获阶段 + `stopPropagation`,先消费掉,不会一次关两层。
- 浮层打开期间锁 `body` 滚动(鼠标在遮罩上滚会把身后的对话流带跑),关闭时还原原值。
- 面板搬走后卡片里留 `.ci-win-away` 占位:卡片塌成 0 高会被对话流的「贴底」判定捕获,滚动条直接跳到最下面
  (与 §2.15 的 `ListPane` 同一个坑)。
- 新增产品卡时必须用 `PanelFrame` 而不是裸 `div.ci-root`:单测按接入点数量与 `ci-root ci-tool` 的消失来卡。
- 行为回归:`node scripts/verify-list-layout/verify.mjs [chrome]` —— 拖拽/缩放跟手与夹边、双击全屏、
  全屏下「更多 → 关机」确认框仍在最上层(z-index + `elementFromPoint` 双判)、Esc 收回后滚动解锁。

### 2.19 行内菜单 — 同名组件会被后声明者整体顶掉

`client.js` 是一个大工厂函数,所有组件都是同一作用域里的函数声明。同名声明**后者胜**,
而且没有任何报错:证书菜单 `MoreMenu` 和实例电源菜单 `MoreMenu` 撞名之后,
证书行的「更多」渲染出的是「开机 / 关机 / 重启」——吊销、重颁发、删除全部消失,
点开机还会真的往 CVM 打请求。

- 组件按业务前缀命名:`CertMoreMenu` / `InstanceMoreMenu` / `ClusterMoreMenu`,不留裸 `MoreMenu`。
- 单测直接禁止重名:扫 `^ {4}function (\w+)`,出现重复即失败(`client-contract.test.ts`)。
- 行为回归:harness 挂 `kind=cert`,按文案核对已颁发行(重颁发/吊销/删除)与审核中行
  (查看验证状态/取消审核),菜单里出现电源项即失败。

### 2.20 下载类操作 — 内容拿不到就退到临时链接

证书下载有两个互不相干的 CAM 权限:`ssl:DownloadCertificate`(直接回 base64 zip)与
`ssl:DescribeDownloadCertificateUrl`(回 COS 临时链接,控制台走的是这条)。
只授了后者时前者必然 `AuthFailure.UnauthorizedOperation`,而这个码落到 `AuthFailure` 的兜底文案上
会变成「请检查设置中的密钥」——密钥是对的,少的是授权,用户会去翻一遍没问题的 AKSK。

- 后端顺序尝试,只对「未授权」兜底,其它错误照旧抛出。
- `AuthFailure.UnauthorizedOperation` 在 `safe-error` 里单列,文案是「当前密钥没有该操作的权限」。
- 前端 `triggerDownload(filename, content, contentType, href)`:拿到 `href` 时**不能**用 `a[download]`,
  跨域链接会忽略该属性,靠对象存储自己的 `Content-Disposition` 落盘,所以开新标签页
  (`target=_blank` + `rel=noopener noreferrer`,且只认 `https:`)。

## 3. 动画 / 视觉统一规则

1. **不要写 inline style 覆盖 Button 颜色**,只能传 variant。
2. **不要在视图中 inline 设置 border-radius**,统一走 `--ci-radius-*`。
3. **不要写 `#[0-9a-f]` hex**。brand 变化时所有视图自动同步。
4. **`<select>` 原生控件仅用于 secondary 场景**;地域选择必须使用 `RegionPicker`。
5. **详情页右上操作区最多 1 个 `variant=primary`**。其他操作走默认描边或 link / danger。

## 4. 深色模式 / 无障碍

- 所有颜色从 `--ci-*` → `--dsw-alias-*` 派生,无需关心明暗,Harness 切换主题自动跟随。
- 可聚焦元素都具备 `:focus-visible` ring。
- 交互控件必须是 `<button>` / `<a>` / `<input>` / `<label>` / `<select>` 语义元素,click-on-div 不存在。
- Modal / RegionPicker 提供能到出口的键盘链(Esc/↑↓/Enter/Tab)。
