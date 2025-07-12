// cartStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  id: string;
  name: string;
  price: number;
  discountedPrice?: number;
  quantity: number;
  coverImage: string;
  sku: string;
  color?: string;
  size?: string;
  productId: string;
}

interface CartState {
  cartArray: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCart: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  note: string;
  setNote: (note: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cartArray: [],

      addToCart: (item: CartItem) =>
        set((state) => {
          const existingItem = state.cartArray.find(
            (cartItem) => cartItem.id === item.id,
          );
          if (existingItem) {
            return state; // Return unchanged state if item exists
          }
          return {
            cartArray: [...state.cartArray, { ...item }],
          };
        }),

      removeFromCart: (itemId: string) =>
        set((state) => ({
          cartArray: state.cartArray.filter((item) => item.id !== itemId),
        })),

      updateCart: (itemId: string, quantity: number) =>
        set((state) => ({
          cartArray: state.cartArray.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity,
                }
              : item,
          ),
        })),

      clearCart: () => set({ cartArray: [] }),

      note: "",
      setNote: (note) => set({ note }),
    }),
    {
      name: "cart-storage", // unique name for localStorage
    },
  ),
);
