import Link from "next/link";
import { requireUserId } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/shopify/service";
import { ProductCard } from "@/components/ProductCard";
import { StoreSelector } from "@/components/StoreSelector";
import { ProductSearchInput } from "./search-input";
import { Button } from "@/components/ui/button";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { storeId?: string; search?: string };
}) {
  const userId = await requireUserId();
  const stores = await prisma.store.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });

  if (stores.length === 0) {
    return (
      <div className="text-center mt-20">
        <p className="text-muted-foreground mb-4">Connectez une boutique pour voir vos produits.</p>
        <Button asChild>
          <Link href="/stores">Connecter une boutique</Link>
        </Button>
      </div>
    );
  }

  const activeStore = stores.find((s) => s.id === searchParams.storeId) ?? stores[0]!;
  const products = await listProducts(activeStore, { search: searchParams.search });

  const statusMap = new Map(
    (
      await prisma.productOptimization.findMany({
        where: { storeId: activeStore.id, shopifyProductId: { in: products.map((p) => p.id) } },
        orderBy: { updatedAt: "desc" },
        distinct: ["shopifyProductId"],
        select: { shopifyProductId: true, status: true },
      })
    ).map((o) => [o.shopifyProductId, o.status]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Produits</h1>
        <div className="flex items-center gap-3">
          <ProductSearchInput defaultValue={searchParams.search ?? ""} storeId={activeStore.id} />
          <StoreSelector
            stores={stores.map((s) => ({ id: s.id, shopDomain: s.shopDomain }))}
            value={activeStore.id}
            basePath="/products"
          />
        </div>
      </div>

      {products.length === 0 ? (
        <p className="text-muted-foreground">Aucun produit trouvé.</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              storeId={activeStore.id}
              productId={p.id}
              title={p.title}
              imageUrl={p.featuredImage?.url ?? null}
              collectionTitle={p.collections[0]?.title ?? null}
              status={statusMap.get(p.id) ?? "NOT_OPTIMIZED"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
