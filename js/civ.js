// Открытое знание меняет еду, запас, плотность и шаг по дороге.

import { knows } from "./lore.js";
import { holds } from "./notions.js";
import { WEAR_TRAIL } from "./roads.js";

export function gatherAmount(agent) {
  let n = agent.traits.strength * 4.2;
  if (holds(agent, "Камень")) n *= 1.35;
  if (holds(agent, "Бронза")) n *= 1.15;
  if (holds(agent, "Железо")) n *= 1.2;
  return n;
}

export function satiety(agent, taken) {
  const cook = holds(agent, "Огонь") ? 1.45 : 1;
  return taken * 3.2 * cook;
}

export function keepLeftover(agent, culture, fed, hungerBefore) {
  const house = agent.house;
  const keeps = house && (house.progress || 0) >= 0.85;
  if (!keeps) return;
  const spare = fed - hungerBefore;
  if (spare <= 0) return;
  agent.pantry = Math.min(36, (agent.pantry || 0) + spare * 0.4);
}

export function sipPantry(agent, culture) {
  const house = agent.house;
  const keeps = house && (house.progress || 0) >= 0.85;
  if (!keeps || (agent.pantry || 0) < 4 || agent.hunger < 42) return;
  agent.pantry -= 4;
  agent.hunger = Math.max(0, agent.hunger - 16);
  agent.activity = "ест из горшка";
}

export function huntOdds(agent, skill, strength) {
  const lore = holds(agent, "Охота") ? 0.28 : 0;
  return 0.14 + lore + skill * 0.14 + strength * 0.16;
}

export function beastStrikes(agent, prey, skill) {
  const fang = (prey.kind && prey.kind.fang) || 0;
  const cover = 1 + skill * 0.22 + (agent.traits.strength || 1) * 0.12;
  if (fang <= 0 || Math.random() > fang / cover) return false;
  const name = prey.name || "зверь";
  if (Math.random() < fang * 0.7) {
    agent.alive = false;
    agent.causeOfDeath = "охота";
    agent.activity = `${name} убил на охоте`;
    return true;
  }
  agent.energy = Math.max(0, agent.energy - 26);
  agent.activity = `${name} ранил — отступил`;
  return true;
}

export function meatOf(agent, strength) {
  const base = holds(agent, "Охота") ? 34 : 14;
  return base + strength * 6;
}

export function canFarm(culture) {
  return knows(culture, "Поле");
}

export function canHerd(culture) {
  return knows(culture, "Скот");
}

export function crowdLimit(culture) {
  if (knows(culture, "Письмо")) return 14;
  if (knows(culture, "Поле")) return 12;
  if (knows(culture, "Жилище")) return 10;
  return 8;
}

export function plotGap(culture) {
  if (knows(culture, "Поле")) return 3.5;
  if (knows(culture, "Жилище")) return 3.2;
  return 2.8;
}

export function roadPace(agent, world, x, y) {
  if (!holds(agent, "Колесо") || !world.wear) return 1;
  const i = world.idx(Math.round(x), Math.round(y));
  return world.wear[i] >= WEAR_TRAIL ? 1.4 : 1;
}

export function tendFields(world) {
  if (!knows(world.culture, "Поле")) return;
  for (const house of world.houses) {
    if (house.progress < 1) continue;
    const key = `${house.x + 1},${house.y}`;
    const spot = world.food.get(key);
    if (!spot || spot.amount >= spot.cap) continue;
    spot.amount = Math.min(spot.cap, spot.amount + 0.12);
  }
}
