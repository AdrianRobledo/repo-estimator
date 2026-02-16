import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-auth";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      businessName: true,
      ownerName: true,
      phone: true,
      businessEmail: true,
      logo: true,
    },
  });

  return NextResponse.json({
    businessName: user?.businessName || "",
    ownerName: user?.ownerName || "",
    phone: user?.phone || "",
    email: user?.businessEmail || "",
    logo: user?.logo || null,
  });
}

export async function PUT(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessName, ownerName, phone, email, logo } = await req.json();

  await prisma.user.update({
    where: { id: userId },
    data: {
      businessName: businessName || null,
      ownerName: ownerName || null,
      phone: phone || null,
      businessEmail: email || null,
      logo: logo || null,
    },
  });

  return NextResponse.json({ success: true });
}
