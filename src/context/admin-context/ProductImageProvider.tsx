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
    // Handle Cloudinary URLs: https://res.cloudinary.com/[cloud_name]/image/upload/[version]/[public_id]
    if (url.includes("cloudinary.com")) {
      const urlParts = url.split("/");
      const uploadIndex = urlParts.findIndex((part) => part === "upload");
      if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
        // Skip version and get the public_id
        const publicId = urlParts
          .slice(uploadIndex + 2)
          .join("/")
          .split(".")[0]; // Remove file extension
        if (publicId) return publicId;
      }
    }

    // Handle S3 URLs: https://[bucketName].s3.[region].amazonaws.com/[key]
    if (url.includes("amazonaws.com")) {
      const parsedUrl = new URL(url);
      return parsedUrl.pathname.substring(1);
    }

    // Fallback: use the URL as the ID if we can't extract a proper public ID
    console.warn("Could not extract public ID from URL:", url);
    return url;
  } catch (error) {
    console.error("Failed to extract public ID from URL:", error);
    return url; // Use URL as fallback ID
  }
};

export const useProductImageStore = create<ProductImageStore>((set) => ({
  images: [],

  loadImages: async (filter: string, existingImages: string[] = []) => {
    try {
      console.log("🚀 loadImages called with:", { filter, existingImages });

      if (existingImages && existingImages.length > 0) {
        // If we have existing image URLs, convert them to the required format
        console.log("🔄 Loading existing images with order:", existingImages);
        console.log(
          "📋 Original order:",
          existingImages.map((url, idx) => `${idx + 1}. ${url}`),
        );

        const formattedImages = existingImages.map((url, index) => {
          const id = extractPublicIdFromUrl(url);
          console.log(`📸 Image ${index + 1}:`, {
            url,
            id,
            originalIndex: index,
          });
          return { id, src: url };
        });

        console.log("✅ Formatted images with IDs:", formattedImages);
        console.log(
          "📋 Final order:",
          formattedImages.map((img, idx) => `${idx + 1}. ${img.src}`),
        );

        // Set the images in the store with the preserved order
        set({ images: formattedImages });

        console.log("✅ Images set in store with order preserved");
      } else {
        // Otherwise, fetch images as before using the filter
        console.log("🔄 Fetching images from API with filter:", filter);
        const response = await readAllImages(filter);
        const apiImages = response.map(
          (image: { public_id: string; secure_url: string }) => ({
            id: image.public_id,
            src: image.secure_url,
          }),
        );
        console.log("✅ API images loaded:", apiImages);
        set({ images: apiImages });
      }
    } catch (error) {
      console.error("❌ Failed to load images:", error);
    }
  },

  setImages: (images: ProductImage[]) => {
    console.log("🔄 setImages called with:", {
      count: images.length,
      order: images.map((img, idx) => `${idx + 1}. ${img.src}`),
      images: images,
    });
    set({ images });
    console.log("✅ Images order updated in store");
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
