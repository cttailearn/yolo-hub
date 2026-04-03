'use client';

import { create } from 'zustand';
import type { Label, TaskType } from '@/types';

interface AnnotationState {
  currentTool: 'select' | 'bbox' | 'polygon' | 'keypoint' | 'obb' | 'classify';
  currentClassId: number;
  currentClassName: string;
  labels: Label[];
  selectedLabelId: string | null;
  taskType: TaskType;

  setCurrentTool: (tool: AnnotationState['currentTool']) => void;
  setCurrentClass: (classId: number, className: string) => void;
  setLabels: (labels: Label[]) => void;
  addLabel: (label: Label) => void;
  updateLabel: (id: string, updates: Partial<Label>) => void;
  deleteLabel: (id: string) => void;
  setSelectedLabelId: (id: string | null) => void;
  setTaskType: (type: TaskType) => void;
  clearLabels: () => void;
}

export const useAnnotationStore = create<AnnotationState>((set) => ({
  currentTool: 'select',
  currentClassId: 0,
  currentClassName: '',
  labels: [],
  selectedLabelId: null,
  taskType: 'detection',

  setCurrentTool: (tool) => set({ currentTool: tool }),
  setCurrentClass: (classId, className) => set({ currentClassId: classId, currentClassName: className }),
  setLabels: (labels) => set({ labels }),
  addLabel: (label) => set((state) => ({ labels: [...state.labels, label] })),
  updateLabel: (id, updates) =>
    set((state) => ({
      labels: state.labels.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),
  deleteLabel: (id) =>
    set((state) => ({
      labels: state.labels.filter((l) => l.id !== id),
      selectedLabelId: state.selectedLabelId === id ? null : state.selectedLabelId,
    })),
  setSelectedLabelId: (id) => set({ selectedLabelId: id }),
  setTaskType: (type) => set({ taskType: type }),
  clearLabels: () => set({ labels: [], selectedLabelId: null }),
}));
