import { prisma } from "@/lib/prisma";
import { PlanLimitError } from "@/lib/api/response";
import type { Plan } from "@prisma/client";

/** Pure limit check — null max means unlimited. Kept separate from DB access for easy unit testing. */
export function isOverLimit(current: number, max: number | null): boolean {
  if (max === null) return false;
  return current >= max;
}

export async function getEffectivePlan(userId: string): Promise<Plan> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });
  if (!subscription) {
    throw new Error(`User ${userId} has no subscription row — every user must have one (see registration flow).`);
  }
  return subscription.plan;
}

/** Throws PlanLimitError if creating a new store would exceed the user's plan. Only call before creating a genuinely new store (not on updates to an existing one). */
export async function assertStoreLimit(userId: string): Promise<void> {
  const plan = await getEffectivePlan(userId);
  const currentCount = await prisma.store.count({ where: { userId, isActive: true } });

  if (isOverLimit(currentCount, plan.maxStores)) {
    throw new PlanLimitError(
      `Votre plan "${plan.name}" est limité à ${plan.maxStores} boutique(s) connectée(s). Passez à un plan supérieur pour en connecter davantage.`,
    );
  }
}

/** Throws PlanLimitError if creating a new optimization this month would exceed the user's plan. */
export async function assertOptimizationLimit(userId: string): Promise<void> {
  const plan = await getEffectivePlan(userId);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const currentCount = await prisma.productOptimization.count({
    where: { store: { userId }, createdAt: { gte: startOfMonth } },
  });

  if (isOverLimit(currentCount, plan.maxOptimizationsPerMonth)) {
    throw new PlanLimitError(
      `Votre plan "${plan.name}" est limité à ${plan.maxOptimizationsPerMonth} optimisation(s) par mois. Passez à un plan supérieur pour continuer.`,
    );
  }
}
