"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { countWords } from "@/lib/utils";
import { DESCRIPTION_MIN_WORDS } from "@/lib/seo/validators";
import { cn } from "@/lib/utils";

export interface DescriptionPreviewProps {
  html: string;
  onChange: (html: string) => void;
}

export function DescriptionPreview({ html, onChange }: DescriptionPreviewProps) {
  const [tab, setTab] = useState("preview");
  const words = countWords(html);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="preview">Aperçu</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>
        </Tabs>
        <span className={cn("text-xs", words < DESCRIPTION_MIN_WORDS ? "text-destructive" : "text-success")}>
          {words} mots (min. {DESCRIPTION_MIN_WORDS})
        </span>
      </div>

      {tab === "preview" ? (
        <div
          className="prose-shopify rounded-md border border-border p-4 max-h-[500px] overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <Textarea
          value={html}
          onChange={(e) => onChange(e.target.value)}
          rows={16}
          className="font-mono text-xs"
        />
      )}
    </div>
  );
}
