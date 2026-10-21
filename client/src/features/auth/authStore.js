import { create } from 'zustand';

/**
 * Сессия пользователя — ТОЛЬКО в памяти (не localStorage): access-токен не украсть
 * через XSS из хранилища, а после перезагрузки сессию восстанавливает refresh-cookie.
 *
 * status: 'loading' — идёт тихий refresh при старте;
 *         'authenticated' — есть user и accessToken;
 *         'guest' — не вошёл (или сессия закончилась).
 * endReason: почему сессия закончилась — 'logout' | 'expired' | null.
 *   После logout не запоминаем страницу для возврата, после 'expired' — запоминаем.
 * redirectTo: куда отправить после входа (регистрация → онбординг).
 */
export const useAuthStore = create((set) => ({
  status: 'loading',
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
