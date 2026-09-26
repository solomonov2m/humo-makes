// Плот везёт через воду то, чего на своём берегу нет. Курс держит прямо, вода пути не помнит.

import { revealChart } from "./chart.js";
import { takeSample } from "./matter.js";

const SAIL_MULT = 2.4;

export function idleRaft(world, x, y, vision) {
  let best = null;
  let bestD = vision;
  for (const raft of world.rafts || []) {
    if (raft.crew) continue;
    const d = Math.hypot(raft.x - x, raft.y - y);
    if (d < bestD) {
      bestD = d;
      best = raft;
    }
  }
  return best;
}

export function nextIsle(world) {
  const isles = world.farIsles || [];
  return isles.find((isle) => !isle.visited) || isles[0] || null;
}

export function canVoyage(world) {
  return !!(world.rafts && world.rafts.length && nextIsle(world));
}

export function voyagePlan(agent, world) {
  const raft = idleRaft(world, agent.x, agent.y, agent.traits.vision + 6);
  if (!raft) return null;
  return { state: "sail", target: raft, activity: "идёт к плоту" };
}

export function sailArrive(agent, world) {
  if (!agent.raft) {
    if (!agent.target || agent.distanceTo(agent.target) >= 0.8) return;
    const raft = agent.target;
    if (raft.crew) return;
    raft.crew = agent.id;
    agent.raft = raft;
    const isle = nextIsle(world);
    agent.raftGoal = isle ? { x: isle.x, y: isle.y, isle } : { x: world.camp.x, y: world.camp.y, home: true };
    agent.activity = "отчаливает";
    return;
  }
  const goal = agent.raftGoal;
  if (!goal) return;
  const dx = goal.x - agent.x;
  const dy = goal.y - agent.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 0.6) {
    const step = Math.min(dist, (agent.stepBudget || 0.1) * SAIL_MULT);
    agent.x += (dx / dist) * step;
    agent.y += (dy / dist) * step;
    agent.raft.x = agent.x;
    agent.raft.y = agent.y;
    agent.activity = goal.home ? "плывёт домой" : "плывёт к новой земле";
    return;
  }
  if (goal.isle) {
    goal.isle.visited = true;
    revealChart(world, Math.round(agent.x), Math.round(agent.y));
    if (!agent.pocket) takeSample(agent, world);
    agent.raftGoal = { x: world.camp.x, y: world.camp.y, home: true };
    agent.activity = "нашёл землю за проливом";
    return;
  }
  if (agent.pocket) {
    world.culture.metal = world.culture.metal || {};
    const id = agent.pocket.id;
    world.culture.metal[id] = (world.culture.metal[id] || 0) + (agent.pocket.grams || 0);
    agent.activity = `привёз ${agent.pocket.name}`;
    agent.pocket = null;
  }
  agent.raft.crew = null;
  agent.raft = null;
  agent.raftGoal = null;
}
