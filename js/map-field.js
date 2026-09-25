// Высота и влажность. Форма суши — шум, не круг.

import { fbm, mixSeed } from "./map-noise.js";

const SEA_QUANTILE = 0.58;

export function raiseLand(world) {
  const { cols, rows, seed } = world;
  const n = cols * rows;
  const elev = new Float32Array(n);
  const moist = new Float32Array(n);
  const shapeSeed = mixSeed(seed, 1);
  const detailSeed = mixSeed(seed, 2);
  const moistSeed = mixSeed(seed, 3);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const warp = (fbm(x * 0.02, y * 0.02, shapeSeed) - 0.5) * 14;
      const mass = fbm((x + warp) * 0.011, (y - warp) * 0.013, shapeSeed);
      const detail = fbm(x * 0.045, y * 0.045, detailSeed);
      elev[i] = mass * 0.72 + detail * 0.28;
      moist[i] = fbm(x * 0.03, y * 0.028, moistSeed);
    }
  }
  return { elev, moist, sea: quantile(elev, SEA_QUANTILE) };
}

function quantile(values, q) {
  const sample = [];
  for (let i = 0; i < values.length; i += 8) sample.push(values[i]);
  sample.sort((a, b) => a - b);
  const at = Math.min(sample.length - 1, Math.floor(sample.length * q));
  return sample[at];
}
