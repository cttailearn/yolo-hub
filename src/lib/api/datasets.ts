/**
 * 数据集 API
 */
import { api } from './client';
import type { Dataset, ImageFile, Label } from '@/types';

export const datasetsApi = {
  list: () => api.get<Dataset[]>('/datasets'),

  get: (id: string) => api.get<Dataset>(`/datasets/${id}`),

  create: (data: Partial<Dataset>) =>
    api.post<Dataset>('/datasets', {
      name: data.name,
      description: data.description,
      task_type: data.taskType,
      classes: data.classes,
      split: data.split,
    }),

  update: (id: string, data: Partial<Dataset>) =>
    api.put<Dataset>(`/datasets/${id}`, {
      name: data.name,
      description: data.description,
      task_type: data.taskType,
      classes: data.classes,
      split: data.split,
    }),

  delete: (id: string) => api.delete(`/datasets/${id}`),

  getImages: (datasetId: string) =>
    api.get<ImageFile[]>(`/datasets/${datasetId}/images`),

  uploadImages: (datasetId: string, files: File[], split: string) =>
    api.upload(`/datasets/${datasetId}/images`, files, { split }),

  deleteImage: (datasetId: string, imageId: string) =>
    api.delete(`/datasets/${datasetId}/images/${imageId}`),

  getLabels: (datasetId: string, imageId: string) =>
    api.get<{ labels: Label[] }>(`/datasets/${datasetId}/labels/${imageId}`),

  updateLabels: (datasetId: string, imageId: string, labels: Label[]) =>
    api.put(`/datasets/${datasetId}/labels/${imageId}`, { labels }),
};
