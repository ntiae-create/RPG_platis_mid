#!/usr/bin/env node
/**
 * Restaura src/lib/store.ts (completo + integração de comandos de habilidade).
 * Uso: node scripts/restore-store-with-skill-commands.mjs
 * Depois: git add src/lib/store.ts && git commit -m "fix: restaura store.ts" && git push
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(__dirname, "..", "src", "lib", "store.ts");

// Prefer restoring from git history if available (faster, no embedded payload)
try {
  const fromGit = execSync("git show 873fd95a8c0e:src/lib/store.ts", {
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
  });
  let text = fromGit;
  const oldImport =
    'import { applyDamage, resolveAttack, resolveEnemyAttack, type CombatKind } from "./combat";';
  const newImport =
    oldImport +
    '\nimport { runSkillCommandsFromDescription, skillHasCommands } from "./skill-combat-integration";';
  if (!text.includes("skill-combat-integration") && text.includes(oldImport)) {
    text = text.replace(oldImport, newImport);
  }
  const anchor = `        }\n\n        const defeatedCharacter = get().characters[def.id];\n        const defeatedEnemy = get().combatEnemies[def.id];`;
  const insertion = `        }\n\n        // --- Comandos de habilidade (/efeito [dados] !N%) ---\n        if (\n          skill &&\n          skill.status === "approved" &&\n          skillHasCommands(skill) &&\n          "raceId" in atk\n        ) {\n          const cmdResult = runSkillCommandsFromDescription(skill.description, {\n            attacker: "raceId" in atk ? (get().characters[atk.id] ?? atk) : null,\n            defender: "raceId" in def ? (get().characters[def.id] ?? def) : null,\n            damageDealt: res.hit ? res.damage : 0,\n          });\n\n          if (cmdResult.attacker && "raceId" in atk) {\n            get().patchCharacter(atk.id, { current: cmdResult.attacker.current });\n          }\n          if (cmdResult.defender && "raceId" in def) {\n            get().patchCharacter(def.id, { current: cmdResult.defender.current });\n          }\n          for (const entry of cmdResult.logs) {\n            res.log.push(entry);\n          }\n        }\n\n        const defeatedCharacter = get().characters[def.id];\n        const defeatedEnemy = get().combatEnemies[def.id];`;
  if (!text.includes("runSkillCommandsFromDescription") && text.includes(anchor)) {
    text = text.replace(anchor, insertion);
  }
  fs.writeFileSync(target, text);
  console.log("OK (via git history):", target, text.length, "bytes");
  console.log("Integração:", text.includes("skill-combat-integration") ? "OK" : "AUSENTE");
  process.exit(0);
} catch (e) {
  console.log("git show falhou, tentando apply script...");
}

// Fallback: apply-skill-commands-to-store.mjs after restoring base from apply patch
try {
  execSync("node scripts/apply-skill-commands-to-store.mjs", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });
  console.log("OK via apply-skill-commands-to-store.mjs");
} catch (e2) {
  console.error("Falha. Restaure manualmente:");
  console.error("  git show 873fd95a8c0e:src/lib/store.ts > src/lib/store.ts");
  console.error("  node scripts/apply-skill-commands-to-store.mjs");
  process.exit(1);
}
