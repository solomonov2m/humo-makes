// Стык двух пластин: фото границы по ребру, иначе узкая полоса соседа.

import { bridgeOf, kindPattern, spanTiles } from "./land-load.js";
import { groundKind } from "./land-kind.js";

export function paintSeams(ctx, world, box, reach) {
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      const a = groundKind(world, x, y);
      if (!a) continue;
      seam(ctx, world, a, x, y, 1, 0, reach);
      seam(ctx, world, a, x, y, 0, 1, reach);
    }
  }
}

function seam(ctx, world, a, x, y, dx, dy, reach) {
  const b = groundKind(world, x + dx, y + dy);
  if (!b || b === a) return;
  const bridge = bridgeOf(a, b);
  if (bridge) stamp(ctx, bridge, b, x, y, dx, dy, reach);
  else band(ctx, b, x, y, dx, dy, reach);
}

function stamp(ctx, bridge, b, x, y, dx, dy, reach) {
  const face = bridge.right === b ? 1 : -1;
  const span = spanTiles();
  const x0 = x + dx;
  const y0 = y + dy;
  const x1 = x0 + (dx ? 0 : 1);
  const y1 = y0 + (dy ? 0 : 1);
  const len = Math.hypot(x1 - x0, y1 - y0);
  const step = span * 0.72;
  const ang = Math.atan2(dy * face, dx * face);
  const img = bridge.img;
  const crop = 0.14;
  const sw = img.width * (1 - crop * 2);
  const sh = img.height * (1 - crop * 2);
  ctx.save();
  ctx.globalAlpha = reach;
  for (let t = step * 0.35; t < len; t += step) {
    ctx.save();
    ctx.translate(x0 + ((x1 - x0) / len) * t, y0 + ((y1 - y0) / len) * t);
    ctx.rotate(ang);
    ctx.drawImage(img, img.width * crop, img.height * crop, sw, sh, -span / 2, -span / 2, span, span);
    ctx.restore();
  }
  ctx.restore();
}

function band(ctx, kind, x, y, dx, dy, reach) {
  const thick = spanTiles() * 0.55;
  const pattern = kindPattern(ctx, kind);
  if (!pattern) return;
  ctx.save();
  ctx.beginPath();
  if (dx) ctx.rect(x + 1 - thick, y, thick, 1);
  else ctx.rect(x, y + 1 - thick, 1, thick);
  ctx.clip();
  ctx.globalAlpha = reach * 0.62;
  ctx.fillStyle = pattern;
  ctx.fillRect(x, y, 1, 1);
  ctx.restore();
}
