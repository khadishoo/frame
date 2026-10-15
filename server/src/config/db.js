import knex from 'knex';
import config from '../../knexfile.js';

// Единственный экземпляр Knex на всё приложение (внутри — пул соединений)
export const db = knex(config);
