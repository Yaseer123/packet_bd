import { db } from "@/server/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { token } = (await req.json()) as { token?: string };
    if (!token) {
      return NextResponse.json(
        { error: "Token is required." },
        { status: 400 },
      );
    }
    const verification = await db.verificationToken.findUnique({
      where: { token },
    });
    if (!verification) {
      return NextResponse.json(
        { error: "Invalid or expired token." },
        { status: 400 },
      );
    }
    if (verification.expires < new Date()) {
      await db.verificationToken.delete({ where: { token } });
      return NextResponse.json(
        { error: "Token has expired." },
        { status: 400 },
      );
    }
    const user = await db.user.findUnique({
      where: { email: verification.identifier },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
    await db.verificationToken.delete({ where: { token } });
    return NextResponse.json({ message: "Email verified successfully." });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
