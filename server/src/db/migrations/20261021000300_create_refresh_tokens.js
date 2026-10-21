export async function up(knex) {
  await knex.schema.createTable('refresh_tokens', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    // Только SHA-256 хэш (64 hex-символа) — сам токен в БД не хранится
    t.string('token_hash', 64).notNullable().unique();
    t.timestamp('expires_at', { useTz: true }).notNullable();
    t.timestamp('revoked_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.string('user_agent', 255);

    // Отзыв всех сессий пользователя: WHERE user_id = ? AND revoked_at IS NULL
    t.index(['user_id', 'revoked_at']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('refresh_tokens');
}
