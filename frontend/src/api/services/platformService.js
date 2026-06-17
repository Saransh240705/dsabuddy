import apiClient from '../client';

export const platformService = {
  getConnections: () => apiClient.get('/platform-connections'),
  getAll: () => apiClient.get('/platform-connections'),
  updateConnection: (platform, data) => apiClient.put(`/platform-connections/${platform.toUpperCase()}`, data),
  deleteConnection: (platform) => apiClient.delete(`/platform-connections/${platform.toUpperCase()}`),
  syncConnection: (platform) => apiClient.post(`/platform-connections/${platform.toUpperCase()}/sync`),
};
