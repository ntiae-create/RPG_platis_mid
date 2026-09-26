import { cn } from "@/lib/utils";

export function StatBar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "hp" | "mp" | "est" | "san";
}) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  const color = {
    hp: "bg-hp",
    mp: "bg-mp",
    est: "bg-est",
    san: "bg-san",
  }[tone];
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium tracking-wide text-muted">{label}</span>
        <span className="tabular text-ink">
          {Math.max(0, Math.round(value))}
          <span className="text-faint"> / {Math.round(max)}</span>
        </span>
      </div>
      <div className="bar-track">
        <div className={cn("bar-fill", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
