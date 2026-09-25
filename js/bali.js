// Берег Бали: западный мыс, хребет вулканов, Букит и Нуса Пенида.
// Клетки схемы умножаются: каждый пиксель — своя клетка, не квадрат в 20 px.

import { MAP_SCALE as S } from "./map-span.js";

const TILE_DEEP = 0;
const TILE_WATER = 1;
const TILE_SHALLOW = 2;
const TILE_SAND = 3;
const TILE_GRASS = 4;
const TILE_FOREST = 5;
const TILE_HILL = 6;
const TILE_FRESH = 7;
const SEA = [TILE_DEEP, TILE_WATER, TILE_SHALLOW];
const SPANS = [
  [8, 16, 24],
  [9, 10, 38],
  [10, 6, 42],
  [11, 4, 43],
  [12, 2, 44],
  [13, 4, 43],
  [14, 7, 41],
  [15, 11, 38],
  [16, 16, 35],
  [17, 22, 33],
  [18, 26, 32],
  [19, 27, 33],
  [20, 25, 36],
  [21, 24, 37],
  [22, 25, 37],
  [23, 26, 36],
  [19, 40, 41],
  [20, 39, 42],
  [21, 43, 47],
  [22, 42, 47],
  [23, 43, 47],
  [24, 44, 46],
];

export function paintBali(world) {
  for (let i = 0; i < world.tiles.length; i++) world.tiles[i] = TILE_DEEP;
  for (let y = 0; y < world.rows; y++) {
    const bands = bandsAt(y / S);
    for (let x = 0; x < world.cols; x++) {
      if (bands.some(([a, b]) => x >= a && x < b)) world.tiles[world.idx(x, y)] = TILE_GRASS;
    }
  }
  dress(world);
  rivers(world);
  coast(world);
  reef(world);
  markHome(world);
  world.springs = [{ x: 28 * S, y: 11 * S }, { x: 22 * S, y: 12 * S }, { x: 34 * S, y: 12 * S }];
  world.drinks = banks(world);
  world.isles = [];
}

function bandsAt(srcY) {
  const row = Math.floor(srcY);
  const t = srcY - row;
  const here = SPANS.filter((span) => span[0] === row);
  const next = SPANS.filter((span) => span[0] === row + 1);
  const src = here.length ? here : next;
  return src.map(([, a, b]) => {
    let n = next[0];
    let best = Infinity;
    for (const span of next) {
      const d = Math.abs((span[1] + span[2]) / 2 - (a + b) / 2);
      if (d < best) {
        best = d;
        n = span;
      }
    }
    if (!n || !here.length) return [a * S, (b + 1) * S];
    const left = a + (n[1] - a) * t;
    const right = b + (n[2] - b) * t;
    return [left * S, (right + 1) * S];
  });
}

function disk(x, y, cx, cy, rx, ry) {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

function dress(world) {
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      if (world.tileAt(x, y) !== TILE_GRASS) continue;
      if (volcano(x / S, y / S) || (y > 20 * S && x > 24 * S && x < 40 * S) || x > 42 * S) world.tiles[world.idx(x, y)] = TILE_HILL;
      else if (x < 12 * S) world.tiles[world.idx(x, y)] = TILE_FOREST;
    }
  }
}

function volcano(x, y) {
  if (disk(x, y, 16, 12, 1.5, 1.1)) return true;
  if (disk(x, y, 28, 11, 2.1, 1.4) && !disk(x, y, 28, 11, 0.8, 0.6)) return true;
  return disk(x, y, 39, 12, 2, 1.5);
}

function rivers(world) {
  stroke(world, [[22 * S, 12 * S], [21 * S, 16 * S], [19 * S, 18 * S]]);
  stroke(world, [[34 * S, 12 * S], [36 * S, 16 * S], [38 * S, 18 * S]]);
  stroke(world, [[26 * S, 11 * S], [25 * S, 8 * S]]);
  for (const [x, y] of [[28 * S, 11 * S], [29 * S, 11 * S], [28 * S, 12 * S]]) {
    if (world.isLand(x, y)) world.tiles[world.idx(x, y)] = TILE_FRESH;
  }
}

function stroke(world, points) {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const ax = a[0];
    const ay = a[1];
    const bx = b[0];
    const by = b[1];
    const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let s = 0; s <= steps; s++) {
      const t = steps ? s / steps : 0;
      const x = Math.round(ax + (bx - ax) * t);
      const y = Math.round(ay + (by - ay) * t);
      if (world.isLand(x, y)) world.tiles[world.idx(x, y)] = TILE_FRESH;
    }
  }
}

function coast(world) {
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      if (!world.isLand(x, y)) continue;
      if (neighbors(world, x, y, SEA)) world.tiles[world.idx(x, y)] = TILE_SAND;
    }
  }
}

function reef(world) {
  const landish = [TILE_SAND, TILE_GRASS, TILE_FOREST, TILE_HILL];
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      if (world.tileAt(x, y) !== TILE_DEEP) continue;
      if (neighbors(world, x, y, landish)) world.tiles[world.idx(x, y)] = TILE_SHALLOW;
    }
  }
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      if (world.tileAt(x, y) !== TILE_DEEP) continue;
      if (neighbors(world, x, y, [TILE_SHALLOW])) world.tiles[world.idx(x, y)] = TILE_WATER;
    }
  }
}

function neighbors(world, x, y, kinds) {
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => kinds.includes(world.tileAt(x + dx, y + dy)));
}

function banks(world) {
  const seen = new Set();
  const drinks = [];
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      if (world.tileAt(x, y) !== TILE_FRESH) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const sx = x + dx;
        const sy = y + dy;
        const key = `${sx},${sy}`;
        if (!world.isLand(sx, sy) || seen.has(key)) continue;
        seen.add(key);
        drinks.push({ x: sx, y: sy });
      }
    }
  }
  return drinks;
}

function markHome(world) {
  world.isleOf = new Int16Array(world.cols * world.rows);
  const q = [{ x: 24 * S, y: 14 * S }];
  world.isleOf[world.idx(24 * S, 14 * S)] = 1;
  while (q.length) {
    const p = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
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
