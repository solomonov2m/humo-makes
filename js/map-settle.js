// Стойбище у пресной воды. Тропа только к воде и к ближайшим ягодам.

import { tread } from "./roads.js";
import { TILE_FOREST, TILE_FRESH, TILE_GRASS, TILE_HILL } from "./world.js";

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function settle(world) {
  const camp = chooseCamp(world) || carvePond(world);
  world.camp = camp;
  markHome(world, camp);
  world.drinks = banksNear(world, camp, 48);
  world.springs = springsNear(world, camp);
  world.isles = [];
  layDemoPaths(world, camp);
}

function chooseCamp(world) {
  let best = null;
  let score = -1;
  for (let y = 2; y < world.rows - 2; y += 2) {
    for (let x = 2; x < world.cols - 2; x += 2) {
      if (world.tileAt(x, y) !== TILE_GRASS) continue;
      if (!DIRS.some(([dx, dy]) => world.tileAt(x + dx, y + dy) === TILE_FRESH)) continue;
      const near = tally(world, x, y, 8);
      const value = 30 + near.forest + near.hill * 2;
      if (value > score) {
        score = value;
        best = { x, y };
      }
    }
  }
  return best;
}

function tally(world, x, y, r) {
  let forest = 0;
  let hill = 0;
  for (let dy = -r; dy <= r; dy += 2) {
    for (let dx = -r; dx <= r; dx += 2) {
      const t = world.tileAt(x + dx, y + dy);
      if (t === TILE_FOREST) forest += 1;
      else if (t === TILE_HILL) hill += 1;
    }
  }
  return { forest, hill };
}

function carvePond(world) {
  const x = Math.floor(world.cols / 2);
  const y = Math.floor(world.rows / 2);
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]]) {
    const nx = x + dx;
    const ny = y + dy;
    if (world.inBounds(nx, ny)) world.tiles[world.idx(nx, ny)] = TILE_FRESH;
  }
  return { x: x + 2, y };
}

function markHome(world, camp) {
  world.isleOf = new Int16Array(world.cols * world.rows);
  const q = [camp];
  if (!world.isLand(camp.x, camp.y)) return;
  world.isleOf[world.idx(camp.x, camp.y)] = 1;
  while (q.length) {
    const p = q.pop();
    for (const [dx, dy] of DIRS) {
      const x = p.x + dx;
      const y = p.y + dy;
      if (!world.isLand(x, y)) continue;
      const i = world.idx(x, y);
      if (world.isleOf[i]) continue;
      world.isleOf[i] = 1;
      q.push({ x, y });
    }
  }
}

function banksNear(world, camp, limit) {
  const drinks = [];
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      if (world.tileAt(x, y) !== TILE_FRESH) continue;
      for (const [dx, dy] of DIRS) {
        const sx = x + dx;
        const sy = y + dy;
        if (!world.isLand(sx, sy) || world.isleOf[world.idx(sx, sy)] !== 1) continue;
        drinks.push({ x: sx, y: sy, d: Math.hypot(sx - camp.x, sy - camp.y) });
      }
    }
  }
  drinks.sort((a, b) => a.d - b.d);
  return drinks.slice(0, limit).map(({ x, y }) => ({ x, y }));
}

function springsNear(world, camp) {
  const found = [];
  for (let y = 0; y < world.rows && found.length < 3; y++) {
    for (let x = 0; x < world.cols && found.length < 3; x++) {
      if (world.tileAt(x, y) !== TILE_FRESH) continue;
      if (found.every((s) => Math.hypot(s.x - x, s.y - y) > 18)) found.push({ x, y });
    }
  }
  return found.length ? found : [camp];
}

function layDemoPaths(world, camp) {
  const water = nearest(world, camp, TILE_FRESH, 4);
  const bank = water ? bankOf(world, water) : null;
  const berries = nearestFood(world, camp);
  stamp(world, camp, bank, 9);
  stamp(world, camp, berries, 3.2);
}

function stamp(world, camp, stand, amount) {
  if (!stand) return;
  const path = grassRoute(world, camp.x, camp.y, stand.x, stand.y);
  if (!path) return;
  for (const step of path) tread(world, step.x, step.y, amount);
}

function grassRoute(world, x0, y0, x1, y1) {
  const cols = world.cols;
  const goal = (y1 | 0) * cols + (x1 | 0);
  const start = (y0 | 0) * cols + (x0 | 0);
  const prev = new Map([[start, -1]]);
  const q = [start];
  let head = 0;
  while (head < q.length && q.length < 6000) {
    const cur = q[head++];
    if (cur === goal) break;
    const x = cur % cols;
    const y = (cur / cols) | 0;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      const ni = ny * cols + nx;
      if (prev.has(ni)) continue;
      if (ni !== goal && world.tileAt(nx, ny) !== TILE_GRASS) continue;
      prev.set(ni, cur);
      q.push(ni);
    }
  }
  if (!prev.has(goal)) return null;
  const path = [];
  let cur = goal;
  while (cur !== -1) {
    path.push({ x: cur % cols, y: (cur / cols) | 0 });
    cur = prev.get(cur);
  }
  path.reverse();
  return path;
}

function nearestFood(world, camp) {
  let best = null;
  let dist = 16;
  for (const [key, spot] of world.food) {
    if (!spot || spot.amount < 1) continue;
    const cut = key.indexOf(",");
    const x = Number(key.slice(0, cut));
    const y = Number(key.slice(cut + 1));
    if (world.tileAt(x, y) !== TILE_GRASS) continue;
    const d = Math.hypot(x - camp.x, y - camp.y);
    if (d < 3 || d >= dist) continue;
    dist = d;
    best = { x, y };
  }
  return best;
}

function nearest(world, camp, tile, minDist) {
  let best = null;
  let dist = 72;
  for (let y = camp.y - 72; y <= camp.y + 72; y += 2) {
    for (let x = camp.x - 72; x <= camp.x + 72; x += 2) {
      if (world.tileAt(x, y) !== tile) continue;
      const d = Math.hypot(x - camp.x, y - camp.y);
      if (d < minDist || d >= dist) continue;
      dist = d;
      best = { x, y, tile };
    }
  }
  return best;
}

function bankOf(world, water) {
  let fallback = null;
  for (const [dx, dy] of DIRS) {
    const x = water.x + dx;
    const y = water.y + dy;
    if (!world.isLand(x, y)) continue;
    if (world.tileAt(x, y) === TILE_GRASS) return { x, y };
    fallback = fallback || { x, y };
  }
  return fallback;
}
