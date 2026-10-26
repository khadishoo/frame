import { apiClient } from './client';

/** Избранное текущего пользователя → { projects, notes } */
export const listFavorites = () => apiClient.get('/favorites').then((res) => res.data);

/** type — 'project' | 'note' */
export const addFavorite = (type, id) => apiClient.post('/favorites', { type, id });

export const removeFavorite = (type, id) => apiClient.delete(`/favorites/${type}/${id}`);
