import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Une erreur est survenue",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 py-12 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}
