// Маска дороги по четырём сторонам: N=1, E=2, S=4, W=8. Вода не соединяется.

import { WEAR_ROAD, WEAR_TRAIL } from "./roads.js";

const DIRS = [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]];

export function roadLevelAt(world, x, y) {
  if (!world.isWalkable(x, y)) return 0;
  const wear = world.wear[world.idx(x, y)];
  if (wear >= WEAR_ROAD) return 2;
  if (wear >= WEAR_TRAIL) return 1;
  return 0;
}

export function roadMaskAt(world, x, y) {
  if (!roadLevelAt(world, x, y)) return 0;
  let mask = 0;
  for (const [dx, dy, bit] of DIRS) {
    if (roadLevelAt(world, x + dx, y + dy)) mask |= bit;
  }
  return mask;
}

export const ROAD_MASKS = Array.from({ length: 16 }, (_, mask) => mask);
