// Земля перед глазами — та же пластина, что на карте.

import { groundKind } from "./land-kind.js";
import { landReady, plate, spanTiles } from "./land-load.js";
import {
  TILE_DEEP, TILE_FOREST, TILE_FRESH, TILE_GRASS, TILE_HILL, TILE_SAND, TILE_SHALLOW, TILE_WATER,
} from "./world.js";

const FALLBACK = {
  [TILE_DEEP]: "#14384e",
  [TILE_WATER]: "#1c5f86",
  [TILE_SHALLOW]: "#3e92b8",
  [TILE_SAND]: "#e4d0a4",
  [TILE_GRASS]: "#7faf4a",
  [TILE_FOREST]: "#2f6a3c",
  [TILE_HILL]: "#8a8074",
  [TILE_FRESH]: "#3ec6d4",
};

export function paintEyesGround(ctx, w, h, agent, world, pose, calm) {
  const horizon = h * 0.46;
  const c = Math.cos(pose.face);
  const s = Math.sin(pose.face);
  const sway = calm || !pose.moving ? 0 : Math.sin(pose.step * 2) * w * 0.015;
  for (let row = 0; row < 8; row++) {
    const dist = 0.15 + (7 - row) * 0.62;
    const y = horizon + (row / 8) * (h - horizon);
    const band = (h - horizon) / 8 + 2;
    for (let col = 0; col < 5; col++) {
      const side = (col - 2) * (0.28 + row * 0.16);
      const wx = agent.x + c * dist - s * side;
      const wy = agent.y + s * dist + c * side;
      const dx = (col / 5) * w + sway * (row / 8);
      patch(ctx, world, wx, wy, dx, y, w / 5 + 2, band);
    }
  }
}

function patch(ctx, world, x, y, dx, dy, dw, dh) {
  const kind = groundKind(world, x, y);
  const img = kind && landReady() ? plate(kind) : null;
  if (!img) {
    ctx.fillStyle = tint(world, x, y);
    ctx.fillRect(dx, dy, dw, dh);
    return;
  }
  const span = spanTiles();
  const u = x / span - Math.floor(x / span);
  const v = y / span - Math.floor(y / span);
  const sw = img.width * 0.22;
  const sh = img.height * 0.22;
  const sx = u * (img.width - sw);
  const sy = v * (img.height - sh);
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function tint(world, x, y) {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (!world.inBounds(ix, iy)) return FALLBACK[TILE_DEEP];
  return FALLBACK[world.tileAt(ix, iy)] || FALLBACK[TILE_GRASS];
}
