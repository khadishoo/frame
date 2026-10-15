import { apiClient } from './client';

export const getHealth = async () => {
  const { data } = await apiClient.get('/health');
  return data;
};
