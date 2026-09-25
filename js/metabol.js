// Обмен: еда разбирается на воду, глюкозу, жир и незаменимые аминокислоты.
// Лизин из ягод почти не берётся — без него тело не растит белок.

import { groundTemp } from "./climate.js";
import { drain, keepStool, settleWaste, swallow } from "./organs.js";

const ESS = ["lys", "met", "thr"];

const MEAL = {
  berry: { glu: 0.42, fat: 0.04, lys: 0.008, met: 0.03, thr: 0.032, min: 0.03, water: 0.45 },
  meat: { glu: 0.06, fat: 0.12, lys: 0.12, met: 0.12, thr: 0.12, min: 0.05, water: 0.16 },
  fish: { glu: 0.05, fat: 0.07, lys: 0.1, met: 0.09, thr: 0.11, min: 0.09, water: 0.2 },
  milk: { glu: 0.07, fat: 0.05, lys: 0.08, met: 0.08, thr: 0.08, min: 0.03, water: 0.32 },
  water: { glu: 0, fat: 0, lys: 0, met: 0, thr: 0, min: 0.01, water: 3.6 },
};

export function bootBody(agent) {
  const body = agent.body;
  if (!body || body.store) return;
  const goal = body.mass;
  body.goal = goal;
  const grown = agent.age == null ? 1 : Math.min(1, agent.age / 140);
  body.mass = agent.age === 0 ? 3.4 : 3.4 + (goal - 3.4) * grown;
  const waterNeed = body.mass * 0.58;
  body.store = {
    water: waterNeed * 0.9,
    glucose: 1.05,
    fat: body.mass * 0.14,
    lys: 0.7,
    met: 0.7,
    thr: 0.7,
    mineral: 0.45,
  };
  body.limit = 0.7;
}

export function digest(agent, meal, scale = 1) {
  bootBody(agent);
  if (!MEAL[meal] || !agent.body) return 0;
  const portion = Math.max(0.25, Math.min(1.5, scale));
  const taken = swallow(agent, meal, portion);
  if (!taken) return 0;
  const moved = drain(agent);
  if (moved > 0) pour(agent, meal, moved);
  reflectVitals(agent);
  return taken;
}

export function nurse(mother, child) {
  bootBody(mother);
  bootBody(child);
  const store = mother.body.store;
  if (store.lys < 0.2 || store.fat < 0.15) return false;
  for (const key of ESS) store[key] = Math.max(0, store[key] - 0.05);
  store.fat = Math.max(0, store.fat - 0.03);
  store.water = Math.max(0, store.water - 0.12);
  digest(child, "milk", 0.8);
  return true;
}

export function metabolize(agent, day, share = 1, world) {
  if (!agent.alive || !agent.body) return;
  const slice = Math.max(0, Math.min(1, share));
  if (slice <= 0) return;
  bootBody(agent);
  const waiting = agent.body.organs && agent.body.organs.stomach && agent.body.organs.stomach.meal;
  const moved = drain(agent) * slice;
  if (moved > 0 && waiting) pour(agent, waiting, moved);
  const store = agent.body.store;
  const rate = agent.traits.metabolismRate || 1;
  const size = kleiber(agent.body.mass);
  const burn = dayBurn(agent, world) * slice;
  spendFuel(agent, burn);
  for (const key of ESS) store[key] = Math.max(0, store[key] - 0.014 * rate * size * slice);
  if (agent.belly) for (const key of ESS) store[key] = Math.max(0, store[key] - 0.03 * slice);
  store.mineral = Math.max(0, store.mineral - 0.01 * size * slice);
  store.water = Math.max(0, store.water - 0.04 * rate * size * slice);
  settleWaste(agent, 0.05 * rate * size * slice);
  growTissue(agent, slice);
  reflectVitals(agent);
}

function pour(agent, meal, portion) {
  const row = MEAL[meal];
  const store = agent.body.store;
  if (!row || !store) return;
  store.glucose = Math.min(2.2, store.glucose + row.glu * portion);
  store.fat = Math.min(agent.body.mass * 0.28, store.fat + row.fat * portion);
  store.mineral = Math.min(1.4, store.mineral + row.min * portion);
  store.water = Math.min(agent.body.mass * 0.72, store.water + row.water * portion);
  for (const key of ESS) store[key] = Math.min(2.2, store[key] + row[key] * portion);
  keepStool(agent, meal, portion);
}

function placeTemp(world, agent) {
  const ix = Math.round(agent.x);
  const iy = Math.round(agent.y);
  let temp = groundTemp(world, ix, iy);
  if (world.heat && world.inBounds(ix, iy)) temp += world.heat[world.idx(ix, iy)];
  return temp;
}

function kleiber(mass) {
  return Math.pow(Math.max(3, mass) / 55, 0.75);
}

function dayBurn(agent, world) {
  const size = kleiber(agent.body.mass);
  const rate = agent.traits.metabolismRate || 1;
  const state = agent.state;
  let work = 1.35;
  if (state === "hunt") work = 2.15;
  else if (state === "build" || state === "gather" || state === "farm" || state === "carry") work = 1.7;
  else if (state === "rest" || agent.activity === "спит") work = 1;
  let burn = 0.05 * rate * size * work;
  const cover = agent.house ? agent.house.progress || 0 : 0;
  burn += 0.018 * size * (1 - cover);
  if (world && agent.x != null) {
    const cold = 8 - placeTemp(world, agent);
    if (cold > 0) burn += 0.028 * size * (1 - cover) * Math.min(2, cold / 10);
  }
  if (agent.belly || agent.nursing > 0) burn += 0.022 * size;
  if (agent.body.mass < (agent.body.goal || agent.body.mass) - 1) burn += 0.016 * size;
  return burn;
}

function spendFuel(agent, burn) {
  const store = agent.body.store;
  if (store.glucose >= burn) store.glucose -= burn;
  else {
    const rest = burn - store.glucose;
    store.glucose = 0;
    store.fat = Math.max(0, store.fat - rest * 0.45);
    if (store.fat < agent.body.mass * 0.035) waste(agent);
  }
  const ready = store.glucose / 0.7 + store.fat / Math.max(0.4, agent.body.mass * 0.08);
  agent.energy = clamp(ready * 42);
}

function waste(agent) {
  const limit = aminoLimit(agent.body.store);
  agent.body.mass = Math.max(3, agent.body.mass - (limit < 0.2 ? 0.06 : 0.03));
  agent.body.protein = Math.max(0.08, (agent.body.protein || 0.16) - 0.002);
}

function growTissue(agent, slice) {
  const store = agent.body.store;
  const limit = aminoLimit(store);
  agent.body.limit = limit;
  const goal = agent.body.goal || agent.body.mass;
  if (agent.body.mass >= goal - 0.2) return;
  if (limit < 0.28 || store.glucose < 0.12 || store.mineral < 0.12 || store.water < agent.body.mass * 0.5) return;
  const gain = Math.min(0.12 * slice, goal - agent.body.mass);
  store.glucose = Math.max(0, store.glucose - gain * 0.35);
  agent.body.mass += gain;
  for (const key of ESS) store[key] = Math.max(0, store[key] - 0.05);
  store.mineral = Math.max(0, store.mineral - 0.02);
  agent.body.protein = Math.min(0.22, (agent.body.protein || 0.16) + 0.001);
}

function aminoLimit(store) {
  return Math.min(store.lys, store.met, store.thr);
}

function reflectVitals(agent) {
  const body = agent.body;
  const store = body.store;
  const waterNeed = body.mass * 0.58;
  let hunger = 58 - store.glucose * 28 - Math.min(24, store.fat * 3);
  if (store.glucose < 0.15) hunger += 28;
  if (aminoLimit(store) < 0.05 && store.fat < body.mass * 0.04) hunger = 100;
  agent.hunger = clamp(hunger);
  agent.thirst = clamp((waterNeed - store.water) / waterNeed * 160);
  if (store.water < waterNeed * 0.22) agent.thirst = 100;
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

export function aminoLine(agent) {
  const store = agent.body && agent.body.store;
  if (!store) return "";
  const lys = Math.round(store.lys * 100);
  const met = Math.round(store.met * 100);
  const thr = Math.round(store.thr * 100);
  const wall = Math.min(lys, met, thr);
  const lack = wall === lys ? "лизин" : wall === met ? "метионин" : "треонин";
  return `Аминокислоты: лизин ${lys}, метионин ${met}, треонин ${thr}. Рост держит ${lack}.`;
}
