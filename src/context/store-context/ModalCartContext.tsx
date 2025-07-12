// modalCartStore.ts
import { create } from "zustand";

interface ModalCartState {
  isModalOpen: boolean;
  openModalCart: () => void;
  closeModalCart: () => void;
}

export const useModalCartStore = create<ModalCartState>((set) => ({
  isModalOpen: false,
  openModalCart: () => set({ isModalOpen: true }),
  closeModalCart: () => set({ isModalOpen: false }),
}));
