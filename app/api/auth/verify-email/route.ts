import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateToken, consumeToken } from "@/lib/tokens";

export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const record = await validateToken(token, "email_verification");
  if (!record) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { email: record.email },
    data: { emailVerified: new Date() },
  });

  await consumeToken(token);

  return NextResponse.json({ success: true });
}
