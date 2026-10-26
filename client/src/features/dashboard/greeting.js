/** Приветствие по времени суток: ночь 0–4, утро 5–11, день 12–17, вечер 18–23. */
export const greetingFor = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 5) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
};

/** «Доброе утро, Анна» — по первому слову имени (полное ФИО в приветствии звучит официально). */
export const greetingText = (name, date = new Date()) => {
  const first = name?.trim().split(/\s+/)[0];
  return first ? `${greetingFor(date)}, ${first}` : greetingFor(date);
};
