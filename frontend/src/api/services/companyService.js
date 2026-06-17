import apiClient from '../client';

export const companyService = {
  getCompanies: (filters) => apiClient.get('/companies', { params: filters }),
  getAll: (filters) => apiClient.get('/companies', { params: filters }),
  getCompanyBySlug: (slug) => apiClient.get(`/companies/${slug}`),
  getCompanyQuestions: (slug) => apiClient.get(`/companies/${slug}/questions`),
};
