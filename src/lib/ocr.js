// Manga-aware OCR pipeline (all client-side — images never leave the browser).
//
// Strategy:
//   1. Detect speech-bubble interiors with image processing (binarize + connected
//      components + enclosure check). Manga bubbles are enclosed white regions.
//   2. OCR each bubble CROP separately. Crops are MASKED: everything outside the
//      bubble's white interior is painted white, so the bubble outline and nearby
//      artwork cannot confuse Tesseract (outlines crossing a crop are the #1 cause
//      of skipped/garbled bubbles). Small crops are upscaled so tiny lettering
//      becomes readable.
//   3. Sparse full-page sweep (PSM 11) as a fallback for narration / SFX / anything
//      the bubble detector missed. Lines already covered by a bubble are dropped.
//   4. Merge, order in comic reading order (RTL bands for Japanese/Chinese).

import { createWorker } from 'tesseract.js';
import { isRtlLang } from './langs.js';

const workerCache = new Map();
let progressCb = null;

async function getWorker(langString) {
  if (!workerCache.has(langString)) {
    const langs = langString.split('+');
    const p = createWorker(langs, 1, {
      logger: (m) => {
        if (!progressCb) return;
        if (m.status === 'loading tesseract core' || m.status === 'initializing tesseract') {
          progressCb({ stage: 'Loading OCR engine…', progress: 0.02 });
        } else if (m.status === 'loading language traineddata') {
          progressCb({ stage: 'Downloading language data (first run only)…', progress: 0.04 });
        }
      },
    }).catch((err) => {
      workerCache.delete(langString);
      throw err;
    });
    workerCache.set(langString, p);
  }
  return workerCache.get(langString);
}

// ── geometry helpers ────────────────────────────────────────────────────────

function unionBox(boxes) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const b of boxes) {
    if (b.x0 < x0) x0 = b.x0;
    if (b.y0 < y0) y0 = b.y0;
    if (b.x1 > x1) x1 = b.x1;
    if (b.y1 > y1) y1 = b.y1;
  }
  return { x0, y0, x1, y1 };
}

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function boxArea(b) {
  return Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0);
}

function overlapRatio(a, b) {
  const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  if (ix <= 0 || iy <= 0) return 0;
  return (ix * iy) / Math.min(boxArea(a), boxArea(b));
}

// ── bubble detection (canvas image processing) ─────────────────────────────

function otsuThreshold(gray) {
  const hist = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let threshold = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > best) {
      best = between;
      threshold = t;
    }
  }
  return threshold;
}

/**
 * Detect speech-bubble interiors.
 * Returns { bubbles: [{ box (canvas coords), id }], labelMap, sw, sh, f }.
 * labelMap[sy * sw + sx] = component id (1-based), 0 = dark / unlabeled.
 */
function detectBubbles(canvas) {
  const W0 = canvas.width;
  const H0 = canvas.height;
  // Keep enough resolution that thin bubble outlines stay solid after binarizing.
  const f = Math.min(1, 800 / Math.max(W0, H0));
  const sw = Math.max(8, Math.round(W0 * f));
  const sh = Math.max(8, Math.round(H0 * f));

  const small = document.createElement('canvas');
  small.width = sw;
  small.height = sh;
  const sctx = small.getContext('2d', { willReadFrequently: true });
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(canvas, 0, 0, sw, sh);
  const data = sctx.getImageData(0, 0, sw, sh).data;

  const n = sw * sh;
  const gray = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    gray[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) | 0;
  }
  const t = otsuThreshold(gray);
  let bin = new Uint8Array(n);
  let whiteCount = 0;
  for (let i = 0; i < n; i++) {
    bin[i] = gray[i] >= t ? 1 : 0;
    if (bin[i]) whiteCount++;
  }
  const labelMap = new Int32Array(n); // 0 = dark
  if (whiteCount < n * 0.02) return { bubbles: [], labelMap, sw, sh, f };

  // Erode white by 2px: seals pinholes that antialiasing leaves in bubble
  // outlines (a single leaky pixel merges the interior with the background).
  const erode = (src) => {
    const out = new Uint8Array(n);
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const i = y * sw + x;
        if (!src[i]) continue;
        if (x === 0 || y === 0 || x === sw - 1 || y === sh - 1) continue; // border = dark
        if (src[i - 1] && src[i + 1] && src[i - sw] && src[i + sw]) out[i] = 1;
      }
    }
    return out;
  };
  bin = erode(erode(bin));

  // connected components over white pixels (4-connectivity, iterative flood fill)
  let nextId = 0;
  const stack = new Int32Array(n);
  const comps = [];
  for (let start = 0; start < n; start++) {
    if (!bin[start] || labelMap[start]) continue;
    const id = ++nextId;
    let sp = 0;
    stack[sp++] = start;
    labelMap[start] = id;
    let minX = sw;
    let minY = sh;
    let maxX = -1;
    let maxY = -1;
    let count = 0;
    let touchesEdge = false;
    while (sp > 0) {
      const idx = stack[--sp];
      const x = idx % sw;
      const y = (idx / sw) | 0;
      count++;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (x === 0 || y === 0 || x === sw - 1 || y === sh - 1) touchesEdge = true;
      if (x > 0 && bin[idx - 1] && !labelMap[idx - 1]) { labelMap[idx - 1] = id; stack[sp++] = idx - 1; }
      if (x < sw - 1 && bin[idx + 1] && !labelMap[idx + 1]) { labelMap[idx + 1] = id; stack[sp++] = idx + 1; }
      if (y > 0 && bin[idx - sw] && !labelMap[idx - sw]) { labelMap[idx - sw] = id; stack[sp++] = idx - sw; }
      if (y < sh - 1 && bin[idx + sw] && !labelMap[idx + sw]) { labelMap[idx + sw] = id; stack[sp++] = idx + sw; }
    }
    if (touchesEdge) continue; // page background / panel gutters
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    if (bw < 12 || bh < 10) continue;
    if (count < 120) continue;
    if (count > n * 0.2) continue;
    if (count / (bw * bh) < 0.55) continue; // bubbles are solid white
    const aspect = bw / bh;
    if (aspect < 0.12 || aspect > 8) continue;
    // enclosure: ring just outside the box should be mostly dark (border / ink)
    let dark = 0;
    let total = 0;
    const ring = 2;
    const sample = (x, y) => {
      if (x < 0 || y < 0 || x >= sw || y >= sh) return;
      total++;
      if (!bin[y * sw + x]) dark++;
    };
    for (let x = minX - ring; x <= maxX + ring; x++) { sample(x, minY - ring); sample(x, maxY + ring); }
    for (let y = minY - ring; y <= maxY + ring; y++) { sample(minX - ring, y); sample(maxX + ring, y); }
    if (total === 0 || dark / total < 0.3) continue; // open text on plain background
    comps.push({ id, box: { x0: minX, y0: minY, x1: maxX + 1, y1: maxY + 1 }, area: count });
  }

  comps.sort((a, b) => b.area - a.area);
  const accepted = [];
  for (const c of comps) {
    if (accepted.some((a) => overlapRatio(a.box, c.box) >= 0.7)) continue;
    accepted.push(c);
    if (accepted.length >= 40) break;
  }

  const inv = 1 / f;
  const bubbles = accepted
    .map((c) => ({
      id: c.id,
      box: {
        x0: c.box.x0 * inv,
        y0: c.box.y0 * inv,
        x1: c.box.x1 * inv,
        y1: c.box.y1 * inv,
      },
    }))
    .filter((b) => b.box.x1 - b.box.x0 >= 30 && b.box.y1 - b.box.y0 >= 22);

  return { bubbles, labelMap, sw, sh, f };
}

/**
 * Build a masked, upscaled crop of one bubble.
 * Everything OUTSIDE the bubble's white interior is painted white, so the bubble
 * outline / artwork never crosses the crop. Pixels inside the bubble (text,
 * small drawings) are kept.
 */
function makeBubbleCrop(workCanvas, bubble, det) {
  const { labelMap, sw, sh, f } = det;
  const b = bubble.box;
  const bw = b.x1 - b.x0;
  const bh = b.y1 - b.y0;

  // 1. Outside test at small scale: flood from the image border through every
  //    pixel that is NOT part of this bubble's component.
  const id = bubble.id;
  const outside = new Uint8Array(sw * sh);
  const q = new Int32Array(sw * sh);
  let qh = 0;
  let qt = 0;
  const push = (idx) => {
    if (outside[idx]) return;
    outside[idx] = 1;
    q[qt++] = idx;
  };
  for (let x = 0; x < sw; x++) { if (labelMap[x] !== id) push(x); if (labelMap[(sh - 1) * sw + x] !== id) push((sh - 1) * sw + x); }
  for (let y = 0; y < sh; y++) { if (labelMap[y * sw] !== id) push(y * sw); if (labelMap[y * sw + sw - 1] !== id) push(y * sw + sw - 1); }
  while (qh < qt) {
    const idx = q[qh++];
    const x = idx % sw;
    const y = (idx / sw) | 0;
    if (x > 0 && labelMap[idx - 1] !== id) push(idx - 1);
    if (x < sw - 1 && labelMap[idx + 1] !== id) push(idx + 1);
    if (y > 0 && labelMap[idx - sw] !== id) push(idx - sw);
    if (y < sh - 1 && labelMap[idx + sw] !== id) push(idx + sw);
  }

  // 2. Draw the crop (with local upscale for small bubbles) and mask it.
  const cropScale = Math.min(2.2, Math.max(1, 360 / bh));
  const cw = Math.max(1, Math.round(bw * cropScale));
  const ch = Math.max(1, Math.round(bh * cropScale));
  const crop = document.createElement('canvas');
  crop.width = cw;
  crop.height = ch;
  const cctx = crop.getContext('2d', { willReadFrequently: true });
  cctx.imageSmoothingQuality = 'high';
  cctx.drawImage(workCanvas, b.x0, b.y0, bw, bh, 0, 0, cw, ch);

  const img = cctx.getImageData(0, 0, cw, ch);
  const px = img.data;
  for (let cy = 0; cy < ch; cy++) {
    for (let cx = 0; cx < cw; cx++) {
      // map crop pixel → small-scale label map (nearest)
      const workX = b.x0 + cx / cropScale;
      const workY = b.y0 + cy / cropScale;
      const sx = Math.min(sw - 1, Math.max(0, Math.round(workX * f)));
      const sy = Math.min(sh - 1, Math.max(0, Math.round(workY * f)));
      const clear =
        outside[sy * sw + sx] === 1 ||
        cx < 2 || cy < 2 || cx >= cw - 2 || cy >= ch - 2; // hard-clear the outer ring
      if (clear) {
        const o = (cy * cw + cx) * 4;
        px[o] = 255;
        px[o + 1] = 255;
        px[o + 2] = 255;
      }
    }
  }
  cctx.putImageData(img, 0, 0);
  return { canvas: crop, cropScale };
}

// ── tesseract line extraction ──────────────────────────────────────────────

async function ocrCanvas(worker, canvas, psm) {
  await worker.setParameters({ tessedit_pageseg_mode: psm });
  const { data } = await worker.recognize(canvas, {}, { text: true, blocks: true });
  const lines = [];
  for (const block of data.blocks || []) {
    for (const par of block.paragraphs || []) {
      for (const line of par.lines || []) {
        const words = (line.words || []).filter((w) => w && w.text && w.bbox && w.text.trim());
        if (!words.length) continue;
        const text = words.map((w) => w.text).join(' ').replace(/\s+/g, ' ').trim();
        if (!/\p{L}|\p{N}/u.test(text)) continue;
        const bbox = unionBox(words.map((w) => w.bbox));
        const w = bbox.x1 - bbox.x0;
        const h = bbox.y1 - bbox.y0;
        if (w < 8 || h < 8) continue;
        const conf = words.reduce((s, x) => s + (x.confidence || 0), 0) / words.length;
        lines.push({ text, conf, bbox, w, h });
      }
    }
  }
  return lines;
}

// Group nearby lines into regions (multi-line bubbles, vertical columns).
function clusterLines(lines, { factor = 0.35, cap = 12 } = {}) {
  const parent = lines.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const grow = (b) => {
    const minDim = Math.min(b.x1 - b.x0, b.y1 - b.y0);
    const t = Math.min(cap, Math.max(5, minDim * factor));
    return { x0: b.x0 - t, y0: b.y0 - t, x1: b.x1 + t, y1: b.y1 + t };
  };
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const a = grow(lines[i].bbox);
      const b = grow(lines[j].bbox);
      if (a.x0 <= b.x1 && b.x0 <= a.x1 && a.y0 <= b.y1 && b.y0 <= a.y1) {
        parent[find(i)] = find(j);
      }
    }
  }
  const groups = new Map();
  for (let i = 0; i < lines.length; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(lines[i]);
  }
  return [...groups.values()];
}

// Turn a group of lines (one region) into a region object, ordered by orientation.
function linesToRegion(group, rtl) {
  const vertical = group.filter((l) => l.h > l.w * 1.15).length > group.length / 2;
  const ordered = [...group].sort((a, b) => {
    if (vertical) {
      const byX = rtl ? b.bbox.x0 - a.bbox.x0 : a.bbox.x0 - b.bbox.x0;
      return byX || a.bbox.y0 - b.bbox.y0;
    }
    return a.bbox.y0 - b.bbox.y0 || (rtl ? b.bbox.x0 - a.bbox.x0 : a.bbox.x0 - b.bbox.x0);
  });
  return {
    bbox: unionBox(group.map((l) => l.bbox)),
    text: ordered.map((l) => l.text).join(' '),
    conf: group.reduce((s, l) => s + l.conf, 0) / group.length,
  };
}

// Comic reading order across regions: top-to-bottom bands, then right-to-left
// for Japanese/Chinese comics, left-to-right otherwise.
function sortReadingOrder(regions, rtl) {
  const bandSize = (median(regions.map((r) => r.bbox.y1 - r.bbox.y0)) || 40) * 1.2;
  return regions.sort((a, b) => {
    const bandA = Math.floor(((a.bbox.y0 + a.bbox.y1) / 2) / bandSize);
    const bandB = Math.floor(((b.bbox.y0 + b.bbox.y1) / 2) / bandSize);
    if (bandA !== bandB) return bandA - bandB;
    return rtl ? b.bbox.x0 - a.bbox.x0 : a.bbox.x0 - b.bbox.x0;
  });
}

// ── main pipeline ───────────────────────────────────────────────────────────

export async function runOcr(imgEl, langString, onProgress = () => {}) {
  progressCb = onProgress;

  try {
    const W = imgEl.naturalWidth || imgEl.width;
    const H = imgEl.naturalHeight || imgEl.height;

    // Work canvas (modest upscale for small scans only — big upscales hurt layout).
    const scale = H < 1100 ? Math.min(2, 1100 / H) : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);

    onProgress({ stage: 'Detecting speech bubbles…', progress: 0.08 });
    const det = detectBubbles(canvas);

    const worker = await getWorker(langString);
    const rtl = isRtlLang(langString);
    const bubbleRegions = [];
    const debug = { image: `${W}x${H}`, scale, workCanvas: `${canvas.width}x${canvas.height}`, detected: det.bubbles.length, bubbles: [], sparse: 0 };

    for (let i = 0; i < det.bubbles.length; i++) {
      const bubble = det.bubbles[i];
      onProgress({
        stage: `Reading bubble ${i + 1} / ${det.bubbles.length}…`,
        progress: 0.1 + (0.65 * i) / Math.max(1, det.bubbles.length),
      });

      const { canvas: crop, cropScale } = makeBubbleCrop(canvas, bubble, det);

      let lines = [];
      try {
        lines = await ocrCanvas(worker, crop, '6'); // single text block
      } catch {
        debug.bubbles.push({ id: bubble.id, box: bubble.box, error: 'ocr-threw' });
        continue;
      }
      const raw = lines.length;
      lines = lines.filter((l) => l.conf >= 15);
      debug.bubbles.push({
        id: bubble.id,
        box: bubble.box,
        cropScale: Math.round(cropScale * 10) / 10,
        rawLines: raw,
        keptLines: lines.length,
        texts: lines.map((l) => `${Math.round(l.conf)}|${l.text}`),
      });
      if (!lines.length) continue;

      // Map line boxes back to page-canvas coordinates.
      const b = bubble.box;
      for (const l of lines) {
        l.bbox = {
          x0: b.x0 + l.bbox.x0 / cropScale,
          y0: b.y0 + l.bbox.y0 / cropScale,
          x1: b.x0 + l.bbox.x1 / cropScale,
          y1: b.y0 + l.bbox.y1 / cropScale,
        };
      }

      // A merged/touching bubble can hold two separate text clusters — split them.
      for (const group of clusterLines(lines, { factor: 0.4, cap: 14 })) {
        bubbleRegions.push(linesToRegion(group, rtl));
      }
    }

    // Fallback sweep for narration, SFX and anything the detector missed.
    onProgress({ stage: 'Sweeping for remaining text…', progress: 0.8 });
    let sparseRegions = [];
    try {
      const sparseLines = (await ocrCanvas(worker, canvas, '11')).filter((l) => l.conf >= 55);
      sparseRegions = clusterLines(sparseLines, { factor: 0.35, cap: 12 })
        .map((g) => linesToRegion(g, rtl))
        .filter((r) => !bubbleRegions.some((br) => overlapRatio(br.bbox, r.bbox) >= 0.25));
    } catch {
      /* bubble results are enough */
    }
    debug.sparse = sparseRegions.length;
    debug.regions = [...bubbleRegions, ...sparseRegions].length;
    if (typeof window !== 'undefined') window.__sinhaOcrDebug = debug;

    const regions = sortReadingOrder([...bubbleRegions, ...sparseRegions], rtl).map((r) => ({
      bbox: {
        x0: r.bbox.x0 / scale,
        y0: r.bbox.y0 / scale,
        x1: r.bbox.x1 / scale,
        y1: r.bbox.y1 / scale,
      },
      text: r.text,
      conf: r.conf,
    }));

    onProgress({ stage: 'OCR complete', progress: 1 });
    return { regions, fullText: regions.map((r) => r.text).join('\n') };
  } finally {
    progressCb = null;
  }
}
