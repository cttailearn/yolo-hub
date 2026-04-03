/**
 * 模型 API
 */
import { api } from './client';
import type { Model } from '@/types';

export const modelsApi = {
  list: () => api.get<{ models: Model[]; total: number }>('/models'),

  get: (modelId: string) => api.get<Model>(`/models/${modelId}`),

  delete: (modelId: string) => api.delete(`/models/${modelId}`),
};
