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

/**
 * Berserk — Fúria Crescente:
 * A cada 10% de HP perdido, +1 ATK. Em ≤50% HP, Fúria Máxima (+5 ATK total, não sobe abaixo).
 */
export function classBerserkAtkBonus(ch: Character, maxHp: number): {
  bonus: number;
  note?: string;
} {
  if (ch.classId !== "berserk" || maxHp <= 0) return { bonus: 0 };
  const lostPercent = Math.max(0, Math.round((1 - ch.current.hp / maxHp) * 100));
  if (lostPercent >= 50) {
    return { bonus: 5, note: "Fúria Máxima: +5 ATK" };
  }
  const steps = Math.floor(lostPercent / 10);
  if (steps <= 0) return { bonus: 0 };
  return { bonus: steps, note: `Fúria Crescente: +${steps} ATK` };
}

/** Assassino — Ponto Fraco: +25% de costas/furtividade */
export function classAssassinDamageMult(
  ch: Character,
  fromStealth: boolean,
): { mult: number; note?: string } {
  if (ch.classId !== "assassino" || !fromStealth) return { mult: 1 };
  return { mult: 1.25, note: "Ponto Fraco +25%" };
}

/**
 * Feiticeiro — Magic Booster: +1 ATK MGC por skill (stack), ao chegar a 5 → Descontrole.
 */
export function classFeiticeiroOnSkill(
  state: PassiveCombatState,
  ch: Character,
): { atkMgcBonus: number; detonate: boolean; note?: string } {
  if (ch.classId !== "feiticeiro") return { atkMgcBonus: 0, detonate: false };
  const e = ensure(state, ch.id, "class:feiticeiro:booster", "Magic Booster", {
    stacks: 0,
    maxStacks: 5,
    active: true,
  });
  e.stacks = Math.min((e.maxStacks ?? 5), e.stacks + 1);
  e.active = true;
  if (e.stacks >= 5) {
    e.stacks = 0;
    return {
      atkMgcBonus: 0,
      detonate: true,
      note: "Descontrole de Mana: dano = MP restante, stacks resetados",
    };
  }
  return {
    atkMgcBonus: e.stacks,
    detonate: false,
    note: `Magic Booster: +${e.stacks} ATK MGC (${e.stacks}/5)`,
  };
}

export function classFeiticeiroAtkMgcFromState(
  state: PassiveCombatState,
  characterId: string,
  classId: string,
): number {
  if (classId !== "feiticeiro") return 0;
  const e = entry(state, characterId, "class:feiticeiro:booster");
  return e?.active ? e.stacks : 0;
}

export function classMagoOnSkill(
  state: PassiveCombatState,
  ch: Character,
  affinityId: string | undefined,
): { note?: string } {
  if (ch.classId !== "mago") return {};
  const e = ensure(state, ch.id, "class:mago:octagrama", "Octagrama Arcano", {
    stacks: 0,
    maxStacks: 8,
    active: true,
    meta: { lastAffinity: "" },
  });
  const last = String(e.meta.lastAffinity ?? "");
  if (affinityId && affinityId !== last) {
    e.stacks = Math.min(8, e.stacks + 1);
    e.meta = { ...e.meta, lastAffinity: affinityId };
    e.active = true;
    if (e.stacks >= 8) {
      e.meta = { ...e.meta, primed: true };
      return { note: "Octagrama Arcano: 8/8 — próximo ataque +50% mágico" };
    }
    return { note: `Octagrama Arcano: ${e.stacks}/8` };
  }
  if (affinityId) e.meta = { ...e.meta, lastAffinity: affinityId };
  return {};
}

export function classMagoConsumePrime(
  state: PassiveCombatState,
  ch: Character,
  kind: "physical" | "magical",
): { mult: number; note?: string } {
  if (ch.classId !== "mago" || kind !== "magical") return { mult: 1 };
  const e = entry(state, ch.id, "class:mago:octagrama");
  if (!e?.meta.primed) return { mult: 1 };
  e.meta = { ...e.meta, primed: false };
  e.stacks = 0;
  return { mult: 1.5, note: "Octagrama Arcano: +50% dano mágico (consumido)" };
}

export function classBufaoCombatStart(
  state: PassiveCombatState,
  ch: Character,
): string | null {
  if (ch.classId !== "bufao") return null;
  const e = ensure(state, ch.id, "class:bufao:carta", "Carta do Louco", {
    stacks: 1,
    maxStacks: null,
    active: true,
    meta: { extremistUsed: false },
  });
  e.stacks = Math.max(1, e.stacks);
  e.active = true;
  return "Carta do Louco: 1 stack (+1 AGI)";
}

export function classBufaoOnTurn(
  state: PassiveCombatState,
  ch: Character,
): { note?: string } {
  if (ch.classId !== "bufao") return {};
  const e = ensure(state, ch.id, "class:bufao:carta", "Carta do Louco", {
    stacks: 1,
    active: true,
    meta: { extremistUsed: false },
  });
  e.stacks += 1;
  e.active = true;
  if (e.stacks >= 5 && !e.meta.extremistUsed) {
    e.meta = { ...e.meta, extremistUsed: true, extremistReady: true };
    return { note: "Carta do Louco: 5 stacks — EXTREMISTA disponível" };
  }
  return { note: `Carta do Louco: ${e.stacks} stacks` };
}

export function classBufaoAgiBonus(
  state: PassiveCombatState,
  ch: Character,
  baseAgi: number,
): { bonus: number; extremist: boolean } {
  if (ch.classId !== "bufao") return { bonus: 0, extremist: false };
  const e = entry(state, ch.id, "class:bufao:carta");
  if (!e?.active) return { bonus: 0, extremist: false };
  let bonus = e.stacks;
  if (e.stacks >= 5) {
    bonus += Math.floor(baseAgi * 0.25);
  }
  const extremist = Boolean(e.meta.extremistReady);
  return { bonus, extremist };
}

export function classBufaoConsumeExtremist(
  state: PassiveCombatState,
  ch: Character,
): boolean {
  if (ch.classId !== "bufao") return false;
  const e = entry(state, ch.id, "class:bufao:carta");
  if (!e?.meta.extremistReady) return false;
  e.meta = { ...e.meta, extremistReady: false };
  return true;
}

export function classAttackerStatMods(
  state: PassiveCombatState,
  ch: Character,
  maxHp: number,
  base: Stats,
): StatMods {
  const mods: StatMods = {};
  const berserk = classBerserkAtkBonus(ch, maxHp);
  if (berserk.bonus) mods.atk = (mods.atk ?? 0) + berserk.bonus;
  const booster = classFeiticeiroAtkMgcFromState(state, ch.id, ch.classId);
  if (booster) mods.atkMgc = (mods.atkMgc ?? 0) + booster;
  const bufao = classBufaoAgiBonus(state, ch, base.agi);
  if (bufao.bonus) mods.agi = (mods.agi ?? 0) + bufao.bonus;
  return mods;
}

export function classArqueiroOnHit(state: PassiveCombatState, ch: Character): {
  damageMult: number;
  note?: string;
} {
  if (ch.classId !== "arqueiro") return { damageMult: 1 };
  const e = ensure(state, ch.id, "class:arqueiro:conc", "Concentração Absoluta", {
    stacks: 0,
    maxStacks: 2,
    active: true,
    meta: {},
  });
  if (e.meta.concentrated) {
    e.meta = { ...e.meta, concentrated: false };
    e.stacks = 0;
    return { damageMult: 2, note: "Concentração Absoluta: dano ×2" };
  }
  e.stacks = Math.min(2, e.stacks + 1);
  if (e.stacks >= 2) {
    e.meta = { ...e.meta, concentrated: true };
    e.stacks = 0;
    return { damageMult: 1, note: "Concentração ativada — próximo ataque ×2" };
  }
  return { damageMult: 1, note: `Concentração ${e.stacks}/2` };
}

export function classArqueiroOnMiss(state: PassiveCombatState, ch: Character): void {
  if (ch.classId !== "arqueiro") return;
  const e = entry(state, ch.id, "class:arqueiro:conc");
  if (e) {
    e.stacks = 0;
    e.meta = { ...e.meta, concentrated: false };
  }
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
  if (roll() < 0.3) {
    applyPoison = true;
    notes.push("Preparação Alquímica: Veneno");
  }
  let applyStun = false;
  if (targetHasPoison || applyPoison) {
    const e = ensure(state, defenderId, `class:alquimista:count:${ch.id}`, "Contagem Veneno", {
      stacks: 0,
      maxStacks: 3,
      active: true,
    });
    e.stacks += 1;
    if (e.stacks >= 3) {
      e.stacks = 0;
      applyStun = true;
      notes.push("Preparação Alquímica: Atordoamento");
    }
  }
  return { applyPoison, applyStun, notes };
}

export function classCacadorOnHit(
  state: PassiveCombatState,
  ch: Character,
  defenderId: string,
): { damageMult: number; note?: string } {
  if (ch.classId !== "cacador") return { damageMult: 1 };
  let e = entry(state, defenderId, `class:cacador:marca:${ch.id}`);
  if (!e?.active) {
    e = ensure(state, defenderId, `class:cacador:marca:${ch.id}`, "Marca do Caçador", {
      active: true,
      turnsRemaining: 3,
      stacks: 1,
    });
    e.active = true;
    e.turnsRemaining = 3;
    return { damageMult: 1.2, note: "Marca do Caçador: +20% (3 turnos)" };
  }
  return { damageMult: 1.2, note: "Marca do Caçador: +20%" };
}

export function classPugilistaOnBasicHit(state: PassiveCombatState, ch: Character): StatMods & {
  damageMult?: number;
  note?: string;
} {
  if (ch.classId !== "pugilista") return {};
  const e = ensure(state, ch.id, "class:pugilista:seq", "Punhos de Ferro", {
    stacks: 0,
    active: true,
  });
  e.stacks += 1;
  e.active = true;
  const mods: StatMods & { damageMult?: number; note?: string } = {};
  if (e.stacks >= 5) {
    mods.damageMult = 1.45;
    mods.atk = 2;
    mods.agi = 2;
    mods.note = "Punhos de Ferro: 5º golpe +45% e encerra sequência";
    e.stacks = 0;
  } else if (e.stacks >= 3) {
    mods.agi = 2;
    mods.note = `Punhos de Ferro: sequência ${e.stacks}`;
  } else {
    mods.note = `Punhos de Ferro: sequência ${e.stacks}`;
  }
  return mods;
}

export function classPugilistaReset(state: PassiveCombatState, ch: Character): void {
  if (ch.classId !== "pugilista") return;
  const e = entry(state, ch.id, "class:pugilista:seq");
  if (e) e.stacks = 0;
}

export function classGuerreiroStanceMods(
  state: PassiveCombatState,
  ch: Character,
): StatMods {
  if (ch.classId !== "guerreiro") return {};
  const e = entry(state, ch.id, "class:guerreiro:postura");
  const stance = String(e?.meta.stance ?? "ofensiva");
  if (stance === "defensiva") return { def: 2 };
  if (stance === "mobilidade") return { agi: 2 };
  return { atk: 2 };
}

export function classGuerreiroSetStance(
  state: PassiveCombatState,
  ch: Character,
  stance: "ofensiva" | "defensiva" | "mobilidade",
): void {
  if (ch.classId !== "guerreiro") return;
  const e = ensure(state, ch.id, "class:guerreiro:postura", "Postura de Combate", {
    active: true,
    meta: { stance },
  });
  e.active = true;
  e.meta = { stance };
}

export function classTankAllyDefBonus(
  state: PassiveCombatState,
  defenderId: string,
  positions: Record<string, { x: number; y: number }>,
  characters: Record<string, Character>,
): number {
  let bonus = 0;
  for (const [id, ch] of Object.entries(characters)) {
    if (ch.classId !== "tank" || ch.current.hp <= 0) continue;
    const tankPos = positions[id];
    const defPos = positions[defenderId];
    if (!tankPos || !defPos) continue;
    if (tankPos.x > 3) continue;
    const dist = Math.abs(tankPos.x - defPos.x) + Math.abs(tankPos.y - defPos.y);
    if (dist <= 4 && id !== defenderId) bonus += 3;
  }
  return bonus;
}

export function classBufaoExtremistBonusDamage(baseAgi: number): number {
  return Math.max(0, baseAgi);
}
