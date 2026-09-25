import { appearance } from "./appearance.js";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function eye(ctx, x, y, iris, scale) {
  ctx.fillStyle = "#fffdf8";
  ctx.beginPath();
  ctx.ellipse(x, y, 8 * scale, 5.4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = iris;
  ctx.beginPath();
  ctx.arc(x, y + 0.4, 3.4 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a120e";
  ctx.beginPath();
  ctx.arc(x, y + 0.4, 1.7 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x - 1.2, y - 1.1, 0.9, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPortrait(canvas, agent) {
  const w = 180;
  const h = 220;
  canvas.width = w * 2;
  canvas.height = h * 2;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  const look = appearance(agent);
  const child = agent.isChild;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#8eafc0");
  sky.addColorStop(0.55, "#b7cfc4");
  sky.addColorStop(1, "#6d8f72");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath();
  ctx.arc(138, 36, 28, 0, Math.PI * 2);
  ctx.fill();

  const cx = 90;
  const faceY = child ? 118 : 112;
  const rx = (child ? 38 : 42) * look.faceW;
  const ry = child ? 44 : 52;
  const eyeY = faceY - 6;
  const eyeGap = child ? 15 : 16;

  ctx.fillStyle = look.tunic;
  roundRect(ctx, 38, 158, 104, 70, 28);
  ctx.fill();
  ctx.fillStyle = mixShade(look.tunic);
  roundRect(ctx, 62, 158, 56, 28, 12);
  ctx.fill();

  ctx.fillStyle = look.skin;
  ctx.fillRect(cx - 12, faceY + ry - 18, 24, 28);

  if (look.hairLong) {
    ctx.fillStyle = look.hair;
    roundRect(ctx, cx - rx - 6, faceY - 10, 16, 78, 8);
    ctx.fill();
    roundRect(ctx, cx + rx - 10, faceY - 10, 16, 78, 8);
    ctx.fill();
  }

  ctx.fillStyle = look.skinShadow;
  ctx.beginPath();
  ctx.ellipse(cx - rx + 6, faceY + 4, 8, 14, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + rx - 6, faceY + 4, 8, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = look.skin;
  ctx.beginPath();
  ctx.ellipse(cx, faceY, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(196, 90, 90, 0.18)";
  ctx.beginPath();
  ctx.ellipse(cx - 18, faceY + 12, 8, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 18, faceY + 12, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const eyeScale = child ? 1.12 : 1;
  eye(ctx, cx - eyeGap, eyeY, look.eye, eyeScale);
  eye(ctx, cx + eyeGap, eyeY, look.eye, eyeScale);

  ctx.strokeStyle = look.skinShadow;
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 16, eyeY - 10);
  ctx.quadraticCurveTo(cx - 8, eyeY - 13, cx - 2, eyeY - 9);
  ctx.moveTo(cx + 2, eyeY - 9);
  ctx.quadraticCurveTo(cx + 8, eyeY - 13, cx + 16, eyeY - 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, eyeY + 10);
  ctx.quadraticCurveTo(cx + 7, eyeY + 22, cx, eyeY + 24);
  ctx.stroke();

  ctx.strokeStyle = "#8d4b48";
  ctx.lineWidth = 1.7;
  const smile = look.smile;
  ctx.beginPath();
  ctx.arc(cx, faceY + 18 - smile, 11, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  ctx.fillStyle = look.hair;
  ctx.beginPath();
  ctx.arc(cx, faceY - ry * 0.42, rx + 2, Math.PI * 1.02, Math.PI * 1.98);
  ctx.fill();
  if (!look.hairLong) {
    ctx.fillRect(cx - rx + 2, faceY - ry * 0.55, rx * 2 - 4, 14);
  }

  if (look.beard) {
    ctx.fillStyle = look.hair;
    ctx.beginPath();
    ctx.ellipse(cx, faceY + ry * 0.42, rx * 0.55, 16, 0, 0, Math.PI);
    ctx.fill();
  }

  if (look.old) {
    ctx.strokeStyle = "rgba(80, 50, 40, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 20, eyeY + 16);
    ctx.lineTo(cx - 8, eyeY + 18);
    ctx.moveTo(cx + 8, eyeY + 18);
    ctx.lineTo(cx + 20, eyeY + 16);
    ctx.stroke();
  }

  if (!agent.alive) {
    ctx.fillStyle = "rgba(40, 40, 40, 0.38)";
    ctx.fillRect(0, 0, w, h);
  }

  canvas.setAttribute("aria-label", `Портрет: ${agent.name}`);
}

function mixShade(hex) {
  return hex;
}
