// Открыто 2×2 км вокруг стойбища. Дальше туман, пока кто-то не захочет шагнуть туда.

import { METERS_PER_TILE } from "./measure.js";

const OPEN_M = 2000;

function halfSpan() {
  const tiles = OPEN_M / METERS_PER_TILE;
  return Math.max(1, (tiles - 1) / 2);
}

export function knownAt(world, x, y) {
  if (!world.known) return true;
  if (!world.inBounds(x, y)) return false;
  return world.known[world.idx(x, y)] === 1;
}

export function openFirstChart(world) {
  const camp = world.camp || { x: world.cols / 2, y: world.rows / 2 };
  world.known = new Uint8Array(world.cols * world.rows);
  world.charts = 0;
  reveal(world, camp.x, camp.y);
}

export function wishPast(world, x0, y0, x1, y1) {
  if (!world.known) return;
  const spanM = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.ceil(spanM * 2));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    if (!world.inBounds(x, y) || knownAt(world, x, y)) continue;
    if (!world.isLand(x, y)) return;
    world.urge = { x, y };
    return;
  }
}

export function pressChart(world) {
  if (!world.known || !world.urge) return false;
  const spot = world.urge;
  world.urge = null;
  reveal(world, spot.x, spot.y);
  return true;
}

function reveal(world, cx, cy) {
  const half = halfSpan();
  const x0 = Math.max(0, Math.floor(cx - half));
  const y0 = Math.max(0, Math.floor(cy - half));
  const x1 = Math.min(world.cols - 1, Math.ceil(cx + half));
  const y1 = Math.min(world.rows - 1, Math.ceil(cy + half));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) world.known[world.idx(x, y)] = 1;
  }
  world.charts += 1;
  world.chartRev = (world.chartRev || 0) + 1;
  fitFrame(world);
}

function fitFrame(world) {
  let minX = world.cols;
  let minY = world.rows;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < world.rows; y += 2) {
    for (let x = 0; x < world.cols; x += 2) {
      if (world.known[world.idx(x, y)] !== 1) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  const pad = 1;
  const w = Math.max(8, maxX - minX + 1 + pad * 2);
  const h = Math.max(8, maxY - minY + 1 + pad * 2);
  world.frame = { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w, h };
}
