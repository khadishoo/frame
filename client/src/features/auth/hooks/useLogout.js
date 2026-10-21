import { useCallback } from 'react';
import * as authApi from '@/api/auth';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '../authStore';

/**
 * Выход: отзываем refresh-токен на сервере, чистим кэш запросов и сессию.
 * На /login отправит ProtectedRoute (без запоминания страницы — это явный выход).
 */
export const useLogout = () =>
  useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Сервер недоступен — всё равно выходим локально; cookie истечёт сама
    }
    queryClient.clear();
    useAuthStore.getState().clearSession('logout');
  }, []);
