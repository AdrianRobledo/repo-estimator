import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-auth";
import { sampleTemplates } from "@/lib/sample-estimates";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingComplete: true, tradeType: true, name: true, email: true },
  });

  return NextResponse.json({
    onboardingComplete: user?.onboardingComplete ?? false,
    tradeType: user?.tradeType ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
  });
}

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { businessName, phone, tradeType } = body;

  if (!businessName?.trim() || !phone?.trim() || !tradeType?.trim()) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  // Get user's name and email to auto-fill profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  // Update user profile and mark onboarding complete
  await prisma.user.update({
    where: { id: userId },
    data: {
      businessName: businessName.trim(),
      phone: phone.trim(),
      tradeType: tradeType.trim(),
      onboardingComplete: true,
      ownerName: user?.name || null,
      businessEmail: user?.email || null,
    },
  });

  // Auto-create trade-specific templates
  const templates = sampleTemplates[tradeType] || sampleTemplates["Other"];
  if (templates && templates.length > 0) {
    await prisma.template.createMany({
      data: templates.map((t) => ({
        name: t.name,
        items: JSON.stringify(t.items),
        clientMessage: t.clientMessage,
        userId,
      })),
    });
  }

  return NextResponse.json({ success: true, tradeType });
}
