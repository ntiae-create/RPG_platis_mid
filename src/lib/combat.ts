import { CLASS_BY_ID } from "@/data/classes";
import { RACE_BY_ID } from "@/data/races";
import type { Character, CombatEnemy, CombatLogEntry, Skill, Stats, StatusEffectInstance } from "@/data/types";
import { rollDie, uid } from "./utils";
import { finalStats } from "./stats";
import {
  applyStatMods,
  emptyPassiveState,
  raceAvoidAttack,
  raceDamageDealtMult,
  raceOnHitSeal,
  raceOnLethal,
  raceStatMods,
  raceStunChance,
  classAttackerStatMods,
  classAssassinDamageMult,
  classMagoConsumePrime,
  classBufaoConsumeExtremist,
  raceUmbralOnHit,
  raceKitsuneOnAttack,
  raceKitsuneTryAvoidHit,
  raceIsUntargetable,
  raceDoppelRoninDamageMult,
  raceDoppelMirrorAbsorb,
  raceDesperationStatMult,
  raceOrcPenaltyMods,
  classArqueiroOnHit,
  classCacadorOnHit,
  classPugilistaOnBasicHit,
  classCavaleiroConsumeInvestida,
  classAnatomistaOnHit,
  classCryomanteOnHit,
  classDruidaStatMods,
  classLanceiroStatMods,
  classGladiadorStatMods,
  classGladiadorOnHit,
  classDuelistaOnHit,
  classMongeOnHit,
  classGuerreiroStanceMods,
  classBufaoExtremistBonusDamage,
  classBufaoAgiBonus,
  type PassiveCombatState,
} from "./passives";

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
  applyBlind?: boolean;
  notes: string[];
  log: CombatLogEntry[];
  passiveState?: PassiveCombatState;
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
  attackerRoll?: number;
  defenderRoll?: number;
}): CombatResolution {
  const notes: string[] = [];
  const logs: CombatLogEntry[] = [];
  const attackerRoll = opts.attackerRoll ?? rollDie(20);
  const defenderRoll = opts.defenderRoll ?? rollDie(20);
  const aBase = "raceId" in opts.attacker ? finalStats(opts.attacker as Character) : opts.attacker.stats;
  const dBase = "raceId" in opts.defender ? finalStats(opts.defender as Character) : opts.defender.stats;
  const aStats = applyCombatStatusStats(aBase, opts.attacker.id, opts.statusEffects);
  const dStats = applyCombatStatusStats(dBase, opts.defender.id, opts.statusEffects);

  logs.push(
    log(
      "roll",
      `${opts.attacker.name} D20 = ${attackerRoll}  ·  ${opts.defender.name} D20 = ${defenderRoll}`,
    ),
  );


  {
    const mir = raceDoppelMirrorAbsorb(passiveState, opts.defender);
    if (mir.absorb) {
      if (mir.note) notes.push(mir.note);
      const reflect = Math.max(1, Math.round((opts.kind === "magical" ? aStats.atkMgc : aStats.atk) * 0.5));
      notes.push("MIRROR_REFLECT:"+reflect);
      logs.push(log("miss", opts.defender.name+": "+(mir.note||"Espelho")+" (devolve "+reflect+")"));
      return {
        attackerRoll, defenderRoll, hit:false, critMult:1, damage:0, damageDie:0, damageSides:0,
        counterAvailable: defenderRoll>=17 && defenderRoll>attackerRoll, stun:false, notes, log:logs, passiveState,
      };
    }
  }

  let hit = attackerRoll > defenderRoll;
  if (attackerRoll === defenderRoll) {
    hit = tieBreak(opts.kind, aStats, dStats) === "attacker";
  }
  // Cegueira no atacante (inimigo ou personagem): falha de precisão
  const attackerBlind = (opts.statusEffects ?? []).some(
    (effect) => effect.targetId === opts.attacker.id && effect.id === "blind" && effect.stacks > 0,
  );
  if (attackerBlind && attackerRoll < 12) {
    hit = false;
    notes.push("Cegueira: ataque falhou (precisão)");
  }

  const mult = hit ? critMult(attackerRoll) : 1;
  const sides = Math.max(1, opts.kind === "magical" ? aStats.atkMgc : aStats.atk);
  const damageDie = hit ? rollDie(sides) : 0;
  const damage = hit ? Math.round(damageDie * mult) : 0;
  const counterAvailable = defenderRoll >= 17 && defenderRoll > attackerRoll;

  if (hit) {
    logs.push(
      log(mult > 1 ? "crit" : "hit", `${opts.attacker.name} acerta ${opts.defender.name} por ${damage} de dano.`),
    );
  } else {
    logs.push(log("miss", `${opts.attacker.name} erra o ataque contra ${opts.defender.name}.`));
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
    stun: false,
    applyBlind: false,
    notes,
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
  passiveState?: PassiveCombatState;
}): CombatResolution {
  const notes: string[] = [];
  const logs: CombatLogEntry[] = [];
  const aRace = RACE_BY_ID[opts.attacker.raceId];
  const dRace = RACE_BY_ID[opts.defender.raceId];
  const aClass = CLASS_BY_ID[opts.attacker.classId];
  let aStats = applyCombatStatusStats(finalStats(opts.attacker), opts.attacker.id, opts.statusEffects);
  let dStats = applyCombatStatusStats(finalStats(opts.defender), opts.defender.id, opts.statusEffects);

  const passiveState = opts.passiveState ?? emptyPassiveState();

  const atkMods = raceStatMods(
    {
      self: opts.attacker,
      opponent: opts.defender,
      maxHp: aStats.hp,
      kind: opts.kind,
      allyNearby: opts.allyNearby,
      naturalTerrain: opts.naturalTerrain,
      fromStealth: opts.fromStealth,
      state: passiveState,
    },
    "attacker",
  );
  const defMods = raceStatMods(
    {
      self: opts.defender,
      opponent: opts.attacker,
      maxHp: dStats.hp,
      kind: opts.kind,
      state: passiveState,
    },
    "defender",
  );
  aStats = applyStatMods(aStats, atkMods);
  dStats = applyStatMods(dStats, defMods);
  const classMods = classAttackerStatMods(passiveState, opts.attacker, aStats.hp, aStats);
  aStats = applyStatMods(aStats, classMods);
  aStats = applyStatMods(aStats, classLanceiroStatMods(opts.attacker));
  aStats = applyStatMods(aStats, classDruidaStatMods(opts.attacker, Boolean(opts.naturalTerrain)));
  aStats = applyStatMods(aStats, classGladiadorStatMods(passiveState, opts.attacker));
  if (classMods.atk) notes.push(`Classe: ATK +${classMods.atk}`);
  if (classMods.atkMgc) notes.push(`Classe: ATK MGC +${classMods.atkMgc}`);
  if (classMods.agi) notes.push(`Classe: AGI +${classMods.agi}`);
  if (atkMods.atk) notes.push(`${aRace?.passive.name}: ATK ${atkMods.atk > 0 ? "+" : ""}${atkMods.atk}`);
  if (atkMods.agi) notes.push(`${aRace?.passive.name}: AGI ${atkMods.agi > 0 ? "+" : ""}${atkMods.agi}`);
  if (opts.attacker.raceId === "oni" && (defMods.def ?? 0) < 0) {
    notes.push("Presença Demoníaca: DEF do alvo −2");
  }
  if (opts.defender.raceId === "anao" && (defMods.def ?? 0) > 0) {
    notes.push("Constituição Anã: +2 DEF");
  }

  const attackerRoll = opts.attackerRoll ?? rollDie(20);
  const defenderRoll = opts.defenderRoll ?? rollDie(20);
  logs.push(
    log(
      "roll",
      `${opts.attacker.name} D20 = ${attackerRoll}  ·  ${opts.defender.name} D20 = ${defenderRoll}`,
    ),
  );

  if (raceAvoidAttack(opts.defender.raceId)) {
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
      passiveState,
    };
  }

  if (raceIsUntargetable(passiveState, opts.defender.id)) {
    notes.push("Alvo intocável (Forma Umbral / Ilusão)");
    logs.push(log("miss", `${opts.defender.name} não pode ser atacado neste momento.`));
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
      passiveState,
    };
  }

  {
    const kit = raceKitsuneTryAvoidHit(passiveState, opts.defender);
    if (kit.avoid) {
      if (kit.note) notes.push(kit.note);
      logs.push(log("miss", `${opts.defender.name}: ${kit.note ?? "ataque anulado"}`));
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
        passiveState,
      };
    }
  }

  let hit = attackerRoll > defenderRoll;
  const attackerBlind = (opts.statusEffects ?? []).some(
    (effect) => effect.targetId === opts.attacker.id && effect.id === "blind" && effect.stacks > 0,
  );
  if (attackerBlind && attackerRoll < 12) {
    hit = false;
    notes.push("Cegueira: ataque falhou (precisão)");
  }

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
  let applyBlind = false;

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
    {
      const ron = raceDoppelRoninDamageMult(opts.attacker);
      if (ron.mult !== 1) { damage = Math.round(damage * ron.mult); if (ron.note) notes.push(ron.note); }
      const dMult = raceDesperationStatMult(passiveState, opts.attacker.id);
      if (dMult !== 1) { damage = Math.round(damage * dMult); notes.push("Desespero x"+dMult); }
    }

    {
      const as = classAssassinDamageMult(opts.attacker, Boolean(opts.fromStealth));
      if (as.mult !== 1) {
        damage = Math.round(damage * as.mult);
        if (as.note) notes.push(as.note);
      }
      const mago = classMagoConsumePrime(passiveState, opts.attacker, opts.kind);
      if (mago.mult !== 1) {
        damage = Math.round(damage * mago.mult);
        if (mago.note) notes.push(mago.note);
      }
      if (classBufaoConsumeExtremist(passiveState, opts.attacker)) {
        notes.push("EXTREMISTA: crítico expandido");
      }
    }
    if (dRace?.id === "goblin") {
      /* goblin is attacker bonus */
    }
    {
      const defHpRatio = dStats.hp > 0 ? opts.defender.current.hp / dStats.hp : 1;
      const opp = raceDamageDealtMult(opts.attacker, defHpRatio);
      if (opp.mult !== 1) {
        damage = Math.round(damage * opp.mult);
        if (opp.note) notes.push(opp.note);
      }
      const taken = defMods.damageTakenMult ?? 1;
      if (taken !== 1) {
        damage = Math.round(damage * taken);
        notes.push("Escamas de Aço −10% físico");
      }
      const sealNote = raceOnHitSeal(passiveState, opts.attacker, opts.defender.id);
      if (sealNote) notes.push(sealNote);
      {
        {
          // Kitsune: 1 stack por turno de ataque — marca o turno; tick no nextTurn
          const k = passiveState.entries.find(
            (e) => e.characterId === opts.attacker.id && e.id === "race:kitsune:turn-flag",
          );
          if (!k) {
            passiveState.entries.push({
              id: "race:kitsune:turn-flag",
              characterId: opts.attacker.id,
              origin: "race",
              name: "Kitsune atacou",
              stacks: 1,
              maxStacks: 1,
              turnsRemaining: null,
              active: true,
              meta: { attacked: true },
            });
          } else {
            k.meta = { ...k.meta, attacked: true };
            k.active = true;
          }
        }
        // Lazuli (Dragonoide): marcas e Efeito da Morte são resolvidos no store
        // via combatStatusEffects (draconic-mark / dragon-fury) para evitar dano duplicado.
        const umb = raceUmbralOnHit(passiveState, opts.attacker, opts.defender.id);
        notes.push(...umb.notes);
        if (umb.applyBlind) {
          notes.push("Marca do Vazio: aplicar Cegueira (1 turno)");
          applyBlind = true;
        }
        if (!opts.skill) {
          const pug = classPugilistaOnBasicHit(passiveState, opts.attacker);
          if (pug.atk) aStats.atk += pug.atk;
          if (pug.agi) aStats.agi += pug.agi;
          if (pug.damageMult && pug.damageMult !== 1) {
            damage = Math.round(damage * pug.damageMult);
          }
          if (pug.note) notes.push(pug.note);
        }
        const arq = classArqueiroOnHit(passiveState, opts.attacker);
        if (arq.damageMult !== 1) damage = Math.round(damage * arq.damageMult);
        if (arq.note) notes.push(arq.note);

        {
          const mon = classMongeOnHit(passiveState, opts.attacker);
          if (mon.agi) aStats.agi += mon.agi;
          if (mon.def) aStats.def = (aStats.def||0) + mon.def;
          if (mon.note) notes.push(mon.note);
        }
        {
          const du = classDuelistaOnHit(passiveState, opts.attacker, opts.defender.id);
          if (du.mult && du.mult !== 1) damage = Math.round(damage * du.mult);
          if (du.note) notes.push(du.note);
        }
        {
          const gl = classGladiadorOnHit(passiveState, opts.attacker, opts.defender.id);
          if (gl.mult && gl.mult !== 1) damage = Math.round(damage * gl.mult);
          if (gl.note) notes.push(gl.note);
        }
        {
          const an = classAnatomistaOnHit(passiveState, opts.attacker, opts.defender.id);
          if (an.mult && an.mult !== 1) damage = Math.round(damage * an.mult);
          if (an.note) notes.push(an.note);
        }
        {
          const cr = classCryomanteOnHit(passiveState, opts.attacker, opts.defender.id);
          notes.push(...(cr.notes||[]));
          if (cr.applyFreeze) notes.push("Cryomante: aplicar Freeze 1 turno");
        }
        {
          const inv = classCavaleiroConsumeInvestida(passiveState, opts.attacker);
          if (inv.mult !== 1) { damage = Math.round(damage * inv.mult); if (inv.note) notes.push(inv.note); }
        }

        const cac = classCacadorOnHit(passiveState, opts.attacker, opts.defender.id);
        if (cac.damageMult !== 1) damage = Math.round(damage * cac.damageMult);
        if (cac.note) notes.push(cac.note);
        if (classBufaoConsumeExtremist(passiveState, opts.attacker)) {
          const bufao = classBufaoAgiBonus(passiveState, opts.attacker, aStats.agi);
          const extra = classBufaoExtremistBonusDamage(aStats.agi);
          damage += extra;
          notes.push(`EXTREMISTA: +${extra} dano (AGI)`);
        }
      }
    }
    // Magic Booster: bônus de ATK MGC via classAttackerStatMods (stacks)


    const stunChance = raceStunChance(opts.attacker.raceId);
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
    applyBlind,
    notes,
    log: logs,
    passiveState,
  };
}

export function applyDamage(
  ch: Character,
  amount: number,
  opts?: { roll?: () => number },
): { ch: Character; survivedAt1: boolean; stunnedNotDead?: boolean; note?: string } {
  const hp = ch.current.hp - amount;
  const result = raceOnLethal(ch, hp, opts?.roll ?? Math.random);
  return {
    ch: { ...ch, current: { ...ch.current, hp: Math.max(0, result.hp) } },
    survivedAt1: result.survivedAt1,
    stunnedNotDead: result.stunnedNotDead,
    note: result.note,
  };
}

export { emptyPassiveState };
export type { PassiveCombatState };
