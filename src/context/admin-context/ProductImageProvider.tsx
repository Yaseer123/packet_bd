"use client";

import { readAllImages } from "@/app/actions/file";
import { create } from "zustand";

export type ProductImage = {
  id: string;
  src: string;
};

interface ProductImageStore {
  images: ProductImage[];
  loadImages: (filter: string, existingImages?: string[]) => Promise<void>;
  setImages: (images: ProductImage[]) => void;
  updateImages: (images: ProductImage[]) => void;
  removeOldImage: (src: string) => void;
}

// Helper function to extract public ID from image URL
const extractPublicIdFromUrl = (url: string): string => {
  try {
    // The URL format is like: https://[bucketName].s3.[region].amazonaws.com/[key]
    const parsedUrl = new URL(url);
    // Get the pathname part (which starts with /) and remove the leading /
    return parsedUrl.pathname.substring(1);
  } catch (error) {
    console.error("Failed to extract public ID from URL:", error);
    return "";
  }
};

export const useProductImageStore = create<ProductImageStore>((set) => ({
  images: [],

  loadImages: async (filter: string, existingImages: string[] = []) => {
    try {
      if (existingImages && existingImages.length > 0) {
        // If we have existing image URLs, convert them to the required format
        const formattedImages = existingImages.map((url) => ({
          id: extractPublicIdFromUrl(url),
          src: url,
        }));
        set({ images: formattedImages });
      } else {
        // Otherwise, fetch images as before using the filter
        const response = await readAllImages(filter);
        set({
          images: response.map(
            (image: { public_id: string; secure_url: string }) => ({
              id: image.public_id,
              src: image.secure_url,
            }),
          ),
        });
      }
    } catch (error) {
      console.error("Failed to load images:", error);
    }
  },

  setImages: (images: ProductImage[]) => {
    set({ images });
  },

  updateImages: (newImages: ProductImage[]) => {
    set((state) => ({
      images: [...state.images, ...newImages],
    }));
  },

  removeOldImage: (src: string) => {
    set((state) => ({
      images: state.images.filter((img) => img.src !== src),
    }));
  },
}));
