import { TILE } from "./world.js";
import { knownAt } from "./chart.js";
import { appearance } from "./appearance.js";
import { CROPS } from "./farm.js";
import { BUSH_PX, personScale } from "./scale.js";
import { ADULT_M, METERS_PER_TILE } from "./measure.js";
import { drawDwelling, dwellingBox } from "./home-draw.js";
import { drawGround as paintGround } from "./ground-paint.js";
import { drawMarks } from "./land-mark.js";
import { drawScene } from "./scene-draw.js";
import { drawRoads } from "./road-draw.js";
import { drawAnimals } from "./animal.js";
import { drawDevices } from "./tool-draw.js";
import { drawFolkMarks } from "./folk-mark.js";
import { drawGround } from "./nature.js";
import { say } from "./tongue.js";
import { drawClose, personPx } from "./pose-draw.js";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFood(ctx, world) {
  for (const [key, spot] of world.food) {
    const [fx, fy] = key.split(",").map(Number);
    if (spot.amount < 1 || !knownAt(world, fx, fy)) continue;
    const cx = fx * TILE + TILE / 2;
    const cy = fy * TILE + TILE / 2;
    const fullness = spot.amount / spot.cap;
    ctx.fillStyle = "#2c6a34";
    ctx.beginPath();
    const r = BUSH_PX * (0.7 + fullness);
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    const berries = 2 + Math.round(fullness * 2);
    for (let i = 0; i < berries; i++) {
      const ang = i * 2.2 + 0.4;
      ctx.fillStyle = i % 2 ? "#e24b3a" : "#f0c14a";
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * r * 0.7, cy + Math.sin(ang) * r * 0.6, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawWood(ctx, world) {
  if (!world.wood) return;
  for (const [key, pile] of world.wood.entries()) {
    const [x, y] = key.split(",").map(Number);
    if (pile.amount < 0.6 || !knownAt(world, x, y)) continue;
    const px = x * TILE + TILE * 0.5;
    const py = y * TILE + TILE * 0.55;
    ctx.fillStyle = "#6b4a2c";
    ctx.beginPath();
    ctx.arc(px, py, TILE * 0.12, 0, Math.PI * 2);
    ctx.arc(px + TILE * 0.16, py - TILE * 0.06, TILE * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawWorld(ctx, world) {
  paintGround(ctx, world);
  drawMarks(ctx, world, "ground");
  drawRoads(ctx, world);
  drawMarks(ctx, world, "cover");
  drawScene(ctx, world);
  drawFood(ctx, world);
  drawWood(ctx, world);
  drawFields(ctx, world);
  drawGround(ctx, world);
  drawAnimals(ctx, world);
  for (const house of world.houses) drawDwelling(ctx, house);
}

function drawFields(ctx, world) {
  const tint = ["#c47a32", "#d6c15a", "#f0de8a"];
  for (const field of world.fields || []) {
    const crop = CROPS[field.crop] || CROPS[0];
    const grow = field.ripe ? 1 : Math.min(1, (field.grow || 0) / crop.days);
    const x = field.x * TILE;
    const y = field.y * TILE;
    ctx.fillStyle = "rgba(92, 64, 32, 0.4)";
    ctx.fillRect(x + 0.08, y + 0.08, TILE - 0.16, TILE - 0.16);
    ctx.fillStyle = tint[field.crop] || tint[0];
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(x + 0.15, y + 0.2 + i * 0.18, (TILE - 0.3) * Math.max(0.25, grow), 0.08);
    }
  }
}

function drawPerson(ctx, agent, selected, detailed, world) {
  const look = appearance(agent);
  const s = personScale(agent.isChild);
  const px = agent.x * TILE + TILE / 2;
  const py = agent.y * TILE + TILE / 2;
  if (detailed && agent.alive && personPx(ctx) >= 14) {
    drawClose(ctx, agent, look, world);
    if (selected) ring(ctx, px, py, s);
    return;
  }
  ctx.save();
  if (!agent.alive) ctx.globalAlpha = 0.7;

  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(px, py + 6 * s, 4.2 * s, 1.6 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  const lying = !agent.alive || (agent.state === "sleep" && agent.activity === "спит");
  ctx.fillStyle = look.tunic;
  ctx.beginPath();
  if (lying) ctx.ellipse(px, py + 2 * s, 6.2 * s, 2.4 * s, 0, 0, Math.PI * 2);
  else ctx.ellipse(px, py + 1.6 * s, 3.3 * s, 4.6 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = look.skin;
  ctx.beginPath();
  ctx.arc(lying ? px + 5.2 * s : px, lying ? py + 1.2 * s : py - 3.4 * s, 3.6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1.25 / ctx.getTransform().a;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.stroke();

  ctx.fillStyle = look.hair;
  ctx.beginPath();
  if (lying) ctx.arc(px + 5.2 * s, py + 0.4 * s, 3.6 * s, Math.PI * 1.15, Math.PI * 1.85);
  else ctx.arc(px, py - 4.3 * s, 3.6 * s, Math.PI, 0);
  ctx.fill();

  if (selected) ring(ctx, px, py, s);

  if (detailed && agent.alive && agent.state === "sleep") {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#1a2430";
    ctx.fillRect(px - 6 * s, py + 3 * s, 12 * s, 2.2 * s);
  }

  if (detailed && agent.alive && agent.state !== "sleep") {
    ctx.fillStyle = "#f4e7c8";
    if (agent.state === "build") ctx.fillRect(px + 4 * s, py - s, 5 * s, 1.4 * s);
    else if (agent.state === "seek_food") {
      ctx.fillStyle = "#e24b3a";
      ctx.beginPath();
      ctx.arc(px + 4 * s, py + s, 1.5 * s, 0, Math.PI * 2);
      ctx.fill();
    } else if (agent.state === "rest") {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#1a2430";
      ctx.fillRect(px - 5 * s, py + 4 * s, 10 * s, 2 * s);
    }
  }
  ctx.restore();
}

function drawTag(ctx, agent) {
  const m = ctx.getTransform();
  const sx = (agent.x * TILE + TILE / 2) * m.a + m.e;
  const sy = (agent.y * TILE + TILE / 2) * m.d + m.f - 18;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = "600 12px Outfit, sans-serif";
  const w = ctx.measureText(agent.name).width + 12;
  const x = sx - w / 2;
  const y = sy - 8;
  ctx.fillStyle = "rgba(14, 22, 30, 0.92)";
  roundRect(ctx, x, y, w, 16, 7);
  ctx.fill();
  ctx.fillStyle = "#f4f7f8";
  ctx.textBaseline = "middle";
  ctx.fillText(agent.name, x + 6, y + 8);
  ctx.restore();
}

export function drawFocus(ctx, agent) {
  if (!agent) return;
  const px = agent.x * TILE + TILE / 2;
  const py = agent.y * TILE + TILE / 2;
  ctx.save();
  if (agent.alive) {
    ctx.beginPath();
    ctx.arc(px, py, agent.traits.vision * TILE, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    const hair = 4 / ctx.getTransform().a;
    ctx.setLineDash([hair, hair * 1.2]);
    ctx.lineWidth = 1.25 / ctx.getTransform().a;
    ctx.stroke();
    const goal = agent.state === "wander" ? agent.wanderDest : agent.target;
    if (goal && goal.x != null) {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(goal.x * TILE + TILE / 2, goal.y * TILE + TILE / 2);
      ctx.strokeStyle = "rgba(255, 220, 140, 0.95)";
      ctx.setLineDash([hair * 0.8, hair]);
      ctx.lineWidth = 1.5 / ctx.getTransform().a;
      ctx.stroke();
    }
  }
  if (agent.house) {
    ctx.setLineDash([]);
    ctx.lineWidth = 1.5 / ctx.getTransform().a;
    ctx.strokeStyle = agent.house.progress >= 1 ? "#f7f4ee" : "#f0b15a";
    const box = dwellingBox(agent.house);
    const pad = 1.5 / ctx.getTransform().a;
    ctx.strokeRect(box.left - pad, box.top - pad, box.w + pad * 2, box.base - box.top + pad * 2);
  }
  ctx.restore();
}

function ring(ctx, px, py, s) {
  ctx.beginPath();
  ctx.arc(px, py, 9 * s, 0, Math.PI * 2);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2 / ctx.getTransform().a;
  ctx.stroke();
}

export function drawAgents(ctx, agents, selected, hovered, detail = "people", world) {
  drawFolkMarks(ctx, agents, selected);
  if (personPx(ctx) < 14) drawDevices(ctx, agents);
  const detailed = detail === "act" || detail === "talk";
  for (const agent of agents) {
    if (!agent.alive && agent !== selected && !(agent.body && agent.body.gas > 20)) continue;
    drawPerson(ctx, agent, agent === selected, detailed, world);
  }
  if (detail === "talk") return;
  if (detail === "map") return;
  if (hovered && hovered.alive && hovered !== selected) drawTag(ctx, hovered);
  if (selected && detail !== "act") drawTag(ctx, selected);
}

export function findAgentAt(agents, worldX, worldY, tolerance = 16) {
  let best = null;
  let bestDist = tolerance;
  for (const agent of agents) {
    if (!agent.alive) continue;
    const px = agent.x * TILE + TILE / 2;
    const py = agent.y * TILE + TILE / 2;
    const d = Math.hypot(px - worldX, py - worldY);
    if (d < bestDist) {
      bestDist = d;
      best = agent;
    }
  }
  return best;
}

export function findHouseAt(world, px, py, reach = 0.8) {
  let best = null;
  let bestD = reach;
  for (const house of world.houses) {
    const cx = house.x * TILE + TILE / 2;
    const cy = house.y * TILE + TILE / 2;
    const d = Math.hypot(cx - px, cy - py);
    if (d < bestD) {
      bestD = d;
      best = house;
    }
  }
  return best;
}

export function viewDetail(zoom, fit = 1) {
  const px = (ADULT_M / METERS_PER_TILE) * fit * zoom;
  if (px >= 8) return "talk";
  if (px >= 4) return "act";
  if (px >= 1.6) return "people";
  return "map";
}

export const ZOOM_LABEL = {
  map: "вся карта",
  people: "люди",
  act: "занятия",
  talk: "диалоги",
};

export function drawTalk(ctx, agents, selected, project, _now, dpr, width, height, focus, culture) {
  const living = agents.filter((a) => a.alive).sort((a, b) => a.id - b.id);
  const used = new Set();
  const bubbles = [];

  for (const a of living) {
    if (used.has(a.id)) continue;
    let best = null;
    let bestD = 1.8;
    for (const b of living) {
      if (b === a || used.has(b.id)) continue;
      const d = a.distanceTo(b);
      if (d < bestD) { bestD = d; best = b; }
    }
    if (!best) continue;
    used.add(a.id);
    used.add(best.id);
    bubbles.push({
      x: ((a.x + best.x) / 2) * TILE + TILE / 2,
      y: Math.min(a.y, best.y) * TILE + TILE / 2 - 16,
      lines: [say(a, culture), say(best, culture)],
      hot: a === selected || best === selected,
      pair: true,
    });
  }

  for (const a of living) {
    if (used.has(a.id)) continue;
    bubbles.push({
      x: a.x * TILE + TILE / 2,
      y: a.y * TILE + TILE / 2 - 16,
      lines: [say(a, culture)],
      hot: a === selected,
      pair: false,
    });
  }

  const visible = bubbles.filter((b) => {
    const p = project(b.x, b.y);
    return p.x > -60 && p.y > -40 && p.x < width + 60 && p.y < height + 40;
  });
  visible.sort((a, b) => {
    if (a.hot !== b.hot) return a.hot ? -1 : 1;
    if (a.pair !== b.pair) return a.pair ? -1 : 1;
    return Math.hypot(a.x - focus.x, a.y - focus.y) - Math.hypot(b.x - focus.x, b.y - focus.y);
  });

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const shown = [];
  for (const b of visible.slice(0, 4)) {
    const anchor = project(b.x, b.y);
    ctx.font = `${Math.round(13 * dpr)}px Georgia, serif`;
    const padX = 8 * dpr;
    const lineH = 16 * dpr;
    const w = Math.max(...b.lines.map((t) => ctx.measureText(t).width)) + padX * 2;
    const h = b.lines.length * lineH + 12 * dpr;
    let x = Math.max(w / 2 + 6, Math.min(width - w / 2 - 6, anchor.x));
    let top = anchor.y - 8 * dpr - h;
    for (const prev of shown) {
      if (Math.abs(prev.x - x) < (prev.w + w) / 2 && Math.abs(prev.top - top) < h) top = prev.top - h - 6 * dpr;
    }
    shown.push({ x, top, w });
    const left = x - w / 2;
    const fill = b.hot ? "#fff8ec" : "#f4ead7";
    ctx.fillStyle = fill;
    roundRect(ctx, left, top, w, h, 6 * dpr);
    ctx.fill();
    ctx.lineWidth = (b.hot ? 1.6 : 1) * dpr;
    ctx.strokeStyle = b.hot ? "#e07a3d" : "#6d5644";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 5 * dpr, top + h - 0.5);
    ctx.lineTo(x + 5 * dpr, top + h - 0.5);
    ctx.lineTo(anchor.x, anchor.y + 10 * dpr);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.fillStyle = "#2a2118";
    b.lines.forEach((t, i) => ctx.fillText(t, left + padX, top + 6 * dpr + lineH * i + lineH / 2));
  }
}

export function drawActivities(ctx, agents, selected, project, dpr, width, height) {
  ctx.font = `${Math.round(12 * dpr)}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const placed = [];
  for (const a of agents) {
    if (!a.alive) continue;
    const p = project(a.x * TILE + TILE / 2, a.y * TILE + TILE / 2 - 14);
    if (p.x < 0 || p.y < 0 || p.x > width || p.y > height) continue;
    const text = a.activity || "бродит";
    const y = p.y - 4 * dpr;
    if (placed.some((q) => Math.hypot(q.x - p.x, q.y - y) < 26 * dpr) && a !== selected) continue;
    placed.push({ x: p.x, y });
    ctx.lineWidth = 3 * dpr;
    ctx.strokeStyle = "rgba(12, 18, 16, 0.8)";
    ctx.strokeText(text, p.x, y);
    ctx.fillStyle = a === selected ? "#fff4d8" : "#f2e2c4";
    ctx.fillText(text, p.x, y);
  }
}
