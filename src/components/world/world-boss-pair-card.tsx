import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AffinityIcon } from "@/components/character/affinity-icon";
import { StatBar } from "@/components/character/stat-bar";
import { STAT_LABELS } from "@/data/progression";
import type { StatKey } from "@/data/types";
import type { WorldBoss, WorldBossDetail } from "@/data/world";
import { usePlatis } from "@/lib/store";
import { cn } from "@/lib/utils";

const ATTRS: StatKey[] = ["atk", "atkMgc", "def", "res", "agi", "int"];

type WorldBossPairCardProps = {
  skoll: WorldBoss;
  hati: WorldBoss;
  skollDetail?: WorldBossDetail;
  hatiDetail?: WorldBossDetail;
};

export function WorldBossPairCard({
  skoll,
  hati,
  skollDetail,
  hatiDetail,
}: WorldBossPairCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedBoss, setSelectedBoss] = useState<"skoll" | "hati">("skoll");
  const [selectedLevel, setSelectedLevel] = useState(skoll.levelStart);
  const startWorldBossCombat = usePlatis((s) => s.startWorldBossCombat);
  const role = usePlatis((s) => s.role);

  const boss = selectedBoss === "skoll" ? skoll : hati;
  const detail = selectedBoss === "skoll" ? skollDetail : hatiDetail;

  const levelData = detail?.levels.find(
    (level) => level.level === selectedLevel,
  );

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
        {isFlipped ? "↩ Voltar" : "↻ Detalhes"}
      </button>

      <div className="relative z-10 grid grid-cols-1 gap-3">
        <div className="space-y-3">
          <div className="pr-20">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
              World Boss · Boss Duplo
            </p>
            <h3 className="font-display text-xl">Skoll & Hati</h3>
            <p className="text-xs text-muted">Irmãos Eternos · Luz + Trevas</p>
            <p className="mt-1 text-[11px] text-emerald-200/90">
              Luta em duo: os dois no mesmo combate, HP separados, bônus ao cair
              um irmão.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="overflow-hidden rounded-lg bg-bg/30">
              <img
                src="/images/world-bosses/skoll.webp"
                alt="Skoll"
                className="aspect-[2/3] w-full object-contain"
                crossOrigin="anonymous"
              />
              <p className="p-1 text-center text-[11px]">Skoll · Luz</p>
            </div>
            <div className="overflow-hidden rounded-lg bg-bg/30">
              <img
                src="/images/world-bosses/hati.webp"
                alt="Hati"
                className="aspect-[2/3] w-full object-contain"
                crossOrigin="anonymous"
              />
              <p className="p-1 text-center text-[11px]">Hati · Trevas</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedBoss("skoll")}
              className={cn(
                "flex-1 rounded-md border px-2 py-1.5 text-xs",
                selectedBoss === "skoll" ? "bg-raised font-semibold" : "bg-bg/40",
              )}
            >
              Ficha Skoll
            </button>
            <button
              type="button"
              onClick={() => setSelectedBoss("hati")}
              className={cn(
                "flex-1 rounded-md border px-2 py-1.5 text-xs",
                selectedBoss === "hati" ? "bg-raised font-semibold" : "bg-bg/40",
              )}
            >
              Ficha Hati
            </button>
          </div>
        </div>

        {isFlipped && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {boss.progression.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSelectedLevel(level)}
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs",
                    selectedLevel === level
                      ? "bg-raised font-semibold"
                      : "bg-bg/40",
                  )}
                >
                  Lv.{level}
                </button>
              ))}
            </div>

            {levelData && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    HP: <strong>{levelData.stats.hp}</strong>
                  </div>
                  <div>
                    MP: <strong>{levelData.stats.mp}</strong>
                  </div>
                  <div>
                    EST: <strong>{levelData.stats.est}</strong>
                  </div>
                  <div>
                    SAN: <strong>{levelData.stats.san}</strong>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {ATTRS.map((key) => (
                    <div key={key} className="rounded-md bg-raised p-2">
                      <span className="text-muted">{STAT_LABELS[key]}</span>
                      <strong className="ml-1">{levelData.stats[key]}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail?.passives.map((passive) => (
              <div key={passive.name} className="rounded-lg bg-raised/60 p-3">
                <p className="text-xs font-semibold">{passive.name}</p>
                <p className="mt-1 text-[11px] text-muted">
                  {passive.description}
                </p>
              </div>
            ))}

            <div className="space-y-2">
              <p className="text-xs font-semibold">Habilidades</p>
              {unlockedSkills.map((skill) => (
                <div key={skill.name} className="rounded-lg bg-raised/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold">{skill.name}</span>
                    {skill.unlockLevel !== undefined && (
                      <span className="text-[10px] text-muted">
                        Lv.{skill.unlockLevel}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    {skill.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 mt-3 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {skoll.progression.map((level) => (
            <button
              key={`duo-${level}`}
              type="button"
              onClick={() => setSelectedLevel(level)}
              className={cn(
                "rounded-md border px-2 py-1 text-xs",
                selectedLevel === level ? "bg-raised font-semibold" : "bg-bg/40",
              )}
            >
              Duo Lv.{level}
            </button>
          ))}
        </div>
        <Button
          type="button"
          className="w-full"
          onClick={() => startWorldBossCombat("hati-skoll", selectedLevel)}
        >
          ⚔ Iniciar luta em duo (Skoll & Hati) · Lv.{selectedLevel}
        </Button>
        {role !== "mestre" && (
          <p className="text-[10px] text-muted">
            Recomendado pelo mestre. Players também podem iniciar se a mesa
            permitir.
          </p>
        )}
      </div>
    </article>
  );
}
