// Шум только от seed. Декор и берег берут разные соли, чтобы лес не двигал море.

export const GENERATOR_VERSION = 1;

export function mixSeed(seed, salt) {
  let n = Math.imul(Math.floor(seed) ^ Math.imul(salt, 2246822519), 374761393);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}

export function hash01(ix, iy, seed) {
  let n = Math.imul(ix | 0, 374761393) ^ Math.imul(iy | 0, 668265263) ^ seed;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function fade(t) { return t * t * (3 - 2 * t); }

export function valueNoise(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = fade(x - x0);
  const ty = fade(y - y0);
  const a = hash01(x0, y0, seed);
  const b = hash01(x0 + 1, y0, seed);
  const c = hash01(x0, y0 + 1, seed);
  const d = hash01(x0 + 1, y0 + 1, seed);
  const ab = a + (b - a) * tx;
  const cd = c + (d - c) * tx;
  return ab + (cd - ab) * ty;
}

export function fbm(x, y, seed) {
  let amp = 0.5;
  let sum = 0;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < 4; i++) {
    sum += valueNoise(x * freq, y * freq, seed + i * 101) * amp;
    norm += amp;
    freq *= 2;
    amp *= 0.5;
  }
  return sum / norm;
}
