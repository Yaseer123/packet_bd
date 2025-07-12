"use client";

import { readAllImages } from "@/app/actions/file";
import { create } from "zustand";

interface ImageStore {
  images: string[];
  loadImages: (filter: string) => Promise<void>; // Load images with optional filter
  updateImages: (images: string[]) => void;
  removeOldImage: (src: string) => void;
}

export const useImageStore = create<ImageStore>((set) => ({
  images: [],

  // Load images from API (optionally with filter)
  loadImages: async (filter: string) => {
    try {
      const images = await readAllImages(filter);
      const imageUrls = images.map(
        (image: { secure_url: string }) => image.secure_url,
      );
      set({ images: imageUrls });
    } catch (error) {
      console.error("Failed to load images:", error);
    }
  },

  // Add new images
  updateImages: (newImages) => {
    set((state) => ({ images: [...newImages, ...state.images] }));
  },

  // Remove image by source
  removeOldImage: (src) => {
    set((state) => ({
      images: state.images.filter((img) => img !== src),
    }));
  },
}));
