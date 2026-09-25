// Список поселений и перенос взгляда на выбранное.

import { listHamlets } from "./hamlets.js";
import { TILE } from "./world.js";
import { zoomForPerson } from "./scale.js";

export function mountPlaces(listEl, { stage, getWorld, getAgents }) {
  let current = "";
  let stamp = "";

  listEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-hamlet]");
    if (!button) return;
    const world = getWorld();
    const agents = getAgents();
    const hamlet = listHamlets(world, agents).find((item) => item.key === button.dataset.hamlet);
    if (!hamlet) return;
    current = hamlet.key;
    const metrics = stage.metrics(world);
    const fit = metrics.scale / Math.max(stage.camera.zoom, 1e-6);
    stage.lookAt(world, hamlet.x * TILE + TILE / 2, hamlet.y * TILE + TILE / 2, zoomForPerson(fit, 5));
    paint(world, agents, true);
  });

  function paint(world, agents, force) {
    const hamlets = listHamlets(world, agents);
    const next = hamlets.map((item) => `${item.key}:${item.people}:${item.homes}`).join("|") + `#${current}`;
    if (!force && next === stamp) return;
    stamp = next;
    if (!hamlets.length) {
      listEl.innerHTML = `<p class="hint">Люди ещё не сложили жильё. Как появится первое поселение, оно будет здесь.</p>`;
      return;
    }
    listEl.innerHTML = hamlets.map((item) => `
      <button type="button" data-hamlet="${item.key}" aria-pressed="${item.key === current}">
        <span>${item.title}</span>
        <small>${item.ready} из ${item.homes} готово · ${item.people} чел.</small>
      </button>
    `).join("");
  }

  return {
    paint,
    clear() {
      current = "";
      stamp = "";
    },
  };
}
