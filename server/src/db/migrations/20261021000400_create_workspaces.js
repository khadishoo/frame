export async function up(knex) {
  await knex.schema.createTable('workspaces', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 80).notNullable();
    t.string('slug', 100).notNullable().unique();
    t.boolean('is_personal').notNullable().defaultTo(false);
    t.uuid('owner_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('owner_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('workspaces');
}
