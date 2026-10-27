#!/usr/bin/env node
/** Corrige resolveEnemyAttack no store (passa passiveState). Idempotente. */
import { readFileSync, writeFileSync } from "fs";
const f = "src/lib/store.ts";
let t = readFileSync(f, "utf8");
let n = 0;
const a = `          : resolveEnemyAttack({
              attacker: atk,
              defender: def,
              kind,
              statusEffects: s.combatStatusEffects,
            });`;
const b = `          : resolveEnemyAttack({
              attacker: atk,
              defender: def,
              kind,
              statusEffects: s.combatStatusEffects,
              passiveState: s.combatPassiveState,
            });`;
if (t.includes(a)) { t = t.replace(a, b); n++; }
const c = `          : resolveEnemyAttack({
              attacker: get().characters[def.id],
              defender: atk,
              kind: "physical",
            });`;
const d = `          : resolveEnemyAttack({
              attacker: get().characters[def.id] ?? get().combatEnemies[def.id] ?? def,
              defender: atk,
              kind: "physical",
              statusEffects: get().combatStatusEffects,
              passiveState: get().combatPassiveState,
            });`;
if (t.includes(c)) { t = t.replace(c, d); n++; }
writeFileSync(f, t);
console.log("store call sites atualizados:", n);
