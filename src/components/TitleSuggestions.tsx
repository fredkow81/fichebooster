"use client";

import { cn } from "@/lib/utils";
import { TITLE_MAX_LENGTH } from "@/lib/seo/validators";
import { Check } from "lucide-react";

export interface TitleOption {
  key: "seo" | "shopping" | "balanced";
  label: string;
  value: string;
}

export interface TitleSuggestionsProps {
  options: TitleOption[];
  selected: string;
  onSelect: (value: string) => void;
}

export function TitleSuggestions({ options, selected, onSelect }: TitleSuggestionsProps) {
  return (
    <div className="grid gap-2">
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        const overLimit = opt.value.length > TITLE_MAX_LENGTH;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={cn(
              "text-left rounded-md border p-3 transition-colors",
              isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-secondary",
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">{opt.label}</span>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs", overLimit ? "text-destructive" : "text-muted-foreground")}>
                  {opt.value.length}/{TITLE_MAX_LENGTH}
                </span>
                {isSelected && <Check className="h-4 w-4 text-primary" />}
              </div>
            </div>
            <p className="text-sm font-medium">{opt.value}</p>
          </button>
        );
      })}
    </div>
  );
}
