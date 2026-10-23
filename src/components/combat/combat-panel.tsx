import { DiceTray } from "./dice-tray";
import { Button } from "@/components/ui/button";
import { usePlatis } from "@/lib/store";
import { CharacterCard } from "@/components/character/character-card";
import { WorldBossCard } from "./world-boss-card";
import { WorldBossCombatPanel } from "./world-boss-combat-panel";
import type { Character, CombatEnemy } from "@/data/types";
import { useState, useEffect, useCallback } from "react";
import { PassiveIndicators } from "./passive-indicators";
import { listPassiveVisuals } from "@/lib/passives";
import { finalStats } from "@/lib/stats";
import { getCharacterKit, characterBrasaoLevel } from "@/data/character-kits";

export function CombatPanel() {
  const [movingParticipantId, setMovingParticipantId] = useState<string | null>(null);
  const [selectedArena, setSelectedArena] = useState("basic_arena.jpg");
  const arenas = [
    ["basic_arena.jpg", "Arena clássica"],
    ["basic2_arena.jpg", "Arena clássica II"],
    ["break_arena.jpg", "Arena destruída"],
    ["circle_arena.jpg", "Arena circular"],
    ["earth_arena.jpg", "Terra"],
    ["fire_arena.jpg", "Vulcânica"],
    ["water_arena.jpg", "Aquática"],
    ["magic_arena.jpg", "Mágica"],
    ["fisic_arena.jpg", "Física"],
    ["forest_arena.jpg", "Floresta"],
    ["ruin_arena.jpg", "Ruínas"],
    ["sanctuary_arena.jpg", "Santuário"],
    ["roses_arena.jpg", "Rosas"],
    ["sund_arena.jpg", "Sund"],
    ["ammit_arena.jpg", "Domínio de Ammit"],
    ["camazotz_arena.jpg", "Domínio de Camazotz"],
    ["jormungandr_arena.jpg", "Domínio de Jörmungandr"],
    ["skoll_e_hati_arena.jpg", "Domínio de Skoll e Hati"],
    ["tsuchigumo_arena.jpg", "Domínio de Tsuchigumo"],
    ["wendigo_arena.jpg", "Domínio de Wendigo"],
  ] as const;
  const combatActive = usePlatis((s) => s.combatActive);
  const combatMode = usePlatis((s) => s.combatMode);
  const worldBossId = usePlatis((s) => s.worldBossId);
  const startCombat = usePlatis((s) => s.startCombat);
  const setCombatArena = usePlatis((s) => s.setCombatArena);
  const setWarriorStance = usePlatis((s) => s.setWarriorStance);
  const armCavaleiroInvestida = usePlatis((s) => s.armCavaleiroInvestida);
  const setGladiadorAdversary = usePlatis((s) => s.setGladiadorAdversary);
  const setArtificeProject = usePlatis((s) => s.setArtificeProject);
  const tryCronomanteRewind = usePlatis((s) => s.tryCronomanteRewind);
  const setPaladinoOath = usePlatis((s) => s.setPaladinoOath);
  const setDomadorBond = usePlatis((s) => s.setDomadorBond);
  const setMarioneteLink = usePlatis((s) => s.setMarioneteLink);
  const assimilateTarget = usePlatis((s) => s.assimilateTarget);
  const npcs = usePlatis((s) => s.npcs);
  const addNpcToCombat = usePlatis((s) => s.addNpcToCombat);
  const addNpcAsEnemy = usePlatis((s) => s.addNpcAsEnemy);
  const combatPassiveState = usePlatis((s) => s.combatPassiveState);
  const endCombat = usePlatis((s) => s.endCombat);
const nextTurn = usePlatis((s) => s.nextTurn);
  const clearCombatLog = usePlatis((s) => s.clearCombatLog);
  const characters = usePlatis((s) => s.characters);
  const combatEnemies = usePlatis((s) => s.combatEnemies);
  const combatNpcIds = usePlatis((s) => s.combatNpcIds);
  const combatParticipants = usePlatis((s) => s.combatParticipants);
  const combatPositions = usePlatis((s) => s.combatPositions);
  const moveCombatParticipant = usePlatis((s) => s.moveCombatParticipant);
  const slots = usePlatis((s) => s.slots);
  const attackerId = usePlatis((s) => s.attackerId);
  const defenderId = usePlatis((s) => s.defenderId);
  const select = usePlatis((s) => s.selectFighter);
  const rollCombat = usePlatis((s) => s.rollCombat);
  const attemptEscape = usePlatis((s) => s.attemptEscape);
  const rollLoose = usePlatis((s) => s.rollLoose);
  const last = usePlatis((s) => s.lastRoll);
  const log = usePlatis((s) => s.combatLog);
  const pending = usePlatis((s) => s.pendingCounter);
  const resolveCounter = usePlatis((s) => s.resolveCounter);
  const trap = usePlatis((s) => s.trap);
  const disarm = usePlatis((s) => s.disarmTrap);

  const moveArenaBy = useCallback((id: string, dx: number, dy: number) => {
    const state = usePlatis.getState();
    const position = state.combatPositions[id];
    if (!position) return;
    const x = position.x + dx;
    const y = position.y + dy;

    if (x < 0 || x > 19 || y < 0 || y > 14) {
      if (state.characters[id]) attemptEscape(id);
      return;
    }
    moveCombatParticipant(id, x, y);
  }, [attemptEscape, moveCombatParticipant]);

  useEffect(() => {
    if (!combatActive || combatMode === "world-boss") return;

    const onArenaKeyDown = (event: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(
        (event.target as HTMLElement)?.tagName
      )) return;

      const directions: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        KeyW: [0, -1],
        ArrowDown: [0, 1],
        KeyS: [0, 1],
        ArrowLeft: [-1, 0],
        KeyA: [-1, 0],
        ArrowRight: [1, 0],
        KeyD: [1, 0],
      };

      const direction = directions[event.code];
      if (!direction || !movingParticipantId) return;

      const position = usePlatis.getState().combatPositions[movingParticipantId];
      if (!position) return;

      event.preventDefault();
      moveArenaBy(movingParticipantId, direction[0], direction[1]);
    };

    window.addEventListener("keydown", onArenaKeyDown);
    return () => window.removeEventListener("keydown", onArenaKeyDown);
  }, [combatActive, combatMode, movingParticipantId, moveArenaBy]);

  const attacker = attackerId ? (characters[attackerId] ?? combatEnemies[attackerId] ?? null) : null;
  const defender = defenderId ? (characters[defenderId] ?? combatEnemies[defenderId] ?? null) : null;
  const attackerEnemy = attackerId ? combatEnemies[attackerId] ?? null : null;
  const defenderEnemy = defenderId ? combatEnemies[defenderId] ?? null : null;
  const roster: (Character | CombatEnemy)[] = [];
  for (const id of slots) {
    if (id && characters[id]) roster.push(characters[id]);
  }
  for (const enemy of Object.values(combatEnemies)) {
    roster.push(enemy);
  }

  if (combatMode === "world-boss") {
    return <WorldBossCombatPanel />;
  }

  return (
    <div className="grid gap-4 pb-28 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        {trap?.armed && (
          <div className="panel p-4">
            <h3 className="font-display text-xl">Armadilha</h3>
            <p className="text-sm text-muted">
              Click Timer Event na célula {trap.cell}. Toque antes do tempo acabar.
            </p>
            <Button className="mt-2" onClick={disarm}>
              Desarmar
            </Button>
          </div>
        )}

        <DiceTray last={last} onRoll={rollLoose} />

        {combatActive && (
          <div className="panel p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg">Arena · 16 × 12</h2>
                <p className="text-[10px] text-muted">
                  16 colunas de largura · 12 linhas de altura
                </p>
              </div>
              <span className="text-[10px] text-muted">
                {movingParticipantId
                  ? "Escolha uma direção"
                  : "Selecione um participante"}
              </span>
            </div>

            {usePlatis.getState().role === "mestre" && (
              <div className="mt-3">
                <label className="mb-1 block text-xs text-muted">Escolher arena</label>
                <select
                  className="h-10 w-full rounded-md border border-line bg-raised px-3 text-sm"
                  value={selectedArena}
                  onChange={(event) => { setSelectedArena(event.target.value); setCombatArena(event.target.value); }}
                >
                  {arenas.map(([file, label]) => (
                    <option key={file} value={file}>{label}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="mt-2 flex max-h-20 flex-wrap gap-1 overflow-y-auto">
              {Object.entries(combatPositions).map(([id]) => {
                const fighter = characters[id] ?? combatEnemies[id] ?? null;
                if (!fighter) return null;
                const selected = movingParticipantId === id;

                return (
                  <Button
                    key={id}
                    variant={selected ? "secondary" : "ghost"}
                    className="h-7 px-2 text-[10px]"
                    onClick={() => setMovingParticipantId(selected ? null : id)}
                  >
                    {combatEnemies[id] ? "E" : combatNpcIds.includes(id) ? "N" : "P"} · {fighter.name}
                  </Button>
                );
              })}
            </div>

            <div className="mx-auto mt-2 w-full max-w-[760px] overflow-hidden rounded-md border border-line">
              <div
                className="relative aspect-[4/3] w-full"
                style={{ backgroundColor: "#171717" }}
                onClick={(event) => {
                  if (!movingParticipantId) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  const x = Math.min(15, Math.floor(((event.clientX - rect.left) / rect.width) * 16));
                  const y = Math.min(11, Math.floor(((event.clientY - rect.top) / rect.height) * 12));
                  moveCombatParticipant(movingParticipantId, x, y);
                }}
              >
                <img
                  src={`/images/arenas/${selectedArena}`}
                  alt=""
                  className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
                  draggable={false}
                  onError={(event) => {
                    console.error("Falha ao carregar arena:", event.currentTarget.src);
                  }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-[1]"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(220,220,220,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(220,220,220,0.18) 1px, transparent 1px)",
                    backgroundSize: "6.25% 8.333333%",
                  }}
                />
                {[...new Set([...Object.keys(combatPositions), ...combatParticipants])].map((id) => {
                  const position = combatPositions[id] ?? {
                    x: combatEnemies[id] ? 14 : 1,
                    y: Math.min(11, 2 + combatParticipants.indexOf(id) * 2),
                  };
                  const fighter = characters[id] ?? combatEnemies[id] ?? null;
                  if (!fighter) return null;
                  const isEnemy = Boolean(combatEnemies[id]);

                  return (
                    <div
                      key={id}
                      className={`absolute z-10 flex h-[8.333333%] w-[6.25%] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded border-2 ${isEnemy ? "border-red-500 bg-red-950" : "border-sky-400 bg-sky-950"} ${movingParticipantId === id ? "ring-2 ring-yellow-300" : ""}`}
                      style={{
                        left: `${((position.x + 0.5) / 16) * 100}%`,
                        top: `${((position.y + 0.5) / 12) * 100}%`,
                      }}
                      title={fighter.name}
                    >
                      {fighter.image ? (
                        <img src={fighter.image} alt={fighter.name} className="h-full w-full object-cover" draggable={false} />
                      ) : (
                        <span className="text-[10px] font-bold text-white">{isEnemy ? "E" : combatNpcIds.includes(id) ? "N" : "P"}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 flex flex-col items-center gap-1">
              <Button
                size="icon"
                variant="secondary"
                disabled={!movingParticipantId}
                onClick={() => movingParticipantId && moveArenaBy(movingParticipantId, 0, -1)}
                aria-label="Mover para frente"
              >↑</Button>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  disabled={!movingParticipantId}
                  onClick={() => movingParticipantId && moveArenaBy(movingParticipantId, -1, 0)}
                  aria-label="Mover para esquerda"
                >←</Button>
      <Button
                  size="icon"
                  variant="secondary"
                  disabled={!movingParticipantId}
                  onClick={() => movingParticipantId && moveArenaBy(movingParticipantId, 1, 0)}
                  aria-label="Mover para direita"
                >→</Button>
              </div>
              <Button
                size="icon"
                variant="secondary"
                disabled={!movingParticipantId}
                onClick={() => movingParticipantId && moveArenaBy(movingParticipantId, 0, 1)}
                aria-label="Mover para trás"
              >↓</Button>
            </div>

            <div className="mt-2 flex justify-center gap-3 text-[9px] text-muted">
              <span>P = Jogador</span>
              <span>N = NPC aliado</span>
              <span>E = Inimigo</span>
            </div>
          </div>
        )}

        <div className="panel p-4">
          <h2 className="font-display text-2xl">Resolução D20</h2>
          <p className="text-xs text-muted">
            Atacante e defensor rolam D20. Acerto se o atacante supera o defensor. Empate: ATK vs DEF ou ATK
            MGC vs RES, depois RES, INT e EST. Critico 15-19 vezes 2, 20 vezes 3. Dano D[ATK] ou D[ATK MGC];
            habilidades ofensivas 2 + D[atributo]. Contra-ataque se o D20 do defensor for 17 ou mais e maior
            que o do atacante.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button disabled={combatActive} onClick={startCombat}>
              {combatActive ? "Combate em andamento" : "Iniciar combate"}
            </Button>
            {combatActive && (
              <Button variant="secondary" onClick={() => endCombat()}>
                Encerrar combate
              </Button>
            )}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <FighterPick
              label="Atacante"
              current={attackerId}
              roster={roster}
              onPick={(id) => select("attacker", id)}
            />
            <FighterPick
              label="Defensor"
              current={defenderId}
              roster={roster}
              onPick={(id) => select("defender", id)}
            />
          </div>
<div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={!combatActive}
              onClick={nextTurn}
            >
              Próximo Turno
            </Button>
            {attacker && "classId" in attacker && attacker.classId === "guerreiro" && (
              <div className="flex flex-wrap gap-1">
                {(["ofensiva", "defensiva", "mobilidade"] as const).map((st) => (
                  <Button key={st} size="sm" variant="secondary" type="button" onClick={() => setWarriorStance(attacker.id, st)}>
                    Postura {st}
                  </Button>
                ))}
              </div>
            )}
            {attacker && "raceId" in attacker && attacker.raceId === "doppelganger" && defender && (
              <Button size="sm" variant="secondary" type="button" onClick={() => assimilateTarget(attacker.id, defender.id)}>
                Assimilar alvo
              </Button>
            )}
            {attacker && "classId" in attacker && attacker.classId === "cavaleiro" && (
              <Button size="sm" variant="secondary" type="button" disabled={!combatActive} onClick={() => armCavaleiroInvestida(attacker.id)}>
                Armar Investida
              </Button>
            )}
            {attacker && "classId" in attacker && attacker.classId === "gladiador" && defender && (
              <Button size="sm" variant="secondary" type="button" disabled={!combatActive} onClick={() => setGladiadorAdversary(attacker.id, defender.id)}>
                Marcar Adversário
              </Button>
            )}
            {attacker && "classId" in attacker && attacker.classId === "artifice" && (
              <div className="flex flex-wrap gap-1">
                {([1, 2, 3] as const).map((tier) => (
                  <Button key={tier} size="sm" variant="secondary" type="button" onClick={() => setArtificeProject(attacker.id, tier)}>
                    Projeto {tier}
                  </Button>
                ))}
              </div>
            )}
            {attacker && "classId" in attacker && attacker.classId === "cronomante" && defender && (
              <Button size="sm" variant="secondary" type="button" disabled={!combatActive} onClick={() => tryCronomanteRewind(attacker.id, defender.id)}>
                Retrocesso Temporal
              </Button>
            )}
            {attacker && "classId" in attacker && attacker.classId === "paladino" && defender && (
              <Button size="sm" variant="secondary" type="button" disabled={!combatActive} onClick={() => setPaladinoOath(attacker.id, defender.id)}>
                Juramento (alvo)
              </Button>
            )}
            {attacker && "classId" in attacker && attacker.classId === "domador" && defender && (
              <Button size="sm" variant="secondary" type="button" onClick={() => setDomadorBond(attacker.id, defender.id)}>
                Laço Bestial
              </Button>
            )}
            {attacker && "classId" in attacker && attacker.classId === "mestre-de-marionetes" && defender && (
              <Button size="sm" variant="secondary" type="button" onClick={() => setMarioneteLink(attacker.id, defender.id)}>
                Vincular Fio
              </Button>
            )}
            <Button disabled={!attacker || !defender} onClick={() => rollCombat("physical")}>
              Ataque físico
            </Button>
            <Button variant="secondary" disabled={!attacker || !defender} onClick={() => rollCombat("magical")}>
              Ataque mágico
            </Button>
            {attacker && "name" in attacker && getCharacterKit(attacker)?.skills
              .filter((sk) => !sk.brasaoLevel || characterBrasaoLevel(attacker) >= sk.brasaoLevel)
              .map((sk) => (
                <Button
                  key={sk.id}
                  variant="outline"
                  disabled={!combatActive}
                  onClick={() => rollCombat(sk.type === "ataque-magico" ? "magical" : "physical", "kit:"+sk.id)}
                >
                  {sk.name}
                </Button>
              ))}
            {attacker?.skills
              .filter((sk) => sk.status === "approved" && sk.name)
              .sort((a, b) => a.slot - b.slot)
              .map((sk) => (
                <Button
                  key={sk.id}
                  variant="outline"
                  disabled={!defender}
                  onClick={() =>
                    rollCombat(
                      sk.type === "ataque-magico" ? "magical" : "physical",
                      sk.id,
                    )
                  }
                >
                  {sk.name}
                </Button>
              ))}
          </div>
          {attacker && "raceId" in attacker && combatActive && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-medium text-muted">Passivas (atacante)</p>
              <PassiveIndicators
                items={listPassiveVisuals(attacker, finalStats(attacker).hp, combatPassiveState)}
              />
            </div>
          )}
          {defender && "raceId" in defender && combatActive && (
            <div className="mt-2">
              <p className="mb-1 text-xs font-medium text-muted">Passivas (defensor)</p>
              <PassiveIndicators
                items={listPassiveVisuals(defender as Character, finalStats(defender as Character).hp, combatPassiveState)}
              />
            </div>
          )}

          <div className="mt-3 rounded-md border border-line bg-raised/40 p-3">
            <p className="mb-2 text-xs font-medium text-muted">NPCs — entrar na batalha</p>
            {Object.keys(npcs).length === 0 ? (
              <p className="text-xs text-muted">Nenhum NPC criado. Publique um personagem como NPC ou crie no painel do mestre.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {Object.values(npcs).map((npc) => (
                  <li key={npc.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-ink">{npc.name} <span className="text-xs text-muted">Nv.{npc.level}</span></span>
                    <span className="flex gap-1">
                      <Button size="sm" variant="secondary" type="button" onClick={() => addNpcToCombat(npc.id)}>
                        Aliado
                      </Button>
                      <Button size="sm" variant="outline" type="button" onClick={() => addNpcAsEnemy(npc.id)}>
                        Inimigo
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {pending && (
                 <div className="mt-3 flex flex-wrap gap-2 rounded-md bg-raised p-3">
              <p className="w-full text-sm">Reação do defensor</p>
              <Button onClick={() => resolveCounter("attack")}>Contra-atacar (−3 EST)</Button>
              <Button variant="secondary" onClick={() => resolveCounter("defend")}>
                Esquivar / Defender
              </Button>
            </div>
          )}
        </div>

        <div className="panel max-h-72 overflow-auto p-4">
          <div className="mb-2 flex items-center justify-between gap-2"><h3 className="font-display text-xl">Log</h3><Button size="sm" variant="outline" onClick={clearCombatLog} disabled={log.length === 0}>Limpar Log</Button></div>
          {log.length === 0 && <p className="text-sm text-muted">Aguardando rolagem.</p>}
          <ul className="space-y-2">
            {log.map((e) => (
              <li key={e.id} className="text-sm">
                <span className="mr-2 text-[10px] font-semibold tracking-wide uppercase text-faint">{(e.kind === "hit" ? "DANO" : e.kind === "crit" ? "CRITICO" : e.kind === "heal" ? "CURA" : e.kind === "miss" ? "ERRO" : e.kind === "passive" ? "PASSIVA" : e.kind === "roll" ? "DADO" : e.kind === "system" ? "EFEITO" : e.kind)}</span>
                {e.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-3">
        {worldBossId && <WorldBossCard bossId={worldBossId} level={12} compact={false} />}
        {attacker && !attackerEnemy && <CharacterCard character={attacker} compact />}
        {attackerEnemy && (
          <div className="panel p-4">
            <p className="font-display text-xl">{attackerEnemy.name}</p>
            <p className="text-xs text-muted">
              {attackerEnemy.kind === "boss" ? "Boss" : "Monstro"} · Nv. {attackerEnemy.level}
            </p>
            <p className="mt-2 text-sm">HP: {attackerEnemy.current.hp} / {attackerEnemy.stats.hp}</p>
            <p className="text-sm">MP: {attackerEnemy.current.mp} / {attackerEnemy.stats.mp}</p>
            <p className="text-sm">EST: {attackerEnemy.current.est} / {attackerEnemy.stats.est}</p>
          </div>
        )}

        {defender && !defenderEnemy && <CharacterCard character={defender} compact />}
        {defenderEnemy && (
          <div className="panel p-4">
            <p className="font-display text-xl">{defenderEnemy.name}</p>
            <p className="text-xs text-muted">
              {defenderEnemy.kind === "boss" ? "Boss" : "Monstro"} · Nv. {defenderEnemy.level}
            </p>
            <p className="mt-2 text-sm">HP: {defenderEnemy.current.hp} / {defenderEnemy.stats.hp}</p>
            <p className="text-sm">MP: {defenderEnemy.current.mp} / {defenderEnemy.stats.mp}</p>
            <p className="text-sm">EST: {defenderEnemy.current.est} / {defenderEnemy.stats.est}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FighterPick({
  label,
  current,
  roster,
  onPick,
}: {
  label: string;
  current: string | null;
  roster: (Character | CombatEnemy)[];
  onPick: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] tracking-wide text-muted uppercase">{label}</p>
      <select
        className="h-11 w-full rounded-md bg-raised px-3 text-sm"
        value={current ?? ""}
        onChange={(e) => onPick(e.target.value)}
      >
        <option value="">Escolher</option>
        {roster.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
