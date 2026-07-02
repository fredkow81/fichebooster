import { notFound } from "next/navigation";
import { requireUserId, requireOwnedStore } from "@/lib/api/session";
import { decryptSecret } from "@/lib/crypto";
import { verifyStoreConnection } from "@/lib/shopify/service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ErrorState } from "@/components/ErrorState";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { DisconnectStoreButton } from "./disconnect-button";

export default async function StoreDetailPage({ params }: { params: { storeId: string } }) {
  const userId = await requireUserId();
  const store = await requireOwnedStore(params.storeId, userId).catch(() => null);
  if (!store) notFound();

  const accessToken = decryptSecret(store.encryptedAccessToken);
  const verification = await verifyStoreConnection(store.shopDomain, accessToken);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{store.shopDomain}</h1>
        <DisconnectStoreButton storeId={store.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>État de la connexion</CardTitle>
          <CardDescription>Vérification en direct de l'accès à l'Admin API Shopify.</CardDescription>
        </CardHeader>
        <CardContent>
          {verification.ok ? (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Connexion active — {verification.shopName}</span>
            </div>
          ) : (
            <ErrorState title="Connexion Shopify impossible" message={verification.error} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paramètres par défaut</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Badge variant="outline">Marché : {store.defaultMarket}</Badge>
          <Badge variant="outline">Langue : {store.defaultLanguage}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
