import { TILE } from "./world.js";
import { personScale } from "./scale.js";
import { silhouette } from "./ideas.js";
import { speechOf } from "./call.js";
import { stuff } from "./elements.js";
import { matterInk, paintMatter } from "./element-pixels.js";

export function drawDevices(ctx, agents) {
  const reach = 22 / Math.max(ctx.getTransform().a || 1, 1e-6);
  for (const agent of agents) {
    if (!agent.alive) continue;
    const hand = place(agent, reach);
    if (agent.device) {
      ctx.save();
      ctx.translate(hand.toolX, hand.toolY);
      ctx.scale(hand.s, hand.s);
      paint(ctx, agent.device, 0, 0);
      ctx.restore();
    }
    if (!agent.pocket || !agent.pocket.bits) continue;
    ctx.save();
    ctx.translate(hand.pocketX, hand.pocketY);
    ctx.scale(hand.s, hand.s);
    paintMatter(ctx, agent.pocket, 0, 0);
    ctx.restore();
  }
}

function place(agent, reach) {
  const s = Math.max(personScale(agent.isChild), (7 * reach) / 22);
  const px = agent.x * TILE + TILE / 2;
  const py = agent.y * TILE + TILE / 2;
  return { s, toolX: px + 5 * s, toolY: py - 10 * s, pocketX: px - 9 * s, pocketY: py - 2 * s };
}

export function hitHeld(agents, px, py, reach) {
  let best = null;
  let bestD = reach;
  for (const agent of agents) {
    if (!agent.alive) continue;
    const hand = place(agent, reach);
    if (agent.device) {
      const speech = agent.device.call ? agent.device : speechOf(agent.device);
      const hx = hand.toolX + 3 * hand.s;
      const hy = hand.toolY + (agent.device.shaft || 4) * hand.s * 0.5;
      const d = Math.hypot(px - hx, py - hy);
      if (d < bestD) {
        bestD = d;
        best = heldCard(agent, speech.call || "край", speech.need, hx, hy, d, "tool");
      }
    }
    if (!agent.pocket || !agent.pocket.name) continue;
    const d = Math.hypot(px - hand.pocketX, py - hand.pocketY);
    if (d >= bestD) continue;
    bestD = d;
    best = heldCard(agent, agent.pocket.name, "нести в руках", hand.pocketX, hand.pocketY, d, "pocket");
  }
  return best;
}

function heldCard(agent, title, need, x, y, near, kind) {
  return { title, call: agent.name, need: need || "держать при себе", maker: agent.name, makerId: agent.id, x, y, near, kind };
}

export function paint(ctx, tool, x, y) {
  const edge = stuff(tool.edge);
  ctx.fillStyle = "#7a5230";
  ctx.fillRect(x + 3, y, 2, tool.shaft);
  ctx.fillStyle = matterInk(edge);
  let bx = x + 1;
  let by = y + tool.shaft - 1;
  if (tool.face >= 6) {
    bx = x;
    by = y + tool.shaft - 2;
    ctx.fillRect(bx, by, tool.face, 3);
  } else if (tool.face <= 2) {
    bx = x + 3;
    by = y + tool.shaft;
    ctx.fillRect(bx, by, 2, 4);
  } else ctx.fillRect(bx, by, tool.face, 2);
  if (edge) paintMatter(ctx, edge, bx, by);
}

export function deviceLine(agent) {
  if (!agent.device) return "Орудия нет — форму ещё не собрал.";
  const call = agent.device.call || silhouette(agent.device);
  const need = agent.device.need ? ` Нужно, чтобы ${agent.device.need}.` : "";
  return `Зовёт «${call}». ${silhouette(agent.device)}.${need}`;
}
