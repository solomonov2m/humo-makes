export function showThing(els, thing) {
  if (!thing) {
    els.card.hidden = true;
    return;
  }
  els.card.hidden = false;
  els.title.textContent = thing.title;
  els.call.textContent = thing.maker ? `${thing.maker} зовёт это «${thing.title}».` : "Жители ещё не дали имени.";
  els.need.textContent = `Нужно, чтобы ${thing.need}.`;
  if (thing.makerId) {
    els.who.hidden = false;
    els.who.dataset.pick = String(thing.makerId);
    els.who.textContent = thing.maker;
  } else els.who.hidden = true;
}

export function placeTag(els, thing, canvas, m) {
  if (!thing || thing.x == null) {
    els.tag.hidden = true;
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const sx = (thing.x * m.scale + m.ox) * (rect.width / canvas.width);
  const sy = (thing.y * m.scale + m.oy) * (rect.height / canvas.height);
  els.tag.hidden = false;
  els.tagTitle.textContent = thing.title;
  els.tagNeed.textContent = thing.maker ? `${thing.maker}: ${thing.need}` : thing.need;
  els.tag.style.left = `${Math.min(rect.width - 180, Math.max(8, sx + 12))}px`;
  els.tag.style.top = `${Math.max(8, sy - 28)}px`;
}
