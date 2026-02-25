import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(req: Request) {
  const body = await req.json();

  // Subscription checkout flow
  if (body.type === "subscription") {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const priceId = body.interval === "annual"
      ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID!
      : process.env.STRIPE_PRO_MONTHLY_PRICE_ID!;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/billing`,
      customer_email: user.email,
      metadata: { userId: user.id },
    });

    return NextResponse.json({ url: session.url });
  }

  // Existing invoice payment flow
  const { invoiceId } = body;

  const inv = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { user: { select: { businessName: true } } },
  });

  if (!inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (inv.status === "paid") return NextResponse.json({ error: "Already paid" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Invoice ${inv.invoiceNumber}`,
            description: `Payment to ${inv.user.businessName || "business"}`,
          },
          unit_amount: Math.round(inv.total * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${appUrl}/invoice/${inv.id}?paid=true`,
    cancel_url: `${appUrl}/invoice/${inv.id}`,
    metadata: {
      invoiceId: inv.id,
    },
  });

  await prisma.invoice.update({
    where: { id: inv.id },
    data: { stripeSessionId: session.id },
  });

  return NextResponse.json({ url: session.url });
}
