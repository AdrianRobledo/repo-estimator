import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-auth";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const estimates = await prisma.estimate.findMany({
    where: { userId },
    include: { invoice: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { businessName: true, ownerName: true, phone: true, businessEmail: true, logo: true },
  });

  const profile = user
    ? { businessName: user.businessName || "", ownerName: user.ownerName || "", phone: user.phone || "", email: user.businessEmail || "", logo: user.logo || null }
    : null;

  return NextResponse.json(
    estimates.map((est) => ({
      id: est.id,
      estimateNumber: est.estimateNumber,
      date: est.date,
      status: est.status,
      customer: {
        name: est.customerName || "",
        address: est.customerAddress || "",
        phone: est.customerPhone || "",
        email: est.customerEmail || "",
      },
      items: JSON.parse(est.items),
      total: est.total,
      profile,
      invoiceId: est.invoice?.id || undefined,
    }))
  );
}

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { estimateNumber, date, customer, items, total } = await req.json();

  const estimate = await prisma.estimate.create({
    data: {
      estimateNumber,
      date,
      status: "sent",
      customerName: customer?.name || null,
      customerAddress: customer?.address || null,
      customerPhone: customer?.phone || null,
      customerEmail: customer?.email || null,
      items: JSON.stringify(items),
      total: total || 0,
      userId,
    },
  });

  return NextResponse.json({ id: estimate.id }, { status: 201 });
}
