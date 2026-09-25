// Конкурс целей одного тела. Сон и еда спорят числом, а не часами суток.

import { lifeStage, steerLife } from "./life.js";
import { housingPlan } from "./housing.js";
import { actMemory } from "./memory.js";
import { wantHaul } from "./folk.js";
import { weigh } from "./brain.js";
import { glance } from "./glance.js";
import { choiceName, openChoice } from "./choice-log.js";

const ACTS = ["drink", "eat", "hunt", "fish", "rest", "build", "mate", "wander", "sleep", "flee"];

export function choose(agent, world, neighbors, byId) {
  if (!agent.alive) return;
  const seen = glance(agent, world, neighbors, byId);
  const scored = scoreAll(agent, seen);
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

function scoreAll(agent, seen) {
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
    ["build", cold * 0.9 + (!agent.house || agent.house.progress < 1 ? 0.35 : 0) - feel.hunger * 0.3],
    ["mate", agent.isAdult && seen.mate && feel.hunger < 0.55 ? 0.35 : -1.2],
    ["wander", 0.08 + seen.novel * 0.55 + memory("wander") - feel.fatigue * 0.25],
    ["sleep", sleepScore(nerve, seen, feel, agent)],
    ["flee", (feel.fear + (seen.beast ? 0.7 : 0) + (agent.reek || 0)) * 1.5 - 0.15],
  ];
  return rows.map(([act, score]) => ({ act, score }));
}

function sleepScore(nerve, seen, feel, agent) {
  if (!seen.bed) return -3;
  if (agent.activity === "спит" && feel.fear < 0.45 && feel.thirst < 0.75 && feel.hunger < 0.55) return 1.1;
  const work = agent.state === "hunt" || agent.state === "build" ? 0.15 : 0;
  const pressure = (nerve.urge || nerve.pressure || 0) + feel.pain * 0.4 + work - (seen.bed.comfort || 0.2) * 0.35;
  let score = pressure * 1.15 - feel.hunger * 0.45 - feel.thirst * 0.55 - feel.fear * 1.3;
  if (feel.fear > 0.55 || feel.thirst > 0.82 || feel.hunger > 0.9) score -= 1.4;
  return score;
}

function bodyLock(agent, world, neighbors, byId) {
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
