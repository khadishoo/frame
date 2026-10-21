const PROJECT_TYPES = ['art', 'music', 'video', 'photo', 'script', 'dev', 'other'];
// Рабочее состояние проекта. Архив — отдельно (archived_at), чтобы после восстановления
// проект вернулся в своё прежнее состояние (например, «завершён»), а не в «активный»
const PROJECT_STATUSES = ['idea', 'active', 'paused', 'completed'];
// Подготовка к «Сообществу» (PLAN: идеи после альфы); публичных страниц пока нет
const VISIBILITIES = ['private', 'workspace', 'public'];
const COLORS = ['gray', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'violet', 'pink'];

export async function up(knex) {
  await knex.schema.createTable('projects', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('workspace_id').notNullable().references('id').inTable('workspaces').onDelete('CASCADE');
    // Автор удалил аккаунт — проект в общем пространстве остаётся, автор становится NULL
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    // Удаление категории не удаляет проекты
    t.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');

    t.string('title', 120).notNullable();
    t.text('description');
    t.enu('type', PROJECT_TYPES, { useNative: true, enumName: 'project_type' }).notNullable();
    t.enu('status', PROJECT_STATUSES, { useNative: true, enumName: 'project_status' })
      .notNullable()
      .defaultTo('active');
    t.enu('visibility', VISIBILITIES, { useNative: true, enumName: 'project_visibility' })
      .notNullable()
      .defaultTo('private');
    t.string('color', 20); // NULL — цвет творческого типа
    t.text('cover_url');
    t.date('start_date');
    t.date('due_date');
    t.timestamp('archived_at', { useTz: true });
    t.timestamps(true, true);

    t.index('category_id');
  });

  // PLAN 4.1: индекс для основного списка — свежие проекты пространства первыми
  await knex.raw(
    'CREATE INDEX projects_workspace_updated_idx ON projects (workspace_id, updated_at DESC)',
  );
  await knex.raw(
    `ALTER TABLE projects ADD CONSTRAINT projects_color_check CHECK (color IS NULL OR color IN (${COLORS.map((c) => `'${c}'`).join(', ')}))`,
  );
  await knex.raw(
    'ALTER TABLE projects ADD CONSTRAINT projects_dates_check CHECK (start_date IS NULL OR due_date IS NULL OR due_date >= start_date)',
  );
  await knex.raw(`
    CREATE TRIGGER projects_set_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION set_updated_at()
  `);

  await knex.schema.createTable('project_tags', (t) => {
    t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    t.uuid('tag_id').notNullable().references('id').inTable('tags').onDelete('CASCADE');
    t.primary(['project_id', 'tag_id']);
    t.index('tag_id'); // фильтр «проекты с тегом»
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('project_tags');
  await knex.schema.dropTableIfExists('projects');
  await knex.raw('DROP TYPE IF EXISTS project_type');
  await knex.raw('DROP TYPE IF EXISTS project_status');
  await knex.raw('DROP TYPE IF EXISTS project_visibility');
}
