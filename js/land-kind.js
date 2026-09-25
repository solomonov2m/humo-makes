// Какая пластина земли лежит в клетке: песок, щебень, грунт или трава.

import { knownAt } from "./chart.js";
import {
  BIOME_FERTILE, BIOME_FOREST, BIOME_HILL, BIOME_ROCK, BIOME_SHORE,
} from "./map-biome.js";
import {
  TILE_DEEP, TILE_FOREST, TILE_FRESH, TILE_GRASS, TILE_HILL, TILE_SAND, TILE_SHALLOW, TILE_WATER,
} from "./world.js";

const WATER = new Set([TILE_DEEP, TILE_WATER, TILE_SHALLOW, TILE_FRESH]);

export function groundKind(world, x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  if (!world.inBounds(ix, iy) || !knownAt(world, ix, iy)) return null;
  const tile = world.tileAt(ix, iy);
  if (WATER.has(tile)) return null;
  const biome = world.biome ? world.biome[world.idx(ix, iy)] : -1;
  if (tile === TILE_SAND || biome === BIOME_SHORE) return "sand";
  if (biome === BIOME_ROCK) return "gravel";
  if (tile === TILE_HILL || biome === BIOME_HILL) return cellUnit(ix, iy, 2) > 0.42 ? "gravel" : "soil";
  if (tile === TILE_FOREST || biome === BIOME_FOREST || biome === BIOME_FERTILE) return "grass";
  if (tile === TILE_GRASS) {
    const fert = world.fertility ? world.fertility[world.idx(ix, iy)] : 0.3;
    return fert > 0.42 ? "grass" : "soil";
  }
  return "soil";
}

export function cellUnit(x, y, n) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(n, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
