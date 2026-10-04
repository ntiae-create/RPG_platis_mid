import { useState } from "react";
import { AffinityIcon } from "@/components/character/affinity-icon";
import { StatBar } from "@/components/character/stat-bar";
import { STAT_LABELS } from "@/data/progression";
import type { StatKey } from "@/data/types";
import type { WorldBoss, WorldBossDetail } from "@/data/world";
import { cn } from "@/lib/utils";

const ATTRS: StatKey[] = ["atk", "atkMgc", "def", "res", "agi", "int"];

type WorldBossCardProps = {
  boss: WorldBoss;
  detail?: WorldBossDetail;
};

export function WorldBossCard({ boss, detail }: WorldBossCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(boss.levelStart);

  const levelData = detail?.levels.find((level) => level.level === selectedLevel);
  const unlockedSkills =
    detail?.skills.filter(
      (skill) =>
        skill.unlockLevel === undefined || selectedLevel >= skill.unlockLevel,
    ) ?? [];

  const affinity =
    typeof boss.affinity === "string" ? boss.affinity : boss.affinity?.[0];

  return (
    <article
      className={cn(
        "character-card-shell aff-card rounded-xl p-3 text-ink",
        isFlipped ? "character-card-show-back" : "character-card-show-front",
        affinity ? `aff-${affinity}` : "",
      )}
    >
      <button
        type="button"
        onClick={() => setIsFlipped((value) => !value)}
        className="absolute right-2 top-2 z-30 rounded-full bg-bg/80 px-3 py-1.5 text-xs text-ink shadow-lg backdrop-blur-sm"
      >
        {isFlipped ? "↩ Voltar" : "↻ Virar"}
      </button>

      <div className="relative z-10 grid grid-cols-1 gap-3">
        <div>
          <div className="flex items-center justify-between gap-2 pr-20">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
                World Boss
              </p>
              <h2 className="font-display text-2xl leading-none">
                {boss.name}
              </h2>
            </div>

            {affinity && <AffinityIcon id={affinity} className="size-6" />}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-muted">
              Brasão {boss.brasao}
            </span>

            {detail?.levels && detail.levels.length > 0 && (
              <label className="flex items-center gap-1 text-xs text-muted">
                <span>Nível</span>
                <select
                  value={selectedLevel}
                  onChange={(event) =>
                    setSelectedLevel(Number(event.target.value))
                  }
                  onClick={(event) => event.stopPropagation()}
                  className="h-8 rounded-md bg-background px-2 text-xs text-foreground"
                >
                  {detail.levels.map((level) => (
                    <option key={level.level} value={level.level}>
                      {level.level}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
<div className="mt-3 relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-background/40">
            {detail?.image ? (
              <img
                src={detail.image}
                alt={boss.name}
                className="size-full object-contain"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-muted">
                Imagem do Boss
              </div>
            )}
          </div>

          {levelData && (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <StatBar
                  label="HP"
                  value={levelData.stats.hp}
                  max={levelData.stats.hp}
                  tone="hp"
                />
                <StatBar
                  label="MP"
                  value={levelData.stats.mp}
                  max={levelData.stats.mp}
                  tone="mp"
                />
                <StatBar
                  label="EST"
                  value={levelData.stats.est}
                  max={levelData.stats.est}
                  tone="est"
                />
                <StatBar
                  label="Sanidade"
                  value={levelData.stats.san}
                  max={levelData.stats.san}
                  tone="san"
                />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {ATTRS.map((key) => (
                  <div
                    key={key}
                    className="passive-affinity-card rounded-md bg-bg/35 px-2 py-1.5"
                  >
                    <div className="text-[10px] tracking-wide text-muted">
                      {STAT_LABELS[key]}
                    </div>
                    <div className="tabular text-sm font-medium">
                      {levelData.stats[key]}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="character-card-back space-y-4">
          <div className="pr-16">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
              World Boss
            </p>
            <h2 className="font-display text-2xl leading-none">
              {boss.name}
            </h2>
            <p className="mt-1 text-xs text-muted">
              Nível {selectedLevel} · {detail?.creatureType ?? "Besta"}
            </p>
          </div>

          {detail?.specialMechanic && (
            <section className="rounded-lg bg-bg/35 p-3">
              <h3 className="mb-1 text-sm font-bold">Mecânica Especial</h3>
              <p className="text-xs leading-relaxed text-muted">
                {detail.specialMechanic}
              </p>
            </section>
          )}

          <section className="space-y-2">
            <h3 className="text-sm font-bold">Passivas</h3>

            {(detail?.passives ?? []).map((passive) => (
              <div key={passive.name} className="rounded-lg bg-bg/35 p-3">
                <div className="text-sm font-semibold">{passive.name}</div>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {passive.description}
                </p>
              </div>
            ))}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold">Habilidades</h3>

            {unlockedSkills.map((skill) => (
              <div key={skill.name} className="rounded-lg bg-bg/35 p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold">{skill.name}</span>

                  {skill.ultimate && (
                    <span className="rounded-full bg-bg px-2 py-0.5 text-[10px] font-bold uppercase">
                      Ultimate
                    </span>
                  )}
                </div>

                {skill.unlockLevel !== undefined && (
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted">
                    Desbloqueia no nível {skill.unlockLevel}
                  </p>
                )}

                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {skill.description}
                </p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </article>
  );
}
