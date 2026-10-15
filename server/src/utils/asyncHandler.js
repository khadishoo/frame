/**
 * Оборачивает async-обработчик и передаёт отклонённый промис в next(err).
 * Express 5 умеет это сам, но обёртка делает поведение явным
 * и не зависит от версии Express.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
