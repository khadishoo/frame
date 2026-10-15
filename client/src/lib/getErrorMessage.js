/**
 * Достаёт человекочитаемое сообщение из ошибки axios.
 * Сервер отвечает в формате { error: { code, message, details } }.
 */
export const getErrorMessage = (error) => {
  const apiMessage = error?.response?.data?.error?.message;
  if (apiMessage) return apiMessage;

  // Ответа нет или это не наш формат (например, прокси Vite не достучался до API)
  if (!error?.response || error.response.status >= 502) {
    return 'Сервер API недоступен';
  }

  return error.message ?? 'Неизвестная ошибка';
};
