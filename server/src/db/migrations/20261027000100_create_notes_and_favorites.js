const COLORS = ['gray', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'violet', 'pink'];
const FAVORITE_TYPES = ['project', 'note'];

export async function up(knex) {
  await knex.schema.createTable('notes', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('workspace_id').notNullable().references('id').inTable('workspaces').onDelete('CASCADE');
    // Автор удалил аккаунт — заметка в общем пространстве остаётся
    t.uuid('author_id').references('id').inTable('users').onDelete('SET NULL');
    // Удалили проект — заметка остаётся «свободной» идеей
    t.uuid('project_id').references('id').inTable('projects').onDelete('SET NULL');

    // Пустой заголовок допустим (быстрая идея — только текст); проверку «хоть что-то» делает API
    t.string('title', 200).notNullable().defaultTo('');
    t.text('content').notNullable().defaultTo('');
    t.boolean('is_pinned').notNullable().defaultTo(false);
    t.string('color', 20); // NULL — обычный фон карточки
    t.timestamps(true, true);

    t.index('project_id');
  });

  // PLAN 4.1: основной список — свежие заметки пространства первыми
  await knex.raw(
    'CREATE INDEX notes_workspace_updated_idx ON notes (workspace_id, updated_at DESC)',
  );
  await knex.raw(
    `ALTER TABLE notes ADD CONSTRAINT notes_color_check CHECK (color IS NULL OR color IN (${COLORS.map((c) => `'${c}'`).join(', ')}))`,
  );
  await knex.raw(`
    CREATE TRIGGER notes_set_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at()
  `);

  // Избранное — у каждого пользователя своё. Ссылка «полиморфная» (тип + id),
  // поэтому внешнего ключа на проект/заметку нет — чистят триггеры ниже
  await knex.schema.createTable('favorites', (t) => {
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.enu('entity_type', FAVORITE_TYPES, {
      useNative: true,
      enumName: 'favorite_entity',
    }).notNullable();
    t.uuid('entity_id').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.primary(['user_id', 'entity_type', 'entity_id']);
    t.index(['entity_type', 'entity_id']); // для очистки при удалении записи
  });

  // Удалили проект или заметку (любым путём, в т.ч. каскадом вместе с пространством) —
  // исчезают и отметки «в избранном» у всех пользователей
  await knex.raw(`
    CREATE FUNCTION delete_favorites() RETURNS trigger AS $$
    BEGIN
      DELETE FROM favorites WHERE entity_type = TG_ARGV[0]::favorite_entity AND entity_id = OLD.id;
      RETURN OLD;
    END;
    $$ LANGUAGE plpgsql
  `);
  await knex.raw(`
    CREATE TRIGGER projects_delete_favorites
    AFTER DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION delete_favorites('project')
  `);
  await knex.raw(`
    CREATE TRIGGER notes_delete_favorites
    AFTER DELETE ON notes
    FOR EACH ROW EXECUTE FUNCTION delete_favorites('note')
  `);
}

export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS projects_delete_favorites ON projects');
  await knex.schema.dropTableIfExists('favorites');
  await knex.schema.dropTableIfExists('notes');
  await knex.raw('DROP FUNCTION IF EXISTS delete_favorites()');
  await knex.raw('DROP TYPE IF EXISTS favorite_entity');
}
