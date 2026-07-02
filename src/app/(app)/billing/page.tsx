"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UsageBar } from "@/components/UsageBar";
import { PlanCard } from "@/components/PlanCard";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

interface Plan {
  id: string;
  key: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  interval: string;
  maxStores: number | null;
  maxOptimizationsPerMonth: number | null;
}

interface SubscriptionData {
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    plan: Plan;
  };
  usage: { storesUsed: number; optimizationsUsedThisMonth: number };
  availablePlans: Plan[];
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/billing/subscription");
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Erreur lors du chargement de la facturation.");
      return;
    }
    setData(json);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast({ title: "Abonnement activé", variant: "success" });
    } else if (searchParams.get("checkout") === "cancelled") {
      toast({ title: "Paiement annulé", variant: "info" });
    }
  }, [searchParams, toast]);

  async function handleSubscribe(planKey: string) {
    setActionLoading(planKey);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planKey }),
    });
    const json = await res.json();
    setActionLoading(null);
    if (!res.ok) {
      toast({ title: "Échec de la souscription", description: json.error, variant: "error" });
      return;
    }
    window.location.href = json.url;
  }

  async function handleManage() {
    setActionLoading("portal");
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const json = await res.json();
    setActionLoading(null);
    if (!res.ok) {
      toast({ title: "Impossible d'ouvrir le portail", description: json.error, variant: "error" });
      return;
    }
    window.location.href = json.url;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (!data) {
    return <p className="text-muted-foreground">Chargement...</p>;
  }

  const { subscription, usage, availablePlans } = data;
  const isFreePlan = subscription.plan.priceCents === 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Facturation</h1>

      <Card>
        <CardHeader>
          <CardTitle>Abonnement actuel : {subscription.plan.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <UsageBar
            label="Boutiques connectées"
            current={usage.storesUsed}
            max={subscription.plan.maxStores}
          />
          <UsageBar
            label="Optimisations ce mois-ci"
            current={usage.optimizationsUsedThisMonth}
            max={subscription.plan.maxOptimizationsPerMonth}
          />
          {subscription.currentPeriodEnd && (
            <p className="text-xs text-muted-foreground">
              {subscription.cancelAtPeriodEnd ? "Se termine le " : "Renouvellement le "}
              {formatDate(subscription.currentPeriodEnd)}
            </p>
          )}
          {!isFreePlan && (
            <Button variant="outline" onClick={handleManage} disabled={actionLoading === "portal"} className="w-fit">
              {actionLoading === "portal" ? "..." : "Gérer mon abonnement"}
            </Button>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="font-medium mb-3">Plans disponibles</h2>
        <div className="grid grid-cols-3 gap-4">
          {availablePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              name={plan.name}
              description={plan.description}
              priceCents={plan.priceCents}
              currency={plan.currency}
              interval={plan.interval}
              maxStores={plan.maxStores}
              maxOptimizationsPerMonth={plan.maxOptimizationsPerMonth}
              isCurrent={plan.id === subscription.plan.id}
              isFree={plan.priceCents === 0}
              loading={actionLoading === plan.key}
              onSelect={() => handleSubscribe(plan.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
