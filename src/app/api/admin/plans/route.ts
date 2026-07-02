import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api/session";
import { handleApiError, jsonError } from "@/lib/api/response";
import { planInputSchema } from "@/lib/validations/billing";
import { createStripePlan } from "@/lib/stripe/service";

export async function GET() {
  try {
    await requireAdmin();
    const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ plans });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const input = planInputSchema.parse(body);

    const existing = await prisma.plan.findUnique({ where: { key: input.key } });
    if (existing) {
      return jsonError(`Un plan avec la clé "${input.key}" existe déjà.`, 409);
    }

    const { stripeProductId, stripePriceId } = await createStripePlan({
      name: input.name,
      description: input.description,
      priceCents: input.priceCents,
      currency: input.currency,
      interval: input.interval,
    });

    const plan = await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.plan.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
      }
      return tx.plan.create({
        data: {
          key: input.key,
          name: input.name,
          description: input.description,
          priceCents: input.priceCents,
          currency: input.currency,
          interval: input.interval,
          maxStores: input.maxStores,
          maxOptimizationsPerMonth: input.maxOptimizationsPerMonth,
          isDefault: input.isDefault,
          isActive: input.isActive,
          sortOrder: input.sortOrder,
          stripeProductId,
          stripePriceId,
        },
      });
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
