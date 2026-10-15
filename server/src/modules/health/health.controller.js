import * as healthService from './health.service.js';

export const getHealth = async (req, res) => {
  const result = await healthService.checkHealth();
  res.json(result);
};
