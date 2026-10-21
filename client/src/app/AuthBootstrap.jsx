import { useEffect } from 'react';
import { refreshSession } from '@/api/client';
import { useAuthStore } from '@/features/auth/authStore';

/**
 * Тихий refresh при старте: если есть живая refresh-cookie, сессия восстановится
 * без формы входа. Повторный вызов (StrictMode в dev) объединится с первым —
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
