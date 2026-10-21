/**
 * Расширения и общие функции БД.
 * citext — текст без учёта регистра (email); gen_random_uuid() встроена в PostgreSQL 13+.
 */
export async function up(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS citext');

  // Автоматически обновляет updated_at при любом UPDATE строки
  await knex.raw(`
    CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);
}

export async function down(knex) {
  await knex.raw('DROP FUNCTION IF EXISTS set_updated_at()');
  await knex.raw('DROP EXTENSION IF EXISTS citext');
}
