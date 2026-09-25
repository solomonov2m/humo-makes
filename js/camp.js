// Стойбище у пресной воды: иначе люди разбросаны по Бали и не видят друг друга.

import { knownAt } from "./chart.js";

export function pickCamp(world) {
  if (world.camp) return world.camp;
  const drinks = world.drinks || [];
  for (let i = 0; i < 80 && drinks.length; i++) {
    const spot = drinks[Math.floor(Math.random() * drinks.length)];
    const x = spot.x + (i % 2 ? 2 : -2);
    const y = spot.y + (i % 3) - 1;
    if (world.isGrass(x, y) && knownAt(world, x, y)) {
      world.camp = { x, y };
      return world.camp;
    }
  }
  world.camp = world.randomLandTile();
  return world.camp;
}

export function nearCamp(world) {
  const camp = pickCamp(world);
  for (let i = 0; i < 40; i++) {
    const x = Math.round(camp.x + (Math.random() - 0.5) * 10);
    const y = Math.round(camp.y + (Math.random() - 0.5) * 10);
    if (world.isGrass(x, y) && knownAt(world, x, y)) return { x, y };
  }
  return camp;
}
