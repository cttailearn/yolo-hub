'use client';

import { create } from 'zustand';
import type { Model } from '@/types';
import { api } from '@/lib/api/client';

interface ModelState {
  models: Model[];
  currentModel: Model | null;
  loading: boolean;
  error: string | null;

  fetchModels: () => Promise<void>;
  fetchModel: (id: string) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
}

export const useModelStore = create<ModelState>((set) => ({
  models: [],
  currentModel: null,
  loading: false,
  error: null,

  fetchModels: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<{ models: Model[]; total: number }>('/models');
      set({ models: response.models, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  fetchModel: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const model = await api.get<Model>(`/models/${id}`);
      set({ currentModel: model, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  deleteModel: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/models/${id}`);
      set((state) => ({
        models: state.models.filter((m) => m.id !== id),
        currentModel: state.currentModel?.id === id ? null : state.currentModel,
        loading: false,
      }));
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },
}));
