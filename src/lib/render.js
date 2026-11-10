// Canvas renderer: covers the original text inside each detected region and
// typesets the Sinhala translation there, auto-fitting font size and wrapping.
// Sinhala shaping (conjuncts, vowel signs) is handled natively by the browser
// text engine as long as a proper Sinhala font is loaded.

export const SINHALA_FONT = '"Noto Sans Sinhala", "Nirmala UI", "Iskoola Pota", "Noto Sans", sans-serif';
const LINE_HEIGHT = 1.34;

let fontLoaded = false;

export async function loadSinhalaFont() {
  if (fontLoaded || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`700 24px ${SINHALA_FONT}`),
      document.fonts.load(`800 24px ${SINHALA_FONT}`),
    ]);
  } catch {
    /* fall back to system Sinhala fonts */
  }
  fontLoaded = true;
}

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Sample the colour just OUTSIDE the text box (bubble background, panel colour…)
function sampleBackground(ctx, bbox) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const pad = 5;
  const pts = [
    [bbox.x0 - pad, bbox.y0 - pad],
    [bbox.x1 + pad, bbox.y0 - pad],
    [bbox.x0 - pad, bbox.y1 + pad],
    [bbox.x1 + pad, bbox.y1 + pad],
    [(bbox.x0 + bbox.x1) / 2, bbox.y0 - pad],
    [(bbox.x0 + bbox.x1) / 2, bbox.y1 + pad],
    [bbox.x0 - pad, (bbox.y0 + bbox.y1) / 2],
    [bbox.x1 + pad, (bbox.y0 + bbox.y1) / 2],
  ];
  const vals = [];
  for (const [px, py] of pts) {
    const x = Math.round(px);
    const y = Math.round(py);
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const d = ctx.getImageData(x, y, 1, 1).data;
    vals.push([d[0], d[1], d[2]]);
  }
  if (!vals.length) return { r: 255, g: 255, b: 255 };
  vals.sort((a, b) => luminance(a[0], a[1], a[2]) - luminance(b[0], b[1], b[2]));
  const m = vals[Math.floor(vals.length / 2)];
  return { r: m[0], g: m[1], b: m[2] };
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function wrapLines(ctx, text, maxW) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';

  for (const word of words) {
    const candidate = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxW) {
      cur = candidate;
      continue;
    }
    if (cur) lines.push(cur);
    cur = '';
    if (ctx.measureText(word).width <= maxW) {
      cur = word;
      continue;
    }
    // A single word longer than the box — hard-break it by characters.
    let piece = '';
    for (const ch of word) {
      if (piece && ctx.measureText(piece + ch).width > maxW) {
        lines.push(piece);
        piece = ch;
      } else {
        piece += ch;
      }
    }
    cur = piece;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

/**
 * Draw the translated page.
 * @param {HTMLImageElement} img original page image
 * @param {Array} regions [{ bbox, text }] from OCR
 * @param {Array} translations Sinhala strings, same order as regions
 * @returns {HTMLCanvasElement}
 */
export function renderTranslatedCanvas(img, regions, translations) {
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);

  regions.forEach((region, i) => {
    const text = (translations[i] || '').trim();
    if (!text) return;

    const b = region.bbox;
    const bw = b.x1 - b.x0;
    const bh = b.y1 - b.y0;
    const minDim = Math.min(bw, bh);

    // Expand the cover box slightly past the text.
    const pad = Math.max(3, Math.min(16, minDim * 0.14));
    const box = { x: b.x0 - pad, y: b.y0 - pad, w: bw + pad * 2, h: bh + pad * 2 };

    // Cover the original text with the sampled background colour.
    const bg = sampleBackground(ctx, b);
    ctx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`;
    roundRectPath(ctx, box.x, box.y, box.w, box.h, Math.min(12, box.h * 0.22));
    ctx.fill();

    // Fit the Sinhala text: shrink font size until wrapped lines fit the box.
    const inset = Math.max(3, Math.min(12, box.w * 0.05));
    const maxW = Math.max(12, box.w - inset * 2);
    const maxH = Math.max(12, box.h - inset * 2);

    let size = Math.max(9, Math.min(48, Math.floor(maxH)));
    let lines = null;
    for (; size >= 9; size--) {
      ctx.font = `700 ${size}px ${SINHALA_FONT}`;
      const candidate = wrapLines(ctx, text, maxW);
      const totalH = candidate.length * size * LINE_HEIGHT;
      const widest = Math.max(...candidate.map((l) => ctx.measureText(l).width));
      if (totalH <= maxH && widest <= maxW) {
        lines = candidate;
        break;
      }
    }
    if (!lines) {
      size = 9;
      ctx.font = `700 9px ${SINHALA_FONT}`;
      lines = wrapLines(ctx, text, maxW);
    }

    const lineH = size * LINE_HEIGHT;
    const totalH = lines.length * lineH;
    const cx = box.x + box.w / 2;
    let y = box.y + box.h / 2 - totalH / 2 + lineH / 2;

    const dark = luminance(bg.r, bg.g, bg.b) < 128;
    ctx.fillStyle = dark ? '#ffffff' : '#16181d';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const line of lines) {
      ctx.fillText(line, cx, y);
      y += lineH;
    }
  });

  return canvas;
}

export function canvasToBlob(canvas, type = 'image/png') {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image.'))), type);
  });
}
