import { knows } from "./lore.js";
import { practice } from "./skills.js";
import { digest } from "./metabol.js";
import { christenField } from "./call.js";

export const CROPS = [
  { name: "репа", days: 8, food: 6 },
  { name: "ячмень", days: 14, food: 9 },
  { name: "пшеница", days: 20, food: 13 },
];

export function fieldKnown(culture) {
  return knows(culture, "Поле");
}

export function growFields(world) {
  if (!world.fields) return;
  for (const field of world.fields) {
    if (field.ripe) continue;
    field.grow = (field.grow || 0) + 1;
    if (field.grow >= CROPS[field.crop].days) field.ripe = true;
  }
}

function plotNear(world, house) {
  const steps = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0], [0, 2], [-2, 0], [0, -2], [3, 0], [0, 3]];
  for (const [dx, dy] of steps) {
    const x = house.x + dx;
    const y = house.y + dy;
    if (!world.isGrass(x, y)) continue;
    if ((world.fields || []).some((f) => f.x === x && f.y === y)) continue;
    if (world.houses.some((h) => h.x === x && h.y === y)) continue;
    return { x, y };
  }
  return null;
}

function ownField(agent, world) {
  return (world.fields || []).find((f) => f.ownerId === agent.id) || null;
}

export function ripeMeal(agent, world) {
  if (agent.hunger < 48) return false;
  const field = ownField(agent, world);
  if (!field || !field.ripe) return false;
  agent.state = "farm";
  agent.target = field;
  agent.activity = `идёт собрать ${CROPS[field.crop].name}`;
  return true;
}

export function farmPlan(agent, world) {
  if (!agent.isAdult) return false;
  const house = agent.house;
  if (!house || house.progress < 1) return false;
  if (!world.fields) world.fields = [];
  let field = ownField(agent, world);
  if (!field) {
    const site = plotNear(world, house);
    if (!site) return false;
    field = { x: site.x, y: site.y, ownerId: agent.id, crop: 0, grow: 0, ripe: false, cuts: 0 };
    christenField(agent, field);
    world.fields.push(field);
  }
  const crop = CROPS[field.crop];
  agent.state = "farm";
  agent.target = field;
  agent.activity = field.ripe ? `собирает ${crop.name}` : `растит ${crop.name}`;
  return true;
}

export function workField(agent, world) {
  agent.pursue(agent.target, world);
  if (!agent.target || agent.distanceTo(agent.target) >= 0.85) return true;
  const field = agent.target;
  const crop = CROPS[field.crop] || CROPS[0];
  if (!field.ripe) {
    field.grow = Math.min(crop.days, (field.grow || 0) + 0.4);
    if (field.grow >= crop.days) field.ripe = true;
    practice(agent, "farm", 0.08);
    agent.tradeWait = 14;
    agent.activity = `ухаживает: ${crop.name}`;
    return true;
  }
  digest(agent, "berry", crop.food / 8);
  field.ripe = false;
  field.grow = 0;
  if (agent.hunger > 42 && field.crop < CROPS.length - 1) {
    field.crop += 1;
    agent.activity = `${crop.name} не наедает, сеет ${CROPS[field.crop].name}`;
  } else {
    agent.activity = `собрал ${crop.name}`;
  }
  practice(agent, "farm", 0.22);
  agent.tradeWait = 10;
  return true;
}

export function cropCensus(world) {
  const n = [0, 0, 0];
  for (const field of world.fields || []) n[field.crop] += 1;
  return { fields: n[0] + n[1] + n[2], turnip: n[0], barley: n[1], wheat: n[2] };
}
