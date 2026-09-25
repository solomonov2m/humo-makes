// Рисунок кладки: каждый кусок на своём месте, без силуэта здания.

import { TILE } from "./world.js";
import { drawBulk } from "./bulk-draw.js";

export function dwellingBox(h) {
  const cx = h.x * TILE + TILE / 2;
  const base = h.y * TILE + TILE - 1;
  let reach = 0.12;
  for (const piece of h.pieces || []) {
    reach = Math.max(reach, Math.hypot(piece.dx || 0, piece.dy || 0) + 0.08);
  }
  return { cx, base, left: cx - reach, top: base - reach, w: reach * 2 };
}

export function drawDwelling(ctx, h) {
  const pieces = h.pieces || [];
  for (const piece of pieces) {
    const x = (h.x + (piece.dx || 0)) * TILE + TILE / 2;
    const y = (h.y + (piece.dy || 0)) * TILE + TILE * 0.72;
    const w = 0.04 + Math.sqrt(piece.grams || 0.4) * 0.045;
    drawBulk(ctx, piece.id, x, y, w);
  }
}
