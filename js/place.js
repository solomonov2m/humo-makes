import { bedOf } from "./sleep.js";

function locus(agent, world) {
  if (agent.state === "sleep") return agent.bed || bedOf(agent, world);
  const spot = agent.target || agent.wanderDest;
  if (spot && Number.isFinite(spot.x) && Number.isFinite(spot.y)) return spot;
  return null;
}

export function seatAgents(sim) {
  const world = sim.world;
  for (const agent of sim.agents) {
    if (!agent.alive) continue;
    const spot = locus(agent, world);
    if (!spot) continue;
    const far = Math.hypot(spot.x - agent.x, spot.y - agent.y);
    if (far < 0.35) continue;
    agent.trip = { x: agent.x, y: agent.y };
    agent.x = spot.x;
    agent.y = spot.y;
    agent.route = null;
  }
}
