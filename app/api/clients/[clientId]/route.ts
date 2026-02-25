import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const c = await prisma.client.findFirst({ where: { id: clientId, userId } });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    address: c.address,
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const body = await req.json();

  const c = await prisma.client.findFirst({ where: { id: clientId, userId } });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.client.update({
    where: { id: clientId },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.email !== undefined && { email: body.email || null }),
      ...(body.phone !== undefined && { phone: body.phone || null }),
      ...(body.address !== undefined && { address: body.address || null }),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const c = await prisma.client.findFirst({ where: { id: clientId, userId } });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.client.delete({ where: { id: clientId } });
  return NextResponse.json({ success: true });
}
