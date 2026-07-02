"use client";

import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

export interface VariantRow {
  id: string;
  originalName: string;
  recommendedName: string;
}

export interface VariantComparisonTableProps {
  variants: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
}

export function VariantComparisonTable({ variants, onChange }: VariantComparisonTableProps) {
  function updateName(id: string, value: string) {
    onChange(variants.map((v) => (v.id === id ? { ...v, recommendedName: value } : v)));
  }

  if (variants.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune variante sur ce produit.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="py-2 pr-2">Variante actuelle</th>
            <th className="py-2 px-2 w-8"></th>
            <th className="py-2 pl-2">Variante recommandée</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((v) => {
            const changed = v.originalName !== v.recommendedName;
            return (
              <tr key={v.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-2 text-muted-foreground">{v.originalName}</td>
                <td className="py-2 px-2 text-center text-muted-foreground">
                  <ArrowRight className="h-4 w-4 inline" />
                </td>
                <td className="py-2 pl-2">
                  <Input
                    value={v.recommendedName}
                    onChange={(e) => updateName(v.id, e.target.value)}
                    className={changed ? "border-primary" : undefined}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
