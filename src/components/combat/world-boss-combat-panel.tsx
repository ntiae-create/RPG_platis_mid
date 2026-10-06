import { CharacterCard } from "@/components/character/character-card";
import { usePlatis } from "@/lib/store";
import { WorldBossCard } from "./world-boss-card";

export function WorldBossCombatPanel() {
  const worldBossCombat = usePlatis((s) => s.worldBossCombat);
  const characters = usePlatis((s) => s.characters);
  const slots = usePlatis((s) => s.slots);

  if (!worldBossCombat) return null;

  const players = slots
    .map((id) => (id ? characters[id] : null))
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <div className="mb-4">
          <h2 className="font-display text-2xl">Combate · World Boss</h2>
          <p className="text-xs text-muted">
            Combate especial entre os jogadores e o Guardião do Brasão.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
          <div className="space-y-3">
            <h3 className="font-display text-lg">Jogadores</h3>

            <div className="grid gap-3 sm:grid-cols-2">
              {players.map((player) => (
                <CharacterCard
                  key={player!.id}
                  character={player!}
                  compact
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-lg">World Boss</h3>

            <WorldBossCard
              bossId={worldBossCombat.bossId}
              level={worldBossCombat.level}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
