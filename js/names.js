const MALE = [
  "Ратибор", "Мирослав", "Яромир", "Святогор", "Боян", "Горислав",
  "Всеслав", "Тихомир", "Любомир", "Бранислав", "Радимир", "Велимир",
  "Златомир", "Воислав", "Мечислав", "Станимир", "Будимир", "Огнеслав",
  "Велемир", "Драгомир", "Владимир", "Святослав", "Ярослав", "Мстислав",
  "Ростислав", "Добромир", "Светозар", "Ратимир", "Пересвет", "Вышеслав",
];

const FEMALE = [
  "Мирослава", "Яромира", "Любава", "Светозара", "Злата", "Рада",
  "Власта", "Бояна", "Горислава", "Всеслава", "Тихомира", "Бранислава",
  "Велимира", "Воислава", "Станимира", "Лада", "Мила", "Зорница",
  "Драгомира", "Ярослава", "Мстислава", "Ростислава", "Добромила",
  "Радмила", "Людмила", "Светлана", "Милана", "Забава", "Неждана", "Владимира",
];

const CLANS = [
  "Волков", "Медведев", "Оленев", "Лосев", "Бобров", "Соколов",
  "Ключев", "Озерский", "Луговой", "Рощин", "Речной", "Каменный",
  "Горный", "Полевой", "Лесной", "Берестов", "Дубов", "Кленов",
  "Ясенев", "Ивовый", "Тропин", "Бродов", "Заречный", "Прибрежный",
  "Холмов", "Овражный", "Родников", "Студёный", "Тихий", "Быстрый",
  "Серый", "Рыжий", "Черный", "Белый", "Кремень", "Огнив",
  "Костров", "Шкурный", "Костяной", "Кремнёв", "Сетевой", "Луков",
  "Копьев", "Топорный", "Плетенный", "Корзин", "Мехов", "Жировой",
  "Ягодный", "Орехов", "Корень", "Мохов", "Травяной", "Цветков",
  "Зорькин", "Ночной", "Дневной", "Ветреный", "Туманный", "Громов",
  "Дождев", "Снежков", "Теплов", "Студёнов", "Солёный", "Пресный",
];

let clansLeft = [];

export function resetLineages() {
  clansLeft = CLANS.slice();
}

function takeClan() {
  if (!clansLeft.length) clansLeft = CLANS.slice();
  const i = Math.floor(Math.random() * clansLeft.length);
  return clansLeft.splice(i, 1)[0];
}

function pick(pool, avoid) {
  let name = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length < 2) return name;
  while (name === avoid) name = pool[Math.floor(Math.random() * pool.length)];
  return name;
}

export function patronymic(fatherGiven, sex) {
  const stem = fatherGiven.endsWith("й") ? fatherGiven.slice(0, -1) + "е" : fatherGiven;
  return sex === "F" ? `${stem}овна` : `${stem}ович`;
}

export function giveName(agent, father) {
  if (father) {
    agent.given = pick(agent.sex === "F" ? FEMALE : MALE);
    agent.fatherGiven = father.given;
    agent.family = father.family;
    agent.fatherId = father.id;
    return;
  }
  agent.fatherGiven = pick(MALE);
  agent.given = pick(agent.sex === "F" ? FEMALE : MALE, agent.fatherGiven);
  agent.family = takeClan();
  agent.fatherId = null;
}

export function fullName(agent) {
  return `${agent.given} ${patronymic(agent.fatherGiven, agent.sex)} ${agent.family}`;
}
