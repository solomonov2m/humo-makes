// Руда лежит в холмах. Взять её можно, а сплавить — только у огня, с деревом рядом.

import { TILE_FOREST, TILE_HILL } from "./world.js";
import { knownAt } from "./chart.js";
import { groundMatter, takeSample } from "./matter.js";
import { tryMix } from "./react.js";
import { holds } from "./notions.js";

const ORE_IDS = new Set(["ore", "copper", "tinore"]);
const METAL_IDS = new Set(["iron", "cu", "tin", "bronze", "alloy"]);

export function isOre(piece) {
  return !!piece && ORE_IDS.has(piece.id);
}

export function isMetal(piece) {
  return !!piece && METAL_IDS.has(piece.id);
}

export function nearestOre(world, x, y, vision) {
  return scan(world, x, y, vision, TILE_HILL, (piece) => isOre(piece));
}

export function nearestForge(world, x, y, vision) {
  return scan(world, x, y, vision, TILE_FOREST, () => true);
}

function scan(world, x, y, vision, tile, fits) {
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  const reach = Math.max(1, Math.round(vision));
  let best = null;
  for (let dy = -reach; dy <= reach; dy++) {
    for (let dx = -reach; dx <= reach; dx++) {
      const cx = x0 + dx;
      const cy = y0 + dy;
      const d = Math.hypot(dx, dy);
      if (d > vision) continue;
      if (world.tileAt(cx, cy) !== tile || !knownAt(world, cx, cy)) continue;
      const piece = groundMatter(world, cx, cy);
      if (!fits(piece)) continue;
      if (!best || d < best.d) best = { x: cx, y: cy, d, id: piece.id };
    }
  }
  return best;
}

export function minePlan(agent, world) {
  if (isOre(agent.pocket)) {
    const forge = nearestForge(world, agent.x, agent.y, agent.traits.vision);
    if (forge) return { state: "mine", target: forge, activity: "несёт руду к огню" };
    return { state: "mine", target: agent.house || null, activity: "несёт руду домой" };
  }
  if (isMetal(agent.pocket)) {
    return { state: "mine", target: agent.house || null, activity: "несёт металл домой" };
  }
  const ore = nearestOre(world, agent.x, agent.y, agent.traits.vision);
  if (!ore) return null;
  return { state: "mine", target: ore, activity: "идёт за рудой" };
}

export function mineArrive(agent, world) {
  if (!agent.target) return;
  if (agent.distanceTo(agent.target) >= 0.7) return;
  if (!agent.pocket) {
    takeSample(agent, world);
    return;
  }
  if (isOre(agent.pocket)) {
    const here = groundMatter(world, Math.round(agent.x), Math.round(agent.y));
    const heat = holds(agent, "Огонь");
    const trial = tryMix(agent.pocket, here, heat);
    if (trial && trial.ok && trial.out) {
      agent.pocket = { ...here, id: trial.out, name: trial.out, grams: trial.grams || agent.pocket.grams };
      agent.activity = trial.note || "в жаре руда меняется";
    }
  }
}

export function mineDeposit(agent, world) {
  if (!agent.pocket || !(isMetal(agent.pocket) || isOre(agent.pocket)) || !agent.house) return false;
  if (agent.distanceTo(agent.house) >= 0.95) return false;
  const culture = world.culture;
  culture.metal = culture.metal || {};
  const id = agent.pocket.id;
  culture.metal[id] = (culture.metal[id] || 0) + (agent.pocket.grams || 0);
  agent.activity = `сложил ${agent.pocket.name} в запас`;
  agent.pocket = null;
  return true;
}
