import { tilesFor } from "./measure.js";
import { DAY_SECONDS } from "./clock.js";
import { sleepGlide, tendSleep } from "./sleep.js";
import { stirred } from "./nerves.js";
import { layCourse, takeArmful } from "./housing.js";
import { courtMeet } from "./court.js";
import { actDeed } from "./deeds.js";
import { mindWorks } from "./ideas.js";

export function glideAgents(sim, gameSeconds) {
  if (gameSeconds <= 0) return;
  const world = sim.world;
  const dayFraction = sim.clock.secondOfDay / DAY_SECONDS;
  for (const agent of sim.agents) {
    if (!agent.alive) continue;
    agent.trip = null;
    tendSleep(agent, world, gameSeconds, dayFraction);
    heed(sim, agent, gameSeconds);
    agent.stepBudget = tilesFor(agent, world, gameSeconds);
    if (!sleepGlide(agent, world)) {
      if (!agent.target || agent.state === "wander") agent.wander(world, gameSeconds, dayFraction);
      else agent.pursue(agent.target, world);
    }
    agent.stepBudget = 0;
    const spot = agent.target || agent.wanderDest;
    const arrived = !spot || agent.distanceTo(spot) < 1.2;
    if (agent.studying && arrived && agent.state !== "sleep") mindWorks(agent, world, gameSeconds);
    if (agent.state === "hunt" || agent.state === "fish") actDeed(agent, world);
    if (agent.state === "gather" && agent.target && agent.distanceTo(agent.target) < 0.8) takeArmful(agent, world);
    if (agent.state === "build" && agent.house && agent.distanceTo(agent.house) < 0.95) layCourse(agent);
  }
  courtMeet(sim);
}

function heed(sim, agent, gameSeconds) {
  const feel = agent.feelings || {};
  const spot = agent.target || agent.wanderDest;
  const arrived = !spot || agent.distanceTo(spot) < 1.2;
  const fear = feel.fear || 0;
  const mark = (feel.hunger || 0) + (feel.thirst || 0) + fear;
  const shifted = agent.feelMark != null && Math.abs(mark - agent.feelMark) > 0.18;
  const asleep = agent.activity === "спит" && !stirred(agent) && fear < 0.45 && (feel.thirst || 0) < 0.8;
  agent.heedIn = (agent.heedIn || 0) + gameSeconds;
  if (asleep || (!arrived && !shifted && fear < 0.5 && agent.heedIn < 90)) return;
  agent.heedIn = 0;
  agent.feelMark = mark;
  const byId = sim.byId || new Map(sim.agents.map((other) => [other.id, other]));
  const neighbors = [];
  for (const other of sim.agents) {
    if (other !== agent && other.alive && agent.distanceTo(other) <= agent.traits.vision) neighbors.push(other);
  }
  agent.decide(sim.world, neighbors, byId);
}
