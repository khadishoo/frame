import { apiClient } from './client';

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null),
  );

/** → { items, total, limit, offset } */
export const listNotes = (wsId, params) =>
  apiClient.get(`/workspaces/${wsId}/notes`, { params: clean(params) }).then((res) => res.data);

export const getNote = (id) => apiClient.get(`/notes/${id}`).then((res) => res.data);

export const createNote = (wsId, data) =>
  apiClient.post(`/workspaces/${wsId}/notes`, data).then((res) => res.data);

export const updateNote = (id, data) =>
  apiClient.patch(`/notes/${id}`, data).then((res) => res.data);

export const deleteNote = (id) => apiClient.delete(`/notes/${id}`);

/** Превратить идею в проект → { project, note } */
export const convertNote = (id, type) =>
  apiClient.post(`/notes/${id}/convert`, { type }).then((res) => res.data);
