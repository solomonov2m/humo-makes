// Цвет участка в точке карты: биом и высота, граница тает в соседей.

import { knownAt } from "./chart.js";
import {
  BIOME_FERTILE, BIOME_FOREST, BIOME_FRESH, BIOME_HILL, BIOME_ROCK, BIOME_SHALLOW, BIOME_SHORE,
} from "./map-biome.js";
import { valueNoise } from "./map-noise.js";
import {
  TILE_DEEP, TILE_FOREST, TILE_FRESH, TILE_GRASS, TILE_HILL, TILE_SAND, TILE_SHALLOW, TILE_WATER,
} from "./world.js";

const REACH = 1.22;
const INK = {
  fog: [11, 18, 26],
  deep: [12, 40, 58],
  sea: [24, 86, 124],
  shallow: [62, 156, 174],
  sand: [228, 206, 158],
  grass: [112, 156, 68],
  lush: [142, 178, 74],
  forest: [34, 88, 50],
  hill: [124, 126, 86],
  rock: [108, 102, 94],
  fresh: [56, 176, 186],
  clay: [178, 140, 100],
};

export function bakeTone(world) {
  const { cols, rows } = world;
  const rgb = new Uint8Array(cols * rows * 3);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = world.idx(x, y);
      const c = tone(world, x, y);
      rgb[i * 3] = c[0];
      rgb[i * 3 + 1] = c[1];
      rgb[i * 3 + 2] = c[2];
    }
  }
  return { rgb, cols, rows, seed: world.seed || 1 };
}

export function rasterPatch(bake, x0, y0, x1, y1, sub) {
  const tw = x1 - x0 + 1;
  const th = y1 - y0 + 1;
  const canvas = document.createElement("canvas");
  canvas.width = tw * sub;
  canvas.height = th * sub;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(canvas.width, canvas.height);
  const data = img.data;
  const { seed } = bake;
  for (let sy = 0; sy < canvas.height; sy++) {
    const y = y0 + (sy + 0.5) / sub;
    for (let sx = 0; sx < canvas.width; sx++) {
      const x = x0 + (sx + 0.5) / sub;
      const jx = (valueNoise(x * 0.55, y * 0.55, seed + 17) - 0.5) * 0.7;
      const jy = (valueNoise(x * 0.55 + 8, y * 0.55, seed + 29) - 0.5) * 0.7;
      const c = mixAt(bake, x + jx, y + jy);
      const n = (valueNoise(x * 0.62, y * 0.62, seed) - 0.5) * 18;
      const p = (sy * canvas.width + sx) * 4;
      data[p] = clamp(c[0] + n);
      data[p + 1] = clamp(c[1] + n * 0.92);
      data[p + 2] = clamp(c[2] + n * 0.8);
      data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function rasterSheet(bake, sub) {
  return rasterPatch(bake, 0, 0, bake.cols - 1, bake.rows - 1, sub);
}

function mixAt(bake, x, y) {
  return gather(bake.rgb, bake.cols, bake.rows, x, y);
}

function gather(rgb, cols, rows, x, y) {
  const x0 = Math.max(0, Math.floor(x - REACH));
  const x1 = Math.min(cols - 1, Math.floor(x + REACH));
  const y0 = Math.max(0, Math.floor(y - REACH));
  const y1 = Math.min(rows - 1, Math.floor(y + REACH));
  let r = 0;
  let g = 0;
  let b = 0;
  let wsum = 0;
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const dx = tx + 0.5 - x;
      const dy = ty + 0.5 - y;
      const d = Math.hypot(dx, dy);
      if (d > REACH) continue;
      const u = 1 - d / REACH;
      const w = u * u * (3 - 2 * u);
      const p = (ty * cols + tx) * 3;
      r += rgb[p] * w;
      g += rgb[p + 1] * w;
      b += rgb[p + 2] * w;
      wsum += w;
    }
  }
  return [r / wsum, g / wsum, b / wsum];
}

function tone(world, x, y) {
  if (!world.inBounds(x, y)) return INK.deep;
  if (world.known && !knownAt(world, x, y)) return INK.fog;
  const i = world.idx(x, y);
  const tile = world.tiles[i];
  const biome = world.biome ? world.biome[i] : -1;
  let c = INK.deep;
  if (tile === TILE_WATER) c = INK.sea;
  else if (tile === TILE_SHALLOW || biome === BIOME_SHALLOW) c = INK.shallow;
  else if (tile === TILE_SAND || biome === BIOME_SHORE) c = INK.sand;
  else if (tile === TILE_FRESH || biome === BIOME_FRESH) c = INK.fresh;
  else if (tile === TILE_FOREST || biome === BIOME_FOREST) c = INK.forest;
  else if (biome === BIOME_ROCK) c = INK.rock;
  else if (tile === TILE_HILL || biome === BIOME_HILL) c = INK.hill;
  else if (tile === TILE_GRASS) {
    const fert = world.fertility ? world.fertility[i] : biome === BIOME_FERTILE ? 0.8 : 0.2;
    c = lerp(INK.grass, INK.lush, Math.min(1, fert));
  }
  if (bank(world, x, y, tile)) c = lerp(c, INK.clay, 0.62);
  if (tile >= TILE_SAND && tile !== TILE_FRESH) {
    const elev = world.elevation ? world.elevation[i] : 0.5;
    c = shift(c, (elev - 0.48) * 46);
  }
  return c;
}

function bank(world, x, y, tile) {
  if (tile !== TILE_GRASS && tile !== TILE_SAND) return false;
  return world.tileAt(x + 1, y) === TILE_FRESH || world.tileAt(x - 1, y) === TILE_FRESH
    || world.tileAt(x, y + 1) === TILE_FRESH || world.tileAt(x, y - 1) === TILE_FRESH;
}

function lerp(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function shift(c, d) {
  return [clamp(c[0] + d), clamp(c[1] + d), clamp(c[2] + d)];
}

function clamp(v) { return Math.max(0, Math.min(255, v)); }
