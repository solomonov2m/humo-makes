// Вблизи клетка одевается фото земли, а не одним цветом биома.

import { cellUnit, groundKind } from "./land-kind.js";
import { kindPattern, landReady, photoReach, plate, spanTiles } from "./land-load.js";
import { paintSeams } from "./land-seam.js";

const KINDS = ["grass", "soil", "gravel", "sand"];

export function paintPhoto(ctx, world, scale) {
  const reach = photoReach(scale);
  if (!reach || !landReady()) return;
  const box = viewBox(ctx, world);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "low";
  fillKinds(ctx, world, box, reach, scale);
  paintSeams(ctx, world, box, reach);
  sandCuts(ctx, world, box, reach);
  ctx.restore();
}

function fillKinds(ctx, world, box, reach, scale) {
  const bleed = 0.35 / Math.max(scale, 1);
  ctx.globalAlpha = reach;
  for (const kind of KINDS) {
    const pattern = kindPattern(ctx, kind);
    if (!pattern) continue;
    ctx.beginPath();
    let n = 0;
    for (let y = box.y0; y <= box.y1; y++) {
      for (let x = box.x0; x <= box.x1; x++) {
        if (groundKind(world, x, y) !== kind) continue;
        ctx.rect(x - bleed, y - bleed, 1 + bleed * 2, 1 + bleed * 2);
        n += 1;
      }
    }
    if (!n) continue;
    ctx.fillStyle = pattern;
    ctx.fill();
  }
}

function sandCuts(ctx, world, box, reach) {
  const img = plate("sandCut");
  if (!img) return;
  const span = spanTiles() * 1.35;
  ctx.globalAlpha = reach;
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      if (groundKind(world, x, y) !== "sand") continue;
      const n = 2 + Math.floor(cellUnit(x, y, 4) * 3);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, 1, 1);
      ctx.clip();
      for (let i = 0; i < n; i++) {
        const px = x + 0.12 + cellUnit(x, y, i + 8) * 0.76;
        const py = y + 0.12 + cellUnit(x, y, i + 15) * 0.76;
        ctx.drawImage(img, px - span / 2, py - span / 2, span, span);
      }
      ctx.restore();
    }
  }
}

function viewBox(ctx, world) {
  const m = ctx.getTransform();
  const pad = 1;
  return {
    x0: Math.max(0, Math.floor(-m.e / m.a) - pad),
    y0: Math.max(0, Math.floor(-m.f / m.d) - pad),
    x1: Math.min(world.cols - 1, Math.ceil((ctx.canvas.width - m.e) / m.a) + pad),
    y1: Math.min(world.rows - 1, Math.ceil((ctx.canvas.height - m.f) / m.d) + pad),
  };
}
