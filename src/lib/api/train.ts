/**
 * 训练 API
 */
import { api } from './client';
import type { TrainingTask, Metric, TrainingConfig } from '@/types';

export const trainApi = {
  list: () => api.get<TrainingTask[]>('/train'),

  get: (taskId: string) => api.get<TrainingTask>(`/train/${taskId}`),

  create: (data: {
    dataset_id: string;
    model_name: string;
    yolo_version: string;
    config: TrainingConfig;
  }) => api.post<TrainingTask>('/train', data),

  pause: (taskId: string) => api.post<{ success: boolean }>(`/train/${taskId}/pause`),

  resume: (taskId: string) => api.post<{ success: boolean }>(`/train/${taskId}/resume`),

  stop: (taskId: string) => api.post<{ success: boolean }>(`/train/${taskId}/stop`),

  getMetrics: (taskId: string) => api.get<Metric[]>(`/train/${taskId}/metrics`),

  getWeights: (taskId: string) =>
    api.get<{ best: string | null; last: string | null }>(`/train/${taskId}/weights`),
};
