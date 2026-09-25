// Клетка — один пиксель карты. Восток–запад Бали около 153 км, не деревенский двор.
// Шаг и бег считаются в метрах в секунду, не в долях суток.

import { paceOf } from "./life.js";
import { roadPace } from "./civ.js";
import { reach } from "./maths.js";
import { MAP_SCALE } from "./map-span.js";

export { MAP_SCALE };
export const BALI_EAST_M = 153000;
const LAND_CELLS_X = 43 * MAP_SCALE;
export const METERS_PER_TILE = BALI_EAST_M / LAND_CELLS_X;
export const ADULT_M = 1.7;
export const WALK_MPS = 1.4;
const RUN_FACTOR = 2.2;

export function metersPerSec(agent) {
  const gait = agent.state === "hunt" ? RUN_FACTOR : 1;
  return agent.traits.speed * paceOf(agent) * gait;
}

export function tilesFor(agent, world, gameSeconds) {
  const meters = reach(metersPerSec(agent), gameSeconds);
  const ground = roadPace(agent, world, agent.x, agent.y);
  return (meters * ground) / METERS_PER_TILE;
}
