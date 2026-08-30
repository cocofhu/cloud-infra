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

`--ci-shadow-1` / `--ci-shadow-2`,`--ci-z-modal`(40)/ `--ci-z-popover`(60)。

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
