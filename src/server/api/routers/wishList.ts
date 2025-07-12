import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const wishListRouter = createTRPCRouter({
  getWishList: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session || !ctx.session.user) {
      return [];
    }
    const wishLists = await ctx.db.wishList.findMany({
      where: { userId: ctx.session.user.id },
      include: { product: true },
    });
    return wishLists;
  }),

  addToWishList: protectedProcedure
    .input(z.object({ productId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const newWishListItem = await ctx.db.wishList.create({
        data: {
          userId: ctx.session.user.id,
          productId: input.productId,
        },
      });

      return newWishListItem;
    }),

  removeFromWishList: protectedProcedure
    .input(z.object({ productId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const deletedWishList = await ctx.db.wishList.deleteMany({
        where: {
          userId: ctx.session.user.id,
          productId: input.productId,
        },
      });

      console.log("✅ [removeFromWishList] Removed:", deletedWishList);
      return deletedWishList;
    }),
});
