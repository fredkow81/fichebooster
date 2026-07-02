"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export function ShopifyConnectionForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [shopDomain, setShopDomain] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [defaultMarket, setDefaultMarket] = useState("France");
  const [defaultLanguage, setDefaultLanguage] = useState("fr");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopDomain, clientId, clientSecret, defaultMarket, defaultLanguage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la connexion à la boutique.");
        return;
      }
      toast({ title: "Boutique connectée", description: shopDomain, variant: "success" });
      router.push("/stores");
      router.refresh();
    } catch {
      setError("Erreur réseau lors de la connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connecter une boutique Shopify</CardTitle>
        <CardDescription>
          Créez une app personnalisée depuis le Dev Dashboard de votre boutique (Paramètres → Apps et
          canaux de vente → Développer des apps) et renseignez son Client ID et Client Secret ci-dessous.
          Le secret est chiffré avant d'être stocké ; ne fonctionne que pour une boutique de votre propre
          organisation Shopify.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="shopDomain">Adresse de la boutique</Label>
            <Input
              id="shopDomain"
              placeholder="nom-boutique.myshopify.com"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="clientSecret">Client Secret</Label>
            <Input
              id="clientSecret"
              type="password"
              placeholder="shpss_..."
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="market">Marché cible</Label>
              <Input id="market" value={defaultMarket} onChange={(e) => setDefaultMarket(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="language">Langue</Label>
              <Input id="language" value={defaultLanguage} onChange={(e) => setDefaultLanguage(e.target.value)} />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? "Connexion en cours..." : "Connecter la boutique"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
