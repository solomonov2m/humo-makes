// Дела копятся по одному: закрытое остаётся, следующее ещё спрятано.

import { ADULT_DAYS, SKILL_META, esc } from "./text.js";
import { eraView } from "./era.js";
import { stuff } from "./elements.js";

const CRAFT = ["hunt", "fish", "farm", "craft", "raft"];

export function missionHTML(agent) {
  if (!agent) return `<p class="hint">Выбери человека на карте. Его дела откроются по одному.</p>`;
  if (!agent.alive) {
    return `<section class="quest"><h3>${esc(agent.name)}</h3><p class="hint">Этот человек уже не идёт.</p></section>`;
  }
  return block(agent.name, mark(personSteps(agent)));
}

export function islandHTML(sim) {
  const view = eraView(sim.culture);
  const items = view.stages.map((stage) => ({
    title: stage.name,
    detail: stage.blurb,
    done: stage.state === "done",
    meter: stage.state === "now" ? view.meter : stage.state === "done" ? 1 : 0,
  }));
  return block("", mark(items), view.goalText) + techHTML(sim.culture) + landHTML(sim.world);
}

function landHTML(world) {
  const isles = world.farIsles || [];
  if (!isles.length) return "";
  const found = isles.filter((isle) => isle.visited).length;
  const rafts = (world.rafts || []).length;
  const sailing = rafts ? ` В воде сейчас ${rafts} ${rafts === 1 ? "плот" : "плота"}.` : "";
  return `<section class="quest"><h3>Земли за проливом</h3><p class="hint">Открыто ${found} из ${isles.length}.${sailing}</p></section>`;
}

function techHTML(culture) {
  const found = (culture && culture.found) || {};
  const names = Object.keys(found);
  const list = names.length
    ? `<ul class="tech">${names.map((name) => `<li><b>${esc(name)}</b><span>${esc(found[name])}</span></li>`).join("")}</ul>`
    : `<p class="hint">Ни одной догадки ещё не додумали.</p>`;
  const metal = (culture && culture.metal) || {};
  const stock = Object.keys(metal).filter((id) => metal[id] > 1);
  const stockLine = stock.length
    ? `<p class="hint">Запас: ${stock.map((id) => `${esc(stuff(id) ? stuff(id).name : id)} ${Math.round(metal[id])} г`).join(", ")}.</p>`
    : "";
  const coin = Math.round((culture && culture.coin) || 0);
  const coinLine = coin > 0 ? `<p class="hint">В обороте рынка: ${coin} монет.</p>` : "";
  return `<section class="quest"><h3>Догадки</h3>${list}${stockLine}${coinLine}</section>`;
}

function personSteps(agent) {
  const food = agent.skills.food || 0;
  const water = agent.skills.water || 0;
  const eat = step("Поесть", "руки учатся брать еду", food / 0.35, food >= 0.35);
  const drink = step("Найти воду", "без воды день не держится", water / 0.35, water >= 0.35);
  if (agent.isChild) {
    return [eat, drink, step("Вырасти", "детские дни", agent.age / ADULT_DAYS, false)];
  }
  const roof = agent.house ? agent.house.progress || 0 : 0;
  const craft = bestCraft(agent);
  const pair = Boolean(agent.partnerId);
  const kids = (agent.childrenIds || []).length;
  return [
    eat,
    drink,
    step("Сложить кров", "крыша над головой", roof, roof >= 1),
    step("Своё дело", craft.detail, craft.level / 1.7, craft.level >= 1.7),
    step("Найти пару", "рядом свой человек", pair ? 1 : 0, pair),
    step("Продолжить род", kids ? `детей: ${kids}` : "пока один", kids ? 1 : 0, kids > 0),
  ];
}

function bestCraft(agent) {
  let key = "craft";
  let level = 0;
  for (const name of CRAFT) {
    const value = agent.skills[name] || 0;
    if (value > level) {
      level = value;
      key = name;
    }
  }
  return { level, detail: level > 0.2 ? SKILL_META[key].can : "руки ещё ищут дело" };
}

function step(title, detail, meter, done) {
  return { title, detail, meter: Math.max(0, Math.min(1, meter)), done: Boolean(done) };
}

function mark(steps) {
  let open = false;
  return steps.map((item) => {
    if (item.done) return { ...item, state: "done" };
    if (!open) {
      open = true;
      return { ...item, state: "now" };
    }
    return { ...item, state: "wait" };
  });
}

function block(title, items, nowLine) {
  const done = items.filter((item) => item.state === "done");
  const shown = done.slice(-3);
  const hidden = done.length - shown.length;
  const waits = items.filter((item) => item.state === "wait");
  const current = items.find((item) => item.state === "now");
  const rows = [
    ...shown.map((item) => row(item)),
    current ? row(current, nowLine) : "",
    waits[0] ? row({ ...waits[0], detail: "откроется следом" }) : "",
  ].join("");
  const earlier = hidden ? `<p class="hint">Раньше закрыто: ${hidden}.</p>` : "";
  const later = waits.length > 1 ? `<p class="hint">Дальше ещё ${waits.length - 1}.</p>` : "";
  const head = title ? `<h3>${esc(title)}</h3>` : "";
  return `<section class="quest">${head}${earlier}<ol>${rows}</ol>${later}</section>`;
}

function row(item, nowLine) {
  const detail = item.state === "now" && nowLine ? nowLine : item.detail;
  const meter = item.state === "now"
    ? `<i><em style="width:${Math.round(item.meter * 100)}%"></em></i>`
    : "";
  return `<li class="${item.state}"><b>${esc(item.title)}</b><span>${esc(detail)}</span>${meter}</li>`;
}
