import { create } from 'zustand';
import { hasSessionHint, setSessionHint } from './sessionHint';

/**
 * Сессия пользователя — ТОЛЬКО в памяти (не localStorage): access-токен не украсть
 * через XSS из хранилища, а после перезагрузки сессию восстанавливает refresh-cookie.
 *
 * status: 'loading' — идёт тихий refresh при старте (только если в браузере есть отметка
 *           sessionHint; без неё сразу 'guest');
 *         'authenticated' — есть user и accessToken;
 *         'guest' — не вошёл (или сессия закончилась).
 * endReason: почему сессия закончилась — 'logout' | 'expired' | 'deleted' | null.
 *   После logout не запоминаем страницу для возврата, после 'expired' — запоминаем.
 * redirectTo: куда отправить после входа (регистрация → онбординг).
 */
export const useAuthStore = create((set) => ({
  status: hasSessionHint() ? 'loading' : 'guest',
  user: null,
  accessToken: null,
  endReason: null,
  redirectTo: null,

  setSession: ({ user, accessToken }, { redirectTo = null } = {}) =>
    set((state) => ({
      status: 'authenticated',
      user: user ?? state.user,
      accessToken,
      endReason: null,
      redirectTo,
    })),

  setUser: (user) => set({ user }),

  clearSession: (endReason = null) =>
    set({ status: 'guest', user: null, accessToken: null, endReason, redirectTo: null }),
}));

// Вошёл — ставим отметку «сессия была», вышел/истекла — снимаем (см. sessionHint.js)
useAuthStore.subscribe((state, prev) => {
  if (state.status === prev.status) return;
  if (state.status === 'authenticated') setSessionHint(true);
  else if (state.status === 'guest') setSessionHint(false);
});
