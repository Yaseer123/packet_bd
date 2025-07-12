import { db } from "@/server/db";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function sendVerificationEmail(email: string, token: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
      <div style="background: #007b55; color: #fff; padding: 24px 32px;">
        <h2 style="margin: 0;">Verify your email address</h2>
      </div>
      <div style="padding: 24px 32px;">
        <p style="font-size: 16px;">Thank you for registering at Rinors Ecommerce.</p>
        <p style="font-size: 16px;">Please verify your email address by clicking the button below:</p>
        <div style="margin-top: 32px;">
          <a href="${APP_URL}/verify-email?token=${token}" style="background: #007b55; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Verify Email</a>
        </div>
        <p style="font-size: 14px; margin-top: 24px; color: #888;">If you did not create this account, you can ignore this email.</p>
      </div>
    </div>
  `;
  await resend.emails.send({
    from: "no-reply@rinors.com",
    to: email,
    subject: "Verify your email address",
    html,
  });
}

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email: string;
      password: string;
      name?: string;
    };
    const email: string = body.email;
    const password: string = body.password;
    const name: string | undefined = body.name;
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }
    if (typeof password !== "string") {
      return NextResponse.json(
        { error: "Invalid password type." },
        { status: 400 },
      );
    }
    if (typeof hash !== "function") {
      return NextResponse.json(
        { error: "Hash function is not available." },
        { status: 500 },
      );
    }
    const hashedPassword: string = await hash(password, 10);
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
    return NextResponse.json(
      {
        message: "User registered successfully.",
        user: { id: user.id, email: user.email },
      },
      { status: 201 },
    );
  } catch {
    // Intentionally ignore error details in production
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
