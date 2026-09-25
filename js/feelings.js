// Чувство этого тела. Его не делят с соседом и не назначают эпохой.

import { cellHeat } from "./phys.js";
import { groundMatter } from "./matter.js";

const NAME = {
  pain: "боль",
  hunger: "голод",
  thirst: "жажда",
  cold: "холод",
  fear: "страх",
  fatigue: "усталость",
  ease: "облегчение",
  curiosity: "любопытство",
};

export function senseFeelings(agent, world) {
  const store = agent.body && agent.body.store;
  const feelings = {
    pain: painOf(agent),
    hunger: store ? lack(store.glucose, 0.7) : agent.hunger / 100,
    thirst: thirstOf(agent, store),
    cold: coldOf(agent, world),
    fear: fearOf(agent, world),
    fatigue: fatigueOf(agent, store),
    curiosity: curiosityOf(agent, world),
    ease: 0,
  };
  const bad = (feelings.pain + feelings.hunger + feelings.thirst + feelings.cold + feelings.fear + feelings.fatigue) / 6;
  const roof = agent.house && agent.house.progress >= 1 ? 0.12 : 0;
  feelings.ease = clamp01(1 - bad + roof);
  agent.feelings = feelings;
  return feelings;
}

export function feelingName(key) {
  return NAME[key] || key;
}

export function strongestFeeling(feelings) {
  let key = "ease";
  let best = -1;
  for (const name of Object.keys(NAME)) {
    const value = feelings[name] || 0;
    if (name !== "ease" && value > best) {
      best = value;
      key = name;
    }
  }
  return { key, value: best };
}

function painOf(agent) {
  const organs = agent.body && agent.body.organs;
  let pain = 0;
  if (organs && organs.legL && organs.legL.break > 0) pain += 0.55;
  if (organs && organs.legR && organs.legR.break > 0) pain += 0.55;
  if (agent.hunger > 85) pain += (agent.hunger - 85) / 30;
  if (agent.thirst > 85) pain += (agent.thirst - 85) / 40;
  return clamp01(pain);
}

function thirstOf(agent, store) {
  if (!store || !agent.body) return agent.thirst / 100;
  const need = agent.body.mass * 0.58;
  if (need <= 0) return 0;
  return clamp01((need - store.water) / need);
}

function coldOf(agent, world) {
  const heat = cellHeat(world, agent.x, agent.y);
  let cold = heat < 6 ? (6 - heat) / 14 : 0;
  const cover = agent.house ? agent.house.progress || 0 : 0;
  cold *= 1 - cover * 0.65;
  return clamp01(cold);
}

function fearOf(agent, world) {
  const reach = (agent.traits && agent.traits.vision) || 4;
  let fear = 0;
  for (const beast of world.animals || []) {
    if (!beast.alive || !beast.kind) continue;
    const id = beast.kind.id;
    if (id !== "wolf" && id !== "boar") continue;
    const dist = Math.hypot(beast.x - agent.x, beast.y - agent.y);
    if (dist > reach) continue;
    const hit = (1 - dist / reach) * (id === "wolf" ? 1 : 0.55);
    if (hit > fear) fear = hit;
  }
  return clamp01(fear);
}

function fatigueOf(agent, store) {
  const sleep = agent.nerve ? agent.nerve.pressure : 0;
  const low = store && store.glucose < 0.25 ? 0.45 : 0;
  return clamp01(sleep * 0.85 + low);
}

function curiosityOf(agent, world) {
  const here = groundMatter(world, Math.round(agent.x), Math.round(agent.y));
  if (!here || here.state === "gas") return 0;
  if (agent.felt && agent.felt[here.id]) return 0.08;
  return 0.5;
}

function lack(have, need) {
  return clamp01((need - have) / need);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
