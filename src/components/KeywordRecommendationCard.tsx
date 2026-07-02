import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RISK_LABEL: Record<string, { label: string; variant: "success" | "warning" | "destructive" }> = {
  LOW: { label: "Faible", variant: "success" },
  MEDIUM: { label: "Moyen", variant: "warning" },
  HIGH: { label: "Élevé", variant: "destructive" },
};

export interface KeywordRecommendationCardProps {
  primaryKeyword: string;
  relevanceScore: number;
  transactionalIntentScore: number;
  cannibalizationRisk: string;
  justification: string;
}

export function KeywordRecommendationCard({
  primaryKeyword,
  relevanceScore,
  transactionalIntentScore,
  cannibalizationRisk,
  justification,
}: KeywordRecommendationCardProps) {
  const risk = RISK_LABEL[cannibalizationRisk] ?? RISK_LABEL.LOW!;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mot-clé principal recommandé</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xl font-semibold text-primary">{primaryKeyword}</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Pertinence</p>
            <p className="font-medium">{relevanceScore}/100</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Intention transactionnelle</p>
            <p className="font-medium">{transactionalIntentScore}/100</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Risque de cannibalisation :</span>
          <Badge variant={risk.variant}>{risk.label}</Badge>
        </div>

        <p className="text-sm text-muted-foreground border-t border-border pt-2">{justification}</p>
      </CardContent>
    </Card>
  );
}
