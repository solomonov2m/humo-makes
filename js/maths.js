// Мир не пускает количество, путь и плечо, которые спорят со счётом.

export function total(parts) {
  return (parts || []).reduce((sum, n) => sum + Math.max(0, n), 0);
}

export function keeps(parts, out) {
  const sum = total(parts);
  const got = Math.max(0, out);
  if (got - sum > 1e-6) return { ok: false, note: "количество больше, чем было", sum };
  return { ok: true, left: sum - got, sum };
}

export function massOf(density, volume) {
  return Math.max(0, density) * Math.max(0, volume);
}

export function span(dx, dy) {
  return Math.hypot(dx, dy);
}

export function pathHolds(length, dx, dy) {
  const straight = span(dx, dy);
  if (length + 1e-6 < straight) return { ok: false, note: "путь короче прямой", straight };
  return { ok: true, straight };
}

export function moment(force, arm) {
  return Math.max(0, force) * Math.max(0, arm);
}

export function leverHolds(effort, effortArm, load, loadArm) {
  const have = moment(effort, effortArm);
  const need = moment(load, loadArm);
  if (have + 1e-9 < need) {
    return { ok: false, have, need, note: "древко коротко, момент не уравновешивает тяжесть" };
  }
  return { ok: true, have, need };
}

export function reach(speed, time) {
  return Math.max(0, speed) * Math.max(0, time);
}

export function routeSpan(path) {
  if (!path || path.length < 2) return { ok: true, straight: 0, length: 0 };
  let length = 0;
  for (let i = 1; i < path.length; i += 1) {
    length += span(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
  }
  const last = path[path.length - 1];
  const held = pathHolds(length, last.x - path[0].x, last.y - path[0].y);
  return { ...held, length };
}
