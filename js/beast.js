// Зверь тратит то же тело, что человек: ест растение или добычу и рожает из запаса.

import { spawnAnimals } from "./animal.js";
import { bootBody, digest, metabolize } from "./metabol.js";
import { sipSoil } from "./grow.js";
import { cellHeat } from "./phys.js";

export function liveBeast(beast, world) {
  if (!beast.alive) return;
  if (beast.age == null) beast.age = 80;
  boot(beast);
  beast.age += 1;
  metabolize(beast, world.day, 1, world);
  if (beast.hunger > 42) feed(beast, world);
  if (beast.thirst > 38) drink(beast, world);
  if (beast.hunger >= 100 || beast.thirst >= 100 || beast.age > 520) beast.alive = false;
}

export function hungerAim(beast, world) {
  if (!beast.alive || (beast.hunger || 0) < 42) return null;
  if ((beast.kind && beast.kind.fang) >= 0.25) {
    const prey = nearestPrey(beast, world);
    return prey ? { x: prey.x, y: prey.y } : null;
  }
  const spot = nearestPlant(beast, world, 4);
  return spot ? { x: spot.x, y: spot.y } : null;
}

export function canBear(a, b) {
  if (!a || !b || a === b || !a.alive || !b.alive) return false;
  if (!a.kind || !b.kind || a.kind.id !== b.kind.id) return false;
  if (!a.sex || a.sex === b.sex) return false;
  return stocked(a) && stocked(b);
}

export function spendBirth(a, b) {
  for (const beast of [a, b]) {
    const store = beast.body.store;
    store.fat = Math.max(0, store.fat - 0.22);
    store.lys = Math.max(0, store.lys - 0.28);
    store.water = Math.max(0, store.water - 0.15);
  }
}

export function fodder(world) {
  let mass = 0;
  for (const spot of world.food.values()) mass += spot.amount || 0;
  return mass;
}

export function breedAnimals(world) {
  const live = (world.animals || []).filter((beast) => beast.alive);
  if (live.length < 2 || fodder(world) < live.length * 6) return;
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      if (Math.hypot(live[i].x - live[j].x, live[i].y - live[j].y) > 2.4) continue;
      if (!canBear(live[i], live[j])) continue;
      const born = spawnAnimals(world, 1, live[i].kind);
      if (!born.length) return;
      spendBirth(live[i], live[j]);
      born[0].age = 0;
      born[0].x = live[i].x;
      born[0].y = live[i].y;
      world.animals.push(born[0]);
      return;
    }
  }
}

function boot(beast) {
  if (!beast.sex) beast.sex = Math.random() < 0.5 ? "F" : "M";
  beast.traits = beast.traits || { metabolismRate: 0.7 };
  beast.state = beast.state || "wander";
  if (!beast.body) beast.body = { mass: Math.max(4, beast.meat || 8) };
  bootBody(beast);
}

function stocked(beast) {
  const store = beast.body && beast.body.store;
  const mass = (beast.body && beast.body.mass) || 1;
  if (!store) return false;
  return store.fat > mass * 0.16 && store.lys > 0.45 && store.water > mass * 0.4;
}

function feed(beast, world) {
  if ((beast.kind && beast.kind.fang) >= 0.25) {
    const prey = nearestPrey(beast, world);
    if (prey && Math.hypot(prey.x - beast.x, prey.y - beast.y) < 0.9) {
      prey.alive = false;
      digest(beast, "meat", 1);
      return;
    }
  }
  const spot = nearestPlant(beast, world, 1);
  if (!spot || spot.amount < 0.4) return;
  const taken = Math.min(spot.amount, 1.1);
  spot.amount -= taken;
  digest(beast, "berry", taken / 5);
}

function drink(beast, world) {
  const x = Math.round(beast.x);
  const y = Math.round(beast.y);
  const heat = cellHeat(world, x, y);
  if (heat < 0) {
    digest(beast, "water", 0.2);
    return;
  }
  const got = sipSoil(world, x, y, 0.1);
  if (got > 0) digest(beast, "water", got * 4);
}

function nearestPlant(beast, world, radius) {
  if (!world.food) return null;
  const x0 = Math.round(beast.x);
  const y0 = Math.round(beast.y);
  let best = null;
  let bestDist = radius + 0.01;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const spot = world.food.get(`${x0 + dx},${y0 + dy}`);
      if (!spot || spot.amount < 0.4) continue;
      const dist = Math.hypot(dx, dy);
      if (dist >= bestDist) continue;
      bestDist = dist;
      best = spot;
    }
  }
  return best;
}

function nearestPrey(beast, world) {
  let best = null;
  let bestDist = 4;
  for (const other of world.animals || []) {
    if (other === beast || !other.alive) continue;
    if ((other.meat || 0) >= (beast.meat || 0)) continue;
    const dist = Math.hypot(other.x - beast.x, other.y - beast.y);
    if (dist >= bestDist) continue;
    bestDist = dist;
    best = other;
  }
  return best;
}
