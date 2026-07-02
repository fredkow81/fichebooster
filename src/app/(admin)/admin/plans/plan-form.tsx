"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export interface PlanFormProps {
  mode: "create" | "edit";
  plan?: Plan;
}

export function PlanForm({ mode, plan }: PlanFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [key, setKey] = useState(plan?.key ?? "");
  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [priceEuros, setPriceEuros] = useState(plan ? (plan.priceCents / 100).toString() : "0");
  const [interval, setInterval] = useState<"month" | "year">((plan?.interval as "month" | "year") ?? "month");
  const [maxStores, setMaxStores] = useState(plan?.maxStores?.toString() ?? "");
  const [maxOptimizations, setMaxOptimizations] = useState(
    plan?.maxOptimizationsPerMonth?.toString() ?? "",
  );
  const [isDefault, setIsDefault] = useState(plan?.isDefault ?? false);
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload =
      mode === "create"
        ? {
            key,
            name,
            description: description || undefined,
            priceCents: Math.round(Number(priceEuros) * 100),
            currency: "eur",
            interval,
            maxStores: maxStores === "" ? null : Number(maxStores),
            maxOptimizationsPerMonth: maxOptimizations === "" ? null : Number(maxOptimizations),
            isDefault,
            isActive,
            sortOrder: 0,
          }
        : {
            name,
            description: description || undefined,
            maxStores: maxStores === "" ? null : Number(maxStores),
            maxOptimizationsPerMonth: maxOptimizations === "" ? null : Number(maxOptimizations),
            isDefault,
            isActive,
          };

    const url = mode === "create" ? "/api/admin/plans" : `/api/admin/plans/${plan!.id}`;
    const res = await fetch(url, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (res.ok) {
      toast({ title: mode === "create" ? "Plan créé" : "Plan mis à jour", variant: "success" });
      setOpen(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: "Échec de l'enregistrement", description: data.error, variant: "error" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant={mode === "create" ? "default" : "outline"} onClick={() => setOpen(true)}>
        {mode === "create" ? "Créer un plan" : "Modifier"}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nouveau plan" : `Modifier ${plan?.name}`}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Le produit et le prix Stripe correspondants sont créés automatiquement."
              : "Le prix ne peut plus être modifié une fois le plan créé (immuable côté Stripe)."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "create" && (
            <div>
              <Label htmlFor="key">Clé (identifiant unique)</Label>
              <Input
                id="key"
                placeholder="STARTER"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                required
              />
            </div>
          )}
          <div>
            <Label htmlFor="name">Nom</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {mode === "create" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="price">Prix (€)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={priceEuros}
                  onChange={(e) => setPriceEuros(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="interval">Intervalle</Label>
                <select
                  id="interval"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value as "month" | "year")}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="month">Mensuel</option>
                  <option value="year">Annuel</option>
                </select>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="maxStores">Boutiques max (vide = illimité)</Label>
              <Input
                id="maxStores"
                type="number"
                min={0}
                value={maxStores}
                onChange={(e) => setMaxStores(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="maxOpt">Optimisations/mois (vide = illimité)</Label>
              <Input
                id="maxOpt"
                type="number"
                min={0}
                value={maxOptimizations}
                onChange={(e) => setMaxOptimizations(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
              Plan par défaut
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Actif (visible sur /billing)
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
