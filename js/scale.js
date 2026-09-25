// Размеры в метрах, на карте — в клетках. Взрослый 1.7 м, не участок.

import { ADULT_M, METERS_PER_TILE } from "./measure.js";

const CHILD_M = 1.1;

export const MAN_PX = ADULT_M / METERS_PER_TILE;

export function personScale(child) {
  const meters = child ? CHILD_M : ADULT_M;
  return (meters / METERS_PER_TILE) / 13.2;
}

const ZOOM_PX = [0, 6, 48];

export function zoomForPerson(fit, screenPx = 48) {
  return screenPx / Math.max((ADULT_M / METERS_PER_TILE) * fit, 1e-6);
}

export function stepZoom(zoom, fit, dir) {
  const px = (ADULT_M / METERS_PER_TILE) * fit * zoom;
  if (dir > 0) {
    const next = ZOOM_PX.find((step) => step > px + 0.4);
    return next ? zoomForPerson(fit, next) : zoom * 1.8;
  }
  const prev = [...ZOOM_PX].reverse().find((step) => step < px - 0.4);
  if (prev == null || prev === 0) return 1;
  return zoomForPerson(fit, prev);
}

export const TREE_PX = 16 / METERS_PER_TILE;
export const BUSH_PX = 0.9 / METERS_PER_TILE;
