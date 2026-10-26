import { useEffect } from 'react';
import { refreshSession } from '@/api/client';
import { useAuthStore } from '@/features/auth/authStore';

/**
 * Тихий refresh при старте: если есть живая refresh-cookie, сессия восстановится
 * без формы входа. Если в этом браузере не входили (нет отметки sessionHint),
 * store стартует сразу со status 'guest' — запроса нет, заставки перед формой входа тоже. Повторный вызов (StrictMode в dev) объединится с первым —
 * refreshSession возвращает тот же промис.
 */
export function AuthBootstrap({ children }) {
  useEffect(() => {
    if (useAuthStore.getState().status !== 'loading') return;
    refreshSession().catch(() => {
      useAuthStore.getState().clearSession();
    });
  }, []);

  return children;
}
