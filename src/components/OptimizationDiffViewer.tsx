import { cn } from "@/lib/utils";

export interface DiffRow {
  label: string;
  before: string;
  after: string;
}

export function OptimizationDiffViewer({ rows }: { rows: DiffRow[] }) {
  return (
    <div className="flex flex-col divide-y divide-border rounded-md border border-border">
      {rows.map((row) => {
        const changed = row.before.trim() !== row.after.trim();
        return (
          <div key={row.label} className="grid grid-cols-1 md:grid-cols-[140px_1fr_1fr] gap-2 p-3">
            <span className="text-xs font-medium text-muted-foreground pt-1">{row.label}</span>
            <div className="text-sm text-muted-foreground line-through decoration-destructive/50">
              {row.before || <span className="italic">(vide)</span>}
            </div>
            <div className={cn("text-sm", changed ? "font-medium text-success" : "text-muted-foreground")}>
              {row.after || <span className="italic">(vide)</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
