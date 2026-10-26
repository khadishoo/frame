import { AxiosError } from 'axios';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { login } from '@/api/auth';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/features/auth/authStore';
import { useToastStore } from '@/lib/toast';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Ответ «сервера» в формате axios; статус ≥ 400 — отклонённый промис, как у настоящего адаптера
const respond = (config, status, data) => {
  const response = { data, status, statusText: '', headers: {}, config };
  if (status < 400) return response;
  throw new AxiosError(`HTTP ${status}`, 'ERR_BAD_REQUEST', config, null, response);
};

const originalAdapter = apiClient.defaults.adapter;
let refreshCalls;
let refreshSucceeds;

describe('apiClient: 401 → refresh → повтор запроса', () => {
  beforeEach(() => {
    refreshCalls = 0;
    refreshSucceeds = true;
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: '1', name: 'Анна' },
      accessToken: 'old-token',
      endReason: null,
      redirectTo: null,
    });

    // Подменяем сетевой слой axios: никаких настоящих HTTP-запросов
    apiClient.defaults.adapter = async (config) => {
      if (config.url === '/auth/refresh') {
        refreshCalls += 1;
        await delay(20); // refresh «идёт по сети», пока приходят другие 401
        return refreshSucceeds
          ? respond(config, 200, { user: { id: '1', name: 'Анна' }, accessToken: 'new-token' })
          : respond(config, 401, { error: { code: 'INVALID_REFRESH_TOKEN' } });
      }
      if (config.url === '/auth/login') {
        return respond(config, 401, { error: { code: 'INVALID_CREDENTIALS' } });
      }
      // Защищённые ресурсы принимают только новый токен
      return config.headers.get('Authorization') === 'Bearer new-token'
        ? respond(config, 200, { url: config.url })
        : respond(config, 401, { error: { code: 'TOKEN_EXPIRED' } });
    };
  });

  afterAll(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('несколько одновременных 401 → refresh ОДИН раз, все запросы повторяются', async () => {
    const results = await Promise.all([
      apiClient.get('/projects'),
      apiClient.get('/tasks'),
      apiClient.get('/notes'),
    ]);

    expect(refreshCalls).toBe(1);
    expect(results.map((r) => r.data.url)).toEqual(['/projects', '/tasks', '/notes']);
    expect(useAuthStore.getState().accessToken).toBe('new-token');
  });

  it('refresh не удался → запросы падают, сессия очищена, без бесконечного цикла', async () => {
    refreshSucceeds = false;

    const results = await Promise.allSettled([apiClient.get('/projects'), apiClient.get('/tasks')]);

    expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected']);
    expect(results[0].reason.response.status).toBe(401);
    expect(refreshCalls).toBe(1); // сам /auth/refresh повторно не обновляется
    expect(useAuthStore.getState()).toMatchObject({
      status: 'guest',
      accessToken: null,
      endReason: 'expired',
    });
  });

  it('401 от /auth/login — это «неверный пароль», refresh не вызывается', async () => {
    await expect(login({ email: 'a@b.c', password: 'x' })).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(refreshCalls).toBe(0);
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('подставляет Authorization: Bearer из памяти', async () => {
    useAuthStore.setState({ accessToken: 'new-token' });
    const res = await apiClient.get('/me');

    expect(res.status).toBe(200);
    expect(refreshCalls).toBe(0);
  });
});

describe('apiClient: нет соединения с сервером', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  afterAll(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  const offlineToasts = () =>
    useToastStore.getState().toasts.filter((t) => t.title === 'Нет соединения с сервером');

  it('сеть недоступна → один тост на сколько угодно упавших запросов', async () => {
    apiClient.defaults.adapter = async (config) => {
      throw new AxiosError('Network Error', 'ERR_NETWORK', config, {});
    };

    await Promise.allSettled([apiClient.get('/a'), apiClient.get('/b'), apiClient.get('/c')]);
    expect(offlineToasts()).toHaveLength(1);

    // Тост закрыли, связь всё ещё не вернулась — покажем снова
    useToastStore.setState({ toasts: [] });
    await apiClient.get('/d').catch(() => {});
    expect(offlineToasts()).toHaveLength(1);
  });

  it('прокси вернул 502 без нашего { error } — тоже «нет соединения»', async () => {
    apiClient.defaults.adapter = async (config) => respond(config, 502, '');
    await apiClient.get('/a').catch(() => {});
    expect(offlineToasts()).toHaveLength(1);
  });

  it('обычные ошибки API и отменённые запросы тост не вызывают', async () => {
    apiClient.defaults.adapter = async (config) => {
      if (config.url === '/cancel') throw new AxiosError('canceled', 'ERR_CANCELED', config);
      return respond(config, 500, { error: { code: 'INTERNAL', message: 'Ошибка' } });
    };
    useAuthStore.setState({ accessToken: 'new-token' });
    await Promise.allSettled([apiClient.get('/a'), apiClient.get('/cancel')]);
    expect(offlineToasts()).toHaveLength(0);
  });
});
