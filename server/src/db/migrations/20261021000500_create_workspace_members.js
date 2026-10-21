const WORKSPACE_ROLES = ['owner', 'admin', 'member', 'viewer'];

export async function up(knex) {
  await knex.schema.createTable('workspace_members', (t) => {
    t.uuid('workspace_id').notNullable().references('id').inTable('workspaces').onDelete('CASCADE');
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    // Нативный enum PostgreSQL: в колонку не попадёт ничего, кроме этих ролей
    t.enu('role', WORKSPACE_ROLES, { useNative: true, enumName: 'workspace_role' })
      .notNullable()
      .defaultTo('member');
    t.timestamp('joined_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.primary(['workspace_id', 'user_id']);
    // PK начинается с workspace_id; для «все пространства пользователя» нужен свой индекс
    t.index('user_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('workspace_members');
  await knex.raw('DROP TYPE IF EXISTS workspace_role');
}
