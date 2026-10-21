export async function up(knex) {
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.specificType('email', 'citext').notNullable().unique();
    t.text('password_hash').notNullable();
    t.string('name', 80).notNullable();
    // Задаётся позже в профиле; UNIQUE допускает много NULL
    t.specificType('username', 'citext').unique();
    t.text('bio');
    t.text('avatar_url');
    t.specificType('creative_types', 'text[]').notNullable().defaultTo('{}');
    t.string('theme', 10).notNullable().defaultTo('system');
    t.timestamps(true, true); // created_at, updated_at: timestamptz NOT NULL DEFAULT now()
  });

  await knex.raw(
    "ALTER TABLE users ADD CONSTRAINT users_theme_check CHECK (theme IN ('light', 'dark', 'system'))",
  );
  await knex.raw(`
    CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at()
  `);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('users');
}
