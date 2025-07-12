import { db } from "@/server/db";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const couponRouter = createTRPCRouter({
  validateNewsletterCoupon: publicProcedure
    .input(z.object({ email: z.string().email(), couponCode: z.string() }))
    .mutation(async ({ input }) => {
      const { email, couponCode } = input;
      if (couponCode.trim().toUpperCase() !== "WELCOME10") {
        return { valid: false, message: "Invalid coupon code." };
      }

      // Check User
      const user = await db.user.findUnique({ where: { email } });
      if (user) {
        if (user.newsletterCouponUsed) {
          return { valid: false, message: "Coupon already used." };
        }
        await db.user.update({
          where: { email },
          data: { newsletterCouponUsed: true },
        });
        return { valid: true, discount: 0.1, message: "Coupon applied." };
      }

      // Check NewsletterSubscriber
      const subscriber = await db.newsletterSubscriber.findUnique({
        where: { email },
      });
      if (subscriber) {
        if (subscriber.couponUsed) {
          return { valid: false, message: "Coupon already used." };
        }
        await db.newsletterSubscriber.update({
          where: { email },
          data: { couponUsed: true },
        });
        return { valid: true, discount: 0.1, message: "Coupon applied." };
      }

      // If not found, treat as guest and create a record
      await db.newsletterSubscriber.create({
        data: { email, couponUsed: true },
      });
      return { valid: true, discount: 0.1, message: "Coupon applied." };
    }),
});
