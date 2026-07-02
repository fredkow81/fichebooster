"use client";

import { useRouter } from "next/navigation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export interface StoreOption {
  id: string;
  shopDomain: string;
}

export function StoreSelector({
  stores,
  value,
  basePath,
}: {
  stores: StoreOption[];
  value: string;
  basePath: string;
}) {
  const router = useRouter();

  if (stores.length === 0) return null;

  return (
    <Select value={value} onValueChange={(v) => router.push(`${basePath}?storeId=${v}`)}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Sélectionner une boutique" />
      </SelectTrigger>
      <SelectContent>
        {stores.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.shopDomain}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
