// Локальный взгляд: только то, что тело может заметить само.

import { recall } from "./skills.js";
import { bedOf } from "./nerves.js";
import { nearestOre } from "./mine.js";

export function glance(agent, world, neighbors, byId) {
  const eye = agent.traits.vision;
  const food = world.nearestFood(agent.x, agent.y, eye) || recall(agent, "food");
  const water = nearest(world.drinks || [], agent.x, agent.y, eye + 2) || recall(agent, "water");
  const prey = nearest((world.animals || []).filter((a) => a.alive), agent.x, agent.y, eye, true);
  const beast = threat(agent, world);
  const mate = agent.isAdult ? agent.findPartner(neighbors, byId) : null;
  const bed = bedOf(agent, world);
  const ore = agent.isAdult ? nearestOre(world, agent.x, agent.y, eye) : null;
  const novel = agent.feelings ? agent.feelings.curiosity : 0;
  const bits = [];
  if (food) bits.push("еда");
  if (water) bits.push("вода");
  if (prey) bits.push("добыча");
  if (beast) bits.push("хищник");
  if (bed) bits.push("лежанка");
  if (ore) bits.push("руда");
  if (!bits.length) bits.push("пусто вокруг");
  return { food, water, prey, beast, mate, bed, ore, novel, line: bits.join(", ") };
}

function threat(agent, world) {
  const eye = agent.traits.vision || 4;
  let best = null;
  let bestDist = eye;
  for (const beast of world.animals || []) {
    if (!beast.alive || !beast.kind) continue;
    const id = beast.kind.id;
    if (id !== "wolf" && id !== "boar") continue;
    const dist = Math.hypot(beast.x - agent.x, beast.y - agent.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = beast;
    }
  }
  return best;
}

function nearest(list, x, y, radius, alive) {
  let best = null;
  let bestDist = radius;
  for (const item of list) {
    if (alive && item.alive === false) continue;
    const dist = Math.hypot(item.x - x, item.y - y);
    if (dist >= bestDist) continue;
    bestDist = dist;
    best = item;
  }
  return best;
}
