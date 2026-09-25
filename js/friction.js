// Нагрев от контакта двух твёрдых тел. Политика жителя эту формулу не читает.

export function rubHeat(a, b) {
  if (!a || !b || a.state !== "solid" || b.state !== "solid") return 0;
  return Math.min(90, a.hardness * b.hardness * 4);
}

export function contactDegrees(a, b, wet) {
  const damp = Math.max(0, Math.min(1, wet || 0));
  return rubHeat(a, b) * (1 - damp) * 0.15;
}
