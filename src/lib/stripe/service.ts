import type Stripe from "stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { stripe } from "./client";
import type { Plan, SubscriptionStatus } from "@prisma/client";

function mockId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

async function getDefaultPlan(): Promise<Plan> {
  const plan = await prisma.plan.findFirst({ where: { isDefault: true } });
  if (!plan) {
    throw new Error("Aucun plan par défaut configuré. Contactez le support.");
  }
  return plan;
}

export interface CheckoutParams {
  userId: string;
  userEmail: string;
  stripeCustomerId: string | null;
  plan: Plan;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Creates a Stripe Checkout Session for a subscription plan, or — in mock
 * mode — activates the subscription directly against the database so the
 * full billing flow can be exercised without a Stripe account.
 */
export async function createCheckoutSession(params: CheckoutParams): Promise<{ url: string }> {
  const { userId, userEmail, plan, successUrl, cancelUrl } = params;

  if (env.STRIPE_MOCK_MODE || !stripe) {
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: params.stripeCustomerId ?? mockId("mock_cus") },
    });

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId: plan.id,
        status: "ACTIVE",
        stripeSubscriptionId: mockId("mock_sub"),
        currentPeriodEnd: periodEnd,
      },
      update: {
        planId: plan.id,
        status: "ACTIVE",
        stripeSubscriptionId: mockId("mock_sub"),
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
    });

    return { url: `${successUrl}?mock=true` };
  }

  if (!plan.stripePriceId) {
    throw new Error(`Le plan "${plan.name}" n'a pas de prix Stripe associé.`);
  }

  let stripeCustomerId = params.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ email: userEmail, metadata: { userId } });
    stripeCustomerId = customer.id;
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId } });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    subscription_data: { metadata: { userId } },
  });

  if (!session.url) {
    throw new Error("Stripe n'a pas retourné d'URL de paiement.");
  }
  return { url: session.url };
}

/** Creates a Stripe Customer Portal session, or a no-op return URL in mock mode. */
export async function createPortalSession(
  stripeCustomerId: string,
  returnUrl: string,
): Promise<{ url: string }> {
  if (env.STRIPE_MOCK_MODE || !stripe) {
    return { url: returnUrl };
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  return { url: session.url };
}

export interface StripePlanInput {
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
  interval: "month" | "year";
}

/**
 * Creates the underlying Stripe Product + Price for a new plan created from
 * the admin UI. Free plans (priceCents === 0) skip Stripe entirely. In mock
 * mode, returns fixture ids so the admin flow is fully testable without a
 * Stripe account.
 */
export async function createStripePlan(
  input: StripePlanInput,
): Promise<{ stripeProductId: string | null; stripePriceId: string | null }> {
  if (input.priceCents === 0) {
    return { stripeProductId: null, stripePriceId: null };
  }

  if (env.STRIPE_MOCK_MODE || !stripe) {
    return { stripeProductId: mockId("mock_prod"), stripePriceId: mockId("mock_price") };
  }

  const product = await stripe.products.create({
    name: input.name,
    description: input.description,
  });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: input.priceCents,
    currency: input.currency,
    recurring: { interval: input.interval },
  });

  return { stripeProductId: product.id, stripePriceId: price.id };
}

const STRIPE_STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "ACTIVE",
  trialing: "TRIALING",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  incomplete: "INCOMPLETE",
  incomplete_expired: "CANCELED",
  unpaid: "UNPAID",
  paused: "CANCELED",
};

/** Upserts our local Subscription row from a Stripe subscription object (webhook-driven). */
export async function syncSubscriptionFromStripeSubscription(
  subscription: Stripe.Subscription,
): Promise<void> {
  const userId =
    subscription.metadata?.userId ??
    (
      await prisma.user.findUnique({
        where: { stripeCustomerId: subscription.customer as string },
        select: { id: true },
      })
    )?.id;

  if (!userId) {
    console.error(`Stripe webhook: no matching user for subscription ${subscription.id}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const plan = priceId ? await prisma.plan.findUnique({ where: { stripePriceId: priceId } }) : null;
  if (!plan) {
    console.error(`Stripe webhook: no matching plan for price ${priceId}`);
    return;
  }

  const status = STRIPE_STATUS_MAP[subscription.status] ?? "INCOMPLETE";
  // current_period_end moved from the subscription to its first item in
  // recent Stripe API versions (flexible/multi-item billing periods).
  const itemPeriodEnd = subscription.items.data[0]?.current_period_end;
  const currentPeriodEnd = itemPeriodEnd ? new Date(itemPeriodEnd * 1000) : null;

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      planId: plan.id,
      status,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      planId: plan.id,
      status,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

/** Reverts a user to the default (free) plan — called when a subscription is deleted. */
export async function revertToDefaultPlan(stripeCustomerId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { stripeCustomerId }, select: { id: true } });
  if (!user) return;

  const defaultPlan = await getDefaultPlan();
  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, planId: defaultPlan.id, status: "ACTIVE" },
    update: {
      planId: defaultPlan.id,
      status: "ACTIVE",
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
  });
}

/** Marks a user's subscription as past due (payment failure) without changing their plan. */
export async function markPastDue(stripeCustomerId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { stripeCustomerId }, select: { id: true } });
  if (!user) return;
  await prisma.subscription.update({ where: { userId: user.id }, data: { status: "PAST_DUE" } }).catch(() => {
    // No subscription row yet — nothing to mark past due.
  });
}

export { getDefaultPlan };
