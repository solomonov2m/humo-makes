// Беременность от встречи: понравились, мужчина может поселить женщину у себя, потом близость.

import { bloodClose } from "./folk.js";
import { livable } from "./housing.js";

export function courtMeet(sim) {
  const byId = new Map(sim.agents.map((agent) => [agent.id, agent]));
  for (const man of sim.agents) {
    if (!readyMan(man)) continue;
    const woman = nearestWoman(man, sim.agents);
    if (!woman) continue;
    if (!livable(woman.house)) woman.house = man.house;
    man.activity = `зовёт ${woman.name} к себе`;
    woman.activity = `остаётся у ${man.name}`;
    man.tryMate(woman, sim.world, () => {}, byId);
  }
}

function readyMan(man) {
  return !!(man.alive && man.sex === "M" && man.isAdult && man.matingCooldown <= 0 && livable(man.house));
}

function nearestWoman(man, agents) {
  let best = null;
  let bestDist = 1.2;
  for (const woman of agents) {
    if (!woman.alive || woman.sex !== "F" || !woman.isAdult || woman.belly) continue;
    if (woman.matingCooldown > 0 || bloodClose(man, woman)) continue;
    if (!likes(man, woman)) continue;
    const dist = man.distanceTo(woman);
    if (dist < bestDist) {
      bestDist = dist;
      best = woman;
    }
  }
  return best;
}

function likes(a, b) {
  const pull = (a.traits.sociability + b.traits.sociability) / 2;
  const spark = ((a.id * 13 + b.id * 29) % 100) / 100;
  return pull * 0.6 + spark * 0.4 > 0.38;
}
