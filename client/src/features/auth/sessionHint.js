/**
 * Отметка «в этом браузере была сессия» — в localStorage, БЕЗ токенов и данных пользователя.
 * Refresh-cookie httpOnly, из JS её не видно; без отметки гость при каждом открытии сайта
 * ходил бы на /auth/refresh, получал 401 (ошибка в консоли) и видел заставку вместо формы.
 * Хранилище недоступно (приватный режим, запрет) → считаем, что отметка есть: пробуем refresh,
 * как раньше.
 */
const KEY = 'frame-session';

export const hasSessionHint = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return true;
  }
};

export const setSessionHint = (active) => {
  try {
    if (active) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    // нет доступа к хранилищу — просто без отметки
  }
};
