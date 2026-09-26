// Ближний твёрдый кусок с земли. Что это за вещество, решает клетка, не список построек.

import { knownAt } from "./chart.js";
import { stuff } from "./elements.js";
import { groundMatter } from "./matter.js";
import { closestPile } from "./pile-bin.js";

const BITE = 1.2;

export function nearestHaul(world, x, y, vision) {
  const wood = closestPile(world.wood, world.cols, x, y, vision, (pile) => pile.amount >= 0.6 && knownAt(world, pile.x, pile.y));
  const ground = nearestGround(world, x, y, vision);
  if (wood && (!ground || woodDist(wood, x, y) <= ground.d)) return { mode: "wood", pile: wood };
  return ground;
}

export function takeHaul(agent, world) {
  const target = agent.target;
  if (!target || agent.pocket) return 0;
  if (target.mode === "wood" || target.key) {
    const pile = world.wood && world.wood.get(target.key);
    if (!pile || pile.amount <= 0) return 0;
    const bite = Math.min(pile.amount, BITE);
    pile.amount -= bite;
    agent.pocket = { ...stuff("wood"), grams: bite * 1000 };
  } else {
    const left = stock(world, target.x, target.y);
    if (left < 0.4) return 0;
    const piece = groundMatter(world, target.x, target.y);
    if (!piece || piece.state !== "solid") return 0;
    const bite = Math.min(left, BITE);
    world.scrap.set(`${target.x},${target.y}`, left - bite);
    agent.pocket = { ...piece, grams: bite * 1000 };
  }
  agent.wood = agent.pocket.grams;
  agent.activity = `берёт ${agent.pocket.name}`;
  return agent.pocket.grams;
}

function nearestGround(world, x, y, vision) {
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  const reach = Math.max(1, Math.round(vision));
  let best = null;
  for (let dy = -reach; dy <= reach; dy++) {
    for (let dx = -reach; dx <= reach; dx++) {
      const cx = x0 + dx;
      const cy = y0 + dy;
      if (!knownAt(world, cx, cy) || !world.isLand(cx, cy)) continue;
      const piece = groundMatter(world, cx, cy);
      if (!piece || piece.state !== "solid" || piece.kind === "ore") continue;
      if (stock(world, cx, cy) < 0.4) continue;
      const d = Math.hypot(dx, dy);
      if (d > vision) continue;
      if (!best || d < best.d) best = { mode: "ground", x: cx, y: cy, d };
    }
  }
  return best;
}

function stock(world, x, y) {
  if (!world.scrap) world.scrap = new Map();
  const key = `${x},${y}`;
  if (!world.scrap.has(key)) world.scrap.set(key, 8);
  return world.scrap.get(key);
}

function woodDist(pile, x, y) {
  return Math.hypot(pile.x - x, pile.y - y);
}
