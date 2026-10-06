import { StatBar } from "@/components/character/stat-bar";
import { BOSSES, WORLD_BOSS_DETAILS } from "@/data/world";
import { cn } from "@/lib/utils";

export function WorldBossCard({
  bossId,
  level,
  compact = false,
}: {
  bossId: string;
  level: number;
  compact?: boolean;
}) {
  const boss = WORLD_BOSS_DETAILS.find((item) => item.id === bossId);
  const bossBase = BOSSES.find((item) => item.id === bossId);

  if (!boss || !bossBase) return null;

  const bossLevel =
    boss.levels.find((entry) => entry.level === level) ??
    boss.levels[boss.levels.length - 1];

  if (!bossLevel) return null;

  const stats = bossLevel.stats;

  return (
    <article
      className={cn(
        "character-card-shell aff-card rounded-xl p-3 text-ink",
        "card-rarity-ur_max",
        compact ? "p-2" : "p-3",
      )}
    >
      <div className="relative z-10 grid gap-3">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg">
          {boss.image ? (
            <img
              src={boss.image}
              alt={`${bossBase.name} — World Boss`}
              className="size-full object-contain"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-bg/40">
              <span className="font-display text-2xl">{bossBase.name}</span>
            </div>
          )}

          <span className="absolute top-2 left-2 rounded-full bg-bg/70 px-2 py-1 text-[11px] tracking-wide backdrop-blur-sm">
            WORLD BOSS
          </span>

          <span className="absolute right-2 bottom-2 rounded-full bg-bg/70 px-2 py-1 font-display text-lg leading-none backdrop-blur-sm">
            {bossLevel.level}
          </span>
        </div>

        <div>
          <h2 className="font-display text-2xl leading-none">
            {bossBase.name}
          </h2>

          <p className="mt-1 text-xs text-muted">
            {boss.creatureType} · Nível {bossLevel.level}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatBar
            label="HP"
            value={stats.hp}
            max={stats.hp}
            tone="hp"
          />

          <StatBar
            label="MP"
            value={stats.mp}
            max={stats.mp}
            tone="mp"
          />

          <StatBar
            label="EST"
            value={stats.est}
            max={stats.est}
            tone="est"
          />

          <StatBar
            label="Sanidade"
            value={stats.san}
            max={stats.san}
            tone="san"
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            ["ATK", stats.atk],
            ["ATK MGC", stats.atkMgc],
            ["DEF", stats.def],
            ["RES", stats.res],
            ["AGI", stats.agi],
            ["INT", stats.int],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-md bg-bg/35 px-2 py-1.5"
            >
              <div className="text-[10px] tracking-wide text-muted">
                {label}
              </div>
              <div className="tabular text-sm font-medium">
                {value}
              </div>
            </div>
          ))}
        </div>

        {!compact && (
          <>
            <div className="space-y-1.5">
              <p className="text-[10px] tracking-wide text-muted uppercase">
                Passivas
              </p>

              {boss.passives.map((passive) => (
                <div
                  key={passive.name}
                  className="rounded-md bg-bg/35 px-2 py-1.5"
                >
                  <div className="text-sm font-medium">
                    {passive.name}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted">
                    {passive.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] tracking-wide text-muted uppercase">
                Habilidades
              </p>

              {boss.skills.map((skill) => (
                <div
                  key={skill.name}
                  className="rounded-md bg-bg/35 px-2 py-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {skill.name}
                    </span>

                    {skill.ultimate && (
                      <span className="text-[10px] tracking-wide text-est uppercase">
                        Ultimate
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-[11px] leading-snug text-muted">
                    {skill.description}
                  </p>

                  {skill.unlockLevel && (
                    <p className="mt-1 text-[10px] text-faint">
                      Desbloqueia no nível {skill.unlockLevel}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-md bg-bg/35 px-2 py-2">
              <p className="text-[10px] tracking-wide text-muted uppercase">
                Mecânica Especial
              </p>

              <p className="mt-1 text-[11px] leading-snug text-muted">
                {boss.specialMechanic}
              </p>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
