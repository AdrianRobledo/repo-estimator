import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  if (!user) {
    // Don't reveal whether user exists
    return NextResponse.json({ success: true });
  }

  // If user only has Google (no password), tell them
  const hasGoogle = user.accounts.some((a) => a.provider === "google");
  if (!user.password && hasGoogle) {
    return NextResponse.json({ googleOnly: true });
  }

  const token = await generatePasswordResetToken(email);
  await sendPasswordResetEmail(email, token);

  return NextResponse.json({ success: true });
}
