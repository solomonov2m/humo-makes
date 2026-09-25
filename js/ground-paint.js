// Земля — мягкое поле биомов. Вблизи тот же цвет, но чаще семплированный.

import { paintPhoto } from "./land-photo.js";
import { bakeTone, rasterPatch, rasterSheet } from "./land-tone.js";

const SHEET = 3;
const groundCache = new WeakMap();

export function drawGround(ctx, world) {
  const scale = ctx.getTransform().a;
  const bake = toneOf(world);
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "low";
  if (scale < 36) {
    const sheet = sheetOf(bake);
    ctx.drawImage(sheet, 0, 0, world.cols, world.rows);
  } else {
    const box = viewBox(ctx, world);
    const patch = patchOf(bake, box, scale);
    const tw = box.x1 - box.x0 + 1;
    const th = box.y1 - box.y0 + 1;
    ctx.drawImage(patch, box.x0, box.y0, tw, th);
  }
  ctx.imageSmoothingEnabled = prev;
  paintPhoto(ctx, world, scale);
}

function toneOf(world) {
  const rev = world.chartRev || 0;
  const hit = groundCache.get(world);
  if (hit && hit.rev === rev) return hit;
  const bake = bakeTone(world);
  bake.rev = rev;
  bake.sheet = null;
  bake.patchKey = "";
  bake.patch = null;
  groundCache.set(world, bake);
  return bake;
}

function sheetOf(bake) {
  if (!bake.sheet) bake.sheet = rasterSheet(bake, SHEET);
  return bake.sheet;
}

function patchOf(bake, box, scale) {
  let sub = Math.min(24, Math.max(4, Math.round(scale / 6)));
  const tw = box.x1 - box.x0 + 1;
  const th = box.y1 - box.y0 + 1;
  while (sub > 4 && tw * sub * th * sub > 900000) sub -= 1;
  const key = `${sub}:${box.x0}:${box.y0}:${box.x1}:${box.y1}`;
  if (bake.patchKey !== key) {
    bake.patch = rasterPatch(bake, box.x0, box.y0, box.x1, box.y1, sub);
    bake.patchKey = key;
  }
  return bake.patch;
}

function viewBox(ctx, world) {
  const m = ctx.getTransform();
  const pad = 2;
  return {
    x0: Math.max(0, Math.floor(-m.e / m.a) - pad),
    y0: Math.max(0, Math.floor(-m.f / m.d) - pad),
    x1: Math.min(world.cols - 1, Math.ceil((ctx.canvas.width - m.e) / m.a) + pad),
    y1: Math.min(world.rows - 1, Math.ceil((ctx.canvas.height - m.f) / m.d) + pad),
  };
}
