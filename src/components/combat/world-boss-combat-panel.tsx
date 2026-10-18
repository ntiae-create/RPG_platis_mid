import { useState } from "react";
import { CharacterCard } from "@/components/character/character-card";
import { WORLD_BOSS_DETAILS } from "@/data/world";
import { Button } from "@/components/ui/button";
import { usePlatis } from "@/lib/store";
import { WorldBossCard } from "./world-boss-card";

export function WorldBossCombatPanel() {
  const worldBossCombat = usePlatis((s) => s.worldBossCombat);
  const characters = usePlatis((s) => s.characters);
  const slots = usePlatis((s) => s.slots);
  const worldBossAttack = usePlatis((s) => s.worldBossAttack);
  const role = usePlatis((s) => s.role);
  const worldBossMasterAction = usePlatis((s) => s.worldBossMasterAction);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("");

  if (!worldBossCombat) return null;

  const players = slots
    .map((id) => (id ? characters[id] : null))
    .filter(Boolean);
  const alivePlayers = players.filter((player) => player && player.current.hp > 0);
  const boss = WORLD_BOSS_DETAILS.find((item) => item.id === worldBossCombat.bossId);
  const bossTurn = worldBossCombat.turnOrder[worldBossCombat.turnIndex] === "world-boss";
  const availableSkills = (boss?.skills ?? []).filter((skill) =>
    !skill.ultimate &&
    (!skill.unlockLevel || skill.unlockLevel <= worldBossCombat.level) &&
    (worldBossCombat.cooldowns.find((cd) => cd.skillName === skill.name)?.remaining ?? 0) <= 0
  );
  const targetId = alivePlayers.some((player) => player?.id === selectedTarget)
    ? selectedTarget
    : alivePlayers[0]?.id ?? "";

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
              {players.map((player) => {
                if (!player) return null;

                const isCurrentTurn =
                  worldBossCombat.turnOrder[worldBossCombat.turnIndex] ===
                  player.id;

                return (
                  <div key={player.id} className="space-y-2">
                    <CharacterCard
                      character={player}
                      compact
                    />

                    {isCurrentTurn && (
                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => worldBossAttack(player.id)}
                      >
                        ⚔ Atacar
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-lg">World Boss</h3>

            <WorldBossCard
              bossId={worldBossCombat.bossId}
              level={worldBossCombat.level}
            />

            {role === "mestre" && bossTurn && (
              <div className="panel space-y-3 p-3">
                <h4 className="font-display text-lg">Ação do Mestre</h4>

                <label className="block space-y-1 text-sm">
                  <span>Habilidade</span>
                  <select
                    className="w-full rounded-md border border-border bg-bg p-2"
                    value={selectedSkill}
                    onChange={(event) => setSelectedSkill(event.target.value)}
                  >
                    <option value="">Ataque básico</option>
                    {availableSkills.map((skill) => (
                      <option key={skill.name} value={skill.name}>
                        {skill.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1 text-sm">
                  <span>Alvo</span>
                  <select
                    className="w-full rounded-md border border-border bg-bg p-2"
                    value={targetId}
                    onChange={(event) => setSelectedTarget(event.target.value)}
                  >
                    {alivePlayers.map((player) => player && (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </label>

                <Button
                  type="button"
                  className="w-full"
                  disabled={!targetId}
                  onClick={() => worldBossMasterAction(selectedSkill || null, targetId)}
                >
                  Executar ação do Boss
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
