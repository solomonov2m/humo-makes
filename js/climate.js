// Температура клетки: сезон, рельеф и вода. Это число, из него стынет и растёт.

import { TILE_DEEP, TILE_FRESH, TILE_HILL, TILE_SHALLOW, TILE_WATER } from "./world.js";
import { seasonName } from "./press.js";

export function airTemp(world) {
  return seasonName(world && world.day || 0) === "зима" ? -2 : 12;
}

export function groundTemp(world, x, y) {
  const air = airTemp(world);
  if (!world || !world.inBounds(Math.round(x), Math.round(y))) return air;
  const tile = world.tileAt(Math.round(x), Math.round(y));
  if (tile === TILE_HILL) return air - 6;
  if (tile === TILE_FRESH || tile === TILE_SHALLOW || tile === TILE_WATER || tile === TILE_DEEP) {
    return air < 0 ? -1 : 9;
  }
  return air;
}
