import { Loader2 } from "lucide-react";

const STEPS = [
  "Analyse des images produit...",
  "Recherche du mot-clé principal...",
  "Rédaction du titre et des meta-données...",
  "Génération de la description complète...",
  "Construction du maillage interne...",
];

export function LoadingAnalysisState({ step = 0 }: { step?: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border py-16 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div>
        <p className="font-medium">Analyse IA en cours</p>
        <p className="text-sm text-muted-foreground mt-1">{STEPS[Math.min(step, STEPS.length - 1)]}</p>
      </div>
      <p className="text-xs text-muted-foreground max-w-sm">
        Cette opération peut prendre jusqu'à une minute selon le nombre d'images à analyser.
      </p>
    </div>
  );
}
