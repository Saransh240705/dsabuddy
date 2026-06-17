import apiClient from '../client';

export const leetcodeService = {
  getQuestion: (titleSlug) => apiClient.get(`/leetcode/questions/${titleSlug}`),
};
