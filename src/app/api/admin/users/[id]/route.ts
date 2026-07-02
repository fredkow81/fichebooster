import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api/session";
import { handleApiError, jsonError } from "@/lib/api/response";
import { adminUserUpdateSchema } from "@/lib/validations/billing";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = await req.json();
    const input = adminUserUpdateSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return jsonError("Utilisateur introuvable.", 404);
    }

    if (input.role) {
      await prisma.user.update({ where: { id: user.id }, data: { role: input.role } });
    }

    if (input.planId || input.status) {
      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          planId: input.planId ?? (await getDefaultPlanId()),
          status: input.status ?? "ACTIVE",
        },
        update: {
          ...(input.planId && { planId: input.planId }),
          ...(input.status && { status: input.status }),
        },
      });
    }

    const updated = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscription: { include: { plan: true } },
      },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

async function getDefaultPlanId(): Promise<string> {
  const plan = await prisma.plan.findFirstOrThrow({ where: { isDefault: true } });
  return plan.id;
}
