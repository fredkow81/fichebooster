"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Erreur lors de la création du compte.");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Email ou mot de passe incorrect.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Erreur réseau.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{mode === "login" ? "Connexion" : "Créer un compte"}</CardTitle>
          <CardDescription>Shopify SEO Optimizer</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "register" && (
              <div>
                <Label htmlFor="name">Nom</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading}>
              {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer le compte"}
            </Button>

            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {mode === "login" ? "Pas encore de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
