import { TILE_OCEAN, TILE_GRASS, TILE_FOREST, TILE_FRESH } from "./world.js";

const NEI = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const CAMP_NAMES = ["У ключа", "У озера", "На лугу", "У рощи"];
const LAKE = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1]];

function pseudoNoise(x, y, seed) {
  let v = Math.sin(x * 0.15 + seed) * Math.cos(y * 0.13 + seed * 1.7);
  v += Math.sin(x * 0.05 + seed * 2.3) * Math.cos(y * 0.07 + seed * 0.6) * 1.5;
  v += Math.sin((x + y) * 0.08 + seed * 3.1) * 0.5;
  return v;
}

function hash(x, y) {
  return Math.abs((x * 73856093) ^ (y * 19349663)) >>> 0;
}

export function layTerrain(world) {
  carveIsland(world);
  placeSprings(world, 4);
  growGroves(world);
  scatterWildForest(world);
  collectDrinkSpots(world);
  placeBerries(world);
}

function carveIsland(world) {
  const cx = world.cols / 2;
  const cy = world.rows / 2;
  const maxR = Math.min(world.cols, world.rows) / 2 - 2;
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      const dx = (x - cx) / maxR;
      const dy = (y - cy) / maxR;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const value = 1 - dist + pseudoNoise(x, y, world.seed) * 0.18;
      world.tiles[world.idx(x, y)] = value > 0.15 ? TILE_GRASS : TILE_OCEAN;
    }
  }
}

function interiorLand(world) {
  const spots = [];
  for (let y = 2; y < world.rows - 2; y++) {
    for (let x = 2; x < world.cols - 2; x++) {
      if (!world.isWalkable(x, y)) continue;
      let ocean = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (world.tileAt(x + dx, y + dy) === TILE_OCEAN) ocean += 1;
        }
      }
      if (ocean === 0) spots.push({ x, y });
    }
  }
  return spots;
}

function placeSprings(world, count) {
  const pool = interiorLand(world);
  const springs = [];
  for (let n = 0; n < count; n++) {
    let pick = null;
    for (let t = 0; t < 80; t++) {
      const c = pool[Math.floor(Math.random() * pool.length)];
      if (!c) break;
      if (springs.every((s) => Math.hypot(s.x - c.x, s.y - c.y) > 12)) {
        pick = c;
        break;
      }
    }
    if (!pick) break;
    springs.push(pick);
    carveLake(world, pick.x, pick.y);
  }
  world.springs = springs;
}

function carveLake(world, cx, cy) {
  for (const [dx, dy] of LAKE) {
    const x = cx + dx;
    const y = cy + dy;
    if (world.isWalkable(x, y)) world.tiles[world.idx(x, y)] = TILE_FRESH;
  }
}

function growGroves(world) {
  world.camps = [];
  world.springs.forEach((spring, i) => {
    const shore = nearestWalkable(world, spring.x, spring.y);
    if (!shore) return;
    const camp = stepAway(world, shore, spring, 4) || shore;
    const grove = stepAway(world, camp, spring, 4) || camp;
    paintGrove(world, grove.x, grove.y, 3);
    world.camps.push({
      id: i,
      x: camp.x,
      y: camp.y,
      shore,
      name: CAMP_NAMES[i % CAMP_NAMES.length],
    });
  });
}

function paintGrove(world, cx, cy, radius) {
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      if (Math.hypot(x - cx, y - cy) > radius) continue;
      if (world.tileAt(x, y) === TILE_GRASS) world.tiles[world.idx(x, y)] = TILE_FOREST;
    }
  }
}

function scatterWildForest(world) {
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      if (world.tileAt(x, y) !== TILE_GRASS) continue;
      if (pseudoNoise(x, y, world.seed + 9) > 0.55) world.tiles[world.idx(x, y)] = TILE_FOREST;
    }
  }
}

function collectDrinkSpots(world) {
  const seen = new Set();
  world.drinkSpots = [];
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      if (world.tileAt(x, y) !== TILE_FRESH) continue;
      for (const [dx, dy] of NEI) {
        const sx = x + dx;
        const sy = y + dy;
        if (!world.isWalkable(sx, sy)) continue;
        const key = `${sx},${sy}`;
        if (seen.has(key)) continue;
        seen.add(key);
        world.drinkSpots.push({ x: sx, y: sy });
      }
    }
  }
}

function placeBerries(world) {
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      if (world.tileAt(x, y) !== TILE_FOREST) continue;
      if (hash(x, y) % 5 !== 0) continue;
      world.berries.set(`${x},${y}`, { amount: 6 + (hash(x, y) % 5), cap: 12 });
    }
  }
  for (const camp of world.camps) {
    const grove = nearestForest(world, camp.x, camp.y, 10);
    if (!grove) continue;
    const key = `${grove.x},${grove.y}`;
    if (!world.berries.has(key)) world.berries.set(key, { amount: 10, cap: 12 });
  }
}

function nearestForest(world, x, y, limit) {
  let best = null;
  let bestDist = limit;
  for (let y2 = 0; y2 < world.rows; y2++) {
    for (let x2 = 0; x2 < world.cols; x2++) {
      if (world.tileAt(x2, y2) !== TILE_FOREST) continue;
      const d = Math.hypot(x2 - x, y2 - y);
      if (d < bestDist) {
        bestDist = d;
        best = { x: x2, y: y2 };
      }
    }
  }
  return best;
}

function nearestWalkable(world, x, y) {
  if (world.isWalkable(x, y)) return { x, y };
  for (let r = 1; r < 8; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (world.isWalkable(x + dx, y + dy)) return { x: x + dx, y: y + dy };
      }
    }
  }
  return null;
}

function stepAway(world, from, origin, dist) {
  const dx = from.x - origin.x;
  const dy = from.y - origin.y;
  const len = Math.hypot(dx, dy) || 1;
  const tx = Math.round(from.x + (dx / len) * dist);
  const ty = Math.round(from.y + (dy / len) * dist);
  return nearestWalkable(world, tx, ty);
}
