import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;
  const inv = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      estimate: { select: { estimateNumber: true } },
      user: { select: { businessName: true, ownerName: true, phone: true, businessEmail: true, logo: true } },
    },
  });

  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
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
  });
}
