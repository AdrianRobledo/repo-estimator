import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-auth";

export async function GET(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  const clients = await prisma.client.findMany({
    where: {
      userId,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    },
    orderBy: { name: "asc" },
  });

  // Count estimates per client by matching customerName or customerEmail
  const estimates = await prisma.estimate.findMany({
    where: { userId },
    select: { customerName: true, customerEmail: true },
  });

  const countByName = new Map<string, number>();
  const countByEmail = new Map<string, number>();
  for (const est of estimates) {
    if (est.customerName) {
      const key = est.customerName.toLowerCase();
      countByName.set(key, (countByName.get(key) || 0) + 1);
    }
    if (est.customerEmail) {
      const key = est.customerEmail.toLowerCase();
      countByEmail.set(key, (countByEmail.get(key) || 0) + 1);
    }
  }

  return NextResponse.json(
    clients.map((c) => {
      const byName = c.name ? countByName.get(c.name.toLowerCase()) || 0 : 0;
      const byEmail = c.email ? countByEmail.get(c.email.toLowerCase()) || 0 : 0;
      // Use the higher of the two to avoid double-counting
      const estimateCount = Math.max(byName, byEmail);
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        estimateCount,
      };
    })
  );
}

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, phone, address } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Client name is required" }, { status: 400 });
  }

  // Check for existing client with same name to avoid duplicates
  const existing = await prisma.client.findFirst({
    where: {
      userId,
      name: { equals: name },
    },
  });

  if (existing) {
    return NextResponse.json({ id: existing.id, existing: true }, { status: 200 });
  }

  const client = await prisma.client.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      userId,
    },
  });

  return NextResponse.json({ id: client.id }, { status: 201 });
}
