import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { templateId } = await params;
  const t = await prisma.template.findFirst({ where: { id: templateId, userId } });
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: t.id,
    name: t.name,
    items: JSON.parse(t.items),
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { templateId } = await params;
  const body = await req.json();

  const t = await prisma.template.findFirst({ where: { id: templateId, userId } });
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.template.update({
    where: { id: templateId },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.items && { items: JSON.stringify(body.items) }),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { templateId } = await params;
  const t = await prisma.template.findFirst({ where: { id: templateId, userId } });
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.template.delete({ where: { id: templateId } });
  return NextResponse.json({ success: true });
}
