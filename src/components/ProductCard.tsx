import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageOff } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; variant: "secondary" | "success" | "warning" | "destructive" }> = {
  NOT_OPTIMIZED: { label: "Non optimisé", variant: "secondary" },
  DRAFT: { label: "Brouillon", variant: "secondary" },
  ANALYZING: { label: "Analyse en cours", variant: "warning" },
  READY_FOR_REVIEW: { label: "Optimisé", variant: "warning" },
  PUBLISHED: { label: "Publié", variant: "success" },
  ERROR: { label: "Erreur", variant: "destructive" },
};

export interface ProductCardProps {
  storeId: string;
  productId: string;
  title: string;
  imageUrl: string | null;
  collectionTitle: string | null;
  status: string;
}

export function ProductCard({ storeId, productId, title, imageUrl, collectionTitle, status }: ProductCardProps) {
  const statusInfo = STATUS_LABEL[status] ?? STATUS_LABEL.NOT_OPTIMIZED!;

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-secondary">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        <Badge variant={statusInfo.variant} className="absolute top-2 left-2">
          {statusInfo.label}
        </Badge>
      </div>
      <CardContent className="flex flex-col gap-2 p-4 flex-1">
        <p className="font-medium text-sm line-clamp-2">{title}</p>
        {collectionTitle && <p className="text-xs text-muted-foreground">{collectionTitle}</p>}
        <div className="mt-auto pt-2">
          <Button asChild size="sm" className="w-full">
            <Link href={`/products/${storeId}/${encodeURIComponent(productId)}`}>
              {status === "NOT_OPTIMIZED" ? "Optimiser la fiche" : "Voir le détail"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
