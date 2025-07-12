import { Resend } from "resend";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const contactRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        message: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Save to DB
      const contact = await ctx.db.contact.create({
        data: input,
      });

      // Send email via Resend
      const resend = new Resend(process.env.RESEND_API_KEY);
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background: #007b55; color: #fff; padding: 24px 32px;">
            <h2 style="margin: 0;">New Contact Form Submission</h2>
          </div>
          <div style="padding: 24px 32px;">
            <p style="font-size: 16px;">A new contact form was submitted on Rinors Ecommerce Admin.</p>
            <div style="margin-bottom: 16px;"><strong>Name:</strong> ${input.name}</div>
            <div style="margin-bottom: 16px;"><strong>Email:</strong> ${input.email}</div>
            <div style="margin-bottom: 16px;"><strong>Message:</strong><br/>${input.message.replace(/\n/g, "<br/>")}</div>
            <p style="margin-top: 32px; color: #888; font-size: 13px;">This could be a product inquiry, warranty claim, bulk order, or reseller application.</p>
          </div>
        </div>
      `;
      await resend.emails.send({
        from: "no-reply@rinors.com",
        to: "contact@rinors.com",
        subject: "New Contact Form Submission",
        html,
      });

      return contact;
    }),
});
