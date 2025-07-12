import { db } from "@/server/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    const { token, password } = body as { token: string; password: string };
    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and new password are required." },
        { status: 400 },
      );
    }
    // Find the reset token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!resetToken || !resetToken.user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token." },
        { status: 400 },
      );
    }
    if (resetToken.expires < new Date()) {
      // Delete expired token
      await db.passwordResetToken.delete({ where: { token } });
      return NextResponse.json(
        { error: "Reset token has expired." },
        { status: 400 },
      );
    }
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Update user password
    await db.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });
    // Delete the reset token
    await db.passwordResetToken.delete({ where: { token } });
    return NextResponse.json({
      message: "Password has been reset successfully.",
    });
  } catch {
    // Intentionally ignore error details in production
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
