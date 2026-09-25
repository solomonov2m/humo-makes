const KIND = {
  birth: "рождение",
  death: "смерть",
  era: "эпоха",
  home: "дома",
};

export function worldView(report) {
  const stages = report.stages.map((stage) => `
    <li data-state="${stage.state}">
      <i></i>
      <div><b>${stage.name}</b><small>${stage.blurb}</small></div>
    </li>`).join("");
  const pct = Math.round(report.meter * 100);
  return `
    <p class="goal">${report.goalText}</p>
    <div class="meter" role="meter" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Путь к следующей эпохе">
      <span style="width:${pct}%"></span>
    </div>
    <ol class="spine">${stages}</ol>`;
}

export function peopleView(report, history) {
  return `
    <div class="figures">
      ${figure(report.population, "сейчас живут")}
      ${figure(report.births, "родились")}
      ${figure(report.deaths, "умерли")}
    </div>
    ${bars([
      ["мужчины", report.males, report.population],
      ["женщины", report.females, report.population],
      ["взрослые", report.adults, report.population],
      ["дети", report.children, report.population],
    ])}
    ${spark(history)}`;
}

export function communeView(report) {
  const roads = report.roads || { tracks: 0, trails: 0, roads: 0 };
  return `
    <div class="figures">
      ${figure(report.homes, "домов готово")}
      ${figure(report.building, "ещё строят")}
      ${figure(report.families, "семей")}
    </div>
    ${bars([
      ["мастера", report.masters, Math.max(report.population, 1)],
      ["учатся", report.learners, Math.max(report.population, 1)],
      ["средний ум", Math.round(report.mind), 96],
      ["дороги", roads.roads, Math.max(roads.roads + roads.trails + roads.tracks, 1)],
    ])}
    <p class="quiet">Троп ${roads.trails}, следов ${roads.tracks}. Дорога появляется там, где люди ходят снова и снова.</p>`;
}

export function eventsView(events, filter) {
  const list = events.filter((item) => filter === "all" || item.kind === filter);
  if (!list.length) {
    return `<p class="quiet">Пока тихо. События появятся, когда сменятся сутки.</p>`;
  }
  return `<ul class="events">${list.map((item) => `
    <li>
      <span class="kind" data-kind="${item.kind}">${KIND[item.kind] || item.kind}</span>
      <span class="when">день ${item.day}</span>
      <p>${item.text}</p>
    </li>`).join("")}</ul>`;
}

function figure(value, label) {
  return `<div class="figure"><b>${value}</b><span>${label}</span></div>`;
}

function bars(rows) {
  return `<div class="bars">${rows.map(([label, value, max]) => {
    const pct = Math.round((value / Math.max(max, 1)) * 100);
    return `<div><span>${label}</span><i><b style="width:${pct}%"></b></i><em>${value}</em></div>`;
  }).join("")}</div>`;
}

function spark(history) {
  if (history.length < 2) return `<p class="quiet">Линия населения появится со следующего дня.</p>`;
  const max = Math.max(...history.map((d) => d.population), 1);
  const w = 320;
  const h = 72;
  const pts = history.map((d, i) => {
    const x = (i / (history.length - 1)) * w;
    const y = h - 8 - (d.population / max) * (h - 16);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last = history[history.length - 1];
  return `<figure class="spark"><svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts}" /></svg><figcaption>Население к дню ${last.day}: ${last.population}</figcaption></figure>`;
}
