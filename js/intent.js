// Конкурс целей одного тела. Сон и еда спорят числом, а не часами суток.

import { lifeStage, steerLife } from "./life.js";
import { housingPlan } from "./housing.js";
import { minePlan } from "./mine.js";
import { canVoyage, voyagePlan } from "./voyage.js";
import { planTrade } from "./deeds.js";
import { holds } from "./notions.js";
import { actMemory } from "./memory.js";
import { wantHaul } from "./folk.js";
import { weigh } from "./brain.js";
import { glance } from "./glance.js";
import { choiceName, openChoice } from "./choice-log.js";

const ACTS = ["drink", "eat", "hunt", "fish", "rest", "build", "mate", "wander", "sleep", "flee", "mine", "trade", "sail"];

export function choose(agent, world, neighbors, byId) {
  if (!agent.alive) return;
  const seen = glance(agent, world, neighbors, byId);
  const scored = scoreAll(agent, seen, world);
  const neural = weigh(agent, world, neighbors, byId);
  if (neural) {
    neural.scores.forEach((value, index) => {
      const row = scored.find((item) => item.act === ACTS[index]);
      if (row && row.score > -2) row.score += value * 0.45;
    });
  }
  const lock = bodyLock(agent, world, neighbors, byId);
  scored.sort((a, b) => b.score - a.score);
  const pick = lock || scored[0];
  const expected = (agent.feelings ? agent.feelings.ease : 0) + Math.max(0, pick.score) * 0.15;
  if (!lock || !lock.kept) enact(agent, pick.act, seen, world, byId);
  if (neural) {
    const pickIndex = ACTS.indexOf(pick.act);
    agent.brain.trace = {
      input: neural.input,
      hidden: neural.hidden,
      pick: pickIndex < 0 ? ACTS.indexOf("wander") : pickIndex,
      slot: neural.slot,
      expected,
    };
  }
  openChoice(agent, {
    seen: seen.line,
    body: `голод ${Math.round(agent.hunger)}, жажда ${Math.round(agent.thirst)}, сон ${agent.nerve ? Math.round(agent.nerve.pressure * 100) : 0}`,
    options: scored.map((row) => ({ act: row.act, score: row.score })),
    chosen: pick.act,
    why: lock ? lock.why : `польза ${pick.score.toFixed(2)}`,
    expected,
  });
}

function scoreAll(agent, seen, world) {
  const feel = agent.feelings || {};
  const nerve = agent.nerve || { pressure: 0, urge: 0 };
  const memory = (act) => (agent.brain ? actMemory(agent.brain, act) : 0);
  const full = stomachFull(agent);
  const cold = feel.cold || 0;
  const rows = [
    ["drink", feel.thirst * 1.4 + (seen.water ? 0.35 : -0.8) + memory("drink") - (100 - agent.energy) / 500],
    ["eat", full ? -3 : feel.hunger * 1.25 + (seen.food ? 0.4 : -0.7) + memory("eat")],
    ["hunt", full ? -3 : feel.hunger * 0.7 + (seen.prey ? 0.45 : -1) - feel.fear * 0.8],
    ["fish", full ? -3 : feel.hunger * 0.55 + (seen.water ? 0.2 : -1)],
    ["rest", feel.fatigue * 0.7 + feel.pain * 0.4 - feel.fear],
    ["build", shelterScore(agent, feel, cold)],
    ["mate", mateScore(agent, seen, feel)],
    ["wander", 0.08 + seen.novel * 0.55 + memory("wander") - feel.fatigue * 0.25],
    ["sleep", sleepScore(nerve, seen, feel, agent)],
    ["flee", (feel.fear + (seen.beast ? 0.7 : 0) + (agent.reek || 0)) * 1.5 - 0.15],
    ["mine", mineScore(agent, seen, feel)],
    ["trade", tradeScore(agent, feel)],
    ["sail", sailScore(agent, feel, world)],
  ];
  return rows.map(([act, score]) => ({ act, score }));
}

function tradeScore(agent, feel) {
  if (!agent.isAdult || (agent.tradeWait || 0) > 0) return -1;
  if (feel.hunger > 0.55 || feel.thirst > 0.48) return -1;
  const canRaft = (agent.wood || 0) >= 2 && agent.skills.water >= 0.35 && agent.skills.craft >= 0.35;
  const canHerd = holds(agent, "Скот") && agent.house;
  const canFarm = (agent.skills.farm || 0) > 0.1 && agent.house;
  if (!canRaft && !canHerd && !canFarm) return -1;
  return 0.3;
}

function sailScore(agent, feel, world) {
  if (!agent.isAdult || feel.hunger > 0.65 || feel.thirst > 0.6 || feel.fear > 0.3) return -1;
  if (agent.raft) return 1.2;
  if ((agent.skills.raft || 0) < 0.4 || !canVoyage(world)) return -1;
  return 0.4;
}

function mineScore(agent, seen, feel) {
  if (!agent.isAdult) return -1;
  if (feel.hunger > 0.72 || feel.thirst > 0.72 || feel.fear > 0.3) return -1;
  if (isCarryingOre(agent)) return 1.1;
  if (!holds(agent, "Камень")) return -1;
  if (!seen.ore) return -1;
  const curious = holds(agent, "Огонь") ? 0.5 : 0.2;
  return 0.5 + curious - feel.hunger * 0.4;
}

function isCarryingOre(agent) {
  const id = agent.pocket && agent.pocket.id;
  return id === "ore" || id === "copper" || id === "tinore" || id === "iron" || id === "cu" || id === "tin" || id === "bronze";
}

function shelterScore(agent, feel, cold) {
  if (!agent.isAdult) return -1;
  const cover = agent.house ? agent.house.progress || 0 : 0;
  if (cover >= 1) return -0.3;
  const exposed = Math.min(1, (agent.exposure || 0) / 20);
  let score = 0.96 + exposed * 0.65 + cold * 0.6;
  if (agent.pocket && agent.pocket.grams > 0) score += 0.4;
  score -= feel.hunger * 0.55 + feel.thirst * 0.45 + feel.fear * 0.8;
  if (agent.nerve && agent.nerve.pressure > 0.72) score -= 0.7;
  return score;
}

function mateScore(agent, seen, feel) {
  const calm = agent.isAdult && seen.mate && feel.hunger < 0.55 && feel.thirst < 0.55;
  if (!calm || (agent.nerve && agent.nerve.pressure > 0.62)) return -1.2;
  return 0.42 + (agent.traits.fertility || 0.4) * 0.85;
}

function sleepScore(nerve, seen, feel, agent) {
  if (!seen.bed) return -3;
  const debt = nerve.pressure || 0;
  const awake = Math.max(0, (nerve.awakeHours || 0) - 14);
  if (agent.activity === "спит" && debt > 0.28 && feel.fear < 0.45 && feel.thirst < 0.75 && feel.hunger < 0.55) return 1.15;
  const night = Math.max(0, (nerve.urge || 0) - debt);
  const comfort = (seen.bed.comfort || 0.12) * 0.2;
  let score = debt * 1.15 + night * 0.55 + comfort + awake * 0.075;
  score -= feel.hunger * 0.45 + feel.thirst * 0.55 + feel.fear * 1.3;
  if (feel.fear > 0.55 || feel.thirst > 0.82) score -= 1.4;
  if (feel.hunger > 0.9 && debt < 0.85) score -= 1.4;
  return score;
}

function bodyLock(agent, world, neighbors, byId) {
  if ((agent.nerve?.pressure || 0) >= 0.82) return null;
  const stage = lifeStage(agent);
  if ((stage === "infant" || stage === "child") && steerLife(agent, world, neighbors, byId)) {
    return { act: "wander", why: "тело ребёнка ведёт", score: 5, kept: true };
  }
  if (wantHaul(agent)) return { act: "carry", why: "ноша уже в руках", score: 4 };
  if (agent.nursing > 0 && agent.house && agent.hunger < 70) return { act: "nurse", why: "кормит", score: 4 };
  if (agent.belly && agent.hunger < 68 && agent.house) return { act: "rest", why: "носит ребёнка", score: 4 };
  return null;
}

function enact(agent, act, seen, world, byId) {
  if (act === "drink" && seen.water) return go(agent, "seek_water", seen.water, "идёт пить");
  if (act === "eat" && seen.food) {
    const key = seen.food.key || `${Math.round(seen.food.x)},${Math.round(seen.food.y)}`;
    return go(agent, "seek_food", { x: seen.food.x, y: seen.food.y, key }, "идёт к еде");
  }
  if (act === "hunt" && seen.prey) return go(agent, "hunt", seen.prey, "выслеживает");
  if (act === "fish" && seen.water) return go(agent, "fish", seen.water, "рыбачит");
  if (act === "rest" && agent.house) return go(agent, "rest", agent.house, "идёт отдохнуть");
  if (act === "build") {
    const plan = housingPlan(agent, world, byId);
    if (plan && plan.target) {
      agent.state = plan.state;
      agent.target = plan.target;
      agent.activity = plan.activity;
      return;
    }
  }
  if (act === "mate" && seen.mate) return go(agent, "seek_mate", seen.mate, `идёт к ${seen.mate.name}`);
  if (act === "sleep" && seen.bed) return lie(agent, seen.bed);
  if (act === "flee" && seen.beast) return runOff(agent, seen.beast);
  if (act === "carry" && agent.house) return go(agent, "carry", agent.house, "несёт добычу домой");
  if (act === "mine") {
    const plan = minePlan(agent, world);
    if (plan && plan.target) return go(agent, plan.state, plan.target, plan.activity);
  }
  if (act === "trade" && planTrade(agent, world)) return;
  if (act === "sail") {
    const plan = voyagePlan(agent, world);
    if (plan && plan.target) return go(agent, plan.state, plan.target, plan.activity);
  }
  if (act === "nurse" && agent.house) return go(agent, "rest", agent.house, "кормит младенца");
  wakeIfAsleep(agent);
  agent.state = "wander";
  agent.target = null;
  agent.activity = `выбирает: ${choiceName(act)}`;
}

function lie(agent, bed) {
  agent.bed = bed;
  agent.state = "sleep";
  agent.target = bed;
  if (Math.hypot(agent.x - bed.x, agent.y - bed.y) < 1.15) {
    agent.activity = "спит";
    agent.target = null;
    agent.slept = true;
    return;
  }
  agent.activity = "идёт спать";
}

function runOff(agent, beast) {
  const dx = agent.x - beast.x;
  const dy = agent.y - beast.y;
  const dist = Math.hypot(dx, dy) || 1;
  wakeIfAsleep(agent);
  agent.state = "wander";
  agent.target = null;
  agent.wanderDest = { x: agent.x + (dx / dist) * 4, y: agent.y + (dy / dist) * 4 };
  agent.activity = "бежит от хищника";
}

function wakeIfAsleep(agent) {
  if (agent.state !== "sleep" && agent.activity !== "спит") return;
  agent.bed = null;
  if (agent.activity === "спит") agent.activity = "проснулся";
}

function go(agent, state, target, activity) {
  wakeIfAsleep(agent);
  agent.state = state;
  agent.target = target;
  agent.activity = activity;
}

function stomachFull(agent) {
  const stomach = agent.body && agent.body.organs && agent.body.organs.stomach;
  if (!stomach || !stomach.capacity) return false;
  return stomach.load >= stomach.capacity * 0.9;
}
