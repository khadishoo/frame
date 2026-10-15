import axios from 'axios';

// Единый axios-инстанс: сюда позже добавятся interceptors для access-токена и refresh (этап 4)
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  withCredentials: true, // отправлять cookie (refresh-токен) на API
  timeout: 10_000,
});
