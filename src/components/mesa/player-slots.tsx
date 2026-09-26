import { CharacterCard } from "@/components/character/character-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RACES } from "@/data/races";
import { usePlatis } from "@/lib/store";
import { UserPlus } from "lucide-react";

export function PlayerSlots() {
  const slots = usePlatis((s) => s.slots);
  const characters = usePlatis((s) => s.characters);
  const grantXp = usePlatis((s) => s.grantXp);
  const grantBrasao = usePlatis((s) => s.grantBrasaoXp);
  const unlockRace = usePlatis((s) => s.unlockRace);
  const centerOn = usePlatis((s) => s.centerOn);
  const selectFighter = usePlatis((s) => s.selectFighter);
  const seedDemo = usePlatis((s) => s.seedDemo);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">Oito slots</h2>
        <Button size="sm" variant="secondary" onClick={seedDemo}>
          <UserPlus className="size-4" /> Demo
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {slots.map((id, i) => {
          const ch = id ? characters[id] : null;
          return (
            <div key={i} className="panel p-2">
              <p className="px-1 pb-2 text-[10px] tracking-wide text-muted uppercase">
                Slot {i + 1}
              </p>
              {ch ? (
                <div className="space-y-2">
                  <CharacterCard character={ch} compact />
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => grantXp(ch.id, 100)}>
                      +100 XP
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => grantBrasao(ch.id, 3000)}>
                      +3k Brasão
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => centerOn(ch.id)}>
                      Centralizar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => selectFighter("attacker", ch.id)}>
                      Atacante
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => selectFighter("defender", ch.id)}>
                      Defensor
                    </Button>
                  </div>
                  <select
                    className="h-11 w-full rounded-md bg-raised px-2 text-sm"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) unlockRace(ch.id, e.target.value);
                    }}
                  >
                    <option value="">Desbloquear raça</option>
                    {RACES.filter((r) => !ch.unlockedRaces.includes(r.id)).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.tier})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="px-1 py-6 text-center text-sm text-muted">Vazio</p>
              )}
            </div>
          );
        })}
      </div>
      <XpTools />
    </div>
  );
}

function XpTools() {
  const award = usePlatis((s) => s.awardCombatXp);
  const setAmt = usePlatis((s) => s.setCombatXpAward);
  const amt = usePlatis((s) => s.combatXpAward);
  return (
    <div className="panel flex flex-wrap items-end gap-2 p-3">
      <div className="flex-1">
        <p className="mb-1 text-[10px] tracking-wide text-muted uppercase">XP de combate</p>
        <Input
          type="number"
          min={0}
          value={amt}
          onChange={(e) => setAmt(Number(e.target.value))}
        />
      </div>
      <Button onClick={award}>Conceder a todos</Button>
    </div>
  );
}
