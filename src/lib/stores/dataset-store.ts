'use client';

import { create } from 'zustand';
import type { Dataset, ImageFile, Label } from '@/types';
import { api } from '@/lib/api/client';

interface DatasetState {
  datasets: Dataset[];
  currentDataset: Dataset | null;
  images: ImageFile[];
  loading: boolean;
  error: string | null;

  fetchDatasets: () => Promise<void>;
  fetchDataset: (id: string) => Promise<void>;
  createDataset: (data: Partial<Dataset>) => Promise<Dataset>;
  updateDataset: (id: string, data: Partial<Dataset>) => Promise<void>;
  deleteDataset: (id: string) => Promise<void>;
  fetchImages: (datasetId: string) => Promise<void>;
  uploadImages: (datasetId: string, files: File[], split: string) => Promise<void>;
  deleteImage: (datasetId: string, imageId: string) => Promise<void>;
  fetchLabels: (datasetId: string, imageId: string) => Promise<Label[]>;
  updateLabels: (datasetId: string, imageId: string, labels: Label[]) => Promise<void>;
}

export const useDatasetStore = create<DatasetState>((set, get) => ({
  datasets: [],
  currentDataset: null,
  images: [],
  loading: false,
  error: null,

  fetchDatasets: async () => {
    set({ loading: true, error: null });
    try {
      const datasets = await api.get<Dataset[]>('/datasets');
      set({ datasets, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  fetchDataset: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const dataset = await api.get<Dataset>(`/datasets/${id}`);
      set({ currentDataset: dataset, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createDataset: async (data: Partial<Dataset>) => {
    set({ loading: true, error: null });
    try {
      const dataset = await api.post<Dataset>('/datasets', data);
      set((state) => ({
        datasets: [dataset, ...state.datasets],
        loading: false,
      }));
      return dataset;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  updateDataset: async (id: string, data: Partial<Dataset>) => {
    set({ loading: true, error: null });
    try {
      const dataset = await api.put<Dataset>(`/datasets/${id}`, data);
      set((state) => ({
        datasets: state.datasets.map((d) => (d.id === id ? dataset : d)),
        currentDataset: state.currentDataset?.id === id ? dataset : state.currentDataset,
        loading: false,
      }));
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  deleteDataset: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/datasets/${id}`);
      set((state) => ({
        datasets: state.datasets.filter((d) => d.id !== id),
        currentDataset: state.currentDataset?.id === id ? null : state.currentDataset,
        loading: false,
      }));
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  fetchImages: async (datasetId: string) => {
    set({ loading: true, error: null });
    try {
      const images = await api.get<ImageFile[]>(`/datasets/${datasetId}/images`);
      set({ images, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  uploadImages: async (datasetId: string, files: File[], split: string) => {
    set({ loading: true, error: null });
    try {
      await api.upload(`/datasets/${datasetId}/images`, files, { split });
      await get().fetchImages(datasetId);
      await get().fetchDataset(datasetId);
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  deleteImage: async (datasetId: string, imageId: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/datasets/${datasetId}/images/${imageId}`);
      set((state) => ({
        images: state.images.filter((i) => i.id !== imageId),
        loading: false,
      }));
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  fetchLabels: async (datasetId: string, imageId: string) => {
    try {
      const response = await api.get<{ labels: Label[] }>(`/datasets/${datasetId}/labels/${imageId}`);
      return response.labels;
    } catch (e) {
      throw e;
    }
  },

  updateLabels: async (datasetId: string, imageId: string, labels: Label[]) => {
    try {
      await api.put(`/datasets/${datasetId}/labels/${imageId}`, { labels });
    } catch (e) {
      throw e;
    }
  },
}));
