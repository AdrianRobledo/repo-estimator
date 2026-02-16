import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ estimateId: string }> }
) {
  const { estimateId } = await params;
  const { status } = await req.json();

  if (status !== "approved" && status !== "declined") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const est = await prisma.estimate.findUnique({ where: { id: estimateId } });
  if (!est) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.estimate.update({
    where: { id: estimateId },
    data: { status },
  });

  return NextResponse.json({ success: true });
}
