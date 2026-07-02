"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductImageGallery({ images }: { images: { url: string; altText: string | null }[] }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square w-full flex items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground">
        <ImageOff className="h-10 w-10" />
      </div>
    );
  }

  const current = images[active]!;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-secondary">
        <Image src={current.url} alt={current.altText ?? "Image produit"} fill className="object-cover" unoptimized />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2",
                i === active ? "border-primary" : "border-transparent",
              )}
            >
              <Image src={img.url} alt="" fill className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
