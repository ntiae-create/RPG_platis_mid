import { StatBar } from "@/components/character/stat-bar";
import { cn } from "@/lib/utils";
import type { HatiSkollMeta } from "@/data/world-boss-kits";

type Props = {
  meta: HatiSkollMeta;
  level: number;
  /** irmão que o jogador mira ao atacar (duo) */
  targetBrother?: "hati" | "skoll";
  onSelectBrother?: (who: "hati" | "skoll") => void;
  className?: string;
};

function BrotherCard({
  name,
  affinity,
  vitals,
  active,
  selected,
  fallen,
  onSelect,
}: {
  name: string;
  affinity: string;
  vitals: HatiSkollMeta["hati"];
  active: boolean;
  selected: boolean;
  fallen: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={fallen || !onSelect}
      onClick={onSelect}
      className={cn(
        "rounded-xl border p-3 text-left transition",
        fallen
          ? "border-border/40 bg-bg/20 opacity-60"
          : selected
            ? "border-amber-400/80 bg-amber-500/10 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
            : "border-border bg-bg/30 hover:border-amber-400/40",
        active && !fallen && "ring-1 ring-violet-400/50",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{affinity}</p>
          <h4 className="font-display text-lg leading-none">{name}</h4>
        </div>
        <div className="flex flex-col items-end gap-1">
          {active && !fallen && (
            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-200">
              Agindo
            </span>
          )}
          {fallen && (
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-200">
              Caído
            </span>
          )}
          {selected && !fallen && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-100">
              Alvo
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <StatBar
          label="HP"
          value={fallen ? 0 : vitals.hp}
          max={Math.max(1, vitals.maxHp)}
          tone="hp"
        />
        <StatBar
          label="MP"
          value={fallen ? 0 : vitals.mp}
          max={Math.max(1, vitals.maxMp)}
          tone="mp"
        />
        <StatBar
          label="EST"
          value={fallen ? 0 : vitals.est}
          max={Math.max(1, vitals.maxEst)}
          tone="est"
        />
      </div>
    </button>
  );
}

export function HatiSkollDuoHud({
  meta,
  level,
  targetBrother = "hati",
  onSelectBrother,
  className,
}: Props) {
  const hatiFallen = !meta.hati.alive || meta.hati.hp <= 0;
  const skollFallen = !meta.skoll.alive || meta.skoll.hp <= 0;
  const totalHp =
    (hatiFallen ? 0 : meta.hati.hp) + (skollFallen ? 0 : meta.skoll.hp);
  const totalMax = meta.hati.maxHp + meta.skoll.maxHp;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-xl border border-border bg-bg/25 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
              World Boss · Duo
            </p>
            <h3 className="font-display text-xl">Skoll &amp; Hati</h3>
            <p className="text-xs text-muted">
              Irmãos Eternos · Nv.{level}
              {meta.survivorBonusApplied ? " · Bônus do sobrevivente ativo" : ""}
            </p>
          </div>
          {meta.brotherAlive && !hatiFallen && !skollFallen && (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] text-emerald-200">
              Sincronia ativa
            </span>
          )}
          {meta.survivorBonusApplied && (
            <span className="rounded-full bg-red-500/15 px-3 py-1 text-[11px] text-red-200">
              Irmão caído — sobrevivente fortalecido
            </span>
          )}
        </div>

        <div className="mt-3">
          <StatBar
            label="HP combinado"
            value={totalHp}
            max={Math.max(1, totalMax)}
            tone="hp"
          />
        </div>

        {meta.hatiBuffTurns > 0 && (
          <p className="mt-2 text-xs text-amber-200/90">
            Uivo Sagrado: Hati +{meta.hatiBuff} atributos ({meta.hatiBuffTurns} turno
            {meta.hatiBuffTurns > 1 ? "s" : ""})
          </p>
        )}
        {meta.bloodScentTurns > 0 && (
          <p className="mt-1 text-xs text-rose-200/90">
            Odor de Sangue: −{meta.bloodScentPenalty} ATK/ATK MGC/AGI (
            {meta.bloodScentTurns} turno{meta.bloodScentTurns > 1 ? "s" : ""})
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <BrotherCard
          name="Skoll"
          affinity="Luz"
          vitals={meta.skoll}
          active={meta.activeActor === "skoll"}
          selected={targetBrother === "skoll"}
          fallen={skollFallen}
          onSelect={onSelectBrother ? () => onSelectBrother("skoll") : undefined}
        />
        <BrotherCard
          name="Hati"
          affinity="Trevas"
          vitals={meta.hati}
          active={meta.activeActor === "hati"}
          selected={targetBrother === "hati"}
          fallen={hatiFallen}
          onSelect={onSelectBrother ? () => onSelectBrother("hati") : undefined}
        />
      </div>

      {onSelectBrother && (
        <p className="text-[11px] text-muted">
          Toque em um irmão vivo para mirar o próximo ataque nele.
        </p>
      )}
    </div>
  );
}
