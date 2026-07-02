import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function AdminOverviewPage() {
  const [totalUsers, plans, activeSubscriptions] = await Promise.all([
    prisma.user.count(),
    prisma.plan.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.subscription.findMany({
      where: { status: { in: ["ACTIVE", "TRIALING"] } },
      include: { plan: { select: { id: true, name: true, priceCents: true, currency: true } } },
    }),
  ]);

  const mrrCents = activeSubscriptions.reduce((sum, sub) => sum + sub.plan.priceCents, 0);
  const currency = activeSubscriptions[0]?.plan.currency ?? "eur";

  const breakdown = plans.map((plan) => ({
    plan,
    count: activeSubscriptions.filter((s) => s.plan.id === plan.id).length,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Vue d'ensemble</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Utilisateurs</CardDescription>
            <CardTitle className="text-3xl">{totalUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Abonnements actifs</CardDescription>
            <CardTitle className="text-3xl">{activeSubscriptions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>MRR estimé</CardDescription>
            <CardTitle className="text-3xl">
              {(mrrCents / 100).toLocaleString("fr-FR", { style: "currency", currency })}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Répartition par plan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {breakdown.map(({ plan, count }) => (
            <div key={plan.id} className="flex items-center justify-between text-sm border-b border-border py-2 last:border-0">
              <span>{plan.name}</span>
              <span className="text-muted-foreground">{count} utilisateur(s)</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
