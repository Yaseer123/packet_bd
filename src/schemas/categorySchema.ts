import { z } from "zod";

// Category Schema for validation
export const newCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  parentId: z.string().nullable(),
  image: z.instanceof(File).optional(),
  description: z.string().nullable(),
});

export const categoryAttributeSchema = z.object({
  name: z.string(),
  type: z.literal("select"), // Only allow "select" type
  options: z.array(z.string()).min(1, "At least one option is required"),
  required: z.boolean().default(false),
});

export type CategoryAttribute = z.infer<typeof categoryAttributeSchema>;

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  imageId: z.string().nullable(),
  image: z.string().nullable(),
  order: z.number().default(0),
  attributes: z.array(categoryAttributeSchema).default([]),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type NewCategory = z.infer<typeof newCategorySchema>;

export type Category = z.infer<typeof categorySchema>;

export type CategoryTree = Category & {
  subcategories: CategoryTree[];
};
