"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TitleSuggestions } from "@/components/TitleSuggestions";
import { MetaEditor } from "@/components/MetaEditor";
import { VariantComparisonTable, type VariantRow } from "@/components/VariantComparisonTable";
import { DescriptionPreview } from "@/components/DescriptionPreview";
import { InternalLinksPreview } from "@/components/InternalLinksPreview";
import { SeoScoreCard } from "@/components/SeoScoreCard";
import { KeywordRecommendationCard } from "@/components/KeywordRecommendationCard";
import { OptimizationDiffViewer } from "@/components/OptimizationDiffViewer";
import { PublishConfirmationModal } from "@/components/PublishConfirmationModal";
import { LoadingAnalysisState } from "@/components/LoadingAnalysisState";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/components/ui/toast";
import { slugify } from "@/lib/utils";
import { ArrowLeft, ExternalLink } from "lucide-react";

interface OptimizationData {
  id: string;
  status: string;
  errorMessage: string | null;
  storeId: string;
  shopifyProductId: string;
  recommendedTitleSeo: string | null;
  recommendedTitleShopping: string | null;
  recommendedTitleBalanced: string | null;
  recommendedHandle: string | null;
  finalHandle: string | null;
  finalTitle: string | null;
  finalMetaTitle: string | null;
  finalMetaDescription: string | null;
  finalDescriptionHtml: string | null;
  finalVariants: VariantRow[] | null;
  seoScoreBefore: number | null;
  seoScoreAfter: number | null;
  seoImprovements: string[] | null;
  seoRisks: string[] | null;
  snapshot: {
    title: string;
    handle: string;
    descriptionHtml: string;
    metaTitle: string | null;
    metaDescription: string | null;
  };
  keywordRecommendation: {
    primaryKeyword: string;
    relevanceScore: number;
    transactionalIntentScore: number;
    cannibalizationRisk: string;
    justification: string;
  } | null;
  internalLinks: {
    id: string;
    type: string;
    targetUrl: string;
    anchorText: string;
    justification: string;
  }[];
}

export function OptimizationEditor({ optimization }: { optimization: OptimizationData }) {
  const router = useRouter();
  const { toast } = useToast();

  const [status, setStatus] = useState(optimization.status);
  const [errorMessage, setErrorMessage] = useState(optimization.errorMessage);
  const [handle, setHandle] = useState(optimization.finalHandle ?? optimization.recommendedHandle ?? "");
  const [title, setTitle] = useState(optimization.finalTitle ?? optimization.recommendedTitleBalanced ?? "");
  const [metaTitle, setMetaTitle] = useState(optimization.finalMetaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(optimization.finalMetaDescription ?? "");
  const [descriptionHtml, setDescriptionHtml] = useState(optimization.finalDescriptionHtml ?? "");
  const [variants, setVariants] = useState<VariantRow[]>(optimization.finalVariants ?? []);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  const isPending = status === "DRAFT" || status === "ANALYZING";
  const isError = status === "ERROR";
  const isReady = status === "READY_FOR_REVIEW" || status === "PUBLISHED";

  async function runAnalysis() {
    setAnalyzing(true);
    const res = await fetch(`/api/optimizations/${optimization.id}/analyze`, { method: "POST" });
    const data = await res.json();
    setAnalyzing(false);
    if (!res.ok) {
      setStatus("ERROR");
      setErrorMessage(data.error ?? "Erreur lors de l'analyse.");
      return;
    }
    router.refresh();
  }

  async function saveDraft() {
    setSaving(true);
    const res = await fetch(`/api/optimizations/${optimization.id}/draft`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        finalHandle: handle,
        finalTitle: title,
        finalMetaTitle: metaTitle,
        finalMetaDescription: metaDescription,
        finalDescriptionHtml: descriptionHtml,
        finalVariants: variants,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast({ title: "Brouillon enregistré", variant: "success" });
    } else {
      toast({ title: "Erreur lors de l'enregistrement", variant: "error" });
    }
  }

  async function confirmPublish() {
    setPublishing(true);
    await saveDraft();
    const res = await fetch(`/api/optimizations/${optimization.id}/publish`, { method: "POST" });
    const data = await res.json();
    setPublishing(false);
    setPublishModalOpen(false);
    if (!res.ok) {
      toast({ title: "Échec de la publication", description: data.error, variant: "error" });
      setStatus("ERROR");
      return;
    }
    setStatus("PUBLISHED");
    setPublishedUrl(data.storefrontUrl ?? null);
    toast({
      title: "Fiche produit publiée sur Shopify",
      description: data.storefrontUrl,
      variant: "success",
    });
  }

  if (isPending && !isReady) {
    return (
      <div className="max-w-2xl mx-auto">
        {analyzing ? (
          <LoadingAnalysisState />
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">L'analyse IA n'a pas encore été lancée pour ce produit.</p>
            <Button onClick={runAnalysis}>Lancer l'analyse IA</Button>
          </div>
        )}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorState
          title="L'analyse a échoué"
          message={errorMessage ?? "Erreur inconnue."}
          onRetry={runAnalysis}
        />
      </div>
    );
  }

  const titleOptions = [
    { key: "seo" as const, label: "Variante SEO", value: optimization.recommendedTitleSeo ?? "" },
    { key: "shopping" as const, label: "Variante Google Shopping", value: optimization.recommendedTitleShopping ?? "" },
    { key: "balanced" as const, label: "Variante équilibrée", value: optimization.recommendedTitleBalanced ?? "" },
  ];

  const handleChanged = handle !== optimization.snapshot.handle;
  const summary = [
    { label: "Titre", changed: title !== optimization.snapshot.title },
    { label: "Handle / URL", changed: handleChanged },
    { label: "Meta title", changed: metaTitle !== (optimization.snapshot.metaTitle ?? "") },
    { label: "Meta description", changed: metaDescription !== (optimization.snapshot.metaDescription ?? "") },
    { label: "Description", changed: descriptionHtml !== optimization.snapshot.descriptionHtml },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <Link
          href={`/products/${optimization.storeId}/${encodeURIComponent(optimization.shopifyProductId)}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Retour au produit
        </Link>
        <Badge variant={status === "PUBLISHED" ? "success" : "warning"}>
          {status === "PUBLISHED" ? "Publié" : "Prêt pour validation"}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Titre produit</CardTitle>
            </CardHeader>
            <CardContent>
              <TitleSuggestions options={titleOptions} selected={title} onSelect={setTitle} />
              <div className="mt-3">
                <Label htmlFor="custom-title">Titre final (modifiable)</Label>
                <Input id="custom-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Handle (URL)</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Input
                value={handle}
                onChange={(e) => setHandle(slugify(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Actuel : /products/{optimization.snapshot.handle} → Nouveau : /products/{handle}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meta title & meta description</CardTitle>
            </CardHeader>
            <CardContent>
              <MetaEditor
                metaTitle={metaTitle}
                metaDescription={metaDescription}
                onChangeMetaTitle={setMetaTitle}
                onChangeMetaDescription={setMetaDescription}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variantes</CardTitle>
            </CardHeader>
            <CardContent>
              <VariantComparisonTable variants={variants} onChange={setVariants} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description produit</CardTitle>
            </CardHeader>
            <CardContent>
              <DescriptionPreview html={descriptionHtml} onChange={setDescriptionHtml} />
            </CardContent>
          </Card>

          <InternalLinksPreview links={optimization.internalLinks} />

          <Card>
            <CardHeader>
              <CardTitle>Comparatif avant / après</CardTitle>
            </CardHeader>
            <CardContent>
              <OptimizationDiffViewer
                rows={[
                  { label: "Titre", before: optimization.snapshot.title, after: title },
                  { label: "Handle", before: optimization.snapshot.handle, after: handle },
                  { label: "Meta title", before: optimization.snapshot.metaTitle ?? "", after: metaTitle },
                  {
                    label: "Meta description",
                    before: optimization.snapshot.metaDescription ?? "",
                    after: metaDescription,
                  },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <SeoScoreCard
            scoreBefore={optimization.seoScoreBefore ?? 0}
            scoreAfter={optimization.seoScoreAfter ?? 0}
            improvements={optimization.seoImprovements ?? []}
            toImprove={optimization.seoRisks ?? []}
          />

          {optimization.keywordRecommendation && (
            <KeywordRecommendationCard
              primaryKeyword={optimization.keywordRecommendation.primaryKeyword}
              relevanceScore={optimization.keywordRecommendation.relevanceScore}
              transactionalIntentScore={optimization.keywordRecommendation.transactionalIntentScore}
              cannibalizationRisk={optimization.keywordRecommendation.cannibalizationRisk}
              justification={optimization.keywordRecommendation.justification}
            />
          )}

          <Card>
            <CardContent className="flex flex-col gap-2 pt-4">
              <Button onClick={saveDraft} variant="outline" disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer en brouillon"}
              </Button>
              <Button onClick={runAnalysis} variant="ghost" disabled={analyzing}>
                {analyzing ? "Régénération..." : "Régénérer l'optimisation"}
              </Button>
              <Button
                onClick={() => setPublishModalOpen(true)}
                disabled={status === "PUBLISHED"}
              >
                {status === "PUBLISHED" ? "Déjà publié" : "Publier sur Shopify"}
              </Button>
              {status === "PUBLISHED" && publishedUrl && (
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary flex items-center gap-1 justify-center"
                >
                  <ExternalLink className="h-3 w-3" /> Voir la fiche produit
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PublishConfirmationModal
        open={publishModalOpen}
        onOpenChange={setPublishModalOpen}
        onConfirm={confirmPublish}
        isPublishing={publishing}
        handleChanged={handleChanged}
        oldHandle={optimization.snapshot.handle}
        newHandle={handle}
        summary={summary}
      />
    </div>
  );
}
