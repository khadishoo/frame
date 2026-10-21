import { apiClient } from './client';

/** Частичное обновление профиля: { name?, creativeTypes? } → { user } */
export const updateMe = (data) => apiClient.patch('/users/me', data).then((res) => res.data);
