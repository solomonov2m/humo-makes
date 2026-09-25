// Чем заняться — то, что сейчас сильнее бьёт по телу, не следующий вид здания.

import { coverOf } from "./stack.js";

export function pressing(agent, world) {
  const cover = coverOf(agent.house);
  const cold = (agent.exposure || 0) / 90;
  const wild = world.nearestFood(agent.x, agent.y, agent.traits.vision);
  const options = [];
  if (cover < 1 && (cold > 0.05 || agent.energy < 36)) {
    options.push({ job: "cover", w: Math.max(cold, agent.energy < 36 ? 0.45 : 0.15) });
  }
  if (agent.hunger > 46 && !wild) options.push({ job: "field", w: agent.hunger / 100 });
  options.sort((a, b) => b.w - a.w);
  if (!options.length || options[0].w < 0.22) return null;
  return options[0].job;
}
