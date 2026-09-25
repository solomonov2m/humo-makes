// Временные спрайты дорог. Поле provisional: художественный атлас подставит те же маски.

const CELL = 32;

export function roadAtlas() {
  const canvas = document.createElement("canvas");
  canvas.width = CELL * 16;
  canvas.height = CELL * 2;
  const ctx = canvas.getContext("2d");
  const manifest = [];
  for (let level = 1; level <= 2; level++) {
    for (let mask = 0; mask < 16; mask++) {
      const frame = { x: mask * CELL, y: (level - 1) * CELL, w: CELL, h: CELL };
      drawFrame(ctx, frame, mask, level);
      manifest.push({
        key: `road-l${level}-m${mask}`,
        mask,
        level,
        frame,
        anchor: { x: 0.5, y: 0.5 },
        provisional: true,
      });
    }
  }
  return { canvas, manifest, cell: CELL };
}

function drawFrame(ctx, frame, mask, level) {
  const cx = frame.x + CELL / 2;
  const cy = frame.y + CELL / 2;
  ctx.strokeStyle = level === 2 ? "#5c3b24" : "#a67c52";
  ctx.lineWidth = level === 2 ? 3 : 2;
  ctx.lineCap = "round";
  const arms = [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]];
  ctx.beginPath();
  for (const [dx, dy, bit] of arms) {
    if ((mask & bit) === 0) continue;
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dx * CELL / 2, cy + dy * CELL / 2);
  }
  ctx.stroke();
}

let cached = null;
export function atlasOf() {
  if (!cached) cached = roadAtlas();
  return cached;
}
