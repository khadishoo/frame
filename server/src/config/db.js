import knex from 'knex';
import pg from 'pg';
import config from '../../knexfile.js';

// Колонки типа date отдаём строкой «2026-10-25»: иначе pg превращает их в Date в часовом
// поясе сервера, и дедлайн может «съехать» на день
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

// Единственный экземпляр Knex на всё приложение (внутри — пул соединений)
export const db = knex(config);
