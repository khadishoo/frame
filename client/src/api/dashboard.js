import { apiClient } from './client';

/** Сводка для главной. tz — часовой пояс браузера: от него зависят «сегодня» и дни графика. */
export const getDashboard = (wsId, tz) =>
  apiClient.get(`/workspaces/${wsId}/dashboard`, { params: { tz } }).then((res) => res.data);
