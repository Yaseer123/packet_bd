import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";
import { z } from "zod";

const sliderSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url("Valid image URL is required"),
  imageId: z.string().min(1, "Cloudinary ID is required"),
  link: z.string().optional(),
  autoSlideTime: z.number().int().optional(),
});

export const sliderRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.slider.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  add: adminProcedure.input(sliderSchema).mutation(async ({ ctx, input }) => {
    return await ctx.db.slider.create({
      data: input,
    });
  }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        ...sliderSchema.shape,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.slider.update({
        where: { id },
        data,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.slider.delete({
        where: { id: input.id },
      });
    }),
});
