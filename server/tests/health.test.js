import { describe, expect, it } from 'vitest';
import { api } from './helpers.js';

describe('GET /health', () => {
  it('отвечает ok и проверяет базу', async () => {
    const res = await api().get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', db: 'ok' });
  });

  it('заголовки безопасности: строгая CSP для JSON-API, nosniff, запрет встраивания', async () => {
    const res = await api().get('/api/v1/health');
    expect(res.headers['content-security-policy']).toBe(
      "default-src 'none';base-uri 'none';form-action 'none';frame-ancestors 'none'",
    );
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('неизвестный маршрут → 404 в едином формате ошибок', async () => {
    const res = await api().get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: 'NOT_FOUND' });
  });
});
