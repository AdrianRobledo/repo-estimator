import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.emailVerified) {
    // Don't reveal whether user exists or is already verified
    return NextResponse.json({ success: true });
  }

  const token = await generateVerificationToken(email);
  await sendVerificationEmail(email, token);

  return NextResponse.json({ success: true });
}
