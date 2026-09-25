// Биомы после воды. Лес — пятнами плотности, камень на склоне, ягоды у кромки.

import { fbm, hash01, mixSeed } from "./map-noise.js";
import {
  TILE_DEEP, TILE_FOREST, TILE_FRESH, TILE_GRASS, TILE_HILL, TILE_SAND, TILE_SHALLOW, TILE_WATER,
} from "./world.js";

export const BIOME_DEEP = 0;
export const BIOME_SHALLOW = 1;
export const BIOME_SHORE = 2;
export const BIOME_MEADOW = 3;
export const BIOME_FERTILE = 4;
export const BIOME_FOREST = 5;
export const BIOME_HILL = 6;
export const BIOME_ROCK = 7;
export const BIOME_FRESH = 8;

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function paintBiomes(world, elev, moist, sea) {
  const n = world.cols * world.rows;
  const biome = new Uint8Array(n);
  const fertility = new Float32Array(n);
  const resource = new Uint8Array(n);
  dressCoast(world);
  const forestSeed = mixSeed(world.seed, 4);
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      const i = world.idx(x, y);
      const tile = world.tiles[i];
      if (tile === TILE_FRESH) {
        biome[i] = BIOME_FRESH;
        continue;
      }
      if (tile === TILE_DEEP || tile === TILE_WATER || tile === TILE_SHALLOW) {
        biome[i] = tile === TILE_SHALLOW ? BIOME_SHALLOW : BIOME_DEEP;
        continue;
      }
      const wet = Math.min(1, moist[i] + (nearWater(world, x, y) ? 0.28 : 0));
      moist[i] = wet;
      const slope = slopeAt(elev, world.cols, x, y);
      const height = elev[i] - sea;
      classify(world, x, y, i, height, slope, wet, forestSeed, biome, fertility, resource);
    }
  }
  smoothSingles(world, biome);
  world.biome = biome;
  world.fertility = fertility;
  world.resource = resource;
}

function classify(world, x, y, i, height, slope, wet, forestSeed, biome, fertility, resource) {
  if (world.tiles[i] === TILE_SAND) {
    biome[i] = BIOME_SHORE;
    return;
  }
  if (slope > 0.012 && height > 0.04) {
    world.tiles[i] = TILE_HILL;
    biome[i] = slope > 0.022 ? BIOME_ROCK : BIOME_HILL;
    resource[i] = 2;
    return;
  }
  const density = fbm(x * 0.05, y * 0.05, forestSeed);
  if (density > 0.56 && wet > 0.46 && height < 0.16 && height > 0.02) {
    world.tiles[i] = TILE_FOREST;
    biome[i] = BIOME_FOREST;
    resource[i] = 1;
    return;
  }
  world.tiles[i] = TILE_GRASS;
  fertility[i] = wet * (1 - height);
  biome[i] = fertility[i] > 0.55 ? BIOME_FERTILE : BIOME_MEADOW;
}

function dressCoast(world) {
  const next = new Uint8Array(world.tiles);
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      const i = world.idx(x, y);
      const tile = world.tiles[i];
      if (tile === TILE_FRESH) continue;
      const sea = tile === TILE_DEEP;
      const landish = tile === TILE_SAND || tile === TILE_GRASS || tile === TILE_FOREST || tile === TILE_HILL;
      const shore = [TILE_SAND, TILE_GRASS, TILE_FOREST, TILE_HILL, TILE_FRESH];
      if (sea && touch(world, x, y, shore)) next[i] = TILE_SHALLOW;
      else if (landish && touch(world, x, y, [TILE_DEEP, TILE_SHALLOW, TILE_WATER])) next[i] = TILE_SAND;
    }
  }
  world.tiles.set(next);
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      if (world.tileAt(x, y) !== TILE_DEEP) continue;
      if (touch(world, x, y, [TILE_SHALLOW])) world.tiles[world.idx(x, y)] = TILE_WATER;
    }
  }
}

function smoothSingles(world, biome) {
  const next = new Uint8Array(world.tiles);
  for (let y = 1; y < world.rows - 1; y++) {
    for (let x = 1; x < world.cols - 1; x++) {
      const i = world.idx(x, y);
      if (world.tiles[i] === TILE_FRESH || world.tiles[i] === TILE_DEEP) continue;
      const same = DIRS.filter(([dx, dy]) => world.tileAt(x + dx, y + dy) === world.tiles[i]).length;
      if (same > 0) continue;
      const pick = majority(world, x, y);
      if (pick == null) continue;
      next[i] = pick;
      biome[i] = biome[world.idx(x + 1, y)];
    }
  }
  world.tiles.set(next);
}

function majority(world, x, y) {
  const count = new Map();
  for (const [dx, dy] of DIRS) {
    const t = world.tileAt(x + dx, y + dy);
    if (t === TILE_FRESH || t === TILE_DEEP) continue;
    count.set(t, (count.get(t) || 0) + 1);
  }
  let best = null;
  let n = 0;
  for (const [t, c] of count) if (c > n) { best = t; n = c; }
  return best;
}

function nearWater(world, x, y) {
  return DIRS.some(([dx, dy]) => {
    const t = world.tileAt(x + dx, y + dy);
    return t === TILE_FRESH || t === TILE_SHALLOW || t === TILE_WATER;
  });
}

function touch(world, x, y, kinds) {
  return DIRS.some(([dx, dy]) => kinds.includes(world.tileAt(x + dx, y + dy)));
}

function slopeAt(elev, cols, x, y) {
  const i = y * cols + x;
  let max = 0;
  for (const [dx, dy] of DIRS) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= cols || ny * cols + nx >= elev.length) continue;
    max = Math.max(max, Math.abs(elev[i] - elev[ny * cols + nx]));
  }
  return max;
}

export function placeBerries(world) {
  const salt = mixSeed(world.seed, 5);
  for (let y = 1; y < world.rows - 1; y++) {
    for (let x = 1; x < world.cols - 1; x++) {
      if (world.tileAt(x, y) !== TILE_FOREST) continue;
      const edge = DIRS.some(([dx, dy]) => world.tileAt(x + dx, y + dy) === TILE_GRASS);
      if (!edge || hash01(x, y, salt) > 0.22) continue;
      world.food.set(`${x},${y}`, { amount: 8, cap: 14 });
      world.resource[world.idx(x, y)] = 3;
    }
  }
}
