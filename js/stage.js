import { TILE } from "./world.js";

const MIN_ZOOM = 1;
const MAX_ZOOM = 20000;

export function createStage(canvas, stageEl) {
  const camera = { x: 0, y: 0, zoom: 1 };
  const keys = new Set();
  let drag = null;

  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, stageEl.clientWidth);
    const h = Math.max(1, stageEl.clientHeight);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }

  function frameOf(world) {
    const f = world.frame;
    if (!f) return { x: world.cols * TILE / 2, y: world.rows * TILE / 2, w: world.cols * TILE, h: world.rows * TILE };
    return { x: f.cx * TILE, y: f.cy * TILE, w: f.w * TILE, h: f.h * TILE };
  }

  function metrics(world) {
    const frame = frameOf(world);
    const worldW = frame.w;
    const worldH = frame.h;
    const fit = Math.min(canvas.width / worldW, canvas.height / worldH) || 1;
    const scale = fit * camera.zoom;
    return {
      scale,
      ox: canvas.width / 2 - camera.x * scale,
      oy: canvas.height / 2 - camera.y * scale,
    };
  }

  function screenToWorld(sx, sy, world) {
    const m = metrics(world);
    return { x: (sx - m.ox) / m.scale, y: (sy - m.oy) / m.scale };
  }

  function eventPx(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function clampCamera(world) {
    const frame = frameOf(world);
    const m = metrics(world);
    const viewW = canvas.width / m.scale;
    const viewH = canvas.height / m.scale;
    const padX = Math.max(TILE * 8, viewW * 0.15);
    const padY = Math.max(TILE * 6, viewH * 0.15);
    const left = frame.x - frame.w / 2;
    const top = frame.y - frame.h / 2;
    const minX = left + (viewW >= frame.w ? frame.w / 2 : viewW / 2) - (viewW >= frame.w ? padX : 0);
    const maxX = left + (viewW >= frame.w ? frame.w / 2 : frame.w - viewW / 2) + (viewW >= frame.w ? padX : 0);
    const minY = top + (viewH >= frame.h ? frame.h / 2 : viewH / 2) - (viewH >= frame.h ? padY : 0);
    const maxY = top + (viewH >= frame.h ? frame.h / 2 : frame.h - viewH / 2) + (viewH >= frame.h ? padY : 0);
    camera.x = Math.min(maxX, Math.max(minX, camera.x));
    camera.y = Math.min(maxY, Math.max(minY, camera.y));
  }

  function center(world) {
    const frame = frameOf(world);
    camera.x = frame.x;
    camera.y = frame.y;
    camera.zoom = 1;
  }

  function lookAt(world, x, y, zoom) {
    camera.x = x;
    camera.y = y;
    camera.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
    clampCamera(world);
  }

  function zoomAt(sx, sy, nextZoom, world) {
    const before = screenToWorld(sx, sy, world);
    camera.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
    const m = metrics(world);
    camera.x = before.x - (sx - canvas.width / 2) / m.scale;
    camera.y = before.y - (sy - canvas.height / 2) / m.scale;
    clampCamera(world);
  }

  function drift(world, dt) {
    let dx = 0;
    let dy = 0;
    if (keys.has("w") || keys.has("arrowup")) dy -= 1;
    if (keys.has("s") || keys.has("arrowdown")) dy += 1;
    if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
    if (keys.has("d") || keys.has("arrowright")) dx += 1;
    if (!dx && !dy) return;
    const len = Math.hypot(dx, dy);
    const step = (420 / camera.zoom) * dt;
    camera.x += (dx / len) * step;
    camera.y += (dy / len) * step;
    clampCamera(world);
  }

  function bind({ getWorld, onHover, onPick, onFocus }) {
    window.addEventListener("keydown", (event) => {
      if (event.target.closest("input, textarea")) return;
      const key = event.key.toLowerCase();
      if (!"wasd".includes(key) && !event.key.startsWith("Arrow")) return;
      keys.add(key);
      event.preventDefault();
    });
    window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const p = eventPx(event);
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      zoomAt(p.x, p.y, camera.zoom * Math.exp(-delta * 0.0028), getWorld());
    }, { passive: false });

    canvas.addEventListener("pointerdown", (event) => {
      const p = eventPx(event);
      drag = { x: p.x, y: p.y, camX: camera.x, camY: camera.y, moved: false };
      canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener("pointermove", (event) => {
      const p = eventPx(event);
      const point = screenToWorld(p.x, p.y, getWorld());
      const reach = 22 / metrics(getWorld()).scale;
      const over = onHover(point, reach);
      if (!drag) {
        canvas.style.cursor = over ? "pointer" : "grab";
        return;
      }
      if (Math.hypot(p.x - drag.x, p.y - drag.y) > 4) drag.moved = true;
      if (!drag.moved) return;
      canvas.style.cursor = "grabbing";
      const { scale } = metrics(getWorld());
      camera.x = drag.camX - (p.x - drag.x) / scale;
      camera.y = drag.camY - (p.y - drag.y) / scale;
      clampCamera(getWorld());
    });

    canvas.addEventListener("pointerup", (event) => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (!moved) onPick(screenToWorld(eventPx(event).x, eventPx(event).y, getWorld()));
    });

    canvas.addEventListener("dblclick", (event) => {
      onFocus(screenToWorld(eventPx(event).x, eventPx(event).y, getWorld()));
    });

    window.addEventListener("resize", sizeCanvas);
  }

  return {
    camera,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    sizeCanvas,
    metrics,
    center,
    lookAt,
    zoomAt,
    drift,
    clampCamera,
    bind,
  };
}
