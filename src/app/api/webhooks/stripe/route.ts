import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe/client";
import {
  syncSubscriptionFromStripeSubscription,
  revertToDefaultPlan,
  markPastDue,
} from "@/lib/stripe/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (env.STRIPE_MOCK_MODE || !stripe) {
    // No real Stripe account configured — this endpoint has nothing to verify against.
    return NextResponse.json({ received: false, reason: "mock mode" }, { status: 200 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret." }, { status: 400 });
  }

  // Signature verification requires the exact raw bytes — read as text
  // before any JSON parsing, and don't let anything else touch the body first.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await syncSubscriptionFromStripeSubscription(subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionFromStripeSubscription(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await revertToDefaultPlan(subscription.customer as string);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await markPastDue(invoice.customer as string);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    // Log but still return 200 for event types we understood but failed to
    // process cleanly — avoids Stripe hammering retries for a bug on our
    // side indefinitely; the error is visible in server logs for follow-up.
    console.error(`Stripe webhook handler error for ${event.type}:`, err);
  }

  return NextResponse.json({ received: true });
}
