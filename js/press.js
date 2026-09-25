// Зима, болезни и звери, которые рождаются, а не появляются из воздуха.

import { spawnAnimals } from "./animal.js";

export function seasonName(day) {
  const part = Math.floor((day % 40) / 10);
  return ["весна", "лето", "осень", "зима"][part];
}

export function leanWinter(world, day) {
  if (seasonName(day) !== "зима") return;
  for (const spot of world.food.values()) {
    spot.amount *= 0.99;
  }
}

export function winterHunger(day) {
  return seasonName(day) === "зима" ? 0.16 : 0;
}

export function ail(agent) {
  const span = agent.traits.lifespanDays || 200;
  const late = agent.age / span;
  if (late < 0.72 && agent.hunger < 82) return false;
  let chance = late > 0.72 ? (late - 0.72) * 0.015 : 0;
  if (agent.hunger > 82) chance += 0.008;
  chance *= 1.25 - (agent.traits.immunity || 0.5);
  if (Math.random() >= chance) return false;
  agent.alive = false;
  const worn = agent.hunger <= 82;
  agent.causeOfDeath = worn ? "старость" : "истощение";
  agent.activity = worn ? "тело не выдержало" : "ослабел от голода";
  return true;
}

export function breedAnimals(world, cap) {
  const live = (world.animals || []).filter((a) => a.alive);
  if (live.length < 2 || live.length >= cap) return;
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const dist = Math.hypot(live[i].x - live[j].x, live[i].y - live[j].y);
      if (dist > 2.4 || Math.random() > 0.04) continue;
      const born = spawnAnimals(world, 1, live[i].kind);
      if (!born.length) return;
      born[0].x = live[i].x;
      born[0].y = live[i].y;
      world.animals.push(born[0]);
      return;
    }
  }
}
