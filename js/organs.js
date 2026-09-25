// Органы — части тела с массой. Еда входит через желудок, мысль идёт по связям мозга.

const PARTS = [
  ["brain", "мозг", 0.02],
  ["heart", "сердце", 0.0045],
  ["lungs", "лёгкие", 0.016],
  ["stomach", "желудок", 0.0022],
  ["liver", "печень", 0.024],
  ["gall", "желчный", 0.0008],
  ["pancreas", "поджелудочная", 0.0013],
  ["gut", "кишечник", 0.018],
  ["kidneys", "почки", 0.0045],
  ["spleen", "селезёнка", 0.0022],
  ["bladder", "мочевой", 0.0006],
  ["skin", "кожа", 0.06],
  ["marrow", "костный мозг", 0.04],
  ["blood", "кровь", 0.07],
];

const SEX = {
  F: [["uterus", "матка", 0.001], ["ovaries", "яичники", 0.0002]],
  M: [["testes", "семенники", 0.0004]],
};

export function growOrgans(agent) {
  const body = agent.body;
  if (!body) return null;
  if (!body.organs) body.organs = {};
  const rows = PARTS.concat(SEX[agent.sex] || SEX.M);
  for (const [id, name, frac] of rows) {
    const organ = body.organs[id] || { id, name };
    organ.grams = body.mass * frac * 1000;
    body.organs[id] = organ;
  }
  const stomach = body.organs.stomach;
  stomach.capacity = 0.35 + stomach.grams / 180;
  stomach.load = stomach.load || 0;
  const gut = body.organs.gut;
  gut.hold = 0.4 + gut.grams / 4000;
  gut.stool = gut.stool || 0;
  const bladder = body.organs.bladder;
  bladder.capacity = 0.2 + bladder.grams / 70;
  bladder.urine = bladder.urine || 0;
  ensureLegs(body);
  return body.organs;
}

export function swallow(agent, meal, portion) {
  const organs = growOrgans(agent);
  const stomach = organs && organs.stomach;
  if (!stomach || stomach.grams < 8) return 0;
  const room = Math.max(0, stomach.capacity - stomach.load);
  const bite = Math.min(room, portion);
  if (bite <= 0) return 0;
  stomach.load += bite;
  stomach.meal = meal;
  return bite;
}

export function drain(agent) {
  const organs = growOrgans(agent);
  if (!organs) return 0;
  const stomach = organs.stomach;
  const gut = organs.gut;
  const liver = organs.liver;
  if (!stomach || !gut || !liver) return 0;
  if (gut.grams < 12 || liver.grams < 16 || stomach.load <= 0) return 0;
  const move = Math.min(stomach.load, 0.7);
  stomach.load -= move;
  return move;
}

const FIBER = { berry: 0.22, meat: 0.08, fish: 0.06, milk: 0.03, water: 0 };

export function keepStool(agent, meal, portion) {
  const gut = growOrgans(agent).gut;
  gut.stool = Math.min(gut.hold + 0.4, gut.stool + (FIBER[meal] || 0.1) * portion);
}

export function settleWaste(agent, filtrate) {
  const organs = growOrgans(agent);
  const store = agent.body.store;
  const kidneys = organs.kidneys;
  const bladder = organs.bladder;
  if (store && kidneys && kidneys.grams >= 8 && bladder) {
    const pass = Math.min(store.water, Math.max(0, filtrate));
    store.water -= pass;
    bladder.urine += pass;
    if (bladder.urine >= bladder.capacity) {
      bladder.urine = 0;
      bladder.last = "помочился";
    }
  }
  const gut = organs.gut;
  if (gut && gut.stool >= gut.hold) {
    gut.stool = 0;
    gut.last = "оправился";
  }
  mendLegs(agent);
}

export function strainLeg(agent, hard) {
  const organs = growOrgans(agent);
  const legs = [organs.legL, organs.legR].filter((leg) => leg && !leg.break);
  if (!legs.length || !hard) return;
  const weak = agent.body.store && agent.body.store.mineral < 0.15;
  if (Math.random() > (weak ? 0.22 : 0.06)) return;
  const leg = legs[Math.floor(Math.random() * legs.length)];
  leg.break = 7 + Math.round((1 - (agent.body.bone || 0.12)) * 5);
  leg.last = "сломана";
}

export function legPace(agent) {
  const organs = agent.body && agent.body.organs;
  if (!organs) return 1;
  let pace = 1;
  if (organs.legL && organs.legL.break > 0) pace *= 0.45;
  if (organs.legR && organs.legR.break > 0) pace *= 0.45;
  return pace;
}

export function seatMind(agent) {
  const organs = growOrgans(agent);
  const brain = organs && organs.brain;
  if (!brain || !agent.brain) return;
  brain.synapses = agent.brain;
  brain.links = countLinks(agent.brain);
}

export function organLine(agent) {
  const organs = agent.body && agent.body.organs;
  if (!organs) return "";
  const names = Object.values(organs).map((organ) => organ.name).join(", ");
  const stomach = organs.stomach;
  const brain = organs.brain;
  const fill = stomach && stomach.capacity ? Math.round(stomach.load / stomach.capacity * 100) : 0;
  const links = brain && brain.links ? brain.links : 0;
  const urine = organs.bladder && organs.bladder.capacity ? Math.round(organs.bladder.urine / organs.bladder.capacity * 100) : 0;
  const stool = organs.gut && organs.gut.hold ? Math.round(organs.gut.stool / organs.gut.hold * 100) : 0;
  const broke = [organs.legL, organs.legR].filter((leg) => leg && leg.break > 0).map((leg) => leg.name);
  const limp = broke.length ? ` Сломано: ${broke.join(", ")}.` : "";
  const pee = organs.bladder && organs.bladder.last ? ` ${organs.bladder.last}.` : "";
  const dump = organs.gut && organs.gut.last ? ` ${organs.gut.last}.` : "";
  return `${names}. Желудок ${fill}%. Мочевой ${urine}%. Кишечник ${stool}%.${pee}${dump}${limp} Связей в мозге ${links}.`;
}

function ensureLegs(body) {
  const grams = body.mass * (body.bone || 0.14) * 0.35 * 1000;
  if (!body.organs.legL) body.organs.legL = { id: "legL", name: "левая нога", break: 0 };
  if (!body.organs.legR) body.organs.legR = { id: "legR", name: "правая нога", break: 0 };
  body.organs.legL.grams = grams;
  body.organs.legR.grams = grams;
}

function mendLegs(agent) {
  const organs = agent.body.organs;
  const mineral = agent.body.store && agent.body.store.mineral > 0.18;
  const rest = agent.state === "rest" || agent.activity === "спит";
  for (const leg of [organs.legL, organs.legR]) {
    if (!leg || !leg.break) continue;
    leg.break -= rest && mineral ? 1 : 0.3;
    if (leg.break <= 0) leg.break = 0;
  }
}

function countLinks(brain) {
  let count = 0;
  for (const key of ["w1", "w2", "gate", "bind"]) {
    const net = brain[key];
    if (!net) continue;
    for (const row of net) count += row.length;
  }
  return count;
}
