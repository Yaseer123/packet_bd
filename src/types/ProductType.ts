/// <reference types="./glodbal.d.ts" />
import type { Category, Product } from "@prisma/client";

export type JsonValue =
  | string
  | number
  | boolean
  | { [x: string]: JsonValue }
  | Array<JsonValue>
  | null;

export interface Variant {
  [key: string]: string | number | string[] | undefined;
  colorName?: string;
  colorHex?: string;
  size?: string;
  images?: string[];
  price?: number;
  discountedPrice?: number;
  stock?: number;
  imageId?: string;
  sku?: string;
}

export const StockStatus = {
  IN_STOCK: "IN_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  PRE_ORDER: "PRE_ORDER",
} as const;

export type StockStatus = (typeof StockStatus)[keyof typeof StockStatus];

export interface ProductType {
  id: string;
  title: string;
  featured: boolean;
  shortDescription: string;
  published: boolean;
  discountedPrice: number | null;
  stockStatus?: StockStatus;
  category: string;
  name: string;
  new: boolean;
  sale: boolean;
  rate: number;
  price: number;
  originPrice: number;
  brand: string;
  defaultColor?: string;
  defaultColorHex?: string | null;
  defaultSize?: string;
  sold: number;
  quantity: number;
  quantityPurchase: number;
  sizes: Array<string>;
  images: Array<string>;
  description: string | null;
  action: string;
  slug: string;
  attributes: Record<string, string>;
  variants?: Variant[] | null;
  sku?: string;
  imageId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  stock?: number;
  estimatedDeliveryTime?: number;
  categoryId?: string;
  deletedAt?: Date | null;
  descriptionImageId?: string | null;
  categoryAttributes?: JsonValue;
  position?: number;
}

export type ProductWithCategory = Product & {
  category: Category | null;
  defaultColor?: string | null;
  defaultColorHex?: string | null;
  defaultSize?: string | null;
  variants?: Variant[] | null;
};
