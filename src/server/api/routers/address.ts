import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { z } from "zod";

export const addressRouter = createTRPCRouter({
  getAddress: protectedProcedure.query(async ({ ctx }) => {
    const address = await ctx.db.address.findFirst({
      where: {
        userId: {
          equals: ctx.session.user.id,
        },
      },
    });

    return address ?? null;
  }),

  updateAddress: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        street: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(1),
        zipCode: z.string().min(1),
        isDefault: z.boolean().optional(),
        phone: z.string().min(1),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Find the address for the user first
      const existingAddress = await ctx.db.address.findFirst({
        where: { userId: ctx.session.user.id },
      });
      const updatedAddress = await ctx.db.address.upsert({
        where: { id: existingAddress?.id ?? "" }, // '' will fail if not found, so handle below
        update: { ...input },
        create: {
          ...input,
          userId: ctx.session.user.id,
          name: input.name,
        },
      });
      return updatedAddress;
    }),

  createAddress: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        street: z.string().min(1),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        phone: z.string().min(1),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const newAddress = await ctx.db.address.create({
        data: {
          ...input,
          city: input.city ?? "",
          state: input.state ?? "",
          zipCode: input.zipCode ?? "",
          userId: ctx.session.user.id,
          name: input.name,
        },
      });
      return newAddress;
    }),

  createGuestAddress: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        street: z.string().min(1),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        phone: z.string().min(1),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const newAddress = await ctx.db.address.create({
        data: {
          ...input,
          city: input.city ?? "",
          state: input.state ?? "",
          zipCode: input.zipCode ?? "",
          isDefault: false,
          userId: null,
          name: input.name,
        },
      });
      return newAddress;
    }),
});
