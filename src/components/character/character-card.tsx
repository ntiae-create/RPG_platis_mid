import { useState } from "react";
import { AffinityIcon } from "./affinity-icon";
import { StatBar } from "./stat-bar";
import { AFFINITY_BY_ID } from "@/data/affinities";
import { CLASS_BY_ID } from "@/data/classes";
import { RACE_BY_ID, TIER_LABEL } from "@/data/races";
import { BRASAO_LEVELS, STAT_LABELS, brasaoLevelFromXp } from "@/data/progression";
import type { Character, StatKey } from "@/data/types";
import { finalStats, skillSlots } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { getCardRarity } from "@/lib/card-rarity";

const ATTRS: StatKey[] = ["atk", "atkMgc", "def", "res", "agi", "int"];

export function CharacterCard({
  character,
  compact = false,
  onImageClick,
}: {
  character: Character;
  compact?: boolean;
  onImageClick?: () => void;
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  const race = RACE_BY_ID[character.raceId];
  const cls = CLASS_BY_ID[character.classId];
  const aff = AFFINITY_BY_ID[character.affinityId];
  const stats = finalStats(character);
  const brasao = brasaoLevelFromXp(character.brasaoXp);
  const nextBrasao = BRASAO_LEVELS[Math.min(8, brasao.level + 1)];
  const slots = skillSlots(character.brasaoXp);
  const xpNeed = character.level * 100;
  const cardRarity = getCardRarity(character.level, character.raceId, character.isMaster);

  // Retrato oficial da raça de acordo com o gênero escolhido.
  const racePortrait =
    race?.portraits?.[character.gender] ??
    race?.portrait ??
    "/portraits/humano.jpg";

  return (
    <article
      className={cn(
        "character-card-shell",
        isFlipped ? "character-card-show-back" : "character-card-show-front",
        "aff-card aff-" + character.affinityId,
        "card-rarity-" + cardRarity.toLowerCase(),
        "race-" + character.raceId,
        character.isMaster ? "master-card" : "",
        "rounded-xl p-3 text-ink",
        compact ? "p-2" : "p-3",
      )}
    >
      <button type="button" onClick={() => setIsFlipped((value) => !value)} className="absolute top-2 right-2 z-30 rounded-full bg-bg/80 px-3 py-1.5 text-xs text-ink shadow-lg backdrop-blur-sm" aria-label={isFlipped ? "Voltar para frente" : "Virar card"}>{isFlipped ? "↩ Voltar" : "↻ Virar"}</button>
      {character.isMaster && (cardRarity === "UR_MAX" || cardRarity === "LR" || cardRarity === "LR_EXTRA") && (
        <div className="master-rarity-emblem" aria-label={cardRarity}>
          ✦
        </div>
      )}
      {character.raceId === "kitsune" && cardRarity === "LR_EXTRA" && (
        <div className="kitsune-nine-tails" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, index) => (
            <span key={index} />
          ))}
        </div>
      )}
      {character.raceId === "doppelganger" && cardRarity === "LR_EXTRA" && (
        <div className="doppelganger-mirror" aria-hidden="true">
          <span />
        </div>
      )}
      <div
        className={cn(
          "relative z-10 grid gap-3",
          compact ? "grid-cols-1" : "grid-cols-1",
        )}
      >
        <button
          type="button"
          onClick={onImageClick}
          className="relative aspect-[2/3] w-full overflow-hidden rounded-lg"
        >
          <img
            src={character.image?.trim() || racePortrait}
            alt={`${character.name} — ${race?.name ?? "Raça"} ${character.gender}`}
            className="size-full object-contain"
            crossOrigin="anonymous"
          />

          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-bg/70 px-2 py-1 text-[11px] tracking-wide backdrop-blur-sm">
            <AffinityIcon
              id={character.affinityId}
              className="size-3.5"
            />
            {aff?.name}
          </span>

          <span className="absolute right-2 bottom-2 rounded-full bg-bg/70 px-2 py-1 font-display text-lg leading-none backdrop-blur-sm">
            {character.level}
          </span>
        </button>

        <div>
          <h2 className="font-display text-2xl leading-none">
            {character.name}
          </h2>

          <p className="mt-1 text-xs text-muted">
            {race?.name} · {cls?.name} · {TIER_LABEL[race?.tier ?? "basic"]}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatBar
            label="HP"
            value={character.current.hp}
            max={stats.hp}
            tone="hp"
          />

          <StatBar
            label="MP"
            value={character.current.mp}
            max={stats.mp}
            tone="mp"
          />

          <StatBar
            label="EST"
            value={character.current.est}
            max={stats.est}
            tone="est"
          />

          <StatBar
            label="Sanidade"
            value={character.current.san}
            max={stats.san}
            tone="san"
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {ATTRS.map((k) => {
            const bonus = character.allocated[k] ?? 0;

            return (
              <div
                key={k}
                className={cn("passive-affinity-card", "aff-" + character.affinityId, "rounded-md bg-bg/35 px-2 py-1.5")}
              >
                <div className="text-[10px] tracking-wide text-muted">
                  {STAT_LABELS[k]}
                </div>

                <div className="tabular text-sm font-medium">
                  {stats[k]}

                  {bonus > 0 && (
                    <span className="ml-1 text-[10px] text-est">
                      +{bonus}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!compact && (
          <>
            <div className="space-y-1.5">
              <p className="text-[10px] tracking-wide text-muted uppercase">
                Habilidades · {slots} slots
              </p>

              {character.skills.slice(0, slots).map((sk) => (
                <div
                  key={sk.id}
                  className={cn("skill-affinity-card", "skill-affinity-" + sk.affinity, "skill-level-" + (sk.slot + 1), "flex items-center justify-between gap-2 rounded-md bg-bg/35 px-2 py-1.5")}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm">
                      {sk.name || "Slot vazio"}
                    </div>

                    <div className="truncate text-[11px] text-muted">
                      {sk.type} · MP {sk.cost.mp} · EST {sk.cost.est}
                    </div>
                  </div>

                  <StatusChip status={sk.status} />
                </div>
              ))}
            </div>

            
            {isFlipped && (
              <div className="character-card-back space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] tracking-wide text-muted uppercase">
                    Detalhes do personagem
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsFlipped(false)}
                    className="rounded-full bg-bg/80 px-3 py-1.5 text-xs text-ink shadow-lg"
                  >
                    ↩ Voltar
                  </button>
                </div>

<div className="space-y-1.5">
              <p className="text-[10px] tracking-wide text-muted uppercase">
                Passivas
              </p>

              <Passive
                title={cls?.passive.name ?? "Classe"}
                body={cls?.passive.description ?? ""}
                tag="Classe"
              />

              <Passive
                title={race?.passive.name ?? "Raça"}
                body={race?.passive.description ?? ""}
                tag="Raça"
                stacks={
                  character.raceId === "vampiro"
                    ? 3
                    : character.raceId === "dragonoide"
                      ? 3
                      : character.raceId === "kitsune"
                        ? 3
                        : undefined
                }
              />

              {race?.extraPassives?.map((passive, index) => (
                <Passive
                  key={`${race.id}-extra-${index}`}
                  title={passive.name}
                  body={passive.description}
                  tag="Raça · Extra"
                />
              ))}

              <Passive
                title={character.personalPassive.name}
                body={character.personalPassive.description}
                tag="Personagem"
                stacks={character.personalPassive.stacks || undefined}
              />
            </div>

                          </div>
            )}

<div className="rounded-md bg-bg/35 px-2 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">
                  Brasão {brasao.name}
                </span>

                <span className="tabular">
                  {character.brasaoXp.toLocaleString("pt-BR")} XP
                </span>
              </div>

              <div className="bar-track mt-1.5">
                <div
                  className="bar-fill bg-accent/80"
                  style={{
                    width: `${
                      brasao.level >= 8
                        ? 100
                        : Math.min(
                            100,
                            (character.brasaoXp / nextBrasao.xp) * 100,
                          )
                    }%`,
                  }}
                />
              </div>

              <p className="mt-1 text-[11px] text-muted">
                {brasao.effect}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-muted">
              <span>
                XP personagem{" "}
                <span className="tabular text-ink">
                  {character.xp}/{xpNeed}
                </span>
              </span>

              <span>
                Pontos{" "}
                <span className="tabular text-ink">
                  {character.attrPoints} attr · {character.poolPoints} pool
                </span>
              </span>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function Passive({
  title,
  body,
  tag,
  stacks,
}: {
  title: string;
  body: string;
  tag: string;
  stacks?: number;
}) {
  return (
    <div className="rounded-md bg-bg/35 px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{title}</span>

        <span className="shrink-0 text-[10px] tracking-wide text-faint uppercase">
          {tag}
        </span>
      </div>

      <div className="mt-0.5 max-h-28 overflow-y-auto pr-1">
        <p className="text-[11px] leading-snug text-muted">
          {body}
        </p>
      </div>

      {typeof stacks === "number" && (
        <div className="mt-1.5 flex gap-1">
          {Array.from({ length: stacks }).map((_, i) => (
            <span
              key={i}
              className="size-2 rounded-full bg-accent/70"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "Rascunho",
    pending: "Pendente",
    approved: "Aprovada",
    rejected: "Recusada",
  };

  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] tracking-wide",
        status === "approved" && "bg-san/20 text-san",
        status === "pending" && "bg-est/20 text-est",
        status === "rejected" && "bg-hp/20 text-hp",
        status === "draft" && "bg-raised text-muted",
      )}
    >
      {map[status] ?? status}
    </span>
  );
}
