import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api/session";
import { handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    await requireAdmin();

    const [totalUsers, planBreakdown, activeSubscriptions] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.groupBy({
        by: ["planId"],
        _count: { _all: true },
      }),
      prisma.subscription.findMany({
        where: { status: { in: ["ACTIVE", "TRIALING"] } },
        include: { plan: { select: { name: true, priceCents: true, currency: true } } },
      }),
    ]);

    const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
    const planNameById = new Map(plans.map((p) => [p.id, p.name]));

    const mrrCents = activeSubscriptions.reduce((sum, sub) => sum + sub.plan.priceCents, 0);

    return NextResponse.json({
      totalUsers,
      mrrCents,
      planBreakdown: planBreakdown.map((row) => ({
        planId: row.planId,
        planName: planNameById.get(row.planId) ?? "?",
        count: row._count._all,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
