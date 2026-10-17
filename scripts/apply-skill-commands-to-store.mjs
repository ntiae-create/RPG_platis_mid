#!/usr/bin/env node
/**
 * Aplica a integração de comandos de habilidade em src/lib/store.ts
 * Uso: node scripts/apply-skill-commands-to-store.mjs
 */
import fs from "node:fs";
import path from "node:path";

const storePath = path.join(process.cwd(), "src/lib/store.ts");
let store = fs.readFileSync(storePath, "utf8");

if (store.includes("skill-combat-integration")) {
  console.log("Já integrado.");
  process.exit(0);
}

const oldImport = 'import { applyDamage, resolveAttack, resolveEnemyAttack, type CombatKind } from "./combat";';
const newImport = oldImport + '\nimport { runSkillCommandsFromDescription, skillHasCommands } from "./skill-combat-integration";';
if (!store.includes(oldImport)) {
  console.error("Âncora de import não encontrada");
  process.exit(1);
}
store = store.replace(oldImport, newImport);

const anchor = `        }

        const defeatedCharacter = get().characters[def.id];
        const defeatedEnemy = get().combatEnemies[def.id];`;

const insertion = `        }

        // --- Comandos de habilidade (/efeito [dados] !N%) ---
        if (
          skill &&
          skill.status === "approved" &&
          skillHasCommands(skill) &&
          "raceId" in atk
        ) {
          const cmdResult = runSkillCommandsFromDescription(skill.description, {
            attacker: "raceId" in atk ? (get().characters[atk.id] ?? atk) : null,
            defender: "raceId" in def ? (get().characters[def.id] ?? def) : null,
            damageDealt: res.hit ? res.damage : 0,
          });

          if (cmdResult.attacker && "raceId" in atk) {
            get().patchCharacter(atk.id, { current: cmdResult.attacker.current });
          }
          if (cmdResult.defender && "raceId" in def) {
            get().patchCharacter(def.id, { current: cmdResult.defender.current });
          }
          for (const entry of cmdResult.logs) {
            res.log.push(entry);
          }
        }

        const defeatedCharacter = get().characters[def.id];
        const defeatedEnemy = get().combatEnemies[def.id];`;

if (!store.includes(anchor)) {
  console.error("Âncora de rollCombat não encontrada");
  process.exit(1);
}
store = store.replace(anchor, insertion);
fs.writeFileSync(storePath, store);
console.log("Integração aplicada em src/lib/store.ts");
