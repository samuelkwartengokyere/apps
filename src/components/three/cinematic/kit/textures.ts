import * as THREE from "three";

/**
 * Canvas-drawn UI textures for the floating 3D interfaces. Drawn once and
 * cached by key, so every interface panel costs one texture upload and no
 * font or image requests. All content is fictional sample data.
 */

const cache = new Map<string, THREE.CanvasTexture>();

export function disposeTextureCache() {
  for (const t of cache.values()) t.dispose();
  cache.clear();
}

function fontFamily(mono = false) {
  if (typeof document === "undefined") return mono ? "monospace" : "sans-serif";
  const v = getComputedStyle(document.documentElement).getPropertyValue(mono ? "--font-geist-mono" : "--font-geist-sans").trim();
  return `${v ? `${v}, ` : ""}${mono ? "ui-monospace, monospace" : "ui-sans-serif, system-ui, sans-serif"}`;
}

export const font = (size: number, weight = 500, mono = false) => `${weight} ${size}px ${fontFamily(mono)}`;

export function canvasTexture(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// Restrained UI palette: slate surfaces, one cool accent, muted status colours.
const C = {
  bg: "rgba(15, 23, 34, 0.95)",
  bg2: "rgba(22, 33, 47, 0.93)",
  line: "rgba(148, 163, 184, 0.16)",
  ink: "#e9eef4",
  muted: "#8d9aab",
  cyan: "#6cc4d6",
  blue: "#7d9fca",
  green: "#7cc3a0",
  amber: "#d8a660",
  red: "#d7796f",
  violet: "#a79bd0",
};
export const UI = C;

let brushedMap: THREE.CanvasTexture | null = null;
/**
 * Horizontal brushed-metal streaks used as a roughness map. Values sit near
 * the top of the range so the surface is never mirror-smooth, and the faint
 * streaks break up reflections the way real machined steel does.
 */
export function brushedRoughness() {
  if (brushedMap) return brushedMap;
  const w = 512;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const rows = Float32Array.from({ length: h }, () => rnd());
  for (let y = 0; y < h; y++) {
    const streak = (rows[y] + rows[(y + 1) % h] + rows[(y + h - 1) % h]) / 3;
    for (let x = 0; x < w; x++) {
      const grain = rnd();
      const v = 218 + (streak - 0.5) * 14 + (grain - 0.5) * 6;
      const i = (y * w + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  brushedMap = new THREE.CanvasTexture(canvas);
  brushedMap.wrapS = brushedMap.wrapT = THREE.RepeatWrapping;
  brushedMap.repeat.set(2, 2);
  return brushedMap;
}

function frame(ctx: CanvasRenderingContext2D, w: number, h: number, accent = C.cyan, r = 28) {
  ctx.clearRect(0, 0, w, h);
  roundRect(ctx, 4, 4, w - 8, h - 8, r);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, C.bg2);
  g.addColorStop(1, C.bg);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = C.line;
  ctx.stroke();
  // accent edge
  ctx.save();
  ctx.clip();
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(4, 4, w - 8, 5);
  ctx.restore();
}

function tag(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size = 20) {
  ctx.font = font(size, 600, true);
  const tw = ctx.measureText(text).width;
  roundRect(ctx, x, y, tw + 24, size + 16, 10);
  ctx.fillStyle = `${color}22`;
  ctx.fill();
  ctx.strokeStyle = `${color}88`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 12, y + (size + 16) / 2 + 1);
  return tw + 24;
}

export type CardSpec = { title: string; user: string; field: string; category: string; accent: string };

export function cardTexture(c: CardSpec) {
  return canvasTexture(`card:${c.title}:${c.user}`, 512, 320, (ctx, w, h) => {
    frame(ctx, w, h, c.accent);
    // icon
    roundRect(ctx, 32, 40, 64, 64, 16);
    ctx.fillStyle = `${c.accent}26`;
    ctx.fill();
    ctx.fillStyle = c.accent;
    ctx.font = font(30, 700);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(c.title.slice(0, 1).toUpperCase(), 64, 73);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = C.ink;
    ctx.font = font(32, 600);
    ctx.fillText(c.title, 116, 66);
    ctx.fillStyle = C.muted;
    ctx.font = font(22, 400);
    ctx.fillText(c.user, 116, 98);
    // masked field
    roundRect(ctx, 32, 146, w - 64, 64, 14);
    ctx.fillStyle = "rgba(7,17,31,0.75)";
    ctx.fill();
    ctx.fillStyle = C.ink;
    ctx.font = font(28, 500, true);
    ctx.fillText(c.field, 52, 188);
    tag(ctx, c.category, 32, 240, c.accent);
    ctx.fillStyle = C.muted;
    ctx.font = font(18, 500, true);
    ctx.textAlign = "right";
    ctx.fillText("SAMPLE", w - 36, 266);
    ctx.textAlign = "left";
  });
}

export type Row = [label: string, value: string, tone?: string];

export function panelTexture(key: string, opts: { title: string; badge?: [string, string]; rows: Row[]; w?: number; h?: number; mono?: boolean; accent?: string }) {
  const w = opts.w ?? 640;
  const h = opts.h ?? 420;
  return canvasTexture(`panel:${key}`, w, h, (ctx) => {
    frame(ctx, w, h, opts.accent ?? C.cyan);
    ctx.fillStyle = C.ink;
    ctx.font = font(30, 600);
    ctx.textBaseline = "alphabetic";
    ctx.fillText(opts.title, 36, 64);
    if (opts.badge) {
      ctx.font = font(18, 600, true);
      const bw = ctx.measureText(opts.badge[0]).width + 24;
      tag(ctx, opts.badge[0], w - 36 - bw, 34, opts.badge[1], 18);
    }
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(36, 88);
    ctx.lineTo(w - 36, 88);
    ctx.stroke();
    const rowH = (h - 120) / Math.max(opts.rows.length, 1);
    opts.rows.forEach(([label, value, tone], i) => {
      const y = 112 + i * rowH + rowH * 0.45;
      ctx.fillStyle = C.muted;
      ctx.font = font(22, 400, opts.mono);
      ctx.textAlign = "left";
      ctx.fillText(label, 36, y);
      ctx.fillStyle = tone ?? C.ink;
      ctx.font = font(22, 500, true);
      ctx.textAlign = "right";
      ctx.fillText(value, w - 36, y);
      ctx.textAlign = "left";
      if (i < opts.rows.length - 1) {
        ctx.strokeStyle = "rgba(148,163,184,0.12)";
        ctx.beginPath();
        ctx.moveTo(36, y + rowH * 0.5);
        ctx.lineTo(w - 36, y + rowH * 0.5);
        ctx.stroke();
      }
    });
  });
}

export function codeTexture(key: string, file: string, lines: [string, string][]) {
  return canvasTexture(`code:${key}`, 640, 400, (ctx, w, h) => {
    frame(ctx, w, h, C.violet, 22);
    ["#c9645c", "#d4a24c", "#6aa878"].forEach((c, i) => {
      ctx.beginPath();
      ctx.arc(40 + i * 26, 42, 8, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    ctx.fillStyle = C.muted;
    ctx.font = font(20, 500, true);
    ctx.fillText(file, 130, 49);
    lines.forEach(([text, color], i) => {
      ctx.fillStyle = "rgba(148,163,184,0.35)";
      ctx.font = font(19, 400, true);
      ctx.fillText(String(i + 1).padStart(2, " "), 28, 104 + i * 34);
      ctx.fillStyle = color;
      ctx.font = font(21, 500, true);
      ctx.fillText(text, 68, 104 + i * 34);
    });
  });
}

export function labelTexture(text: string, sub?: string, color = C.cyan, w = 512, h = 128) {
  return canvasTexture(`label:${text}:${sub ?? ""}:${color}:${w}`, w, h, (ctx) => {
    ctx.clearRect(0, 0, w, h);
    roundRect(ctx, 4, 4, w - 8, h - 8, (h - 8) / 2);
    ctx.fillStyle = "rgba(7,17,31,0.82)";
    ctx.fill();
    ctx.strokeStyle = `${color}99`;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(h / 2, h / 2, 10, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.textBaseline = "middle";
    ctx.fillStyle = C.ink;
    ctx.font = font(sub ? 34 : 38, 600);
    ctx.fillText(text, h / 2 + 26, sub ? h / 2 - 16 : h / 2 + 2);
    if (sub) {
      ctx.fillStyle = C.muted;
      ctx.font = font(24, 500, true);
      ctx.fillText(sub, h / 2 + 26, h / 2 + 22);
    }
  });
}

export function radialTexture() {
  return canvasTexture("radial", 256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.45)");
    g.addColorStop(0.6, "rgba(255,255,255,0.08)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

/** Columns of hex "ciphertext" for the tunnel walls (decorative). */
export function glyphTexture() {
  const tex = canvasTexture("glyphs", 512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.font = font(22, 500, true);
    ctx.textBaseline = "top";
    const chars = "0123456789abcdef";
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let x = 8; x < w; x += 32) {
      const bright = rnd();
      for (let y = 0; y < h; y += 26) {
        const a = rnd();
        if (a < 0.35) continue;
        ctx.fillStyle = bright > 0.7 ? `rgba(165,243,252,${0.35 + a * 0.6})` : `rgba(96,165,250,${0.15 + a * 0.4})`;
        ctx.fillText(chars[Math.floor(rnd() * 16)], x, y);
      }
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ---------------------------------------------------------------------------
// Vault entrance: procedural cracked rock, combination-dial rings, hub emblem.
// Everything is generated once on a canvas, so the scene needs no image files.
// ---------------------------------------------------------------------------

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

const rockFields = new Map<number, Float32Array>();

/**
 * Tileable fractal height field in [0, 1]. The coarse octaves use |2n - 1|, which
 * puts a sharp V-shaped valley wherever the noise crosses 0.5. Those valleys read
 * as cracks between rock faces; the finer octaves add grain.
 */
function rockField(size: number) {
  const hit = rockFields.get(size);
  if (hit) return hit;
  const rnd = seeded(20260);
  const octaves = [
    { f: 3, w: 1.0, crack: true },
    { f: 6, w: 0.7, crack: true },
    { f: 12, w: 0.6, crack: true },
    { f: 24, w: 0.45, crack: true },
    { f: 48, w: 0.3, crack: false },
    { f: 96, w: 0.2, crack: false },
  ].map((o) => ({ ...o, grid: Float32Array.from({ length: o.f * o.f }, rnd) }));
  const total = octaves.reduce((n, o) => n + o.w, 0);
  const out = new Float32Array(size * size);
  let lo = Infinity;
  let hi = -Infinity;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let h = 0;
      for (const o of octaves) {
        const fx = (x / size) * o.f;
        const fy = (y / size) * o.f;
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const tx = fx - x0;
        const ty = fy - y0;
        const sx = tx * tx * (3 - 2 * tx);
        const sy = ty * ty * (3 - 2 * ty);
        const xa = x0 % o.f;
        const xb = (x0 + 1) % o.f;
        const ya = (y0 % o.f) * o.f;
        const yb = ((y0 + 1) % o.f) * o.f;
        const g = o.grid;
        const top = g[ya + xa] + (g[ya + xb] - g[ya + xa]) * sx;
        const bot = g[yb + xa] + (g[yb + xb] - g[yb + xa]) * sx;
        const n = top + (bot - top) * sy;
        h += o.w * (o.crack ? Math.abs(n * 2 - 1) ** 0.6 : n);
      }
      h /= total;
      out[y * size + x] = h;
      if (h < lo) lo = h;
      if (h > hi) hi = h;
    }
  }
  const span = hi - lo || 1;
  for (let i = 0; i < out.length; i++) out[i] = (out[i] - lo) / span;
  rockFields.set(size, out);
  return out;
}

function tiledRock(tex: THREE.CanvasTexture, repeat: number, data = false) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  if (data) tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/** Tangent-space normal map of the rock (strength sets how deep the cracks read). */
export function rockNormalTexture(size: number, repeat: number, strength = 5) {
  const tex = canvasTexture(`rock-normal:${size}`, size, size, (ctx, w, h) => {
    const f = rockField(size);
    const img = ctx.createImageData(w, h);
    const at = (x: number, y: number) => f[((y + h) % h) * w + ((x + w) % w)];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
        const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
        // Canvas rows run top→bottom while v runs bottom→top, hence +dy.
        const len = Math.hypot(dx, dy, 1);
        const i = (y * w + x) * 4;
        img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
        img.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
        img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
  return tiledRock(tex, repeat, true);
}

/** Albedo of the rock: near-black basalt, a touch lighter on the raised faces. */
export function rockColorTexture(size: number, repeat: number) {
  const tex = canvasTexture(`rock-color:${size}`, size, size, (ctx, w, h) => {
    const f = rockField(size);
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < f.length; i++) {
      const v = 0.34 + 0.66 * f[i] ** 1.4;
      const g = v * 255;
      img.data[i * 4] = g * 0.98;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = g * 1.04;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });
  return tiledRock(tex, repeat);
}

/**
 * Light spilling out of the door gap onto the surrounding rock, as a greyscale
 * map for an additive plane. The brightness is modulated by the *same* rock
 * field and tiling as the wall, so raised faces catch the glow and cracks stay
 * dark, exactly where the wall's normal map says they are.
 */
export function rimLightTexture(size: number, half: number, inner: number, tileWorld: number, fieldSize: number) {
  return canvasTexture(`rim-light:${size}:${half}:${inner}`, size, size, (ctx, w, h) => {
    const f = rockField(fieldSize);
    const img = ctx.createImageData(w, h);
    // Wall UVs map world [-34, 34] onto [0, 1] and repeat every `tileWorld` units.
    const wrap = (v: number) => v - Math.floor(v);
    for (let y = 0; y < h; y++) {
      const wy = (1 - ((y + 0.5) / h) * 2) * half;
      const row = Math.floor((1 - wrap((wy + 34) / tileWorld)) * fieldSize) % fieldSize;
      for (let x = 0; x < w; x++) {
        const wx = (((x + 0.5) / w) * 2 - 1) * half;
        const d = Math.hypot(wx, wy) - inner;
        let v = 0;
        if (d > 0) {
          const edge = Math.min(1, d / 0.12);
          v = (Math.exp(-d / 0.65) * 0.9 + Math.exp(-d / 3.0) * 0.26) * edge * edge;
          v *= Math.max(0, 1 - (Math.hypot(wx, wy) / half) ** 2);
          const col = Math.floor(wrap((wx + 34) / tileWorld) * fieldSize) % fieldSize;
          v *= 0.3 + 1.1 * f[row * fieldSize + col] ** 1.5;
        }
        const i = (y * w + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.min(255, v * 255);
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
}

/**
 * Engraved combination ring (annulus between `ratio` × R and R, UV-mapped by a
 * RingGeometry). Dark machined steel with etched tick marks and numerals.
 */
export function dialRingTexture(key: string, ratio: number, divisions: number, numberEvery: number) {
  return canvasTexture(`dial-ring:${key}`, 1024, 1024, (ctx, w) => {
    const c = w / 2;
    const R = c;
    const r0 = R * ratio;
    const band = R - r0;
    const g = ctx.createRadialGradient(c, c, r0, c, c, R);
    g.addColorStop(0, "#2b3037");
    g.addColorStop(0.5, "#1d2127");
    g.addColorStop(1, "#14171c");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c, c, R, 0, Math.PI * 2);
    ctx.arc(c, c, r0, 0, Math.PI * 2, true);
    ctx.fill("evenodd");

    // Fine turned-metal grooves: concentric hairlines of random brightness.
    const rnd = seeded(99);
    for (let r = r0 + 2; r < R; r += 1.6) {
      ctx.strokeStyle = `rgba(190,200,212,${0.015 + rnd() * 0.05})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.lineCap = "round";
    for (let i = 0; i < divisions; i++) {
      const a = (i / divisions) * Math.PI * 2 - Math.PI / 2;
      const major = i % numberEvery === 0;
      const r1 = R - band * 0.06;
      const r2 = R - band * (major ? 0.38 : 0.24);
      ctx.strokeStyle = major ? "#cfd6df" : "#8c95a1";
      ctx.lineWidth = major ? 7 : 3;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
      ctx.lineTo(c + Math.cos(a) * r2, c + Math.sin(a) * r2);
      ctx.stroke();
      if (major) {
        ctx.save();
        ctx.translate(c, c);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = "#b9c1cb";
        ctx.font = font(Math.max(22, band * 0.2), 600, true);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(Math.round((i / divisions) * 100)), 0, -(R - band * 0.64));
        ctx.restore();
      }
    }
  });
}

/** Hub emblem: the SecureVault shield-and-keyhole mark engraved into dark steel. */
export function emblemTexture() {
  return canvasTexture("vault-emblem", 512, 512, (ctx, w) => {
    const c = w / 2;
    const g = ctx.createRadialGradient(c * 0.85, c * 0.8, 10, c, c, c);
    g.addColorStop(0, "#343a43");
    g.addColorStop(0.7, "#20252b");
    g.addColorStop(1, "#14171b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, w);

    // Engraved concentric lines (a dark groove with a light lip beside it).
    for (const [r, wd] of [[0.93, 5], [0.84, 3]] as const) {
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = wd;
      ctx.beginPath();
      ctx.arc(c, c, c * r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(190,200,212,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(c, c, c * r - wd, 0, Math.PI * 2);
      ctx.stroke();
    }

    const shield = new Path2D("M16 2.5 4.5 6.8v8.1c0 7 4.8 12.2 11.5 14.6 6.7-2.4 11.5-7.6 11.5-14.6V6.8L16 2.5Z");
    const s = 10.5;
    const draw = (dx: number, color: string, lw: number) => {
      ctx.save();
      ctx.translate(c - 16 * s + dx, c - 16.2 * s + dx);
      ctx.scale(s, s);
      ctx.lineWidth = lw;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = color;
      ctx.stroke(shield);
      ctx.beginPath();
      ctx.arc(16, 13.5, 3.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(16, 16.9);
      ctx.lineTo(16, 21.9);
      ctx.stroke();
      ctx.restore();
    };
    draw(4, "rgba(0,0,0,0.65)", 1.7);
    draw(0, "#c4cbd4", 1.4);
  });
}

/**
 * What a wet floor shows of the glowing door gap: the ring's reflection hangs
 * below the floor line (d = depth below it) and smears vertically with depth,
 * like a rough-but-polished surface. Drawn on a vertical plane under the floor.
 */
export function gapReflectionTexture(ringR: number, floorY: number, worldW: number, worldH: number) {
  const W = 512;
  const H = 384;
  return canvasTexture(`gap-reflection:${ringR}:${floorY}`, W, H, (ctx) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    const N = 1100;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const d = Math.sin(a) * ringR - floorY;
      if (d < 0 || d > worldH) continue;
      const px = (Math.cos(a) * ringR / worldW + 0.5) * W;
      const py = (d / worldH) * H;
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(4.5, 5 + d * 11);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, `rgba(255,255,255,${0.1 / (1 + d * 0.5)})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });
}

// ---------------------------------------------------------------------------
// Tunnel: precast concrete lining
// ---------------------------------------------------------------------------

/**
 * Value noise on a wrapping lattice, in [0, 1). Deterministic.
 */
function latticeNoise(cellsX: number, cellsY: number, seed: number) {
  const rnd = seeded(seed);
  const grid = Float32Array.from({ length: cellsX * cellsY }, rnd);
  return (u: number, v: number) => {
    const fx = u * cellsX;
    const fy = v * cellsY;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const xa = ((x0 % cellsX) + cellsX) % cellsX;
    const xb = (xa + 1) % cellsX;
    const ya = ((y0 % cellsY) + cellsY) % cellsY;
    const yb = (ya + 1) % cellsY;
    const top = grid[ya * cellsX + xa] + (grid[ya * cellsX + xb] - grid[ya * cellsX + xa]) * sx;
    const bot = grid[yb * cellsX + xa] + (grid[yb * cellsX + xb] - grid[yb * cellsX + xa]) * sx;
    return top + (bot - top) * sy;
  };
}

/**
 * Textures for a bored tunnel lined with precast concrete segments. One tile
 * covers the whole circumference (`segments` pieces) and two rings of length,
 * with the second ring's joints offset by half a segment, as in real lining.
 * Joints are recessed grooves with a row of bolt heads either side; the face
 * has fine grain, blow-holes and vertical water staining.
 */
export function tunnelLiningTextures(w: number, h: number, segments: number, repeatAlong: number) {
  const key = `tunnel-lining:${w}x${h}:${segments}`;
  const height = new Float32Array(w * h);
  const stain = new Float32Array(w * h);
  const make = (suffix: string, draw: (ctx: CanvasRenderingContext2D) => void) => {
    const t = canvasTexture(`${key}:${suffix}`, w, h, draw);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, repeatAlong);
    t.anisotropy = 8;
    return t;
  };

  let built = false;
  const build = () => {
    if (built) return;
    built = true;
    const coarse = latticeNoise(16, 4, 11);
    const fine = latticeNoise(128, 28, 12);
    const grit = latticeNoise(512, 112, 13);
    const streak = latticeNoise(96, 3, 14);
    const streakLong = latticeNoise(24, 2, 15);
    const rnd = seeded(77);
    const segW = w / segments;
    const half = h / 2;
    // Blow-holes: small pits scattered over the face.
    const pits: [number, number, number][] = Array.from({ length: Math.round((w * h) / 2600) }, () => [rnd() * w, rnd() * h, 0.8 + rnd() * 1.8]);

    for (let y = 0; y < h; y++) {
      const ring = y < half ? 0 : 1;
      const dyRing = Math.min(y % half, half - (y % half));
      for (let x = 0; x < w; x++) {
        const u = x / w;
        const v = y / h;
        const off = ring ? segW / 2 : 0;
        const rel = (((x - off) % segW) + segW) % segW;
        const dx = Math.min(rel, segW - rel);

        let hgt = 0.62 + (coarse(u, v) - 0.5) * 0.14 + (fine(u, v) - 0.5) * 0.12 + (grit(u, v) - 0.5) * 0.1;
        // Recessed joints, softly bevelled.
        const g = Math.max(Math.max(0, 1 - dyRing / 4), Math.max(0, 1 - dx / 3.5));
        hgt -= g * g * 0.55;
        height[y * w + x] = Math.max(0, hgt);

        // Water staining: long vertical streaks, strongest below the joints.
        const s = streak(u, v * 0.5) ** 3 * (0.4 + 0.6 * streakLong(u, v));
        stain[y * w + x] = s;
      }
    }

    for (const [px, py, r] of pits) {
      const R = Math.ceil(r + 1);
      for (let oy = -R; oy <= R; oy++) {
        for (let ox = -R; ox <= R; ox++) {
          const d = Math.hypot(ox, oy);
          if (d > r) continue;
          const xx = (Math.floor(px) + ox + w) % w;
          const yy = (Math.floor(py) + oy + h) % h;
          height[yy * w + xx] -= (1 - d / r) * 0.35;
        }
      }
    }

    // Bolt heads: a raised dot every half-segment, a little off each ring joint.
    for (let ring = 0; ring < 2; ring++) {
      for (let k = 0; k < segments * 3; k++) {
        const bx = ((k + 0.5) / (segments * 3)) * w;
        for (const by of [ring * half + 11, ring * half + half - 11]) {
          const r = 3.2;
          for (let oy = -4; oy <= 4; oy++) {
            for (let ox = -4; ox <= 4; ox++) {
              const d = Math.hypot(ox, oy);
              if (d > r) continue;
              const xx = (Math.floor(bx) + ox + w) % w;
              const yy = (by + oy + h) % h;
              height[yy * w + xx] += (1 - (d / r) ** 2) * 0.5;
            }
          }
        }
      }
    }
  };

  const normal = make("normal", (ctx) => {
    build();
    const img = ctx.createImageData(w, h);
    const at = (x: number, y: number) => height[((y + h) % h) * w + ((x + w) % w)];
    const strength = 4.5;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
        const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
        const len = Math.hypot(dx, dy, 1);
        const i = (y * w + x) * 4;
        img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
        img.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
        img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
  normal.colorSpace = THREE.NoColorSpace;

  const color = make("color", (ctx) => {
    build();
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      // Light grey cement; joints and pits read darker, stains darker and slightly warm.
      const base = 0.5 + (height[i] - 0.62) * 0.55;
      const s = stain[i] * 0.55;
      const v = Math.max(0.05, base * (1 - s));
      img.data[i * 4] = Math.min(255, v * 255 * (1 + s * 0.18));
      img.data[i * 4 + 1] = v * 255;
      img.data[i * 4 + 2] = v * 255 * (1 - s * 0.12) * 1.02;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });

  return { normal, color };
}

// ---------------------------------------------------------------------------
// Personal Vault room
// ---------------------------------------------------------------------------

/** Dark honed stone tiles with fine seams and mottling; tile once per `repeat` unit. */
export function floorTileTexture() {
  const tex = canvasTexture("room-floor-tiles", 1024, 1024, (ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    const rnd = seeded(77);
    const field = new Float32Array(w * h);
    // Two octaves of soft mottling
    const grid = (cells: number) => {
      const g = new Float32Array(cells * cells);
      for (let i = 0; i < g.length; i++) g[i] = rnd();
      return (x: number, y: number) => {
        const fx = (x / w) * cells;
        const fy = (y / h) * cells;
        const x0 = Math.floor(fx) % cells;
        const y0 = Math.floor(fy) % cells;
        const x1 = (x0 + 1) % cells;
        const y1 = (y0 + 1) % cells;
        const tx = fx - Math.floor(fx);
        const ty = fy - Math.floor(fy);
        const sx = tx * tx * (3 - 2 * tx);
        const sy = ty * ty * (3 - 2 * ty);
        const a = g[y0 * cells + x0] * (1 - sx) + g[y0 * cells + x1] * sx;
        const b = g[y1 * cells + x0] * (1 - sx) + g[y1 * cells + x1] * sx;
        return a * (1 - sy) + b * sy;
      };
    };
    const n1 = grid(6);
    const n2 = grid(24);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) field[y * w + x] = n1(x, y) * 0.6 + n2(x, y) * 0.4;
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const v = field[y * w + x];
        const speck = rnd() < 0.02 ? 12 : 0;
        const base = 26 + v * 18 + speck;
        // Seam lines at the tile borders (2 tiles across)
        const dx = Math.min(x % (w / 2), w / 2 - (x % (w / 2)));
        const dy = Math.min(y % (h / 2), h / 2 - (y % (h / 2)));
        const seam = Math.min(dx, dy) < 2.2 ? 0.45 : 1;
        img.data[i] = base * 0.92 * seam;
        img.data[i + 1] = base * 0.98 * seam;
        img.data[i + 2] = base * 1.1 * seam;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** Light beam alpha ramp: strong at the source (top), thin toward the floor. */
export function beamTexture() {
  return canvasTexture("room-beam", 8, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.5, "rgba(255,255,255,0.28)");
    g.addColorStop(1, "rgba(255,255,255,0.08)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

/**
 * One period of the deposit room's plaster-and-stone wall (repeats around the
 * room). Lighting is baked in: bright where the cove lights graze the top,
 * falling off toward a dark skirting. Drawn top (ceiling) to bottom (floor).
 */
export function roomWallTexture() {
  return canvasTexture("room-wall", 512, 1024, (ctx, w, h) => {
    const rnd = seeded(31);
    const base = ctx.createLinearGradient(0, 0, 0, h);
    base.addColorStop(0, "#a8916a");
    base.addColorStop(0.1, "#8a7859");
    base.addColorStop(0.22, "#6a5f4f");
    base.addColorStop(0.6, "#4a443b");
    base.addColorStop(1, "#262320");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    // Soft mottling of the stone
    for (let i = 0; i < 520; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const r = 14 + rnd() * 60;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const light = rnd() > 0.5;
      g.addColorStop(0, light ? "rgba(255,240,215,0.045)" : "rgba(0,0,0,0.06)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // A raised panel with bevelled edges (light from above)
    const panel = (x: number, y: number, pw: number, ph: number, depth = 6) => {
      ctx.fillStyle = "rgba(255,238,205,0.045)";
      ctx.fillRect(x, y, pw, ph);
      ctx.fillStyle = "rgba(255,240,215,0.28)";
      ctx.fillRect(x, y, pw, depth * 0.5);
      ctx.fillStyle = "rgba(255,240,215,0.12)";
      ctx.fillRect(x, y, depth * 0.5, ph);
      ctx.fillStyle = "rgba(0,0,0,0.42)";
      ctx.fillRect(x, y + ph - depth, pw, depth);
      ctx.fillRect(x + pw - depth * 0.7, y, depth * 0.7, ph);
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 1, y - 1, pw + 2, ph + 2);
    };

    // Veining inside the main panel
    const mainTop = 170;
    const mainBottom = 760;
    ctx.save();
    ctx.beginPath();
    ctx.rect(30, mainTop, w - 60, mainBottom - mainTop);
    ctx.clip();
    for (let i = 0; i < 9; i++) {
      ctx.strokeStyle = `rgba(255,236,205,${0.04 + rnd() * 0.06})`;
      ctx.lineWidth = 0.6 + rnd() * 1.2;
      ctx.beginPath();
      let x = rnd() * w;
      let y = mainTop;
      ctx.moveTo(x, y);
      while (y < mainBottom) {
        x += (rnd() - 0.5) * 60;
        y += 40 + rnd() * 50;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    panel(30, mainTop, w - 60, mainBottom - mainTop, 10);
    panel(30, mainBottom + 36, w - 60, 130, 7);

    // Dado rail
    ctx.fillStyle = "#7e6c4c";
    ctx.fillRect(0, mainBottom + 14, w, 12);
    ctx.fillStyle = "rgba(255,235,190,0.55)";
    ctx.fillRect(0, mainBottom + 14, w, 3);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, mainBottom + 26, w, 4);

    // Crown moulding and cove at the top
    ctx.fillStyle = "#3a3126";
    ctx.fillRect(0, 0, w, 26);
    ctx.fillStyle = "rgba(255,226,170,0.7)";
    ctx.fillRect(0, 26, w, 3);
    const cove = ctx.createLinearGradient(0, 29, 0, 150);
    cove.addColorStop(0, "rgba(255,226,170,0.55)");
    cove.addColorStop(1, "rgba(255,226,170,0)");
    ctx.fillStyle = cove;
    ctx.fillRect(0, 29, w, 121);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 150, w, 6);

    // Bronze skirting
    ctx.fillStyle = "#2b2418";
    ctx.fillRect(0, h - 78, w, 78);
    ctx.fillStyle = "rgba(220,190,120,0.5)";
    ctx.fillRect(0, h - 78, w, 3);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, h - 60, w, 3);
  });
}

/**
 * The deposit room's ceiling, seen from below as a disc. Concentric coffers
 * and radial ribs, downlights in rings around the point under the safe, and a
 * glow where the cove light spills onto it. The disc is `span` world units
 * wide; `cx`/`cy` (0-1) place the safe within it.
 */
export function roomCeilingTexture(span: number, cx: number, cy: number) {
  return canvasTexture("room-ceiling", 1024, 1024, (ctx, w, h) => {
    const mid = w / 2;
    const u = w / span;
    const bg = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid);
    bg.addColorStop(0, "#2a2621");
    bg.addColorStop(0.55, "#312c25");
    bg.addColorStop(0.85, "#5a4d39");
    bg.addColorStop(1, "#a88f62");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const px = cx * w;
    const py = cy * h;
    // Coffer rings centred on the safe
    for (const r of [2.6, 4.4, 6.4, 8.8, 11.4]) {
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(px, py, r * u, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,230,180,0.22)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, r * u - 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Radial ribs
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      ctx.strokeStyle = "rgba(0,0,0,0.38)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(px + Math.cos(a) * 2.6 * u, py + Math.sin(a) * 2.6 * u);
      ctx.lineTo(px + Math.cos(a) * 14 * u, py + Math.sin(a) * 14 * u);
      ctx.stroke();
    }
    // Downlights: warm discs with a halo
    const rings: [number, number][] = [
      [1.6, 6],
      [3.5, 10],
      [5.4, 14],
      [7.6, 18],
      [10.1, 22],
    ];
    for (const [r, n] of rings) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r;
        const x = px + Math.cos(a) * r * u;
        const y = py + Math.sin(a) * r * u;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 0.8 * u);
        g.addColorStop(0, "rgba(255,244,222,1)");
        g.addColorStop(0.3, "rgba(255,222,170,0.65)");
        g.addColorStop(1, "rgba(255,200,130,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 0.8 * u, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

/** Soft rectangular contact shadow (black, alpha only): a footprint of `fw`x`fh` of the 1x1 plane. */
export function contactShadowTexture(fw: number, fh: number) {
  return canvasTexture(`room-contact-${fw}-${fh}`, 256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const rw = w * fw;
    const rh = h * fh;
    ctx.shadowColor = "rgba(0,0,0,1)";
    ctx.shadowBlur = 34;
    ctx.shadowOffsetX = w * 2;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.roundRect((w - rw) / 2 - w * 2, (h - rh) / 2, rw, rh, 10);
    ctx.fill();
  });
}

/**
 * Front of a 42U server rack: a stack of 1U/2U units (perforated servers, drive
 * bays, switches, patch panels, blanks). `leds` returns only the lit status
 * LEDs (transparent elsewhere), to be layered additively and pulsed.
 */
export function serverRackTexture(variant: number, leds: boolean) {
  return canvasTexture(`server-rack-${variant}-${leds ? "led" : "base"}`, 256, 768, (ctx, w, h) => {
    const rnd = seeded(101 + variant * 977);
    const pad = 14;
    const u = 32;
    const x0 = pad;
    const x1 = w - pad;
    const uw = x1 - x0;
    if (leds) ctx.clearRect(0, 0, w, h);
    else {
      ctx.fillStyle = "#0b0e12";
      ctx.fillRect(0, 0, w, h);
      // Mounting rails with holes
      ctx.fillStyle = "#1a2027";
      ctx.fillRect(0, 0, pad, h);
      ctx.fillRect(w - pad, 0, pad, h);
      ctx.fillStyle = "#06080a";
      for (let y = 22; y < h - 10; y += 16) {
        ctx.fillRect(4, y, 6, 6);
        ctx.fillRect(w - 10, y, 6, 6);
      }
    }
    const led = (x: number, y: number, on = rnd() < 0.8) => {
      const k = rnd();
      const c = k < 0.72 ? "#4dff93" : k < 0.84 ? "#ffb13b" : "#53b2ff";
      if (!leds) {
        ctx.fillStyle = "#05070a";
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      if (!on) return;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 8);
      g.addColorStop(0, c);
      g.addColorStop(0.3, `${c}aa`);
      g.addColorStop(1, `${c}00`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    };

    let y = 16;
    while (y + u <= h - 16) {
      const r = rnd();
      const kind = r < 0.38 ? 0 : r < 0.6 ? 1 : r < 0.76 ? 2 : r < 0.88 ? 3 : 4;
      let span = kind === 1 ? 2 : kind === 0 && rnd() < 0.3 ? 2 : 1;
      if (y + u * span > h - 16) span = 1;
      const uh = u * span - 2;
      const cy = y + uh / 2;
      if (!leds) {
        const g = ctx.createLinearGradient(0, y, 0, y + uh);
        g.addColorStop(0, "#2d353f");
        g.addColorStop(1, "#171c22");
        ctx.fillStyle = g;
        ctx.fillRect(x0, y, uw, uh);
        ctx.fillStyle = "rgba(255,255,255,0.14)";
        ctx.fillRect(x0, y, uw, 1);
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(x0, y + uh - 1, uw, 1);
      }
      if (kind === 0) {
        if (!leds) {
          ctx.fillStyle = "#07090c";
          for (let gy = y + 6; gy < y + uh - 5; gy += 5) for (let gx = x0 + 28; gx < x0 + 150; gx += 5) ctx.fillRect(gx, gy, 2.4, 2.4);
          ctx.fillStyle = "#4c5762";
          ctx.fillRect(x0 + 4, y + 5, 3, uh - 10);
          ctx.fillRect(x1 - 7, y + 5, 3, uh - 10);
        }
        for (let k = 0; k < 3; k++) led(x1 - 26 + k * 8, cy);
      } else if (kind === 1) {
        const rows = span;
        const bw = (uw - 20) / 8;
        for (let rr = 0; rr < rows; rr++)
          for (let c = 0; c < 8; c++) {
            const bx = x0 + 10 + c * bw;
            const by = y + 4 + rr * (uh / rows);
            const bh = uh / rows - 8;
            if (!leds) {
              ctx.fillStyle = "#0a0d11";
              ctx.fillRect(bx + 1, by, bw - 3, bh);
              ctx.strokeStyle = "rgba(255,255,255,0.1)";
              ctx.lineWidth = 1;
              ctx.strokeRect(bx + 1.5, by + 0.5, bw - 4, bh - 1);
            }
            led(bx + bw - 7, by + 5);
          }
      } else if (kind === 2) {
        for (let rr = 0; rr < 2; rr++)
          for (let c = 0; c < 12; c++) {
            const px = x0 + 14 + c * 15.5;
            const py = y + 5 + rr * 12;
            if (!leds) {
              ctx.fillStyle = "#050709";
              ctx.fillRect(px, py, 10, 8);
              ctx.strokeStyle = "rgba(120,135,150,0.5)";
              ctx.strokeRect(px + 0.5, py + 0.5, 9, 7);
            }
            led(px + 5, py - 1.5 + (rr ? 11 : 0) - (rr ? 0 : 0), rnd() < 0.55);
          }
      } else if (kind === 3) {
        for (let c = 0; c < 16; c++) {
          const px = x0 + 10 + c * 13.4;
          const cable = rnd() < 0.45;
          const k = rnd();
          const sway = rnd();
          if (!leds) {
            ctx.fillStyle = "#050709";
            ctx.fillRect(px, y + 9, 9, 9);
            ctx.strokeStyle = "rgba(150,160,170,0.45)";
            ctx.strokeRect(px + 0.5, y + 9.5, 8, 8);
            if (cable) {
              ctx.strokeStyle = k < 0.4 ? "#2f6fd6" : k < 0.7 ? "#d6b32f" : "#c9ced4";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(px + 4.5, y + 18);
              ctx.quadraticCurveTo(px + 4.5 + (sway - 0.5) * 10, y + 28, px + 4.5, y + uh);
              ctx.stroke();
              ctx.lineWidth = 1;
            }
          }
        }
      } else if (!leds) {
        ctx.fillStyle = "#06080a";
        ctx.beginPath();
        ctx.arc(x0 + 8, cy, 2, 0, Math.PI * 2);
        ctx.arc(x1 - 8, cy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      y += u * span;
    }
  });
}

/** Raised access-floor tiles (600 mm grid), some perforated; 4x4 tiles per image. */
export function serverFloorTexture() {
  const tex = canvasTexture("server-floor", 512, 512, (ctx, w, h) => {
    const rnd = seeded(404);
    const n = 4;
    const t = w / n;
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const v = 52 + rnd() * 10;
        ctx.fillStyle = `rgb(${v},${v + 4},${v + 9})`;
        ctx.fillRect(i * t, j * t, t, t);
        const g = ctx.createLinearGradient(i * t, j * t, (i + 1) * t, (j + 1) * t);
        g.addColorStop(0, "rgba(255,255,255,0.07)");
        g.addColorStop(1, "rgba(0,0,0,0.12)");
        ctx.fillStyle = g;
        ctx.fillRect(i * t, j * t, t, t);
        if ((i * 3 + j * 5) % 5 === 1) {
          ctx.fillStyle = "rgba(0,0,0,0.65)";
          for (let y = 14; y < t - 10; y += 9) for (let x = 14; x < t - 10; x += 9) ctx.fillRect(i * t + x, j * t + y, 4, 4);
        }
        ctx.strokeStyle = "rgba(0,0,0,0.85)";
        ctx.lineWidth = 3;
        ctx.strokeRect(i * t + 1.5, j * t + 1.5, t - 3, t - 3);
        ctx.strokeStyle = "rgba(190,210,230,0.16)";
        ctx.lineWidth = 1;
        ctx.strokeRect(i * t + 4.5, j * t + 4.5, t - 9, t - 9);
      }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Painted wall panels of the server hall, lit from the ceiling strips (baked). */
export function serverWallTexture() {
  const tex = canvasTexture("server-wall", 512, 1024, (ctx, w, h) => {
    const rnd = seeded(808);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#56677a");
    g.addColorStop(0.2, "#3d4b5b");
    g.addColorStop(0.6, "#262f3a");
    g.addColorStop(1, "#141a21");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const r = 20 + rnd() * 70;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, rnd() > 0.5 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gr;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // Panel seams
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, 3, h);
    ctx.fillRect(w - 3, 0, 3, h);
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fillRect(3, 0, 2, h);
    // Hazard band above the racks
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, h * 0.72, w, 6);
  });
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

export function serverCeilingTexture() {
  const tex = canvasTexture("server-ceiling", 256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#3c4856";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(170,195,220,0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, w - 8, h - 8);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Soft glow across a strip's width (u), constant along its length. */
export function glowLineTexture() {
  return canvasTexture("glow-line", 64, 4, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

/** Backlit wall sign for the server hall. */
export function serverSignTexture() {
  return canvasTexture("server-sign", 1024, 320, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.shadowColor = "rgba(90,220,255,0.9)";
    ctx.shadowBlur = 26;
    ctx.strokeStyle = "#9eeaff";
    ctx.fillStyle = "#e8fbff";
    ctx.lineWidth = 7;
    ctx.lineJoin = "round";
    // Shield with a keyhole
    const cx = 168;
    const cy = 150;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 104);
    ctx.lineTo(cx + 78, cy - 76);
    ctx.lineTo(cx + 78, cy + 8);
    ctx.quadraticCurveTo(cx + 78, cy + 70, cx, cy + 110);
    ctx.quadraticCurveTo(cx - 78, cy + 70, cx - 78, cy + 8);
    ctx.lineTo(cx - 78, cy - 76);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 7, cy + 8, 14, 38);
    ctx.shadowBlur = 20;
    ctx.font = font(104, 700);
    ctx.textBaseline = "alphabetic";
    ctx.fillText("SecureVault", 290, 168);
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#8fdcf0";
    ctx.font = font(34, 500, true);
    ctx.fillText("DEVELOPER VAULT  ·  SECRETS & KEYS", 294, 232);
  });
}

/** Light shaft: soft horizontally, strongest at the top and fading down. */
export function shaftTexture() {
  return canvasTexture("light-shaft", 64, 256, (ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      const v = Math.pow(1 - y / h, 1.5);
      for (let x = 0; x < w; x++) {
        const dx = (x - w / 2) / (w / 2);
        const a = Math.exp(-dx * dx * 3.2) * v;
        const i = (y * w + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        img.data[i + 3] = Math.round(a * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
  });
}

/** Holographic floor halo: concentric rings, dashes, tick marks and a radar sweep. */
export function haloTexture() {
  return canvasTexture("holo-halo", 1024, 1024, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const c = w / 2;
    const R = c; // 1 = plane half-size
    const ring = (f: number, width: number, a: number, dash?: number[]) => {
      ctx.setLineDash(dash ?? []);
      ctx.strokeStyle = `rgba(127,232,255,${a})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.arc(c, c, f * R, 0, Math.PI * 2);
      ctx.stroke();
    };
    ring(0.375, 3, 0.85);
    ring(0.4, 8, 0.35, [26, 14]);
    ring(0.55, 2, 0.7);
    ring(0.575, 5, 0.45, [4, 10]);
    ring(0.7, 2, 0.25);
    ctx.setLineDash([]);
    // Tick marks
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      const long = i % 10 === 0;
      const r0 = 0.585 * R;
      const r1 = (long ? 0.645 : 0.615) * R;
      ctx.strokeStyle = `rgba(160,240,255,${long ? 0.9 : 0.5})`;
      ctx.lineWidth = long ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0);
      ctx.lineTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
      ctx.stroke();
    }
    // Radar sweep wedge with a bright leading edge
    const slices = 70;
    const span = Math.PI * 0.55;
    for (let i = 0; i < slices; i++) {
      const a1 = -(i / slices) * span;
      const a0 = -((i + 1) / slices) * span;
      ctx.fillStyle = `rgba(110,225,255,${0.2 * Math.pow(1 - i / slices, 2)})`;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.arc(c, c, 0.55 * R, a0, a1 + 0.01);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(200,248,255,0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c + 0.55 * R, c);
    ctx.stroke();
  });
}

/**
 * Top of the round boardroom table, drawn as a polar image (the ring's UVs are
 * planar): sunburst walnut veneer, a brass inlay ring and a soft sheen.
 * `inner` is the hole radius as a fraction of the outer radius.
 */
export function boardTableTexture(inner: number) {
  return canvasTexture("board-table", 1024, 1024, (ctx, w, h) => {
    const rnd = seeded(515);
    const c = w / 2;
    ctx.fillStyle = "#24160e";
    ctx.fillRect(0, 0, w, h);
    const wedges = 40;
    for (let i = 0; i < wedges; i++) {
      const a0 = (i / wedges) * Math.PI * 2;
      const a1 = ((i + 1) / wedges) * Math.PI * 2 + 0.004;
      const t = rnd();
      const base = [46 + t * 26, 28 + t * 16, 17 + t * 9];
      ctx.fillStyle = `rgb(${base[0] | 0},${base[1] | 0},${base[2] | 0})`;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.arc(c, c, c, a0, a1);
      ctx.closePath();
      ctx.fill();
      // Grain running along the wedge
      for (let k = 0; k < 26; k++) {
        const a = a0 + (a1 - a0) * rnd();
        ctx.strokeStyle = rnd() > 0.5 ? "rgba(255,200,140,0.06)" : "rgba(0,0,0,0.12)";
        ctx.lineWidth = 0.6 + rnd() * 1.4;
        ctx.beginPath();
        ctx.moveTo(c + Math.cos(a) * inner * c, c + Math.sin(a) * inner * c);
        ctx.lineTo(c + Math.cos(a) * c, c + Math.sin(a) * c);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a0) * inner * c, c + Math.sin(a0) * inner * c);
      ctx.lineTo(c + Math.cos(a0) * c, c + Math.sin(a0) * c);
      ctx.stroke();
    }
    const ring = (f: number, lw: number, col: string) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.arc(c, c, f * c, 0, Math.PI * 2);
      ctx.stroke();
    };
    ring(0.93, 7, "#14100c");
    ring(0.93, 3, "#c9a869");
    ring(inner + 0.07, 3, "#c9a869");
    ring(inner + 0.07, 8, "rgba(0,0,0,0.25)");
    // Soft sheen
    const g = ctx.createRadialGradient(c, c, inner * c, c, c, c);
    g.addColorStop(0, "rgba(255,230,190,0.0)");
    g.addColorStop(0.5, "rgba(255,230,190,0.08)");
    g.addColorStop(1, "rgba(0,0,0,0.25)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c, c, c, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** Night city seen through the boardroom's windows (wraps 360°, horizon near 62% down). */
export function nightCityTexture() {
  const tex = canvasTexture("night-city", 2048, 512, (ctx, w, h) => {
    const rnd = seeded(2024);
    const hz = h * 0.62;
    const sky = ctx.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, "#040915");
    sky.addColorStop(0.55, "#0d2146");
    sky.addColorStop(0.9, "#2b5483");
    sky.addColorStop(1, "#3d6d93");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, hz);
    const ground = ctx.createLinearGradient(0, hz, 0, h);
    ground.addColorStop(0, "#0b1626");
    ground.addColorStop(1, "#04070d");
    ctx.fillStyle = ground;
    ctx.fillRect(0, hz, w, h - hz);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.15 + rnd() * 0.6})`;
      ctx.fillRect(rnd() * w, rnd() * hz * 0.75, 1.5, 1.5);
    }
    // Skyline layers: far (lighter), near (darker, more windows)
    const layer = (n: number, base: string, hMin: number, hMax: number, win: number, wMin: number, wMax: number) => {
      let x = 0;
      while (x < w) {
        const bw = wMin + rnd() * (wMax - wMin);
        const bh = hMin + rnd() * (hMax - hMin);
        ctx.fillStyle = base;
        ctx.fillRect(x, hz - bh, bw, bh + 6);
        for (let wy = hz - bh + 6; wy < hz - 4; wy += 6) {
          if (rnd() > win * 4) continue;
          // A lit office floor: a broken horizontal band of window light
          const k = rnd();
          ctx.fillStyle = k < 0.55 ? "rgba(255,214,150,0.55)" : k < 0.85 ? "rgba(185,228,255,0.5)" : "rgba(255,255,255,0.6)";
          let wx = x + 2;
          while (wx < x + bw - 3) {
            const seg = 4 + rnd() * 14;
            if (rnd() < 0.8) ctx.fillRect(wx, wy, Math.min(seg, x + bw - 3 - wx), 2);
            wx += seg + 2 + rnd() * 4;
          }
        }
        if (bh > hMax * 0.8 && rnd() > 0.5) {
          ctx.fillStyle = "#ff3b3b";
          ctx.fillRect(x + bw / 2 - 1, hz - bh - 8, 2, 2);
        }
        x += bw + rnd() * 6;
        n--;
      }
    };
    layer(0, "#102039", 40, 150, 0.1, 22, 60);
    layer(0, "#08111f", 30, 190, 0.16, 26, 70);
    // City far below: streets of light
    for (let i = 0; i < 1800; i++) {
      const x = rnd() * w;
      const y = hz + 4 + Math.pow(rnd(), 1.4) * (h - hz - 6);
      const k = rnd();
      ctx.fillStyle = k < 0.65 ? "rgba(255,196,120,0.8)" : k < 0.85 ? "rgba(255,255,255,0.7)" : "rgba(120,200,255,0.75)";
      ctx.fillRect(x, y, 1.5 + rnd() * 2.5, 1.5);
    }
    for (let i = 0; i < 40; i++) {
      const x = rnd() * w;
      const y = hz + 8 + rnd() * (h - hz - 20);
      const g = ctx.createRadialGradient(x, y, 0, x, y, 14 + rnd() * 20);
      g.addColorStop(0, "rgba(255,200,130,0.25)");
      g.addColorStop(1, "rgba(255,200,130,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - 40, y - 40, 80, 80);
    }
    // Horizon glow
    const glow = ctx.createLinearGradient(0, hz - 70, 0, hz + 10);
    glow.addColorStop(0, "rgba(90,160,210,0)");
    glow.addColorStop(1, "rgba(90,160,210,0.28)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, hz - 70, w, 80);
  });
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/** Front of an access keycard: dark steel, gold chip, contactless mark, micro-text. */
export function keycardTexture() {
  return canvasTexture("keycard", 512, 320, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#39414b");
    g.addColorStop(0.5, "#1d2229");
    g.addColorStop(1, "#2c333c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Fine guilloche lines
    ctx.strokeStyle = "rgba(180,200,225,0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const y = 150 + Math.sin(x * 0.02 + i * 0.35) * (30 + i * 2.2);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Chip
    const cg = ctx.createLinearGradient(50, 100, 140, 180);
    cg.addColorStop(0, "#f0d78a");
    cg.addColorStop(0.5, "#b99a4c");
    cg.addColorStop(1, "#e6c673");
    ctx.fillStyle = cg;
    roundRect(ctx, 50, 104, 92, 72, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(60,40,10,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 128); ctx.lineTo(142, 128);
    ctx.moveTo(50, 152); ctx.lineTo(142, 152);
    ctx.moveTo(96, 104); ctx.lineTo(96, 176);
    ctx.stroke();
    // Contactless arcs
    ctx.strokeStyle = "rgba(220,235,250,0.7)";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(190, 140, 20 + i * 15, -0.7, 0.7);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(225,235,248,0.85)";
    ctx.font = font(26, 600, true);
    ctx.fillText("SECUREVAULT", 50, 262);
    ctx.fillStyle = "rgba(160,180,205,0.6)";
    ctx.font = font(15, 500, true);
    ctx.fillText("SHARED ACCESS  ·  DEMO", 52, 288);
  });
}

/** Slatted acoustic wall panels of the security operations room (baked light). */
export function socWallTexture() {
  const tex = canvasTexture("soc-wall", 512, 512, (ctx, w, h) => {
    const rnd = seeded(66);
    ctx.fillStyle = "#0d1219";
    ctx.fillRect(0, 0, w, h);
    const slat = 16;
    for (let x = 0; x < w; x += slat) {
      const v = 62 + rnd() * 20;
      const g = ctx.createLinearGradient(x, 0, x + slat, 0);
      g.addColorStop(0, `rgb(${v + 14},${v + 8},${v})`);
      g.addColorStop(0.5, `rgb(${v},${v - 5},${v - 12})`);
      g.addColorStop(1, `rgb(${v - 14},${v - 18},${v - 24})`);
      ctx.fillStyle = g;
      ctx.fillRect(x + 1, 0, slat - 3, h);
    }
    // Light falloff: brighter near the top cove, dark near the floor
    const f = ctx.createLinearGradient(0, 0, 0, h);
    f.addColorStop(0, "rgba(120,170,220,0.3)");
    f.addColorStop(0.35, "rgba(0,0,0,0.05)");
    f.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = f;
    ctx.fillRect(0, 0, w, h);
    // Horizontal reveal
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, h * 0.5, w, 5);
    ctx.fillStyle = "rgba(150,200,240,0.25)";
    ctx.fillRect(0, h * 0.5 + 5, w, 2);
  });
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/** Dashboards for the operations room's video wall and consoles (all fictional data). */
export function socScreenTexture(kind: number) {
  return canvasTexture(`soc-screen-${kind}`, 1024, 576, (ctx, w, h) => {
    const rnd = seeded(300 + kind * 31);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0a1522");
    bg.addColorStop(1, "#050a12");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const titles = ["ACCESS MAP · DEMO DATA", "SIGN-INS · LAST 24 H", "EVENT LOG · SAMPLE", "VAULT HEALTH · DEMO"];
    ctx.fillStyle = "rgba(20,40,60,0.9)";
    ctx.fillRect(0, 0, w, 56);
    ctx.fillStyle = "#cfe8f6";
    ctx.font = font(24, 600, true);
    ctx.fillText(titles[kind % 4], 28, 37);
    ctx.fillStyle = "#4dff93";
    ctx.beginPath();
    ctx.arc(w - 36, 28, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(120,170,210,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(14.5, 70.5, w - 29, h - 85);

    if (kind % 4 === 0) {
      // Dotted world blobs and arcs between nodes
      const blobs: [number, number, number, number][] = [
        [250, 250, 150, 90], [330, 420, 70, 90], [560, 230, 90, 70], [610, 370, 80, 100], [760, 250, 150, 85], [860, 430, 55, 40],
      ];
      for (const [bx, by, rx, ry] of blobs)
        for (let i = 0; i < 520; i++) {
          const a = rnd() * Math.PI * 2;
          const r = Math.sqrt(rnd());
          const x = Math.round((bx + Math.cos(a) * rx * r) / 9) * 9;
          const y = Math.round((by + Math.sin(a) * ry * r) / 9) * 9;
          ctx.fillStyle = "rgba(110,170,215,0.45)";
          ctx.fillRect(x, y, 3, 3);
        }
      const pts: [number, number][] = [[270, 230], [340, 410], [560, 220], [620, 350], [770, 240], [870, 420], [450, 300]];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i * 3 + 2) % pts.length];
        ctx.strokeStyle = i % 4 === 3 ? "rgba(255,177,59,0.85)" : "rgba(100,225,255,0.8)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.quadraticCurveTo((a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 90, b[0], b[1]);
        ctx.stroke();
      }
      for (const [x, y] of pts) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.3, "rgba(100,225,255,0.8)");
        g.addColorStop(1, "rgba(100,225,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (kind % 4 === 1) {
      for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = "rgba(120,170,210,0.12)";
        ctx.beginPath();
        ctx.moveTo(40, 110 + i * 52);
        ctx.lineTo(w - 40, 110 + i * 52);
        ctx.stroke();
      }
      const line = (col: string, fill: string, amp: number, ph: number) => {
        ctx.beginPath();
        for (let x = 40; x <= w - 40; x += 8) {
          const y = 420 - amp * (0.5 + 0.5 * Math.sin(x * 0.011 + ph)) - 40 * Math.sin(x * 0.037 + ph * 2) - rnd() * 10;
          if (x === 40) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = col;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.lineTo(w - 40, 480);
        ctx.lineTo(40, 480);
        ctx.fillStyle = fill;
        ctx.fill();
      };
      line("#64e1ff", "rgba(100,225,255,0.12)", 190, 0.4);
      line("#7ea6ff", "rgba(126,166,255,0.08)", 120, 2.1);
      ctx.fillStyle = "#e6f6ff";
      ctx.font = font(64, 700);
      ctx.fillText("82", 70, 150);
      ctx.fillStyle = "#8db4cc";
      ctx.font = font(24, 500, true);
      ctx.fillText("/ 100 SECURITY SCORE", 160, 150);
    } else if (kind % 4 === 2) {
      const rows: [string, string, string][] = [
        ["10:42:07", "sign-in verified · laptop", "#4dff93"],
        ["10:41:55", "vault synced · 3 items", "#8fd6ee"],
        ["10:40:12", "device approved · phone", "#4dff93"],
        ["10:38:49", "key rotated · deploy", "#8fd6ee"],
        ["10:37:03", "sign-in review · unknown", "#ffb13b"],
        ["10:35:41", "share expired · viewer", "#8fd6ee"],
        ["10:33:18", "sign-in verified · tablet", "#4dff93"],
        ["10:31:02", "backup completed", "#8fd6ee"],
        ["10:28:44", "recovery kit checked", "#4dff93"],
      ];
      ctx.font = font(26, 500, true);
      rows.forEach(([t, m, c], i) => {
        const y = 118 + i * 48;
        ctx.fillStyle = "rgba(140,170,200,0.55)";
        ctx.fillText(t, 36, y);
        ctx.fillStyle = c;
        ctx.fillText(m, 220, y);
        ctx.fillStyle = "rgba(120,170,210,0.1)";
        ctx.fillRect(30, y + 14, w - 60, 1);
      });
    } else {
      // Donut and bars
      const cx = 260;
      const cy = 330;
      const segs: [number, string][] = [[0.62, "#64e1ff"], [0.18, "#7ea6ff"], [0.12, "#ffb13b"], [0.08, "#ff6b6b"]];
      let a0 = -Math.PI / 2;
      for (const [f, c] of segs) {
        ctx.strokeStyle = c;
        ctx.lineWidth = 46;
        ctx.beginPath();
        ctx.arc(cx, cy, 130, a0, a0 + f * Math.PI * 2 - 0.03);
        ctx.stroke();
        a0 += f * Math.PI * 2;
      }
      ctx.fillStyle = "#e6f6ff";
      ctx.font = font(54, 700);
      ctx.textAlign = "center";
      ctx.fillText("82%", cx, cy + 18);
      ctx.textAlign = "left";
      ["Strong", "Reused", "Weak", "Old"].forEach((n, i) => {
        const y = 180 + i * 80;
        ctx.fillStyle = "#9dbdd2";
        ctx.font = font(24, 500, true);
        ctx.fillText(n.toUpperCase(), 520, y);
        ctx.fillStyle = "rgba(120,170,210,0.15)";
        ctx.fillRect(520, y + 14, 420, 14);
        ctx.fillStyle = segs[i][1];
        ctx.fillRect(520, y + 14, 420 * [0.82, 0.3, 0.18, 0.12][i], 14);
      });
    }
    // Scanlines
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  });
}

/* ---- Password-health chart (Security Center) ------------------------------ */
// World layout of the chart: panel 2.2 wide x 1.75 tall, bars 0.118 tall per saved login.
const HC_W = 2.2;
const HC_H = 1.75;
const HC_UNIT = 0.118;
export const HEALTH_CHART = { w: HC_W, h: HC_H, unit: HC_UNIT, xs: [-0.75, -0.25, 0.25, 0.75] };

/** Glass back panel with etched gridlines, axis ticks and a title. Demonstration data only. */
export function healthBackTexture() {
  return canvasTexture("health-back", 1024, 816, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(140,190,235,0.5)");
    g.addColorStop(1, "rgba(60,110,160,0.3)");
    ctx.fillStyle = g;
    roundRect(ctx, 2, 2, w - 4, h - 4, 18);
    ctx.fill();
    ctx.strokeStyle = "rgba(190,225,255,0.55)";
    ctx.lineWidth = 3;
    roundRect(ctx, 2, 2, w - 4, h - 4, 18);
    ctx.stroke();

    const py = (worldY: number) => h * (1 - worldY / HC_H);
    ctx.font = font(22, 500, true);
    ctx.textBaseline = "middle";
    for (let k = 0; k <= 4; k++) {
      const y = py(k * 3 * HC_UNIT);
      ctx.strokeStyle = k === 0 ? "rgba(220,240,255,0.7)" : "rgba(200,230,255,0.28)";
      ctx.lineWidth = k === 0 ? 3 : 1.5;
      if (k > 0) ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(78, y);
      ctx.lineTo(w - 24, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(225,240,255,0.85)";
      ctx.textAlign = "right";
      ctx.fillText(String(k * 3), 62, y);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f2f8ff";
    ctx.font = font(38, 700);
    ctx.fillText("Password health", 40, 58);
    ctx.fillStyle = "rgba(225,240,255,0.7)";
    ctx.font = font(22, 500, true);
    ctx.fillText("24 saved logins · demonstration data", 40, 92);
  });
}

/** Printed legend that sits on the base in front of the bars. */
export function healthFrontTexture() {
  const items: [string, string, string][] = [
    ["STRONG", "11", "#9fe0cb"],
    ["REUSED", "4", "#f1c778"],
    ["WEAK", "3", "#f09a96"],
    ["OLD", "6", "#a9c7ea"],
  ];
  return canvasTexture("health-front", 1024, 160, (ctx, w, h) => {
    ctx.fillStyle = "#0f151c";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(160,190,220,0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.textAlign = "center";
    items.forEach(([name, n, c], i) => {
      const x = ((HEALTH_CHART.xs[i] + HC_W / 2) / HC_W) * w;
      ctx.fillStyle = c;
      ctx.font = font(56, 700, true);
      ctx.fillText(n, x, 70);
      ctx.fillStyle = "rgba(225,235,245,0.8)";
      ctx.font = font(28, 600, true);
      ctx.fillText(name, x, 120);
    });
  });
}

/* ---- Security Center exit corridor ---------------------------------------- */
/** Side wall (length x height = 1024 x 320): steel panels, kick plate, guide light, baked pools from the ceiling lights. */
export function corridorWallTexture() {
  return canvasTexture("corr-wall", 1024, 683, (ctx, w, h) => {
    const rnd = seeded(41);
    const panels = 6;
    const pw = w / panels;
    for (let i = 0; i < panels; i++) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#38424f");
      g.addColorStop(1, "#262e39");
      ctx.fillStyle = g;
      ctx.fillRect(i * pw, 0, pw, h);
      // bevelled inset
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 2;
      ctx.strokeRect(i * pw + 14, 16, pw - 28, h * 0.72 - 16);
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.strokeRect(i * pw + 17, 19, pw - 28, h * 0.72 - 16);
      // seams
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.fillRect(i * pw - 2, 0, 4, h);
      // fasteners
      ctx.fillStyle = "rgba(190,200,215,0.45)";
      for (const [fx, fy] of [[26, 28], [pw - 26, 28], [26, h * 0.72 - 6], [pw - 26, h * 0.72 - 6]]) {
        ctx.beginPath();
        ctx.arc(i * pw + fx, fy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // kick plate
    ctx.fillStyle = "#151a21";
    ctx.fillRect(0, h * 0.88, w, h * 0.12);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(0, h * 0.88, w, 2);
    // guide light
    ctx.shadowColor = "rgba(95,227,255,0.9)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#8fefff";
    ctx.fillRect(0, h * 0.79, w, 5);
    ctx.shadowBlur = 0;
    // brushed grain
    for (let i = 0; i < 700; i++) {
      ctx.fillStyle = `rgba(255,255,255,${rnd() * 0.03})`;
      ctx.fillRect(rnd() * w, rnd() * h * 0.86, 20 + rnd() * 60, 1);
    }
    // light pools under three ceiling fixtures
    for (const c of [1 / 6, 3 / 6, 5 / 6]) {
      const g = ctx.createRadialGradient(c * w, 0, 0, c * w, 0, 230);
      g.addColorStop(0, "rgba(180,215,255,0.5)");
      g.addColorStop(1, "rgba(180,215,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  });
}

/** Floor (width x length = 256 x 1024): dark tiles with a centre line of chevrons pointing ahead (top of image). */
export function corridorFloorTexture() {
  return canvasTexture("corr-floor", 512, 768, (ctx, w, h) => {
    ctx.fillStyle = "#1a2029";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 3;
    for (let y = 0; y <= h; y += 96) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    // edge rails
    ctx.fillStyle = "#0f1318";
    ctx.fillRect(0, 0, 22, h);
    ctx.fillRect(w - 22, 0, 22, h);
    // chevrons
    ctx.shadowColor = "rgba(95,227,255,0.9)";
    ctx.shadowBlur = 12;
    ctx.strokeStyle = "#7fe9ff";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    for (let y = 90; y < h; y += 200) {
      ctx.beginPath();
      ctx.moveTo(w / 2 - 64, y + 40);
      ctx.lineTo(w / 2, y - 22);
      ctx.lineTo(w / 2 + 64, y + 40);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // light pools
    for (const c of [1 / 6, 3 / 6, 5 / 6]) {
      const y = (1 - c) * h;
      const g = ctx.createRadialGradient(w / 2, y, 0, w / 2, y, 260);
      g.addColorStop(0, "rgba(170,205,245,0.35)");
      g.addColorStop(1, "rgba(170,205,245,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  });
}

/** Ceiling (width x length = 256 x 1024; top of image is the room end): panels with three lit diffusers. */
export function corridorCeilTexture() {
  return canvasTexture("corr-ceil", 512, 768, (ctx, w, h) => {
    ctx.fillStyle = "#222a34";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 3;
    for (let y = 0; y <= h; y += 96) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (const c of [1 / 6, 3 / 6, 5 / 6]) {
      const y = c * h;
      const halo = ctx.createRadialGradient(w / 2, y, 0, w / 2, y, 150);
      halo.addColorStop(0, "rgba(190,220,255,0.35)");
      halo.addColorStop(1, "rgba(190,220,255,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, y - 150, w, 300);
      ctx.fillStyle = "#e6f2ff";
      roundRect(ctx, w / 2 - 130, y - 28, 260, 56, 10);
      ctx.fill();
      ctx.strokeStyle = "#0e1319";
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  });
}

/** Illuminated sign above the doorway. */
export function doorSignTexture() {
  return canvasTexture("door-sign", 1024, 160, (ctx, w, h) => {
    ctx.fillStyle = "#0b1118";
    roundRect(ctx, 4, 4, w - 8, h - 8, 18);
    ctx.fill();
    ctx.strokeStyle = "rgba(120,215,240,0.7)";
    ctx.lineWidth = 4;
    roundRect(ctx, 4, 4, w - 8, h - 8, 18);
    ctx.stroke();
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#8fefff";
    ctx.font = font(62, 700);
    ctx.textAlign = "left";
    ctx.fillText("Zero-knowledge design", 48, h / 2 - 8);
    ctx.fillStyle = "rgba(210,230,245,0.7)";
    ctx.font = font(26, 500, true);
    ctx.fillText("NEXT SECTION", 52, h / 2 + 42);
    ctx.fillStyle = "#8fefff";
    ctx.beginPath();
    ctx.moveTo(w - 150, h / 2 - 34);
    ctx.lineTo(w - 70, h / 2);
    ctx.lineTo(w - 150, h / 2 + 34);
    ctx.lineTo(w - 128, h / 2);
    ctx.closePath();
    ctx.fill();
  });
}

/* ---- Zero-knowledge scene: home office + server room ----------------------- */
/** Painted living-room wall (one repeat): warm off-white, soft mottling, skirting at the bottom. */
export function homeWallTexture() {
  const tex = canvasTexture("home-wall", 512, 1024, (ctx, w, h) => {
    const rnd = seeded(515);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#a89f92");
    g.addColorStop(0.35, "#8f877b");
    g.addColorStop(0.9, "#5d564d");
    g.addColorStop(1, "#2a2622");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const r = 20 + rnd() * 70;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, rnd() > 0.5 ? "rgba(255,245,230,0.03)" : "rgba(0,0,0,0.018)");
      rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // skirting board
    ctx.fillStyle = "#b9b1a5";
    ctx.fillRect(0, h * 0.925, w, h * 0.075);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(0, h * 0.925, w, 3);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, h - 4, w, 4);
    // picture rail near the ceiling
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, h * 0.06, w, 3);
  });
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/** Oak plank floor (4 planks across, repeats). */
export function woodFloorTexture() {
  const tex = canvasTexture("zk-wood", 512, 512, (ctx, w, h) => {
    const rnd = seeded(77);
    const planks = 4;
    const pw = w / planks;
    for (let i = 0; i < planks; i++) {
      const shift = rnd() * h;
      const tone = 0.85 + rnd() * 0.3;
      const base = `rgb(${Math.round(138 * tone)},${Math.round(98 * tone)},${Math.round(62 * tone)})`;
      ctx.fillStyle = base;
      ctx.fillRect(i * pw, 0, pw, h);
      for (let k = 0; k < 70; k++) {
        const x = i * pw + rnd() * pw;
        ctx.strokeStyle = `rgba(${rnd() > 0.5 ? "60,36,18" : "190,140,90"},${0.05 + rnd() * 0.12})`;
        ctx.lineWidth = 0.6 + rnd() * 1.4;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + rnd() * 6 - 3, h * 0.33, x + rnd() * 8 - 4, h * 0.66, x + rnd() * 4 - 2, h);
        ctx.stroke();
      }
      // butt joint
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(i * pw, shift, pw, 2);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(i * pw, 0, 2, h);
      ctx.fillStyle = "rgba(255,230,190,0.08)";
      ctx.fillRect(i * pw + 2, 0, 2, h);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Woven rug: deep blue field with a cream border. */
export function rugTexture() {
  return canvasTexture("zk-rug", 512, 384, (ctx, w, h) => {
    const rnd = seeded(12);
    ctx.fillStyle = "#26364d";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#d8cdb8";
    ctx.fillRect(0, 0, w, 22);
    ctx.fillRect(0, h - 22, w, 22);
    ctx.fillRect(0, 0, 22, h);
    ctx.fillRect(w - 22, 0, 22, h);
    ctx.strokeStyle = "#b86a4a";
    ctx.lineWidth = 6;
    ctx.strokeRect(46, 46, w - 92, h - 92);
    ctx.strokeStyle = "rgba(216,205,184,0.28)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.strokeRect(76 + i * 24, 76 + i * 20, w - 152 - i * 48, h - 152 - i * 40);
    }
    // weave noise
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = `rgba(${rnd() > 0.5 ? "255,255,255" : "0,0,0"},${rnd() * 0.06})`;
      ctx.fillRect(rnd() * w, rnd() * h, 1.5, 4);
    }
  });
}

/* ---- Final scene: daybreak seen through the vault doorway ------------------ */
/** Sunrise over layered hills (horizon at 62% down, sun slightly right of centre). */
export function dawnTexture() {
  return canvasTexture("dawn", 1024, 768, (ctx, w, h) => {
    const rnd = seeded(909);
    const hz = h * 0.62;
    const sky = ctx.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, "#3b5688");
    sky.addColorStop(0.45, "#8fa6cf");
    sky.addColorStop(0.8, "#f1c9a0");
    sky.addColorStop(1, "#ffdca8");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, hz);
    // sun glow
    const sx = w * 0.56;
    const sy = h * 0.54;
    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, w * 0.3);
    glow.addColorStop(0, "rgba(255,246,222,1)");
    glow.addColorStop(0.06, "rgba(255,238,200,0.95)");
    glow.addColorStop(0.25, "rgba(255,212,150,0.5)");
    glow.addColorStop(1, "rgba(255,190,130,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    // soft clouds
    for (let i = 0; i < 26; i++) {
      const cx = rnd() * w;
      const cy = hz * (0.2 + rnd() * 0.65);
      const rw = 70 + rnd() * 150;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rw);
      g.addColorStop(0, `rgba(255,${200 + Math.round(rnd() * 40)},${170 + Math.round(rnd() * 40)},${0.1 + rnd() * 0.12})`);
      g.addColorStop(1, "rgba(255,200,170,0)");
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.22);
      ctx.translate(-cx, -cy);
      ctx.fillStyle = g;
      ctx.fillRect(cx - rw, cy - rw, rw * 2, rw * 2);
      ctx.restore();
    }
    // layered hills, far to near, with atmospheric haze
    const hills = [
      { base: 0.12, amp: 0.05, col: "#b99a96", seed: 1 },
      { base: 0.08, amp: 0.07, col: "#8c7f8f", seed: 2 },
      { base: 0.03, amp: 0.08, col: "#5f6479", seed: 3 },
      { base: -0.02, amp: 0.07, col: "#3b4358", seed: 4 },
    ];
    for (const L of hills) {
      ctx.fillStyle = L.col;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) {
        const y = hz - h * L.base - h * L.amp * (0.5 + 0.5 * Math.sin(x * 0.006 + L.seed * 2) * Math.sin(x * 0.0023 + L.seed) + 0.25 * Math.sin(x * 0.017 + L.seed * 5));
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      const haze = ctx.createLinearGradient(0, hz - h * 0.22, 0, hz + 10);
      haze.addColorStop(0, "rgba(255,215,170,0)");
      haze.addColorStop(1, "rgba(255,215,170,0.22)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, hz - h * 0.22, w, h * 0.22 + 10);
    }
    ctx.fillStyle = "#2c3446";
    ctx.fillRect(0, hz + h * 0.02, w, h);
    const mist = ctx.createLinearGradient(0, hz - 20, 0, h);
    mist.addColorStop(0, "rgba(255,220,180,0.28)");
    mist.addColorStop(0.2, "rgba(40,44,62,0.35)");
    mist.addColorStop(1, "rgba(14,18,30,0.8)");
    ctx.fillStyle = mist;
    ctx.fillRect(0, hz - 20, w, h);
  });
}

/** A single olive-style leaf on transparent ground (for instanced foliage cards). */
export function leafTexture() {
  return canvasTexture("leaf", 64, 160, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "#5f7f4a");
    g.addColorStop(0.5, "#8fae6c");
    g.addColorStop(1, "#4d6c3c");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(w / 2, 4);
    ctx.bezierCurveTo(w * 0.95, h * 0.3, w * 0.9, h * 0.75, w / 2, h - 6);
    ctx.bezierCurveTo(w * 0.1, h * 0.75, w * 0.05, h * 0.3, w / 2, 4);
    ctx.fill();
    ctx.strokeStyle = "rgba(225,235,200,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 10);
    ctx.lineTo(w / 2, h - 8);
    ctx.stroke();
  });
}

/** Lengthwise fall-off only (bright at the top edge), for light cones wrapped around a cylinder. */
export function lengthFadeTexture() {
  return canvasTexture("length-fade", 4, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}
