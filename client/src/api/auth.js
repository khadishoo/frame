import { apiClient, refreshSession } from './client';

// 401 у этих запросов — «неверные данные», а не «истёк токен»: refresh не нужен
const noRefresh = { skipAuthRefresh: true };

/** → { user, accessToken }; refresh-токен сервер кладёт в httpOnly cookie */
export const register = (data) =>
  apiClient.post('/auth/register', data, noRefresh).then((res) => res.data);

/** → { user, accessToken } */
export const login = (data) =>
  apiClient.post('/auth/login', data, noRefresh).then((res) => res.data);

/** → { user, accessToken }; параллельные вызовы объединяются в один запрос */
export const refresh = refreshSession;

export const logout = () => apiClient.post('/auth/logout', null, noRefresh);

/** → { user, workspaces } */
export const me = () => apiClient.get('/auth/me').then((res) => res.data);
