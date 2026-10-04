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
  const [selectedLevel, setSelectedLevel] = useState(boss.levelStart);

  const currentLevel = selectedLevel;
  const levelData = detail?.levels.find((level) => level.level === currentLevel);
  const unlockedSkills = detail?.skills.filter(
    (skill) => skill.unlockLevel === undefined || currentLevel >= skill.unlockLevel,
  ) ?? [];

  return (
    <button
      type="button"
      className="w-full text-left [perspective:1000px]"
      onClick={() => setFlipped((value) => !value)}
      aria-label={`Abrir carta de ${boss.name}`}
    >
      <div
        className={[
          "world-boss-card relative aspect-[2/3] w-full overflow-hidden rounded-xl transition-transform duration-700 [transform-style:preserve-3d]",
          flipped ? "[transform:rotateY(180deg)]" : "",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-xl">
          <div className="world-boss-wind-glow absolute inset-[-20%] animate-pulse" />
          <div className="world-boss-wind-line world-boss-wind-line-1 absolute left-[-20%] animate-[worldBossWind_5s_linear_infinite] top-[20%] h-px w-[140%]" />
          <div className="world-boss-wind-line world-boss-wind-line-2 absolute left-[-20%] animate-[worldBossWind_7s_linear_infinite_reverse] top-[55%] h-px w-[140%]" />
          <div className="world-boss-wind-line world-boss-wind-line-3 absolute left-[-20%] animate-[worldBossWind_9s_linear_infinite] top-[78%] h-px w-[140%]" />
          <div className="absolute right-3 top-3 flex size-12 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-950/30 shadow-[0_0_18px_rgba(103,232,249,0.25)]">
            <svg
              viewBox="0 0 64 64"
              className="size-8 text-cyan-200 animate-[worldBossCrest_12s_linear_infinite]"
              aria-label="Brasão de Vento"
              role="img"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M32 8C24 17 15 20 8 18C14 27 21 30 30 29C20 35 14 42 13 51C22 47 29 42 34 34C35 45 40 52 49 56C50 46 46 37 38 31C47 32 54 29 58 22C48 23 40 20 32 8Z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M32 27L37 32L32 37L27 32L32 27Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className="absolute inset-0 rounded-xl border border-border bg-raised p-4 shadow-lg [backface-visibility:hidden]">
          <div className="flex h-full flex-col">
            <div className="flex-1 rounded-lg bg-background/40">
              {detail?.image ? (
                <img
                  src={detail.image}
                  alt={boss.name}
                  className="h-full min-h-[210px] w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[210px] items-center justify-center text-sm text-muted">
                  Imagem do Boss
                </div>
              )}
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

              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-muted">Brasão {boss.brasao}</p>
                {detail?.levels && detail.levels.length > 0 && (
                  <label className="flex items-center gap-1 text-xs text-muted">
                    <span>Nível</span>
                    <select
                      value={selectedLevel}
                      onChange={(event) => setSelectedLevel(Number(event.target.value))}
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
              <div className="mt-4 space-y-3 overflow-hidden text-xs">
                <div>
                  <p className="font-semibold">Passivas</p>
                  <ul className="mt-2 space-y-2">
                    {detail.passives.map((passive) => (
                      <li
                        key={passive.name}
                        className="rounded-md border border-border bg-background/40 p-2"
                      >
                        <p className="font-medium text-foreground">
                          ◈ {passive.name}
                        </p>
                        <p className="mt-1 text-muted">
                          {passive.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-semibold">Habilidades desbloqueadas</p>
                  <ul className="mt-1 space-y-2">
                    {unlockedSkills.map((skill) => (
                      <li key={skill.name} className="rounded-md bg-background/40 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">
                            {skill.ultimate ? "⭐ " : ""}
                            {skill.name}
                          </span>
                          {skill.unlockLevel !== undefined && (
                            <span className="text-[10px] text-muted">
                              Lv. {skill.unlockLevel}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-muted">{skill.description}</p>
                      </li>
                    ))}
                  </ul>
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
