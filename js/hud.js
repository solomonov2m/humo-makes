// Листы вызываются снизу. На карте остаётся только то, что смотришь.

import { islandHTML, missionHTML } from "./missions.js";
import { esc } from "./text.js";

const TITLES = { missions: "Миссии", people: "Люди", island: "Остров" };

export function mountHud({ getSim, getSelected, getPicked, onPick }) {
  const visor = document.getElementById("visor");
  const eyes = document.getElementById("eyes");
  const summon = document.getElementById("summon");
  const sheet = document.getElementById("sheet");
  const title = document.getElementById("sheetTitle");
  const missions = document.getElementById("sheetMissions");
  const people = document.getElementById("sheetPeople");
  const island = document.getElementById("sheetIsland");
  const quests = document.getElementById("islandQuests");
  const eyeKicker = document.getElementById("eyeKicker");
  const eyeName = document.getElementById("eyeName");
  const eyeDoing = document.getElementById("eyeDoing");
  const eyeWho = document.getElementById("eyeWho");
  let open = "";
  let dismissed = null;
  let peopleStamp = "";
  let missionStamp = "";
  let islandStamp = "";

  summon.addEventListener("click", (event) => {
    const button = event.target.closest("[data-sheet]");
    if (!button) return;
    if (button.dataset.sheet === "eyes") {
      toggleEyes();
      return;
    }
    setOpen(open === button.dataset.sheet ? "" : button.dataset.sheet);
  });
  document.getElementById("sheetClose").addEventListener("click", () => setOpen(""));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && open) setOpen("");
  });
  people.addEventListener("click", (event) => {
    const button = event.target.closest("[data-pick]");
    if (button) onPick(Number(button.dataset.pick));
  });
  eyeWho.addEventListener("click", () => {
    if (eyeWho.dataset.pick) onPick(Number(eyeWho.dataset.pick));
  });

  function toggleEyes() {
    const agent = getSelected();
    if (!agent || !agent.alive) {
      setOpen("people");
      return;
    }
    const hide = !visor.hidden && !eyes.hidden;
    dismissed = hide ? agent.id : null;
    paint(true);
  }

  function setOpen(next) {
    open = next;
    sheet.hidden = !open;
    missions.hidden = open !== "missions";
    people.hidden = open !== "people";
    island.hidden = open !== "island";
    title.textContent = TITLES[open] || "";
    if (open) paint(true);
    else mark();
  }

  function mark() {
    for (const button of summon.querySelectorAll("[data-sheet]")) {
      const id = button.dataset.sheet;
      const on = id === "eyes" ? !visor.hidden && !eyes.hidden : id === open;
      button.setAttribute("aria-pressed", String(on));
    }
  }

  function paint(force) {
    const sim = getSim();
    const agent = getSelected();
    showVisor(agent, getPicked());
    if (open === "missions") fill(missions, missionHTML(agent), "mission", force);
    if (open === "island") fill(quests, islandHTML(sim), "island", force);
    if (open === "people") paintPeople(sim, agent, force);
    mark();
  }

  function showVisor(agent, picked) {
    const live = Boolean(agent && agent.alive && dismissed !== agent.id);
    visor.hidden = !live && !picked;
    eyes.hidden = !live;
    if (live) {
      eyeKicker.textContent = "Его глазами";
      eyeName.textContent = agent.name;
      eyeWho.hidden = true;
      return;
    }
    if (!picked) return;
    eyeKicker.textContent = picked.maker || "Предмет";
    eyeName.textContent = picked.title;
    eyeDoing.textContent = `Нужно, чтобы ${picked.need}.`;
    eyeWho.hidden = !picked.makerId;
    if (picked.makerId) {
      eyeWho.dataset.pick = String(picked.makerId);
      eyeWho.textContent = `Глазами ${picked.maker}`;
    }
  }

  function fill(node, html, kind, force) {
    const slot = kind === "mission" ? missionStamp : islandStamp;
    if (!force && html === slot) return;
    if (kind === "mission") missionStamp = html;
    else islandStamp = html;
    node.innerHTML = html;
  }

  function paintPeople(sim, agent, force) {
    const id = agent ? agent.id : 0;
    const alive = sim.agents.filter((item) => item.alive);
    const stamp = `${id}|${alive.map((item) => item.id).join(",")}`;
    if (force || stamp !== peopleStamp) {
      peopleStamp = stamp;
      people.innerHTML = alive.length
        ? alive.map((item) => `
          <button type="button" data-pick="${item.id}">
            <span>${esc(item.name)}</span>
            <small></small>
          </button>`).join("")
        : `<p class="hint">На острове никого нет.</p>`;
    }
    for (const button of people.querySelectorAll("[data-pick]")) {
      const person = alive.find((item) => item.id === Number(button.dataset.pick));
      const small = button.querySelector("small");
      const text = person ? person.activity || "живёт" : "";
      if (small && small.textContent !== text) small.textContent = text;
      button.setAttribute("aria-pressed", String(Boolean(person) && person.id === id));
    }
  }

  return {
    paint,
    watch(agent) {
      if (agent && agent.alive) dismissed = null;
      paint(true);
    },
    clear() {
      dismissed = null;
      peopleStamp = "";
      missionStamp = "";
      islandStamp = "";
      setOpen("");
      paint(true);
    },
    setDoing(text) {
      if (!eyes.hidden) eyeDoing.textContent = text;
    },
  };
}
