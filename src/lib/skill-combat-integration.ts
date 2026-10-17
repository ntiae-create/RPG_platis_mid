/**
 * Integração dos comandos de habilidade com o fluxo de combate (rollCombat).
 *
 * Uso em store.ts → rollCombat, após resolver o ataque e aplicar dano:
 *
 *   import { runSkillCommandsFromDescription } from "@/lib/skill-combat-integration";
 *
 *   if (skill?.description) {
 *     const cmdResult = runSkillCommandsFromDescription(skill.description, {
 *       attacker: atk as Character,
 *       defender: def as Character,
 *       damageDealt: res.hit ? res.damage : 0,
 *     });
 *     // aplicar HP / logs retornados
 *   }
 *
 * Não altera o sistema de World Boss.
 */

import type { Character, CombatLogEntry, Skill } from "@/data/types";
import {
  executeSkillCommands,
  applyExecutionToCharacters,
  type SkillCommandsExecutionResult,
} from "@/lib/skill-command-executor";
import { uid } from "@/lib/utils";

export type SkillCommandCombatResult = {
  execution: SkillCommandsExecutionResult;
  /** Personagens com HP já ajustado (cura / lifesteal) */
  attacker?: Character;
  defender?: Character;
  /** Entradas de log para o combate */
  logs: CombatLogEntry[];
  healApplied: number;
  lifestealApplied: number;
};

function log(kind: CombatLogEntry["kind"], text: string): CombatLogEntry {
  return { id: uid("lg"), at: Date.now(), text, kind };
}

/**
 * Interpreta e executa os comandos presentes na description da habilidade.
 * Retorna efeitos, cura, lifesteal e logs prontos para o store consumir.
 */
export function runSkillCommandsFromDescription(
  description: string,
  opts: {
    attacker?: Character | null;
    defender?: Character | null;
    damageDealt?: number;
  },
): SkillCommandCombatResult {
  const execution = executeSkillCommands(description, {
    attacker: opts.attacker ?? null,
    defender: opts.defender ?? null,
    damageDealt: opts.damageDealt ?? 0,
  });

  const applied = applyExecutionToCharacters(
    execution,
    opts.attacker ?? null,
    opts.defender ?? null,
    opts.damageDealt ?? 0,
  );

  const logs: CombatLogEntry[] = [];

  for (const note of execution.notes) {
    logs.push(log("system", note));
  }
  for (const err of execution.errors) {
    logs.push(log("system", `⚠ ${err}`));
  }
  if (applied.healApplied > 0) {
    logs.push(log("heal", `Cura total aplicada: ${applied.healApplied} HP.`));
  }
  if (applied.lifestealApplied > 0) {
    logs.push(
      log(
        "heal",
        `Roubo de vida: ${applied.lifestealApplied} HP recuperados.`,
      ),
    );
  }
  for (const r of execution.results) {
    if (r.applied && r.effectId !== "heal" && r.effectId !== "lifesteal") {
      logs.push(
        log(
          "system",
          `Efeito ${r.effectId} aplicado` +
            (r.percentUsed !== 100 ? ` (!${r.percentUsed}%)` : "") +
            (r.duration != null ? ` · ${r.duration} turno(s)` : ""),
        ),
      );
    }
  }

  return {
    execution,
    attacker: applied.attacker,
    defender: applied.defender,
    logs,
    healApplied: applied.healApplied,
    lifestealApplied: applied.lifestealApplied,
  };
}

/**
 * Helper para extrair description de uma Skill aprovada.
 */
export function skillHasCommands(skill: Skill | null | undefined): boolean {
  if (!skill?.description) return false;
  return /\/[a-zA-ZÀ-ÿ]/.test(skill.description);
}
