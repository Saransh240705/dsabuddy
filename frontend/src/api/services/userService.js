import apiClient from '../client';

export const userService = {
  getProfile: () => apiClient.get('/auth/me'),
  getMe: () => apiClient.get('/auth/me'),
  updateProfile: (data) => apiClient.patch('/users/me', data),
  getLeaderboard: (filters) => apiClient.get('/users/leaderboard', { params: filters }),
  getUserByUserName: (userName) => apiClient.get(`/users/${userName}`),
};
