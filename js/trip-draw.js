import { TILE } from "./world.js";

export function drawTrips(ctx, agents) {
  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255, 248, 230, 0.55)";
  ctx.setLineDash([4, 5]);
  for (const agent of agents) {
    if (!agent.alive || !agent.trip) continue;
    ctx.beginPath();
    ctx.moveTo(agent.trip.x * TILE + TILE / 2, agent.trip.y * TILE + TILE / 2);
    ctx.lineTo(agent.x * TILE + TILE / 2, agent.y * TILE + TILE / 2);
    ctx.stroke();
  }
  ctx.restore();
}
