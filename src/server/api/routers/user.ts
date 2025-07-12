import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { z } from "zod";

export const userRouter = createTRPCRouter({
  getAll: adminProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany();

    return users ?? null;
  }),

  makeAdmin: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.id },
        data: {
          role: "ADMIN",
        },
      });
    }),

  removeAdmin: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.id },
        data: {
          role: "USER",
        },
      });
    }),

  getAddress: protectedProcedure.query(async ({ ctx }) => {
    const address = await ctx.db.address.findFirst({
      where: {
        userId: ctx.session.user.id,
      },
    });
    return address;
  }),
});
