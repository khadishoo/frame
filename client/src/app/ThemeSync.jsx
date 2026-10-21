import { useEffect } from 'react';
import { updateMe } from '@/api/users';
import { useAuthStore } from '@/features/auth/authStore';
import { useThemeStore } from '@/lib/theme';
import { toast } from '@/lib/toast';

/**
 * Связывает тему с профилем пользователя:
 * 1) началась сессия (вход, регистрация, восстановление после перезагрузки) —
 *    применяем тему из профиля: на другом устройстве будет та же тема;
 * 2) вошедший пользователь сменил тему любым переключателем — сохраняем её в профиль.
 * localStorage остаётся источником темы до входа и для гостей.
 */
export function ThemeSync() {
  // 1. Профиль → браузер
  useEffect(
    () =>
      useAuthStore.subscribe((state, prev) => {
        const sessionStarted = state.user && state.user.id !== prev.user?.id;
        if (sessionStarted && state.user.theme) {
          const { preference, setPreference } = useThemeStore.getState();
          if (preference !== state.user.theme) setPreference(state.user.theme);
        }
      }),
    [],
  );

  // 2. Браузер → профиль
  useEffect(
    () =>
      useThemeStore.subscribe((state, prev) => {
        if (state.preference === prev.preference) return;
        const { status, user, setUser } = useAuthStore.getState();
        if (status !== 'authenticated' || user?.theme === state.preference) return;

        updateMe({ theme: state.preference })
          .then(({ user: updated }) => setUser(updated))
          .catch(() =>
            toast.error('Тема не сохранилась в профиле', {
              description: 'В этом браузере она уже применена',
            }),
          );
      }),
    [],
  );

  return null;
}
