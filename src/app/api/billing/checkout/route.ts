import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api/session";
import { handleApiError, jsonError } from "@/lib/api/response";
import { checkoutSchema } from "@/lib/validations/billing";
import { createCheckoutSession } from "@/lib/stripe/service";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { planKey } = checkoutSchema.parse(body);

    const [user, plan] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      prisma.plan.findUnique({ where: { key: planKey } }),
    ]);

    if (!plan || !plan.isActive) {
      return jsonError("Plan introuvable ou indisponible.", 404);
    }
    if (plan.priceCents === 0) {
      return jsonError("Le plan gratuit ne nécessite pas de paiement.", 422);
    }

    const origin = req.nextUrl.origin;
    const { url } = await createCheckoutSession({
      userId,
      userEmail: user.email,
      stripeCustomerId: user.stripeCustomerId,
      plan,
      successUrl: `${origin}/billing?checkout=success`,
      cancelUrl: `${origin}/billing?checkout=cancelled`,
    });

    return NextResponse.json({ url });
  } catch (err) {
    return handleApiError(err);
  }
}
