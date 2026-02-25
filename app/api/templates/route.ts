import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-auth";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.template.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    templates.map((t) => ({
      id: t.id,
      name: t.name,
      jobTitle: t.jobTitle,
      items: JSON.parse(t.items),
      clientMessage: t.clientMessage,
      disclaimer: t.disclaimer,
    }))
  );
}

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, items, jobTitle, clientMessage, disclaimer } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Template name is required" }, { status: 400 });
  }

  const template = await prisma.template.create({
    data: {
      name,
      items: JSON.stringify(items),
      jobTitle: jobTitle || null,
      clientMessage: clientMessage || null,
      disclaimer: disclaimer || null,
      userId,
    },
  });

  return NextResponse.json({ id: template.id }, { status: 201 });
}
