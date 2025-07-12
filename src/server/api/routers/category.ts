import type {
  Category,
  CategoryAttribute,
  CategoryTree,
} from "@/schemas/categorySchema";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const buildCategoryTree = (
  categories: Category[],
  parentId: string | null = null,
): CategoryTree[] => {
  return categories
    .filter((category) => category.parentId === parentId)
    .map((category) => ({
      ...category,
      subcategories: buildCategoryTree(categories, category.id),
    }));
};

export const categoryRouter = createTRPCRouter({
  getHierarchy: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const hierarchy = [];
      let currentCategory = await ctx.db.category.findUnique({
        where: { id: input.id },
        select: { id: true, name: true, parentId: true },
      });

      while (currentCategory) {
        hierarchy.unshift({
          id: currentCategory.id,
          name: currentCategory.name,
        });
        currentCategory = currentCategory.parentId
          ? await ctx.db.category.findUnique({
              where: { id: currentCategory.parentId },
              select: { id: true, name: true, parentId: true },
            })
          : null;
      }

      return hierarchy;
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.category.findMany({
      orderBy: [
        { parentId: "asc" }, // First by parent (null first)
        { order: "asc" }, // Then by order
        { name: "asc" }, // Then by name as fallback
      ],
    });

    return buildCategoryTree(categories as Category[]);
  }),

  getAllParent: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.category.findMany({
      where: { parentId: null },
      orderBy: { updatedAt: "desc" },
    });

    return categories;
  }),

  getAllParentOrderedByRecentProduct: publicProcedure.query(async ({ ctx }) => {
    const allCategories = await ctx.db.category.findMany();
    const categoryMap = new Map(allCategories.map((c) => [c.id, c]));

    const getRootParent = (categoryId: string) => {
      let current = categoryMap.get(categoryId);
      if (!current) return null;

      while (current.parentId) {
        const parent = categoryMap.get(current.parentId);
        if (!parent) break;
        current = parent;
      }
      return current;
    };

    const recentProducts = await ctx.db.product.findMany({
      where: {
        published: true,
      },
      orderBy: { createdAt: "desc" },
      select: { categoryId: true },
    });

    const orderedParentCategories: typeof allCategories = [];
    const seenParentIds = new Set<string>();

    for (const product of recentProducts) {
      if (product.categoryId) {
        const parent = getRootParent(product.categoryId);
        if (parent && !seenParentIds.has(parent.id)) {
          orderedParentCategories.push(parent);
          seenParentIds.add(parent.id);
        }
      }
    }

    // Add parent categories that might not have products yet to the end of the list
    const otherParentCategories = allCategories.filter(
      (c) => c.parentId === null && !seenParentIds.has(c.id),
    );

    return [...orderedParentCategories, ...otherParentCategories];
  }),

  getOne: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.db.category.findUnique({
        where: { id: input.id },
      });

      return category;
    }),

  add: adminProcedure
    .input(
      z.object({
        parentId: z.string().nullable(),
        name: z.string(),
        imageId: z.string().optional(),
        imageUrl: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Create the category in the database
      const category = await ctx.db.category.create({
        data: {
          name: input.name,
          parentId: input.parentId ?? null,
          imageId: input.imageId,
          image: input.imageUrl,
          description: input.description,
        },
      });

      return category;
    }),

  edit: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        imageId: z.string().nullable(),
        image: z.string().nullable(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.db.category.update({
        where: { id: input.id },
        data: {
          name: input.name,
          imageId: input.imageId,
          image: input.image,
          description: input.description,
        },
      });

      return category;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.category.delete({ where: { id: input.id } });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.db.category.findUnique({
        where: { id: input.id },
      });

      return category;
    }),

  updateAttributes: adminProcedure
    .input(
      z.object({
        id: z.string(),
        attributes: z.array(
          z.object({
            name: z.string(),
            type: z.enum(["text", "number", "boolean", "select"]),
            options: z.array(z.string()).optional(),
            required: z.boolean().default(false),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // First check if this is a parent category
      const category = await ctx.db.category.findUnique({
        where: { id: input.id },
        select: { parentId: true },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      // Prevent adding attributes to parent categories
      if (category.parentId === null && input.attributes.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot add attributes to parent categories. Attributes are only allowed on subcategories.",
        });
      }

      const updatedCategory = await ctx.db.category.update({
        where: { id: input.id },
        data: { attributes: input.attributes },
      });

      return updatedCategory;
    }),

  removeAttribute: protectedProcedure
    .input(
      z.object({
        categoryId: z.string(),
        attributeName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { categoryId, attributeName } = input;

      // Fetch the current category to get its attributes
      const category = await ctx.db.category.findUnique({
        where: { id: categoryId },
        select: { attributes: true, parentId: true },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      // Ensure this is not a parent category
      if (category.parentId === null) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot modify attributes on parent categories",
        });
      }

      let attributes: CategoryAttribute[] = [];

      // Parse the existing attributes
      try {
        if (typeof category.attributes === "string") {
          attributes = JSON.parse(category.attributes) as CategoryAttribute[];
        } else if (Array.isArray(category.attributes)) {
          attributes = category.attributes as CategoryAttribute[];
        }
      } catch (error) {
        console.error("Failed to parse category attributes:", error);
      }

      // Filter out the attribute with the specified name
      const updatedAttributes = attributes.filter(
        (attr) => attr.name !== attributeName,
      );

      // Update the category with the new attributes list
      const updatedCategory = await ctx.db.category.update({
        where: { id: categoryId },
        data: {
          attributes: updatedAttributes,
        },
        select: {
          id: true,
          attributes: true,
        },
      });

      return updatedCategory;
    }),

  reorder: adminProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string(),
            order: z.number(),
          }),
        ),
        parentId: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { items } = input;

      // Create a transaction to update all items at once
      const updates = items.map((item) =>
        ctx.db.category.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      );

      // Execute all updates in a transaction
      const result = await ctx.db.$transaction(updates);
      return result;
    }),
});
