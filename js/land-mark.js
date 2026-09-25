// Знаки участка: трава, кроны, камень, песок, вода. Гуще, когда клетка крупнее.

import { knownAt } from "./chart.js";
import { BIOME_FERTILE } from "./map-biome.js";
import { drawCover } from "./land-cover.js";
import { photoReach } from "./land-load.js";
import { METERS_PER_TILE } from "./measure.js";
import {
  TILE_DEEP, TILE_FRESH, TILE_GRASS, TILE_SAND, TILE_SHALLOW, TILE_WATER,
} from "./world.js";

const SPLIT = 720;

export function drawMarks(ctx, world, pass) {
  const scale = ctx.getTransform().a;
  if (scale < 12) return;
  const box = viewBox(ctx, world);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      if (!knownAt(world, x, y)) continue;
      const tile = world.tileAt(x, y);
      const biome = world.biome ? world.biome[world.idx(x, y)] : -1;
      if (pass === "ground") dress(ctx, world, x, y, tile, biome, scale);
      else if (scale < SPLIT) drawCover(ctx, world, x, y, tile, biome, scale);
    }
  }
  ctx.restore();
}

function dress(ctx, world, x, y, tile, biome, scale) {
  const bare = photoReach(scale) < 0.4;
  if (tile === TILE_GRASS) {
    if (bare) blades(ctx, x, y, scale, biome === BIOME_FERTILE);
  } else if (tile === TILE_SAND) {
    if (bare) grains(ctx, world, x, y, scale);
    else if (touchesSea(world, x, y)) foam(ctx, x, y, scale);
  } else if (tile === TILE_FRESH && scale < SPLIT) brook(ctx, world, x, y, scale);
  else if (tile === TILE_SHALLOW || tile === TILE_WATER) waves(ctx, x, y, scale);
}

function blades(ctx, x, y, scale, lush) {
  const metric = 1.2 / METERS_PER_TILE;
  const h = Math.max(metric, Math.min(0.16, 14 / scale));
  const step = Math.max(0.05, h * 1.5, Math.min(0.2, 20 / scale));
  const ox = unit(x, y, 8) * step;
  const oy = unit(x, y, 9) * step;
  let i = 0;
  ctx.lineWidth = Math.max(metric * 0.35, 1.15 / scale);
  for (let gy = oy; gy < 0.98; gy += step) {
    for (let gx = ox; gx < 0.98; gx += step) {
      i += 1;
      if (unit(x, y, i) < 0.28) continue;
      const px = x + gx + (unit(x, y, i + 2) - 0.5) * step * 0.7;
      const py = y + gy + (unit(x, y, i + 6) - 0.5) * step * 0.5;
      const tall = h * (0.65 + unit(x, y, i + 3) * 0.7);
      ctx.strokeStyle = lush || unit(x, y, i) > 0.6 ? "#3d6828" : "#b89a4e";
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + tall * 0.4, py - tall * 0.4, px + tall * 0.1, py - tall);
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px - tall * 0.3, py - tall * 0.3, px - tall * 0.18, py - tall * 0.75);
      ctx.stroke();
    }
  }
}

function grains(ctx, world, x, y, scale) {
  const n = scale > 200 ? 8 : 5;
  for (let i = 0; i < n; i++) {
    const px = x + 0.15 + unit(x, y, i) * 0.7;
    const py = y + 0.15 + unit(x, y, i + 4) * 0.7;
    const w = Math.max(0.02, Math.min(0.06, 4 / scale));
    ctx.fillStyle = i % 2 ? "#f0e2c0" : "#c6b48c";
    ctx.beginPath();
    ctx.ellipse(px, py, w, w * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (touchesSea(world, x, y)) foam(ctx, x, y, scale);
}

function brook(ctx, world, x, y, scale) {
  const shore = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
    const t = world.tileAt(x + dx, y + dy);
    return t !== TILE_FRESH && t !== TILE_WATER && t !== TILE_SHALLOW && t !== TILE_DEEP;
  });
  if (!shore && unit(x, y, 1) < 0.86) return;
  ctx.strokeStyle = "rgba(214, 242, 244, 0.38)";
  ctx.lineWidth = 1.25 / scale;
  const px = x + 0.18 + unit(x, y, 4) * 0.4;
  const py = y + 0.28 + unit(x, y, 5) * 0.45;
  const w = 0.18 + unit(x, y, 6) * 0.2;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.quadraticCurveTo(px + w * 0.5, py - 0.05, px + w, py + 0.01);
  ctx.stroke();
}

function waves(ctx, x, y, scale) {
  if (scale < 48 || unit(x, y, 2) < 0.45) return;
  ctx.strokeStyle = "rgba(226, 246, 248, 0.4)";
  ctx.lineWidth = 1.3 / scale;
  const py = y + 0.4 + unit(x, y, 5) * 0.3;
  ctx.beginPath();
  ctx.moveTo(x + 0.18, py);
  ctx.quadraticCurveTo(x + 0.4, py - 0.07, x + 0.7, py);
  ctx.stroke();
}

function foam(ctx, x, y, scale) {
  ctx.strokeStyle = "rgba(255, 252, 245, 0.55)";
  ctx.lineWidth = 1.5 / scale;
  ctx.beginPath();
  ctx.arc(x + 0.5, y + 0.62, 0.2, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
}

function touchesSea(world, x, y) {
  const sea = [TILE_DEEP, TILE_WATER, TILE_SHALLOW];
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => sea.includes(world.tileAt(x + dx, y + dy)));
}

function viewBox(ctx, world) {
  const m = ctx.getTransform();
  const pad = 1;
  return {
    x0: Math.max(0, Math.floor(-m.e / m.a) - pad),
    y0: Math.max(0, Math.floor(-m.f / m.d) - pad),
    x1: Math.min(world.cols - 1, Math.ceil((ctx.canvas.width - m.e) / m.a) + pad),
    y1: Math.min(world.rows - 1, Math.ceil((ctx.canvas.height - m.f) / m.d) + pad),
  };
}

function unit(x, y, n) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(n, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
