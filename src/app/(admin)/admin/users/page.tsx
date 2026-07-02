import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserActions } from "./user-actions";

export default async function AdminUsersPage() {
  const [users, plans] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        subscription: {
          select: {
            status: true,
            currentPeriodEnd: true,
            plan: { select: { id: true, key: true, name: true } },
          },
        },
      },
    }),
    prisma.plan.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Utilisateurs ({users.length})</h1>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs text-muted-foreground">
              <tr>
                <th className="text-left p-3">Utilisateur</th>
                <th className="text-left p-3">Plan</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Rôle</th>
                <th className="text-left p-3">Inscrit le</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="p-3">
                    <p className="font-medium">{user.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="p-3">{user.subscription?.plan.name ?? "—"}</td>
                  <td className="p-3">
                    <Badge variant={user.subscription?.status === "ACTIVE" ? "success" : "secondary"}>
                      {user.subscription?.status ?? "—"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>{user.role}</Badge>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="p-3">
                    <UserActions
                      userId={user.id}
                      currentRole={user.role}
                      currentPlanId={user.subscription?.plan.id ?? null}
                      plans={plans.map((p) => ({ id: p.id, name: p.name }))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
