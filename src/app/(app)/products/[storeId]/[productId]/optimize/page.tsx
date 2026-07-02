"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { LoadingAnalysisState } from "@/components/LoadingAnalysisState";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/components/ui/toast";

interface CollectionOption {
  id: string;
  title: string;
}

export default function OptimizeFormPage({
  params,
}: {
  params: { storeId: string; productId: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [niche, setNiche] = useState("");
  const [collectionHint, setCollectionHint] = useState<string>("");
  const [targetMarket, setTargetMarket] = useState("France");
  const [targetLanguage, setTargetLanguage] = useState("fr");
  const [tone, setTone] = useState("NATURAL");
  const [objective, setObjective] = useState("BALANCED");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/stores/${params.storeId}/collections`)
      .then((r) => r.json())
      .then((d) => setCollections(d.collections ?? []))
      .catch(() => undefined);
  }, [params.storeId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAnalyzing(true);
    setError(null);

    try {
      const createRes = await fetch("/api/optimizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: params.storeId,
          shopifyProductId: decodeURIComponent(params.productId),
          niche,
          collectionHint: collectionHint || undefined,
          targetMarket,
          targetLanguage,
          tone,
          objective,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        setError(createData.error ?? "Erreur lors de la création de l'optimisation.");
        setAnalyzing(false);
        return;
      }

      const optimizationId = createData.optimization.id;

      const analyzeRes = await fetch(`/api/optimizations/${optimizationId}/analyze`, { method: "POST" });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) {
        setError(analyzeData.error ?? "Erreur lors de l'analyse IA.");
        setAnalyzing(false);
        return;
      }

      toast({ title: "Analyse terminée", description: "Optimisation prête à être validée.", variant: "success" });
      router.push(`/optimizations/${optimizationId}`);
    } catch {
      setError("Erreur réseau lors du lancement de l'analyse.");
      setAnalyzing(false);
    }
  }

  if (analyzing) {
    return <LoadingAnalysisState />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Orientation de l'optimisation SEO</CardTitle>
          <CardDescription>
            Renseignez quelques informations pour guider l'analyse IA et l'optimisation de la fiche produit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="niche">Niche du produit</Label>
              <Input
                id="niche"
                placeholder="ex: maroquinerie homme"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="collection">Collection produit</Label>
              <Select value={collectionHint} onValueChange={setCollectionHint}>
                <SelectTrigger id="collection">
                  <SelectValue placeholder="Sélectionner une collection (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((c) => (
                    <SelectItem key={c.id} value={c.title}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="market">Marché cible</Label>
                <Input id="market" value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="language">Langue de rédaction</Label>
                <Input id="language" value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ton de rédaction</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NATURAL">Naturel</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="EXPERT">Expert</SelectItem>
                    <SelectItem value="ACCESSIBLE">Accessible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Objectif principal</Label>
                <Select value={objective} onValueChange={setObjective}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEO">SEO</SelectItem>
                    <SelectItem value="GOOGLE_SHOPPING">Google Shopping</SelectItem>
                    <SelectItem value="CONVERSION">Conversion</SelectItem>
                    <SelectItem value="BALANCED">Équilibre SEO/conversion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <ErrorState message={error} />}

            <Button type="submit" size="lg">
              Lancer l'analyse IA
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
