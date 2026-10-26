export const CONNECTION_ERROR_MESSAGE = 'Нет соединения с сервером';

/**
 * Сервер не ответил: сети нет, API выключен, истёк таймаут или прокси (Vite, хостинг)
 * вернул свою ошибку вместо нашего { error }. Отменённый запрос (AbortController) — не в счёт.
 */
export const isConnectionError = (error) => {
  if (!error?.isAxiosError || error.code === 'ERR_CANCELED') return false;
  const { response } = error;
  if (!response) return true;
  return response.status >= 500 && !response.data?.error;
};

/**
 * Достаёт человекочитаемое сообщение из ошибки axios.
 * Сервер отвечает в формате { error: { code, message, details } }.
 */
export const getErrorMessage = (error) => {
  const apiMessage = error?.response?.data?.error?.message;
  if (apiMessage) return apiMessage;

  if (isConnectionError(error)) {
    return `${CONNECTION_ERROR_MESSAGE}. Проверьте интернет или попробуйте чуть позже.`;
  }

  return error?.message ?? 'Неизвестная ошибка';
};
