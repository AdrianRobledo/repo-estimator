import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { invoiceId } = await params;
  const inv = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { estimate: { select: { estimateNumber: true } } },
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
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { invoiceId } = await params;
  const { status } = await req.json();

  const inv = await prisma.invoice.findFirst({ where: { id: invoiceId, userId } });
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status },
  });

  return NextResponse.json({ success: true });
}
