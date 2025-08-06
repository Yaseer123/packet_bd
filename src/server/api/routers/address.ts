import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  resolveUserId,
} from "@/server/api/trpc";
import { z } from "zod";

export const addressRouter = createTRPCRouter({
  getAddress: protectedProcedure.query(async ({ ctx }) => {
    const userId = await resolveUserId(ctx.session);
    
    const address = await ctx.db.address.findFirst({
      where: {
        userId: {
          equals: userId,
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
      const userId = await resolveUserId(ctx.session);
      
      // Find the address for the user first
      const existingAddress = await ctx.db.address.findFirst({
        where: { userId: userId },
      });
      const updatedAddress = await ctx.db.address.upsert({
        where: { id: existingAddress?.id ?? "" }, // '' will fail if not found, so handle below
        update: { ...input },
        create: {
          ...input,
          userId: userId,
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
      const userId = await resolveUserId(ctx.session);
      
      console.log("Creating address for user:", userId);
      
      const newAddress = await ctx.db.address.create({
        data: {
          ...input,
          city: input.city ?? "",
          state: input.state ?? "",
          zipCode: input.zipCode ?? "",
          userId: userId,
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
