import { GENES } from "./genome.js";
import { skillBand } from "./skills.js";
import { homeCard } from "./housing.js";
import { appearance, lookSentence } from "./appearance.js";
import { chainHTML, personLoreHTML } from "./lore.js";
import { artsHTML } from "./emerge.js";
import { bodyLine, nerveLine } from "./body.js";
import { organLine } from "./organs.js";
import { rotLine } from "./rot.js";
import { nerveRead } from "./nerves.js";
import { ideaLine } from "./ideas.js";
import { memoryLine } from "./memory.js";
import { planLine } from "./prefrontal.js";
import { choiceLine } from "./choice-log.js";
import { feelingHTML } from "./aware.js";
import { deviceLine } from "./tool-draw.js";
import { pocketLine } from "./matter.js";
import {
  GENE_META,
  SKILL_META,
  SKILL_ORDER,
  activeSkill,
  ageParts,
  bandLabel,
  cap,
  clothHint,
  esc,
  formatAge,
  mindSentence,
  mindWord,
  placePhrase,
  sexName,
  stageName,
} from "./text.js";

function bar(value, cls = "") {
  const width = Math.max(0, Math.min(100, value));
  return `<div class="bar" aria-hidden="true"><span class="${cls}" style="width:${width}%"></span></div>`;
}

function personButton(agent) {
  if (!agent) return `<span class="miss">уже нет в памяти мира</span>`;
  const dead = agent.alive ? "" : " · умер";
  return `<button type="button" class="kin-btn" data-pick="${agent.id}">${esc(agent.name)} · ${esc(formatAge(agent.age))}${dead}</button>`;
}

export function civHTML(report) {
  const meter = Math.round(report.meter * 100);
  const stages = report.stages.map((stage) => (
    `<li class="${stage.state}">${esc(stage.name)}</li>`
  )).join("");
  const facts = [
    ["День", report.day],
    ["Люди", report.population],
    ["Взрослые", report.adults],
    ["Дети", report.children],
    ["Кладки", report.shelters || 0],
    ["Жилище", report.housingTech ? "изучено" : "ещё нет"],
    ["Тропы / дороги", report.roads ? `${report.roads.trails} / ${report.roads.roads}` : "0 / 0"],
    ["Строятся", report.building],
    ["Поля", report.crops ? report.crops.fields : 0],
    ["Репа / ячмень / пшеница", report.crops ? `${report.crops.turnip} / ${report.crops.barley} / ${report.crops.wheat}` : "0 / 0 / 0"],
    ["Семьи", report.families],
    ["Средний ум", Math.round(report.mind)],
  ].map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("");

  return `
    <p class="eyebrow">Прогресс цивилизации</p>
    <h2>${esc(report.eraName)}</h2>
    <p class="blurb">${esc(report.eraBlurb)}</p>
    <div class="meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${meter}" aria-label="Прогресс к следующей эпохе">
      <span style="width:${meter}%"></span>
    </div>
    <p class="goal">${esc(report.goalText)}</p>
    <ol class="track">${stages}</ol>
    ${chainHTML(report.lore)}
    ${artsHTML(report.arts)}
    <dl class="facts">${facts}</dl>
    <p class="quiet">Родилось ${report.births} · умерло ${report.deaths} · мужчин ${report.males}, женщин ${report.females}</p>
  `;
}

function skillSummary(agent) {
  const active = activeSkill(agent);
  const got = [];
  const good = [];
  const learning = [];
  for (const key of SKILL_ORDER) {
    const level = agent.skills[key];
    const band = skillBand(level);
    const title = SKILL_META[key].title.toLowerCase();
    const can = SKILL_META[key].can;
    if (band === "good" || band === "master") {
      got.push(title);
      good.push(can);
    } else if (band === "got") {
      got.push(title);
    }
    const developing = band === "learn" || (key === active && band !== "good" && band !== "master" && band !== "got");
    if (developing) learning.push(title);
  }
  return {
    got: got.length ? `Получены: ${got.join(", ")}.` : "Полученных навыков пока нет — они только начинают складываться.",
    learning: learning.length ? `Развивает: ${learning.join(", ")}.` : "Сейчас ни один навык заметно не растёт.",
    good: good.length ? `Хорошо умеет: ${good.join(", ")}.` : "Явного мастерства пока нет.",
  };
}

function homeBlock(agent, world) {
  const where = agent.house ? placePhrase(world, agent.house.x, agent.house.y) : "";
  return homeCard(agent, where);
}

export function personHTML(agent, sim) {
  const byId = new Map(sim.agents.map((a) => [a.id, a]));
  const years = ageParts(agent.age);
  const satiety = Math.round(100 - agent.hunger);
  const energy = Math.round(agent.energy);
  const mind = Math.round(agent.mind);
  const capMind = Math.round(agent.mindCap);
  const summary = skillSummary(agent);
  const home = homeBlock(agent, sim.world);
  const look = appearance(agent);
  const doing = agent.alive ? agent.activity : `${stageName(agent)} · ${rotLine(agent)}`;

  const skills = SKILL_ORDER.map((key) => {
    const level = agent.skills[key];
    const raw = skillBand(level);
    const band = raw === "none" && key === activeSkill(agent) ? "learn" : raw;
    const meta = SKILL_META[key];
    return `
      <div class="skill">
        <div class="top"><span>${meta.title}</span><b class="pill ${band}">${bandLabel(band)}</b></div>
        ${bar((level / 5) * 100, band)}
      </div>
    `;
  }).join("");

  const genes = GENES.map((key) => {
    const value = agent.genome.values[key];
    const [label, hint] = GENE_META[key];
    return `
      <div class="stat gene">
        <div class="top"><span>${label}</span><b>${Math.round(value * 100)}</b></div>
        <p class="hint">${hint}</p>
        ${bar(value * 100)}
      </div>
    `;
  }).join("");

  const partner = agent.partnerId ? byId.get(agent.partnerId) : null;
  const parents = agent.parents.map((id) => byId.get(id));
  const kids = agent.childrenIds.map((id) => byId.get(id)).filter(Boolean);
  const kidButtons = kids.length
    ? kids.slice(0, 8).map(personButton).join("") + (kids.length > 8 ? `<p class="hint">И ещё ${kids.length - 8}.</p>` : "")
    : `<p class="hint">Детей нет.</p>`;
  const parentBlock = agent.parents.length
    ? agent.parents.map((id) => personButton(byId.get(id))).join("")
    : `<p class="hint">Из первого поколения: появился вместе с миром.</p>`;

  const who = `
    <p class="kicker">${esc(sexName(agent))} · #${agent.id}</p>
    <h2 class="name">${esc(agent.name)}</h2>
    <p class="meta">${esc(stageName(agent))} · ${esc(formatAge(agent.age))}</p>
    <p class="doing ${agent.alive ? "" : "dead"}">${esc(doing)}</p>
  `;

  const body = `
    <section class="block">
      <h3>Жизнь</h3>
      <div class="metric">
        <b class="hero-num">${years.num}</b>
        <div><strong>${esc(years.unit)}</strong><p class="hint">${esc(formatAge(agent.age).replace(/\.$/, ""))}. Когда кончится, не известно: решает тело и то, что случится.</p></div>
      </div>
      <div class="stat">
        <div class="top"><span>Сытость</span><b>${satiety}%</b></div>
        ${bar(satiety, satiety < 35 ? "warn" : "good")}
      </div>
      <div class="stat">
        <div class="top"><span>Энергия</span><b>${energy}%</b></div>
        ${bar(energy, energy < 30 ? "warn" : "")}
      </div>
    </section>

    <section class="block">
      <h3>Ум</h3>
      <div class="metric">
        <b class="hero-num">${mind}</b>
        <div><strong>${esc(cap(mindWord(agent)))}</strong><p class="hint">из возможных ${capMind}</p></div>
      </div>
      ${bar((mind / capMind) * 100)}
      <p class="note">${esc(mindSentence(agent))}</p>
      <p class="hint">${esc(memoryLine(agent))} ${esc(planLine(agent))}</p>
      <p class="note">${esc(choiceLine(agent))}</p>
      <h3>Сознание</h3>
      ${feelingHTML(agent)}
    </section>

    <section class="block">
      <h3>Тело</h3>
      <p class="note">${esc(bodyLine(agent))}</p>
      <p class="hint">${esc(organLine(agent))}</p>
      <p class="hint">${esc(nerveLine(agent))}</p>
      <p class="hint">${esc(nerveRead(agent))}</p>
      <p class="hint">${esc(pocketLine(agent))} ${esc(deviceLine(agent))}</p>
      <p class="note">${esc(ideaLine(agent))}</p>
    </section>

    <section class="block">
      <h3>Навыки</h3>
      <p class="callout">${esc(summary.good)}</p>
      <p class="callout alt">${esc(summary.got)}</p>
      <p class="callout warm">${esc(summary.learning)}</p>
      ${skills}
    </section>

    <section class="block">
      <h3>Знания</h3>
      ${personLoreHTML(agent, sim.culture)}
    </section>

    <section class="block">
      <h3>Дом</h3>
      <div class="home ${home.cls}">
        <b>${esc(home.title)}</b>
        <p>${esc(home.detail)}</p>
        ${home.cls === "none" ? "" : bar(home.progress, home.cls === "done" ? "good" : "warn")}
      </div>
    </section>

    <section class="block">
      <h3>Семья</h3>
      <p class="label">Пара</p>
      ${partner ? personButton(partner) : `<p class="hint">Пары нет.</p>`}
      <p class="label">Дети · ${kids.length}</p>
      <div class="kin">${kidButtons}</div>
      <p class="label">Родители</p>
      <div class="kin">${parentBlock}</div>
    </section>

    <section class="block">
      <h3>Внешность</h3>
      <p class="note">${esc(lookSentence(agent))} Телосложение ${look.sturdy}. ${clothHint(agent)}</p>
    </section>

    <section class="block">
      <h3>Природа</h3>
      <p class="hint">Это врождённые задатки от 0 до 100. Навыки выше — то, чему человек успел научиться.</p>
      ${genes}
    </section>
  `;

  return { who, body, look: lookSentence(agent) };
}
