"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function ProductSearchInput({ defaultValue, storeId }: { defaultValue: string; storeId: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      router.push(`/products?storeId=${storeId}${value ? `&search=${encodeURIComponent(value)}` : ""}`);
    }
  }

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Rechercher un produit..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="pl-8 w-64"
      />
    </div>
  );
}
