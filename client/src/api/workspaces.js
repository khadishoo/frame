import { apiClient } from './client';

/** → { items: [{ id, name, slug, isPersonal, role }] } */
export const listWorkspaces = () => apiClient.get('/workspaces').then((res) => res.data);
