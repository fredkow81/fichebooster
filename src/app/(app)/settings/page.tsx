import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Paramètres</h1>

      <Card>
        <CardHeader>
          <CardTitle>Compte</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <p>
            <span className="text-muted-foreground">Nom : </span>
            {user?.name ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Email : </span>
            {user?.email}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration du moteur d'optimisation</CardTitle>
          <CardDescription>Statut des intégrations, défini via les variables d'environnement.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Connexion Shopify</span>
            <Badge variant={env.SHOPIFY_MOCK_MODE ? "warning" : "success"}>
              {env.SHOPIFY_MOCK_MODE ? "Mode démo (données simulées)" : "Connecté à l'Admin API"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Analyse IA (vision + texte)</span>
            <Badge variant={env.AI_MOCK_MODE ? "warning" : "success"}>
              {env.AI_MOCK_MODE ? "Mode démo (résultats simulés)" : `Actif (${env.AI_MODEL})`}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            Désactivez SHOPIFY_MOCK_MODE et AI_MOCK_MODE dans votre fichier .env pour connecter une vraie
            boutique Shopify et l'API Anthropic. Voir le README pour le détail.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
