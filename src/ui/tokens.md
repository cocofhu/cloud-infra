# src/ui/token 层 — --ci-* 语义 token(索引)

`src/client.js` 顶部的 CSS 块即"设计 token 层"。本文档把它抽出独立成文,便于查阅与
后续按 src/ui/tokens.css.js 拆出。

## --ci-* → --dsw-alias-* 映射

```css
.ci-root {
  /* 前景 */
  --ci-fg:    var(--dsw-alias-label-primary);
  --ci-fg-2:  var(--dsw-alias-label-secondary);
  --ci-fg-3:  var(--dsw-alias-label-tertiary);
  --ci-fg-4:  var(--dsw-alias-label-caption);

  /* 背景三层 */
  --ci-bg:    var(--dsw-alias-bg-layer-1);
  --ci-bg-2:  var(--dsw-alias-bg-layer-2);
  --ci-bg-3:  var(--dsw-alias-bg-layer-3);

  /* 边框 */
  --ci-border:   var(--dsw-alias-border-l1);
  --ci-border-2: var(--dsw-alias-border-l2);

  /* 品牌 */
  --ci-brand:       var(--dsw-alias-brand-primary);
  --ci-brand-fill:  var(--dsw-alias-button-primary-fill);
  --ci-brand-fg:    var(--dsw-alias-label-primary-foreground);
  --ci-brand-soft:  color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);
  --ci-brand-soft-14: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent);
  --ci-brand-ring:  color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, transparent);

  /* 状态 */
  --ci-success:     var(--dsw-alias-state-success-primary);
  --ci-success-bg:  var(--dsw-alias-state-success-tertiary);
  --ci-warn:        var(--dsw-alias-state-warn-label);
  --ci-warn-bg:     var(--dsw-alias-state-warn-tertiary);
  --ci-error:       var(--dsw-alias-state-error-primary);
  --ci-info:        var(--dsw-alias-brand-primary);
  --ci-info-bg:     color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent);

  /* 圆角 6 档 */
  --ci-radius-sm:   4px;
  --ci-radius-md:   6px;
  --ci-radius-lg:   8px;
  --ci-radius-xl:   12px;
  --ci-radius-2xl:  14px;
  --ci-radius-pill: 999px;

  /* 间距 4 的倍数 */
  --ci-space-1: 4px;  --ci-space-2: 8px;  --ci-space-3: 12px;
  --ci-space-4: 16px; --ci-space-5: 20px; --ci-space-6: 24px;
  --ci-space-7: 32px; --ci-space-8: 40px;

  /* 字号 */
  --ci-font-xs: 12px; --ci-font-sm: 13px; --ci-font-md: 14px;
  --ci-font-lg: 16px; --ci-font-xl: 18px;

  /* 阴影与层级 */
  --ci-shadow-1: var(--dsw-alias-shadow);
  --ci-shadow-2: 0 8px 24px rgba(0, 0, 0, .16);
  --ci-z-modal: 40;
  --ci-z-popover: 60;
  --ci-z-toast: 80;
}
```

## 使用规则

1. **颜色全部走 `--ci-*`,不允许硬编码 hex。** grep 检查:`#[0-9a-fA-F]{3,8}` 必须为 0 处。
2. **圆角只用 6 档**,例外须注释(Badge 999px):
   `sm(4)|md(6)|lg(8)|xl(12)|2xl(14)|pill(999)`。
3. **间距用 `--ci-space-N`(4 的倍数)**,4 / 8 / 12 / 16 / 20 / 24 / 32 / 40。
4. **字号走 `--ci-font-*`**,除 echarts 内部不再硬编码。
5. **dark mode 由宿主**:`prefers-color-scheme` 已被删除。

## 已清理项

- 旧的 `--cls-blue / --cls-line / --cls-sub / --cls-head` 私有(在 CLS 视图内)全部并入 `--ci-*`。
- 旧 `.ci-image` 内的 `#0f1419 / #f7f8fb` 反色兜底被删除,完全依赖 `--dsw-alias-*`。
- 旧 ci-tabs 卡片式分段样式被替换为统一「2px 品牌色下划线」。
