// Земля одним цветом биома. Чередование клеток не используется.

import {
  BIOME_FERTILE, BIOME_FOREST, BIOME_FRESH, BIOME_HILL, BIOME_ROCK, BIOME_SHALLOW, BIOME_SHORE,
} from "./map-biome.js";
import { knownAt } from "./chart.js";
import {
  TILE_DEEP, TILE_FOREST, TILE_FRESH, TILE_GRASS, TILE_HILL, TILE_SAND, TILE_SHALLOW, TILE_WATER,
} from "./world.js";

const COLOR = {
  [TILE_DEEP]: "#14384e",
  [TILE_WATER]: "#1c5f86",
  [TILE_SHALLOW]: "#3e92b8",
  [TILE_SAND]: "#e4d0a4",
  [TILE_GRASS]: "#7faf4a",
  [TILE_FOREST]: "#2f6a3c",
  [TILE_HILL]: "#8a8074",
  [TILE_FRESH]: "#3ec6d4",
};

const groundCache = new WeakMap();

export function drawGround(ctx, world) {
  const scale = ctx.getTransform().a;
  if (scale >= 48) {
    fillNear(ctx, world);
    return;
  }
  const sheet = groundCanvas(world);
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sheet, 0, 0, world.cols, world.rows);
  ctx.imageSmoothingEnabled = prev;
}

function fillNear(ctx, world) {
  const m = ctx.getTransform();
  const x0 = Math.max(0, Math.floor(-m.e / m.a) - 1);
  const y0 = Math.max(0, Math.floor(-m.f / m.d) - 1);
  const x1 = Math.min(world.cols - 1, Math.ceil((ctx.canvas.width - m.e) / m.a) + 1);
  const y1 = Math.min(world.rows - 1, Math.ceil((ctx.canvas.height - m.f) / m.d) + 1);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const rgb = tint(world, world.idx(x, y));
      ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function groundCanvas(world) {
  const rev = world.chartRev || 0;
  const hit = groundCache.get(world);
  if (hit && hit.rev === rev) return hit.canvas;
  const canvas = document.createElement("canvas");
  const w = world.cols;
  const h = world.rows;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(w, h);
  const data = img.data;
  for (let i = 0; i < world.tiles.length; i++) {
    const hex = tint(world, i);
    const p = i * 4;
    data[p] = hex[0];
    data[p + 1] = hex[1];
    data[p + 2] = hex[2];
    data[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  groundCache.set(world, { canvas, rev });
  return canvas;
}

function tint(world, i) {
  const x = i % world.cols;
  const y = (i / world.cols) | 0;
  if (world.known && !knownAt(world, x, y)) return [10, 18, 28];
  const biome = world.biome ? world.biome[i] : -1;
  let hex = COLOR[world.tiles[i]] || COLOR[TILE_DEEP];
  if (biome === BIOME_FERTILE) hex = "#9bc86a";
  else if (biome === BIOME_ROCK) hex = "#5c564e";
  else if (biome === BIOME_HILL) hex = "#8a8074";
  else if (biome === BIOME_FOREST) hex = "#2f6a3c";
  else if (biome === BIOME_FRESH) hex = "#3ec6d4";
  else if (biome === BIOME_SHORE) hex = "#e4d0a4";
  else if (biome === BIOME_SHALLOW) hex = "#3e92b8";
  const elev = world.elevation ? world.elevation[i] : 0.5;
  const shift = Math.round((elev - 0.5) * 18);
  return hexRgb(hex).map((c) => clamp(c + shift));
}

function hexRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function clamp(v) { return Math.max(0, Math.min(255, v)); }

export function drawCanopy(ctx, world) {
  const scale = ctx.getTransform().a;
  if (scale < 4 || scale >= 48) return;
  ctx.fillStyle = "#173d22";
  for (let y = 0; y < world.rows; y += 3) {
    for (let x = 0; x < world.cols; x += 3) {
      if (world.tileAt(x, y) !== TILE_FOREST || !knownAt(world, x, y)) continue;
      ctx.beginPath();
      ctx.arc(x + 0.55, y + 0.55, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
