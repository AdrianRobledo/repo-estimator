import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  if (existing) {
    // If user exists via Google only (no password), link by adding a password
    const hasGoogle = existing.accounts.some((a) => a.provider === "google");
    if (!existing.password && hasGoogle) {
      const hashed = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { email },
        data: { password: hashed, name: name || existing.name },
      });
      // Google users are already verified
      return NextResponse.json({ success: true, linked: true }, { status: 200 });
    }

    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name: name || null,
      email,
      password: hashed,
    },
  });

  // Send verification email
  const token = await generateVerificationToken(email);
  await sendVerificationEmail(email, token);

  return NextResponse.json({ success: true }, { status: 201 });
}
