import { db } from "@/server/db";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type ForgotPasswordBody = { email: string };

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as ForgotPasswordBody;
    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 },
      );
    }
    const user = await db.user.findUnique({ where: { email } });
    // Always respond with success for security
    if (!user) {
      return NextResponse.json({
        message: "If that email exists, a reset link has been sent.",
      });
    }
    // Generate token and expiry (1 hour)
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    // Remove old tokens
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
    // Store new token
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    });
    // Send email
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    await resend.emails.send({
      from: "no-reply@rinors.com",
      to: email,
      subject: "Reset your password",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link will expire in 1 hour.</p>`,
    });
    return NextResponse.json({
      message: "If that email exists, a reset link has been sent.",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
