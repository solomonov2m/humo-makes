import { DAY_SECONDS, phaseOf } from "./clock.js";
import { glideAgents } from "./glide.js";
import { seatAgents } from "./place.js";
import { closeNight, holdPhase, tendSleep } from "./sleep.js";
import { metabolize } from "./metabol.js";
import { senseFeelings } from "./feelings.js";
import { reflect } from "./brain.js";
import { sealChoice } from "./choice-log.js";

const BEATS = 8;
const BEAT = DAY_SECONDS / BEATS;

export function pumpDays(sim, dtSeconds) {
  const dt = Math.min(1, Math.max(dtSeconds, 0));
  const preset = sim.clock.preset;
  let left = dt * preset.gamePerReal + (sim.clock.bank || 0);
  let guard = 0;
  const roomFor = preset.watch ? 2 : 9;
  while (left > 0 && guard < roomFor) {
    const room = DAY_SECONDS - sim.clock.secondOfDay;
    const slice = Math.min(left, room);
    advance(sim, slice, preset.watch);
    left -= slice;
    const phase = phaseOf(sim.clock.secondOfDay / DAY_SECONDS);
    const changed = sim.phaseNow !== phase;
    holdPhase(sim, phase);
    if (!preset.watch && changed) seatAgents(sim);
    if (sim.clock.secondOfDay >= DAY_SECONDS - 1e-3) {
      sim.clock.secondOfDay = 0;
      closeNight(sim);
      for (const agent of sim.agents) agent.stepBudget = 0;
      sim.tick();
      if (!preset.watch) seatAgents(sim);
    }
    guard += 1;
  }
  sim.clock.bank = left;
}

function advance(sim, slice, watch) {
  let left = slice;
  while (left > 1e-6) {
    const phase = sim.clock.secondOfDay % BEAT;
    const into = phase < 1e-4 ? BEAT : BEAT - phase;
    const step = Math.min(left, into);
    const fraction = sim.clock.secondOfDay / DAY_SECONDS;
    if (watch) glideAgents(sim, step);
    else {
      for (const agent of sim.agents) tendSleep(agent, sim.world, step, fraction);
    }
    sim.clock.secondOfDay += step;
    left -= step;
    const onBeat = sim.clock.secondOfDay % BEAT < 1e-2;
    const beforeMidnight = sim.clock.secondOfDay < DAY_SECONDS - 1e-3;
    if (onBeat && beforeMidnight) liveBeat(sim, watch);
  }
}

function liveBeat(sim, watch) {
  const world = sim.world;
  const byId = new Map(sim.agents.map((agent) => [agent.id, agent]));
  const born = [];
  for (const agent of sim.agents) {
    if (!agent.alive) continue;
    metabolize(agent, world.day, 1 / BEATS, world);
    agent.dayShare = (agent.dayShare || 0) + 1 / BEATS;
    if (watch) continue;
    const neighbors = sim.neighborsOf(agent, agent.traits.vision);
    const ease0 = agent.feelings ? agent.feelings.ease : 0;
    agent.decide(world, neighbors, byId);
    agent.act(world, neighbors, (child) => born.push(child), byId);
    senseFeelings(agent, world);
    const expected = agent.choice ? agent.choice.expected : ease0;
    sealChoice(agent, reflect(agent, agent.feelings.ease - expected));
  }
  if (born.length) {
    sim.agents.push(...born);
    sim.births += born.length;
  }
}
