// Чем ближе камера, тем сильнее край карты растворяется. В центре остаётся место, где стоишь.

export function veilFar(ctx, zoom) {
  const k = Math.min(1, Math.max(0, (zoom - 1.2) / 3.5));
  if (k < 0.04) return;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const outer = Math.hypot(w, h) * 0.48;
  const inner = outer * (0.78 - k * 0.5);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const fade = ctx.createRadialGradient(cx, cy, Math.max(12, inner), cx, cy, outer);
  fade.addColorStop(0, "rgba(0,0,0,0)");
  fade.addColorStop(1, `rgba(0,0,0,${k})`);
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
