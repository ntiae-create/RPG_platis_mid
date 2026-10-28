/**
 * Regras mecânicas das passivas de classe oficiais (src/data/classes.ts).
 */
import type { Character, Stats } from "@/data/types";
import type { PassiveCombatState, StatMods } from "./types";

function entry(state: PassiveCombatState, characterId: string, id: string) {
  return state.entries.find((e) => e.characterId === characterId && e.id === id);
}

function ensure(
  state: PassiveCombatState,
  characterId: string,
  id: string,
  name: string,
  defaults?: Partial<{
    stacks: number;
    maxStacks: number | null;
    turnsRemaining: number | null;
    active: boolean;
    meta: Record<string, string | number | boolean>;
  }>,
) {
  let e = entry(state, characterId, id);
  if (!e) {
    e = {
      id,
      characterId,
      origin: "class",
      name,
      stacks: defaults?.stacks ?? 0,
      maxStacks: defaults?.maxStacks ?? null,
      turnsRemaining: defaults?.turnsRemaining ?? null,
      active: defaults?.active ?? false,
      meta: defaults?.meta ?? {},
    };
    state.entries.push(e);
  }
  return e;
}

/** PLACEHOLDER_RESTORE_INCOMPLETE - full file must be restored from local typed version */
export function classBerserkAtkBonus(ch: Character, maxHp: number): { bonus: number; note?: string } {
  if (ch.classId !== "berserk" || maxHp <= 0) return { bonus: 0 };
  const lostPercent = Math.max(0, Math.round((1 - ch.current.hp / maxHp) * 100));
  if (lostPercent >= 50) return { bonus: 5, note: "Fúria Máxima: +5 ATK" };
  const steps = Math.floor(lostPercent / 10);
  if (steps <= 0) return { bonus: 0 };
  return { bonus: steps, note: `Fúria Crescente: +${steps} ATK` };
}
