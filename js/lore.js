// Знание держится у человека. Община помнит только то, что кто-то уже додумал или перенял.

import { feel, holds, notice } from "./notions.js";
import { lawRows, passLaws } from "./laws.js";
import { hear, tongueLine } from "./tongue.js";

export function knows(culture, name) {
  return !!(culture && culture.found && culture.found[name]);
}

export function freshCulture() {
  return { kept: 0, found: {}, laws: {}, last: "", lastLaw: "", paths: 0, warm: null, ache: 0, metal: {}, coin: 0 };
}

export function advanceLore(agent, neighbors, culture, world) {
  if (!agent.alive) return null;
  if (!agent.ideas) agent.ideas = {};
  feel(agent, culture);
  learn(agent, neighbors, culture);
  passLaws(agent, neighbors);
  const found = notice(agent, neighbors, culture, world);
  hear(agent, neighbors, culture);
  return found;
}

function learn(agent, neighbors, culture) {
  if (!agent.lesson || agent.ideas[agent.lesson]) agent.lesson = pickLesson(agent, neighbors);
  if (!agent.lesson) return;
  const teachers = neighbors.filter((n) => n.alive && n.ideas && n.ideas[agent.lesson]);
  if (!teachers.length) {
    agent.lesson = "";
    return;
  }
  const parent = teachers.some((n) => agent.parents && agent.parents.includes(n.id));
  const need = 1.2 + Object.keys(agent.ideas).length * 0.25;
  agent.study = (agent.study || 0) + teachRate(agent, parent, agent.isChild);
  if (agent.study < need) return;
  agent.study = 0;
  agent.ideas[agent.lesson] = true;
  agent.known = Object.keys(agent.ideas).length;
  agent.lesson = "";
}

function pickLesson(agent, neighbors) {
  for (const other of neighbors) {
    if (!other.alive || !other.ideas) continue;
    for (const name of Object.keys(other.ideas)) {
      if (!agent.ideas[name]) return name;
    }
  }
  return "";
}

export function loreView(culture) {
  const found = Object.keys(culture.found || {});
  return {
    found,
    laws: lawRows(culture),
    warm: culture.warm || null,
    last: culture.last || "",
    lastLaw: culture.lastLaw || "",
    kept: found.length,
    tongue: tongueLine(culture),
  };
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

export function chainHTML(view) {
  const laws = (view.laws || []).map((law) => `${law.name} — ${law.use}`).join("; ");
  const known = view.found.length ? view.found.join(", ") : "пока ничего";
  const warm = view.warm
    ? `Кто-то сам близок к «${view.warm.name}»: ${view.warm.why}.`
    : "Новой идеи нет. Она явится у того, кому тесно и у кого под рукой средство.";
  return `
    <p class="eyebrow">Свои догадки</p>
    <p class="goal">${esc(warm)}</p>
    <p class="hint">Понятые законы: ${esc(laws || "пока ни одного")}.</p>
    <p class="hint">Уже додумались: ${esc(known)}.</p>
    <p class="hint">${esc(view.tongue || "")}</p>
  `;
}

export function personLoreHTML(agent) {
  const held = Object.keys(agent.laws || {});
  const laws = held.length ? `Держит законы: ${held.join(", ")}.` : "Законов пока не понял.";
  const use = agent.lawUse ? ` Применяет: ${agent.lawUse}.` : "";
  const names = Object.keys(agent.ideas || {});
  const last = names.length ? names[names.length - 1] : "ничего";
  let next = "своей новой догадки сейчас нет";
  if (agent.lesson) next = `перенимает «${agent.lesson}» у того, кто уже понял`;
  else if (agent.warm) next = `сам додумывает «${agent.warm}»`;
  return `<p class="note">${esc(laws)}${esc(use)}</p><p class="note">Понял сам или от людей: ${esc(names.join(", ") || "ничего")}. Последнее: ${esc(last)}.</p><p class="hint">${esc(cap(next))}.</p>`;
}

function teachRate(agent, parent, child) {
  let rate = parent ? 0.2 : child ? 0.1 : 0.05;
  if (holds(agent, "Слово")) rate *= 1.45;
  if (holds(agent, "Письмо")) rate *= 1.35;
  if (holds(agent, "Печать")) rate *= 1.45;
  return rate;
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
