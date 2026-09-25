// Море, реки к морю, озёра во впадинах. Одинокая водная клетка не остаётся.

import { TILE_DEEP, TILE_FRESH, TILE_GRASS } from "./world.js";

const RIVER = 42;
const LAKE = 70;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function carveWater(world, elev, sea) {
  const { cols, rows } = world;
  const n = cols * rows;
  const land = [];
  for (let i = 0; i < n; i++) {
    world.tiles[i] = elev[i] < sea ? TILE_DEEP : TILE_GRASS;
    if (elev[i] >= sea) land.push(i);
  }
  land.sort((a, b) => elev[b] - elev[a]);
  const down = new Int32Array(n);
  down.fill(-1);
  const acc = new Float32Array(n);
  for (const i of land) {
    const x = i % cols;
    const y = (i / cols) | 0;
    let best = -1;
    let low = elev[i];
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const ni = ny * cols + nx;
      if (elev[ni] < low) {
        low = elev[ni];
        best = ni;
      }
    }
    down[i] = best;
  }
  for (const i of land) {
    acc[i] += 1;
    if (down[i] >= 0) acc[down[i]] += acc[i];
  }
  const river = new Uint8Array(n);
  for (const i of land) {
    if (acc[i] < RIVER || !reachesSea(i, down, elev, sea)) continue;
    river[i] = 1;
  }
  for (const i of land) {
    if (down[i] >= 0 || acc[i] < LAKE) continue;
    fillLake(world, i, elev, river);
  }
  for (let i = 0; i < n; i++) if (river[i]) world.tiles[i] = TILE_FRESH;
  widenRivers(world);
  dropIsolated(world);
}

function reachesSea(start, down, elev, sea) {
  let i = start;
  for (let guard = 0; guard < 800; guard++) {
    if (elev[i] < sea) return true;
    if (down[i] < 0) return false;
    i = down[i];
  }
  return false;
}

function fillLake(world, origin, elev, river) {
  const cols = world.cols;
  const x = origin % cols;
  const y = (origin / cols) | 0;
  const cap = elev[origin] + 0.012;
  const spots = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1]];
  for (const [dx, dy] of spots) {
    const nx = x + dx;
    const ny = y + dy;
    if (!world.inBounds(nx, ny)) continue;
    const ni = ny * cols + nx;
    if (elev[ni] <= cap) river[ni] = 1;
  }
}

function widenRivers(world) {
  const extra = [];
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      if (world.tileAt(x, y) !== TILE_FRESH) continue;
      const links = DIRS.filter(([dx, dy]) => world.tileAt(x + dx, y + dy) === TILE_FRESH).length;
      if (links < 2) continue;
      for (const [dx, dy] of DIRS) {
        const nx = x + dx;
        const ny = y + dy;
        if (world.tileAt(nx, ny) === TILE_GRASS) extra.push(world.idx(nx, ny));
      }
    }
  }
  for (const i of extra) world.tiles[i] = TILE_FRESH;
}

function dropIsolated(world) {
  const { cols, rows } = world;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (world.tileAt(x, y) !== TILE_FRESH) continue;
      const linked = DIRS.some(([dx, dy]) => world.tileAt(x + dx, y + dy) === TILE_FRESH);
      if (!linked) world.tiles[world.idx(x, y)] = TILE_GRASS;
    }
  }
}
