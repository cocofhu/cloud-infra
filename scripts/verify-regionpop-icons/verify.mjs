// g1.2 本地自检(真实 Chromium + 真实构建产物 lib/client.js + 真实 SearchToolView):
//  对每个主题(亮/暗):
//   A. 展开 RegionPicker 浮层,确认类型/占位符/focus ring 与既有样式保留
//   B. 空输入截图 → 左端无放大镜像素
//   C. 非空 + focus + hover 右端截图 → 右侧无 ✕ 像素(对照:同引擎移除 CSS 规则的页面,同样步骤右侧确会出现 ✕)
//   D. 清空后列表恢复,占位符与聚焦样式不变
//   像素判据:输入框端部带内"相对局部背景的高对比油墨像素"占比;对照实验内联跑给出阈值基线。
// 用法(仓库根):
//   pnpm build  # 产出 lib/client.js
//   node scripts/verify-regionpop-icons/verify.mjs [chrome二进制路径]
// 依赖:Chromium/chrome-headless-shell(可用 Chrome for Testing)、React UMD(node_modules/react*)——源码内置在 staging。
import { writeFile, mkdir, cp } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { startEnv } from "./drive-core.mjs";
import { decodePng, countInkPixels } from "./decode-png.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const DIR = join(tmpdir(), "regionpop-icons-verify");
const SHOTS = join(DIR, "shots");
await mkdir(SHOTS, { recursive: true });

// staging:真实构建产物 + React UMD + harness 页面一起交给静态服务
await cp(join(REPO, "lib", "client.js"), join(DIR, "client.js"));
await cp(join(REPO, "node_modules", "react", "umd", "react.production.min.js"), join(DIR, "react.production.min.js"));
await cp(join(REPO, "node_modules", "react-dom", "umd", "react-dom.production.min.js"), join(DIR, "react-dom.production.min.js"));
await cp(join(HERE, "index.html"), join(DIR, "index.html"));
await cp(join(HERE, "control2.html"), join(DIR, "control2.html"));

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.error(`[check] ${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
};

// ---------- 第 0 步:基线对照(control2.html)——同一浏览器、同样交互,拿阈值 ----------
const env = await startEnv({
  dir: DIR,
  profile: join(DIR, "profile"),
  scale: 2,
  viewport: [1024, 800],
  chromePath: process.argv[2],
});

await env.nav(`http://127.0.0.1:${env.port}/control2.html`);
await new Promise((r) => setTimeout(r, 1200));

async function rightEdgeInkRatio(inputId) {
  const rect = await env.evaluate(`(() => { const r = document.getElementById(${JSON.stringify(inputId)}).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`);
  await env.mouse("mouseMoved", rect.x + rect.width - 10, rect.y + rect.height / 2);
  await new Promise((r) => setTimeout(r, 300));
  // 分成内侧带(w-18..w-2,排除 1px 边框)与外侧带(w..w+8),✕ 会同时
  // 探进两边;取二者最大值作为 "原生按钮存在" 的信号。
  const inner = { x: rect.x + rect.width - 18, y: rect.y + 3, width: 16, height: rect.height - 6 };
  const outer = { x: rect.x + rect.width + 1, y: rect.y + 3, width: 7, height: rect.height - 6 };
  const s1raw = decodePng(await env.shot(inner));
  const s1 = countInkPixels(s1raw, { x: 0, y: 0, width: s1raw.width, height: s1raw.height });
  const s2raw = decodePng(await env.shot(outer));
  const s2 = countInkPixels(s2raw, { x: 0, y: 0, width: s2raw.width, height: s2raw.height });
  // 外侧带在边框外是纯页面背景,预期起点很低;✕ 若延伸到边框外必有显著油墨
  return Math.max(s1.ratio, s2.ratio);
}

await env.evaluate(`document.getElementById("u").focus()`);
await new Promise((r) => setTimeout(r, 300));
const baseUnfixed = await rightEdgeInkRatio("u");
await env.evaluate(`document.getElementById("f").focus()`);
await new Promise((r) => setTimeout(r, 300));
const baseFixed = await rightEdgeInkRatio("f");
console.error(`[baseline] 未修复右端油墨比=${baseUnfixed.toFixed(4)}  已修复=${baseFixed.toFixed(4)}`);
// 基线截图存档(可人工复核 ✕ 存在/不存在)
for (const [id, name] of [["u", "unfixed"], ["f", "fixed"]]) {
  await env.evaluate(`document.getElementById(${JSON.stringify(id)}).focus()`);
  await new Promise((r) => setTimeout(r, 200));
  const r0 = await env.evaluate(`(() => { const r = document.getElementById(${JSON.stringify(id)}).getBoundingClientRect(); return { x: r.x, y: r.y }; })()`);
  await env.mouse("mouseMoved", r0.x + 210, r0.y + 15);
  await new Promise((r) => setTimeout(r, 200));
  await writeFile(`${SHOTS}/baseline-${name}-wide.png`, await env.shot({ x: r0.x + 180, y: r0.y - 6, width: 60, height: 42 }));
}
check("对照基线:同一引擎下未修复 input 右端确有原生 ✕(油墨比>0.5%)", baseUnfixed > 0.005, `unfixed=${baseUnfixed.toFixed(4)}`);
check("对照基线:同款 CSS 规则的 input 右端无 ✕(油墨比明显更低)", baseFixed < Math.max(0.005, baseUnfixed * 0.3), `fixed=${baseFixed.toFixed(4)} vs unfixed=${baseUnfixed.toFixed(4)}`);

// ---------- 第 1 步:真实 harness(真实插件产物) ----------
async function runTheme(theme) {
  await env.nav(`http://127.0.0.1:${env.port}/index.html`);
  await new Promise((r) => setTimeout(r, 2200));
  await env.evaluate(`window.__mount(${JSON.stringify(theme)})`);
  await new Promise((r) => setTimeout(r, 800));

  // A1. 点击胶囊按钮展开浮层
  const btnInfo = await env.evaluate(`(() => {
    const btn = document.querySelector(".ci-regionpick-btn");
    if (!btn) return null;
    btn.click();
    return { text: btn.textContent.trim() };
  })()`);
  check(theme + ":RegionPicker 胶囊按钮渲染并点击", !!btnInfo, btnInfo ? `文本=${btnInfo.text}` : "未找到按钮");
  if (!btnInfo) return;
  await new Promise((r) => setTimeout(r, 400));

  // A2. 输入框基础属性 + focus ring + placeholder
  const meta = await env.evaluate(`(() => {
    const inp = document.querySelector(".ci-regionpop-input");
    if (!inp) return null;
    inp.focus();
    const cs = getComputedStyle(inp);
    return {
      type: inp.type, placeholder: inp.placeholder, value: inp.value,
      boxShadow: cs.boxShadow, borderColor: cs.borderColor,
      rect: (() => { const r = inp.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })(),
      visible: (() => { const r = inp.getBoundingClientRect(); return r.width > 100 && r.height > 20; })(),
    };
  })()`);
  check(theme + ":浮层输入框存在且为 type=search + 占位符正确", !!meta && meta.type === "search" && /搜索地域/.test(meta.placeholder), meta && `placeholder="${meta.placeholder}"`);
  if (!meta) return;
  await new Promise((r) => setTimeout(r, 300));
  const meta2 = await env.evaluate(`(() => { const cs = getComputedStyle(document.querySelector(".ci-regionpop-input")); return { boxShadow: cs.boxShadow }; })()`);
  check(theme + ":focus 态 brand ring(box-shadow 3px)保留", /0px 0px 0px 3px/.test(meta2.boxShadow), `box-shadow=${meta2.boxShadow}`);

  // A3. 空输入:检查左端 8px padding 区(文字从 x+10 起,图标才会探进 padding 区)
  const leftStripPng = decodePng(await env.shot({ x: meta.rect.x + 1, y: meta.rect.y + 3, width: 8, height: meta.rect.height - 6 }));
  const leftStat = countInkPixels(leftStripPng, { x: 0, y: 0, width: leftStripPng.width, height: leftStripPng.height });
  // 空输入且未键入内容时,Chrome 默认本就不渲染 decoration;放大镜检查并入非空态,但左端应一直干净
  check(theme + ":空输入态左端无放大镜油墨", leftStat.ratio < 0.03, `ratio=${leftStat.ratio.toFixed(4)}`);

  // B. 非空 + hover 右端:与基线对比断言 ✕ 不出现
  await env.evaluate(`(() => {
    const inp = document.querySelector(".ci-regionpop-input");
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(inp, "广州");
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    inp.focus();
    return inp.value;
  })()`);
  await new Promise((r) => setTimeout(r, 400));
  const filterHits = await env.evaluate(`document.querySelectorAll(".ci-regionpop-item").length`);
  check(theme + ":输入\"广州\"后列表过滤生效", filterHits >= 1, `匹配项=${filterHits}`);

  await env.mouse("mouseMoved", meta.rect.x + meta.rect.width - 10, meta.rect.y + meta.rect.height / 2);
  await new Promise((r) => setTimeout(r, 300));
  // ✕ 会横跨边框内外(基线实测 w-6..w+10),内外两侧各截一条取最大油墨比
  const innerStrip = decodePng(await env.shot({ x: meta.rect.x + meta.rect.width - 18, y: meta.rect.y + 3, width: 16, height: meta.rect.height - 6 }));
  const outerStrip = decodePng(await env.shot({ x: meta.rect.x + meta.rect.width + 1, y: meta.rect.y + 3, width: 7, height: meta.rect.height - 6 }));
  const innerStat = countInkPixels(innerStrip, { x: 0, y: 0, width: innerStrip.width, height: innerStrip.height });
  const outerStat = countInkPixels(outerStrip, { x: 0, y: 0, width: outerStrip.width, height: outerStrip.height });
  const rightRatio = Math.max(innerStat.ratio, outerStat.ratio);
  await writeFile(`${SHOTS}/${theme}-rightstrip.png`, await env.shot({ x: meta.rect.x + meta.rect.width - 40, y: meta.rect.y - 2, width: 50, height: meta.rect.height + 4 }));
  await writeFile(`${SHOTS}/${theme}-input-full.png`, await env.shot({ x: meta.rect.x - 4, y: meta.rect.y - 4, width: meta.rect.width + 8, height: meta.rect.height + 8 }));
  check(theme + ":非空+hover 右端无原生 ✕(像素)", rightRatio < Math.max(0.005, baseUnfixed * 0.5), `内带=${innerStat.ratio.toFixed(4)} 外带=${outerStat.ratio.toFixed(4)}(基线未修复=${baseUnfixed.toFixed(4)})`);

  // 左侧也要干净(放大镜在非空时若出现必在左内边距区;文字从 x+10 起,截取仅 x+1..x+9)
  const leftPng2 = decodePng(await env.shot({ x: meta.rect.x + 1, y: meta.rect.y + 3, width: 8, height: meta.rect.height - 6 }));
  const leftStat2 = countInkPixels(leftPng2, { x: 0, y: 0, width: leftPng2.width, height: leftPng2.height });
  check(theme + ":非空态左端无原生放大镜(像素)", leftStat2.ratio < 0.03, `ratio=${leftStat2.ratio.toFixed(4)}`);

  // C. 点击右端:无 ✕ 可点 → 值不会被自动清空(若原生按钮在,会触发清空)
  await env.mouse("mousePressed", meta.rect.x + meta.rect.width - 10, meta.rect.y + meta.rect.height / 2);
  await env.mouse("mouseReleased", meta.rect.x + meta.rect.width - 10, meta.rect.y + meta.rect.height / 2);
  await new Promise((r) => setTimeout(r, 300));
  const afterClick = await env.evaluate(`document.querySelector(".ci-regionpop-input").value`);
  check(theme + ":点击右端无原生清空行为(值保留)", afterClick === "广州", `value after click="${afterClick}"`);

  // D. 清空：列表恢复 + 仍无原生图标
  await env.evaluate(`(() => {
    const inp = document.querySelector(".ci-regionpop-input");
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(inp, "");
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  })()`);
  await new Promise((r) => setTimeout(r, 300));
  const restored = await env.evaluate(`document.querySelectorAll(".ci-regionpop-item").length`);
  check(theme + ":清空后列表恢复", restored >= 4, `列表项=${restored}`);

  // 全浮层截图归档
  const popRect = await env.evaluate(`(() => { const p = document.querySelector(".ci-regionpop"); if (!p) return null; const r = p.getBoundingClientRect(); return { x: Math.max(0, r.x - 6), y: Math.max(0, r.y - 6), width: r.width + 12, height: r.height + 12 }; })()`);
  if (popRect) await writeFile(`${SHOTS}/${theme}-popup-archived.png`, await env.shot(popRect));
}

await runTheme("light");
await runTheme("dark");

const fails = results.filter((r) => !r.ok);
const report = { checks: results, pass: results.length - fails.length, fail: fails.length };
await writeFile(`${SHOTS}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ pass: report.pass, fail: report.fail }));
env.chrome.kill(); env.server.close();
process.exit(fails.length ? 1 : 0);
