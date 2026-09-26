import { recall } from "./skills.js";
import { clampWeight, layer, matrix, mixWeights, nudge } from "./synapses.js";
import { attend, blankMemory, noteEpisode, recallBias } from "./memory.js";
import { planAhead } from "./prefrontal.js";
import { seatMind } from "./organs.js";
import { feelInputs, pushFeelings } from "./aware.js";

export const ACTS = ["drink", "eat", "hunt", "fish", "rest", "build", "mate", "wander", "sleep", "flee", "mine", "trade", "sail"];
const HIDDEN = 6;
const IN = 16;

export function randomBrain() {
  return {
    w1: matrix(HIDDEN, IN, 0.35),
    w2: matrix(ACTS.length, HIDDEN, 0.35),
    gate: matrix(3, IN, 0.35),
    bind: matrix(3, ACTS.length, 0.35),
    ...blankMemory(),
    trace: null,
  };
}

export function mixBrain(a, b) {
  ready(a);
  ready(b);
  return {
    w1: mixWeights(a.w1, b.w1),
    w2: mixWeights(a.w2, b.w2),
    gate: mixWeights(a.gate, b.gate),
    bind: mixWeights(a.bind, b.bind),
    ...blankMemory(),
    trace: null,
  };
}

export function weigh(agent, world, neighbors, byId) {
  agent.studying = agent.isAdult && agent.mind >= 36 && agent.hunger < 62 && agent.thirst < 58;
  ready(agent.brain);
  seatMind(agent);
  const tissue = agent.body && agent.body.organs && agent.body.organs.brain;
  if (!tissue || tissue.synapses !== agent.brain || !tissue.links) return null;
  const input = sense(agent, world, neighbors, byId);
  const slot = attend(agent.brain, input);
  const hidden = layer(agent.brain.w1, input);
  const scores = layer(agent.brain.w2, hidden);
  recallBias(agent.brain, scores);
  const planned = !agent.aware || agent.aware.clarity >= 0.55 ? planAhead(agent, input) : "";
  const plannedAt = ACTS.indexOf(planned);
  if (plannedAt >= 0) scores[plannedAt] += 0.55 + agent.mind / 180;
  pushFeelings(agent, scores);
  if ((agent.feelings?.fear || 0) > 0.4) scores[ACTS.indexOf("flee")] += agent.feelings.fear * 0.6;
  return { scores, input, hidden, slot };
}

export function reflect(agent, reward) {
  const trace = agent.brain && agent.brain.trace;
  if (!trace || !agent.brain.gate) return 0;
  const rate = 0.12;
  const { w1, w2 } = agent.brain;
  const row = w2[trace.pick];
  if (!row) return 0;
  let moved = 0;
  for (let h = 0; h < row.length; h++) {
    const before = row[h];
    row[h] = clampWeight(row[h] + rate * reward * trace.hidden[h]);
    moved += Math.abs(row[h] - before);
    const grad = rate * reward * before * (1 - trace.hidden[h] * trace.hidden[h]);
    for (let i = 0; i < IN; i++) {
      const next = clampWeight(w1[h][i] + grad * trace.input[i]);
      moved += Math.abs(next - w1[h][i]);
      w1[h][i] = next;
    }
  }
  nudge(agent.brain.gate[trace.slot], trace.input.map((v) => v * reward), rate);
  const bound = agent.brain.bind[trace.slot];
  if (bound && trace.pick < bound.length) {
    const before = bound[trace.pick];
    bound[trace.pick] = clampWeight(before + rate * reward);
    moved += Math.abs(bound[trace.pick] - before);
  }
  noteEpisode(agent.brain, ACTS[trace.pick] || "wander", reward);
  return moved;
}

function ready(brain) {
  if (brain.wm && brain.w2 && brain.w2.length === ACTS.length) return;
  const prior = brain.wm ? {} : blankMemory();
  Object.assign(brain, prior, {
    gate: brain.gate && brain.gate[0] && brain.gate[0].length === IN ? brain.gate : matrix(3, IN, 0.35),
    bind: brain.bind && brain.bind[0] && brain.bind[0].length === ACTS.length ? brain.bind : matrix(3, ACTS.length, 0.35),
    w2: brain.w2 && brain.w2.length === ACTS.length ? brain.w2 : matrix(ACTS.length, HIDDEN, 0.35),
  });
}

function sense(agent, world, neighbors, byId) {
  const vision = agent.traits.vision;
  const food = world.nearestFood(agent.x, agent.y, vision);
  const water = nearest(world.drinks || [], agent.x, agent.y, vision);
  const prey = nearest((world.animals || []).filter((a) => a.alive), agent.x, agent.y, vision, true);
  const mate = agent.isAdult ? agent.findPartner(neighbors, byId) : null;
  const memory = recall(agent, "food") || recall(agent, "water");
  return [
    1,
    agent.hunger / 100,
    agent.thirst / 100,
    1 - agent.energy / 100,
    food ? 1 : 0,
    water ? 1 : 0,
    prey ? 1 : 0,
    mate ? 1 : 0,
    Math.min(1, (agent.wood || 0) / 8),
    roofEase(agent),
    Math.min(1, neighbors.length / 6),
    memory ? 1 : 0,
    ...feelInputs(agent),
  ];
}

function roofEase(agent) {
  const house = agent.house;
  if (house && house.progress >= 1) return house.kind === "shelter" ? 0.45 : 1;
  if (house) return house.progress * 0.4;
  return Math.min(0.35, (agent.exposure || 0) / 40);
}

function nearest(list, x, y, radius, alive) {
  let best = null;
  let bestDist = radius;
  for (const item of list) {
    if (alive && item.alive === false) continue;
    const dist = Math.hypot(item.x - x, item.y - y);
    if (dist >= bestDist) continue;
    bestDist = dist;
    best = item;
  }
  return best;
}
