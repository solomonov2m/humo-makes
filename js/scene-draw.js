// Крупный план: в клетке видна местность, а не один цвет.

import { knownAt } from "./chart.js";
import { BIOME_FERTILE, BIOME_ROCK } from "./map-biome.js";
import { METERS_PER_TILE } from "./measure.js";
import { TILE_FOREST, TILE_FRESH, TILE_GRASS, TILE_HILL } from "./world.js";
import { groundMatter } from "./matter.js";
import { drawBulk } from "./bulk-draw.js";

const NEAR = 48;

function meters(n) { return n / METERS_PER_TILE; }

export function drawScene(ctx, world) {
  const scale = ctx.getTransform().a;
  if (scale < NEAR) return;
  const box = viewBox(ctx, world);
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      if (!knownAt(world, x, y)) continue;
      const tile = world.tileAt(x, y);
      const biome = world.biome ? world.biome[world.idx(x, y)] : -1;
      if (tile === TILE_FOREST) stand(ctx, x, y);
      else if (tile === TILE_GRASS) meadow(ctx, x, y);
      else if (tile === TILE_FRESH) stream(ctx, world, x, y);
      else if ((tile === TILE_HILL || biome === BIOME_ROCK) && peak(world, x, y)) cone(ctx, x, y);
      else if (biome === BIOME_FERTILE) orchard(ctx, x, y);
      specimen(ctx, world, x, y);
    }
  }
  for (const house of world.houses || []) {
    if (house.x < box.x0 || house.x > box.x1 || house.y < box.y0 || house.y > box.y1) continue;
    lot(ctx, world, house, scale);
  }
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

function stand(ctx, x, y) {
  const step = meters(18);
  const canopy = meters(6);
  let i = 0;
  for (let dy = step * 0.45; dy < 1; dy += step) {
    for (let dx = step * 0.45; dx < 1; dx += step) {
      i += 1;
      if (unit(x, y, i) < 0.4) continue;
      const tx = x + dx;
      const ty = y + dy;
      ctx.fillStyle = "#5c3d28";
      ctx.fillRect(tx - meters(0.35), ty, meters(0.7), meters(3.5));
      ctx.fillStyle = i % 2 ? "#1b4428" : "#2a6238";
      ctx.beginPath();
      ctx.arc(tx, ty, canopy * (0.8 + unit(x, y, i + 9) * 0.35), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function stream(ctx, world, x, y) {
  const bank = meters(14);
  const lip = meters(4);
  ctx.fillStyle = "#e4d0a4";
  if (world.tileAt(x, y - 1) !== TILE_FRESH) ctx.fillRect(x, y, 1, bank);
  if (world.tileAt(x, y + 1) !== TILE_FRESH) ctx.fillRect(x, y + 1 - bank, 1, bank);
  if (world.tileAt(x - 1, y) !== TILE_FRESH) ctx.fillRect(x, y, bank, 1);
  if (world.tileAt(x + 1, y) !== TILE_FRESH) ctx.fillRect(x + 1 - bank, y, bank, 1);
  ctx.fillStyle = "#8fd8e2";
  ctx.fillRect(x + lip, y + lip, 1 - lip * 2, 1 - lip * 2);
}

function cone(ctx, x, y) {
  ctx.fillStyle = "#7a7368";
  ctx.beginPath();
  ctx.moveTo(x + 0.06, y + 0.94);
  ctx.lineTo(x + 0.5, y + 0.08);
  ctx.lineTo(x + 0.94, y + 0.94);
  ctx.fill();
  ctx.fillStyle = "#4a453e";
  ctx.beginPath();
  ctx.moveTo(x + 0.28, y + 0.62);
  ctx.lineTo(x + 0.5, y + 0.16);
  ctx.lineTo(x + 0.72, y + 0.62);
  ctx.fill();
  ctx.fillStyle = "#2a2622";
  ctx.beginPath();
  ctx.ellipse(x + 0.5, y + 0.24, 0.11, 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e25822";
  ctx.beginPath();
  ctx.ellipse(x + 0.5, y + 0.25, 0.045, 0.02, 0, 0, Math.PI * 2);
  ctx.fill();
}

function meadow(ctx, x, y) {
  const step = meters(20);
  let i = 0;
  for (let dy = step * 0.4; dy < 1; dy += step) {
    for (let dx = step * 0.4; dx < 1; dx += step) {
      i += 1;
      if (unit(x, y, i) < 0.45) continue;
      ctx.fillStyle = i % 2 ? "#5c8a30" : "#8f6a32";
      ctx.fillRect(x + dx, y + dy, meters(i % 2 ? 2.4 : 1.1), meters(0.7));
    }
  }
}

function orchard(ctx, x, y) {
  const step = meters(12);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const tx = x + 0.5 + (i - 1) * step;
      const ty = y + 0.5 + (j - 1) * step;
      ctx.fillStyle = "#6a8f3a";
      ctx.beginPath();
      ctx.arc(tx, ty, meters(4), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e24b3a";
      ctx.beginPath();
      ctx.arc(tx + meters(1), ty - meters(1), meters(0.7), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function lot(ctx, world, house, scale) {
  const bed = (world.fields || []).find((f) => Math.abs(f.x - house.x) <= 1 && Math.abs(f.y - house.y) <= 1);
  if (!bed && world.tileAt(house.x + 1, house.y) === TILE_GRASS) rows(ctx, house.x + 1, house.y);
}

function rows(ctx, x, y) {
  const w = meters(16);
  const h = meters(12);
  const left = x + 0.5 - w / 2;
  const top = y + 0.55;
  ctx.fillStyle = "#6b4428";
  ctx.fillRect(left, top, w, h);
  ctx.fillStyle = "#3f8f3a";
  for (let i = 0; i < 4; i++) ctx.fillRect(left + meters(1), top + meters(1.5) + i * meters(2.4), w - meters(2), meters(0.8));
}

function specimen(ctx, world, x, y) {
  const piece = groundMatter(world, x, y);
  if (!piece || piece.state === "gas" || piece.state === "liquid") return;
  const j = unit(x, y, 11);
  drawBulk(ctx, piece, x + 0.28 + j * 0.4, y + 0.68, meters(1.4 + j * 1.2));
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
  return unit(x, y, 3) > 0.72;
}

function unit(x, y, n) {
  let h = (x * 374761393 + y * 668265263 + n * 1442695041) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  return (h % 1000) / 1000;
}
