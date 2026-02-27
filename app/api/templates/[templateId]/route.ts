import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-auth";
import { safeParseJSON } from "@/lib/utils";

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
    jobTitle: t.jobTitle,
    items: safeParseJSON(t.items, []),
    clientMessage: t.clientMessage,
    disclaimer: t.disclaimer,
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
      ...(body.jobTitle !== undefined && { jobTitle: body.jobTitle || null }),
      ...(body.clientMessage !== undefined && { clientMessage: body.clientMessage || null }),
      ...(body.disclaimer !== undefined && { disclaimer: body.disclaimer || null }),
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
