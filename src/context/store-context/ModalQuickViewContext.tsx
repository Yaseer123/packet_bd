// modalQuickViewStore.ts
import type { ProductType } from "@/types/ProductType";
import { create } from "zustand";

interface ModalQuickViewState {
  selectedProduct: ProductType | null;
  openQuickView: (product: ProductType) => void;
  closeQuickView: () => void;
}

export const useModalQuickViewStore = create<ModalQuickViewState>((set) => ({
  selectedProduct: null,
  openQuickView: (product: ProductType) => set({ selectedProduct: product }),
  closeQuickView: () => set({ selectedProduct: null }),
}));
