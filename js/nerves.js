// Два процесса: давление сна копится своим телом, ритм суток у каждого свой.
// Лечь можно только где удобно. Лес бодрит, а не укладывает.

import { TILE_FOREST, TILE_GRASS } from "./world.js";
import { livable } from "./housing.js";
import { lifeStage } from "./life.js";

const RISE = 0.058;
const FALL = 0.12;

export function hatchNerve(agent) {
  const g = agent.genome.values;
  return {
    pressure: 0.18 + Math.random() * 0.38,
    chronotype: (g.metabolism - 0.5) * 4.4 + (g.lifespan - 0.5) * 1.6,
    awakeHours: 6 + Math.random() * 8,
  };
}

export function ensureNerve(agent) {
  if (!agent.nerve) agent.nerve = hatchNerve(agent);
  return agent.nerve;
}

export function tickNerve(agent, gameSeconds, dayFraction) {
  const nerve = ensureNerve(agent);
  const hours = Math.max(0, gameSeconds) / 3600;
  const asleep = agent.activity === "спит";
  const age = lifeStage(agent) === "infant" || lifeStage(agent) === "child" ? 1.35 : 1;
  if (asleep) {
    const ease = agent.bed ? agent.bed.comfort || 0.4 : 0.25;
    nerve.pressure = Math.max(0, nerve.pressure - hours * 0.11);
    nerve.awakeHours = Math.max(0, nerve.awakeHours - hours * 2);
    agent.energy = Math.min(100, agent.energy + hours * 5 * Math.max(ease, 0.35));
    if (ease < 0.5) agent.exposure = Math.min(90, (agent.exposure || 0) + hours * 0.35);
  } else {
    const work = agent.state === "hunt" || agent.state === "gather" ? 1.25 : 1;
    nerve.pressure = Math.min(1, nerve.pressure + hours * RISE * age * work);
    nerve.awakeHours += hours;
    agent.energy = Math.max(0, agent.energy - hours * 1.1 * work);
  }
  nerve.alert = alertness(dayFraction, nerve.chronotype);
  nerve.urge = nerve.pressure * (1.4 - nerve.alert);
}

export function openGround(world, x, y) {
  return world.tileAt(Math.round(x), Math.round(y)) !== TILE_FOREST;
}

export function bedOf(agent, world) {
  if (livable(agent.house) && openGround(world, agent.house.x, agent.house.y)) {
    return { x: agent.house.x, y: agent.house.y, comfort: 0.2 + 0.8 * (agent.house.progress || 0) };
  }
  for (const camp of world.camps || []) {
    if (!openGround(world, camp.x, camp.y)) continue;
    const d = Math.hypot(agent.x - camp.x, agent.y - camp.y);
    if (d < 14) return { x: camp.x, y: camp.y, comfort: 0.34 };
  }
  const clear = nearestClear(world, agent.x, agent.y);
  return clear ? { x: clear.x, y: clear.y, comfort: 0.12 } : null;
}

function nearestClear(world, x, y) {
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  let best = null;
  let bestS = Infinity;
  for (let dy = -8; dy <= 8; dy++) {
    for (let dx = -8; dx <= 8; dx++) {
      const tx = x0 + dx;
      const ty = y0 + dy;
      if (!world.isLand(tx, ty) || !openGround(world, tx, ty)) continue;
      const score = Math.hypot(dx, dy) + (world.tileAt(tx, ty) === TILE_GRASS ? 0 : 1.4);
      if (score < bestS) {
        bestS = score;
        best = { x: tx, y: ty };
      }
    }
  }
  return best;
}

export function groggy(agent) {
  const nerve = ensureNerve(agent);
  return nerve.urge > 0.62 && agent.thirst < 82 && agent.hunger < 90;
}

export function nodding(agent) {
  const nerve = ensureNerve(agent);
  return nerve.urge > 0.5 && agent.thirst < 82 && agent.hunger < 90;
}

export function stirred(agent) {
  const nerve = ensureNerve(agent);
  if (agent.thirst > 82 || agent.hunger > 90) return true;
  if (nerve.pressure < 0.32 && nerve.alert > 0.45) return true;
  return nerve.urge < 0.34 && nerve.alert > 0.22;
}

export function nerveRead(agent) {
  const nerve = agent.nerve;
  if (!nerve) return "";
  const bird = nerve.chronotype > 1.1 ? "сова" : nerve.chronotype < -1.1 ? "жаворонок" : "ровный ритм";
  return `Сон ${Math.round(nerve.pressure * 100)}, ${bird}, бодрствует ${Math.round(nerve.awakeHours)} ч.`;
}

function alertness(dayFraction, chronotype) {
  const shift = (chronotype || 0) / 24;
  return 0.5 - 0.5 * Math.cos(Math.PI * 2 * (dayFraction - shift));
}
