// Голод, жажда и ремесло: навык берётся из дела, охота — из удачных выходов.

import { farmPlan, ripeMeal, workField } from "./farm.js";
import { lifeStage } from "./life.js";
import { practice, recall, remember } from "./skills.js";
import { stash } from "./folk.js";
import { digest } from "./metabol.js";
import { beastStrikes, huntOdds, meatOf, sipPantry } from "./civ.js";
import { holds } from "./notions.js";
import { sail, sip } from "./phys.js";

function nearest(list, x, y, radius, alive) {
  let best = null;
  let bestDist = radius;
  for (const item of list) {
    if (alive && item.alive === false) continue;
    const dist = Math.hypot(item.x - x, item.y - y);
    if (dist < bestDist) {
      bestDist = dist;
      best = item;
    }
  }
  return best;
}

function pupilOf(agent, neighbors) {
  for (const other of neighbors) {
    if (!other.alive || !other.parents || !other.parents.includes(agent.id)) continue;
    const stage = lifeStage(other);
    if (stage === "child" || stage === "youth") return other;
  }
  return null;
}

function childWord(child) {
  return child.sex === "M" ? "сына" : "дочь";
}

function go(agent, state, target, activity) {
  agent.state = state;
  agent.target = target;
  agent.activity = activity;
}

export function planNeeds(agent, world, neighbors) {
  const stage = lifeStage(agent);
  if (stage === "infant") return false;
  const drinks = world.drinks || [];
  const animals = (world.animals || []).filter((a) => a.alive);
  const eye = agent.traits.vision;
  if (agent.thirst >= 46) {
    const reach = eye + (agent.thirst - 30) * 0.45;
    const spot = nearest(drinks, agent.x, agent.y, reach) || recall(agent, "water");
    if (spot) {
      const seen = Math.hypot(spot.x - agent.x, spot.y - agent.y) <= eye;
      go(agent, "seek_water", { x: spot.x, y: spot.y }, seen ? "ищет воду" : "хочет пить и идёт к воде");
      return true;
    }
  }
  if (agent.energy < 28 && agent.house) {
    go(agent, "rest", agent.house, "устал и идёт лечь");
    return true;
  }
  sipPantry(agent, world.culture);
  if (ripeMeal(agent, world)) return true;
  if (agent.hunger < 50) return false;
  const sight = eye + (agent.hunger - 40) * 0.35;
  const prey = nearest(animals, agent.x, agent.y, sight, true);
  const berry = world.nearestFood(agent.x, agent.y, sight);
  if (prey) {
    const pupil = pupilOf(agent, neighbors || []);
    const teach = pupil ? `учит ${childWord(pupil)} охотиться` : "охотится";
    go(agent, "hunt", prey, agent.skills.hunt >= 0.35 ? teach : "первый раз выслеживает зверя");
    return true;
  }
  if (berry) {
    const seen = agent.distanceTo(berry) <= agent.traits.vision;
    go(agent, "seek_food", berry, seen ? "собирает еду" : "хочет есть и идёт к еде");
    return true;
  }
  const known = recall(agent, "food") || recall(agent, "hunt");
  if (known) {
    go(agent, "seek_food", { x: known.x, y: known.y, key: `${known.x},${known.y}` }, "идёт к знакомому месту");
    return true;
  }
  const bank = nearest(drinks, agent.x, agent.y, agent.traits.vision);
  if (bank) {
    go(agent, "fish", { x: bank.x, y: bank.y }, "рыбачит у воды");
    return true;
  }
  return false;
}

export function planTrade(agent, world) {
  if (!agent.isAdult || agent.hunger > 55 || agent.thirst > 48) return false;
  if ((agent.tradeWait || 0) > 0) {
    agent.tradeWait -= 1;
    return false;
  }
  if (holds(agent, "Скот") && agent.house && agent.hunger > 26 && agent.hunger < 58) {
    go(agent, "herd", agent.house, "кормит скот у дома");
    return true;
  }
  if (farmPlan(agent, world)) return true;
  const shore = world.touchesWater(Math.round(agent.x), Math.round(agent.y));
  if (shore && (agent.wood || 0) >= 2 && agent.skills.water >= 0.35 && agent.skills.craft >= 0.35) {
    go(agent, "raft", { x: agent.x, y: agent.y }, "вяжет плот");
    return true;
  }
  return false;
}

export function actDeed(agent, world) {
  if (agent.state === "seek_water") return drink(agent, world);
  if (agent.state === "hunt") return hunt(agent, world);
  if (agent.state === "fish") return fish(agent, world);
  if (agent.state === "farm") return workField(agent, world);
  if (agent.state === "herd") return herd(agent, world);
  if (agent.state === "raft") return raft(agent, world);
  return false;
}

function drink(agent, world) {
  if (agent.target && agent.distanceTo(agent.target) < 0.75) {
    const gulp = sip(agent, world, agent.target.x, agent.target.y);
    if (gulp.fresh) {
      agent.energy = Math.min(100, agent.energy + 1);
      practice(agent, "water", 0.04);
      remember(agent, "water", agent.target.x, agent.target.y);
    }
    agent.activity = gulp.note;
    return true;
  }
  agent.pursue(agent.target, world);
  return true;
}

function hunt(agent, world) {
  const prey = agent.target;
  if (!prey || !prey.alive) return true;
  agent.pursue(prey, world);
  if (agent.distanceTo(prey) >= 0.7) return true;
  const skill = agent.skills.hunt;
  if (beastStrikes(agent, prey, skill)) return true;
  const hit = Math.random() < huntOdds(agent, skill, agent.traits.strength);
  agent.energy = Math.max(0, agent.energy - 6);
  if (!hit) {
    agent.activity = "зверь ушёл — запоминает место";
    remember(agent, "hunt", prey.x, prey.y);
    practice(agent, "hunt", 0.04);
    return true;
  }
  prey.alive = false;
  agent.basketKind = "meat";
  digest(agent, "meat", 1);
  stash(agent, prey.meat || meatOf(agent, agent.traits.strength));
  practice(agent, "hunt", 0.42);
  remember(agent, "hunt", prey.x, prey.y);
  agent.activity = skill >= 0.35 ? "добыл зверя и знает, как это делается" : "впервые добыл зверя";
  return true;
}

function fish(agent, world) {
  agent.pursue(agent.target, world);
  if (!agent.target || agent.distanceTo(agent.target) >= 0.75) return true;
  const hit = Math.random() < 0.18 + agent.skills.fish * 0.12;
  if (!hit) {
    practice(agent, "fish", 0.03);
    agent.activity = "ждёт рыбу";
    return true;
  }
  agent.basketKind = "fish";
  digest(agent, "fish", 1);
  stash(agent, 22);
  practice(agent, "fish", 0.26);
  remember(agent, "fish", agent.target.x, agent.target.y);
  agent.activity = "поймал рыбу";
  return true;
}

function herd(agent, world) {
  agent.pursue(agent.target, world);
  if (!agent.target || agent.distanceTo(agent.target) >= 1.1) return true;
  digest(agent, "milk", 0.6);
  practice(agent, "farm", 0.08);
  agent.tradeWait = 16;
  agent.activity = "взял еду у скота";
  return true;
}

function raft(agent, world) {
  agent.wood = Math.max(0, (agent.wood || 0) - 2);
  if (!world.rafts) world.rafts = [];
  const afloat = sail(world, agent.x, agent.y);
  if (afloat) world.rafts.push({ x: agent.x, y: agent.y, call: "плот", need: "дерево держится на воде", maker: agent.name, makerId: agent.id });
  practice(agent, "raft", 0.5);
  remember(agent, "water", agent.x, agent.y);
  agent.tradeWait = 40;
  agent.activity = afloat ? "связал плот" : "лёд не пускает плот";
  return true;
}
