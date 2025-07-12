// modalQuickViewStore.ts
import type { Product } from "@prisma/client";
import { create } from "zustand";

interface ModalQuickViewState {
  selectedProduct: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
}

export const useModalQuickViewStore = create<ModalQuickViewState>((set) => ({
  selectedProduct: null,
  openQuickView: (product: Product) => set({ selectedProduct: product }),
  closeQuickView: () => set({ selectedProduct: null }),
}));
