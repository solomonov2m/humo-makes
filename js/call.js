// Имя, которое житель даёт вещи, и зачем она ему.

const CROPS = ["репа", "ячмень", "пшеница"];

export function speechOf(tool) {
  if (tool.face >= 6 && tool.shaft >= 7) return { call: "тягалка", need: "сдвинуть землю, которую руками не удержать" };
  if (tool.face <= 2 && tool.shaft >= 7) return { call: "доставала", need: "достать зверя дальше руки" };
  if (tool.face <= 2) return { call: "остриё", need: "резать то, что зубы не берут" };
  if (tool.shaft >= 7) return { call: "древко", need: "бить дальше, чем достаёт кулак" };
  return { call: "край", need: "резать и бить тем, что крепче ладони" };
}

export function christenTool(agent, tool) {
  const speech = speechOf(tool);
  tool.call = speech.call;
  tool.need = speech.need;
  tool.maker = agent.name;
  tool.makerId = agent.id;
}

export function christenHouse(agent, house) {
  house.need = "холодно";
  house.maker = agent.name;
  house.makerId = agent.id;
}

export function christenField(agent, field) {
  field.call = CROPS[field.crop] || CROPS[0];
  field.need = "дикая еда у жилья кончается";
  field.maker = agent.name;
  field.makerId = agent.id;
}
