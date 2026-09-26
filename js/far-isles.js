// За горизонтом — ещё земля. Её видно с берега, но дойти нельзя — только доплыть.

import { TILE_DEEP, TILE_FOREST, TILE_GRASS, TILE_HILL, TILE_SAND, TILE_SHALLOW, TILE_WATER } from "./world.js";

const SPECS = [
  { angle: -40, dist: 55, r: 5.2 },
  { angle: 150, dist: 50, r: 4.4 },
];

export function stampFarIsles(world) {
  world.farIsles = [];
  const camp = world.camp;
  if (!camp) return;
  for (const spec of SPECS) {
    const spot = findOpenWater(world, camp, spec.angle, spec.dist, spec.r);
    if (!spot) continue;
    stamp(world, spot.x, spot.y, spec.r);
    world.farIsles.push({ x: spot.x, y: spot.y, r: spec.r, visited: false, name: "земля за проливом" });
  }
}

function findOpenWater(world, camp, angle, dist, r) {
  const rad = (angle * Math.PI) / 180;
  const dirX = Math.cos(rad);
  const dirY = Math.sin(rad);
  for (let step = dist; step <= dist + 220; step += 4) {
    const cx = Math.round(camp.x + dirX * step);
    const cy = Math.round(camp.y + dirY * step);
    if (!world.inBounds(cx, cy)) continue;
    if (isOpenSea(world, cx, cy, r + 2)) return { x: cx, y: cy };
  }
  return null;
}

function isOpenSea(world, cx, cy, clearRaw) {
  const clear = Math.ceil(clearRaw);
  for (let dy = -clear; dy <= clear; dy += 2) {
    for (let dx = -clear; dx <= clear; dx += 2) {
      const x = cx + dx;
      const y = cy + dy;
      if (!world.inBounds(x, y)) return false;
      const t = world.tileAt(x, y);
      if (t !== TILE_DEEP && t !== TILE_WATER && t !== TILE_SHALLOW) return false;
    }
  }
  return true;
}

function stamp(world, cx, cy, r) {
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) {
    for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      if (!world.inBounds(x, y)) continue;
      const d = Math.hypot(x - cx, y - cy);
      if (d > r + 0.6) continue;
      const i = world.idx(x, y);
      if (d > r - 0.3) world.tiles[i] = TILE_SHALLOW;
      else if (d > r - 1.2) world.tiles[i] = TILE_SAND;
      else if ((x * 3 + y) % 4 === 0) world.tiles[i] = TILE_HILL;
      else if ((x + y * 2) % 5 === 0) world.tiles[i] = TILE_FOREST;
      else world.tiles[i] = TILE_GRASS;
    }
  }
}
