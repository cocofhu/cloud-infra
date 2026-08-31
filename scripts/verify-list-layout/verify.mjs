// 列表页布局自检:真实 Chromium + 真实构建产物 lib/client.js。
// 挡的是「文案截断 / 滚动条长错位置」这类只有真渲染才量得出来的回归:
//   1) 逐个 kind 挂载,量所有已渲染的地域胶囊(宽度统一 + 文案不被省略号吃掉)
//   2) CVM 那条链逐项点选,验证控制台全称在收起态被收成城市名、title 仍是全称
//   3) 实例表格空/非空两态,量横向滚动条是否落在整块表格底部而不是表头下沿
//   4) 把仓库里所有地域文案(共享 source + client 各产品表)塞进真实胶囊骨架逐个量
// 用法(仓库根):
//   pnpm build && node scripts/verify-list-layout/verify.mjs [chrome二进制路径]
import { mkdir, cp, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { startEnv } from "../verify-regionpop-icons/drive-core.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const DIR = join(tmpdir(), "list-layout-verify");
await mkdir(join(DIR, "shots"), { recursive: true });

await cp(join(REPO, "lib", "client.js"), join(DIR, "client.js"));
await cp(join(REPO, "node_modules", "react", "umd", "react.production.min.js"), join(DIR, "react.production.min.js"));
await cp(join(REPO, "node_modules", "react-dom", "umd", "react-dom.production.min.js"), join(DIR, "react-dom.production.min.js"));
await cp(join(HERE, "index.html"), join(DIR, "index.html"));

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.error(`[check] ${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
};

// 候选文案:共享 source 的 label + client 里各产品自带的地域表 + 控制台全称映射
const shared = await readFile(join(REPO, "src/providers/tencent/regions-shared.ts"), "utf8");
const client = await readFile(join(REPO, "src/client.js"), "utf8");
const labels = new Set();
for (const m of shared.matchAll(/label: '([^']+)'/g)) labels.add(m[1]);
for (const m of client.matchAll(/(?:label|name): "([^"]+)"/g)) if (/[\u4e00-\u9fa5]/.test(m[1])) labels.add(m[1]);
for (const m of client.matchAll(/\["[^"]+", "([^"]*[（(][^"]*)"\]/g)) labels.add(m[1]);
const candidates = [...labels];

const env = await startEnv({
  dir: DIR,
  profile: join(DIR, "profile"),
  scale: 2,
  viewport: [1080, 900],
  chromePath: process.argv[2],
});
await env.nav(`http://127.0.0.1:${env.port}/index.html`);
await new Promise((r) => setTimeout(r, 900));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- 1. 每个 kind 的地域胶囊 ----------
const KINDS = ["cvm", "lighthouse", "cls", "cdb", "cluster", "image", "dbbrain", "cos"];
const seen = [];
for (const kind of KINDS) {
  await env.evaluate(`window.__mountKind(${JSON.stringify(kind)})`);
  await wait(450);
  const pickers = await env.evaluate("window.__measurePickers()");
  seen.push({ kind, count: pickers.length, pickers });
  const bad = pickers.filter((p) => p.truncated);
  const odd = pickers.filter((p) => p.width !== 140);
  check(
    `${kind}: 地域胶囊文案完整`,
    pickers.length > 0 && bad.length === 0 && odd.length === 0,
    pickers.length === 0
      ? "该 kind 没渲染出地域胶囊(harness payload 需要补)"
      : `${pickers.length} 个 · ${pickers.map((p) => `${p.label}@${p.width}px`).join(", ")}`,
  );
}

// ---------- 2. CVM:逐项点选控制台全称 ----------
await env.evaluate(`window.__mountKind("cvm")`);
await wait(450);
// 浮层是 React 状态驱动的:click 之后必须让出一帧再读 DOM,否则数到 0 个 option
const openPopup = async () => {
  const already = await env.evaluate(`!!document.querySelector(".ci-regionpop")`);
  if (!already) await env.evaluate(`document.querySelector("#root .ci-regionpick-btn").click()`);
  await wait(250);
};
await openPopup();
// 清单来自 harness 的假后端(CVM 那套刻意混了专区与自动驾驶云等长文案),条数以它为准
const optionCount = await env.evaluate(`document.querySelectorAll(".ci-regionpop-item").length`);
const picked = [];
for (let i = 0; i < optionCount; i += 1) {
  await openPopup();
  const row = await env.evaluate(`(() => {
    const item = document.querySelectorAll(".ci-regionpop-item")[${i}];
    if (!item) return null;
    const full = item.querySelector(".ci-regionpop-label").textContent;
    item.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    return full;
  })()`);
  if (!row) break;
  await wait(150);
  const shown = await env.evaluate(`(() => {
    const text = document.querySelector("#root .ci-regionpick-text");
    const btn = document.querySelector("#root .ci-regionpick-btn");
    return { full: ${JSON.stringify(row)}, shown: text.textContent, title: btn.getAttribute("title"),
      truncated: text.scrollWidth > text.clientWidth + 1 };
  })()`);
  picked.push(shown);
}
const truncatedPick = picked.filter((p) => p.truncated);
const wrongTitle = picked.filter((p) => p.title !== p.full);
const notShortened = picked.filter((p) => /[（(]/.test(p.full) && /[（(]/.test(p.shown));
check(
  "CVM 逐项点选:全称收成城市名、title 保留全称、无一截断",
  picked.length >= 6 && !truncatedPick.length && !wrongTitle.length && !notShortened.length,
  `选了 ${picked.length} 项;截断 ${truncatedPick.length};title 不符 ${wrongTitle.length};未收窄 ${notShortened.length}`
    + (picked.length ? ` · 例:${picked[0].full} → ${picked[0].shown}` : ""),
);

// ---------- 3. 实例表格:横向滚动条不能压在表头下沿 ----------
for (const kind of ["cvm", "lighthouse"]) {
  for (const empty of [false, true]) {
    await env.evaluate(`window.__mountKind(${JSON.stringify(kind)}, ${JSON.stringify({ empty })})`);
    await wait(450);
    const m = await env.evaluate("window.__measureScroll()");
    const label = `${kind}${empty ? "(空结果)" : "(有数据)"}`;
    if (!m) {
      check(`${label}: 表格滚动容器存在`, false, "没找到 .ci-scroll");
      continue;
    }
    // 关键判据:滚动条在 .ci-scroll 的下沿。空态必须在容器内,且容器底边落在空态之下,
    // 这样滚动条才在整块表格底部而不是紧贴表头。
    const ok = m.scrollable
      && (!empty || (m.emptyInside === true && m.emptyBottom !== null && m.scrollBottom >= m.emptyBottom))
      && (!empty || m.scrollBottom - m.headBottom > 40)
      && (!empty || m.emptySticky === "sticky")
      && m.barHeight > 0;
    check(`${label}: 横向滚动条在表格底部而不是表头下沿`, ok, JSON.stringify(m));
  }
}

// ---------- 4. 切 Tab:地域清单/选中值不许串台 ----------
// 假后端给两条链不同的地域集合(轻量没有「清远信安」),复现用户那条链路:
// CVM 选清远信安 → 切轻量 → 切回 CVM。
await env.evaluate(`window.__mountKind("cvm")`);
await wait(700);
await env.evaluate("window.__openRegionPop()");
await wait(300);
const pickedXinan = await env.evaluate(`window.__pickRegion("华南地区（清远信安）")`);
await wait(700);
const onCvm = await env.evaluate("window.__readBar()");
check(
  "CVM 选中「清远信安」后按城市名展示并按全称请求",
  pickedXinan === true && onCvm.region === "清远信安" && onCvm.rows === 1 && onCvm.err === ""
    && onCvm.lastCall && onCvm.lastCall.kind === "cvm" && onCvm.lastCall.region === "华南地区（清远信安）",
  JSON.stringify(onCvm),
);

await env.evaluate(`window.__clickTab("轻量应用服务器")`);
await wait(900);
const onLh = await env.evaluate("window.__readBar()");
check(
  "切到轻量:地域收敛到同城的「清远」、有说明、无报错、拿到数据",
  onLh.tab === "轻量应用服务器" && onLh.region === "清远" && onLh.err === ""
    && /清远信安/.test(onLh.note) && /清远/.test(onLh.note) && onLh.rows === 1
    && onLh.lastCall && onLh.lastCall.kind === "lighthouse" && onLh.lastCall.region === "清远",
  JSON.stringify(onLh),
);

await env.evaluate("window.__openRegionPop()");
await wait(300);
const lhList = await env.evaluate("window.__readBar()");
await env.evaluate(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`);
check(
  "切到轻量后选择器列的是轻量自己的地域(不再显示 CVM 的清单),且文案口径统一",
  lhList.options.length === 5
    && !lhList.options.some((name) => /清远信安|自动驾驶云|西北/.test(name))
    // 轻量给的是城市短名,浮层里必须统一归一成控制台全称,不能混着两种写法
    && lhList.options.every((name) => /（.+）$/.test(name)),
  JSON.stringify(lhList.options),
);

await wait(200);
await env.evaluate(`window.__clickTab("云服务器")`);
await wait(900);
const backCvm = await env.evaluate("window.__readBar()");
check(
  "切回云服务器:换成 CVM 自己的写法去查(城市没变所以不打扰用户)",
  backCvm.tab === "云服务器" && backCvm.region === "清远" && backCvm.note === "" && backCvm.err === ""
    && backCvm.rows === 1 && backCvm.lastCall.kind === "cvm" && backCvm.lastCall.region === "华南地区（清远）",
  JSON.stringify(backCvm),
);

// 轻量完全没有的地域(西北):优先回到轻量上次看的地域,并说明原因
await env.evaluate("window.__openRegionPop()");
await wait(300);
await env.evaluate(`window.__pickRegion("西北地区（西北）")`);
await wait(700);
await env.evaluate(`window.__clickTab("轻量应用服务器")`);
await wait(900);
const remembered = await env.evaluate("window.__readBar()");
check(
  "轻量没有的地域回落到该 Tab 上次选过的地域并说明原因",
  remembered.region === "清远" && /西北/.test(remembered.note) && /清远/.test(remembered.note)
    && remembered.err === "" && remembered.lastCall.region === "清远",
  JSON.stringify(remembered),
);

// 全新挂载(两个 Tab 都没有历史):第一次切过去时清单还没拉到,只能等结果回来再收敛并重拉
await env.evaluate(`window.__mountKind("cvm")`);
await wait(700);
await env.evaluate("window.__openRegionPop()");
await wait(300);
await env.evaluate(`window.__pickRegion("西北地区（西北）")`);
await wait(700);
await env.evaluate(`window.__clickTab("轻量应用服务器")`);
await wait(1200);
const fresh = await env.evaluate("window.__readBar()");
check(
  "首次切到轻量:清单回来后自愈到默认地域(广州)并说明原因",
  fresh.region === "广州" && /西北/.test(fresh.note) && /广州/.test(fresh.note)
    && fresh.err === "" && fresh.rows === 1 && fresh.lastCall.kind === "lighthouse" && fresh.lastCall.region === "广州",
  JSON.stringify(fresh),
);

// 留一张「切 Tab 后地域被收敛 + 说明」的截图,方便肉眼确认文案位置与语气
const noteShot = await env.evaluate(`(() => {
  const el = document.querySelector("#root .ci-panel");
  if (!el) return null;
  const b = el.getBoundingClientRect();
  return { x: b.x, y: b.y, width: b.width, height: Math.min(b.height, 260) };
})()`);
if (noteShot) await writeFile(join(DIR, "shots", "tab-switch-note.png"), await env.shot(noteShot));

// ---------- 5. 可注册查询:加购之后要有出路,单行结果不留空白 ----------
await env.evaluate(`window.__mountKind("registrar")`);
await wait(500);
const reg0 = await env.evaluate("window.__readRegistrar()");
check(
  "可注册查询:精确匹配与补出来的其它后缀分段,不翻页也不留高度地板",
  reg0.rows.length === 3 && reg0.subhead.length === 1 && reg0.subhead[0] === "其他后缀"
    && reg0.pager === false && reg0.bodyHeight !== null && reg0.listHeight !== null
    && reg0.bodyHeight - reg0.listHeight <= 1
    && reg0.rows[0].op === "立即加购" && reg0.rows[2].op === "已被注册",
  JSON.stringify(reg0),
);

await env.evaluate(`window.__clickRegistrarOp("fagagbv.com", "立即加购")`);
await wait(350);
const reg1 = await env.evaluate("window.__readRegistrar()");
check(
  "加购不弹窗、行内变成可移除、底部出现结算栏",
  reg1.modal === false && reg1.rows[0].picked === true && reg1.rows[0].tag === "已加购"
    && reg1.rows[0].op === "移除" && /购物车 1 个域名/.test(reg1.cartbar) && /¥83\/年/.test(reg1.cartbar),
  JSON.stringify(reg1),
);

await env.evaluate(`window.__clickRegistrarOp("fagagbv.cn", "立即加购")`);
await wait(350);
const reg2 = await env.evaluate("window.__readRegistrar()");
check(
  "连着加第二个域名:合计随之累加,仍然没有弹窗打断",
  reg2.modal === false && /购物车 2 个域名/.test(reg2.cartbar) && /¥112\/年/.test(reg2.cartbar),
  JSON.stringify(reg2),
);

await env.evaluate(`window.__clickRegistrarOp("fagagbv.cn", "移除")`);
await wait(350);
const reg3 = await env.evaluate("window.__readRegistrar()");
check(
  "行内移除后回到可加购态,结算栏跟着回到 1 个",
  reg3.rows[1].op === "立即加购" && reg3.rows[1].picked === false && /购物车 1 个域名/.test(reg3.cartbar),
  JSON.stringify(reg3),
);

const opsBg = await env.evaluate("window.__readOpsBg()");
check(
  "操作列不自带底色:已选行的底色只由行自己铺一层",
  !!opsBg && opsBg.rowPainted === true && opsBg.opsClear === true,
  JSON.stringify(opsBg),
);

const regShot = await env.evaluate(`(() => {
  const el = document.querySelector("#root .ci-panel");
  if (!el) return null;
  const b = el.getBoundingClientRect();
  return { x: b.x, y: b.y, width: b.width, height: Math.min(b.height, 320) };
})()`);
if (regShot) await writeFile(join(DIR, "shots", "registrar-cart.png"), await env.shot(regShot));

await env.evaluate(`window.__clickCartBtn("去结算")`);
await wait(450);
const reg4 = await env.evaluate(`(() => ({
  modal: !!document.querySelector(".ci-modal-mask"),
  title: (document.querySelector(".ci-modal h3") || {}).textContent || "",
}))()`);
check(
  "「去结算」打开购物车弹窗",
  reg4.modal === true && /购物车/.test(reg4.title),
  JSON.stringify(reg4),
);
await env.evaluate(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`);
await wait(250);

// ---------- 6. 面板窗口化 / 全屏 ----------
// 对话卡片只有几百像素宽,宽表在里面永远要横向滚;窗口化之后面板必须真的变宽,
// 而且不能盖住自己内部的确认框/表单弹窗(z-index 要压在 --ci-z-modal 之下)。
await env.evaluate(`window.__mountKind("cvm")`);
await wait(600);
await env.evaluate(`window.__winClick("在窗口中打开")`);
await wait(400);
const win0 = await env.evaluate("window.__readWin()");
check(
  "窗口化:浮层撑开视口大半、面板填满窗口、卡片留占位、宿主滚动被锁、三个把手就位",
  win0.open === true && win0.full === false && win0.grips === 3 && win0.away === true
    && win0.bodyLocked === true && win0.cardHeight > 0
    && win0.win.w >= Math.round(win0.viewport.w * 0.8)
    && win0.panelWidth >= win0.win.w - 40
    && win0.win.w <= win0.viewport.w - 16 && win0.win.h <= win0.viewport.h - 16
    && win0.win.x >= 8 && win0.win.y >= 8
    && Number(win0.zWin) < 40,
  JSON.stringify(win0),
);

await env.evaluate(`window.__winDrag(".ci-win-bar", 60, 40)`);
await wait(250);
const win1 = await env.evaluate("window.__readWin()");
check(
  "标题栏拖拽跟手,尺寸不变",
  win1.win.x === win0.win.x + 60 && win1.win.y === win0.win.y + 40
    && win1.win.w === win0.win.w && win1.win.h === win0.win.h,
  JSON.stringify({ before: win0.win, after: win1.win }),
);

// 先缩小再放大:缩放只能改尺寸,不许把窗口往左上顶(按位置夹尺寸,而不是按尺寸夹位置)
await env.evaluate(`window.__winDrag(".ci-win-grip.se", -160, -120)`);
await wait(250);
const win2 = await env.evaluate("window.__readWin()");
await env.evaluate(`window.__winDrag(".ci-win-grip.se", 60, 50)`);
await wait(250);
const win3 = await env.evaluate("window.__readWin()");
check(
  "右下角缩放只改尺寸、不挪位置(缩小与放大都跟手)",
  win2.win.w === win1.win.w - 160 && win2.win.h === win1.win.h - 120
    && win3.win.w === win2.win.w + 60 && win3.win.h === win2.win.h + 50
    && win2.win.x === win1.win.x && win2.win.y === win1.win.y
    && win3.win.x === win1.win.x && win3.win.y === win1.win.y,
  JSON.stringify({ start: win1.win, small: win2.win, grown: win3.win }),
);

// 缩放不能把窗口推出视口:够不到的部分只能停在边界上,而不是把窗口往回顶
await env.evaluate(`window.__winDrag(".ci-win-grip.se", 4000, 4000)`);
await wait(250);
const winMax = await env.evaluate("window.__readWin()");
check(
  "拉到视口边界就停住,位置不动",
  winMax.win.x === win1.win.x && winMax.win.y === win1.win.y
    && winMax.win.x + winMax.win.w <= winMax.viewport.w
    && winMax.win.y + winMax.win.h <= winMax.viewport.h,
  JSON.stringify(winMax.win),
);

// 拖出视口:窗口必须整体留在视口内,否则标题栏跑掉就再也抓不回来
await env.evaluate(`window.__winDrag(".ci-win-bar", 4000, 4000)`);
await wait(250);
const winFar = await env.evaluate("window.__readWin()");
check(
  "往视口外拖会被夹住,窗口不会丢",
  winFar.win.x + winFar.win.w <= winFar.viewport.w && winFar.win.y + winFar.win.h <= winFar.viewport.h
    && winFar.win.x >= 0 && winFar.win.y >= 0,
  JSON.stringify(winFar.win),
);

await env.evaluate(`window.__winDblTitle()`);
await wait(350);
const winFull = await env.evaluate("window.__readWin()");
check(
  "双击标题栏进全屏:铺满视口、把手撤掉",
  winFull.full === true && winFull.grips === 0
    && winFull.win.w === winFull.viewport.w && winFull.win.h === winFull.viewport.h,
  JSON.stringify(winFull),
);

const fullShot = await env.evaluate(`(() => ({ x: 0, y: 0, width: window.innerWidth, height: Math.min(window.innerHeight, 520) }))()`);
await writeFile(join(DIR, "shots", "panel-fullscreen.png"), await env.shot(fullShot));

// 全屏态下走一遍面板自己的写操作确认框(更多 → 关机):必须盖在窗口之上,而不是被窗口吃掉
const opened = await env.evaluate(`(() => {
  const more = [...document.querySelectorAll(".ci-win-body .ci-more button")].find((el) => el.textContent === "更多");
  if (!more) return "没有更多按钮";
  more.click();
  return true;
})()`);
await wait(300);
const pickedStop = await env.evaluate(`(() => {
  const item = [...document.querySelectorAll(".ci-win-body .ci-menu button")].find((el) => el.textContent === "关机");
  if (!item) return "菜单里没有关机";
  item.click();
  return true;
})()`);
await wait(500);
const layered = await env.evaluate(`(() => {
  const mask = document.querySelector(".ci-modal-mask");
  const frame = document.querySelector(".ci-winframe");
  if (!mask || !frame) return { mask: !!mask, frame: !!frame };
  const z = (el) => Number(getComputedStyle(el).zIndex) || 0;
  const box = mask.getBoundingClientRect();
  const hit = document.elementFromPoint(Math.round(box.width / 2), Math.round(box.height / 2));
  return { mask: true, frame: true, zMask: z(mask), zFrame: z(frame), hitInsideModal: !!(hit && hit.closest(".ci-modal-mask")) };
})()`);
check(
  "全屏窗口里「更多 → 关机」的确认框仍然在最上层(z-index 与命中测试都对)",
  opened === true && pickedStop === true
    && layered.mask === true && layered.zMask > layered.zFrame && layered.hitInsideModal === true,
  JSON.stringify({ opened, pickedStop, ...layered }),
);
await env.evaluate(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`);
await wait(250);

// Esc 收回:浮层消失、宿主滚动解锁、面板回到卡片里
await env.evaluate(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`);
await wait(350);
const closed = await env.evaluate(`(() => ({
  open: !!document.querySelector(".ci-winframe"),
  bodyLocked: document.body.style.overflow === "hidden",
  inlinePanel: !!document.querySelector("#root .ci-panel"),
  away: !!document.querySelector("#root .ci-win-away"),
}))()`);
check(
  "Esc 收回对话卡片:浮层消失、滚动解锁、面板回到卡片里",
  closed.open === false && closed.bodyLocked === false && closed.inlinePanel === true && closed.away === false,
  JSON.stringify(closed),
);

// 每个 kind 都要有这两个入口(窗口化能力是面板级的,不该只有实例卡有)
for (const kind of ["cls", "cdb", "cluster", "image", "cos", "registrar", "cert"]) {
  await env.evaluate(`window.__mountKind(${JSON.stringify(kind)})`);
  await wait(400);
  const ctl = await env.evaluate(`(() => [...document.querySelectorAll("#root .ci-winctl-btn")].map((el) => el.getAttribute("title")))()`);
  check(
    `${kind}: 卡片右上角有窗口化 / 全屏入口`,
    ctl.length === 2 && /窗口/.test(ctl[0]) && /全屏/.test(ctl[1]),
    JSON.stringify(ctl),
  );
}

// ---------- 7. 我的证书:行内「更多」必须是证书动作 ----------
// 证书菜单和实例电源菜单曾经都叫 MoreMenu,同作用域内后者胜,证书行里冒出了「开机/关机/重启」。
await env.evaluate(`window.__mountKind("cert")`);
await wait(500);
const certIssued = await env.evaluate(`window.__readCertRow("Kd7Xq2Ab")`);
check(
  "已颁发证书:操作列是 部署 / 下载 / 更多",
  !!certIssued && certIssued.ops.join("|") === "部署|下载|更多",
  JSON.stringify(certIssued),
);

await env.evaluate(`window.__openCertMore("Kd7Xq2Ab")`);
await wait(300);
const certMenu = await env.evaluate(`window.__readCertRow("Kd7Xq2Ab")`);
check(
  "已颁发证书的「更多」是 重颁发 / 吊销 / 删除,没有实例电源项",
  !!certMenu && certMenu.menu.join("|") === "重颁发|吊销|删除"
    && !certMenu.menu.some((label) => /开机|关机|重启/.test(label)),
  JSON.stringify(certMenu && certMenu.menu),
);
const certShot = await env.evaluate(`(() => {
  const el = document.querySelector("#root .ci-panel");
  if (!el) return null;
  const b = el.getBoundingClientRect();
  return { x: b.x, y: b.y, width: b.width, height: Math.min(b.height + 160, 420) };
})()`);
if (certShot) await writeFile(join(DIR, "shots", "cert-more.png"), await env.shot(certShot));

await env.evaluate(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`);
await wait(200);

const certPending = await env.evaluate(`(async () => {
  window.__openCertMore("Vm3Pz9Cd");
  await new Promise((r) => setTimeout(r, 250));
  return window.__readCertRow("Vm3Pz9Cd");
})()`);
check(
  "审核中证书:只有「更多」,菜单是 查看验证状态 / 取消审核(删除前要先取消)",
  !!certPending && certPending.ops.join("|") === "更多"
    && certPending.menu.join("|") === "查看验证状态|取消审核",
  JSON.stringify(certPending),
);
await env.evaluate(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`);
await wait(200);

// ---------- 8. 全量文案探针 ----------
const probed = await env.evaluate(`window.__probeLabels(${JSON.stringify(candidates)})`);
const probeBad = probed.filter((p) => p.truncated);
check(
  "仓库内全部地域文案在 140px 胶囊里都不截断",
  probeBad.length === 0,
  `共 ${probed.length} 条` + (probeBad.length ? ` · 截断:${probeBad.map((p) => p.raw).join(", ")}` : ""),
);

// 截图留档:cvm(控制台全称链) + cls(短名链) + cvm 空态(滚动条位置)
for (const [kind, opts] of [["cvm", {}], ["cls", {}], ["cvm-empty", { empty: true }]]) {
  await env.evaluate(`window.__mountKind(${JSON.stringify(kind.replace("-empty", ""))}, ${JSON.stringify(opts)})`);
  await wait(400);
  const r = await env.evaluate(`(() => {
    const el = document.querySelector("#root .ci-panel");
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.x, y: b.y, width: b.width, height: Math.min(b.height, 260) };
  })()`);
  if (r) await writeFile(join(DIR, "shots", `${kind}.png`), await env.shot(r));
}
console.error(`\n[shots] ${join(DIR, "shots")}`);
console.error(`[coverage] ${seen.map((s) => `${s.kind}=${s.count}`).join(" ")}`);

env.chrome.kill();
env.server.close();
const failed = results.filter((r) => !r.ok);
if (failed.length) {
  console.error(`\n[result] FAIL ${failed.length}/${results.length}`);
  process.exit(1);
}
console.error(`\n[result] PASS ${results.length}/${results.length}`);
