"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export interface PublishConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPublishing: boolean;
  handleChanged: boolean;
  oldHandle: string;
  newHandle: string;
  summary: { label: string; changed: boolean }[];
}

export function PublishConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  isPublishing,
  handleChanged,
  oldHandle,
  newHandle,
  summary,
}: PublishConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer la publication sur Shopify</DialogTitle>
          <DialogDescription>
            Cette action met à jour la fiche produit directement dans votre boutique Shopify.
          </DialogDescription>
        </DialogHeader>

        {handleChanged && (
          <div className="mb-4 flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">L'URL du produit va changer</p>
              <p className="text-xs mt-1">
                /products/{oldHandle} → /products/{newHandle}
              </p>
              <p className="text-xs mt-1">
                Pensez à mettre en place une redirection si cette page est déjà indexée ou partagée.
              </p>
            </div>
          </div>
        )}

        <ul className="flex flex-col gap-1.5 text-sm">
          {summary.map((s) => (
            <li key={s.label} className="flex items-center justify-between">
              <span>{s.label}</span>
              <span className={s.changed ? "text-success" : "text-muted-foreground"}>
                {s.changed ? "Modifié" : "Inchangé"}
              </span>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPublishing}>
            Annuler
          </Button>
          <Button onClick={onConfirm} disabled={isPublishing}>
            {isPublishing ? "Publication en cours..." : "Publier sur Shopify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
