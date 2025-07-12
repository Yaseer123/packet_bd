import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

// Define the schema for FAQ categories
const FaqCategorySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Category title is required"),
});

// Define the schema for FAQ items
const FaqItemSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string(),
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  order: z.number().optional(),
});

export const faqRouter = createTRPCRouter({
  // Get all FAQ categories
  getAllCategories: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.faqCategory.findMany({
      orderBy: { order: "asc" },
    });
  }),

  // Get all FAQs by category
  getFaqsByCategory: publicProcedure
    .input(z.object({ categoryId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.faqItem.findMany({
        where: { categoryId: input.categoryId },
        orderBy: { order: "asc" },
      });
    }),

  // Get all FAQs (for admin panel)
  getAllFaqs: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.faqCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        faqItems: {
          orderBy: { order: "asc" },
        },
      },
    });
  }),

  // Create a new FAQ category
  createCategory: protectedProcedure
    .input(FaqCategorySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const highestOrder = await ctx.db.faqCategory.findFirst({
          orderBy: { order: "desc" },
          select: { order: true },
        });

        const newOrder = highestOrder ? highestOrder.order + 1 : 0;

        return await ctx.db.faqCategory.create({
          data: {
            title: input.title,
            order: newOrder,
          },
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to create category: ${error.message}`,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unknown error occurred",
        });
      }
    }),

  // Update a FAQ category
  updateCategory: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1, "Category title is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.faqCategory.update({
          where: { id: input.id },
          data: { title: input.title },
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update category: ${error.message}`,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unknown error occurred",
        });
      }
    }),

  // Delete a FAQ category
  deleteCategory: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.faqItem.deleteMany({
          where: { categoryId: input.id },
        });

        return await ctx.db.faqCategory.delete({
          where: { id: input.id },
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to delete category: ${error.message}`,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unknown error occurred",
        });
      }
    }),

  // Create a new FAQ item
  createFaqItem: protectedProcedure
    .input(FaqItemSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const highestOrder = await ctx.db.faqItem.findFirst({
          where: { categoryId: input.categoryId },
          orderBy: { order: "desc" },
          select: { order: true },
        });

        const newOrder = highestOrder ? highestOrder.order + 1 : 0;

        return await ctx.db.faqItem.create({
          data: {
            categoryId: input.categoryId,
            question: input.question,
            answer: input.answer,
            order: newOrder,
          },
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to create FAQ item: ${error.message}`,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unknown error occurred",
        });
      }
    }),

  // Update a FAQ item
  updateFaqItem: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        question: z.string().min(1, "Question is required"),
        answer: z.string().min(1, "Answer is required"),
        categoryId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const updateData: {
          question: string;
          answer: string;
          categoryId?: string;
          order?: number;
        } = {
          question: input.question,
          answer: input.answer,
        };

        if (input.categoryId) {
          const currentFaq = await ctx.db.faqItem.findUnique({
            where: { id: input.id },
          });

          if (currentFaq && currentFaq.categoryId !== input.categoryId) {
            const highestOrder = await ctx.db.faqItem.findFirst({
              where: { categoryId: input.categoryId },
              orderBy: { order: "desc" },
              select: { order: true },
            });

            const newOrder = highestOrder ? highestOrder.order + 1 : 0;
            updateData.categoryId = input.categoryId;
            updateData.order = newOrder;
          }
        }

        return await ctx.db.faqItem.update({
          where: { id: input.id },
          data: updateData,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update FAQ item: ${error.message}`,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unknown error occurred",
        });
      }
    }),

  // Delete a FAQ item
  deleteFaqItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.faqItem.delete({
          where: { id: input.id },
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to delete FAQ item: ${error.message}`,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unknown error occurred",
        });
      }
    }),

  // Reorder FAQ categories
  reorderCategories: protectedProcedure
    .input(z.array(z.object({ id: z.string(), order: z.number() })))
    .mutation(async ({ ctx, input }) => {
      try {
        const updates = input.map(({ id, order }) =>
          ctx.db.faqCategory.update({
            where: { id },
            data: { order },
          }),
        );

        return await ctx.db.$transaction(updates);
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to reorder categories: ${error.message}`,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unknown error occurred",
        });
      }
    }),

  // Reorder FAQ items within a category
  reorderFaqItems: protectedProcedure
    .input(z.array(z.object({ id: z.string(), order: z.number() })))
    .mutation(async ({ ctx, input }) => {
      try {
        const updates = input.map(({ id, order }) =>
          ctx.db.faqItem.update({
            where: { id },
            data: { order },
          }),
        );

        return await ctx.db.$transaction(updates);
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to reorder FAQ items: ${error.message}`,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unknown error occurred",
        });
      }
    }),
});
