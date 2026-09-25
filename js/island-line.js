// Строка о живом острове на сервере.

export function watchIsland(line) {
  async function pull() {
    try {
      const res = await fetch(`/live.json?t=${Date.now()}`);
      if (!res.ok) return;
      const live = await res.json();
      const ideas = (live.ideas || []).join(", ") || "пока ничего";
      line.textContent = `Сервер: день ${live.day}, ${live.hour} ч, живых ${live.population} (дети ${live.children}). ${live.era}. Додумались: ${ideas}.`;
    } catch {
      line.textContent = "Сервер острова молчит.";
    }
  }
  pull();
  setInterval(pull, 5000);
}
