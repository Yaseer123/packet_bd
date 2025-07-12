import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { z } from "zod";

// Add a placeholder email function (replace with your actual email logic)
async function sendEmail(to: string, subject: string, body: string) {
  // Implement your email sending logic here (e.g., nodemailer, Resend, etc.)
  console.log(`Sending email to ${to}: ${subject}\n${body}`);
}

export const questionRouter = createTRPCRouter({
  getQuestionsByProduct: publicProcedure
    .input(z.string()) // Product ID
    .query(async ({ ctx, input }) => {
      return await ctx.db.question.findMany({
        where: { productId: input },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });
    }),

  askQuestion: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        question: z.string().min(5),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.question.create({
        data: {
          userId: ctx.session.user.id,
          productId: input.productId,
          question: input.question,
        },
      });
    }),

  answerQuestion: adminProcedure
    .input(
      z.object({
        questionId: z.string(),
        answer: z.string().min(5),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.question.update({
        where: { id: input.questionId },
        data: { answer: input.answer },
      });
      // Fetch user email and product info
      const question = await ctx.db.question.findUnique({
        where: { id: input.questionId },
        include: { user: true, product: true },
      });
      if (question?.user?.email) {
        const productTitle = question.product?.title ?? "Product";
        const productUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://rinors.com"}/products/${question.productId}`;
        await sendEmail(
          question.user.email,
          `Your question on ${productTitle} has been answered`,
          `Hello ${question.user.name ?? "User"},\n\nYour question: ${question.question}\n\nAnswer: ${input.answer}\n\nView product: ${productUrl}`,
        );
      }
      return updated;
    }),

  // ADMIN: Get all questions with product and user info
  getAllQuestionsForAdmin: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.question.findMany({
      include: {
        user: { select: { name: true } },
        product: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // ADMIN: Delete a question
  deleteQuestion: adminProcedure
    .input(z.object({ questionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.question.delete({
        where: { id: input.questionId },
      });
    }),
});
