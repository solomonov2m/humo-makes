// Геном — наследуемые задатки (0..1). Из них считаются параметры тела.
// Навыки, дом и ум живут отдельно: они растут в течение жизни.

export const GENES = [
  "speed",
  "vision",
  "metabolism",
  "fertility",
  "lifespan",
  "strength",
  "immunity",
  "sociability",
];

function randGene() {
  return Math.random();
}

export class Genome {
  constructor(values) {
    this.values = values || Object.fromEntries(GENES.map((g) => [g, randGene()]));
  }

  static random() {
    return new Genome();
  }

  static crossover(a, b, mutationRate = 0.08) {
    const values = {};
    for (const gene of GENES) {
      let v = Math.random() < 0.5 ? a.values[gene] : b.values[gene];
      if (Math.random() < mutationRate) v += (Math.random() - 0.5) * 0.3;
      values[gene] = Math.min(1, Math.max(0, v));
    }
    return new Genome(values);
  }

  derive() {
    return {
      speed: 1.15 + this.values.speed * 0.5,
      vision: 3.2 + this.values.vision * 6.5,
      metabolismRate: 0.55 + this.values.metabolism * 1.05,
      fertility: 0.22 + this.values.fertility * 0.62,
      lifespanDays: 240 + this.values.lifespan * 420,
      strength: 0.55 + this.values.strength * 1.45,
      immunity: this.values.immunity,
      sociability: this.values.sociability,
    };
  }
}
