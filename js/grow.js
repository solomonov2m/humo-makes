// Растение берёт воду, углерод и тепло клетки. Масса равна тому, что ушло из почвы.

import { TILE_FOREST, TILE_FRESH } from "./world.js";
import { cellHeat } from "./phys.js";
import { CROPS } from "./farm.js";

const NEI = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function growGround(world) {
  growMap(world, world.food, 1);
  growMap(world, world.wood, 0.65);
}

export function growPlots(world) {
  for (const field of world.fields || []) {
    if (field.ripe) continue;
    const crop = CROPS[field.crop] || CROPS[0];
    const leaf = field.tilled ? 14 : 2.5;
    field.grow = pull(world, field.x, field.y, field, field.grow || 0, crop.days, leaf);
    if (field.grow >= crop.days) field.ripe = true;
    field.tilled = false;
  }
}

export function sipSoil(world, x, y, take) {
  const spot = spotAt(world, x, y);
  if (!spot) return 0;
  const ix = Math.round(x);
  const iy = Math.round(y);
  ensureSoil(world, ix, iy, spot);
  const got = Math.min(spot.water, Math.max(0, take));
  spot.water -= got;
  return got;
}

function growMap(world, map, leaf) {
  if (!map) return;
  for (const [key, spot] of map) {
    const cut = key.indexOf(",");
    const x = Number(key.slice(0, cut));
    const y = Number(key.slice(cut + 1));
    spot.amount = pull(world, x, y, spot, spot.amount || 0, spot.cap || 18, leaf);
  }
}

function pull(world, x, y, spot, mass, cap, leaf) {
  ensureSoil(world, x, y, spot);
  inflow(world, x, y, spot);
  const heat = cellHeat(world, x, y);
  if (heat < 0) return frost(spot, mass, heat);
  const warm = Math.min(1, heat / 14);
  const room = Math.max(0, cap - mass);
  const want = Math.min(room, 0.05 * warm * leaf);
  if (want <= 0) return mass;
  const made = Math.min(want, spot.water / 0.55, spot.carbon / 0.45);
  if (made <= 0) return mass;
  spot.water -= made * 0.55;
  spot.carbon -= made * 0.45;
  return mass + made;
}

function frost(spot, mass, heat) {
  const lost = mass * Math.min(0.02, -heat * 0.004);
  spot.carbon += lost * 0.45;
  spot.water += lost * 0.2;
  return Math.max(0, mass - lost);
}

function inflow(world, x, y, spot) {
  const heat = cellHeat(world, x, y);
  if (heat > 0 && spot.water < 1.4) spot.water += 0.028 * Math.min(1, heat / 12);
  if (heat > 0 && spring(world, x, y) && spot.water < 4) spot.water += 0.2;
  const humus = world.tileAt(x, y) === TILE_FOREST ? 1.6 : 0.85;
  if (heat > 0 && spot.carbon < humus) spot.carbon += 0.016;
  if (heat <= 0 || spot.columnW == null || !spot.tilled) return;
  const drawW = Math.min(spot.columnW, 0.4);
  const drawC = Math.min(spot.columnC, 0.32);
  spot.columnW -= drawW;
  spot.columnC -= drawC;
  spot.water += drawW;
  spot.carbon += drawC;
}

function spring(world, x, y) {
  for (const [dx, dy] of NEI) {
    if (world.tileAt(x + dx, y + dy) === TILE_FRESH) return true;
  }
  return false;
}

function ensureSoil(world, x, y, spot) {
  if (spot.water == null || spot.carbon == null) {
    const forest = world.tileAt(x, y) === TILE_FOREST;
    spot.water = forest ? 0.85 : 1.05;
    spot.carbon = forest ? 1.6 : 0.9;
  }
  if (spot.crop == null || spot.columnW != null) return;
  spot.columnW = 16;
  spot.columnC = 12;
}

function spotAt(world, x, y) {
  const key = `${Math.round(x)},${Math.round(y)}`;
  if (world.food && world.food.has(key)) return world.food.get(key);
  if (world.wood && world.wood.has(key)) return world.wood.get(key);
  return null;
}
