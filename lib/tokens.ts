import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function generateVerificationToken(email: string) {
  // Delete any existing verification tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { email, type: "email_verification" },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.verificationToken.create({
    data: { email, token, type: "email_verification", expires },
  });

  return token;
}

export async function generatePasswordResetToken(email: string) {
  await prisma.verificationToken.deleteMany({
    where: { email, type: "password_reset" },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.verificationToken.create({
    data: { email, token, type: "password_reset", expires },
  });

  return token;
}

export async function validateToken(token: string, type: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record || record.type !== type || record.expires < new Date()) {
    return null;
  }

  return record;
}

export async function consumeToken(token: string) {
  await prisma.verificationToken.delete({ where: { token } });
}
