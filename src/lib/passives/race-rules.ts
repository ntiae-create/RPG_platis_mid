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

export function raceOnHitSeal(
  state: PassiveCombatState,
  attacker: Character,
  defenderId: string,
  roll: () => number = Math.random,
): string | null {
  if (attacker.raceId !== "aqua" || roll() >= 0.2) return null;
  const e = ensure(state, defenderId, "race:aqua:selo", "Selo do Além", {
    active: true,
    turnsRemaining: 2,
    maxStacks: 1,
    stacks: 1,
  });
  e.active = true;
  e.turnsRemaining = 2;
  return "Selos do Além: −10% recuperação de HP (2 turnos)";
}

export function raceCombatStart(
  state: PassiveCombatState,
  ch: Character,
  pick: () => number = Math.random,
): string | null {
  if (ch.raceId === "quimera") {
    const keys = ["atk", "atkMgc", "def", "res", "agi", "int"] as const;
    const key = keys[Math.floor(pick() * keys.length)];
    const e = ensure(state, ch.id, "race:quimera:mutacao", "Mutação", {
      active: true,
      meta: { attr: key, bonus: 2 },
    });
    e.active = true;
    e.meta = { attr: key, bonus: 2 };
    return `Mutação: +2 ${key}`;
  }
  if (ch.raceId === "fae") {
    ensure(state, ch.id, "race:fae:frenesi", "Frenesi Maluco", { active: true }).active = true;
    return "Frenesi Maluco: +2 AGI +2 ATK";
  }
  return null;
}

export function tickPassiveDurations(state: PassiveCombatState, characterId: string): void {
  for (const e of state.entries) {
    if (e.characterId !== characterId) continue;
    if (e.turnsRemaining === null) continue;
    e.turnsRemaining -= 1;
    if (e.turnsRemaining <= 0) {
      e.active = false;
      e.turnsRemaining = 0;
    }
  }
}


/** Redução de cura por Selo do Além (Aqua) no alvo */
export function raceHealReceivedMult(
  state: PassiveCombatState,
  targetId: string,
): { mult: number; note?: string } {
  const seal = state.entries.find(
    (e) => e.characterId === targetId && e.id === "race:aqua:selo" && e.active,
  );
  if (seal) {
    return { mult: 0.9, note: "Selo do Além: −10% cura recebida" };
  }
  return { mult: 1 };
}

/** Dríade — Floresta da Vida: 2% HP máx por turno em terreno natural */
export function raceTurnStartHeal(
  ch: Character,
  maxHp: number,
  naturalTerrain: boolean,
): { amount: number; note?: string } {
  if (ch.raceId !== "driade" || !naturalTerrain || maxHp <= 0) {
    return { amount: 0 };
  }
  const amount = Math.max(1, Math.floor(maxHp * 0.02));
  return { amount, note: `Floresta da Vida: +${amount} HP` };
}

/**
 * Humano — Adaptatividade: registra efeito negativo e reduz duração na 2ª aplicação.
 * Retorna durationOverride se adaptado.
 */
export function raceAdaptStatusDuration(
  state: PassiveCombatState,
  ch: Character,
  effectId: string,
  baseDuration: number | null,
): { duration: number | null; note?: string } {
  if (ch.raceId !== "humano" || baseDuration === null) {
    return { duration: baseDuration };
  }
  const key = `race:humano:adapt:${effectId}`;
  const e = ensure(state, ch.id, key, "Adaptatividade", {
    active: true,
    meta: { effectId, seen: 0 },
  });
  const seen = Number(e.meta.seen ?? 0);
  if (seen === 0) {
    e.meta = { ...e.meta, seen: 1, effectId };
    e.active = true;
    return { duration: baseDuration, note: "Adaptatividade: memorizou o efeito" };
  }
  const reduced = Math.max(0, baseDuration - 1);
  return {
    duration: reduced,
    note: `Adaptatividade: duração −1 (${baseDuration} → ${reduced})`,
  };
}

/** Demônio — 20% ignorar efeito negativo; Divino — 20% refletir (sinalização) */
export function raceOnNegativeStatus(
  ch: Character,
  roll: () => number = Math.random,
): "ignore" | "reflect" | "apply" {
  if (ch.raceId === "demonio" && roll() < 0.2) return "ignore";
  if (ch.raceId === "divino" && roll() < 0.2) return "reflect";
  return "apply";
}

/** Aliados próximos: mesma equipe e distância de Manhattan ≤ 4 nas posições de combate */
export function isAllyNearby(
  selfId: string,
  positions: Record<string, { x: number; y: number }>,
  allyIds: string[],
  maxDist = 4,
): boolean {
  const selfPos = positions[selfId];
  if (!selfPos) return allyIds.length > 1; // fallback: há outros participantes aliados
  for (const id of allyIds) {
    if (id === selfId) continue;
    const p = positions[id];
    if (!p) continue;
    const dist = Math.abs(p.x - selfPos.x) + Math.abs(p.y - selfPos.y);
    if (dist <= maxDist) return true;
  }
  return false;
}


/** Orc — FERA COVARDE: no início, personagens com nível ≤ Orc perdem −1 em todos os atributos ofensivos/defensivos listados */
export function raceOrcCombatStart(
  state: PassiveCombatState,
  orc: Character,
  others: Character[],
): string[] {
  if (orc.raceId !== "orc") return [];
  const notes: string[] = [];
  for (const ch of others) {
    if (ch.id === orc.id) continue;
    if (ch.level <= orc.level) {
      const e = ensure(state, ch.id, "race:orc:fera-covarde", "Fera Covarde", {
        active: true,
        meta: { penalty: 1, sourceOrc: orc.id },
      });
      e.active = true;
      notes.push(`${ch.name}: −1 atributos (Fúria Orc)`);
    }
  }
  return notes;
}

/** Aplica penalidade Orc nos mods de stats */
export function raceOrcPenaltyMods(
  state: PassiveCombatState,
  characterId: string,
): StatMods {
  const e = entry(state, characterId, "race:orc:fera-covarde");
  if (!e?.active) return {};
  const p = Number(e.meta.penalty ?? 1);
  return {
    atk: -p,
    atkMgc: -p,
    def: -p,
    res: -p,
    agi: -p,
    int: -p,
  };
}

/**
 * Dragonoide — Lazuli: marca no alvo (máx 5); ao consumir, dano = soma dos danos que geraram marcas + Fúria do Dragão.
 */
export function raceDragonoideOnHit(
  state: PassiveCombatState,
  attacker: Character,
  defenderId: string,
  finalDamage: number,
): { bonusDamage: number; notes: string[] } {
  const notes: string[] = [];
  if (attacker.raceId !== "dragonoide" || finalDamage <= 0) {
    return { bonusDamage: 0, notes };
  }
  const markId = `race:dragonoide:marca:${defenderId}`;
  const e = ensure(state, defenderId, markId, "Marca Dracônica", {
    stacks: 0,
    maxStacks: 5,
    active: true,
    meta: { damageSum: 0, sourceId: attacker.id },
  });
  e.stacks = Math.min(5, e.stacks + 1);
  e.meta = {
    ...e.meta,
    damageSum: Number(e.meta.damageSum ?? 0) + finalDamage,
    sourceId: attacker.id,
  };
  e.active = true;
  notes.push(`Marca Dracônica ${e.stacks}/5`);

  if (e.stacks >= 5) {
    const bonus = Number(e.meta.damageSum ?? 0);
    e.stacks = 0;
    e.active = false;
    e.meta = { ...e.meta, damageSum: 0 };
    const fury = ensure(state, attacker.id, "race:dragonoide:furia", "Fúria do Dragão", {
      active: true,
    });
    fury.active = true;
    notes.push(`Efeito da Morte: +${bonus} dano · Fúria do Dragão`);
    return { bonusDamage: bonus, notes };
  }
  return { bonusDamage: 0, notes };
}

export function raceDragonFuryMods(state: PassiveCombatState, characterId: string): StatMods {
  const e = entry(state, characterId, "race:dragonoide:furia");
  if (!e?.active) return {};
  return { atk: 2, atkMgc: 2, def: 2, res: 2, agi: 2, int: 2 };
}

/** Umbral — Marca do Vazio: 3 marcas → Cego 1 turno */
export function raceUmbralOnHit(
  state: PassiveCombatState,
  attacker: Character,
  defenderId: string,
): { applyBlind: boolean; notes: string[] } {
  const notes: string[] = [];
  if (attacker.raceId !== "umbral") return { applyBlind: false, notes };
  const e = ensure(state, defenderId, "race:umbral:marca", "Marca Umbral", {
    stacks: 0,
    maxStacks: 3,
    active: true,
  });
  e.stacks = Math.min(3, e.stacks + 1);
  e.active = true;
  notes.push(`Marca Umbral ${e.stacks}/3`);
  if (e.stacks >= 3) {
    e.stacks = 0;
    e.active = false;
    notes.push("Marcas consumidas: Cego (1 turno)");
    return { applyBlind: true, notes };
  }
  return { applyBlind: false, notes };
}

/** Vampiro — Blood Hugh: stacks de Blood (0–3) via skill; no máximo, lifesteal 50% em ataques com sangramento */
export function raceVampireOnSkill(
  state: PassiveCombatState,
  ch: Character,
): { note?: string } {
  if (ch.raceId !== "vampiro") return {};
  const e = ensure(state, ch.id, "race:vampiro:blood", "Blood Hugh", {
    stacks: 0,
    maxStacks: 3,
    active: true,
  });
  if (e.stacks < 3) {
    e.stacks += 1;
    e.active = true;
  }
  if (e.stacks >= 3) {
    e.meta = { ...e.meta, maxRegen: true };
    return { note: `Blood Hugh: ${e.stacks}/3 — regeneração máxima` };
  }
  return { note: `Blood Hugh: ${e.stacks}/3` };
}

export function raceVampireLifestealMult(
  state: PassiveCombatState,
  attackerId: string,
  hasBleedingOnTarget: boolean,
): number {
  const e = entry(state, attackerId, "race:vampiro:blood");
  if (!e?.meta.maxRegen || !hasBleedingOnTarget) return 0;
  return 0.5;
}

/**
 * Kitsune — Ilusão / Além:
 * +1 ilusão por ataque; aos 3 cria ilusão (não pode ser atacada).
 * Quando a ilusão é "atingida", some e inicia stacks do Além.
 * 3 Além → imune aos próximos 2 ataques.
 */
/**
 * Kitsune — 1 stack de Ilusão/Além por **turno em que atacou** (não por cada golpe).
 * Chamar no fim do turno do atacante se houve ao menos um ataque.
 */
export function raceKitsuneOnAttackTurn(
  state: PassiveCombatState,
  ch: Character,
): string | null {
  if (ch.raceId !== "kitsune") return null;
  const illusion = entry(state, ch.id, "race:kitsune:ilusao-ativa");
  if (illusion?.active) return null;

  const beyond = entry(state, ch.id, "race:kitsune:alem");
  if (beyond && Number(beyond.meta.phase) === 1) {
    beyond.stacks = Math.min(3, beyond.stacks + 1);
    if (beyond.stacks >= 3) {
      beyond.stacks = 0;
      beyond.meta = { ...beyond.meta, immuneAttacks: 2 };
      return "Stacks do Além: imune aos próximos 2 ataques";
    }
    return `Stack do Além ${beyond.stacks}/3`;
  }

  const e = ensure(state, ch.id, "race:kitsune:ilusao", "Stack de Ilusão", {
    stacks: 0,
    maxStacks: 3,
    active: true,
  });
  e.stacks = Math.min(3, e.stacks + 1);
  if (e.stacks >= 3) {
    e.stacks = 0;
    ensure(state, ch.id, "race:kitsune:ilusao-ativa", "Ilusão", { active: true }).active = true;
    return "Ilusão criada (Kitsune não pode ser atacada)";
  }
  return `Stack de Ilusão ${e.stacks}/3`;
}

/** @deprecated use raceKitsuneOnAttackTurn */
export function raceKitsuneOnAttack(
  state: PassiveCombatState,
  ch: Character,
): string | null {
  return raceKitsuneOnAttackTurn(state, ch);
}

/** Retorna se o ataque contra a Kitsune deve ser anulado (ilusão ou imunidade) */
export function raceKitsuneTryAvoidHit(
  state: PassiveCombatState,
  defender: Character,
): { avoid: boolean; note?: string } {
  if (defender.raceId !== "kitsune") return { avoid: false };
  const illusion = entry(state, defender.id, "race:kitsune:ilusao-ativa");
  if (illusion?.active) {
    illusion.active = false;
    ensure(state, defender.id, "race:kitsune:alem", "Stack do Além", {
      stacks: 0,
      maxStacks: 3,
      active: true,
      meta: { phase: 1 },
    }).active = true;
    return { avoid: true, note: "Ilusão destruída — inicia Stacks do Além" };
  }
  const beyond = entry(state, defender.id, "race:kitsune:alem");
  const immune = Number(beyond?.meta.immuneAttacks ?? 0);
  if (immune > 0 && beyond) {
    beyond.meta = { ...beyond.meta, immuneAttacks: immune - 1 };
    return { avoid: true, note: `Imunidade do Além (${immune - 1} restantes)` };
  }
  return { avoid: false };
}

/** Doppelganger — Assimilação: +1 stack/turno; aos 5 pode assimilar 1x */
export function raceDoppelOnTurn(state: PassiveCombatState, ch: Character): string | null {
  if (ch.raceId !== "doppelganger") return null;
  const e = ensure(state, ch.id, "race:doppel:assimilacao", "Assimilação", {
    stacks: 0,
    maxStacks: 5,
    active: true,
    meta: { used: false },
  });
  if (e.meta.used) return null;
  e.stacks = Math.min(5, e.stacks + 1);
  e.active = true;
  if (e.stacks >= 5) {
    e.meta = { ...e.meta, ready: true };
    return "Assimilação pronta (5/5) — uma vez por batalha";
  }
  return `Assimilação ${e.stacks}/5`;
}

/**
 * Homúnculo — derrota = Stun, não morte/XP.
 * Retorna hp=1 com flag stunned artificial (caller aplica stun).
 */
export function raceHomunculusOnLethal(
  ch: Character,
  incomingHp: number,
): { hp: number; stunnedNotDead: boolean; note?: string } {
  if (ch.raceId !== "homunculo" || incomingHp > 0) {
    return { hp: Math.max(0, incomingHp), stunnedNotDead: false };
  }
  return {
    hp: 1,
    stunnedNotDead: true,
    note: "Corpo Artificial: Stun (não morto, sem XP)",
  };
}


export type DoppelSnapshot = {
  raceId: string;
  classId: string;
  affinityId: string;
  allocated: Character["allocated"];
  current: Character["current"];
  skills: Character["skills"];
  personalPassive: Character["personalPassive"];
};

/** Assimilação completa: cópia temporária; restaura snapshot ao zerar HP/MP/EST */
export function raceDoppelCanAssimilate(
  state: PassiveCombatState,
  doppel: Character,
  target: Character,
): { ok: boolean; reason?: string } {
  if (doppel.raceId !== "doppelganger") return { ok: false, reason: "não é doppel" };
  const e = entry(state, doppel.id, "race:doppel:assimilacao");
  if (!e || e.stacks < 5) return { ok: false, reason: "precisa 5 stacks" };
  if (e.meta.used || e.meta.assimilating) return { ok: false, reason: "já usou / em assimilação" };
  if (target.level > doppel.level + 10) return { ok: false, reason: "alvo acima de +10 níveis" };
  return { ok: true };
}

export function raceDoppelAssimilate(
  state: PassiveCombatState,
  doppel: Character,
  target: Character,
): { next: Character; note: string } | { error: string } {
  const check = raceDoppelCanAssimilate(state, doppel, target);
  if (!check.ok) return { error: check.reason ?? "falha" };

  const snapshot: DoppelSnapshot = {
    raceId: doppel.raceId,
    classId: doppel.classId,
    affinityId: doppel.affinityId,
    allocated: { ...doppel.allocated },
    current: { ...doppel.current },
    skills: doppel.skills.map((s) => ({ ...s })),
    personalPassive: { ...doppel.personalPassive },
  };

  const e = ensure(state, doppel.id, "race:doppel:assimilacao", "Assimilação", {
    stacks: 5,
    maxStacks: 5,
    active: true,
    meta: { used: true, assimilating: true },
  });
  e.stacks = 5;
  e.active = true;
  e.meta = {
    used: true,
    assimilating: true,
    snapshot: JSON.stringify(snapshot),
    targetId: target.id,
    targetName: target.name,
  };

  const next: Character = {
    ...doppel,
    raceId: target.raceId,
    classId: target.classId,
    affinityId: target.affinityId,
    allocated: { ...target.allocated },
    current: { ...target.current },
    skills: target.skills.map((s) => ({ ...s })),
    // passiva racial do alvo não vira personalPassive permanente; combat usa raceId copiado
  };
  return {
    next,
    note: `Assimilou ${target.name} (forma original salva; termina com HP/MP/EST 0)`,
  };
}

export function raceDoppelTryRestore(
  state: PassiveCombatState,
  ch: Character,
): { restored: Character; note: string } | null {
  const e = entry(state, ch.id, "race:doppel:assimilacao");
  if (!e?.meta.assimilating || !e.meta.snapshot) return null;
  if (ch.current.hp > 0 && ch.current.mp > 0 && ch.current.est > 0) return null;

  try {
    const snapshot = JSON.parse(String(e.meta.snapshot)) as DoppelSnapshot;
    e.meta = { ...e.meta, assimilating: false, ready: false };
    e.active = false;
    const restored: Character = {
      ...ch,
      raceId: snapshot.raceId,
      classId: snapshot.classId,
      affinityId: snapshot.affinityId as Character["affinityId"],
      allocated: { ...snapshot.allocated },
      current: { ...snapshot.current },
      skills: snapshot.skills.map((s) => ({ ...s })),
      personalPassive: { ...snapshot.personalPassive },
    };
    return { restored, note: "Assimilação encerrada — forma original restaurada" };
  } catch {
    return null;
  }
}

/** Terreno natural para Dríade (arenas conhecidas) */
export const NATURAL_ARENA_IDS = new Set([
  "forest_arena.jpg",
  "earth_arena.jpg",
  "roses_arena.jpg",
  "sanctuary_arena.jpg",
  "sund_arena.jpg",
]);

export function isNaturalTerrain(arenaId: string | null | undefined): boolean {
  if (!arenaId) return false;
  return NATURAL_ARENA_IDS.has(arenaId);
}
