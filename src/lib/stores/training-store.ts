'use client';

import { create } from 'zustand';
import type { TrainingTask, Metric } from '@/types';
import { api } from '@/lib/api/client';

interface TrainingState {
  tasks: TrainingTask[];
  currentTask: TrainingTask | null;
  metrics: Metric[];
  loading: boolean;
  error: string | null;

  fetchTasks: () => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  createTask: (data: Partial<TrainingTask>) => Promise<TrainingTask>;
  pauseTask: (id: string) => Promise<void>;
  resumeTask: (id: string) => Promise<void>;
  stopTask: (id: string) => Promise<void>;
  fetchMetrics: (taskId: string) => Promise<void>;
}

export const useTrainingStore = create<TrainingState>((set, get) => ({
  tasks: [],
  currentTask: null,
  metrics: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await api.get<TrainingTask[]>('/train');
      set({ tasks, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  fetchTask: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const task = await api.get<TrainingTask>(`/train/${id}`);
      set({ currentTask: task, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createTask: async (data: Partial<TrainingTask>) => {
    set({ loading: true, error: null });
    try {
      const task = await api.post<TrainingTask>('/train', data);
      set((state) => ({
        tasks: [task, ...state.tasks],
        loading: false,
      }));
      return task;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  pauseTask: async (id: string) => {
    try {
      await api.post(`/train/${id}/pause`);
      await get().fetchTask(id);
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  resumeTask: async (id: string) => {
    try {
      await api.post(`/train/${id}/resume`);
      await get().fetchTask(id);
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  stopTask: async (id: string) => {
    try {
      await api.post(`/train/${id}/stop`);
      await get().fetchTask(id);
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  fetchMetrics: async (taskId: string) => {
    try {
      const metrics = await api.get<Metric[]>(`/train/${taskId}/metrics`);
      set({ metrics });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
}));
