import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeParseJSON } from "@/lib/utils";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ estimateId: string }> }
) {
  const { estimateId } = await params;
  const est = await prisma.estimate.findUnique({
    where: { id: estimateId },
    include: {
      user: { select: { businessName: true, ownerName: true, phone: true, businessEmail: true, businessAddress: true, logo: true } },
      invoice: { select: { id: true } },
    },
  });

  if (!est) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: est.id,
    estimateNumber: est.estimateNumber,
    date: est.date,
    jobDate: est.jobDate || undefined,
    status: est.status,
    customer: {
      name: est.customerName || "",
      address: est.customerAddress || "",
      phone: est.customerPhone || "",
      email: est.customerEmail || "",
    },
    items: safeParseJSON(est.items, []),
    total: est.total,
    profile: {
      businessName: est.user.businessName || "",
      ownerName: est.user.ownerName || "",
      phone: est.user.phone || "",
      email: est.user.businessEmail || "",
      address: est.user.businessAddress || "",
      logo: est.user.logo || null,
    },
    invoiceId: est.invoice?.id || null,
  });
}
