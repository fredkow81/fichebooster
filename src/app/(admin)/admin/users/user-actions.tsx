"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export interface UserActionsProps {
  userId: string;
  currentRole: "USER" | "ADMIN";
  currentPlanId: string | null;
  plans: { id: string; name: string }[];
}

export function UserActions({ userId, currentRole, currentPlanId, plans }: UserActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: "Utilisateur mis à jour", variant: "success" });
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: "Échec de la mise à jour", description: data.error, variant: "error" });
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={currentPlanId ?? undefined} onValueChange={(planId) => patch({ planId })} disabled={loading}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder="Changer plan" />
        </SelectTrigger>
        <SelectContent>
          {plans.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={() => patch({ role: currentRole === "ADMIN" ? "USER" : "ADMIN" })}
      >
        {currentRole === "ADMIN" ? "Retirer admin" : "Rendre admin"}
      </Button>
    </div>
  );
}
