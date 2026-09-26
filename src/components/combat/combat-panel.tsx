import { DiceTray } from "./dice-tray";
import { Button } from "@/components/ui/button";
import { usePlatis } from "@/lib/store";
import { CharacterCard } from "@/components/character/character-card";
import type { Character } from "@/data/types";

export function CombatPanel() {
  const characters = usePlatis((s) => s.characters);
  const slots = usePlatis((s) => s.slots);
  const attackerId = usePlatis((s) => s.attackerId);
  const defenderId = usePlatis((s) => s.defenderId);
  const select = usePlatis((s) => s.selectFighter);
  const rollCombat = usePlatis((s) => s.rollCombat);
  const rollLoose = usePlatis((s) => s.rollLoose);
  const last = usePlatis((s) => s.lastRoll);
  const log = usePlatis((s) => s.combatLog);
  const pending = usePlatis((s) => s.pendingCounter);
  const resolveCounter = usePlatis((s) => s.resolveCounter);
  const trap = usePlatis((s) => s.trap);
  const disarm = usePlatis((s) => s.disarmTrap);

  const attacker = attackerId ? characters[attackerId] : null;
  const defender = defenderId ? characters[defenderId] : null;
  const roster: Character[] = [];
  for (const id of slots) {
    if (id && characters[id]) roster.push(characters[id]);
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

        <div className="panel p-4">
          <h2 className="font-display text-2xl">Resolução D20</h2>
          <p className="text-xs text-muted">
            Atacante e defensor rolam D20. Acerto se o atacante supera o defensor. Empate: ATK vs DEF ou ATK
            MGC vs RES, depois RES, INT e EST. Critico 15-19 vezes 2, 20 vezes 3. Dano D[ATK] ou D[ATK MGC];
            habilidades ofensivas 2 + D[atributo]. Contra-ataque se o D20 do defensor for 17 ou mais e maior
            que o do atacante.
          </p>
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
            <Button disabled={!attacker || !defender} onClick={() => rollCombat("physical")}>
              Ataque físico
            </Button>
            <Button variant="secondary" disabled={!attacker || !defender} onClick={() => rollCombat("magical")}>
              Ataque mágico
            </Button>
            {attacker?.skills
              .filter((s) => s.status === "approved" && s.name)
              .map((sk) => (
                <Button
                  key={sk.id}
                  variant="outline"
                  disabled={!defender}
                  onClick={() =>
                    rollCombat(sk.type === "ataque-magico" ? "magical" : "physical", sk.id)
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
          <h3 className="mb-2 font-display text-xl">Log</h3>
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
  roster: Character[];
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
