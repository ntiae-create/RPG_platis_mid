#!/usr/bin/env node
/**
 * Corrige resolveEnemyAttack em src/lib/combat.ts (passiveState indefinido).
 * Idempotente.
 */
import { readFileSync, writeFileSync } from "fs";

const f = "src/lib/combat.ts";
let t = readFileSync(f, "utf8");

if (
  t.includes("const passiveState = opts.passiveState ?? emptyPassiveState();") &&
  t.includes('if ("raceId" in opts.defender)')
) {
  console.log("combat.ts já corrigido.");
  process.exit(0);
}

const old = `export function resolveEnemyAttack(opts: {
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
      \`${opts.attacker.name} D20 = ${attackerRoll}  ·  ${opts.defender.name} D20 = ${defenderRoll}\`,
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
`;

const neu = `export function resolveEnemyAttack(opts: {
  attacker: Character | CombatEnemy;
  defender: Character | CombatEnemy;
  kind: CombatKind;
  statusEffects?: StatusEffectInstance[];
  attackerRoll?: number;
  defenderRoll?: number;
  passiveState?: PassiveCombatState;
}): CombatResolution {
  const notes: string[] = [];
  const logs: CombatLogEntry[] = [];
  const passiveState = opts.passiveState ?? emptyPassiveState();
  const attackerRoll = opts.attackerRoll ?? rollDie(20);
  const defenderRoll = opts.defenderRoll ?? rollDie(20);
  const aBase = "raceId" in opts.attacker ? finalStats(opts.attacker as Character) : opts.attacker.stats;
  const dBase = "raceId" in opts.defender ? finalStats(opts.defender as Character) : opts.defender.stats;
  const aStats = applyCombatStatusStats(aBase, opts.attacker.id, opts.statusEffects);
  const dStats = applyCombatStatusStats(dBase, opts.defender.id, opts.statusEffects);

  logs.push(
    log(
      "roll",
      \`${opts.attacker.name} D20 = ${attackerRoll}  ·  ${opts.defender.name} D20 = ${defenderRoll}\`,
    ),
  );

  if ("raceId" in opts.defender) {
    const mir = raceDoppelMirrorAbsorb(passiveState, opts.defender as Character);
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
`;

if (!t.includes(old)) {
  console.error("Marker resolveEnemyAttack não encontrado — arquivo já diferente?");
  process.exit(1);
}
t = t.replace(old, neu);
writeFileSync(f, t);
console.log("OK: combat.ts corrigido (" + t.length + " bytes)");
