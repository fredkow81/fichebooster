"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function DisconnectStoreButton({ storeId }: { storeId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDisconnect() {
    if (!confirm("Déconnecter cette boutique ? Cette action est irréversible.")) return;
    setLoading(true);
    const res = await fetch(`/api/stores/${storeId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      toast({ title: "Boutique déconnectée", variant: "info" });
      router.push("/stores");
      router.refresh();
    } else {
      toast({ title: "Erreur lors de la déconnexion", variant: "error" });
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDisconnect} disabled={loading}>
      {loading ? "..." : "Déconnecter"}
    </Button>
  );
}
