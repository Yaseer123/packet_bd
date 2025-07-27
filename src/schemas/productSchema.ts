import { z } from "zod";

// Define a schema for category attribute values
// This is more flexible than the full category attribute definition
export const categoryAttributeValueSchema = z.record(
  z.string(), // The attribute name
  z.union([z.string(), z.number(), z.boolean()]), // Possible values
);

// Variant schema for color/size/image variations
export const variantSchema = z.object({
  colorName: z.string().optional(),
  colorHex: z.string().optional(),
  size: z.string().optional(),
  images: z.array(z.string()).optional(),
  price: z.number().optional(),
  discountedPrice: z.number().optional(),
  stock: z.number().optional(),
  sku: z.string().optional(), // Add SKU for each variant
});

// Add schema for quantity discounts
export const quantityDiscountSchema = z.object({
  minQty: z.number().min(1),
  maxQty: z.number().min(1),
  discountPercent: z.number().min(0).max(100),
});

export const productSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  shortDescription: z.string().min(3),
  description: z.string().optional(),
  price: z.number().positive(),
  discountedPrice: z.number().optional(),
  stock: z.number().int().nonnegative(),
  brand: z.string(),
  defaultColor: z.string().optional(),
  defaultColorHex: z.string().optional(),
  defaultSize: z.string().optional(),
  variantLabel: z.string().optional(),
  perUnitText: z.string().optional(),
  imageId: z.string(),
  images: z.array(z.string()),
  categoryId: z.string(),
  descriptionImageId: z.string().optional(),
  attributes: z.record(z.string(), z.string()).default({}),
  estimatedDeliveryTime: z.number().int().positive().optional(),
  categoryAttributes: categoryAttributeValueSchema.default({}), // Add categoryAttributes field
  variants: z.array(variantSchema).optional(), // Add variants field
  minQuantity: z.number().min(1).default(1),
  maxQuantity: z.number().nullable().optional(),
  quantityStep: z.number().min(1).default(1),
  quantityDiscounts: z.array(quantityDiscountSchema).default([]),
});

export const updateProductSchema = z.object({
  id: z.string(),
  title: z.string().min(3).optional(),
  slug: z.string().min(3).optional(),
  shortDescription: z.string().min(3).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  discountedPrice: z.number().optional(),
  stock: z.number().int().nonnegative().optional(),
  brand: z.string().optional(),
  defaultColor: z.string().optional(),
  defaultColorHex: z.string().optional(),
  defaultSize: z.string().optional(),
  variantLabel: z.string().optional(),
  perUnitText: z.string().optional(),
  images: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  descriptionImageId: z.string().optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  estimatedDeliveryTime: z.number().int().positive().optional(),
  categoryAttributes: categoryAttributeValueSchema.optional(), // Add categoryAttributes field
  variants: z.array(variantSchema).optional(), // Add variants field
  minQuantity: z.number().min(1).optional(),
  maxQuantity: z.number().nullable().optional(),
  quantityStep: z.number().min(1).optional(),
  quantityDiscounts: z.array(quantityDiscountSchema).optional(),
});

export type Product = z.infer<typeof productSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
