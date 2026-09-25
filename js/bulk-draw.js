// Форма куска берётся из вещества: металл, кристалл, органика, руда, сыпучее.

import { stuff } from "./elements.js";
import { matterInk } from "./element-pixels.js";
import { element } from "./table.js";

export function asStuff(raw) {
  if (!raw) return null;
  if (raw.bits) return raw;
  return stuff(raw.id || raw) || null;
}

export function drawBulk(ctx, raw, x, y, w) {
  const piece = asStuff(raw);
  if (!piece || piece.state === "gas" || w <= 0) return;
  const ink = matterInk(piece);
  ctx.save();
  ctx.translate(x, y);
  if (piece.state === "liquid") pool(ctx, ink, w);
  else if (piece.kind === "metal" || lead(piece) === "metal") ingot(ctx, ink, w);
  else if (piece.kind === "ore") ore(ctx, piece, ink, w);
  else if (piece.id === "wood") logs(ctx, ink, w);
  else if (piece.kind === "organic") lump(ctx, ink, w);
  else if (piece.kind === "carbon" || lead(piece) === "flake") flakes(ctx, ink, w);
  else if (piece.kind === "salt" || lead(piece) === "crystal") crystals(ctx, ink, w);
  else if (piece.id === "sand") grains(ctx, ink, w);
  else if (piece.id === "clay" || piece.id === "soil" || piece.id === "ceramic") mound(ctx, ink, w);
  else block(ctx, ink, w);
  ctx.restore();
}

function lead(piece) {
  const bits = piece.bits || [];
  let best = bits[0];
  for (const bit of bits) if (!best || bit[1] > best[1]) best = bit;
  const item = best ? element(best[0]) : null;
  return item ? item.form : "crystal";
}

function pool(ctx, ink, w) {
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.55, w * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
}

function ingot(ctx, ink, w) {
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(-w * 0.45, w * 0.12);
  ctx.lineTo(-w * 0.28, -w * 0.16);
  ctx.lineTo(w * 0.28, -w * 0.16);
  ctx.lineTo(w * 0.45, w * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(-w * 0.18, -w * 0.1, w * 0.12, w * 0.05);
}

function ore(ctx, piece, ink, w) {
  block(ctx, ink, w);
  const fleck = piece.bits && piece.bits[0] ? element(piece.bits[0][0]) : null;
  ctx.fillStyle = fleck ? fleck.body : "#8d9298";
  ctx.fillRect(-w * 0.12, -w * 0.08, w * 0.1, w * 0.08);
  ctx.fillRect(w * 0.08, w * 0.02, w * 0.08, w * 0.06);
}

function logs(ctx, ink, w) {
  ctx.fillStyle = ink;
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(-w * 0.42, -w * 0.22 + i * w * 0.16, w * 0.84, w * 0.12);
  }
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.arc(w * 0.36, 0, w * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function lump(ctx, ink, w) {
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.38, w * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
}

function flakes(ctx, ink, w) {
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(-w * 0.4, w * 0.1);
  ctx.lineTo(-w * 0.05, -w * 0.28);
  ctx.lineTo(w * 0.36, w * 0.05);
  ctx.lineTo(w * 0.05, w * 0.22);
  ctx.closePath();
  ctx.fill();
}

function crystals(ctx, ink, w) {
  ctx.fillStyle = ink;
  for (const [dx, dy] of [[-0.18, 0.02], [0.08, -0.08], [0.16, 0.1]]) {
    const s = w * 0.16;
    ctx.fillRect(dx * w - s / 2, dy * w - s / 2, s, s);
  }
}

function grains(ctx, ink, w) {
  ctx.fillStyle = ink;
  for (let i = 0; i < 5; i++) {
    const a = i * 1.2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * w * 0.22, Math.sin(a) * w * 0.12, w * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
}

function mound(ctx, ink, w) {
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(-w * 0.46, w * 0.16);
  ctx.quadraticCurveTo(0, -w * 0.36, w * 0.46, w * 0.16);
  ctx.closePath();
  ctx.fill();
}

function block(ctx, ink, w) {
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, -w * 0.28);
  ctx.lineTo(w * 0.34, -w * 0.12);
  ctx.lineTo(w * 0.22, w * 0.22);
  ctx.lineTo(-w * 0.36, w * 0.14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, -w * 0.28);
  ctx.lineTo(w * 0.34, -w * 0.12);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
}
