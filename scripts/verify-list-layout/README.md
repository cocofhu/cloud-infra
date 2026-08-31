# 列表页布局自检(真实 Chromium)

挡住只有真渲染才量得出来的回归:地域文案被省略号吃掉、横向滚动条长在表头下沿、切 Tab 后地域串台、
加购之后没有出路、窗口化后拖拽/缩放不跟手或把自己的弹窗盖掉。

## 背景

**地域文案**:CVM / 轻量那条链会把地域归一成控制台全称(`广州` → `华南地区（广州）`),并且**用全称当 id** 传回后端做过滤,
所以不能改数据口径;`RegionPicker` 只在渲染层用 `shortRegionLabel()` 收窄成城市名,全称留在 `title` 与浮层里。
其它产品(CLS / CDB / TKE / TCR / DBbrain / COS)本来就是城市短名。

**滚动条位置**:实例表 `.ci-dense` 有 `min-width:980px`,窄卡片里必然出现横向滚动条。滚动条画在 `.ci-scroll` 的下沿,
所以空态提示如果放在 `.ci-scroll` 外面,容器就只包住表头,滚动条会紧贴表头下沿(看着像"表头上长了根滚动条")。
空态必须待在容器内,并用 `position:sticky;left:0` 让文案横滚时不被推出可视区。

**切 Tab**:云服务器与轻量的可用地域集合不同,清单和选中值必须按 Tab 分开;
切过去时地域要收敛到目标产品支持的一项,并且发给后端的必须是目标产品清单里的原文
(后端 `pickRegions` 按字符串比地域名)。harness 自带假后端,两条链刻意给不同的地域集合,
`supported` 判定跟后端一样严格 —— 之前它做了前缀宽松匹配,把「拿轻量的『清远』去查 CVM」这个 bug 盖住了。

## 八层断言

1. **逐 kind 挂载**:`cvm / lighthouse / cls / cdb / cluster / image / dbbrain / cos` 各挂一次,
   量所有 `.ci-regionpick`:宽度必须都是 140px,`.ci-regionpick-text` 的 `scrollWidth` 不得超过 `clientWidth`。
   某个 kind 数到 0 个胶囊也算失败(说明 harness payload 过期,或该产品的选择器被改掉了)。
2. **CVM 逐项点选**:打开浮层把每一项都选一遍,断言控制台全称在收起态收成了城市名、`title` 仍是全称、无一截断。
3. **表格滚动条**:`cvm / lighthouse` × 有数据 / 空结果 四种组合,断言容器确实横向可滚(`scrollWidth > clientWidth`)、
   滚动条占了高度(`offsetHeight - clientHeight > 0`);空结果时还要求 `.ci-empty` 在 `.ci-scroll` 内、
   容器底边落在空态之下、且空态为 `sticky`。
   另外对 `cdb / cos / cls / cvm` 量滚动容器底边是否贴着 `.ci-list-body` 下沿(行数少时 `ListPane` 撑出来的
   空白必须留在容器**内部**,否则滚动条浮在表格中间);再把卡片压到 560px 让 CDB 宽表真的横向溢出,
   直接量滚动条本身的位置,并截一张 `cdb-scrollbar.png`。
4. **切 Tab 链路**:CVM 选「清远信安」→ 切轻量(收敛到同城的「清远」+ 给说明 + 拿到数据)→
   看浮层列的是轻量自己的清单且文案口径统一 → 切回 CVM(换成 CVM 的写法去查、城市没变则不打扰用户)。
   另有两条回落:轻量没有的地域优先回到该 Tab 上次选过的地域;全新挂载时清单还没到,等结果回来自愈到广州。
5. **可注册查询卡**:精确匹配与「其他后缀」分段、加购不弹窗、行内移除、底部结算栏件数与合计、
   「去结算」开购物车弹窗;并量列表容器高度是否贴着内容(不留 160px 高度地板)。
6. **面板窗口化 / 全屏**:窗口撑开视口大半且面板填满窗口、标题栏拖拽跟手、右下角缩放只改尺寸不挪位置
   (缩小/放大/拉到边界三种)、往视口外拖会被夹住、双击标题栏进全屏、**全屏下「更多 → 关机」的确认框
   仍在最上层**(z-index + `elementFromPoint` 双判)、Esc 收回后宿主滚动解锁;各 kind 都有这两个入口。
7. **我的证书行内菜单**:已颁发行的操作列必须是「部署 / 下载 / 更多」,菜单是「重颁发 / 吊销 / 删除」;
   审核中行只有「更多」,菜单是「查看验证状态 / 取消审核」。菜单里出现「开机 / 关机 / 重启」即失败 ——
   证书菜单和实例电源菜单曾经都叫 `MoreMenu`,同作用域后者胜,证书行整块菜单被顶掉过。
8. **全量文案探针**:从 `regions-shared.ts` 与 `client.js` 正则捞出所有地域文案(当前 177 条),
   塞进真实 CSS 渲染的胶囊骨架里逐个量截断。

## 用法(仓库根)

```bash
pnpm build
node scripts/verify-list-layout/verify.mjs [/path/to/chrome-headless-shell]
```

截图落在 `$TMPDIR/list-layout-verify/shots/`(cvm 全称链、cls 短名链、cvm 空态滚动条、切 Tab 收敛说明、
域名注册结算栏、面板全屏、证书行内菜单、CDB 窄卡片滚动条各一张)。
运行前需要 `libgbm` / `libasound`(TencentOS:`dnf install -y mesa-libgbm alsa-lib`)。
