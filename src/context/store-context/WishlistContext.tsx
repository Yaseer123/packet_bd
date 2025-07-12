// wishlistStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
// import { type ProductType } from "@/types/ProductType";
import type { Product } from "@prisma/client";

interface WishlistState {
  wishlistArray: Product[];
  addToWishlist: (item: Product) => void;
  removeFromWishlist: (itemId: string) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      wishlistArray: [],

      addToWishlist: (item: Product) =>
        set((state) => ({
          wishlistArray: [...state.wishlistArray, { ...item }],
        })),

      removeFromWishlist: (itemId: string) =>
        set((state) => ({
          wishlistArray: state.wishlistArray.filter(
            (item) => item.id !== itemId,
          ),
        })),
    }),
    {
      name: "wishlist-storage", // unique name for localStorage
    },
  ),
);
