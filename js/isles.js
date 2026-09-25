import { TILE_FOREST, TILE_GRASS, TILE_HILL, TILE_SAND, TILE_SHALLOW } from "./world.js";

const SPECS = [
  { x: 5, y: 5, r: 4.2 },
  { x: 42, y: 6, r: 3.6 },
  { x: 7, y: 26, r: 3.4 },
  { x: 41, y: 25, r: 4.4 },
];

export function stampIsles(world) {
  world.isleOf = new Int16Array(world.cols * world.rows);
  markHome(world);
  world.isles = [];
  SPECS.forEach((spec, i) => stamp(world, spec, i + 2));
}

export function onHome(world, x, y) {
  if (!world.inBounds(x, y)) return false;
  return world.isleOf[world.idx(x, y)] === 1;
}

function markHome(world) {
  const cx = Math.floor(world.cols / 2);
  const cy = Math.floor(world.rows / 2);
  const start = world.isLand(cx, cy) ? { x: cx, y: cy } : findLand(world);
  if (!start) return;
  const q = [start];
  world.isleOf[world.idx(start.x, start.y)] = 1;
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

function findLand(world) {
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) if (world.isLand(x, y)) return { x, y };
  }
  return null;
}

function stamp(world, spec, id) {
  let tiles = 0;
  const r = spec.r;
  for (let y = Math.floor(spec.y - r - 1); y <= spec.y + r + 1; y++) {
    for (let x = Math.floor(spec.x - r - 1); x <= spec.x + r + 1; x++) {
      if (!world.inBounds(x, y) || world.isleOf[world.idx(x, y)] === 1) continue;
      const d = Math.hypot(x - spec.x, y - spec.y);
      if (d > r + 0.8) continue;
      const i = world.idx(x, y);
      if (d > r - 0.4) {
        world.tiles[i] = TILE_SHALLOW;
        continue;
      }
      if (d > r - 1.3) world.tiles[i] = TILE_SAND;
      else if ((x + y) % 7 === 0) world.tiles[i] = TILE_HILL;
      else if ((x * 3 + y) % 5 === 0) world.tiles[i] = TILE_FOREST;
      else world.tiles[i] = TILE_GRASS;
      world.isleOf[i] = id;
      tiles += 1;
    }
  }
  if (tiles) world.isles.push({ id, x: spec.x, y: spec.y, tiles, peopled: false });
}
