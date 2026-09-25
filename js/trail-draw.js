// Тропа рисуется по вытоптанным клеткам: прямые звенья и площадка,
// без диагональной паутины и без следа от каждого шага.

import { TILE } from "./world.js";
import { WEAR_ROAD, WEAR_TRACK, WEAR_TRAIL } from "./roads.js";

const LINK = [[1, 0], [0, 1]];
const AROUND = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function wearAt(world, x, y) {
  if (x < 0 || y < 0 || x >= world.cols || y >= world.rows) return 0;
  return world.wear[world.idx(x, y)];
}

export function drawTrails(ctx, world) {
  if (!world.wear) return;
  const cols = world.cols;
  const rows = world.rows;
  const degree = new Uint8Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (wearAt(world, x, y) < WEAR_TRAIL) continue;
      let n = 0;
      for (const [dx, dy] of AROUND) {
        if (wearAt(world, x + dx, y + dy) >= WEAR_TRAIL) n += 1;
      }
      degree[world.idx(x, y)] = n;
    }
  }

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  drawTracks(ctx, world);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const wear = wearAt(world, x, y);
      if (wear < WEAR_TRAIL) continue;
      const cx = x * TILE + TILE / 2;
      const cy = y * TILE + TILE / 2;
      const deg = degree[world.idx(x, y)];
      if (deg >= 4) {
        ctx.fillStyle = "rgba(98, 64, 36, 0.55)";
        ctx.beginPath();
        ctx.ellipse(cx, cy, TILE * 0.22, TILE * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      for (const [dx, dy] of LINK) {
        const ow = wearAt(world, x + dx, y + dy);
        if (ow < WEAR_TRAIL) continue;
        const od = degree[world.idx(x + dx, y + dy)];
        if (deg >= 4 || od >= 4) continue;
        const strong = Math.min(wear, ow);
        const road = strong >= WEAR_ROAD;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo((x + dx) * TILE + TILE / 2, (y + dy) * TILE + TILE / 2);
        ctx.strokeStyle = road ? "rgba(62, 38, 22, 0.92)" : "rgba(128, 82, 44, 0.82)";
        ctx.lineWidth = (road ? 0.28 : 0.14) * TILE;
        ctx.stroke();
        ctx.strokeStyle = road ? "rgba(214, 184, 138, 0.8)" : "rgba(186, 142, 92, 0.45)";
        ctx.lineWidth = (road ? 0.1 : 0.05) * TILE;
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawTracks(ctx, world) {
  ctx.strokeStyle = "rgba(168, 132, 86, 0.55)";
  ctx.lineWidth = 0.08 * TILE;
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      const wear = wearAt(world, x, y);
      if (wear < WEAR_TRACK || wear >= WEAR_TRAIL) continue;
      const cx = x * TILE + TILE / 2;
      const cy = y * TILE + TILE / 2;
      for (const [dx, dy] of LINK) {
        const ow = wearAt(world, x + dx, y + dy);
        if (ow < WEAR_TRACK) continue;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo((x + dx) * TILE + TILE / 2, (y + dy) * TILE + TILE / 2);
        ctx.stroke();
      }
    }
  }
}
