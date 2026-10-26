import { isConnectionError } from '@/lib/getErrorMessage';

/**
 * Превращает ошибку API в понятный текст и, где можно, привязывает её к полю формы.
 * Возвращает сообщение для всей формы (или null, если ошибка показана у поля).
 */
export const applyServerError = (error, setError) => {
  const status = error?.response?.status;
  const apiError = error?.response?.data?.error;

  // Ответа нет или вместо API ответил прокси (502/504 без нашего { error })
  if (isConnectionError(error)) {
    return 'Нет соединения с сервером. Проверьте интернет и попробуйте снова';
  }

  // Сервер указал поля (пути вида body.username) — показываем ошибки под ними.
  // Так работают VALIDATION_ERROR, USERNAME_TAKEN, «неверный пароль» и др.
  let shownAtField = false;
  for (const detail of apiError?.details ?? []) {
    const field = detail.path?.replace(/^body\./, '');
    if (field && !field.includes('.')) {
      setError(field, { message: detail.message });
      shownAtField = true;
    }
  }
  if (shownAtField) return null;

  switch (apiError?.code) {
    case 'EMAIL_TAKEN':
      setError('email', { message: 'Этот email уже зарегистрирован — попробуйте войти' });
      return null;
    case 'INVALID_CREDENTIALS':
      return 'Неверный email или пароль';
    case 'TOO_MANY_REQUESTS':
      return 'Слишком много попыток. Подождите минуту и попробуйте снова';
    case 'VALIDATION_ERROR':
      return 'Проверьте правильность заполнения формы';
    default:
      return status >= 500
        ? 'На сервере что-то сломалось. Попробуйте чуть позже'
        : (apiError?.message ?? 'Не удалось выполнить запрос');
  }
};
