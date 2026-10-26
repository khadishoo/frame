const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export async function up(knex) {
  await knex.schema.createTable('tasks', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    // Задачи живут внутри проекта: удалили проект — удалились и задачи
    t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    // Автор или исполнитель удалил аккаунт — задача остаётся, поле становится NULL
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    t.uuid('assignee_id').references('id').inTable('users').onDelete('SET NULL');

    t.string('title', 200).notNullable();
    t.text('description');
    t.enu('status', TASK_STATUSES, { useNative: true, enumName: 'task_status' })
      .notNullable()
      .defaultTo('todo');
    t.enu('priority', TASK_PRIORITIES, { useNative: true, enumName: 'task_priority' })
      .notNullable()
      .defaultTo('medium');
    // Дедлайн — день без времени, как у проектов (PLAN 4.1 предлагал timestamptz: время не нужно,
    // а часовой пояс сдвигал бы дату)
    t.date('due_date');
    // Порядок карточки в колонке: шаг 1000, вставка между соседями — среднее (PLAN 4.1)
    t.double('position').notNullable();
    t.timestamp('completed_at', { useTz: true });
    t.timestamps(true, true);

    // Доска: задачи проекта по колонкам, внутри колонки — по position
    t.index(['project_id', 'status', 'position']);
    // «Мои задачи» и календарь
    t.index('due_date');
    t.index('assignee_id');
  });

  await knex.raw(`
    CREATE TRIGGER tasks_set_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at()
  `);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('tasks');
  await knex.raw('DROP TYPE IF EXISTS task_status');
  await knex.raw('DROP TYPE IF EXISTS task_priority');
}
