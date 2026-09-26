import { PHASE_LABEL, SPEEDS, phaseOf, speedText } from "./clock.js";

export function mountPanel({ onPause, onReset, onSpeed, onZoomIn, onZoomOut }) {
  const speedBtn = document.getElementById("speedBtn");
  const pauseBtn = document.getElementById("btnPause");
  const dayLine = document.getElementById("dayLine");
  const rateLine = document.getElementById("rateLine");
  const zoomLabel = document.getElementById("zoomLabel");
  const zoomInBtn = document.getElementById("zoomIn");
  const zoomOutBtn = document.getElementById("zoomOut");
  let index = 0;

  speedBtn.addEventListener("click", () => {
    index = (index + 1) % SPEEDS.length;
    onSpeed(index);
    markSpeed(index);
  });
  pauseBtn.addEventListener("click", () => onPause());
  document.getElementById("btnReset").addEventListener("click", () => onReset());
  zoomInBtn.addEventListener("click", () => onZoomIn());
  zoomOutBtn.addEventListener("click", () => onZoomOut());

  function markSpeed(next) {
    index = next;
    const preset = SPEEDS[index];
    speedBtn.textContent = preset.label;
    rateLine.textContent = speedText(preset);
  }

  return {
    markSpeed,
    setPaused(paused) {
      pauseBtn.textContent = paused ? "Продолжить" : "Пауза";
    },
    setDay(day, fraction = 0) {
      const hour = Math.floor(Math.min(0.999, Math.max(0, fraction)) * 24);
      const phase = phaseOf(fraction);
      const light = phase === "day" ? "" : ` · ${(PHASE_LABEL[phase] || "").toLowerCase()}`;
      dayLine.textContent = `Букит, ок. 3000 г. до н.э. · День ${day} · ${hour} ч${light}`;
    },
    setZoom(label, zoom, minZoom, maxZoom) {
      zoomLabel.textContent = label;
      zoomOutBtn.disabled = zoom <= minZoom + 0.01;
      zoomInBtn.disabled = zoom >= maxZoom - 0.01;
    },
  };
}
