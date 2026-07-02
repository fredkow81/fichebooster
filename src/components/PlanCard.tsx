import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export interface PlanCardProps {
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  interval: string;
  maxStores: number | null;
  maxOptimizationsPerMonth: number | null;
  isCurrent: boolean;
  isFree: boolean;
  loading: boolean;
  onSelect: () => void;
}

export function PlanCard({
  name,
  description,
  priceCents,
  currency,
  interval,
  maxStores,
  maxOptimizationsPerMonth,
  isCurrent,
  isFree,
  loading,
  onSelect,
}: PlanCardProps) {
  const price = (priceCents / 100).toLocaleString("fr-FR", { style: "currency", currency });

  return (
    <Card className={isCurrent ? "border-primary" : undefined}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{name}</CardTitle>
          {isCurrent && <Badge>Plan actuel</Badge>}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
        <p className="text-2xl font-bold mt-2">
          {price}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / {interval === "month" ? "mois" : "an"}
          </span>
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col gap-1.5 text-sm">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-success" />
            {maxStores ?? "Boutiques illimitées"}
            {maxStores !== null && ` boutique(s)`}
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-success" />
            {maxOptimizationsPerMonth ?? "Optimisations illimitées"}
            {maxOptimizationsPerMonth !== null && ` optimisation(s)/mois`}
          </li>
        </ul>

        <Button onClick={onSelect} disabled={isCurrent || loading || isFree} className="w-full">
          {isCurrent ? "Plan actuel" : isFree ? "Inclus par défaut" : loading ? "..." : "S'abonner"}
        </Button>
      </CardContent>
    </Card>
  );
}
