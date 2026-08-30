# RegionPicker 共享地域选择组件

**位置:** `src/client.js` 中 `function RegionPicker({...})`(组件基元层)。

所有产品卡片唯一的地域选择器,代替过去 COS/TKE/CVM/CLS/CDB/DBbrain/TCR 各自的实现。

## props

```js
h(RegionPicker, {
  regions: RegionOption[],        // [{id, label, aliases?, group?}]
  value:   string | RegionOption, // region id 或 对象
  onChange: (id | RegionOption) => setRegion(...),
  regionAsString:  true,          // 默认 true,onChange 回调传 id
  placeholder:    "选择地域",     // 关闭态空值显示
  disabled:        false,
  inputId:         "ci-cdb-region", // 可选,测试 id
  additionalStyle: { width: 180 },  // 透传到按钮
})
```

`RegionOption` 结构与 `src/providers/tencent/regions-shared.ts` 中的 `TENCENT_REGIONS` 相同,只多一个
`aliases`(用于模糊搜索)与 `group`(用于分组展示)。

## 交互

- 关闭态显示胶囊按钮 `🌍 广州 ▾`,高度 30px,圆角 999px(pill)。
- 点击展开浮层(Portal 到 `document.body`),自动 focus 搜索框。
- 顶部输入框 placeholder:`搜索地域:中文 / 拼音 / 缩写 / id`,大小写不敏感。
- 搜索匹配:id / label / aliases 任一命中,即保留;``aliases`` 包含 `gz / guangzhou / canton / bj / beijing / sh / shanghai / 广州 / 北京 / 香港 / hkg` 等。
- 下方按 `大陆 / 港澳台 / 海外 / 金融 / 特殊`(共享 GROUP_ORDER)分组显示。
- 每行 = label 中文 + id code 灰字;选中项高亮(`aria-selected=true`)。
- 键盘:`↑` / `↓` 移动高亮 / `Enter` 选中 / `Esc` 关闭并归还焦点至按钮 / `Tab` 离开(浮层自动关)。
- 0 命中:`未匹配到地域` 空态。
- Portal 到 `document.body`,浮层不会被卡片 `overflow:hidden` 裁切。

## a11y

```
button     →  aria-haspopup="listbox" + aria-expanded
浮层 panel  →  role="listbox"
每行       →  role="option" + aria-selected
```

## 覆盖的产品卡片

| 卡片 | 实例化位置 | 数据源 |
|---|---|---|
| COS  | `CosRegionCombo` | `TENCENT_REGIONS`(COS subset) |
| TKE  | `ClusterConsole` | `TKE_REGIONS` |
| CLS  | `ClsRegionSelect` | `clsRegionGroups(...)` |
| CDB  | 实例列表 bar | `CDB_REGIONS`(允许「全部地域」特殊项) |
| TCR  | `ImageToolView` | `TCR_REGIONS` |
| DBbrain | 顶部筛选行 | `DBBRAIN_REGIONS` |
| CVM / Lighthouse / Auto | `RegionSelect` | `TENCENT_REGIONS` 兼容「all」 |

## 默认值

调用方需自行在 state 初始化时赋 `DEFAULT_REGION = "ap-guangzhou"`(`regions-shared.ts` 导出)。
RegionPicker 内部**不**在 value 为空时硬编码默认 — 空 → 展示 placeholder。
