import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-4">
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <p className="text-sm text-muted-foreground">Cette ressource n'existe pas ou n'est plus disponible.</p>
      <Button asChild>
        <Link href="/dashboard">Retour au dashboard</Link>
      </Button>
    </div>
  );
}
