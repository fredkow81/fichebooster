import { requireUserId } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";
import { StoreSelector } from "@/components/StoreSelector";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const ACTION_LABEL: Record<string, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  draft_saved: { label: "Brouillon enregistré", variant: "secondary" },
  published: { label: "Publié", variant: "success" },
  error: { label: "Erreur", variant: "destructive" },
};

export default async function HistoryPage({ searchParams }: { searchParams: { storeId?: string } }) {
  const userId = await requireUserId();
  const stores = await prisma.store.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });

  if (stores.length === 0) {
    return <p className="text-muted-foreground">Connectez une boutique pour voir l'historique.</p>;
  }

  const activeStore = stores.find((s) => s.id === searchParams.storeId) ?? stores[0]!;
  const history = await prisma.optimizationHistory.findMany({
    where: { storeId: activeStore.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { email: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Historique des optimisations</h1>
        <StoreSelector
          stores={stores.map((s) => ({ id: s.id, shopDomain: s.shopDomain }))}
          value={activeStore.id}
          basePath="/history"
        />
      </div>

      {history.length === 0 ? (
        <p className="text-muted-foreground">Aucune optimisation enregistrée pour cette boutique.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs text-muted-foreground">
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Produit</th>
                <th className="text-left p-3">Mot-clé</th>
                <th className="text-left p-3">Ancien → Nouveau titre</th>
                <th className="text-left p-3">Ancien → Nouveau handle</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Utilisateur</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => {
                const action = ACTION_LABEL[h.action] ?? { label: h.action, variant: "secondary" as const };
                return (
                  <tr key={h.id} className="border-t border-border">
                    <td className="p-3 whitespace-nowrap">{formatDate(h.createdAt)}</td>
                    <td className="p-3">
                      <Link
                        href={`/optimizations/${h.optimizationId}`}
                        className="text-primary hover:underline"
                      >
                        {h.newTitle ?? h.oldTitle ?? h.shopifyProductId}
                      </Link>
                    </td>
                    <td className="p-3">{h.keyword ?? "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground max-w-xs">
                      {h.oldTitle} → {h.newTitle}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {h.oldHandle} → {h.newHandle}
                    </td>
                    <td className="p-3">
                      <Badge variant={action.variant}>{action.label}</Badge>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{h.user.email}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
