import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api/session";
import { handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const userId = await requireUserId();

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    if (!subscription) {
      throw new Error(`User ${userId} has no subscription row.`);
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [storesUsed, optimizationsUsedThisMonth, availablePlans] = await Promise.all([
      prisma.store.count({ where: { userId, isActive: true } }),
      prisma.productOptimization.count({ where: { store: { userId }, createdAt: { gte: startOfMonth } } }),
      prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    ]);

    return NextResponse.json({
      subscription: {
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        plan: subscription.plan,
      },
      usage: { storesUsed, optimizationsUsedThisMonth },
      availablePlans,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
