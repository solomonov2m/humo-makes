// Куда идти, когда дела нет: только место, которое человек уже помнит.

import { remember } from "./skills.js";
import { knownAt } from "./chart.js";

function pick(spots) {
  let sum = 0;
  for (const spot of spots) sum += spot.worth || 1;
  let roll = Math.random() * sum;
  for (const spot of spots) {
    roll -= spot.worth || 1;
    if (roll <= 0) return spot;
  }
  return spots[spots.length - 1];
}

export function stayPut(agent) {
  if (agent.house) return { x: agent.house.x, y: agent.house.y, home: true };
  if (agent.hearth) return { x: agent.hearth.x, y: agent.hearth.y, home: true };
  return { x: agent.x, y: agent.y, home: false };
}

export function dayRound(agent, world, dayFraction) {
  const home = stayPut(agent);
  const night = dayFraction >= 0.78 || dayFraction < 0.12;
  if (night) return home;
  return tripOut(agent, world, home);
}

function tripOut(agent, world, home) {
  const drink = drinkNear(world, home.x, home.y, 22);
  if (drink) return { x: drink.x, y: drink.y, home: false };
  const ang = ((agent.id % 12) / 12) * Math.PI * 2;
  for (let dist = 10; dist >= 4; dist -= 1) {
    const x = Math.round(home.x + Math.cos(ang) * dist);
    const y = Math.round(home.y + Math.sin(ang) * dist);
    if (!world || world.isWalkable(x, y)) return { x, y, home: false };
  }
  return home;
}

function drinkNear(world, x, y, radius) {
  if (!world || !world.drinks) return null;
  let best = null;
  let bestDist = radius;
  for (const spot of world.drinks) {
    if (!world.isWalkable(Math.round(spot.x), Math.round(spot.y))) continue;
    const dist = Math.hypot(spot.x - x, spot.y - y);
    if (dist < 3 || dist >= bestDist) continue;
    best = spot;
    bestDist = dist;
  }
  return best;
}

export function nextStroll(agent, world) {
  const known = [];
  for (const spot of agent.places || []) {
    if ((spot.worth || 0) >= 0.7) known.push(spot);
  }
  if (agent.house) known.push({ x: agent.house.x, y: agent.house.y, worth: 3 });
  if (!known.length) {
    const camp = world && world.camp;
    if (camp) return { x: camp.x, y: camp.y, home: true };
    return stayPut(agent);
  }
  const spot = pick(known);
  return { x: spot.x, y: spot.y, scout: false };
}

export function stepOut(agent, world) {
  if (world && Math.random() < 0.35) {
    const edge = nearestFog(agent, world);
    if (edge) return edge;
  }
  for (let n = 0; n < 8; n++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 2.4 + Math.random() * 5;
    const x = agent.x + Math.cos(ang) * dist;
    const y = agent.y + Math.sin(ang) * dist;
    if (!world || world.isWalkable(Math.round(x), Math.round(y))) return { x, y, scout: true };
  }
  return { x: agent.x + 1.2, y: agent.y, scout: true };
}

function nearestFog(agent, world) {
  const x0 = Math.round(agent.x);
  const y0 = Math.round(agent.y);
  for (let r = 2; r <= 14; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = x0 + dx;
        const y = y0 + dy;
        if (!world.inBounds(x, y) || knownAt(world, x, y) || !world.isLand(x, y)) continue;
        return { x, y, scout: true };
      }
    }
  }
  return null;
}

export function fadePlaces(agent) {
  if (!agent.places) return;
  const left = [];
  for (const spot of agent.places) {
    spot.worth = (spot.worth || 1) * 0.96;
    if (spot.worth >= 0.2) left.push(spot);
  }
  agent.places = left;
}

export function sharePlaces(agent, neighbors) {
  if (!agent.places || !neighbors) return;
  let best = null;
  for (const spot of agent.places) {
    if ((spot.worth || 0) < 1.8) continue;
    if (!best || spot.worth > best.worth) best = spot;
  }
  if (!best) return;
  for (const other of neighbors) {
    if (!other.alive || agent.distanceTo(other) > 2.2) continue;
    remember(other, best.kind, best.x, best.y, 0.4);
  }
}
