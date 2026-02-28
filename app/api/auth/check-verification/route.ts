import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    // Don't reveal whether user exists
    return NextResponse.json({ verified: true });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    // Let NextAuth handle the invalid password error
    return NextResponse.json({ verified: true });
  }

  // TODO: Re-enable once Resend domain is verified
  // if (!user.emailVerified) {
  //   return NextResponse.json({ verified: false, email: user.email });
  // }

  return NextResponse.json({ verified: true });
}
