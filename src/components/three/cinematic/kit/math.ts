export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Remap `v` from [a, b] to [0, 1] (clamped). */
export const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeOut = (t: number) => 1 - (1 - t) ** 3;
export const easeIn = (t: number) => t * t * t;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
/** Slight overshoot, for mechanical "click into place" moments. */
export const backOut = (t: number) => {
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};
/**
 * Per-item progress for staggered sequences: item `i` of `n` animates over a
 * (1 - spread) slice of the parent progress, starting at i/n * spread.
 */
export const stagger = (v: number, i: number, n: number, spread = 0.5) => {
  const start = n <= 1 ? 0 : (i / (n - 1)) * spread;
  return range(v, start, start + (1 - spread));
};
/** Deterministic pseudo-random in [0, 1) so layouts are identical on every mount. */
export const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
