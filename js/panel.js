import { SPEEDS, speedText } from "./clock.js";

export function mountPanel({ onPause, onReset, onSpeed, onZoomIn, onZoomOut, onMapOnly }) {
  const app = document.getElementById("app");
  const speeds = document.getElementById("speedList");
  const pauseBtn = document.getElementById("btnPause");
  const dayLine = document.getElementById("dayLine");
  const rateLine = document.getElementById("rateLine");
  const zoomLabel = document.getElementById("zoomLabel");
  const zoomInBtn = document.getElementById("zoomIn");
  const zoomOutBtn = document.getElementById("zoomOut");
  const mapOnlyBtn = document.getElementById("mapOnly");
  const openMenu = document.getElementById("openMenu");

  speeds.innerHTML = SPEEDS.map((preset, index) => `
    <button type="button" role="radio" data-speed="${index}" aria-checked="${index === 0}">
      <span>${preset.label}</span>
      <small>${speedText(preset).replace(`${preset.label} · `, "")}</small>
    </button>
  `).join("");

  speeds.addEventListener("click", (event) => {
    const button = event.target.closest("[data-speed]");
    if (!button) return;
    const index = Number(button.dataset.speed);
    onSpeed(index);
    markSpeed(index);
  });

  pauseBtn.addEventListener("click", () => onPause());
  document.getElementById("btnReset").addEventListener("click", () => onReset());
  zoomInBtn.addEventListener("click", () => onZoomIn());
  zoomOutBtn.addEventListener("click", () => onZoomOut());

  function setMapOnly(only) {
    app.classList.toggle("map-only", only);
    mapOnlyBtn.setAttribute("aria-pressed", String(only));
    openMenu.hidden = !only;
  }

  mapOnlyBtn.addEventListener("click", () => {
    setMapOnly(!app.classList.contains("map-only"));
    onMapOnly();
  });
  openMenu.addEventListener("click", () => {
    setMapOnly(false);
    onMapOnly();
  });

  function markSpeed(index) {
    for (const node of speeds.querySelectorAll("[data-speed]")) {
      node.setAttribute("aria-checked", String(Number(node.dataset.speed) === index));
    }
    rateLine.textContent = speedText(SPEEDS[index]);
  }

  return {
    markSpeed,
    setPaused(paused) {
      pauseBtn.textContent = paused ? "Продолжить" : "Пауза";
    },
    setDay(day, fraction = 0) {
      const hour = Math.floor(Math.min(0.999, Math.max(0, fraction)) * 24);
      dayLine.textContent = `День ${day}, ${hour} ч`;
    },
    setZoom(label, zoom, minZoom, maxZoom) {
      zoomLabel.textContent = label;
      zoomOutBtn.disabled = zoom <= minZoom + 0.01;
      zoomInBtn.disabled = zoom >= maxZoom - 0.01;
    },
  };
}
