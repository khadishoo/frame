import { describe, expect, it } from 'vitest';
import { api } from './helpers.js';

describe('GET /health', () => {
  it('отвечает ok и проверяет базу', async () => {
    const res = await api().get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', db: 'ok' });
  });

  it('неизвестный маршрут → 404 в едином формате ошибок', async () => {
    const res = await api().get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: 'NOT_FOUND' });
  });
});
