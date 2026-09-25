// Часы движка: фаза суток и масштаб «1 реальная секунда = сколько игрового времени».

export const TICKS_PER_DAY = 120;

export const PHASE = {
  DAWN: "dawn",
  DAY: "day",
  DUSK: "dusk",
  NIGHT: "night",
};

export const PHASE_LABEL = {
  dawn: "Рассвет",
  day: "День",
  dusk: "Закат",
  night: "Ночь",
};

const DAWN_END = 0.12;
const DAY_END = 0.62;
const DUSK_END = 0.78;
export const NIGHT_FRACTION = 1 - DUSK_END;

export const RATES = {
  hungerPerDay: 11,
  thirstPerDay: 14,
  energyDrainPerDay: 8,
  sleepEnergy: 48,
  sleepNeed: 0.35,
  berryRegrowPerDay: 1.92,
};

export const DAY_SECONDS = 24 * 60 * 60;

const SCALE = {
  second: "1 с",
  minute: "1 мин",
  hour: "1 ч",
  day: "1 день",
  week: "1 нед",
};

export const SPEEDS = [
  { id: "second", label: "Секунда", gamePerReal: 1, watch: true },
  { id: "minute", label: "Минута", gamePerReal: 60, watch: true },
  { id: "hour", label: "Час", gamePerReal: 3600, watch: true },
  { id: "day", label: "Сутки", gamePerReal: DAY_SECONDS, watch: false },
  { id: "week", label: "Неделя", gamePerReal: DAY_SECONDS * 7, watch: false },
];

export function phaseAt(tickOfDay) {
  const t = tickOfDay / TICKS_PER_DAY;
  if (t < DAWN_END) return PHASE.DAWN;
  if (t < DAY_END) return PHASE.DAY;
  if (t < DUSK_END) return PHASE.DUSK;
  return PHASE.NIGHT;
}

export function phaseOf(fraction) {
  const t = Math.min(0.999, Math.max(0, fraction));
  if (t < DAWN_END) return PHASE.DAWN;
  if (t < DAY_END) return PHASE.DAY;
  if (t < DUSK_END) return PHASE.DUSK;
  return PHASE.NIGHT;
}

export function speedText(preset) {
  return `${preset.label} · 1 с = ${SCALE[preset.id]}`;
}

export class Clock {
  constructor() {
    this.day = 1;
    this.secondOfDay = DAY_SECONDS * 0.14;
    this.speedIndex = 2;
    this.bank = 0;
  }

  get preset() {
    return SPEEDS[this.speedIndex];
  }

  get phase() {
    return phaseOf(this.progress);
  }

  get progress() {
    return this.secondOfDay / DAY_SECONDS;
  }

  setSpeed(index) {
    const next = Math.max(0, Math.min(SPEEDS.length - 1, index));
    this.speedIndex = next;
    this.bank = 0;
  }

  advance(gameSeconds) {
    this.secondOfDay += Math.max(0, gameSeconds);
    let rolled = 0;
    while (this.secondOfDay >= DAY_SECONDS && rolled < 8) {
      this.secondOfDay -= DAY_SECONDS;
      this.day += 1;
      rolled += 1;
    }
    return rolled;
  }
}
