import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api/session";
import { handleApiError, jsonError } from "@/lib/api/response";

// Price/currency/interval/key are intentionally not editable here — the
// Stripe Price object is immutable once created, so changing them would
// silently desync our DB from what Stripe actually bills. Creating a new
// plan is the correct path for a price change.
const planPatchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  maxStores: z.number().int().min(0).nullable().optional(),
  maxOptimizationsPerMonth: z.number().int().min(0).nullable().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = await req.json();
    const input = planPatchSchema.parse(body);

    const existing = await prisma.plan.findUnique({ where: { id: params.id } });
    if (!existing) {
      return jsonError("Plan introuvable.", 404);
    }

    const plan = await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.plan.updateMany({
          where: { isDefault: true, id: { not: params.id } },
          data: { isDefault: false },
        });
      }
      return tx.plan.update({ where: { id: params.id }, data: input });
    });

    return NextResponse.json({ plan });
  } catch (err) {
    return handleApiError(err);
  }
}
