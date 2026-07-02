import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlanForm } from "./plan-form";

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Plans</h1>
        <PlanForm mode="create" />
      </div>

      <div className="flex flex-col gap-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {plan.name}
                  {plan.isDefault && <Badge variant="secondary">Par défaut</Badge>}
                  {!plan.isActive && <Badge variant="outline">Inactif</Badge>}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {(plan.priceCents / 100).toLocaleString("fr-FR", {
                    style: "currency",
                    currency: plan.currency,
                  })}{" "}
                  / {plan.interval === "month" ? "mois" : "an"} · {plan.maxStores ?? "∞"} boutique(s) ·{" "}
                  {plan.maxOptimizationsPerMonth ?? "∞"} optimisation(s)/mois
                </p>
              </div>
              <PlanForm mode="edit" plan={plan} />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
