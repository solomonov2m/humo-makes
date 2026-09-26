// Идея не выдаётся по списку. Её додумывает тот, кому тесно и у кого под рукой средство.

import { stuffNear } from "./nature.js";
import { closestPile } from "./pile-bin.js";
import { canAlloy } from "./chem.js";
import { stuff } from "./elements.js";
import { kinHome } from "./folk.js";

export function holds(agent, name) {
  return !!(agent && agent.ideas && agent.ideas[name]);
}

export function feel(agent, culture) {
  const house = agent.house;
  const cover = house ? house.progress || 0 : 0;
  const roof = cover >= 0.45;
  const thin = roof && cover < 0.8;
  const bite = !roof ? 1.15 : thin ? 0.75 : -1.6;
  agent.exposure = Math.max(0, Math.min(90, (agent.exposure || 0) + bite));
  if (!roof) agent.energy = Math.max(0, agent.energy - 0.4);
  else if (thin) {
    agent.energy = Math.max(0, agent.energy - 0.28);
    if ((agent.pantry || 0) > 0) agent.pantry = Math.max(0, agent.pantry - 0.4);
    else agent.hunger = Math.min(100, agent.hunger + 0.16);
  }
  if (!culture) return;
  culture.ache = (culture.ache || 0) * 0.92 + agent.exposure * 0.08;
  if (thin && agent.exposure > 16 && agent.state === "wander") agent.activity = "кладка ещё стынет, еда портится";
  else if (!roof && agent.exposure > 18 && agent.state === "wander") agent.activity = "без крыши неспокойно";
}

export function notice(agent, neighbors, culture, world) {
  if (!agent.isAdult) return null;
  if (!agent.ideas) agent.ideas = {};
  if (!agent.spark) agent.spark = {};
  if (!culture.found) culture.found = {};
  let best = null;
  let warm = null;
  for (const idea of IDEAS) {
    if (agent.ideas[idea.name] || culture.found[idea.name]) continue;
    if (!idea.prior.every((name) => agent.ideas[name])) continue;
    if (agent.mind < idea.mind) continue;
    const gain = idea.notice(agent, neighbors, world);
    if (gain <= 0) continue;
    const filled = (agent.spark[idea.name] || 0) + gain;
    agent.spark[idea.name] = filled;
    const meter = filled / idea.cost;
    if (!warm || meter > warm.meter) warm = { name: idea.name, why: idea.why, meter };
    if (filled < idea.cost) continue;
    if (!best || filled > best.filled) best = { idea, filled };
  }
  agent.warm = warm ? warm.name : "";
  if (warm && (!culture.warm || warm.meter >= culture.warm.meter)) culture.warm = warm;
  if (!best) return null;
  const name = best.idea.name;
  agent.ideas[name] = true;
  culture.found[name] = agent.name;
  culture.last = name;
  culture.kept = Object.keys(culture.found).length;
  agent.known = Object.keys(agent.ideas).length;
  agent.spark[name] = 0;
  if (name === "Плавильня" && agent.house) agent.house.smelter = true;
  return name;
}

function woodNear(agent, world) {
  return !!closestPile(world.wood, world.cols, agent.x, agent.y, agent.traits.vision);
}

function beastsNear(agent, world) {
  const reach = agent.traits.vision;
  return (world.animals || []).some((beast) => beast.alive && Math.hypot(beast.x - agent.x, beast.y - agent.y) <= reach);
}

function roofed(agent) {
  return !!(agent.house && agent.house.progress >= 1);
}

const IDEAS = [
  { name: "Камень", prior: [], mind: 0, cost: 6, why: "руки уже берут еду и ветки", notice: (a) => (a.state === "gather" || a.state === "seek_food" || a.state === "hunt" || a.activity === "ест" || (a.skills.food || 0) > 0.05) ? 0.45 : 0 },
  { name: "Огонь", prior: ["Камень"], mind: 12, cost: 8, why: "сырое хуже, а вместе теплее", notice: (a, n) => (a.activity === "ест" && n.some((x) => x.alive && x.isAdult) ? 0.55 : 0) + (a.exposure > 22 ? 0.2 : 0) },
  { name: "Охота", prior: ["Камень"], mind: 14, cost: 8, why: "зверь рядом, ягод мало", notice: (a) => a.state === "hunt" || (a.skills.hunt || 0) > 0.15 ? 0.4 : 0 },
  { name: "Слово", prior: [], mind: 10, cost: 10, why: "одни и те же люди держатся рядом", notice: (a, n) => a.partnerId && n.some((x) => x.alive) ? 0.28 : 0 },
  { name: "Жилище", prior: [], mind: 16, cost: 7, why: "без укрытия холоднее, древесина рядом можно переложить", notice: (a, _n, w) => (a.state === "build" || a.state === "gather" ? 0.9 : !roofed(a) && a.exposure > 4 && (woodNear(a, w) || (a.wood || 0) > 0) ? 0.5 : 0) },
  { name: "Дом", prior: ["Жилище"], mind: 28, cost: 12, why: "кладки мало, под ней всё ещё холодно", notice: (a) => a.house && (a.house.progress || 0) > 0.3 && (a.house.progress || 0) < 0.8 && (a.skills.craft || 0) > 0.25 ? 0.32 : 0 },
  { name: "Глина", prior: ["Огонь", "Жилище"], mind: 30, cost: 12, why: "глину копают в берегу реки, из неё лепится то, что держит еду", notice: (a, _n, w) => roofed(a) && stuffNear(a, w, "clay") ? 0.28 : 0 },
  { name: "Скот", prior: ["Жилище"], mind: 30, cost: 14, why: "зверь сам ходит к еде у жилья — его можно оставить при себе", notice: (a, _n, w) => a.house && a.hunger < 62 && ((a.skills.hunt || 0) > 0.08 || a.ideas["Охота"]) && beastsNear(a, w) ? 0.34 : 0 },
  { name: "Поле", prior: ["Жилище"], mind: 32, cost: 14, why: "дикая еда у жилья кончается, её можно сеять", notice: (a) => roofed(a) && (a.hunger > 62 || String(a.activity).includes("еды")) ? 0.36 : 0 },
  { name: "Колесо", prior: ["Жилище"], mind: 38, cost: 16, why: "одна и та же тропа сама становится дорогой", notice: (a, _n, w) => (w.culture.paths || 0) > 8 && (a.state === "wander" || a.state === "seek_food") ? 0.18 : 0 },
  { name: "Бронза", prior: ["Огонь", "Камень"], mind: 40, cost: 16, why: "в холмах попадается медная и оловянная руда, порознь они мягкие", notice: (a, _n, w) => (a.skills.craft || 0) > 0.5 && a.ideas["Огонь"] && stuffNear(a, w, "copper") && stuffNear(a, w, "tinore") ? 0.3 : 0 },
  { name: "Железо", prior: ["Огонь", "Камень"], mind: 48, cost: 18, why: "в чёрном песке пляжа железо, его плавят углём из дерева", notice: (a, _n, w) => (a.skills.craft || 0) > 0.9 && a.ideas["Огонь"] && stuffNear(a, w, "ore") ? 0.3 : 0 },
  { name: "Сплав", prior: ["Железо"], mind: 52, cost: 16, why: "два металла в одном жаре дают то, чего не было ни в одном", notice: (a) => (a.skills.craft || 0) > 1.15 && a.ideas["Бронза"] && canAlloy(stuff("iron"), stuff("bronze")).ok ? 0.26 : 0 },
  { name: "Плавильня", prior: ["Сплав", "Жилище"], mind: 54, cost: 14, why: "жар надо удержать в одном месте", notice: (a) => roofed(a) && (a.skills.craft || 0) > 1.3 ? 0.3 : 0 },
  { name: "Рынок", prior: ["Слово", "Дом"], mind: 34, cost: 14, why: "лишнее можно отдать чужому, а не только родне, и получить своё взамен", notice: (a, n) => (a.basket || 0) >= 4 && n.some((x) => x.alive && x.hunger > 40 && !kinHome(a, x)) ? 0.32 : 0 },
  { name: "Письмо", prior: ["Слово"], mind: 46, cost: 18, why: "одно и то же детям уже не вмещается в память", notice: (a, n) => a.children > 0 && n.filter((x) => x.alive && !x.isAdult).length ? 0.2 : 0 },
  { name: "Механика", prior: ["Колесо", "Железо"], mind: 56, cost: 20, why: "дерево и железо уже крутятся вместе", notice: (a) => roofed(a) && (a.skills.craft || 0) > 1.4 ? 0.18 : 0 },
  { name: "Печать", prior: ["Письмо"], mind: 60, cost: 20, why: "знак надо повторять чаще, чем успевает рука", notice: (a, n) => n.some((x) => !x.isAdult && (x.known || 0) >= 4) ? 0.16 : 0 },
  { name: "Наука", prior: ["Письмо", "Механика"], mind: 64, cost: 22, why: "двое проверяют, что вышло, а не верят рассказу", notice: (a, n) => a.state === "rest" && n.some((x) => (x.known || 0) >= 6) ? 0.16 : 0 },
  { name: "Пар", prior: ["Огонь", "Механика"], mind: 68, cost: 22, why: "жар в закрытом месте сам толкает", notice: (a) => roofed(a) && (a.skills.craft || 0) > 1.6 ? 0.15 : 0 },
  { name: "Электричество", prior: ["Наука", "Железо"], mind: 72, cost: 24, why: "искра повторяется, если её ловить", notice: (a, n) => a.state === "rest" && (a.skills.craft || 0) > 1.8 && n.length > 1 ? 0.14 : 0 },
];
