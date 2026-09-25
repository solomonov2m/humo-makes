// Префронтальная кора держит цель и пробует короткий ход вперёд, прежде чем тело двинется.

import { actMemory } from "./memory.js";

const ACTS = ["drink", "eat", "hunt", "fish", "rest", "build", "mate", "wander", "sleep"];
const NAME = {
  drink: "пить",
  eat: "есть",
  hunt: "охота",
  fish: "рыба",
  rest: "отдых",
  build: "жильё",
  mate: "пара",
  wander: "ход",
  sleep: "сон",
};

export function planAhead(agent, input) {
  const brain = agent.brain;
  const depth = agent.mind >= 62 ? 2 : agent.mind >= 36 ? 1 : 0;
  const urgent = input[1] > 0.88 || input[2] > 0.88;
  if (brain.plan && brain.plan.left > 0 && !urgent) {
    brain.plan.left -= 1;
    return brain.plan.act;
  }
  if (depth < 1) {
    brain.plan = null;
    return "";
  }
  let best = "";
  let bestScore = -Infinity;
  for (const act of ACTS) {
    const first = step(input, act);
    let score = first.score + actMemory(brain, act) * 0.45;
    if (depth > 1) {
      let follow = -Infinity;
      for (const nextAct of ACTS) follow = Math.max(follow, step(first.next, nextAct).score);
      score += follow * 0.65;
    }
    if (score > bestScore) {
      bestScore = score;
      best = act;
    }
  }
  if (bestScore < 0.08) {
    brain.plan = null;
    return "";
  }
  brain.plan = { act: best, left: depth + 1 };
  return best;
}

export function planLine(agent) {
  const plan = agent.brain && agent.brain.plan;
  if (!plan || !plan.act) return "Плана нет: поступок берётся из текущего порыва.";
  const depth = agent.mind >= 62 ? "на два шага" : "на один шаг";
  return `Держит цель «${NAME[plan.act] || plan.act}», смотрит ${depth}.`;
}

function step(input, act) {
  const next = input.slice();
  const open = {
    drink: next[5] > 0 || next[11] > 0,
    eat: next[4] > 0 || next[11] > 0,
    hunt: next[6] > 0,
    fish: next[5] > 0,
    rest: next[9] > 0.3,
    build: next[8] > 0 || next[9] > 0,
    mate: next[7] > 0,
    wander: true,
    sleep: next[14] > 0.35,
  };
  if (!open[act]) return { next, score: -0.45 };
  if (act === "drink") { const score = next[2]; next[2] *= 0.3; return { next, score }; }
  if (act === "eat") { const score = next[1]; next[1] *= 0.4; return { next, score }; }
  if (act === "hunt" || act === "fish") { const score = next[1] * 0.7; next[1] *= 0.55; return { next, score }; }
  if (act === "rest") { const score = next[3] * 0.5; next[3] *= 0.45; return { next, score }; }
  if (act === "sleep") { const score = next[14]; next[14] *= 0.4; return { next, score }; }
  if (act === "build") { const score = (1 - next[9]) * 0.4; next[9] = Math.min(1, next[9] + 0.35); return { next, score }; }
  if (act === "mate") return { next, score: 0.2 };
  return { next, score: 0.05 };
}
