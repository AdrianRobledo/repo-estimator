import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-auth";
import { safeParseJSON } from "@/lib/utils";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ estimateId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { estimateId } = await params;
  const est = await prisma.estimate.findFirst({
    where: { id: estimateId, userId },
    include: { invoice: { select: { id: true, invoiceNumber: true } } },
  });

  if (!est) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { businessName: true, ownerName: true, phone: true, businessEmail: true, businessAddress: true, logo: true },
  });

  const profile = user
    ? { businessName: user.businessName || "", ownerName: user.ownerName || "", phone: user.phone || "", email: user.businessEmail || "", address: user.businessAddress || "", logo: user.logo || null }
    : null;

  return NextResponse.json({
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
    notes: est.notes || "",
    total: est.total,
    profile,
    createdAt: est.createdAt.toISOString(),
    updatedAt: est.updatedAt.toISOString(),
    invoiceId: est.invoice?.id || undefined,
    invoiceNumber: est.invoice?.invoiceNumber || undefined,
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
      ...(body.jobDate !== undefined && { jobDate: body.jobDate || null }),
      ...(body.jobTitle !== undefined && { jobTitle: body.jobTitle || null }),
      ...(body.notes !== undefined && { notes: body.notes || null }),
      ...(body.estimateNumber && { estimateNumber: body.estimateNumber }),
      ...(body.date && { date: body.date }),
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
