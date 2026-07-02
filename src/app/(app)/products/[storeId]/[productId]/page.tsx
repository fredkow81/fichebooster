import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserId, requireOwnedStore } from "@/lib/api/session";
import { getProduct, getSimilarProducts } from "@/lib/shopify/service";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function ProductDetailPage({
  params,
}: {
  params: { storeId: string; productId: string };
}) {
  const userId = await requireUserId();
  const store = await requireOwnedStore(params.storeId, userId).catch(() => null);
  if (!store) notFound();

  const productId = decodeURIComponent(params.productId);
  const product = await getProduct(store, productId);
  if (!product) notFound();

  const similar = product.collections[0]
    ? await getSimilarProducts(store, product.collections[0].id, product.id)
    : [];

  const latestOptimization = await prisma.productOptimization.findFirst({
    where: { storeId: store.id, shopifyProductId: product.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{product.title}</h1>
        <div className="flex items-center gap-2">
          {latestOptimization && (
            <Button asChild variant="outline">
              <Link href={`/optimizations/${latestOptimization.id}`}>Voir la dernière optimisation</Link>
            </Button>
          )}
          <Button asChild>
            <Link href={`/products/${store.id}/${encodeURIComponent(product.id)}/optimize`}>
              Optimiser la fiche produit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <ProductImageGallery images={product.images} />

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations actuelles</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <Row label="Handle" value={product.handle} />
              <Row label="Meta title" value={product.seo.title ?? "(non défini)"} />
              <Row label="Meta description" value={product.seo.description ?? "(non défini)"} />
              <Row label="Vendeur" value={product.vendor} />
              <Row label="Type" value={product.productType} />
              <Row label="Dernière mise à jour" value={formatDate(product.updatedAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Collections</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2 flex-wrap">
              {product.collections.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune collection.</p>
              ) : (
                product.collections.map((c) => <Badge key={c.id} variant="outline">{c.title}</Badge>)
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Description actuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="prose-shopify text-sm"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml || "<p>(vide)</p>" }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variantes ({product.variants.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          {product.variants.map((v) => (
            <div key={v.id} className="flex justify-between border-b border-border py-1.5 last:border-0">
              <span>{v.title}</span>
              <span className="text-muted-foreground">{v.price} €</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {similar.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Produits similaires de la même collection</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 flex-wrap">
            {similar.map((p) => (
              <span key={p.id} className="text-sm px-3 py-1.5 rounded-md bg-secondary">
                {p.title}
              </span>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right truncate">{value}</span>
    </div>
  );
}
