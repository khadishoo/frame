/**
 * Миграция данных: категории по умолчанию для пространств, созданных до этапа 6.
 * Новые пространства получают их при создании (workspaces.service → createDefaultCategories).
 * Список продублирован намеренно: миграция должна работать одинаково и через год,
 * даже если список в коде изменится.
 */
const DEFAULT_CATEGORIES = [
  { name: 'Для себя', color: 'violet' },
  { name: 'Работа', color: 'blue' },
  { name: 'Заказы', color: 'amber' },
  { name: 'Учёба', color: 'green' },
];

export async function up(knex) {
  const workspaces = await knex('workspaces as w')
    .whereNotExists(knex('categories as c').select(knex.raw('1')).whereRaw('c.workspace_id = w.id'))
    .select('w.id');

  for (const { id } of workspaces) {
    await knex('categories').insert(
      DEFAULT_CATEGORIES.map((category, position) => ({ ...category, position, workspace_id: id })),
    );
  }
}

export async function down() {
  // Не удаляем: к этому моменту пользователь мог переименовать категории и разложить проекты
}
