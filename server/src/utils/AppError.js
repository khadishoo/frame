/**
 * Ожидаемая ошибка приложения с HTTP-статусом и машиночитаемым кодом.
 * errorHandler превращает её в ответ { error: { code, message, details } }.
 */
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Некорректный запрос', details) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Требуется авторизация') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Недостаточно прав') {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Не найдено') {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message = 'Конфликт данных', details) {
    return new AppError(409, 'CONFLICT', message, details);
  }
}
