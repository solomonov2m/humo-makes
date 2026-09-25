// Факты природы. Это не цели: зверь, пласт и форма инструмента просто лежат в мире.

import { TILE_FOREST, TILE_HILL, TILE_SAND, TILE_SHALLOW } from "./world.js";
import { groundMatter } from "./matter.js";

export const BEASTS = [
  { id: "hare", name: "заяц", where: "grass", meat: 8, fang: 0, color: "#c4a574" },
  { id: "bird", name: "птица", where: "grass", meat: 4, fang: 0, color: "#3d4a62" },
  { id: "deer", name: "олень", where: "forest", meat: 22, fang: 0.06, color: "#8a5a32" },
  { id: "boar", name: "кабан", where: "forest", meat: 26, fang: 0.2, color: "#4a3428" },
  { id: "wolf", name: "волк", where: "forest", meat: 14, fang: 0.28, color: "#6e6a66" },
  { id: "goat", name: "коза", where: "hill", meat: 16, fang: 0.08, color: "#d8d0c4" },
];

export const STUFF = [];

export const TOOLS = [
  { id: "flake", name: "отщеп", from: "flint", does: "режет и бьёт" },
  { id: "spear", name: "копьё", from: "wood", does: "достаёт зверя дальше руки" },
  { id: "pot", name: "горшок", from: "clay", does: "держит еду и воду" },
  { id: "knife", name: "нож", from: "ore", does: "режет точнее камня" },
  { id: "plow", name: "соха", from: "wood", does: "тянет землю" },
  { id: "wheel", name: "колесо", from: "wood", does: "катит груз" },
  { id: "furnace", name: "плавильня", from: "clay", does: "держит жар" },
  { id: "wire", name: "проволока", from: "copper", does: "тянет искру" },
  { id: "dynamo", name: "генератор", from: "coal", does: "жар и кручение дают ток" },
];

export const BODY = [
  { id: "hunger", name: "голод" },
  { id: "thirst", name: "жажда" },
  { id: "cold", name: "холод" },
  { id: "tired", name: "усталость" },
  { id: "sight", name: "зрение" },
  { id: "kin", name: "свои рядом" },
];

export function pickBeast(world, x, y) {
  const where = groundAt(world, x, y);
  const list = BEASTS.filter((beast) => beast.where === where);
  const pool = list.length ? list : BEASTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function seedGround(world) {
  world.stuff = new Map();
}

export function stuffNear(agent, world, id) {
  const reach = Math.ceil(agent.traits.vision);
  const ax = Math.round(agent.x);
  const ay = Math.round(agent.y);
  for (let y = ay - reach; y <= ay + reach; y++) {
    for (let x = ax - reach; x <= ax + reach; x++) {
      if (Math.hypot(x - agent.x, y - agent.y) > agent.traits.vision) continue;
      const piece = groundMatter(world, x, y);
      if (piece && piece.id === id) return { x, y, id: piece.id, name: piece.name, amount: 1 };
    }
  }
  return null;
}

export function drawGround() {}

function groundAt(world, x, y) {
  const tile = world.tileAt(Math.round(x), Math.round(y));
  if (tile === TILE_HILL) return "hill";
  if (tile === TILE_FOREST) return "forest";
  if (tile === TILE_SAND || tile === TILE_SHALLOW) return "shore";
  return "grass";
}
