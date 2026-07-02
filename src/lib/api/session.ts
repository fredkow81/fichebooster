import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiAuthError } from "./response";
import type { Store } from "@prisma/client";

export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new ApiAuthError("Vous devez être connecté pour effectuer cette action.");
  }
  return session.user.id;
}

/** Verifies the current session belongs to an ADMIN user. Used by every /api/admin/* route. */
export async function requireAdmin(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new ApiAuthError("Vous devez être connecté pour effectuer cette action.");
  }
  if (session.user.role !== "ADMIN") {
    throw new ApiAuthError("Accès réservé aux administrateurs.", 403);
  }
  return session.user.id;
}

/** Loads a store and verifies it belongs to the current user — prevents cross-tenant access. */
export async function requireOwnedStore(storeId: string, userId: string): Promise<Store> {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store || store.userId !== userId) {
    throw new ApiAuthError("Boutique introuvable ou accès non autorisé.", 404);
  }
  return store;
}
