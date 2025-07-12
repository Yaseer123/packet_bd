// modalSearchStore.ts
import { create } from "zustand";

interface ModalSearchState {
  isModalOpen: boolean;
  openModalSearch: () => void;
  closeModalSearch: () => void;
}

export const useModalSearchStore = create<ModalSearchState>((set) => ({
  isModalOpen: false,
  openModalSearch: () => set({ isModalOpen: true }),
  closeModalSearch: () => set({ isModalOpen: false }),
}));
