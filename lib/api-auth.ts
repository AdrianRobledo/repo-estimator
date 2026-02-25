import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string })?.id ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  const session = await getServerSession(authOptions);
  return session?.user?.email === adminEmail;
}
