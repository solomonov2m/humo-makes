// Кроны, камни и конус. На карте крупно, к человеку — в метрах.

import { BIOME_FERTILE, BIOME_ROCK } from "./map-biome.js";
import { METERS_PER_TILE } from "./measure.js";
import { TILE_FOREST, TILE_GRASS, TILE_HILL } from "./world.js";

export function drawCover(ctx, world, x, y, tile, biome, scale) {
  if (tile === TILE_FOREST) woods(ctx, x, y, scale);
  else if (tile === TILE_HILL || biome === BIOME_ROCK) stones(ctx, x, y, scale, biome === BIOME_ROCK);
  else if (biome === BIOME_FERTILE && tile === TILE_GRASS) bushes(ctx, x, y, scale);
  if ((tile === TILE_HILL || biome === BIOME_ROCK) && peak(world, x, y)) cone(ctx, x, y, scale);
}

function woods(ctx, x, y, scale) {
  const t = fade(Math.min(1, Math.max(0, (scale - 180) / 520)));
  const metric = 8 / METERS_PER_TILE;
  const r = 0.22 * (1 - t) + metric * t;
  const step = 0.3 * (1 - t) + Math.max(metric * 2.05, 16 / METERS_PER_TILE) * t;
  const ox = unit(x, y, 11) * step;
  const oy = unit(x, y, 12) * step;
  let i = 0;
  for (let gy = oy; gy < 1.02; gy += step) {
    for (let gx = ox; gx < 1.02; gx += step) {
      i += 1;
      if (unit(x, y, i) < 0.12) continue;
      const jx = (unit(x, y, i + 4) - 0.5) * step * 0.8;
      const jy = (unit(x, y, i + 7) - 0.5) * step * 0.8;
      tree(ctx, x + gx + jx, y + gy + jy, r * (0.7 + unit(x, y, i) * 0.55), scale, i);
    }
  }
}

function tree(ctx, x, y, r, scale, i) {
  ctx.fillStyle = "rgba(8, 24, 12, 0.22)";
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.62, r * 0.7, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  if (r * scale > 14) {
    ctx.fillStyle = "#5c3d28";
    ctx.fillRect(x - r * 0.06, y + r * 0.02, r * 0.12, r * 0.42);
  }
  const rot = (unit(x * 10, y * 10, i) - 0.5) * 1.2;
  ctx.fillStyle = i % 3 === 0 ? "#173f2a" : i % 3 === 1 ? "#1f5436" : "#28643f";
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.15, r * 0.78, rot, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(168, 206, 120, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x - r * 0.16, y - r * 0.18, r * 0.32, r * 0.2, rot, 0, Math.PI * 2);
  ctx.fill();
}

function stones(ctx, x, y, scale, rock) {
  const n = (rock ? 4 : 2) + (scale > 280 ? 3 : 0);
  const s = Math.max(2.4 / METERS_PER_TILE, Math.min(rock ? 0.2 : 0.14, 18 / scale));
  for (let i = 0; i < n; i++) {
    if (unit(x, y, i + 3) < 0.2) continue;
    rockOf(ctx, x + 0.2 + unit(x, y, i) * 0.6, y + 0.22 + unit(x, y, i + 6) * 0.55, s * (0.7 + unit(x, y, i + 1) * 0.6));
  }
}

function rockOf(ctx, x, y, s) {
  ctx.fillStyle = "rgba(20, 16, 12, 0.25)";
  ctx.beginPath();
  ctx.ellipse(x, y + s * 0.32, s * 0.55, s * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6e6860";
  ctx.beginPath();
  ctx.moveTo(x - s * 0.5, y + s * 0.18);
  ctx.lineTo(x - s * 0.12, y - s * 0.42);
  ctx.lineTo(x + s * 0.46, y - s * 0.02);
  ctx.lineTo(x + s * 0.16, y + s * 0.26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#948c82";
  ctx.beginPath();
  ctx.moveTo(x - s * 0.12, y - s * 0.42);
  ctx.lineTo(x + s * 0.08, y - s * 0.08);
  ctx.lineTo(x - s * 0.2, y + s * 0.02);
  ctx.closePath();
  ctx.fill();
}

function bushes(ctx, x, y, scale) {
  const n = 4 + ((x * 3 + y) % 3);
  for (let i = 0; i < n; i++) {
    const px = x + 0.18 + unit(x, y, i + 2) * 0.64;
    const py = y + 0.22 + unit(x, y, i + 5) * 0.58;
    const r = Math.max(4 / METERS_PER_TILE, Math.min(0.11, 11 / scale)) * (0.75 + unit(x, y, i) * 0.5);
    ctx.fillStyle = unit(x, y, i + 1) > 0.5 ? "#628c34" : "#7aa63e";
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    if (r * scale > 8 && unit(x, y, i + 8) > 0.55) {
      ctx.fillStyle = "#d24b3a";
      ctx.beginPath();
      ctx.arc(px + r * 0.25, py - r * 0.12, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function cone(ctx, x, y, scale) {
  const s = Math.max(0.16, Math.min(0.42, 28 / scale));
  ctx.fillStyle = "#7a7368";
  ctx.beginPath();
  ctx.moveTo(x + 0.5 - s, y + 0.5 + s * 0.85);
  ctx.lineTo(x + 0.5, y + 0.5 - s);
  ctx.lineTo(x + 0.5 + s, y + 0.5 + s * 0.85);
  ctx.fill();
  ctx.fillStyle = "#3a342e";
  ctx.beginPath();
  ctx.ellipse(x + 0.5, y + 0.5 - s * 0.72, s * 0.16, s * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
}

function peak(world, x, y) {
  const elev = world.elevation;
  if (!elev) return false;
  const here = elev[world.idx(x, y)];
  if (here < 0.62) return false;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (!world.inBounds(x + dx, y + dy)) continue;
    if (elev[world.idx(x + dx, y + dy)] > here) return false;
  }
  return unit(x, y, 3) > 0.55;
}

function fade(t) { return t * t * (3 - 2 * t); }

function unit(x, y, n) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(n, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
