import argon2 from 'argon2';
import { DEFAULT_CATEGORIES } from '../../config/domain.js';

/**
 * Демо-данные для разработки: пользователь с личным пространством, проектами разных типов
 * и задачами в них.
 * Запуск: npm run seed (из server/). Пересоздаёт ТОЛЬКО демо-пользователя —
 * остальные данные в базе не трогает. Вход: demo@frame.local / demo-password
 */
export const DEMO = {
  email: 'demo@frame.local',
  password: 'demo-password',
  name: 'Демо Пользователь',
};

// Даты относительно сегодняшнего дня — дедлайны всегда «живые»
const day = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

const TAGS = [
  { name: 'черновик', color: 'gray' },
  { name: 'для портфолио', color: 'violet' },
  { name: 'срочно', color: 'red' },
  { name: 'лофи', color: 'teal' },
];

// category и tags — названия из списков выше
const PROJECTS = [
  {
    title: 'Альбом «Северное сияние»',
    type: 'music',
    status: 'active',
    category: 'Для себя',
    tags: ['лофи', 'для портфолио'],
    description: 'Восемь эмбиент-треков о зиме.',
    startDate: day(-30),
    dueDate: day(45),
  },
  {
    title: 'Иллюстрации для детской книги',
    type: 'art',
    status: 'active',
    category: 'Заказы',
    tags: ['срочно'],
    description: '12 разворотов, акварель.',
    startDate: day(-10),
    dueDate: day(6),
  },
  {
    title: 'Клип для группы «Тихий час»',
    type: 'video',
    status: 'paused',
    category: 'Заказы',
    tags: ['черновик'],
    dueDate: day(20),
  },
  {
    title: 'Фотосерия «Город в тумане»',
    type: 'photo',
    status: 'idea',
    category: 'Для себя',
    tags: ['для портфолио'],
  },
  {
    title: 'Сценарий короткого метра',
    type: 'script',
    status: 'active',
    category: 'Учёба',
    tags: ['черновик'],
    description: 'Курсовая: 15 минут, 3 локации.',
    dueDate: day(-2),
  },
  {
    title: 'Сайт-портфолио',
    type: 'dev',
    status: 'active',
    category: 'Работа',
    tags: ['для портфолио', 'срочно'],
    dueDate: day(12),
  },
  { title: 'Подкаст о творчестве', type: 'other', status: 'idea', category: null, tags: [] },
  {
    title: 'Бит-тейп «Лофи для учёбы»',
    type: 'music',
    status: 'completed',
    category: 'Для себя',
    tags: ['лофи'],
    startDate: day(-90),
    dueDate: day(-40),
  },
];

// Задачи по названию проекта: [название, статус, приоритет, дедлайн (сдвиг в днях) или null].
// Есть все статусы и приоритеты; отрицательный сдвиг у невыполненной задачи — просрочка
const TASKS = {
  'Альбом «Северное сияние»': [
    ['Написать демо всех восьми треков', 'done', 'high', -20],
    ['Записать вокал для «Полярной ночи»', 'done', 'medium', -12],
    ['Сведение первых четырёх треков', 'in_progress', 'high', 3],
    ['Подобрать сэмплы ветра и снега', 'in_progress', 'low', null],
    ['Мастеринг', 'todo', 'medium', 30],
    ['Обложка альбома', 'review', 'medium', 7],
    ['Загрузить на стриминги', 'todo', 'low', 45],
  ],
  'Иллюстрации для детской книги': [
    ['Эскизы персонажей', 'done', 'high', -8],
    ['Развороты 1–4', 'done', 'urgent', -3],
    ['Развороты 5–8', 'review', 'urgent', -1],
    ['Развороты 9–12', 'in_progress', 'urgent', 4],
    ['Согласовать палитру с издательством', 'todo', 'high', -2],
    ['Отсканировать и почистить фон', 'todo', 'medium', 6],
  ],
  'Клип для группы «Тихий час»': [
    ['Раскадровка', 'done', 'medium', -15],
    ['Найти локацию', 'in_progress', 'high', -5],
    ['Арендовать свет', 'todo', 'medium', 10],
    ['Монтаж', 'todo', 'low', 20],
  ],
  'Фотосерия «Город в тумане»': [
    ['Составить список мест для съёмки', 'todo', 'low', null],
    ['Проверить прогноз тумана на неделю', 'todo', 'medium', 2],
  ],
  'Сценарий короткого метра': [
    ['Логлайн и синопсис', 'done', 'medium', -25],
    ['Поэтапный план', 'done', 'high', -10],
    ['Первый драфт', 'review', 'urgent', -2],
    ['Показать драфт преподавателю', 'todo', 'urgent', 0],
  ],
  'Сайт-портфолио': [
    ['Макет главной страницы', 'done', 'high', -6],
    ['Вёрстка галереи', 'in_progress', 'high', 0],
    ['Подключить домен', 'todo', 'urgent', 1],
    ['Тексты «Обо мне»', 'review', 'medium', 5],
    ['Оптимизировать изображения', 'todo', 'low', 12],
  ],
  'Бит-тейп «Лофи для учёбы»': [
    ['Собрать 10 битов', 'done', 'medium', -60],
    ['Сведение и мастеринг', 'done', 'high', -45],
    ['Опубликовать', 'done', 'low', -40],
  ],
};

const ARCHIVED = {
  title: 'Старый блог',
  type: 'dev',
  status: 'completed',
  category: 'Работа',
  tags: [],
};

// Идеи и заметки разного вида: короткие, с Markdown, цветные, закреплённые, привязанные
// к проекту (project — название из PROJECTS)
const NOTES = [
  {
    title: 'Комикс про кота-почтальона',
    content: 'Кот разносит письма по крышам ночного города.\n\n- 8 страниц\n- акварель + тушь',
    color: 'amber',
    pinned: true,
  },
  {
    title: 'Звуки для эмбиента',
    content:
      '## Что записать\n\n1. Скрип снега\n2. Ветер в проводах\n3. Метро ночью\n\n> Писать в WAV, 48 кГц',
    color: 'violet',
    project: 'Альбом «Северное сияние»',
    pinned: true,
  },
  { title: '', content: 'Снять таймлапс тумана над рекой — рано утром, с моста', color: 'teal' },
  {
    title: 'Цвета для книги',
    content: 'Тёплая охра, приглушённый бирюзовый, **никакого** чистого чёрного.',
    project: 'Иллюстрации для детской книги',
  },
  {
    title: 'Идеи для сайта',
    content: '- [x] Тёмная тема\n- [ ] Галерея с фильтрами\n- [ ] Страница «Обо мне» с фото',
    color: 'blue',
    project: 'Сайт-портфолио',
  },
  { title: 'Подкаст: темы первых выпусков', content: 'Выгорание, заказы, как вести портфолио.' },
  {
    title: 'Цитата',
    content: '> Вдохновение существует, но оно должно застать тебя за работой.\n\n— Пикассо',
    color: 'pink',
    pinned: true,
  },
  { title: 'Фотопрогулка', content: 'Старые дворы, отражения в лужах, неон.', color: 'green' },
  {
    title: 'Сюжет для короткого метра',
    content:
      'Два незнакомца каждый день встречаются в лифте и ни разу не говорят.\n\n```\nНАТ. ЛИФТ — УТРО\n```',
    project: 'Сценарий короткого метра',
  },
];

/**
 * Когда задача выполнена: у завершённого проекта — в день своего дедлайна (давно), у остальных —
 * в один из последних 6 дней (×5 по модулю 6 обходит все дни), чтобы мини-график на дашборде был «живым», а не одним столбиком.
 */
let doneCounter = 0;
const completedAt = (trx, project, due) => {
  const daysAgo = project.status === 'completed' && due !== null ? -due : (doneCounter++ * 5) % 6;
  return trx.raw(`now() - interval '${daysAgo} days' - interval '${(doneCounter % 5) + 1} hours'`);
};

// Избранное демо-пользователя
const FAVORITE_PROJECTS = ['Альбом «Северное сияние»', 'Сайт-портфолио'];
const FAVORITE_NOTES = ['Комикс про кота-почтальона'];

export async function seed(knex) {
  // Удаляем только прошлого демо-пользователя: сначала его пространства (каскадом — проекты
  // и задачи), потом его самого — порядок как в users.service (deleteUserCascade)
  const old = await knex('users').where({ email: DEMO.email }).first('id');
  if (old) {
    await knex('workspaces').where({ owner_id: old.id }).del();
    await knex('users').where({ id: old.id }).del();
  }

  await knex.transaction(async (trx) => {
    const [user] = await trx('users')
      .insert({
        email: DEMO.email,
        password_hash: await argon2.hash(DEMO.password),
        name: DEMO.name,
        username: 'demo',
        bio: 'Пробую всё понемногу: музыка, рисунок, код.',
        creative_types: ['music', 'art', 'dev'],
      })
      .returning('*');

    const [workspace] = await trx('workspaces')
      .insert({ name: 'Личное пространство', slug: 'demo', is_personal: true, owner_id: user.id })
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
    for (const [index, p] of all.entries()) {
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
          // Разное время изменения — чтобы сортировка «недавние» выглядела естественно
          updated_at: trx.raw(`now() - interval '${index} hours'`),
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
          completed_at: status === 'done' ? completedAt(trx, p, due) : null,
        };
      });
      if (tasks.length > 0) await trx('tasks').insert(tasks);
    }

    const notes = await trx('notes')
      .insert(
        NOTES.map((n, index) => ({
          workspace_id: workspace.id,
          author_id: user.id,
          project_id: n.project ? projectIds.get(n.project) : null,
          title: n.title,
          content: n.content,
          color: n.color ?? null,
          is_pinned: n.pinned ?? false,
          updated_at: trx.raw(`now() - interval '${index * 5} hours'`),
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
