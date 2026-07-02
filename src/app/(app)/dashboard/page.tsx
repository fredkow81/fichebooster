import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/shopify/service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Store as StoreIcon, Sparkles } from "lucide-react";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const stores = await prisma.store.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });

  if (stores.length === 0) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center flex flex-col items-center gap-4">
        <StoreIcon className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Connectez votre première boutique Shopify</h1>
        <p className="text-sm text-muted-foreground">
          Pour commencer à optimiser vos fiches produit, connectez une boutique Shopify.
        </p>
        <Button asChild>
          <Link href="/stores">Connecter une boutique</Link>
        </Button>
      </div>
    );
  }

  const store = stores[0]!;
  const products = await listProducts(store, { first: 8 });
  const optimizedCount = await prisma.productOptimization.count({
    where: { storeId: store.id, status: "PUBLISHED" },
  });
  const recentHistory = await prisma.optimizationHistory.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const statusMap = new Map(
    (
      await prisma.productOptimization.findMany({
        where: { storeId: store.id, shopifyProductId: { in: products.map((p) => p.id) } },
        orderBy: { updatedAt: "desc" },
        distinct: ["shopifyProductId"],
        select: { shopifyProductId: true, status: true },
      })
    ).map((o) => [o.shopifyProductId, o.status]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{store.shopDomain}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/products">Voir tous les produits</Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Produits publiés optimisés</CardDescription>
            <CardTitle className="text-3xl">{optimizedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Boutiques connectées</CardDescription>
            <CardTitle className="text-3xl">{stores.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Dernière synchro</CardDescription>
            <CardTitle className="text-lg">
              {store.lastSyncedAt ? formatDate(store.lastSyncedAt) : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-medium">Produits récents</h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              storeId={store.id}
              productId={p.id}
              title={p.title}
              imageUrl={p.featuredImage?.url ?? null}
              collectionTitle={p.collections[0]?.title ?? null}
              status={statusMap.get(p.id) ?? "NOT_OPTIMIZED"}
            />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique récent</CardTitle>
        </CardHeader>
        <CardContent>
          {recentHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune optimisation pour le moment.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentHistory.map((h) => (
                <li key={h.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                  <span>{h.newTitle ?? h.oldTitle}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={h.action === "published" ? "success" : h.action === "error" ? "destructive" : "secondary"}>
                      {h.action}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(h.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
