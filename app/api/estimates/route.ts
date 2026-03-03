import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, isAdmin } from "@/lib/api-auth";
import { safeParseJSON } from "@/lib/utils";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const estimates = await prisma.estimate.findMany({
    where: { userId },
    include: { invoice: { select: { id: true, invoiceNumber: true } } },
    orderBy: { createdAt: "desc" },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { businessName: true, ownerName: true, phone: true, businessEmail: true, businessAddress: true, logo: true },
  });

  const profile = user
    ? { businessName: user.businessName || "", ownerName: user.ownerName || "", phone: user.phone || "", email: user.businessEmail || "", address: user.businessAddress || "", logo: user.logo || null }
    : null;

  return NextResponse.json(
    estimates.map((est) => ({
      id: est.id,
      estimateNumber: est.estimateNumber,
      date: est.date,
      jobDate: est.jobDate || undefined,
      jobTitle: est.jobTitle || undefined,
      status: est.status,
      customer: {
        name: est.customerName || "",
        address: est.customerAddress || "",
        phone: est.customerPhone || "",
        email: est.customerEmail || "",
      },
      items: safeParseJSON(est.items, []),
      notes: est.notes || undefined,
      total: est.total,
      profile,
      invoiceId: est.invoice?.id || undefined,
      invoiceNumber: est.invoice?.invoiceNumber || undefined,
    }))
  );
}

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Paywall check for free users (admin bypasses)
  const admin = await isAdmin();
  if (!admin) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (user?.plan === "free") {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const count = await prisma.estimate.count({
        where: { userId, createdAt: { gte: firstDayOfMonth } },
      });
      if (count >= 3) {
        return NextResponse.json({ error: "limit_reached" }, { status: 403 });
      }
    }
  }

  const { estimateNumber, date, jobDate, jobTitle, customer, items, total, notes, status: reqStatus } = await req.json();

  const estimate = await prisma.estimate.create({
    data: {
      estimateNumber,
      date,
      jobDate: jobDate || null,
      jobTitle: jobTitle || null,
      status: reqStatus === "draft" ? "draft" : "sent",
      customerName: customer?.name || null,
      customerAddress: customer?.address || null,
      customerPhone: customer?.phone || null,
      customerEmail: customer?.email || null,
      items: JSON.stringify(items),
      notes: notes || null,
      total: total || 0,
      userId,
    },
  });

  return NextResponse.json({ id: estimate.id }, { status: 201 });
}
