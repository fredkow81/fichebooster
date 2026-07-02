import { prisma } from "@/lib/prisma";
import { ApiAuthError } from "./response";
import type { ProductOptimization, ProductSnapshot, Store } from "@prisma/client";

export interface OwnedOptimization {
  optimization: ProductOptimization;
  snapshot: ProductSnapshot;
  store: Store;
}

export async function requireOwnedOptimization(
  optimizationId: string,
  userId: string,
): Promise<OwnedOptimization> {
  const optimization = await prisma.productOptimization.findUnique({
    where: { id: optimizationId },
    include: { snapshot: true, store: true },
  });

  if (!optimization || optimization.store.userId !== userId) {
    throw new ApiAuthError("Optimisation introuvable ou accès non autorisé.", 404);
  }

  return { optimization, snapshot: optimization.snapshot, store: optimization.store };
}
