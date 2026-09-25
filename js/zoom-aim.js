// Плюс и минус прыгают к занятию и к фигуре, не ползут по процентам.

import { TILE } from "./world.js";
import { stepZoom } from "./scale.js";

export function aimZoom(stage, canvas, world, who, dir) {
  const camera = stage.camera;
  const fit = stage.metrics(world).scale / Math.max(camera.zoom, 1e-6);
  if (who && dir > 0) {
    camera.x = who.x * TILE + TILE / 2;
    camera.y = who.y * TILE + TILE / 2;
  }
  const next = stepZoom(camera.zoom, fit, dir);
  stage.zoomAt(canvas.width / 2, canvas.height / 2, next, world);
}
