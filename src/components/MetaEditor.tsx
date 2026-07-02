"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { META_TITLE_MAX_LENGTH, META_DESCRIPTION_MAX_LENGTH } from "@/lib/seo/validators";

export interface MetaEditorProps {
  metaTitle: string;
  metaDescription: string;
  onChangeMetaTitle: (value: string) => void;
  onChangeMetaDescription: (value: string) => void;
}

function CharCounter({ current, max }: { current: number; max: number }) {
  return (
    <span className={cn("text-xs", current > max ? "text-destructive" : "text-muted-foreground")}>
      {current}/{max}
    </span>
  );
}

export function MetaEditor({
  metaTitle,
  metaDescription,
  onChangeMetaTitle,
  onChangeMetaDescription,
}: MetaEditorProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="meta-title">Meta title</Label>
          <CharCounter current={metaTitle.length} max={META_TITLE_MAX_LENGTH} />
        </div>
        <Input id="meta-title" value={metaTitle} onChange={(e) => onChangeMetaTitle(e.target.value)} />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="meta-description">Meta description</Label>
          <CharCounter current={metaDescription.length} max={META_DESCRIPTION_MAX_LENGTH} />
        </div>
        <Textarea
          id="meta-description"
          rows={3}
          value={metaDescription}
          onChange={(e) => onChangeMetaDescription(e.target.value)}
        />
      </div>

      <div className="rounded-md border border-border p-3 bg-secondary/40">
        <p className="text-xs text-muted-foreground mb-1">Aperçu Google</p>
        <p className="text-primary text-sm truncate">{metaTitle || "Meta title"}</p>
        <p className="text-success text-xs">boutique.myshopify.com</p>
        <p className="text-sm text-muted-foreground line-clamp-2">{metaDescription || "Meta description"}</p>
      </div>
    </div>
  );
}
