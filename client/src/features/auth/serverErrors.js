/**
 * Превращает ошибку API в понятный текст и, где можно, привязывает её к полю формы.
 * Возвращает сообщение для всей формы (или null, если ошибка показана у поля).
 */
export const applyServerError = (error, setError) => {
  const status = error?.response?.status;
  const apiError = error?.response?.data?.error;

  if (!error?.response) {
    return 'Нет соединения с сервером. Проверьте интернет и попробуйте снова';
  }

  switch (apiError?.code) {
    case 'EMAIL_TAKEN':
      setError('email', { message: 'Этот email уже зарегистрирован — попробуйте войти' });
      return null;
    case 'INVALID_CREDENTIALS':
      return 'Неверный email или пароль';
    case 'TOO_MANY_REQUESTS':
      return 'Слишком много попыток. Подождите минуту и попробуйте снова';
    case 'VALIDATION_ERROR': {
      // Сервер отдаёт пути вида body.email — показываем под соответствующим полем
      let shown = false;
      for (const detail of apiError.details ?? []) {
        const field = detail.path?.replace(/^body\./, '');
        if (field && !field.includes('.')) {
          setError(field, { message: detail.message });
          shown = true;
        }
      }
      return shown ? null : 'Проверьте правильность заполнения формы';
    }
    default:
      return status >= 500
        ? 'На сервере что-то сломалось. Попробуйте чуть позже'
        : (apiError?.message ?? 'Не удалось выполнить запрос');
  }
};
