import { TILE_FOREST } from "./world.js";
import { knows } from "./lore.js";
import { crowdLimit } from "./civ.js";
import { pressing } from "./lack.js";
import { farmPlan } from "./farm.js";
import { nearestHaul, takeHaul } from "./haul.js";
import { coverOf, freshStack, layPiece, stackLine } from "./stack.js";

const WOOD_CAP = 22;

export function prepareWood(world) {
  world.wood = new Map();
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      if (world.tileAt(x, y) !== TILE_FOREST || Math.random() > 0.28) continue;
      world.wood.set(`${x},${y}`, { amount: 7 + Math.random() * 6, cap: 14 });
    }
  }
  ensureGrove(world);
}

function ensureGrove(world) {
  const camp = world.camp;
  if (!camp || !world.wood) return;
  for (const [key, pile] of world.wood) {
    const cut = key.indexOf(",");
    const x = Number(key.slice(0, cut));
    const y = Number(key.slice(cut + 1));
    if (Math.hypot(x - camp.x, y - camp.y) < 5 && pile.amount > 1) return;
  }
  let best = null;
  let bestD = 12;
  for (let dy = -10; dy <= 10; dy++) {
    for (let dx = -10; dx <= 10; dx++) {
      const x = camp.x + dx;
      const y = camp.y + dy;
      if (world.tileAt(x, y) !== TILE_FOREST) continue;
      const dist = Math.hypot(dx, dy);
      if (dist < bestD) {
        bestD = dist;
        best = { x, y };
      }
    }
  }
  if (!best) return;
  world.wood.set(`${best.x},${best.y}`, { amount: 16, cap: 18, x: best.x, y: best.y });
}

export function houseTechKnown(culture) {
  return knows(culture, "Жилище");
}

export function livable(house) {
  return coverOf(house) >= 0.45;
}

export function dwellingWord(house) {
  return stackLine(house);
}

function gatherPlan(agent, world) {
  const haul = nearestHaul(world, agent.x, agent.y, agent.traits.vision);
  if (!haul) return null;
  const name = haul.pile ? "древесину" : "то, что лежит на земле";
  return { state: "gather", target: haul.pile || haul, activity: `идёт взять ${name}` };
}

function claimStack(agent, world, byId) {
  for (const house of world.houses) {
    if (coverOf(house) >= 0.4) continue;
    const owner = byId.get(house.ownerId);
    if (owner && owner.alive && owner !== agent) continue;
    house.ownerId = agent.id;
    if (!house.pieces) house.pieces = [];
    agent.house = house;
    return house;
  }
  if (world.countHousesNear(agent.x, agent.y, 7) >= crowdLimit(world.culture)) return null;
  const site = world.findHouseSite(agent.x, agent.y);
  if (!site) return null;
  const house = freshStack(site.x, site.y, agent.id);
  house.maker = agent.name;
  house.makerId = agent.id;
  world.houses.push(house);
  agent.house = house;
  return house;
}

export function housingPlan(agent, world, byId) {
  if (!agent.isAdult || agent.energy <= 20) return null;
  let own = agent.house && agent.house.ownerId === agent.id ? agent.house : null;
  if (!own && agent.house && coverOf(agent.house) < 0.4) {
    const owner = byId.get(agent.house.ownerId);
    if (!owner || !owner.alive) {
      agent.house.ownerId = agent.id;
      own = agent.house;
    }
  }
  const job = pressing(agent, world);
  if (own && coverOf(own) < 1) {
    if (!agent.pocket) return gatherPlan(agent, world);
    return { state: "build", target: own, activity: `несёт ${agent.pocket.name}` };
  }
  if (job === "field" && farmPlan(agent, world)) {
    return { state: agent.state, target: agent.target, activity: agent.activity };
  }
  if (agent.house || agent.partnerHome(byId)) return null;
  if (!agent.wantsNewHouse(world, byId)) return null;
  if (!agent.pocket) return gatherPlan(agent, world);
  const site = claimStack(agent, world, byId);
  if (!site) return null;
  return { state: "build", target: site, activity: `несёт ${agent.pocket.name}` };
}

export function takeArmful(agent, world) {
  if ((agent.wood || 0) >= WOOD_CAP) return 0;
  return takeHaul(agent, world);
}

export function layCourse(agent) {
  return layPiece(agent.house, agent);
}

export function tallyDwellings(houses) {
  let open = 0;
  let closed = 0;
  for (const house of houses) {
    if (!house.pieces || !house.pieces.length) continue;
    if (coverOf(house) >= 0.45) closed += 1;
    else open += 1;
  }
  return { shelters: closed, houses: 0, building: open, homes: closed };
}

export function homeCard(agent, where) {
  const carried = agent.pocket ? agent.pocket.name : "пусто";
  const stock = `В руках: ${carried}.`;
  if (!agent.house || !(agent.house.pieces || []).length) {
    const detail = agent.isChild
      ? "Своей кладки нет: ребёнок держится семьи."
      : `${stock} Кладки нет. Она появится из того, что он донесёт, когда станет холодно.`;
    return { title: "Кладки нет", detail, progress: 0, cls: "none" };
  }
  const house = agent.house;
  const line = stackLine(house);
  const pct = Math.round(coverOf(house) * 100);
  return {
    title: line,
    detail: `${stock} Укрытие ${pct}% · ${where}. Форма — те куски, которые он положил.`,
    progress: pct,
    cls: pct >= 45 ? "done" : "work",
  };
}
