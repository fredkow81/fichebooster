import { requireUserId } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";
import { ShopifyConnectionForm } from "@/components/ShopifyConnectionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function StoresPage() {
  const userId = await requireUserId();
  const stores = await prisma.store.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Boutiques connectées</h1>

      {stores.length > 0 && (
        <div className="flex flex-col gap-3">
          {stores.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <Link href={`/stores/${s.id}`} className="font-medium hover:underline">
                    {s.shopDomain}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Marché : {s.defaultMarket} · Langue : {s.defaultLanguage} · Connectée le{" "}
                    {formatDate(s.createdAt)}
                  </p>
                </div>
                <Badge variant={s.isActive ? "success" : "secondary"}>
                  {s.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ShopifyConnectionForm />
    </div>
  );
}
