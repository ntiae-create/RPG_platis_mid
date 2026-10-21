import { cn } from "@/lib/utils";
import type { PassiveVisual } from "@/lib/passives";

/**
 * Indicadores de passivas ligados ao estado real do combate.
 * Não usa valores simulados — apenas o que listPassiveVisuals / motor devolve.
 */
export function PassiveIndicators({
  items,
  className,
}: {
  items: PassiveVisual[];
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {items.map((p) => (
        <div
          key={p.id}
          className={cn(
            "rounded-md border px-2.5 py-1.5 text-xs",
            p.active
              ? "border-accent/40 bg-accent/10 text-ink"
              : "border-line bg-bg/40 text-muted",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-ink">
              {p.name}
              <span className="ml-1.5 text-[10px] uppercase tracking-wide text-muted">
                {p.origin === "race" ? "Raça" : p.origin === "class" ? "Classe" : "Personagem"}
              </span>
            </span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                p.active ? "bg-accent/20 text-accent" : "bg-raised text-muted",
              )}
            >
              {p.active ? "Ativa" : "Inativa"}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] leading-snug text-muted">{p.detail}</p>
          {(p.stacks != null || p.turnsRemaining != null) && (
            <p className="mt-0.5 tabular text-[11px] text-ink/80">
              {p.stacks != null && (
                <span>
                  Stacks {p.stacks}
                  {p.maxStacks != null ? `/${p.maxStacks}` : ""}
                </span>
              )}
              {p.stacks != null && p.turnsRemaining != null && " · "}
              {p.turnsRemaining != null && <span>{p.turnsRemaining} turnos</span>}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
