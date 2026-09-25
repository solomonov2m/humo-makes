// Два ключа стекают к морю отдельным руслом.

import { TILE_FOREST, TILE_FRESH, TILE_GRASS, TILE_HILL, TILE_SAND } from "./world.js";

const STEP = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function land(world, x, y) {
  const t = world.tileAt(x, y);
  return t === TILE_SAND || t === TILE_GRASS || t === TILE_FOREST || t === TILE_HILL;
}

function seaDistance(world) {
  const dist = new Int16Array(world.cols * world.rows);
  dist.fill(-1);
  const queue = [];
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      if (land(world, x, y)) continue;
      const i = world.idx(x, y);
      dist[i] = 0;
      queue.push(i);
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head];
    const x = i % world.cols;
    const y = (i / world.cols) | 0;
    for (const [dx, dy] of STEP) {
      const nx = x + dx;
      const ny = y + dy;
      if (!world.inBounds(nx, ny)) continue;
      const ni = world.idx(nx, ny);
      if (dist[ni] !== -1) continue;
      dist[ni] = dist[i] + 1;
      queue.push(ni);
    }
  }
  return dist;
}

function spring(world, dist, minSea, away) {
  let best = null;
  let bestD = -1;
  for (let y = 2; y < world.rows - 2; y++) {
    for (let x = 2; x < world.cols - 2; x++) {
      if (!land(world, x, y)) continue;
      const d = dist[world.idx(x, y)];
      if (d < minSea) continue;
      if (away && Math.hypot(x - away.x, y - away.y) < 8) continue;
      const score = d + (world.tileAt(x, y) === TILE_HILL ? 3 : 0);
      if (score > bestD) {
        bestD = score;
        best = { x, y };
      }
    }
  }
  return best;
}

function farMouth(world, source) {
  let best = null;
  let bestD = -1;
  for (let y = 1; y < world.rows - 1; y++) {
    for (let x = 1; x < world.cols - 1; x++) {
      if (!land(world, x, y) || !world.touchesWater(x, y)) continue;
      const d = Math.hypot(x - source.x, y - source.y);
      if (d > bestD) {
        bestD = d;
        best = { x, y };
      }
    }
  }
  return best;
}

function flowTo(world, from, to) {
  const path = [];
  const seen = new Set();
  let x = from.x;
  let y = from.y;
  for (let n = 0; n < 90; n++) {
    path.push({ x, y });
    seen.add(`${x},${y}`);
    if (Math.hypot(x - to.x, y - to.y) < 1.2) {
      if (x !== to.x || y !== to.y) path.push({ x: to.x, y: to.y });
      break;
    }
    const wobble = Math.sin(n * 0.8 + world.seed);
    let pick = null;
    let pickScore = Infinity;
    for (const [dx, dy] of STEP) {
      const nx = x + dx;
      const ny = y + dy;
      if (!land(world, nx, ny) || seen.has(`${nx},${ny}`)) continue;
      const side = (nx - x) * (to.y - y) - (ny - y) * (to.x - x);
      const score = Math.hypot(nx - to.x, ny - to.y) + side * 0.04 * wobble;
      if (score < pickScore) {
        pickScore = score;
        pick = { x: nx, y: ny };
      }
    }
    if (!pick) break;
    x = pick.x;
    y = pick.y;
  }
  return path;
}

function paint(world, path) {
  for (const p of path) {
    if (land(world, p.x, p.y)) world.tiles[world.idx(p.x, p.y)] = TILE_FRESH;
  }
}

function pool(world, spot) {
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1]]) {
    const x = spot.x + dx;
    const y = spot.y + dy;
    if (land(world, x, y)) world.tiles[world.idx(x, y)] = TILE_FRESH;
  }
}

function banks(world) {
  const seen = new Set();
  const drinks = [];
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      if (world.tileAt(x, y) !== TILE_FRESH) continue;
      for (const [dx, dy] of STEP) {
        const sx = x + dx;
        const sy = y + dy;
        const key = `${sx},${sy}`;
        if (!land(world, sx, sy) || seen.has(key)) continue;
        seen.add(key);
        drinks.push({ x: sx, y: sy });
      }
    }
  }
  return drinks;
}

export function carveRiver(world) {
  const dist = seaDistance(world);
  const source = spring(world, dist, 6, null);
  if (!source) {
    world.springs = [];
    world.drinks = [];
    return;
  }
  const channel = flowTo(world, source, farMouth(world, source));
  paint(world, channel);
  pool(world, source);
  const join = channel[Math.max(0, channel.length - 6)];
  const other = spring(world, dist, 5, source);
  if (other && join) {
    paint(world, flowTo(world, other, join));
    pool(world, other);
  }
  world.springs = other ? [source, other] : [source];
  world.drinks = banks(world);
}
