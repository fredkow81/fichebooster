import { cn } from "@/lib/utils";

export function UsageBar({ label, current, max }: { label: string; current: number; max: number | null }) {
  const percent = max === null ? 0 : Math.min(100, Math.round((current / Math.max(max, 1)) * 100));
  const nearLimit = max !== null && current >= max;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className={cn("text-xs", nearLimit ? "text-destructive" : "text-muted-foreground")}>
          {current} / {max ?? "∞"}
        </span>
      </div>
      {max !== null && (
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={cn("h-full rounded-full", nearLimit ? "bg-destructive" : "bg-primary")}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}
