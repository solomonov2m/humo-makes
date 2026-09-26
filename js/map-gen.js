// Сборка карты: один seed и версия генератора дают одну географию.

import { GENERATOR_VERSION } from "./map-noise.js";
import { raiseLand } from "./map-field.js";
import { carveWater } from "./map-hydro.js";
import { paintBiomes, placeBerries } from "./map-biome.js";
import { settle } from "./map-settle.js";
import { stampFarIsles } from "./far-isles.js";

export function paintMap(world) {
  world.generatorVersion = GENERATOR_VERSION;
  const { elev, moist, sea } = raiseLand(world);
  world.elevation = elev;
  world.moisture = moist;
  carveWater(world, elev, sea);
  paintBiomes(world, elev, moist, sea);
  placeBerries(world);
  settle(world);
  stampFarIsles(world);
}
