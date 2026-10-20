import { CLASS_BY_ID } from "@/data/classes";
import { RACE_BY_ID } from "@/data/races";
import type { Character, CombatEnemy, CombatLogEntry, Skill, Stats, StatusEffectInstance } from "@/data/types";
import { rollDie, uid } from "./utils";
import { finalStats } from "./stats";

export type CombatKind = "physical" | "magical";

export type CombatResolution = {
  attackerRoll: number;
  defenderRoll: number;
  hit: boolean;
  critMult: number;
  damage: number;
  damageDie: number;
  damageSides: number;
  counterAvailable: boolean;
  stun: boolean;
  notes: string[];
  log: CombatLogEntry[];
};

function applyCombatStatusStats(
  base: Stats,
  targetId: string,
  effects: StatusEffectInstance[] = [],
): Stats {
  const stats = { ...base };
  const active = effects.filter(
    (effect) => effect.targetId === targetId && effect.stacks > 0,
  );

  const stacks = (id: string) =>
    active.filter((effect) => effect.id === id)
      .reduce((total, effect) => total + effect.stacks, 0);

  if (stacks("dragon-fury") > 0) {
    for (const key of ["hp", "mp", "est", "san", "atk", "atkMgc", "def", "res", "agi", "int"] as const) {
      stats[key] += 2;
    }
  }

  stats.atk += 2 * stacks("atk") + 2 * stacks("strengthening");
  stats.atkMgc += 2 * stacks("atk_mgc") + 2 * stacks("strengthening");
  stats.def += 2 * stacks("def") + 2 * stacks("defender") - 3 * stacks("weakness");
  stats.res += 2 * stacks("res") + 2 * stacks("defender");
  stats.int += 5 * stacks("int") + 5 * stacks("agile");
  stats.agi += 2 * stacks("agi") + 2 * stacks("agile") - 2 * stacks("slow") - stacks("cold");

  for (const key of ["atk", "atkMgc", "def", "res", "int", "agi"] as const) {
    stats[key] = Math.max(0, stats[key]);
  }
  return stats;
}

function log(kind: CombatLogEntry["kind"], text: string): CombatLogEntry {
  return { id: uid("lg"), at: Date.now(), text, kind };
}

function critMult(roll: number, extremist = false): number {
  if (extremist) {
    if (roll === 20) return 3;
    if (roll >= 13) return 2;
    return 1;
  }
  if (roll === 20) return 3;
  if (roll >= 15) return 2;
  return 1;
}

function tieBreak(
  kind: CombatKind,
  atk: Stats,
  def: Stats,
): "attacker" | "defender" {
  if (kind === "physical") {
    if (atk.atk !== def.def) return atk.atk > def.def ? "attacker" : "defender";
  } else if (atk.atkMgc !== def.res) {
    return atk.atkMgc > def.res ? "attacker" : "defender";
  }
  if (atk.res !== def.res) return atk.res > def.res ? "attacker" : "defender";
  if (atk.int !== def.int) return atk.int > def.int ? "attacker" : "defender";
  if (atk.est !== def.est) return atk.est > def.est ? "attacker" : "defender";
  return "defender";
}

export function resolveEnemyAttack(opts: {
  attacker: Character | CombatEnemy;
  defender: Character | CombatEnemy;
  kind: CombatKind;
  statusEffects?: StatusEffectInstance[];
}): CombatResolution {
  const attackerRoll = rollDie(20);
  const defenderRoll = rollDie(20);
  const aBase = "raceId" in opts.attacker ? finalStats(opts.attacker) : opts.attacker.stats;
  const dBase = "raceId" in opts.defender ? finalStats(opts.defender) : opts.defender.stats;
  const aStats = applyCombatStatusStats(aBase, opts.attacker.id, opts.statusEffects);
  const dStats = applyCombatStatusStats(dBase, opts.defender.id, opts.statusEffects);

  let hit = attackerRoll > defenderRoll;
  if (attackerRoll === defenderRoll) {
    if (opts.kind === "magical" ? aStats.atkMgc !== dStats.res : aStats.atk !== dStats.def) {
      hit = opts.kind === "magical" ? aStats.atkMgc > dStats.res : aStats.atk > dStats.def;
    } else if (aStats.res !== dStats.res) {
      hit = aStats.res > dStats.res;
    } else if (aStats.int !== dStats.int) {
      hit = aStats.int > dStats.int;
    } else {
      hit = aStats.est > dStats.est;
    }
  }

  const critMult = hit ? (attackerRoll === 20 ? 3 : attackerRoll >= 15 ? 2 : 1) : 1;
  const damageSides = Math.max(1, opts.kind === "magical" ? aStats.atkMgc : aStats.atk);
  const damageDie = hit ? rollDie(damageSides) : 0;
  const damage = hit ? damageDie * critMult : 0;
  const counterAvailable = defenderRoll >= 17 && defenderRoll > attackerRoll;

  const logs: CombatLogEntry[] = [
    log("roll", `${opts.attacker.name} D20 = ${attackerRoll} · ${opts.defender.name} D20 = ${defenderRoll}`),
  ];

  if (hit) {
    logs.push(log(critMult > 1 ? "crit" : "hit", `${opts.attacker.name} acerta ${opts.defender.name} por ${damage} de dano.`));
  } else {
    logs.push(log("miss", `${opts.attacker.name} erra o ataque contra ${opts.defender.name}.`));
  }

  return {
    attackerRoll,
    defenderRoll,
    hit,
    critMult,
    damage,
    damageDie,
    damageSides,
    counterAvailable,
    stun: false,
    notes: [],
    log: logs,
  };
}

export function resolveAttack(opts: {
  attacker: Character;
  defender: Character;
  statusEffects?: StatusEffectInstance[];
  kind: CombatKind;
  skill?: Skill | null;
  attackerRoll?: number;
  defenderRoll?: number;
  fromStealth?: boolean;
  allyNearby?: boolean;
  naturalTerrain?: boolean;
}): CombatResolution {
  const notes: string[] = [];
  const logs: CombatLogEntry[] = [];
  const aRace = RACE_BY_ID[opts.attacker.raceId];
  const dRace = RACE_BY_ID[opts.defender.raceId];
  const aClass = CLASS_BY_ID[opts.attacker.classId];
  const aStats = applyCombatStatusStats(finalStats(opts.attacker), opts.attacker.id, opts.statusEffects);
  const dStats = applyCombatStatusStats(finalStats(opts.defender), opts.defender.id, opts.statusEffects);

  if (aRace?.id === "besta" && opts.attacker.current.hp <= aStats.hp * 0.5) {
    aStats.atk += 3;
    notes.push("Frenesi: +3 ATK");
  }
  if (aRace?.id === "semi-besta" && opts.attacker.current.hp <= aStats.hp * 0.5) {
    aStats.agi += 2;
    notes.push("Frenesi Controlado: +2 AGI");
  }
  if (aRace?.id === "fae") {
    aStats.agi += 2;
    aStats.atk += 2;
    notes.push("Frenesi Maluco: +2 AGI +2 ATK");
  }
  if (opts.allyNearby && aRace?.id === "lupino") {
    aStats.agi += 2;
    notes.push("Instinto de Matilha: +2 AGI");
  }
  if (dRace?.id === "oni") {
    aStats.def = Math.max(0, aStats.def - 2);
  }

  const attackerRoll = opts.attackerRoll ?? rollDie(20);
  const defenderRoll = opts.defenderRoll ?? rollDie(20);
  logs.push(
    log(
      "roll",
      `${opts.attacker.name} D20 = ${attackerRoll}  ·  ${opts.defender.name} D20 = ${defenderRoll}`,
    ),
  );

  if (dRace?.id === "fae" && Math.random() < 0.2) {
    notes.push("Travessura: ataque evitado");
    logs.push(log("miss", `${opts.defender.name} evita completamente o ataque (Travessura).`));
    return {
      attackerRoll,
      defenderRoll,
      hit: false,
      critMult: 1,
      damage: 0,
      damageDie: 0,
      damageSides: 0,
      counterAvailable: defenderRoll >= 17 && defenderRoll > attackerRoll,
      stun: false,
      notes,
      log: logs,
    };
  }

  let hit = attackerRoll > defenderRoll;
  if (attackerRoll === defenderRoll) {
    const who = tieBreak(opts.kind, aStats, dStats);
    hit = who === "attacker";
    notes.push(`Empate resolvido por atributos → ${hit ? "acerto" : "erro"}`);
  }

  const extremist =
    aClass?.id === "bufao" && opts.attacker.current.hp <= aStats.hp * 0.25;
  const mult = hit ? critMult(attackerRoll, extremist) : 1;
  if (mult === 3) notes.push("Crítico ×3 (20)");
  else if (mult === 2) notes.push(extremist ? "Crítico EXTREMISTA ×2" : "Crítico ×2 (15–19)");

  let sides =
    opts.kind === "magical" ? Math.max(1, aStats.atkMgc) : Math.max(1, aStats.atk);
  let damageDie = 0;
  let damage = 0;
  let stun = false;

  if (hit) {
    if (opts.skill && (opts.skill.type === "ataque" || opts.skill.type === "ataque-magico")) {
      damageDie = rollDie(sides);
      damage = 2 + damageDie;
      notes.push(`Habilidade ofensiva: 2 + D${sides} = ${damage}`);
    } else {
      damageDie = rollDie(sides);
      damage = damageDie;
      notes.push(`Dado de dano D${sides} = ${damageDie}`);
    }
    damage *= mult;

    if (opts.fromStealth && aClass?.id === "assassino") {
      damage = Math.round(damage * 1.25);
      notes.push("Ponto Fraco +25%");
    }
    if (dRace?.id === "goblin") {
      /* goblin is attacker bonus */
    }
    if (aRace?.id === "goblin" && opts.defender.current.hp <= dStats.hp * 0.5) {
      damage = Math.round(damage * 1.2);
      notes.push("Oportunista +20%");
    }
    if (opts.kind === "physical" && dRace?.id === "lizard") {
      damage = Math.round(damage * 0.9);
      notes.push("Escamas de Aço −10% físico");
    }
    if (aClass?.id === "feiticeiro" && opts.kind === "magical") {
      damage = Math.round(damage * 1.15);
      notes.push("Magic Booster +15%");
    }

    const stunChance =
      aRace?.id === "elfo" ? 0.4 : aRace?.id === "meio-elfo" || aRace?.id === "gigante" ? 0.2 : 0;
    if (stunChance && Math.random() < stunChance) {
      stun = true;
      notes.push(`${aRace?.passive.name}: Stun`);
    }

    logs.push(
      log(
        mult > 1 ? "crit" : "hit",
        `${opts.attacker.name} acerta ${opts.defender.name} por ${damage} de dano${stun ? " e aplica Stun" : ""}.`,
      ),
    );
  } else {
    logs.push(log("miss", `${opts.attacker.name} erra o ataque contra ${opts.defender.name}.`));
  }

  const counterAvailable = defenderRoll >= 17 && defenderRoll > attackerRoll;
  if (counterAvailable) {
    notes.push("Contra-ataque disponível (D20 ≥ 17 e maior que o atacante)");
    logs.push(
      log(
        "counter",
        `${opts.defender.name} pode contra-atacar (−3 EST, sem crítico) ou esquivar/defender (0 EST).`,
      ),
    );
  }

  return {
    attackerRoll,
    defenderRoll,
    hit,
    critMult: mult,
    damage,
    damageDie,
    damageSides: sides,
    counterAvailable,
    stun,
    notes,
    log: logs,
  };
}

export function applyDamage(ch: Character, amount: number): { ch: Character; survivedAt1: boolean } {
  const race = RACE_BY_ID[ch.raceId];
  let hp = ch.current.hp - amount;
  let survivedAt1 = false;
  if (hp <= 0 && race?.id === "morto-vivo" && Math.random() < 0.2) {
    hp = 1;
    survivedAt1 = true;
  }
  if (hp <= 0 && race?.id === "homunculo") {
    hp = 0;
  }
  return {
    ch: { ...ch, current: { ...ch.current, hp: Math.max(0, hp) } },
    survivedAt1,
  };
}
