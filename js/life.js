import { ADULT_DAYS, ADULT_YEARS, SKILL_META, YEAR_DAYS } from "./text.js";
import { practice } from "./skills.js";
import { elderWear, showGround } from "./folk.js";
import { nurse } from "./metabol.js";
import { livable } from "./housing.js";

const INFANT_YEARS = 2;
const CHILD_YEARS = 7;

export function lifeStage(agent) {
  const years = agent.age / YEAR_DAYS;
  if (years < INFANT_YEARS) return "infant";
  if (years < CHILD_YEARS) return "child";
  if (agent.age < ADULT_DAYS) return "youth";
  const lifeYears = agent.traits.lifespanDays / YEAR_DAYS;
  const elderAt = Math.max(ADULT_YEARS + 12, lifeYears * 0.72);
  if (years >= elderAt) return "elder";
  return "adult";
}

export function stageTitle(agent) {
  const female = agent.sex === "F";
  if (!agent.alive) return female ? "умерла" : "умер";
  const stage = lifeStage(agent);
  if (stage === "infant") return "младенец";
  if (stage === "child") return "ребёнок";
  if (stage === "youth") return female ? "девушка" : "юноша";
  if (stage === "elder") return female ? "пожилая" : "пожилой";
  return female ? "взрослая" : "взрослый";
}

export function paceOf(agent) {
  const stage = lifeStage(agent);
  if (stage === "infant") return 0.32;
  if (stage === "child") return 0.55;
  if (stage === "youth") return 0.82;
  if (stage === "elder") return 0.6;
  return 1;
}

export function canReproduce(agent) {
  if (lifeStage(agent) !== "adult") return false;
  const years = agent.age / YEAR_DAYS;
  const lifeYears = agent.traits.lifespanDays / YEAR_DAYS;
  const elderAt = Math.max(ADULT_YEARS + 12, lifeYears * 0.72);
  return years < Math.min(45, elderAt);
}

function guide(agent, neighbors, byId) {
  const parent = agent.livingParent(byId);
  if (parent) return parent;
  let best = null;
  let bestDist = 5;
  for (const other of neighbors) {
    if (!other.alive) continue;
    const stage = lifeStage(other);
    if (stage === "infant" || stage === "child") continue;
    const dist = agent.distanceTo(other);
    if (dist < bestDist) {
      bestDist = dist;
      best = other;
    }
  }
  return best;
}

function follow(agent, person, activity) {
  agent.state = "follow";
  agent.target = person;
  agent.activity = activity;
}

export function steerLife(agent, world, neighbors, byId) {
  const stage = lifeStage(agent);
  if (stage === "infant" || stage === "child") return stayWithKin(agent, neighbors, byId, stage);
  if (stage === "youth") return apprentice(agent, world, neighbors, byId);
  if (stage === "elder") return keepHearth(agent, neighbors);
  if (stage === "adult") return adultDuty(agent, world, neighbors);
  return false;
}

function stayWithKin(agent, neighbors, byId, stage) {
  const kin = guide(agent, neighbors, byId);
  if (!kin) return false;
  const close = stage === "infant" ? 0.85 : 1.45;
  if (agent.distanceTo(kin) > close) {
    follow(agent, kin, stage === "infant" ? `на руках у ${kin.name}` : `держится рядом с ${kin.name}`);
    return true;
  }
  agent.state = "follow";
  agent.target = kin;
  agent.activity = stage === "infant" ? `на руках у ${kin.name}` : "играет рядом с семьёй";
  return true;
}

function apprentice(agent, world, neighbors, byId) {
  const mentor = guide(agent, neighbors, byId);
  if (mentor && agent.distanceTo(mentor) > 2.6) {
    follow(agent, mentor, `учится, глядя на ${mentor.name}`);
    return true;
  }
  const food = world.nearestFood(agent.x, agent.y, agent.traits.vision * 0.75);
  if (food && agent.hunger > 32) {
    agent.state = "seek_food";
    agent.target = food;
    agent.activity = "учится добывать еду";
    return true;
  }
  return false;
}

function keepHearth(agent, neighbors) {
  if (agent.hunger >= 64) return false;
  if (!livable(agent.house)) return false;
  const pupil = neighbors.find((n) => {
    if (!n.alive) return false;
    const stage = lifeStage(n);
    return (stage === "youth" || stage === "child") && agent.distanceTo(n) < 3.2;
  });
  agent.state = "rest";
  agent.target = agent.house;
  agent.activity = pupil ? `учит ${pupil.name}` : "сидит у дома и хранит опыт";
  return true;
}

function adultDuty(agent, world, neighbors) {
  const child = neighbors.find((n) => {
    if (!n.alive || !n.parents || !n.parents.includes(agent.id)) return false;
    const stage = lifeStage(n);
    return (stage === "infant" || stage === "child") && agent.distanceTo(n) > 3.2;
  });
  if (child) {
    follow(agent, child, `присматривает за ${child.name}`);
    return true;
  }
  return false;
}

export function tendBody(agent, neighbors, byId) {
  if (lifeStage(agent) !== "infant") return;
  const kin = guide(agent, neighbors, byId);
  if (kin && kin.sex === "F" && agent.distanceTo(kin) < 1.35 && nurse(kin, agent)) return;
  agent.hunger = Math.min(100, agent.hunger + 0.45);
}

export function growPerson(agent, neighbors) {
  const growEnd = Math.max(ADULT_DAYS, agent.traits.lifespanDays * 0.22);
  if (agent.age <= growEnd) {
    agent.mind = 16 + (agent.mindCap - 16) * (agent.age / growEnd);
  } else if (lifeStage(agent) !== "elder") {
    const learn = 0.008 + (agent.skills.craft + agent.skills.places) * 0.0012;
    agent.mind = Math.min(agent.mindCap, agent.mind + learn);
  }
  elderWear(agent, lifeStage(agent));
  watchParent(agent, neighbors);
}

function watchParent(agent, neighbors) {
  const stage = lifeStage(agent);
  if (stage !== "child" && stage !== "youth") return;
  const parent = neighbors.find((n) => n.alive && agent.parents && agent.parents.includes(n.id) && n.drill);
  if (!parent || agent.distanceTo(parent) > 2.4) return;
  const rate = stage === "child" ? 0.05 : 0.09;
  practice(agent, parent.drill, rate);
  showGround(agent, parent);
  const elder = parent.sex === "M" ? "отца" : "матери";
  const deed = SKILL_META[parent.drill] ? SKILL_META[parent.drill].title.toLowerCase() : parent.drill;
  agent.activity = `учится у ${elder}: ${deed}`;
}
