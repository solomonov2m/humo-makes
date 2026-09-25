// Мёртвое тело — мокрая органика без жара. Гниение даёт гниль, из гнили уходит едкий газ.

import { stuff } from "./elements.js";
import { admit } from "./chem.js";
import { spoil } from "./laws.js";

const BITE = 0.04;

export function layRot(agents, world) {
  const clouds = [];
  for (const agent of agents) {
    if (agent.alive || !agent.body) continue;
    spoilBody(agent);
    if (agent.body.gas > 20) clouds.push({ x: agent.x, y: agent.y, gas: agent.body.gas });
  }
  world.reek = clouds;
}

export function fleeRot(agent, world) {
  const gut = agent.body && agent.body.nerves ? agent.body.nerves.gut : 0.5;
  let worst = null;
  let load = 0;
  for (const cloud of world.reek || []) {
    const dist = Math.hypot(cloud.x - agent.x, cloud.y - agent.y);
    if (dist > 5) continue;
    const here = (cloud.gas / 1000) * gut / (1 + dist * dist);
    if (here > load) {
      load = here;
      worst = cloud;
    }
  }
  agent.reek = load;
  if (!worst || load < 0.08) return false;
  if (agent.thirst > 88 || agent.hunger > 94) return false;
  const dx = agent.x - worst.x;
  const dy = agent.y - worst.y;
  const dist = Math.hypot(dx, dy) || 1;
  agent.state = "wander";
  agent.target = null;
  agent.wanderDest = { x: agent.x + (dx / dist) * 3.5, y: agent.y + (dy / dist) * 3.5 };
  agent.activity = "отходит от вони";
  agent.energy = Math.max(0, agent.energy - load * 2);
  return true;
}

export function rotLine(agent) {
  const body = agent.body;
  const cause = agent.causeOfDeath || "умер";
  if (!body || body.rot == null) return cause;
  if (body.gone) return `${cause} · кости`;
  return `${cause} · гниёт, вонь ${Math.round(body.gas)} г`;
}

function spoilBody(agent) {
  const body = agent.body;
  if (body.soft == null) openCorpse(body);
  advancePile(body);
  if (body.soft <= 40 && body.gas < 30) body.gone = true;
}

export function advancePile(pile) {
  if (!pile.hot && pile.soft > 40 && pile.wet > 15) sour(pile);
  if (pile.rot > 25) vent(pile);
  pile.gas *= 0.88;
}

function openCorpse(body) {
  const store = body.store || {};
  const soft = (store.fat || body.mass * body.fat) + body.mass * body.protein + body.mass * body.carb;
  body.soft = soft * 1000;
  body.wet = (store.water || body.mass * body.water) * 1000;
  body.rot = 0;
  body.gas = 0;
}

function sour(body) {
  const bite = Math.min(body.soft, Math.max(50, body.soft * BITE));
  const wet = Math.min(body.wet, bite);
  const flesh = { ...stuff("protein"), grams: bite };
  const water = { ...stuff("water"), grams: wet };
  const ruled = spoil(flesh, wet > 0, false);
  if (!ruled || !ruled.ok) return;
  const verdict = admit([flesh, water], ruled.out, false);
  if (!verdict.ok) return;
  const made = Math.min(verdict.grams, bite + wet);
  body.soft -= bite;
  body.wet -= wet;
  body.rot += made;
  body.gas += Math.max(0, bite + wet - made);
}

function vent(body) {
  const slice = Math.min(body.rot, Math.max(20, body.rot * 0.1));
  const pile = { ...stuff("rot"), grams: slice };
  const verdict = admit([pile], "reek", false);
  if (!verdict.ok) return;
  const made = Math.min(verdict.grams, slice);
  body.rot -= made;
  body.gas += made;
}
