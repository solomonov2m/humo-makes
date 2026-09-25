// Ближайшая еда в радиусе зрения. Клетки еды лежат по грубым квадратам, не по всей карте.

import { knownAt } from "./chart.js";

const BIN = 16;

function binsOf(world) {
  if (world._foodBins && world._foodN === world.food.size) return world._foodBins;
  const bins = new Map();
  for (const [key, spot] of world.food) {
    const cut = key.indexOf(",");
    const sx = Number(key.slice(0, cut));
    const sy = Number(key.slice(cut + 1));
    spot.x = sx;
    spot.y = sy;
    spot.key = key;
    const id = ((sy / BIN) | 0) * world.cols + ((sx / BIN) | 0);
    const cell = bins.get(id);
    if (cell) cell.push(spot);
    else bins.set(id, [spot]);
  }
  world._foodBins = bins;
  world._foodN = world.food.size;
  return bins;
}

export function foodNear(world, x, y, vision) {
  const reach = Math.max(0, vision);
  const bins = binsOf(world);
  const bx = (Math.round(x) / BIN) | 0;
  const by = (Math.round(y) / BIN) | 0;
  const span = Math.ceil(reach / BIN);
  let best = null;
  let bestDist = reach;
  for (let iy = by - span; iy <= by + span; iy++) {
    for (let ix = bx - span; ix <= bx + span; ix++) {
      const cell = bins.get(iy * world.cols + ix);
      if (!cell) continue;
      for (let i = 0; i < cell.length; i++) {
        const spot = cell[i];
        if (spot.amount < 1) continue;
        const dx = spot.x - x;
        const dy = spot.y - y;
        if (Math.abs(dx) > reach || Math.abs(dy) > reach) continue;
        const dist = Math.hypot(dx, dy);
        if (dist > bestDist || !knownAt(world, spot.x, spot.y)) continue;
        bestDist = dist;
        best = spot;
      }
    }
  }
  return best;
}
