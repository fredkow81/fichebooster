import Stripe from "stripe";
import { env } from "@/lib/env";

const globalForStripe = globalThis as unknown as { stripe?: Stripe };

function createClient(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Set STRIPE_MOCK_MODE=true to run without a Stripe account, or provide the key.",
    );
  }
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2026-06-24.dahlia" });
}

export const stripe = env.STRIPE_MOCK_MODE
  ? undefined
  : (globalForStripe.stripe ?? createClient());

if (!env.STRIPE_MOCK_MODE && process.env.NODE_ENV !== "production") {
  globalForStripe.stripe = stripe;
}
