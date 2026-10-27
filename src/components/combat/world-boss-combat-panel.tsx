import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WORLD_BOSS_DETAILS } from "@/data/world";
import { usePlatis } from "@/lib/store";
import { finalStats } from "@/lib/stats";
import { HatiSkollDuoHud } from "./hati-skoll-duo-hud";
import { WorldBossCard } from "./world-boss-card";

export function WorldBossCombatPanel() {
  const worldBossCombat = usePlatis((s) => s.worldBossCombat);
  const characters = usePlatis((s) => s.characters);
  const role = usePlatis((s) => s.role);
  const worldBossAttack = usePlatis((s) => s.worldBossAttack);
  const nextWorldBossTurn = usePlatis((s) => s.nextWorldBossTurn);
  const worldBossMasterAction = usePlatis((s) => s.worldBossMasterAction);

  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("");
  const [targetBrother, setTargetBrother] = useState<"hati" | "skoll">("hati");

  if (!worldBossCombat) return null;

  const isDuo =
    worldBossCombat.bossId === "hati-skoll" ||
    Boolean(worldBossCombat.hatiSkollMeta?.duoMode);

  const boss =
    WORLD_BOSS_DETAILS.find((item) => item.id === worldBossCombat.bossId) ||
    WORLD_BOSS_DETAILS.find((item) => item.id === "hati") ||
    WORLD_BOSS_DETAILS.find((item) => item.id === "skoll");

  const bossTurn =
    worldBossCombat.turnOrder[worldBossCombat.turnIndex] === "world-boss";

  let skillsForMaster = (boss?.skills ?? []).filter(
    (skill) =>
      (!skill.unlockLevel || skill.unlockLevel <= worldBossCombat.level) &&
      (worldBossCombat.cooldowns.find((cd) => cd.skillName === skill.name)
        ?.remaining ?? 0) <= 0,
  );

  if (isDuo) {
    const hati = WORLD_BOSS_DETAILS.find((b) => b.id === "hati");
    const skoll = WORLD_BOSS_DETAILS.find((b) => b.id === "skoll");
    const merged = [...(hati?.skills ?? []), ...(skoll?.skills ?? [])];
    const seen = new Set<string>();
    skillsForMaster = merged.filter((skill) => {
      if (seen.has(skill.name)) return false;
      seen.add(skill.name);
      return (
        (!skill.unlockLevel || skill.unlockLevel <= worldBossCombat.level) &&
        (worldBossCombat.cooldowns.find((cd) => cd.skillName === skill.name)
          ?.remaining ?? 0) <= 0
      );
    });
  }

  const alivePlayers = worldBossCombat.turnOrder
    .filter((id) => id !== "world-boss")
    .map((id) => characters[id])
    .filter((c) => c && c.current.hp > 0);

  const targetId = selectedTarget || alivePlayers[0]?.id || "";

  return (
    <div className="space-y-4">
      <div className="panel p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
              Combate
            </p>
            <h2 className="font-display text-2xl">
              {isDuo ? "Skoll & Hati" : boss?.creatureType || "World Boss"}
            </h2>
          </div>
          <div className="text-sm text-muted">
            Rodada {worldBossCombat.round} · Turno{" "}
            {worldBossCombat.turnOrder[worldBossCombat.turnIndex] ===
            "world-boss"
              ? "Boss"
              : characters[worldBossCombat.turnOrder[worldBossCombat.turnIndex]]
                  ?.name || "—"}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-display text-lg">Jogadores</h3>
          <div className="space-y-2">
            {alivePlayers.map((player) => {
              if (!player) return null;
              const stats = finalStats(player);
              const isTurn =
                worldBossCombat.turnOrder[worldBossCombat.turnIndex] ===
                player.id;
              return (
                <div
                  key={player.id}
                  className={`panel space-y-2 p-3 ${
                    isTurn ? "ring-1 ring-amber-400/50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg">{player.name}</span>
                    <span className="text-xs text-muted">
                      HP {player.current.hp}/{stats.hp}
                    </span>
                  </div>
                  {isTurn && role !== "mestre" && (
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => worldBossAttack(player.id)}
                    >
                      ⚔ Atacar
                      {isDuo
                        ? ` (${targetBrother === "hati" ? "Hati" : "Skoll"})`
                        : ""}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {!bossTurn && role !== "mestre" && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => nextWorldBossTurn()}
            >
              Passar turno
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-lg">World Boss</h3>

          {isDuo && worldBossCombat.hatiSkollMeta ? (
            <HatiSkollDuoHud
              meta={worldBossCombat.hatiSkollMeta}
              level={worldBossCombat.level}
              targetBrother={targetBrother}
              onSelectBrother={setTargetBrother}
            />
          ) : (
            <WorldBossCard
              bossId={worldBossCombat.bossId}
              level={worldBossCombat.level}
            />
          )}

          {role === "mestre" && bossTurn && (
            <div className="panel space-y-3 p-3">
              <h4 className="font-display text-lg">Ação do Mestre</h4>

              {isDuo && (
                <p className="text-xs text-muted">
                  Skills de Trevas = Hati; Luz = Skoll; Eclipse Final sinergiza
                  com o irmão vivo.
                </p>
              )}

              <label className="block space-y-1 text-sm">
                <span>Habilidade</span>
                <select
                  className="w-full rounded-md border border-border bg-bg p-2"
                  value={selectedSkill}
                  onChange={(event) => setSelectedSkill(event.target.value)}
                >
                  <option value="">Ataque básico</option>
                  {skillsForMaster.map((skill) => (
                    <option key={skill.name} value={skill.name}>
                      {skill.name}
                      {skill.unlockLevel ? ` (Lv.${skill.unlockLevel})` : ""}
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
                  {alivePlayers.map(
                    (player) =>
                      player && (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ),
                  )}
                </select>
              </label>

              <Button
                type="button"
                className="w-full"
                disabled={!targetId}
                onClick={() =>
                  worldBossMasterAction(selectedSkill || null, targetId)
                }
              >
                Executar ação do Boss
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
