import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle } from "lucide-react";

function scoreColor(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-amber-500";
  return "text-destructive";
}

function ScoreGauge({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn("text-3xl font-bold", scoreColor(score))}>{score}</div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export interface SeoScoreCardProps {
  scoreBefore: number;
  scoreAfter: number;
  improvements: string[];
  toImprove: string[];
}

export function SeoScoreCard({ scoreBefore, scoreAfter, improvements, toImprove }: SeoScoreCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Score SEO</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-center gap-8">
          <ScoreGauge label="Avant" score={scoreBefore} />
          <div className="text-muted-foreground">→</div>
          <ScoreGauge label="Après" score={scoreAfter} />
        </div>

        {improvements.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-1.5">Points corrigés</p>
            <ul className="space-y-1">
              {improvements.map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {toImprove.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-1.5">Points encore à améliorer</p>
            <ul className="space-y-1">
              {toImprove.map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
