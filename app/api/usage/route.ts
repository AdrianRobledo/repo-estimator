import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, isAdmin } from "@/lib/api-auth";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, stripeCurrentPeriodEnd: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const admin = await isAdmin();
  const effectivePlan = admin ? "pro" : user.plan;

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const estimatesUsed = await prisma.estimate.count({
    where: {
      userId,
      createdAt: { gte: firstDayOfMonth },
    },
  });

  return NextResponse.json({
    plan: effectivePlan,
    estimatesUsed,
    estimateLimit: effectivePlan === "free" ? 3 : null,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd?.toISOString() || null,
  });
}
