import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const reviewRouter = createTRPCRouter({
  getReviewsByProduct: publicProcedure
    .input(z.string()) // Product ID
    .query(async ({ ctx, input }) => {
      return await ctx.db.review.findMany({
        where: {
          productId: input,
          visible: true,
        },
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getReviewStats: publicProcedure
    .input(z.string()) // Product ID
    .query(async ({ ctx, input }) => {
      // Get total count
      const totalCount = await ctx.db.review.count({
        where: { productId: input },
      });

      // Get average rating
      const avgRating = await ctx.db.$queryRaw<{ average: number }[]>`
        SELECT AVG(rating)::float as average
        FROM "Review"
        WHERE "productId" = ${input};
      `;

      // Get counts by rating
      const ratingCounts = await ctx.db.review.groupBy({
        by: ["rating"],
        where: { productId: input },
        _count: true,
      });

      // Format rating counts as percentages
      const ratingPercentages: Record<number, number> = {};
      ratingCounts.forEach((count) => {
        ratingPercentages[count.rating] =
          totalCount > 0 ? Math.round((count._count * 100) / totalCount) : 0;
      });

      // Ensure all ratings have a percentage value
      for (let i = 1; i <= 5; i++) {
        if (!ratingPercentages[i]) {
          ratingPercentages[i] = 0;
        }
      }

      return {
        totalCount,
        averageRating:
          totalCount > 0 && avgRating[0]
            ? Number(avgRating[0].average).toFixed(1)
            : "0.0",
        ratingPercentages,
      };
    }),

  addReview: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Only allow review if user has purchased the product
      const hasPurchased = await ctx.db.orderItem.findFirst({
        where: {
          productId: input.productId,
          order: { userId: ctx.session.user.id, status: { not: "CANCELLED" } },
        },
      });
      if (!hasPurchased) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only review products you have purchased.",
        });
      }
      // Check if user already reviewed this product
      const existingReview = await ctx.db.review.findFirst({
        where: {
          userId: ctx.session.user.id,
          productId: input.productId,
        },
      });
      if (existingReview) {
        // Update existing review (keep visible false for re-review)
        return await ctx.db.review.update({
          where: { id: existingReview.id },
          data: {
            rating: input.rating,
            comment: input.comment ?? null,
            visible: false,
          },
        });
      }
      // Create new review (not visible until admin approves)
      return await ctx.db.review.create({
        data: {
          userId: ctx.session.user.id,
          productId: input.productId,
          rating: input.rating,
          comment: input.comment ?? null,
          visible: false,
        },
      });
    }),

  deleteReview: adminProcedure
    .input(z.string()) // Review ID
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.review.delete({
        where: { id: input },
      });
    }),

  setReviewVisibility: adminProcedure
    .input(z.object({ reviewId: z.string(), visible: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.review.update({
        where: { id: input.reviewId },
        data: { visible: input.visible },
      });
    }),

  canReviewProduct: protectedProcedure
    .input(z.string()) // Product ID
    .query(async ({ ctx, input }) => {
      const hasPurchased = await ctx.db.orderItem.findFirst({
        where: {
          productId: input,
          order: { userId: ctx.session.user.id, status: { not: "CANCELLED" } },
        },
      });
      return !!hasPurchased;
    }),

  getAllReviews: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.review.findMany({
      include: {
        user: { select: { name: true, image: true } },
        product: { select: { title: true, id: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),
});
