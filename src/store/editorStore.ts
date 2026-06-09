import { create } from 'zustand';
import { RoomTemplate } from '../data/rooms';
import { DesignItem, DesignState, AIRecommendation } from '../types/editor';

interface EditorStore {
  room: RoomTemplate | null;
  setRoom: (room: RoomTemplate) => void;

  items: DesignItem[];
  addItem: (item: DesignItem) => void;
  updateItem: (id: string, patch: Partial<DesignItem>) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;

  selectedItemId: string | null;
  selectItem: (id: string | null) => void;

  dragItemId: string | null;
  setDragItemId: (id: string | null) => void;

  aiRecommendation: AIRecommendation | null;
  setAiRecommendation: (rec: AIRecommendation | null) => void;

  currentDesignId: string | null;
  setCurrentDesignId: (id: string) => void;

  loadDesign: (state: DesignState) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  room: null,
  setRoom: (room) => set({ room }),

  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  updateItem: (id, patch) =>
    set((s) => ({ items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })),
  removeItem: (id) =>
    set((s) => ({
      items: s.items.filter((it) => it.id !== id),
      selectedItemId: s.selectedItemId === id ? null : s.selectedItemId,
    })),
  clearItems: () => set({ items: [], selectedItemId: null }),

  selectedItemId: null,
  selectItem: (id) => set({ selectedItemId: id }),

  dragItemId: null,
  setDragItemId: (id) => set({ dragItemId: id }),

  aiRecommendation: null,
  setAiRecommendation: (rec) => set({ aiRecommendation: rec }),

  currentDesignId: null,
  setCurrentDesignId: (id) => set({ currentDesignId: id }),

  loadDesign: (state) =>
    set({ items: state.items, currentDesignId: state.id ?? null, selectedItemId: null }),
}));
