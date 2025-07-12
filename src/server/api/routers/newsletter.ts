import { Resend } from "resend";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const newsletterRouter = createTRPCRouter({
  subscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      // Check if email already exists
      const existingSubscriber = await ctx.db.newsletterSubscriber.findUnique({
        where: { email: input.email },
      });

      if (existingSubscriber) {
        throw new Error("You're already subscribed to our newsletter!");
      }

      // Create new subscriber
      const subscriber = await ctx.db.newsletterSubscriber.create({
        data: { email: input.email },
      });

      // Send welcome email without discount code
      const resend = new Resend(process.env.RESEND_API_KEY);
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background: #007b55; color: #fff; padding: 24px 32px;">
            <h2 style="margin: 0;">Welcome to Rinors Newsletter!</h2>
          </div>
          <div style="padding: 24px 32px;">
            <p>Thank you for subscribing to our newsletter!</p>
            <p>You'll now receive updates, news, and exclusive offers from us.</p>
            <p style="margin-top: 32px; color: #888; font-size: 13px;">You can unsubscribe at any time by clicking the unsubscribe link in our emails.</p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: "no-reply@rinors.com",
        to: input.email,
        subject: "Welcome to Rinors Newsletter!",
        html,
      });

      return subscriber;
    }),
});
