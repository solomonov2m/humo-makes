// Ближайшая куча в квадрате вокруг курсора. Вся карта не перебирается.

import { TILE } from "./world.js";

export function nearestKeyed(map, px, py, card) {
  if (!map) return null;
  const reach = 12;
  const x0 = Math.floor(px) - reach;
  const y0 = Math.floor(py) - reach;
  let best = null;
  let bestD = reach;
  for (let y = y0; y <= y0 + reach * 2; y++) {
    for (let x = x0; x <= x0 + reach * 2; x++) {
      const spot = map.get(`${x},${y}`);
      if (!spot || (spot.amount != null && spot.amount < 0.4)) continue;
      const cx = x * TILE + TILE / 2;
      const cy = y * TILE + TILE / 2;
      const d = Math.hypot(cx - px, cy - py);
      if (d >= bestD) continue;
      bestD = d;
      best = { ...card(spot), x: cx, y: cy };
    }
  }
  return best;
}
