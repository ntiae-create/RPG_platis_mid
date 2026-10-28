/**
 * Regras mecânicas das passivas de classe oficiais (src/data/classes.ts).
 * TEMPORARY STUB - Full typed file is at artifacts/class_rules_TYPED.ts
 * Run from Termux: copy typed file and push.
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
      origin: "class" as const,
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

export function classBerserkAtkBonus(ch: Character, maxHp: number): { bonus: number; note?: string } {
  if (ch.classId !== "berserk" || maxHp <= 0) return { bonus: 0 };
  const lostPercent = Math.max(0, Math.round((1 - ch.current.hp / maxHp) * 100));
  if (lostPercent >= 50) return { bonus: 5, note: "Fúria Máxima: +5 ATK" };
  const steps = Math.floor(lostPercent / 10);
  if (steps <= 0) return { bonus: 0 };
  return { bonus: steps, note: `Fúria Crescente: +${steps} ATK` };
}

export function classAssassinDamageMult(ch: Character, fromStealth: boolean): { mult: number; note?: string } {
  if (ch.classId !== "assassino" || !fromStealth) return { mult: 1 };
  return { mult: 1.25, note: "Ponto Fraco +25%" };
}

// NOTE: Full file with all class passive functions must be restored from
// artifacts/class_rules_TYPED.ts or local /tmp/rpg_ts after typecheck.
// This stub exports minimal functions to avoid total build failure.
export function classAttackerStatMods(state: PassiveCombatState, ch: Character, maxHp: number, base: Stats): StatMods {
  const mods: StatMods = {};
  const berserk = classBerserkAtkBonus(ch, maxHp);
  if (berserk.bonus) mods.atk = (mods.atk ?? 0) + berserk.bonus;
  return mods;
}

export function classAlquimistaOnHit(
  state: PassiveCombatState,
  ch: Character,
  defenderId: string,
  targetHasPoison: boolean,
  roll: () => number = Math.random,
): { applyPoison: boolean; applyStun: boolean; notes: string[] } {
  const notes: string[] = [];
  if (ch.classId !== "alquimista") return { applyPoison: false, applyStun: false, notes };
  let applyPoison = false;
  if (roll() < 0.3) { applyPoison = true; notes.push("Preparação Alquímica: Veneno"); }
  let applyStun = false;
  if (targetHasPoison || applyPoison) {
    const e = ensure(state, defenderId, `class:alquimista:count:${ch.id}`, "Contagem Veneno", { stacks: 0, maxStacks: 3, active: true });
    e.stacks += 1;
    if (e.stacks >= 3) { e.stacks = 0; applyStun = true; notes.push("Preparação Alquímica: Atordoamento"); }
  }
  return { applyPoison, applyStun, notes };
}
