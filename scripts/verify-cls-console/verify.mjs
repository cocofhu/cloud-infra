// CLS 检索分析视觉自检:真实 Chromium + 真实构建产物 lib/client.js。
// 只做两件事:1) 截图给人看(亮/暗、折叠/展开、空态);2) 对布局做少量结构断言,
//   把「柱状图是不是真画出来了」「日志行有没有塌成一坨」这类问题挡在提交之前。
// 用法(仓库根):
//   pnpm build && node scripts/verify-cls-console/verify.mjs [chrome二进制路径]
import { writeFile, mkdir, cp } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { startEnv } from "../verify-regionpop-icons/drive-core.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const DIR = join(tmpdir(), "cls-console-verify");
const SHOTS = join(DIR, "shots");
await mkdir(SHOTS, { recursive: true });

await cp(join(REPO, "lib", "client.js"), join(DIR, "client.js"));
await cp(join(REPO, "node_modules", "react", "umd", "react.production.min.js"), join(DIR, "react.production.min.js"));
await cp(join(REPO, "node_modules", "react-dom", "umd", "react-dom.production.min.js"), join(DIR, "react-dom.production.min.js"));
await cp(join(HERE, "index.html"), join(DIR, "index.html"));

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.error(`[check] ${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
};

const env = await startEnv({
  dir: DIR,
  profile: join(DIR, "profile"),
  scale: 2,
  viewport: [1080, 1000],
  chromePath: process.argv[2],
});
await env.nav(`http://127.0.0.1:${env.port}/index.html`);
await new Promise((r) => setTimeout(r, 900));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const mount = async (theme, opts = {}) => {
  await env.evaluate(`window.__mount(${JSON.stringify(theme)}, ${JSON.stringify(opts)})`);
  await wait(700);
};
const rect = async (sel) => env.evaluate(`(() => {
  const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
})()`);
const shoot = async (name, sel = ".ci-panel") => {
  const r = await rect(sel);
  if (!r) throw new Error(`no element for shot: ${sel}`);
  const pad = 6;
  const buf = await env.shot({ x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: r.width + pad * 2, height: r.height + pad * 2 });
  await writeFile(join(SHOTS, `${name}.png`), buf);
  return join(SHOTS, `${name}.png`);
};

// ---------- 亮色:折叠态 ----------
await mount("light");
const bar = await rect(".ci-cls-bar");
const cql = await rect(".ci-cql");
const range = await rect(".ci-cls-range");
const go = await rect(".ci-cls-go");
check(
  "检索条压成一行",
  !!(bar && cql && range && go) && Math.abs(cql.y - range.y) < 4 && Math.abs(range.y - go.y) < 4 && bar.height < 110,
  `bar.h=${bar?.height} cql.y=${cql?.y} range.y=${range?.y} go.y=${go?.y}`,
);
check("时间范围固定 128px", !!range && Math.abs(range.width - 128) < 1, `w=${range?.width}`);
check("语句框单行起步", !!cql && cql.height >= 34 && cql.height <= 44, `h=${cql?.height}`);

// 柱状图:echarts 会在容器里插入 canvas,并且高度必须真的撑起来
const chart = await env.evaluate(`(() => {
  const box = document.querySelector(".ci-cls-chart");
  if (!box) return null;
  const cv = box.querySelector("canvas");
  const r = box.getBoundingClientRect();
  return { height: r.height, width: r.width, canvas: !!cv, cw: cv ? cv.getBoundingClientRect().width : 0 };
})()`);
check(
  "时间分布是 echarts canvas",
  !!chart && chart.canvas && chart.height > 90 && chart.cw > 200,
  JSON.stringify(chart),
);

// 直方图不是等高柱子:抽样画布像素,统计不同柱顶高度
const bars = await env.evaluate(`(() => {
  const cv = document.querySelector(".ci-cls-chart canvas");
  if (!cv) return null;
  const ctx = cv.getContext("2d");
  const { width, height } = cv;
  const data = ctx.getImageData(0, 0, width, height).data;
  const tops = [];
  for (let x = 0; x < width; x += 6) {
    let top = -1;
    for (let y = 0; y < height; y += 1) {
      const i = (y * width + x) * 4;
      // 柱子是品牌蓝:蓝通道显著高于红通道
      if (data[i + 3] > 40 && data[i + 2] - data[i] > 40) { top = y; break; }
    }
    if (top >= 0) tops.push(top);
  }
  return { samples: tops.length, unique: new Set(tops).size };
})()`);
check("柱高有分布(不是 12 根等高柱)", !!bars && bars.samples > 6 && bars.unique > 3, JSON.stringify(bars));

// 日志行:折叠态每行一行高;长原文靠列表自己的横向滚动条看全,列宽仍要逐行对齐
const rows = await env.evaluate(`(() => {
  const table = document.querySelector(".ci-logtable");
  const list = [...document.querySelectorAll(".ci-logrow")];
  if (!table || !list.length) return null;
  const hs = list.map((el) => Math.round(el.getBoundingClientRect().height));
  const t = list[0].querySelector(".ci-logrow-t").getBoundingClientRect();
  const times = list.map((el) => Math.round(el.querySelector(".ci-logrow-t").getBoundingClientRect().x));
  const contents = list.map((el) => Math.round(el.querySelector(".ci-logrow-c").getBoundingClientRect().x));
  const head = document.querySelector(".ci-logtable-h").getBoundingClientRect();
  return {
    count: list.length,
    maxH: Math.max(...hs),
    timeH: Math.round(t.height),
    // 原文不再截成省略号,改由列表横向滚动
    scrollsX: table.scrollWidth > table.clientWidth + 1,
    barH: table.offsetHeight - table.clientHeight,
    // subgrid 生效的判据:所有行的时间列/原文列起点一致,表头宽度跟着整表(不会在右侧断掉)
    timeAligned: new Set(times).size === 1,
    contentAligned: new Set(contents).size === 1,
    headSpansTable: Math.round(head.width) >= table.clientWidth - 1,
  };
})()`);
check(
  "折叠态每条日志一行高,长原文靠列表横向滚动,列宽逐行对齐",
  !!rows && rows.maxH <= 40 && rows.timeH <= 24 && rows.scrollsX && rows.barH > 0
    && rows.timeAligned && rows.contentAligned && rows.headSpansTable,
  JSON.stringify(rows),
);
const shotLight = await shoot("light-collapsed");

// 换行开关:开了就填满可视宽度自己折行,不该再有横向滚动
await env.evaluate(`(() => {
  const btn = [...document.querySelectorAll(".ci-cls-tool")].find((b) => b.textContent.includes("换行"));
  if (btn) btn.click();
  return true;
})()`);
await wait(300);
const wrapped = await env.evaluate(`(() => {
  const table = document.querySelector(".ci-logtable");
  const list = [...document.querySelectorAll(".ci-logrow")];
  if (!table || !list.length) return null;
  return {
    scrollsX: table.scrollWidth > table.clientWidth + 1,
    maxH: Math.max(...list.map((el) => Math.round(el.getBoundingClientRect().height))),
    wrapClass: list.every((el) => el.classList.contains("wrap")),
  };
})()`);
check(
  "开「换行」后原文折行、列表不再横向滚动",
  !!wrapped && wrapped.wrapClass && wrapped.scrollsX === false && wrapped.maxH > 40,
  JSON.stringify(wrapped),
);
await env.evaluate(`(() => {
  const btn = [...document.querySelectorAll(".ci-cls-tool")].find((b) => b.textContent.includes("换行"));
  if (btn) btn.click();
  return true;
})()`);
await wait(300);

// ---------- 亮色:展开态 ----------
await env.evaluate(`(() => {
  const btns = [...document.querySelectorAll(".ci-cls-tool")];
  const target = btns.find((b) => b.textContent.includes("全部展开"));
  target.click();
  return true;
})()`);
await wait(400);
const opened = await env.evaluate(`(() => {
  const rows = [...document.querySelectorAll(".ci-logrow.open")];
  if (rows.length < 2) return null;
  const kv = rows[0].querySelector(".ci-logkv");
  const summary = rows[0].querySelector(".ci-logrow-c");
  const dt = kv ? kv.querySelector("dt").getBoundingClientRect() : null;
  const dd = kv ? kv.querySelector("dd").getBoundingClientRect() : null;
  return {
    kv: !!kv,
    kvRows: kv ? kv.querySelectorAll("dt").length : 0,
    summaryHidden: summary ? getComputedStyle(summary).display === "none" : null,
    kvAligned: dt && dd ? Math.abs(dt.y - dd.y) < 3 && dd.x > dt.x : null,
    // 偶数条 content 是 fields 的 JSON 原文 → 不该重复贴;奇数条是纯文本原文 → 必须能看到
    jsonRowRaw: !!rows[0].querySelector(".ci-raw"),
    textRowRaw: !!rows[1].querySelector(".ci-raw"),
  };
})()`);
check(
  "展开后字段成对齐的两列,只有非 JSON 原文才另起一块",
  !!opened && opened.kv && opened.kvRows >= 6 && opened.summaryHidden === true && opened.kvAligned === true
    && opened.jsonRowRaw === false && opened.textRowRaw === true,
  JSON.stringify(opened),
);
const shotOpen = await shoot("light-expanded");

// ---------- 暗色 ----------
await mount("dark");
const darkChart = await env.evaluate(`(() => {
  const cv = document.querySelector(".ci-cls-chart canvas");
  if (!cv) return null;
  const box = document.querySelector(".ci-cls-chart");
  return { canvas: true, color: getComputedStyle(box).color };
})()`);
check("暗色下柱状图仍随主题取色", !!darkChart && /rgb/.test(darkChart.color), JSON.stringify(darkChart));
const shotDark = await shoot("dark-collapsed");

// ---------- 触底自动续拉(没有「继续拉取」按钮) ----------
await env.evaluate("window.__searchDelay = 350");
await mount("light", { count: 26 });
const feed0 = await env.evaluate("window.__readLogFeed()");
check(
  "首屏:没有「继续拉取」按钮,底部不留任何提示行,也不曾多余请求",
  !!feed0 && feed0.loadMoreBtn === false && feed0.footbar === false
    && feed0.hasSentinel === false && feed0.scrollable === true && feed0.calls === 0
    && /26 条/.test(feed0.note),
  JSON.stringify(feed0),
);

// 一次触底连派 5 个 scroll:锁没生效就会用同一个 context 打出多个请求
await env.evaluate("window.__scrollLogsToBottom(5)");
await wait(120);
const loading = await env.evaluate("window.__readLogFeed()");
check(
  "取的过程中底部占一行「加载更多日志…」",
  !!loading && loading.hasSentinel === true && /加载更多日志/.test(loading.sentinel) && loading.calls === 1,
  JSON.stringify(loading),
);

await wait(900);
const feed1 = await env.evaluate("window.__readLogFeed()");
check(
  "滚到底自动续拉一页,连续 scroll 只发一个请求,取完提示行收掉",
  !!feed1 && feed1.rows === 46 && feed1.calls === 1 && feed1.contexts[0] === "cur-1"
    && feed1.hasSentinel === false && /46 条/.test(feed1.note),
  JSON.stringify(feed1),
);

await env.evaluate("window.__scrollLogsToBottom(3)");
await wait(900);
const feed2 = await env.evaluate("window.__readLogFeed()");
check(
  "再触底取到最后一页,不再请求",
  !!feed2 && feed2.rows === 66 && feed2.calls === 2 && feed2.contexts[1] === "cur-2"
    && feed2.hasSentinel === false,
  JSON.stringify(feed2),
);
await env.evaluate("window.__scrollLogsToBottom(3)");
await wait(700);
const feed3 = await env.evaluate("window.__readLogFeed()");
check("拉完之后再怎么滚都不再发请求", !!feed3 && feed3.calls === 2 && feed3.rows === 66, JSON.stringify(feed3));

// 首屏不足一屏:滚不动就没有 scroll 事件,必须由 effect 自己补到能滚
await mount("light", { count: 2 });
await wait(1400);
const thin = await env.evaluate("window.__readLogFeed()");
check(
  "首屏只有 2 条滚不动时自动补拉,不把用户卡在一屏不到的列表上",
  !!thin && thin.calls >= 1 && thin.rows > 2 && thin.scrollable === true,
  JSON.stringify(thin),
);

// ---------- 空态 ----------
await mount("light", { empty: true });
const empty = await env.evaluate(`(() => ({
  hint: (document.querySelector(".ci-empty-search") || {}).textContent || "",
  chart: !!document.querySelector(".ci-cls-chart canvas"),
  fallback: (document.querySelector(".ci-cls-chart-empty") || {}).textContent || "",
}))()`);
check("空态给出提示且不画空图", !!empty && empty.hint.includes("没有匹配日志") && !empty.chart, JSON.stringify(empty));
const shotEmpty = await shoot("light-empty");

console.error(`\n[shots] ${[shotLight, shotOpen, shotDark, shotEmpty].join("\n         ")}`);
const failed = results.filter((r) => !r.ok);
env.chrome.kill();
env.server.close();
if (failed.length) {
  console.error(`\n[result] FAIL ${failed.length}/${results.length}`);
  process.exit(1);
}
console.error(`\n[result] PASS ${results.length}/${results.length}`);
