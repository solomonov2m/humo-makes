import { PHASE_LABEL, phaseOf, speedText } from "./clock.js";
import { sampleHistory } from "./history.js";
import { worldView, peopleView, communeView, eventsView } from "./dash-views.js";

const LENSES = [
  { id: "world", label: "Мир" },
  { id: "people", label: "Люди" },
  { id: "commune", label: "Община" },
  { id: "events", label: "События" },
];

const FILTERS = [
  { id: "all", label: "Все" },
  { id: "era", label: "Эпохи" },
  { id: "birth", label: "Рождения" },
  { id: "death", label: "Смерти" },
  { id: "home", label: "Дома" },
];

export function daylight(sim) {
  const progress = Math.min(1, sim.clock.progress || 0);
  const phase = phaseOf(progress);
  return { progress, phase, phaseLabel: PHASE_LABEL[phase], speedLabel: speedText(sim.clock.preset) };
}

export function mountChronicle({ getSim, button }) {
  const root = document.getElementById("chronicle");
  const body = document.getElementById("chronicleBody");
  const lenses = document.getElementById("lenses");
  const filters = document.getElementById("eventFilters");
  const closeBtn = document.getElementById("chronicleClose");
  const dial = document.getElementById("sundial");
  let lens = "world";
  let filter = "all";
  let open = false;
  let lastPaint = 0;
  const events = [];
  const history = [];
  const seen = { sim: null };

  lenses.innerHTML = LENSES.map((item) => `
    <button type="button" role="tab" id="lens-${item.id}" data-lens="${item.id}" aria-selected="${item.id === lens}">${item.label}</button>
  `).join("");
  filters.innerHTML = FILTERS.map((item) => `
    <button type="button" data-filter="${item.id}" aria-pressed="${item.id === filter}">${item.label}</button>
  `).join("");

  function setOpen(next) {
    open = next;
    root.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    if (open) {
      paint(true);
      closeBtn.focus();
    } else button.focus();
  }

  function watch(sim) {
    if (seen.sim !== sim) {
      seen.sim = sim;
      seen.ready = false;
      events.length = 0;
      history.length = 0;
    }
    const report = sim.report();
    if (!seen.ready) {
      seen.ready = true;
      seen.births = report.births;
      seen.deaths = report.deaths;
      seen.era = report.eraName;
      seen.homes = report.homes;
      sampleHistory(history, report.day, report.population);
      return report;
    }
    const push = (kind, text) => {
      events.unshift({ day: report.day, kind, text });
      if (events.length > 60) events.pop();
    };
    if (report.eraName !== seen.era) push("era", `Наступила эпоха «${report.eraName}».`);
    if (report.births > seen.births) push("birth", `Родились: ${report.births - seen.births}.`);
    if (report.deaths > seen.deaths) push("death", `Умерли: ${report.deaths - seen.deaths}.`);
    if (report.homes > seen.homes) push("home", `Готовых домов стало ${report.homes}.`);
    seen.births = report.births;
    seen.deaths = report.deaths;
    seen.era = report.eraName;
    seen.homes = report.homes;
    sampleHistory(history, report.day, report.population);
    return report;
  }

  function paint(force) {
    const sim = getSim();
    const report = watch(sim);
    const light = daylight(sim);
    if (!open) return light;
    const now = performance.now();
    if (!force && now - lastPaint < 200) return light;
    lastPaint = now;
    dial.innerHTML = dialMarkup(report, light);
    const view = lens === "people" ? peopleView(report, history)
      : lens === "commune" ? communeView(report)
        : lens === "events" ? eventsView(events, filter)
          : worldView(report);
    body.innerHTML = view;
    body.setAttribute("aria-labelledby", `lens-${lens}`);
    filters.hidden = lens !== "events";
    return light;
  }

  lenses.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-lens]");
    if (!tab) return;
    lens = tab.dataset.lens;
    for (const node of lenses.querySelectorAll("[role=tab]")) {
      node.setAttribute("aria-selected", String(node === tab));
    }
    paint(true);
  });

  filters.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-filter]");
    if (!tab) return;
    filter = tab.dataset.filter;
    for (const node of filters.querySelectorAll("button")) {
      node.setAttribute("aria-pressed", String(node === tab));
    }
    paint(true);
  });

  button.addEventListener("click", () => setOpen(!open));
  closeBtn.addEventListener("click", () => setOpen(false));
  root.querySelector("[data-close]").addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open) setOpen(false);
  });

  return {
    paint: () => paint(false),
    lines() {
      return events.slice(0, 7).map((item) => `<li>${item.text}</li>`).join("");
    },
  };
}

function dialMarkup(report, light) {
  const dash = (light.progress * 100).toFixed(1);
  return `
    <svg viewBox="0 0 360 88" aria-hidden="true">
      <path pathLength="100" d="M28 78 A 152 62 0 0 1 332 78" class="track" />
      <path pathLength="100" d="M28 78 A 152 62 0 0 1 332 78" class="bead" data-phase="${light.phase}" stroke-dasharray="${dash} 100" />
    </svg>
    <p class="dial-day">${report.day}</p>
    <p class="dial-phase">${light.phaseLabel} · ${report.eraName}</p>`;
}
