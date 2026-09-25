// Связи между входом, памятью и делом. Веса наследуются и сдвигаются от награды.

export function layer(weights, input) {
  return weights.map((row) => Math.tanh(dot(row, input)));
}

export function matrix(rows, cols, scale) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => (Math.random() - 0.5) * scale));
}

export function mixWeights(a, b) {
  return a.map((row, y) => row.map((value, x) => {
    let next = Math.random() < 0.5 ? value : b[y][x];
    if (Math.random() < 0.06) next += (Math.random() - 0.5) * 0.45;
    return clampWeight(next);
  }));
}

export function clampWeight(value) {
  return Math.max(-2.5, Math.min(2.5, value));
}

export function dot(row, input) {
  let sum = 0;
  for (let i = 0; i < row.length; i++) sum += row[i] * (input[i] || 0);
  return sum;
}

export function nudge(row, signal, rate) {
  for (let i = 0; i < row.length; i++) row[i] = clampWeight(row[i] + rate * (signal[i] || 0));
}
