// Сон — решение одного тела: устал, ритм свой, место мягкое. Город разом не гаснет.

import { RATES } from "./clock.js";
import { bedOf, tickNerve } from "./nerves.js";

const AWAKE_LIMIT = 72;

export { bedOf };

function killAwake(agent) {
  agent.alive = false;
  agent.causeOfDeath = "без сна";
  agent.activity = agent.sex === "F" ? "умерла без сна" : "умер без сна";
}

export function tendSleep(agent, _world, gameSeconds, dayFraction) {
  if (!agent.alive) return;
  tickNerve(agent, gameSeconds, dayFraction);
}

export function closeNight(sim) {
  for (const agent of sim.agents) {
    if (!agent.alive) continue;
    if ((agent.nerve && agent.nerve.awakeHours) >= AWAKE_LIMIT) killAwake(agent);
    else if (agent.slept) agent.energy = Math.min(100, agent.energy + RATES.sleepEnergy * 0.15);
    agent.slept = false;
  }
  sim.phaseNow = "dawn";
}

export function holdPhase(sim, phase) {
  sim.phaseNow = phase;
}

export function sleepGlide(agent, world) {
  if (agent.state !== "sleep") return false;
  if (agent.activity === "спит") return true;
  const bed = agent.bed || bedOf(agent, world);
  if (!bed) return false;
  agent.bed = bed;
  agent.pursue(bed, world);
  if (Math.hypot(agent.x - bed.x, agent.y - bed.y) < 1.15) {
    agent.activity = "спит";
    agent.target = null;
    agent.slept = true;
  }
  return true;
}

