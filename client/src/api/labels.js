import { apiClient } from './client';

/**
 * Категории и теги устроены одинаково: kind = 'categories' | 'tags'.
 * list → { items: [{ id, name, color, projectCount }] }
 */
export const listLabels = (kind, wsId) =>
  apiClient.get(`/workspaces/${wsId}/${kind}`).then((res) => res.data.items);

export const createLabel = (kind, wsId, data) =>
  apiClient.post(`/workspaces/${wsId}/${kind}`, data).then((res) => res.data);

export const updateLabel = (kind, id, data) =>
  apiClient.patch(`/${kind}/${id}`, data).then((res) => res.data);

export const deleteLabel = (kind, id) => apiClient.delete(`/${kind}/${id}`);
