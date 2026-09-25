// Мир сам прогоняет лежащую материю через законы. Руки для этого не нужны.

import { stuff } from "./elements.js";
import { burn } from "./laws.js";
import { coolField } from "./phys.js";
import { advancePile } from "./rot.js";

const NEI = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function weave(world, agents) {
  coolField(world);
  const clouds = world.reek || [];
  for (const beast of world.animals || []) spoilBeast(beast, clouds);
  for (const agent of agents || []) {
    spoilBasket(agent, clouds);
    spoilPocket(agent, world, clouds);
  }
  spoilWood(world, clouds);
  burnWood(world);
  world.reek = clouds;
}

function spoilBeast(beast, clouds) {
  if (beast.alive) return;
  if (beast.soft == null) {
    const grams = (beast.meat || 8) * 35;
    beast.soft = grams;
    beast.wet = grams * 0.6;
    beast.rot = 0;
    beast.gas = 0;
  }
  beast.hot = false;
  advancePile(beast);
  if (beast.gas > 20) clouds.push({ x: beast.x, y: beast.y, gas: beast.gas });
}

function spoilBasket(agent, clouds) {
  if (!agent.alive || !(agent.basket > 1)) return;
  const pile = agent.larder || openLarder(agent);
  pile.soft = agent.basket * 50;
  pile.wet = pile.soft * 0.55;
  pile.hot = false;
  advancePile(pile);
  agent.basket = Math.max(0, pile.soft / 50);
  agent.larder = pile;
  if (pile.gas > 20) clouds.push({ x: agent.x, y: agent.y, gas: pile.gas * 0.35 });
}

function spoilPocket(agent, world, clouds) {
  const pocket = agent.pocket;
  if (!agent.alive || !pocket || pocket.kind !== "organic") return;
  const ix = Math.round(agent.x);
  const iy = Math.round(agent.y);
  const wet = sitsWet(world, ix, iy);
  const hot = fireAt(world, ix, iy);
  if (!wet && !hot) return;
  if (hot) {
    const fired = burn({ ...pocket }, stuff("air"), true);
    if (fired && fired.ok) agent.pocket = null;
    return;
  }
  const pile = {
    soft: pocket.grams || 40,
    wet: pocket.grams || 40,
    rot: pocket.rot || 0,
    gas: pocket.gas || 0,
    hot: false,
  };
  advancePile(pile);
  pocket.grams = pile.soft;
  pocket.rot = pile.rot;
  pocket.gas = pile.gas;
  if (pile.soft < 15) agent.pocket = null;
  if (pile.gas > 20) clouds.push({ x: agent.x, y: agent.y, gas: pile.gas });
}

function spoilWood(world, clouds) {
  if (!world.wood) return;
  for (const [key, pile] of world.wood) {
    const [x, y] = key.split(",").map(Number);
    if (!sitsWet(world, x, y) || fireAt(world, x, y)) continue;
    if (pile.soft == null) {
      pile.soft = pile.amount * 80;
      pile.wet = pile.soft * 0.35;
      pile.rot = 0;
      pile.gas = 0;
    }
    pile.hot = false;
    advancePile(pile);
    pile.amount = Math.max(0, pile.soft / 80);
    if (pile.gas > 20) clouds.push({ x, y, gas: pile.gas });
  }
}

function burnWood(world) {
  if (!world.wood || !world.heat) return;
  for (const [key, pile] of world.wood) {
    const [x, y] = key.split(",").map(Number);
    if (!fireAt(world, x, y) || pile.amount < 0.4) continue;
    const fuel = { ...stuff("wood"), grams: 40 };
    const fired = burn(fuel, stuff("air"), true);
    if (!fired || !fired.ok) continue;
    pile.amount = Math.max(0, pile.amount - 0.5);
    if (pile.soft != null) pile.soft = pile.amount * 80;
  }
}

function openLarder(agent) {
  return { soft: 0, wet: 0, rot: 0, gas: 0, hot: false };
}

function fireAt(world, x, y) {
  if (!world.heat || !world.inBounds(x, y)) return false;
  return world.heat[world.idx(x, y)] > 60;
}

function sitsWet(world, x, y) {
  const t = world.tileAt(x, y);
  if (t === 2 || t === 7) return true;
  return NEI.some(([dx, dy]) => {
    const n = world.tileAt(x + dx, y + dy);
    return n === 0 || n === 1 || n === 2 || n === 7;
  });
}
