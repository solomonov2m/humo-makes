// Поле внимания одного жителя: что он сейчас удерживает и насколько ясен ум.
// Это состояние модели, а не доказательство человеческого сознания.

import { feelingName, strongestFeeling } from "./feelings.js";

const ORDER = ["pain", "fear", "thirst", "hunger", "cold", "fatigue", "curiosity"];

export function wakeMind(agent) {
  const feelings = agent.feelings;
  if (!feelings) {
    agent.aware = { clarity: 0, focus: "", notice: [] };
    return agent.aware;
  }
  const asleep = agent.activity === "спит";
  const store = agent.body && agent.body.store;
  const glucose = store ? Math.min(1, store.glucose / 1.1) : 0.4;
  const sleep = agent.nerve ? agent.nerve.pressure : 0;
  const brain = agent.body && agent.body.organs && agent.body.organs.brain;
  const wall = store ? Math.min(store.lys, store.met, store.thr) : 0.4;
  let clarity = glucose * 0.62 + (1 - sleep) * 0.38 - feelings.pain * 0.5;
  if (!brain || brain.grams < 40) clarity *= 0.45;
  if (wall < 0.12) clarity *= 0.55;
  if (asleep) clarity = 0.04;
  clarity = Math.max(0, Math.min(1, clarity));
  const lead = strongestFeeling(feelings);
  const notice = [];
  if (asleep) notice.push("сон");
  for (const key of ORDER) {
    if (feelings[key] >= 0.35) notice.push(feelingName(key));
    if (notice.length >= 3) break;
  }
  agent.aware = {
    clarity,
    focus: asleep ? "сон" : feelingName(lead.key),
    notice,
  };
  return agent.aware;
}

export function pushFeelings(agent, scores) {
  const feelings = agent.feelings;
  const aware = agent.aware;
  if (!feelings || !aware) return "";
  if (aware.clarity < 0.22) return leadBody(scores, feelings);
  scores[0] += feelings.thirst * 1.35;
  scores[1] += feelings.hunger * 1.15;
  scores[4] += feelings.pain * 0.85 + feelings.cold * 0.45;
  scores[8] += feelings.fatigue * 1.05;
  scores[2] -= feelings.fear * 1.4 + feelings.pain * 0.7;
  scores[3] -= feelings.fear * 0.8;
  scores[7] += feelings.fear * 0.9 + feelings.curiosity * aware.clarity * 0.45;
  return "";
}

export function feelInputs(agent) {
  const feelings = agent.feelings || {};
  const aware = agent.aware || {};
  return [
    feelings.pain || 0,
    feelings.fear || 0,
    feelings.fatigue || 0,
    aware.clarity || 0,
  ];
}

export function feelingHTML(agent) {
  if (!agent.alive) return `<p class="note">Чувств нет: тело мертво, связи молчат.</p>`;
  const feelings = agent.feelings;
  const aware = agent.aware;
  if (!feelings || !aware) return `<p class="hint">Ум ещё не очнулся.</p>`;
  const clarity = Math.round(aware.clarity * 100);
  const held = aware.notice.length ? aware.notice.join(", ") : "тихо";
  const rows = ["pain", "hunger", "thirst", "cold", "fear", "fatigue", "curiosity", "ease"].map((key) => {
    const value = Math.round((feelings[key] || 0) * 100);
    return `<div class="stat"><div class="top"><span>${feelingName(key)}</span><b>${value}</b></div><div class="bar" aria-hidden="true"><span style="width:${value}%"></span></div></div>`;
  }).join("");
  return `
    <p class="note">Ясность ${clarity}. Сейчас в уме: ${held}. Сильнее всего — ${aware.focus}.</p>
    ${rows}
  `;
}

const LEAD_AT = { drink: 0, eat: 1, rest: 4, wander: 7, sleep: 8 };

function leadBody(scores, feelings) {
  const lead = bodyLead(feelings);
  if (LEAD_AT[lead] != null) scores[LEAD_AT[lead]] += 0.85;
  return lead;
}

function bodyLead(feelings) {
  if (feelings.fear > 0.62) return "wander";
  if (feelings.thirst > 0.68) return "drink";
  if (feelings.hunger > 0.68) return "eat";
  if (feelings.fatigue > 0.7) return "sleep";
  if (feelings.pain > 0.55) return "rest";
  return "";
}
