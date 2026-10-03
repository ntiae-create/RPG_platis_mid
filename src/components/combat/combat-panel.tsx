import { DiceTray } from "./dice-tray";
import { Button } from "@/components/ui/button";
import { usePlatis } from "@/lib/store";
import { CharacterCard } from "@/components/character/character-card";
import type { Character, CombatEnemy } from "@/data/types";
import { useState } from "react";

export function CombatPanel() {
  const [movingParticipantId, setMovingParticipantId] = useState<string | null>(null);
  const combatActive = usePlatis((s) => s.combatActive);
  const startCombat = usePlatis((s) => s.startCombat);
  const endCombat = usePlatis((s) => s.endCombat);
const nextTurn = usePlatis((s) => s.nextTurn);
  const clearCombatLog = usePlatis((s) => s.clearCombatLog);
  const characters = usePlatis((s) => s.characters);
  const combatEnemies = usePlatis((s) => s.combatEnemies);
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

  const attacker = attackerId ? (characters[attackerId] ?? combatEnemies[attackerId] ?? null) : null;
  const defender = defenderId ? (characters[defenderId] ?? combatEnemies[defenderId] ?? null) : null;
  const roster: (Character | CombatEnemy)[] = [];
  for (const id of slots) {
    if (id && characters[id]) roster.push(characters[id]);
  for (const enemy of Object.values(combatEnemies)) roster.push(enemy);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
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
                <h2 className="font-display text-lg">Arena · 30×30</h2>
                <p className="text-[10px] text-muted">Área de combate separada do mapa mundial.</p>
              </div>
              <span className="text-[10px] text-muted">
                {movingParticipantId ? "Movendo" : "Toque em um jogador/inimigo"}
              </span>
            </div>

            <div className="mt-2 flex max-h-16 flex-wrap gap-1 overflow-hidden">
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
                    {combatEnemies[id] ? "E" : "P"} · {fighter.name}
                  </Button>
                );
              })}
            </div>

            <div className="mx-auto mt-2 w-full max-w-[420px] aspect-square overflow-hidden rounded-md border border-line">
              <div
                className="relative h-full w-full"
                style={{
                  backgroundSize: "3.333333% 3.333333%",
                  backgroundImage:
                    "linear-gradient(to right, hsl(var(--line) / 0.35) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--line) / 0.35) 1px, transparent 1px)",
                }}
                onClick={(event) => {
                  if (!movingParticipantId) return;

                  const rect = event.currentTarget.getBoundingClientRect();
                  const x = Math.floor(((event.clientX - rect.left) / rect.width) * 30);
                  const y = Math.floor(((event.clientY - rect.top) / rect.height) * 30);

                  moveCombatParticipant(movingParticipantId, x, y);
                }}
              >
                {Object.entries(combatPositions).map(([id, position]) => {
                  const fighter = characters[id] ?? combatEnemies[id] ?? null;
                  if (!fighter) return null;

                  const isEnemy = Boolean(combatEnemies[id]);

                  return (
                    <div
                      key={id}
                      className="absolute z-10 flex h-[5%] min-w-[5%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded border border-line bg-panel px-0.5 text-[7px] font-bold leading-none"
                      style={{
                        left: `${((position.x + 0.5) / 30) * 100}%`,
                        top: `${((position.y + 0.5) / 30) * 100}%`,
                      }}
                      title={fighter.name}
                    >
                      {isEnemy ? "E" : "P"}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-1 flex justify-center gap-3 text-[9px] text-muted">
              <span>P = Player</span>
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
          {combatActive && attacker && "raceId" in attacker && (
            <div className="mt-3 rounded-md border border-line p-3">
              <p className="mb-2 text-sm font-medium">Ação de fuga</p>
              <Button
                variant="outline"
                onClick={() => attemptEscape(attacker.id)}
              >
                Fugir · D100
              </Button>
              <p className="mt-2 text-xs text-muted">
                Role 1d100. A fuga acontece se seu resultado for maior que o D100 do inimigo.
              </p>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={!combatActive}
              onClick={nextTurn}
            >
              Próximo Turno
            </Button>
            <Button disabled={!attacker || !defender} onClick={() => rollCombat("physical")}>
              Ataque físico
            </Button>
            <Button variant="secondary" disabled={!attacker || !defender} onClick={() => rollCombat("magical")}>
              Ataque mágico
            </Button>
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
                <span className="mr-2 text-[10px] tracking-wide text-faint uppercase">{e.kind}</span>
                {e.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-3">
        {attacker && <CharacterCard character={attacker} compact />}
        {defender && <CharacterCard character={defender} compact />}
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
