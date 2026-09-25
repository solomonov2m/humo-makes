// Языка нет, пока его не выдумали. Крик — общий. Слово чеканится своим звуком и потом чуть плывёт.

import { holds } from "./notions.js";

const CONS = "kptmnslrbg";
const VOWS = "aeiou";
const CALLS = ["aa", "mm", "kh", "uh", "nn"];

const SENSES = [
  { id: "food", gloss: "еда", test: (a) => a.state === "seek_food" || a.state === "gather" || a.hunger > 70 },
  { id: "water", gloss: "вода", test: (a) => a.state === "seek_water" || a.thirst > 70 },
  { id: "come", gloss: "сюда", test: (a) => a.state === "seek_mate" || a.state === "follow" },
  { id: "home", gloss: "кров", test: (a) => a.state === "build" || a.state === "seek_camp" || a.state === "carry" },
  { id: "rest", gloss: "спать", test: (a) => a.state === "rest" || a.state === "sleep" },
  { id: "hunt", gloss: "зверь", test: (a) => a.state === "hunt" },
  { id: "here", gloss: "тут", test: () => true },
];

function senseOf(agent) {
  return SENSES.find((row) => row.test(agent)) || SENSES[SENSES.length - 1];
}

function syllable(n) {
  const c = CONS[n % CONS.length];
  const v = VOWS[Math.floor(n / CONS.length) % VOWS.length];
  const tail = CONS[Math.floor(n / 17) % CONS.length];
  return n % 5 === 0 ? c + v : c + v + tail;
}

function coin(tongue, id) {
  let n = tongue.seed >>> 0;
  for (let i = 0; i < id.length; i += 1) n = Math.imul(n ^ id.charCodeAt(i), 16777619) >>> 0;
  const parts = [];
  const len = Object.keys(tongue.words).length > 4 ? 2 : 1;
  for (let i = 0; i < len; i += 1) {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    parts.push(syllable(n));
  }
  return parts.join("");
}

function shift(form, salt) {
  const i = salt % form.length;
  const pool = VOWS.includes(form[i]) ? VOWS : CONS;
  const at = pool.indexOf(form[i]);
  const next = pool[(at + 1 + (salt % 3)) % pool.length];
  return form.slice(0, i) + next + form.slice(i + 1);
}

function tongueOf(culture) {
  if (!culture.tongue) culture.tongue = { seed: (culture.kept + 3) * 7919 + 17, words: {}, heard: 0 };
  return culture.tongue;
}

export function hear(agent, neighbors, culture) {
  if (!agent.alive || !culture || !holds(agent, "Слово")) return;
  if (!neighbors.some((other) => other.alive && other !== agent)) return;
  const tongue = tongueOf(culture);
  const sense = senseOf(agent);
  if (!tongue.words[sense.id]) tongue.words[sense.id] = coin(tongue, sense.id);
  tongue.heard += 1;
  if (agent.isChild && tongue.heard % 480 === 0) {
    const ids = Object.keys(tongue.words);
    const id = ids[tongue.heard % ids.length];
    tongue.words[id] = shift(tongue.words[id], tongue.heard + agent.id);
  }
}

export function say(agent, culture) {
  const sense = senseOf(agent);
  const word = culture && culture.tongue && culture.tongue.words[sense.id];
  if (holds(agent, "Слово") && word) return word;
  const n = agent.id + sense.id.charCodeAt(0);
  return CALLS[Math.abs(n) % CALLS.length];
}

export function tongueLine(culture) {
  const words = (culture && culture.tongue && culture.tongue.words) || {};
  const rows = SENSES.filter((row) => words[row.id]).map((row) => `${words[row.id]} — ${row.gloss}`);
  if (!rows.length) return "Своего языка ещё нет: рядом только крик, не слова.";
  return `Их слова, как мы их слышим: ${rows.join("; ")}.`;
}
