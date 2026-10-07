import { cn } from "@/lib/utils";
import type { WorldBossEffect } from "@/lib/store";

export function WorldBossEffects({
  effects,
  targetId,
  className,
}: {
  effects: WorldBossEffect[];
  targetId?: string;
  className?: string;
}) {
  const visibleEffects = effects.filter(
    (effect) => !targetId || effect.targetId === targetId,
  );

  if (visibleEffects.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {visibleEffects.map((effect) => (
        <div
          key={effect.id}
          title={effect.name}
          className="inline-flex items-center gap-1 rounded-full bg-bg/70 px-2 py-1 text-[10px] shadow-sm backdrop-blur-sm"
        >
          <span className="max-w-[120px] truncate">{effect.name}</span>

          {effect.stacks > 0 && (
            <span className="rounded-full bg-ink/15 px-1.5 font-bold tabular">
              ×{effect.stacks}
            </span>
          )}

          {effect.duration !== null && (
            <span className="text-muted tabular">
              {effect.duration}t
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
