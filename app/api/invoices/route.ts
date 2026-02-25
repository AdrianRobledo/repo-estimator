import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, isAdmin } from "@/lib/api-auth";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    include: {
      estimate: { select: { estimateNumber: true } },
      user: { select: { businessName: true, ownerName: true, phone: true, businessEmail: true, logo: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      estimateId: inv.estimateId,
      estimateNumber: inv.estimate.estimateNumber,
      date: inv.date,
      dueDate: inv.dueDate,
      status: inv.status,
      customer: {
        name: inv.customerName || "",
        address: inv.customerAddress || "",
        phone: inv.customerPhone || "",
        email: inv.customerEmail || "",
      },
      items: JSON.parse(inv.items),
      total: inv.total,
      profile: {
        businessName: inv.user.businessName || "",
        ownerName: inv.user.ownerName || "",
        phone: inv.user.phone || "",
        email: inv.user.businessEmail || "",
        logo: inv.user.logo || null,
      },
      stripeSessionId: inv.stripeSessionId,
      stripePaidAt: inv.stripePaidAt?.toISOString() || null,
    }))
  );
}

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Pro-only check (admin bypasses)
  const admin = await isAdmin();
  if (!admin) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    if (user?.plan !== "pro") {
      return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
    }
  }

  const { estimateId, invoiceNumber, date, dueDate } = await req.json();

  const estimate = await prisma.estimate.findFirst({
    where: { id: estimateId, userId },
    include: { invoice: true },
  });

  if (!estimate) return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  if (estimate.invoice) return NextResponse.json({ error: "Already invoiced" }, { status: 409 });

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      date,
      dueDate,
      status: "unpaid",
      customerName: estimate.customerName,
      customerAddress: estimate.customerAddress,
      customerPhone: estimate.customerPhone,
      customerEmail: estimate.customerEmail,
      items: estimate.items,
      total: estimate.total,
      estimateId: estimate.id,
      userId,
    },
  });

  return NextResponse.json({ id: invoice.id }, { status: 201 });
}
