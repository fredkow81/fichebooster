import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2 } from "lucide-react";

export interface InternalLink {
  type: string;
  targetUrl: string;
  anchorText: string;
  justification: string;
}

export function InternalLinksPreview({ links }: { links: InternalLink[] }) {
  if (links.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun lien interne généré pour l'instant.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maillage interne</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {links.map((link) => (
          <div key={link.type} className="flex gap-3 border-b border-border last:border-0 pb-3 last:pb-0">
            <Link2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">
                {link.type === "collection" ? "Lien vers la collection mère" : "Lien vers un produit similaire"}
              </p>
              <p className="text-sm font-medium">
                <span className="text-primary underline underline-offset-2">{link.anchorText}</span>{" "}
                <span className="text-muted-foreground">→ {link.targetUrl}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">{link.justification}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
