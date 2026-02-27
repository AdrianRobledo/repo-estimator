import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode === "subscription") {
      // Subscription checkout completed
      const userId = session.metadata?.userId;
      if (userId) {
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const item = subscription.items.data[0];
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "pro",
            stripeSubscriptionId: subscription.id,
            stripePriceId: item?.price.id || null,
            stripeCurrentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
          },
        });
      }
    } else {
      // Invoice payment checkout completed — skip if already paid (idempotent)
      const invoiceId = session.metadata?.invoiceId;
      if (invoiceId) {
        await prisma.invoice.updateMany({
          where: { id: invoiceId, status: { not: "paid" } },
          data: {
            status: "paid",
            stripePaidAt: new Date(),
          },
        });
      }
    }
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (user) {
      const item = subscription.items.data[0];
      await prisma.user.update({
        where: { id: user.id },
        data: {
          stripePriceId: item?.price.id || null,
          stripeCurrentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
        },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: "free",
          stripeSubscriptionId: null,
          stripePriceId: null,
          stripeCurrentPeriodEnd: null,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
