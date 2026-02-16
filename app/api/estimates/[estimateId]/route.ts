import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ estimateId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { estimateId } = await params;
  const est = await prisma.estimate.findFirst({
    where: { id: estimateId, userId },
    include: { invoice: { select: { id: true } } },
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
    invoiceId: est.invoice?.id || undefined,
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ estimateId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { estimateId } = await params;
  const body = await req.json();

  const est = await prisma.estimate.findFirst({ where: { id: estimateId, userId } });
  if (!est) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.estimate.update({
    where: { id: estimateId },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.customer && {
        customerName: body.customer.name,
        customerAddress: body.customer.address,
        customerPhone: body.customer.phone,
        customerEmail: body.customer.email,
      }),
      ...(body.items && { items: JSON.stringify(body.items) }),
      ...(body.total !== undefined && { total: body.total }),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ estimateId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { estimateId } = await params;
  const est = await prisma.estimate.findFirst({ where: { id: estimateId, userId } });
  if (!est) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.estimate.delete({ where: { id: estimateId } });
  return NextResponse.json({ success: true });
}
