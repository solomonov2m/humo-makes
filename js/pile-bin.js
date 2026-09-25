// Куча на карте ищется по квадрату зрения, а не перебором всего леса.

const BIN = 16;
const cache = new WeakMap();

function binsOf(map, cols) {
  let bins = cache.get(map);
  if (bins && bins.n === map.size) return bins;
  const cells = new Map();
  for (const [key, pile] of map) {
    const cut = key.indexOf(",");
    const sx = Number(key.slice(0, cut));
    const sy = Number(key.slice(cut + 1));
    pile.x = sx;
    pile.y = sy;
    pile.key = key;
    const id = ((sy / BIN) | 0) * cols + ((sx / BIN) | 0);
    const cell = cells.get(id);
    if (cell) cell.push(pile);
    else cells.set(id, [pile]);
  }
  bins = { n: map.size, cells };
  cache.set(map, bins);
  return bins;
}

export function closestPile(map, cols, x, y, reach, ok) {
  if (!map || !map.size || reach < 0) return null;
  const bins = binsOf(map, cols);
  const bx = (Math.round(x) / BIN) | 0;
  const by = (Math.round(y) / BIN) | 0;
  const span = Math.ceil(reach / BIN);
  let best = null;
  let bestDist = reach;
  for (let iy = by - span; iy <= by + span; iy++) {
    for (let ix = bx - span; ix <= bx + span; ix++) {
      const cell = bins.cells.get(iy * cols + ix);
      if (!cell) continue;
      for (let i = 0; i < cell.length; i++) {
        const pile = cell[i];
        if (ok && !ok(pile)) continue;
        const dx = pile.x - x;
        const dy = pile.y - y;
        if (Math.abs(dx) > reach || Math.abs(dy) > reach) continue;
        const dist = Math.hypot(dx, dy);
        if (dist > bestDist) continue;
        bestDist = dist;
        best = pile;
      }
    }
  }
  return best;
}
