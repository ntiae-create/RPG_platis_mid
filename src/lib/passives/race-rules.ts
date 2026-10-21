/**
 * Regras mecânicas das passivas raciais oficiais (src/data/races.ts).
 */
import type { Character, Stats } from "@/data/types";
import type { PassiveCombatState, PassiveContext, StatMods } from "./types";

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
      origin: "race",
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

export function emptyPassiveState(): PassiveCombatState {
  return { entries: [] };
}

export function raceStatMods(ctx: PassiveContext, role: "attacker" | "defender"): StatMods {
  const mods: StatMods = {};
  const raceId = ctx.self.raceId;
  const hpRatio = ctx.maxHp > 0 ? ctx.self.current.hp / ctx.maxHp : 1;

  if (role === "attacker") {
    if (raceId === "besta" && hpRatio <= 0.5) {
      mods.atk = (mods.atk ?? 0) + 3;
      ensure(ctx.state, ctx.self.id, "race:besta:frenesi", "Frenesi", { active: true }).active = true;
    }
    if (raceId === "semi-besta" && hpRatio <= 0.5) {
      mods.agi = (mods.agi ?? 0) + 2;
      ensure(ctx.state, ctx.self.id, "race:semi-besta:frenesi", "Frenesi Controlado", { active: true }).active = true;
    }
    if (raceId === "fae") {
      mods.agi = (mods.agi ?? 0) + 2;
      mods.atk = (mods.atk ?? 0) + 2;
      ensure(ctx.state, ctx.self.id, "race:fae:frenesi", "Frenesi Maluco", { active: true }).active = true;
    }
    if (raceId === "lupino" && ctx.allyNearby) {
      mods.agi = (mods.agi ?? 0) + 2;
      ensure(ctx.state, ctx.self.id, "race:lupino:matilha", "Instinto de Matilha", { active: true }).active = true;
    }
    const anao = entry(ctx.state, ctx.self.id, "race:anao:constituicao");
    if (raceId === "anao" && anao?.active) {
      mods.def = (mods.def ?? 0) + 2;
    }
  }

  if (role === "defender") {
    if (raceId === "lizard" && ctx.kind === "physical") {
      mods.damageTakenMult = (mods.damageTakenMult ?? 1) * 0.9;
    }
    const anao = entry(ctx.state, ctx.self.id, "race:anao:constituicao");
    if (raceId === "anao" && anao?.active) {
      mods.def = (mods.def ?? 0) + 2;
    }
    // Oni: inimigos próximos sofrem -2 DEF → quando o atacante é Oni, o defensor perde DEF
    if (ctx.opponent?.raceId === "oni") {
      mods.def = (mods.def ?? 0) - 2;
    }
  }

  return mods;
}

export function applyStatMods(base: Stats, mods: StatMods): Stats {
  const s = { ...base };
  for (const key of ["hp", "mp", "est", "san", "atk", "atkMgc", "def", "res", "agi", "int"] as const) {
    if (typeof mods[key] === "number") {
      s[key] = Math.max(0, s[key] + (mods[key] as number));
    }
  }
  return s;
}

export function raceStunChance(raceId: string): number {
  if (raceId === "elfo") return 0.4;
  if (raceId === "meio-elfo" || raceId === "gigante") return 0.2;
  return 0;
}

export function raceAvoidAttack(raceId: string, roll: () => number = Math.random): boolean {
  return raceId === "fae" && roll() < 0.2;
}

export function raceDamageDealtMult(
  attacker: Character,
  defenderHpRatio: number,
): { mult: number; note?: string } {
  if (attacker.raceId === "goblin" && defenderHpRatio <= 0.5) {
    return { mult: 1.2, note: "Oportunista +20%" };
  }
  return { mult: 1 };
}

export function raceOnLethal(
  ch: Character,
  incomingHp: number,
  roll: () => number = Math.random,
): { hp: number; survivedAt1: boolean; stunnedNotDead?: boolean; note?: string } {
  if (incomingHp > 0) return { hp: incomingHp, survivedAt1: false };
  if (ch.raceId === "morto-vivo" && roll() < 0.2) {
    return { hp: 1, survivedAt1: true, note: "Criação Indesejada: permanece com 1 HP" };
  }
  if (ch.raceId === "homunculo") {
    return {
      hp: 1,
      survivedAt1: false,
      stunnedNotDead: true,
      note: "Corpo Artificial: Stun (não morto, sem XP)",
    };
  }
  return { hp: Math.max(0, incomingHp), survivedAt1: false };
}

export function raceAfterDamageTaken(
  state: PassiveCombatState,
  ch: Character,
  maxHp: number,
  hpBefore: number,
  hpAfter: number,
): string | null {
  if (ch.raceId !== "anao" || maxHp <= 0) return null;
  const threshold = maxHp * 0.5;
  if (hpBefore > threshold && hpAfter <= threshold) {
    ensure(state, ch.id, "race:anao:constituicao", "Constituição Anã", { active: true }).active = true;
    return "Constituição Anã: +2 DEF até o fim do combate";
  }
  return null;
}
