import { apiClient } from './client';

/** Частичное обновление профиля: { name?, creativeTypes? } → { user } */
export const updateMe = (data) => apiClient.patch('/users/me', data).then((res) => res.data);

/** Смена пароля: { currentPassword, newPassword } → { user, accessToken } (новая cookie ставится сервером) */
export const changePassword = (data) =>
  apiClient.patch('/users/me/password', data).then((res) => res.data);

/** Удаление аккаунта с подтверждением паролем */
export const deleteMe = (password) => apiClient.delete('/users/me', { data: { password } });
