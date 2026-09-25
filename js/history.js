const CAP = 36;

export function sampleHistory(history, day, population) {
  const last = history[history.length - 1];
  if (last && last.day === day) {
    last.population = population;
    return;
  }
  history.push({ day, population });
  if (history.length > CAP) history.shift();
}
