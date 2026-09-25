// Вблизи фигура показывает дело: сон, еда, ноша, стройка, молоток, огонь.

import { TILE } from "./world.js";
import { MAN_PX, personScale } from "./scale.js";
import { cellHeat } from "./phys.js";
import { holds } from "./notions.js";
import { drawBulk } from "./bulk-draw.js";
import { stuff } from "./elements.js";
import { matterInk } from "./element-pixels.js";

export function personPx(ctx) {
  return MAN_PX * Math.abs(ctx.getTransform().a || 1);
}

export function drawClose(ctx, agent, look, world) {
  const s = personScale(agent.isChild);
  const x = agent.x * TILE + TILE / 2;
  const y = agent.y * TILE + TILE / 2;
  const act = readAct(agent);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 2.6 / Math.max(ctx.getTransform().a, 1e-6);
  if (act === "sleep") lay(ctx, x, y, s, look);
  else stand(ctx, x, y, s, look, act, agent);
  if (burning(agent, world)) flame(ctx, x + (act === "sleep" ? 0 : 9 * s), y + 3 * s, s);
  ctx.restore();
}

function readAct(agent) {
  const t = agent.activity || "";
  if (agent.state === "sleep" || t === "спит") return "sleep";
  if (t === "ест" || t.includes("ест") || t.includes("корм")) return "eat";
  if (agent.state === "carry" || agent.state === "gather" || t.includes("нес") || t.includes("носит") || t.includes("собер")) return "carry";
  if (agent.state === "build" || t.includes("стро")) return "build";
  return "stand";
}

function burning(agent, world) {
  const pocket = agent.pocket && agent.pocket.id;
  if (pocket === "charcoal") return true;
  if (holds(agent, "Огонь") && (pocket === "wood" || agent.activity === "ест")) return true;
  if (!world) return false;
  return cellHeat(world, agent.x, agent.y) > 28;
}

function stand(ctx, x, y, s, look, act, agent) {
  const skin = look.skin;
  const up = act === "build" || act === "eat";
  limb(ctx, skin, x, y + 2 * s, x - 2.2 * s, y + 8 * s);
  limb(ctx, skin, x, y + 2 * s, x + 2.2 * s, y + 8 * s);
  ctx.fillStyle = look.tunic;
  ctx.beginPath();
  ctx.ellipse(x, y + 0.4 * s, 3.1 * s, 4.2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  head(ctx, x, y - 5 * s, s, look, false);
  if (act === "eat") {
    limb(ctx, skin, x + 1.4 * s, y - 1 * s, x + 1.2 * s, y - 4.2 * s);
    drawBulk(ctx, agent.pocket || "carb", x + 1.4 * s, y - 5 * s, 2.6 * s);
    limb(ctx, skin, x - 1.4 * s, y - 1 * s, x - 4 * s, y + 1.5 * s);
  } else if (act === "carry") {
    limb(ctx, skin, x - 1.2 * s, y - 1 * s, x - 3 * s, y + 1.2 * s);
    limb(ctx, skin, x + 1.2 * s, y - 1 * s, x + 3 * s, y + 1.2 * s);
    load(ctx, x, y + 1.4 * s, s, agent);
  } else if (act === "build") {
    limb(ctx, skin, x - 1.2 * s, y - 1 * s, x - 4 * s, y + 2 * s);
    limb(ctx, skin, x + 1.2 * s, y - 1.2 * s, x + 3 * s, y - 6 * s);
    hammer(ctx, x + 3 * s, y - 6 * s, s, true, agent);
  } else {
    limb(ctx, skin, x - 1.4 * s, y - 1 * s, x - 4 * s, y + 2 * s);
    limb(ctx, skin, x + 1.4 * s, y - 1 * s, x + 4 * s, y + 1 * s);
    if (agent.device) hammer(ctx, x + 4 * s, y + 1 * s, s, false, agent);
    else if (agent.pocket) drawBulk(ctx, agent.pocket, x + 5 * s, y + 1 * s, 3.2 * s);
  }
  if (!up && agent.device && act !== "stand") hammer(ctx, x + 4 * s, y, s, false, agent);
}

function lay(ctx, x, y, s, look) {
  ctx.fillStyle = "#3a2a1c";
  ctx.beginPath();
  ctx.ellipse(x, y + 2.2 * s, 8 * s, 2.4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  limb(ctx, look.skin, x - 2 * s, y + 1.2 * s, x + 5 * s, y + 1.2 * s);
  ctx.fillStyle = look.tunic;
  ctx.beginPath();
  ctx.ellipse(x - 1 * s, y + 1 * s, 5.5 * s, 2.2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  head(ctx, x + 5.5 * s, y + 0.2 * s, s, look, true);
}

function head(ctx, x, y, s, look, shut) {
  ctx.fillStyle = look.skin;
  ctx.beginPath();
  ctx.arc(x, y, 2.5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = look.hair;
  ctx.beginPath();
  ctx.arc(x, y - 0.6 * s, 2.5 * s, Math.PI, 0);
  ctx.fill();
  if (shut) {
    ctx.strokeStyle = "#1a120e";
    ctx.lineWidth = 1.4 / Math.max(ctx.getTransform().a, 1e-6);
    ctx.beginPath();
    ctx.moveTo(x - 1.1 * s, y);
    ctx.lineTo(x - 0.2 * s, y + 0.3 * s);
    ctx.moveTo(x + 0.3 * s, y);
    ctx.lineTo(x + 1.2 * s, y + 0.3 * s);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = "#1a120e";
  ctx.beginPath();
  ctx.arc(x - 0.8 * s, y, 0.35 * s, 0, Math.PI * 2);
  ctx.arc(x + 0.8 * s, y, 0.35 * s, 0, Math.PI * 2);
  ctx.fill();
}

function limb(ctx, color, x0, y0, x1, y1) {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function load(ctx, x, y, s, agent) {
  const id = agent.pocket ? agent.pocket.id : (agent.state === "gather" ? "wood" : "carb");
  drawBulk(ctx, agent.pocket || id, x, y, 4.8 * s);
}

function hammer(ctx, x, y, s, up, agent) {
  const hx = up ? x + 1.5 * s : x + 5 * s;
  const hy = up ? y - 5 * s : y - 3 * s;
  const heft = stuff(agent.device && agent.device.heft) || stuff("wood");
  const edge = stuff(agent.device && agent.device.edge) || stuff("stone");
  ctx.strokeStyle = matterInk(heft);
  ctx.lineWidth = 2.2 / Math.max(ctx.getTransform().a, 1e-6);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  drawBulk(ctx, edge, hx, hy, 3.4 * s);
}

function flame(ctx, x, y, s) {
  ctx.fillStyle = "#f0c14a";
  ctx.beginPath();
  ctx.moveTo(x, y + 3 * s);
  ctx.quadraticCurveTo(x - 3 * s, y, x, y - 5 * s);
  ctx.quadraticCurveTo(x + 3 * s, y, x, y + 3 * s);
  ctx.fill();
  ctx.fillStyle = "#e24b3a";
  ctx.beginPath();
  ctx.moveTo(x, y + 2 * s);
  ctx.quadraticCurveTo(x - 1.4 * s, y, x, y - 2.4 * s);
  ctx.quadraticCurveTo(x + 1.4 * s, y, x, y + 2 * s);
  ctx.fill();
}
