// Палитра для категорий и тегов: названия, а не hex — клиент подбирает оттенок под тему
const COLORS = ['gray', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'violet', 'pink'];

const createLabelTable = (knex, table) =>
  knex.schema.createTable(table, (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('workspace_id').notNullable().references('id').inTable('workspaces').onDelete('CASCADE');
    // citext: «Работа» и «работа» — одно и то же имя в пределах пространства
    t.specificType('name', 'citext').notNullable();
    t.string('color', 20).notNullable().defaultTo('gray');
    // Порядок в списке (новые — в конец); позже пользователь сможет менять его перетаскиванием
    t.integer('position').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.unique(['workspace_id', 'name']);
  });

export async function up(knex) {
  await createLabelTable(knex, 'categories');
  await createLabelTable(knex, 'tags');

  for (const table of ['categories', 'tags']) {
    await knex.raw(
      `ALTER TABLE ${table} ADD CONSTRAINT ${table}_color_check CHECK (color IN (${COLORS.map((c) => `'${c}'`).join(', ')}))`,
    );
    await knex.raw(
      `ALTER TABLE ${table} ADD CONSTRAINT ${table}_name_length_check CHECK (char_length(name) BETWEEN 1 AND 40)`,
    );
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('tags');
  await knex.schema.dropTableIfExists('categories');
}
