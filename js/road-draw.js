// Дорога рисуется по маске. На общем виде — полоса, вблизи — временный спрайт атласа.

import { TILE } from "./world.js";
import { atlasOf } from "./road-atlas.js";
import { roadLevelAt, roadMaskAt } from "./road-mask.js";

const ARMS = [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]];

export function drawRoads(ctx, world) {
  if (!world.wear) return;
  const box = viewBox(ctx, world);
  const scale = ctx.getTransform().a;
  if (scale >= 6) drawSprites(ctx, world, box);
  else drawBands(ctx, world, box);
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

function drawBands(ctx, world, box) {
  ctx.save();
  ctx.lineCap = "round";
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      const level = roadLevelAt(world, x, y);
      if (!level) continue;
      const mask = roadMaskAt(world, x, y);
      const cx = x * TILE + TILE / 2;
      const cy = y * TILE + TILE / 2;
      ctx.strokeStyle = level === 2 ? "rgba(92, 59, 36, 0.95)" : "rgba(166, 124, 82, 0.85)";
      ctx.lineWidth = level === 2 ? 5 : 3.2;
      ctx.beginPath();
      if (mask === 0) {
        ctx.moveTo(cx - 0.2, cy);
        ctx.lineTo(cx + 0.2, cy);
      }
      for (const [dx, dy, bit] of ARMS) {
        if ((mask & bit) === 0) continue;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + dx * TILE / 2, cy + dy * TILE / 2);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawSprites(ctx, world, box) {
  const atlas = atlasOf();
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      const level = roadLevelAt(world, x, y);
      if (!level) continue;
      const mask = roadMaskAt(world, x, y);
      const frame = atlas.manifest[(level - 1) * 16 + mask].frame;
      ctx.drawImage(atlas.canvas, frame.x, frame.y, frame.w, frame.h, x * TILE, y * TILE, TILE, TILE);
    }
  }
}
