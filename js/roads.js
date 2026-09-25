// Дороги не чертятся заранее: люди оставляют след, след дешевеет,
// и следующие идут уже по протоптанному. Так тропа становится дорогой.

import { TILE_FOREST, TILE_HILL, TILE_SAND } from "./world.js";
import { Heap } from "./heap.js";
import { routeSpan } from "./maths.js";

export const WEAR_TRACK = 0.35;
export const WEAR_TRAIL = 2.4;
export const WEAR_ROAD = 8;
const MIN_STEP_COST = 0.34;
const WEAR_CAP = 72;

const DIRS = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
];

export function roadLevel(wear) {
  if (wear >= WEAR_ROAD) return 2;
  if (wear >= WEAR_TRAIL) return 1;
  if (wear >= WEAR_TRACK) return 0;
  return -1;
}

export function travelCost(world, x, y) {
  if (!world.isLand(x, y)) return Infinity;
  const tile = world.tileAt(x, y);
  const wear = world.wear[world.idx(x, y)];
  const base = tile === TILE_HILL ? 1.55 : tile === TILE_FOREST ? 3.6 : tile === TILE_SAND ? 1.08 : 1;
  if (wear >= WEAR_ROAD) return MIN_STEP_COST;
  if (wear >= WEAR_TRAIL) {
    const k = (wear - WEAR_TRAIL) / (WEAR_ROAD - WEAR_TRAIL);
    return 0.55 - k * (0.55 - MIN_STEP_COST);
  }
  if (wear >= WEAR_TRACK) return base * 0.72;
  return base * 1.25;
}

export function tread(world, x, y, amount = 0.2) {
  const tx = Math.round(x);
  const ty = Math.round(y);
  if (!world.isWalkable(tx, ty)) return;
  const i = world.idx(tx, ty);
  if (world.wear[i] <= 0) world.tracks = (world.tracks || 0) + 1;
  world.wear[i] = Math.min(WEAR_CAP, world.wear[i] + amount);
}

export function decayWear(world) {
  if (!world.tracks) return;
  const wear = world.wear;
  for (let i = 0; i < wear.length; i++) {
    const w = wear[i];
    if (w <= 0) continue;
    const fade = w < WEAR_TRACK ? 0.04 : w < WEAR_TRAIL ? 0.012 : w < WEAR_ROAD ? 0.006 : 0.002;
    const next = w - fade < 0.02 ? 0 : w - fade;
    if (next === 0) world.tracks -= 1;
    wear[i] = next;
  }
}

export function countRoads(world) {
  if (!world.tracks) return { tracks: 0, trails: 0, roads: 0 };
  let tracks = 0;
  let trails = 0;
  let roads = 0;
  const wear = world.wear;
  for (let i = 0; i < wear.length; i++) {
    if (wear[i] >= WEAR_ROAD) roads += 1;
    else if (wear[i] >= WEAR_TRAIL) trails += 1;
    else if (wear[i] >= WEAR_TRACK) tracks += 1;
  }
  return { tracks, trails, roads };
}

function heuristic(x, y, gx, gy) {
  return Math.hypot(gx - x, gy - y) * MIN_STEP_COST;
}

function ensureSearch(world) {
  const n = world.cols * world.rows;
  if (world._routeSeen && world._routeSeen.length === n) return;
  world._routeSeen = new Int32Array(n);
  world._routeG = new Float64Array(n);
  world._routeCame = new Int32Array(n);
  world._routeGen = 0;
}

export function findRoute(world, x0, y0, x1, y1) {
  const sx = Math.round(x0);
  const sy = Math.round(y0);
  const gx = Math.round(x1);
  const gy = Math.round(y1);
  if (!world.isWalkable(sx, sy) || !world.isWalkable(gx, gy)) return null;
  if (sx === gx && sy === gy) return [{ x: gx, y: gy }];

  ensureSearch(world);
  let gen = world._routeGen + 1;
  if (gen > 2e9) {
    world._routeSeen.fill(0);
    gen = 1;
  }
  world._routeGen = gen;

  const cols = world.cols;
  const seen = world._routeSeen;
  const gScore = world._routeG;
  const came = world._routeCame;
  const start = sy * cols + sx;
  const goal = gy * cols + gx;
  const open = new Heap();

  seen[start] = gen;
  gScore[start] = 0;
  came[start] = -1;
  open.push(start, heuristic(sx, sy, gx, gy), 0);

  let guard = 0;
  while (open.size && guard++ < 4000) {
    const popped = open.pop();
    const cur = popped.id;
    if (popped.g > gScore[cur] + 1e-4) continue;
    if (cur === goal) {
      const path = rebuild(came, cur, cols);
      return routeSpan(path).ok ? path : null;
    }
    const cx = cur % cols;
    const cy = (cur / cols) | 0;
    const base = gScore[cur];
    for (let d = 0; d < DIRS.length; d++) {
      const dx = DIRS[d][0];
      const dy = DIRS[d][1];
      const nx = cx + dx;
      const ny = cy + dy;
      if (!world.isWalkable(nx, ny)) continue;
      if (dx && dy && (!world.isWalkable(cx + dx, cy) || !world.isWalkable(cx, cy + dy))) continue;
      const ni = ny * cols + nx;
      const ng = base + travelCost(world, nx, ny) * DIRS[d][2];
      if (seen[ni] === gen && ng >= gScore[ni]) continue;
      seen[ni] = gen;
      gScore[ni] = ng;
      came[ni] = cur;
      open.push(ni, ng + heuristic(nx, ny, gx, gy), ng);
    }
  }
  return null;
}

function rebuild(came, cur, cols) {
  const path = [];
  let guard = 0;
  while (cur !== -1 && guard++ < 400) {
    path.push({ x: cur % cols, y: (cur / cols) | 0 });
    cur = came[cur];
  }
  path.reverse();
  return path;
}
