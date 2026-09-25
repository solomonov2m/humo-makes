// Вид из глаз: земля впереди и руки за текущим делом.

import { appearance } from "./appearance.js";
import { paintEyesGround } from "./eyes-land.js";

const SKY = {
  dawn: ["#f3c9a0", "#8eb4c9"],
  day: ["#9fd0ea", "#d7eef6"],
  dusk: ["#e39a62", "#6e4a78"],
  night: ["#1a2744", "#0e1828"],
};

const trail = new Map();
const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function forgetEyes() {
  trail.clear();
}

export function drawEyes(canvas, agent, world, now, phase) {
  fit(canvas);
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const pose = track(agent);
  const bob = calm ? 0 : pose.moving ? Math.abs(Math.sin(pose.step * 2)) * h * 0.02 : Math.sin(now / 700) * h * 0.004;
  sky(ctx, w, h, phase || "day");
  ctx.save();
  ctx.translate(0, bob);
  paintEyesGround(ctx, w, h, agent, world, pose, calm);
  ctx.restore();
  hands(ctx, w, h, appearance(agent), pose, now);
  if (pose.act === "sleep") veil(ctx, w, h);
  return pose.moving ? "шагает" : "стоит";
}

function fit(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(2, Math.round(rect.width * dpr));
  const h = Math.max(2, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function track(agent) {
  const prev = trail.get(agent.id) || { x: agent.x, y: agent.y, face: -Math.PI / 2, step: 0 };
  const dx = agent.x - prev.x;
  const dy = agent.y - prev.y;
  const dist = Math.hypot(dx, dy);
  const moving = dist > 0.0015;
  const pose = {
    face: moving ? Math.atan2(dy, dx) : prev.face,
    step: prev.step + (moving ? Math.min(0.45, dist * 3) : 0),
    moving,
    act: actOf(agent),
  };
  trail.set(agent.id, { x: agent.x, y: agent.y, face: pose.face, step: pose.step });
  return pose;
}

function actOf(agent) {
  const text = agent.activity || "";
  if (agent.state === "sleep" || text === "спит") return "sleep";
  if (text.includes("ест") || text.includes("корм")) return "eat";
  if (agent.state === "carry" || agent.state === "gather" || text.includes("нес") || text.includes("носит")) return "carry";
  if (agent.state === "build" || text.includes("стро")) return "build";
  return "walk";
}

function sky(ctx, w, h, phase) {
  const pair = SKY[phase] || SKY.day;
  const wash = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  wash.addColorStop(0, pair[0]);
  wash.addColorStop(1, pair[1]);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
}

function veil(ctx, w, h) {
  ctx.fillStyle = "rgba(8, 12, 24, 0.45)";
  ctx.fillRect(0, 0, w, h);
}

function hands(ctx, w, h, look, pose, now) {
  const swing = calm || pose.act === "sleep" ? 0 : pose.moving ? Math.sin(pose.step * 2) : Math.sin(now / 900) * 0.12;
  const scale = w / 420;
  if (pose.act === "eat") {
    palm(ctx, w * 0.34, h * 0.92, scale, look, 0.2);
    palm(ctx, w * 0.58, h * 0.62, scale, look, -0.8);
    bite(ctx, w * 0.58, h * 0.5, scale);
    return;
  }
  if (pose.act === "carry") {
    palm(ctx, w * 0.38, h * 0.78, scale, look, 0.5);
    palm(ctx, w * 0.62, h * 0.78, scale, look, -0.5);
    bundle(ctx, w * 0.5, h * 0.7, scale, look.tunic);
    return;
  }
  if (pose.act === "build") {
    palm(ctx, w * 0.32, h * 0.9, scale, look, 0.15);
    palm(ctx, w * 0.7, h * 0.58, scale, look, -1.1);
    tool(ctx, w * 0.74, h * 0.42, scale);
    return;
  }
  palm(ctx, w * 0.28, h * 0.96 + swing * 18 * scale, scale, look, 0.35 - swing);
  palm(ctx, w * 0.72, h * 0.96 - swing * 18 * scale, scale, look, -0.35 - swing);
}

function palm(ctx, x, y, scale, look, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.fillStyle = look.skin;
  for (let i = 0; i < 4; i++) round(ctx, (i - 1.5) * 8 * scale, -16 * scale, 3.2 * scale, 11 * scale);
  round(ctx, -14 * scale, 0, 3.4 * scale, 8 * scale, -0.7);
  ctx.beginPath();
  ctx.ellipse(0, 8 * scale, 16 * scale, 18 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = look.skinShadow;
  ctx.beginPath();
  ctx.ellipse(scale, 12 * scale, 9 * scale, 7 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function round(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}

function bite(ctx, x, y, scale) {
  ctx.fillStyle = "#c4513a";
  ctx.beginPath();
  ctx.arc(x, y, 7 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function bundle(ctx, x, y, scale, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 18 * scale, 12 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

function tool(ctx, x, y, scale) {
  ctx.strokeStyle = "#6b4a2a";
  ctx.lineWidth = 4 * scale;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y + 28 * scale);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.fillStyle = "#8d8f92";
  ctx.fillRect(x - 10 * scale, y - 4 * scale, 20 * scale, 8 * scale);
}
