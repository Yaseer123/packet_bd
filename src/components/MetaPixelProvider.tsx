"use client";

import { useEffect } from "react";
import ReactPixel from "react-facebook-pixel";

const PIXEL_ID = "730933346576617"; // Your Pixel ID

// Define interfaces for the tracking functions
interface OrderData {
  id: string;
  total: number;
}

interface ProductData {
  id: string;
  title: string;
  discountedPrice?: number | null;
  price: number;
}

export function MetaPixelProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    ReactPixel.init(PIXEL_ID);
    ReactPixel.pageView();
  }, []);

  return <>{children}</>;
}

// Export functions for tracking events
export const trackAddToCart = (product: ProductData) => {
  ReactPixel.track("AddToCart", {
    content_ids: [product.id],
    content_name: product.title,
    content_type: "product",
    value: product.discountedPrice ?? product.price,
    currency: "BDT",
  });
};

export const trackPurchase = (order: OrderData, products: ProductData[]) => {
  ReactPixel.track("Purchase", {
    content_ids: products.map((p) => p.id),
    content_type: "product",
    value: order.total,
    currency: "BDT",
    num_items: products.length,
  });
};

export const trackViewContent = (product: ProductData) => {
  ReactPixel.track("ViewContent", {
    content_ids: [product.id],
    content_name: product.title,
    content_type: "product",
    value: product.discountedPrice ?? product.price,
    currency: "BDT",
  });
};

export const trackInitiateCheckout = (
  products: ProductData[],
  total: number,
) => {
  ReactPixel.track("InitiateCheckout", {
    content_ids: products.map((p) => p.id),
    content_type: "product",
    value: total,
    currency: "BDT",
    num_items: products.length,
  });
};
