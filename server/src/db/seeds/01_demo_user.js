import argon2 from 'argon2';
import { DEFAULT_CATEGORIES, DEMO_EMAIL } from '../../config/domain.js';

/**
 * Демо-аккаунт для портфолио: иллюстратор и музыкант Мира — проекты всех творческих типов,
 * задачи с историей, идеи и активность за последние две недели (график на дашборде).
 * Запуск: npm run seed (из server/). Пересоздаёт ТОЛЬКО демо-пользователя —
 * остальные данные в базе не трогает. Вход: demo@frame.local / demo-password
 * (на странице входа — кнопка «Войти как демо»).
 */
export const DEMO = {
  email: DEMO_EMAIL,
  password: 'demo-password',
  name: 'Мира Соколова',
};

// Даты относительно сегодняшнего дня — дедлайны всегда «живые»
const day = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

const TAGS = [
  { name: 'для портфолио', color: 'violet' },
  { name: 'срочно', color: 'red' },
  { name: 'черновик', color: 'gray' },
  { name: 'лофи', color: 'teal' },
  { name: 'акварель', color: 'amber' },
  { name: 'коммерция', color: 'blue' },
];

// category и tags — названия из списков выше; updated — сколько часов назад проект меняли
// (сортировка «недавние» и блок «Продолжить работу» на дашборде)
const PROJECTS = [
  {
    title: 'Иллюстрации к сказке «Лисья почта»',
    type: 'art',
    status: 'active',
    category: 'Заказы',
    tags: ['акварель', 'срочно', 'коммерция'],
    description:
      'Детская книга издательства «Кит и компас»: обложка и 12 разворотов, акварель и цветные карандаши. Сдача в типографию — в конце месяца.',
    startDate: day(-24),
    dueDate: day(9),
    updated: 1,
  },
  {
    title: 'Альбом «Северное сияние»',
    type: 'music',
    status: 'active',
    category: 'Для себя',
    tags: ['лофи', 'для портфолио'],
    description: 'Восемь эмбиент-треков о зиме: полевые записи, синтезаторы, немного фортепиано.',
    startDate: day(-60),
    dueDate: day(40),
    updated: 3,
  },
  {
    title: 'Клип для группы «Тихий час»',
    type: 'video',
    status: 'active',
    category: 'Заказы',
    tags: ['коммерция'],
    description: 'Клип на песню «Пятый этаж»: одна ночь, одна квартира, плёночная зернистость.',
    startDate: day(-15),
    dueDate: day(18),
    updated: 6,
  },
  {
    title: 'Сайт-портфолио',
    type: 'dev',
    status: 'active',
    category: 'Работа',
    tags: ['для портфолио', 'срочно'],
    description: 'Своё портфолио: галерея с фильтрами по технике, тёмная тема, короткий блог.',
    startDate: day(-20),
    dueDate: day(12),
    updated: 9,
  },
  {
    title: 'Фотосерия «Город в тумане»',
    type: 'photo',
    status: 'active',
    category: 'Для себя',
    tags: ['для портфолио'],
    description: 'Петербург на рассвете: мосты, набережные, фонари. Плёнка Portra 400 и цифра.',
    startDate: day(-12),
    dueDate: day(25),
    updated: 20,
  },
  {
    title: 'Сценарий короткого метра «Лифт»',
    type: 'script',
    status: 'active',
    category: 'Учёба',
    tags: ['черновик'],
    description: 'Курсовая: 15 минут, две роли, одна локация. Двое каждое утро едут в одном лифте.',
    startDate: day(-35),
    dueDate: day(-2),
    updated: 30,
  },
  {
    title: 'Свадебная съёмка Анны и Олега',
    type: 'photo',
    status: 'completed',
    category: 'Заказы',
    tags: ['коммерция'],
    description: 'Репортаж и прогулка в Павловске. 400 кадров в обработке, фотокнига.',
    startDate: day(-30),
    dueDate: day(-3),
    updated: 50,
  },
  {
    title: 'Скетчбук «Inktober»',
    type: 'art',
    status: 'paused',
    category: 'Для себя',
    tags: ['черновик'],
    description: '31 рисунок тушью за 31 день. Пауза до сдачи книги.',
    startDate: day(-26),
    updated: 70,
  },
  {
    title: 'Подкаст «Творческий беспорядок»',
    type: 'other',
    status: 'idea',
    category: null,
    tags: [],
    description: 'Разговоры с иллюстраторами и музыкантами о заказах, выгорании и деньгах.',
    updated: 90,
  },
  {
    title: 'Бит-тейп «Лофи для учёбы»',
    type: 'music',
    status: 'completed',
    category: 'Для себя',
    tags: ['лофи'],
    description: '10 битов для фона: винил, дождь, мягкие барабаны. Вышел на всех площадках.',
    startDate: day(-120),
    dueDate: day(-60),
    old: true, // выполнен давно — в график последних недель не попадает
    updated: 400,
  },
];

// Задачи по названию проекта: [название, статус, приоритет, дедлайн (сдвиг в днях) или null].
// Все статусы и приоритеты; отрицательный сдвиг у невыполненной задачи — просрочка
const TASKS = {
  'Иллюстрации к сказке «Лисья почта»': [
    ['Эскизы персонажей: лиса, ёж, сова', 'done', 'high', -18],
    ['Согласовать раскадровку с редактором', 'done', 'high', -14],
    ['Обложка: три варианта композиции', 'done', 'urgent', -10],
    ['Развороты 1–4', 'done', 'urgent', -6],
    ['Развороты 5–8', 'done', 'urgent', -2],
    ['Развороты 9–12', 'in_progress', 'urgent', 4],
    ['Цветокоррекция сканов под печать', 'review', 'high', 6],
    ['Леттеринг на обложке', 'todo', 'medium', 7],
    ['Сдать файлы в CMYK', 'todo', 'urgent', 9],
  ],
  'Альбом «Северное сияние»': [
    ['Демо всех восьми треков', 'done', 'high', -40],
    ['Полевые записи: снег, ветер, метро', 'done', 'medium', -20],
    ['Вокал для «Полярной ночи»', 'done', 'medium', -9],
    ['Сведение треков 1–4', 'done', 'high', -4],
    ['Сведение треков 5–8', 'in_progress', 'high', 5],
    ['Переписать фортепиано в «Оттепели»', 'in_progress', 'low', null],
    ['Обложка альбома', 'review', 'medium', 8],
    ['Мастеринг', 'todo', 'medium', 28],
    ['Выложить на Bandcamp и стриминги', 'todo', 'low', 40],
  ],
  'Клип для группы «Тихий час»': [
    ['Тритмент и референсы', 'done', 'medium', -12],
    ['Раскадровка', 'done', 'high', -8],
    ['Найти квартиру для съёмки', 'done', 'high', -5],
    ['Арендовать свет и дым-машину', 'in_progress', 'medium', 2],
    ['Съёмочный день', 'todo', 'urgent', 6],
    ['Черновой монтаж', 'todo', 'high', 12],
    ['Цветокоррекция под плёнку', 'todo', 'low', 16],
  ],
  'Сайт-портфолио': [
    ['Макет главной в Figma', 'done', 'high', -15],
    ['Сетка галереи и фильтры', 'done', 'high', -7],
    ['Тёмная тема', 'done', 'medium', -3],
    ['Страница проекта с историей работы', 'in_progress', 'high', 3],
    ['Тексты «Обо мне»', 'review', 'medium', 4],
    ['Сжать изображения в AVIF', 'todo', 'medium', 8],
    ['Подключить домен', 'todo', 'urgent', 1],
    ['Проверить скорость загрузки', 'todo', 'low', 12],
  ],
  'Фотосерия «Город в тумане»': [
    ['Карта точек съёмки', 'done', 'low', -10],
    ['Рассвет на Дворцовой набережной', 'done', 'medium', -6],
    ['Проявить первые две плёнки', 'done', 'medium', -2],
    ['Проверить прогноз тумана на неделю', 'todo', 'medium', 0],
    ['Съёмка на Крестовском', 'todo', 'high', 5],
    ['Отбор 20 кадров', 'todo', 'low', 20],
  ],
  'Сценарий короткого метра «Лифт»': [
    ['Логлайн и синопсис', 'done', 'medium', -30],
    ['Поэпизодный план', 'done', 'high', -16],
    ['Первый драфт', 'done', 'urgent', -5],
    ['Переписать финал', 'review', 'urgent', -2],
    ['Показать драфт мастеру курса', 'todo', 'urgent', -1],
    ['Читка с актёрами', 'todo', 'medium', 6],
  ],
  'Свадебная съёмка Анны и Олега': [
    ['Обсудить план дня с парой', 'done', 'medium', -28],
    ['Съёмка', 'done', 'urgent', -21],
    ['Отбор кадров', 'done', 'high', -13],
    ['Цветокоррекция 400 кадров', 'done', 'high', -8],
    ['Вёрстка фотокниги', 'done', 'medium', -4],
    ['Отправить галерею', 'done', 'medium', -3],
  ],
  'Скетчбук «Inktober»': [
    ['Список из 31 темы', 'done', 'low', -26],
    ['Рисунки 1–10', 'done', 'medium', -12],
    ['Рисунки 11–20', 'in_progress', 'low', null],
    ['Отсканировать и выложить', 'todo', 'low', null],
  ],
  'Подкаст «Творческий беспорядок»': [
    ['Список гостей первого сезона', 'todo', 'low', null],
    ['Купить микрофон', 'todo', 'low', null],
  ],
  'Бит-тейп «Лофи для учёбы»': [
    ['Собрать 10 битов', 'done', 'medium', -90],
    ['Сведение и мастеринг', 'done', 'high', -70],
    ['Опубликовать', 'done', 'low', -60],
  ],
};

const ARCHIVED = {
  title: 'Старый блог на WordPress',
  type: 'dev',
  status: 'completed',
  category: 'Работа',
  tags: [],
  description: 'Переехал в сайт-портфолио.',
  updated: 900,
};

// Идеи и заметки разного вида: короткие, с Markdown, цветные, закреплённые, привязанные
// к проекту (project — название из PROJECTS); hours — сколько часов назад меняли
const NOTES = [
  {
    title: 'Комикс про кота-почтальона',
    content:
      'Кот разносит письма по крышам ночного города. Каждое письмо — маленькая история жильцов.\n\n- 8 страниц\n- акварель + тушь\n- отправить на фестиваль комиксов',
    color: 'amber',
    pinned: true,
    hours: 2,
  },
  {
    title: 'Звуки для эмбиента',
    content:
      '## Что записать\n\n1. Скрип снега во дворе\n2. Ветер в проводах на Васильевском\n3. Метро ночью\n\n> Писать в WAV, 48 кГц, с ветрозащитой',
    color: 'violet',
    project: 'Альбом «Северное сияние»',
    pinned: true,
    hours: 5,
  },
  {
    title: 'Цитата',
    content: '> Вдохновение существует, но оно должно застать тебя за работой.\n\n— Пикассо',
    color: 'pink',
    pinned: true,
    hours: 200,
  },
  {
    title: 'Палитра для «Лисьей почты»',
    content:
      'Тёплая охра, приглушённый бирюзовый, рыжий — только у лисы. **Никакого** чистого чёрного.',
    project: 'Иллюстрации к сказке «Лисья почта»',
    hours: 9,
  },
  {
    title: '',
    content: 'Снять таймлапс тумана над Невой — в 6 утра, с Троицкого моста',
    color: 'teal',
    hours: 14,
  },
  {
    title: 'Чек-лист перед сдачей в печать',
    content:
      '- [x] 300 dpi\n- [x] вылеты 5 мм\n- [ ] CMYK, профиль издательства\n- [ ] шрифты в кривые',
    color: 'blue',
    project: 'Иллюстрации к сказке «Лисья почта»',
    hours: 20,
  },
  {
    title: 'Сюжет для «Лифта»',
    content:
      'Двое каждое утро едут в лифте и ни разу не говорят. В последний день один оставляет записку.\n\n```\nИНТ. ЛИФТ — УТРО\n```',
    project: 'Сценарий короткого метра «Лифт»',
    hours: 30,
  },
  {
    title: 'Подкаст: темы первых выпусков',
    content:
      '1. Как назначать цену за иллюстрацию\n2. Выгорание на заказах\n3. Портфолио, которое продаёт',
    project: 'Подкаст «Творческий беспорядок»',
    hours: 48,
  },
  {
    title: 'Идеи для сайта',
    content:
      '- [x] Тёмная тема\n- [ ] Галерея с фильтрами по технике\n- [ ] Страница «Обо мне» с фото мастерской',
    project: 'Сайт-портфолио',
    hours: 60,
  },
  {
    title: 'Фотопрогулка',
    content: 'Старые дворы Коломны, отражения в лужах, неон.',
    color: 'green',
    hours: 80,
  },
  {
    title: 'Мерч для «Тихого часа»',
    content: 'Футболки с кадром из клипа? Предложить группе после сдачи.',
    color: 'orange',
    hours: 110,
  },
  {
    title: 'Книги на зиму',
    content: 'Остин Клеон — «Кради как художник»\nДжулия Кэмерон — «Путь художника»',
    hours: 150,
  },
];

/**
 * Сколько задач выполнено в каждый из последних 14 дней (от 13 дней назад до сегодня) —
 * неровно, как у живого человека: выходные тише, перед сдачей книги — пик.
 * Выполненные задачи (кроме давних проектов) раскладываются по этим дням по очереди.
 * Сумма (29) должна совпадать с числом таких задач в TASKS — иначе лишние уйдут на 13-й день.
 */
const DONE_PER_DAY = [1, 2, 1, 0, 2, 3, 2, 3, 2, 3, 1, 3, 4, 2];

const makeCompletedAt = (trx) => {
  const slots = DONE_PER_DAY.flatMap((count, i) => {
    const daysAgo = DONE_PER_DAY.length - 1 - i;
    return Array.from({ length: count }, (_, k) => ({ daysAgo, k }));
  });

  return (project, due) => {
    if (project.old) return trx.raw(`now() - interval '${-due} days'`);
    const { daysAgo, k } = slots.shift() ?? { daysAgo: 13, k: 0 };
    // Сегодня — последние часы; раньше — днём: 10:00, 12:30, 15:00…
    return daysAgo === 0
      ? trx.raw(`now() - interval '${(k + 1) * 35} minutes'`)
      : trx.raw(
          `date_trunc('day', now()) - interval '${daysAgo} days' + interval '${600 + k * 150} minutes'`,
        );
  };
};

// Избранное демо-пользователя
const FAVORITE_PROJECTS = [
  'Иллюстрации к сказке «Лисья почта»',
  'Альбом «Северное сияние»',
  'Сайт-портфолио',
];
const FAVORITE_NOTES = ['Комикс про кота-почтальона', 'Звуки для эмбиента'];

export async function seed(knex) {
  // Удаляем только прошлого демо-пользователя: сначала его пространства (каскадом — проекты
  // и задачи), потом его самого — порядок как в users.service (deleteUserCascade)
  const old = await knex('users').where({ email: DEMO.email }).first('id');
  if (old) {
    await knex('workspaces').where({ owner_id: old.id }).del();
    await knex('users').where({ id: old.id }).del();
  }

  await knex.transaction(async (trx) => {
    const completedAt = makeCompletedAt(trx);

    const [user] = await trx('users')
      .insert({
        email: DEMO.email,
        password_hash: await argon2.hash(DEMO.password),
        name: DEMO.name,
        username: 'mira',
        bio: 'Иллюстратор и музыкант из Петербурга. Днём — книжные заказы, ночью — эмбиент и плёнка.',
        creative_types: ['art', 'music', 'photo'],
      })
      .returning('*');

    const [workspace] = await trx('workspaces')
      .insert({ name: 'Мастерская Миры', slug: 'demo', is_personal: true, owner_id: user.id })
      .returning('*');
    await trx('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner',
    });

    const categories = await trx('categories')
      .insert(
        DEFAULT_CATEGORIES.map((c, position) => ({ ...c, position, workspace_id: workspace.id })),
      )
      .returning(['id', 'name']);
    const tags = await trx('tags')
      .insert(TAGS.map((t, position) => ({ ...t, position, workspace_id: workspace.id })))
      .returning(['id', 'name']);
    const categoryId = (name) => categories.find((c) => c.name === name)?.id ?? null;
    const tagId = (name) => tags.find((t) => t.name === name).id;

    const all = [...PROJECTS, { ...ARCHIVED, archived: true }];
    const projectIds = new Map();
    for (const p of all) {
      const [project] = await trx('projects')
        .insert({
          workspace_id: workspace.id,
          created_by: user.id,
          category_id: categoryId(p.category),
          title: p.title,
          description: p.description ?? null,
          type: p.type,
          status: p.status,
          start_date: p.startDate ?? null,
          due_date: p.dueDate ?? null,
          archived_at: p.archived ? trx.fn.now() : null,
          created_at: trx.raw(`now() - interval '${Math.max(p.updated + 24, 30 * 24)} hours'`),
          updated_at: trx.raw(`now() - interval '${p.updated} hours'`),
        })
        .returning('id');
      projectIds.set(p.title, project.id);
      if (p.tags.length > 0) {
        await trx('project_tags').insert(
          p.tags.map((name) => ({ project_id: project.id, tag_id: tagId(name) })),
        );
      }

      // Позиции — шагом 1000 внутри каждой колонки, как это делает API
      const nextPosition = {};
      const tasks = (TASKS[p.title] ?? []).map(([title, status, priority, due], i) => {
        nextPosition[status] = (nextPosition[status] ?? 0) + 1000;
        return {
          project_id: project.id,
          created_by: user.id,
          // Пара задач без исполнителя — чтобы фильтр «Мои задачи» что-то отсекал
          assignee_id: i === 1 ? null : user.id,
          title,
          status,
          priority,
          due_date: due === null ? null : day(due),
          position: nextPosition[status],
          completed_at: status === 'done' ? completedAt(p, due) : null,
          // Задачи заведены раньше, чем выполнены
          created_at: trx.raw(`now() - interval '${p.old ? 130 : 21 + (i % 7)} days'`),
        };
      });
      if (tasks.length > 0) await trx('tasks').insert(tasks);
    }

    const notes = await trx('notes')
      .insert(
        NOTES.map((n) => ({
          workspace_id: workspace.id,
          author_id: user.id,
          project_id: n.project ? projectIds.get(n.project) : null,
          title: n.title,
          content: n.content,
          color: n.color ?? null,
          is_pinned: n.pinned ?? false,
          created_at: trx.raw(`now() - interval '${n.hours + 48} hours'`),
          updated_at: trx.raw(`now() - interval '${n.hours} hours'`),
        })),
      )
      .returning(['id', 'title']);

    await trx('favorites').insert([
      ...FAVORITE_PROJECTS.map((title) => ({
        user_id: user.id,
        entity_type: 'project',
        entity_id: projectIds.get(title),
      })),
      ...FAVORITE_NOTES.map((title) => ({
        user_id: user.id,
        entity_type: 'note',
        entity_id: notes.find((n) => n.title === title).id,
      })),
    ]);
  });

  // eslint-disable-next-line no-console -- подсказка разработчику после сида
  console.log(`Демо-пользователь готов: ${DEMO.email} / ${DEMO.password}`);
}
