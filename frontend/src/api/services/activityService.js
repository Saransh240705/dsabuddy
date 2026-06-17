import apiClient from '../client';

export const activityService = {
  getAnalytics: (params) => apiClient.get('/daily-activity/analytics', { params }),
};
