// Точка жителя, пока его рост в метрах меньше трёх пикселей.

import { ADULT_M, METERS_PER_TILE } from "./measure.js";
import { TILE } from "./world.js";
import { tunicColor } from "./appearance.js";

export function drawFolkMarks(ctx, agents, selected) {
  const scale = ctx.getTransform().a;
  if ((ADULT_M / METERS_PER_TILE) * scale >= 3) return;
  const m = ctx.getTransform();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const agent of agents) {
    if (!agent.alive) continue;
    const x = (agent.x * TILE + TILE / 2) * m.a + m.e;
    const y = (agent.y * TILE + TILE / 2) * m.d + m.f;
    ctx.fillStyle = tunicColor(agent);
    ctx.beginPath();
    ctx.arc(x, y, agent === selected ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#f7f4ee";
    ctx.stroke();
  }
  ctx.restore();
}
