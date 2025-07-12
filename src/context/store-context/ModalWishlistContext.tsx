// modalWishlistStore.ts
import { create } from "zustand";

interface ModalWishlistState {
  isModalOpen: boolean;
  openModalWishlist: () => void;
  closeModalWishlist: () => void;
}

export const useModalWishlistStore = create<ModalWishlistState>((set) => ({
  isModalOpen: false,
  openModalWishlist: () => set({ isModalOpen: true }),
  closeModalWishlist: () => set({ isModalOpen: false }),
}));
