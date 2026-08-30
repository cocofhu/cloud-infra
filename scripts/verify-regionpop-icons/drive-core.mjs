// 共享 CDP 启动 + 会话工具:找 Chromium → 起静态服务 → 起 chrome-headless-shell → 暴露 evaluate/nav/shot/mouse
import http from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css" };

const CANDIDATES = [
  process.env.CHROME_BIN,
  "/tmp/chrome/chrome-headless-shell-linux64/chrome-headless-shell",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
].filter(Boolean);

function findChrome(explicit) {
  if (explicit) return explicit;
  for (const p of CANDIDATES) if (existsSync(p)) return p;
  throw new Error(
    "找不到 Chromium 可执行文件。请安装 Chrome for Testing / chrome-headless-shell,并以参数或 CHROME_BIN 环境变量传入路径。",
  );
}

export async function startEnv({ dir, profile, scale = 2, viewport = [800, 400], chromePath } = {}) {
  const CHROME = findChrome(chromePath);
  const server = http.createServer(async (req, res) => {
    try {
      const p = req.url === "/" ? "/index.html" : req.url.split("?")[0];
      const buf = await readFile(join(dir, p));
      res.writeHead(200, { "content-type": MIME[p.slice(p.lastIndexOf("."))] || "application/octet-stream" });
      res.end(buf);
    } catch { res.writeHead(404); res.end("nf"); }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;

  const chrome = spawn(CHROME, [
    "--remote-debugging-port=0", "--no-sandbox", "--disable-gpu",
    `--force-device-scale-factor=${scale}`,
    `--window-size=${viewport[0]},${viewport[1]}`,
    `--user-data-dir=${profile}`,
    "--font-render-hinting=none",
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });

  const wsUrl = await new Promise((resolve, reject) => {
    let buf = "";
    chrome.stderr.on("data", (d) => {
      buf += d.toString();
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) resolve(m[1]);
    });
    chrome.on("exit", (c) => reject(new Error("chrome exited " + c)));
    setTimeout(() => reject(new Error("ws timeout")), 15000);
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    }
  });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify(sessionId ? { sessionId, id: mid, method, params } : { id: mid, method, params }));
  });

  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);

  const evaluate = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) throw new Error("page eval: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  const nav = async (u) => { await send("Page.navigate", { url: u }, sessionId); };
  const shot = async (clip) =>
    Buffer.from((await send("Page.captureScreenshot", clip ? { format: "png", clip: { ...clip, scale } } : { format: "png" }, sessionId)).data, "base64");
  const mouse = async (type, x, y, button = "left") => {
    await send("Input.dispatchMouseEvent", { type, x, y, button, clickCount: type === "mousePressed" || type === "mouseReleased" ? 1 : 0 }, sessionId);
  };

  return { server, chrome, port, send, sessionId, evaluate, nav, shot, mouse };
}
