import { AppError } from '../utils/AppError.js';

// Срабатывает, если ни один маршрут не подошёл
export const notFound = (req, res, next) => {
  next(AppError.notFound(`Маршрут ${req.method} ${req.originalUrl} не найден`));
};
