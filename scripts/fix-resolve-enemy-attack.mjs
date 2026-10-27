#!/usr/bin/env node
/** Corrige resolveEnemyAttack: passiveState estava indefinido e quebrava combate com NPC inimigo. */
import { readFileSync, writeFileSync } from "fs";

const f = "src/lib/combat.ts";
let t = readFileSync(f, "utf8");

if (t.includes("opts.passiveState ?? emptyPassiveState()")) {
  console.log("combat.ts ja corrigido.");
  process.exit(0);
}

if (!t.includes("raceDoppelMirrorAbsorb(passiveState, opts.defender)")) {
  console.error("Padrao nao encontrado em combat.ts");
  process.exit(1);
}

// 1) adicionar parametro passiveState na assinatura
t = t.replace(
  `  defenderRoll?: number;
}): CombatResolution {
  const notes: string[] = [];
  const logs: CombatLogEntry[] = [];
  const attackerRoll = opts.attackerRoll ?? rollDie(20);`,
  `  defenderRoll?: number;
  passiveState?: PassiveCombatState;
}): CombatResolution {
  const notes: string[] = [];
  const logs: CombatLogEntry[] = [];
  const passiveState = opts.passiveState ?? emptyPassiveState();
  const attackerRoll = opts.attackerRoll ?? rollDie(20);`,
);

// 2) so chamar espelho se defensor for personagem
t = t.replace(
  `{
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
  }`,
  `if ("raceId" in opts.defender) {
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
  }`,
);

if (!t.includes("opts.passiveState ?? emptyPassiveState()")) {
  console.error("Falha ao aplicar patch");
  process.exit(1);
}

writeFileSync(f, t);
console.log("OK: combat.ts corrigido");
