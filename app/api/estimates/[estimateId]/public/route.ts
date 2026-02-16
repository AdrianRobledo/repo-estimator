import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ estimateId: string }> }
) {
  const { estimateId } = await params;
  const est = await prisma.estimate.findUnique({
    where: { id: estimateId },
    include: { user: { select: { businessName: true, ownerName: true, phone: true, businessEmail: true, logo: true } } },
  });

  if (!est) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
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
    profile: {
      businessName: est.user.businessName || "",
      ownerName: est.user.ownerName || "",
      phone: est.user.phone || "",
      email: est.user.businessEmail || "",
      logo: est.user.logo || null,
    },
  });
}
