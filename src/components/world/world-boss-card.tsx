import { useState } from "react";
import type { WorldBoss, WorldBossDetail } from "@/data/world";
import { AffinityIcon } from "@/components/character/affinity-icon";
import type { AffinityId } from "@/data/types";

type WorldBossCardProps = {
  boss: WorldBoss;
  detail?: WorldBossDetail;
};

export function WorldBossCard({ boss, detail }: WorldBossCardProps) {
  const [flipped, setFlipped] = useState(false);

  const currentLevel = boss.levelStart;
  const levelData = detail?.levels.find((level) => level.level === currentLevel);

  return (
    <button
      type="button"
      className="w-full text-left [perspective:1000px]"
      onClick={() => setFlipped((value) => !value)}
      aria-label={`Abrir carta de ${boss.name}`}
    >
      <div
        className={[
          "relative min-h-[320px] w-full transition-transform duration-700 [transform-style:preserve-3d]",
          flipped ? "[transform:rotateY(180deg)]" : "",
        ].join(" ")}
      >
        <div className="absolute inset-0 rounded-xl border border-border bg-raised p-4 shadow-lg [backface-visibility:hidden]">
          <div className="flex h-full flex-col">
            <div className="flex-1 rounded-lg bg-background/40">
              <div className="flex h-full min-h-[210px] items-center justify-center text-sm text-muted">
                Imagem do Boss
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
                    World Boss
                  </p>
                  <h3 className="font-display text-xl">{boss.name}</h3>
                </div>

                {typeof boss.affinity === "string" && (
                  <AffinityIcon
                    id={boss.affinity as AffinityId}
                    className="size-6"
                  />
                )}
              </div>

              <p className="mt-1 text-xs text-muted">
                Brasão {boss.brasao} · Lv. {currentLevel}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 rounded-xl border border-border bg-raised p-4 shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
                  World Boss
                </p>
                <h3 className="font-display text-xl">{boss.name}</h3>
              </div>

              <span className="text-xs text-muted">Lv. {currentLevel}</span>
            </div>

            {levelData && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div>HP: {levelData.stats.hp}</div>
                <div>MP: {levelData.stats.mp}</div>
                <div>EST: {levelData.stats.est}</div>
                <div>ATK: {levelData.stats.atk}</div>
                <div>ATK MGC: {levelData.stats.atkMgc}</div>
                <div>DEF: {levelData.stats.def}</div>
                <div>RES: {levelData.stats.res}</div>
                <div>AGI: {levelData.stats.agi}</div>
                <div>INT: {levelData.stats.int}</div>
                <div>SAN: {levelData.stats.san}</div>
              </div>
            )}

            {detail && (
              <div className="mt-4 space-y-2 overflow-hidden text-xs">
                <div>
                  <p className="font-semibold">Passivas</p>
                  <p className="text-muted">
                    {detail.passives.length} passiva(s)
                  </p>
                </div>

                <div>
                  <p className="font-semibold">Habilidades</p>
                  <p className="text-muted">
                    {detail.skills.length} habilidade(s)
                  </p>
                </div>
              </div>
            )}

            <p className="mt-auto pt-4 text-center text-[10px] uppercase tracking-widest text-muted">
              Toque para virar
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
