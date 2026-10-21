import axios from 'axios';
import { useAuthStore } from '@/features/auth/authStore';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/lib/toast';

/**
 * Единый axios-инстанс.
 * - подставляет Authorization: Bearer <accessToken> из authStore;
 * - на 401 один раз обновляет сессию через /auth/refresh и повторяет запрос.
 * Запросы с { skipAuthRefresh: true } (login, register, refresh, logout) не обновляются —
 * для них 401 означает «неверные данные», а не «истёк токен», и так не бывает петли.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  withCredentials: true, // отправлять cookie (refresh-токен) на API
  timeout: 10_000,
});

// Блокировка между вкладками: две вкладки не обновят сессию одновременно.
// Иначе вторая пришла бы с уже использованным refresh-токеном, и сервер, приняв это
// за кражу, завершил бы все сессии. Вторая вкладка дождётся первой и возьмёт новую cookie.
const withCrossTabLock = (fn) =>
  typeof navigator !== 'undefined' && navigator.locks?.request
    ? navigator.locks.request('frame-auth-refresh', fn)
    : fn();

let refreshPromise = null;

/**
 * Обновить сессию. Параллельные вызовы получают ОДИН и тот же промис:
 * сколько бы запросов ни получили 401 одновременно, refresh уйдёт один раз.
 */
export const refreshSession = () => {
  refreshPromise ??= withCrossTabLock(() =>
    apiClient.post('/auth/refresh', null, { skipAuthRefresh: true }),
  )
    .then(({ data }) => {
      useAuthStore.getState().setSession(data);
      return data;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

/** Сессия закончилась и не обновилась: чистим всё; ProtectedRoute отправит на /login. */
const endExpiredSession = () => {
  const wasAuthenticated = useAuthStore.getState().status === 'authenticated';
  queryClient.clear();
  useAuthStore.getState().clearSession('expired');
  if (wasAuthenticated) {
    toast.warning('Сессия истекла', { description: 'Войдите снова, чтобы продолжить' });
  }
};

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken && !config.skipAuthRefresh) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const canRefresh =
      response?.status === 401 && config && !config.skipAuthRefresh && !config._retried;

    if (!canRefresh) throw error;

    config._retried = true; // повторяем запрос не больше одного раза
    try {
      await refreshSession();
    } catch {
      endExpiredSession();
      throw error;
    }

    config.headers.Authorization = `Bearer ${useAuthStore.getState().accessToken}`;
    return apiClient(config);
  },
);
