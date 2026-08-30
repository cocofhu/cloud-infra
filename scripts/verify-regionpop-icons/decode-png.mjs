// 极简 PNG 解码:支持真彩色/RGBA(8bit),非隔行。足够解析 CDP 截图。
import zlib from "node:zlib";

export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not png");
  let pos = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") break;
    pos += 12 + len;
  }
  if (interlace !== 0) throw new Error("interlaced png unsupported");
  if (bitDepth !== 8) throw new Error("only 8-bit supported, got " + bitDepth);
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error("colorType " + colorType);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const px = Buffer.alloc(width * height * channels);
  const flip = colorType === 3;
  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    const row = raw.subarray(rp, rp + stride);
    rp += stride;
    const prev = y > 0 ? px.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    const cur = px.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      const v = row[x];
      let val;
      switch (filter) {
        case 0: val = v; break;
        case 1: val = v + a; break;
        case 2: val = v + b; break;
        case 3: val = v + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          val = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: throw new Error("bad filter " + filter);
      }
      cur[x] = val & 0xff;
    }
  }
  return { width, height, channels, data: px };
}

// 取像素
function px(img, x, y) {
  const i = (y * img.width + x) * img.channels;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
}

// 从图块边缘样本估计背景色(取最频繁出现的颜色,抗边框干扰)
function estimateBackground(img) {
  const counts = new Map();
  const { width, height } = img;
  const sample = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const [r, g, b] = px(img, x, y);
    const key = (r >> 3) + "," + (g >> 3) + "," + (b >> 3);
    counts.set(key, (counts.get(key) || 0) + 1);
  };
  for (let x = 0; x < width; x++) { sample(x, 1); sample(x, height - 2); }
  for (let y = 0; y < height; y++) { sample(1, y); sample(width - 2, y); }
  let best = null, bestN = 0;
  for (const [k, n] of counts) if (n > bestN) { bestN = n; best = k; }
  if (!best) return [255, 255, 255];
  const [r, g, b] = best.split(",").map((v) => (parseInt(v, 10) << 3) + 4);
  return [r, g, b];
}

// 对比局部背景的"图标状"像素统计:与背景色差值大(亮度差或色相差) → 计为 ink
export function countInkPixels(img, rect) {
  const bg = estimateBackground(img);
  let ink = 0, total = 0;
  const { width, height, channels, data } = img;
  for (let y = rect.y; y < rect.y + rect.height; y++) {
    for (let x = rect.x; x < rect.x + rect.width; x++) {
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      const i = (y * width + x) * channels;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const dl = Math.abs((0.2126 * r + 0.7152 * g + 0.0722 * b) - (0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]));
      const dc = Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]);
      // 与输入框背景存在显著差异(图标/文字笔画),阈值小心取值避免把抗锯齿边框也算入
      if (dl > 60 || dc > 200) ink++;
      total++;
    }
  }
  return { ink, total, ratio: total ? ink / total : 0, bg };
}
