import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const saleBannerRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.saleBanner.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  add: protectedProcedure
    .input(
      z.object({
        title: z.string().optional(),
        subtitle: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string(),
        imageId: z.string(),
        link: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.saleBanner.create({
        data: input,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string(),
        imageId: z.string(),
        link: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.saleBanner.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.saleBanner.delete({
        where: { id: input.id },
      });
    }),
});
