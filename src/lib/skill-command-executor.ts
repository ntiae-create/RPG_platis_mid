/**
 * Executor de comandos de habilidades — RPG Platis.
 * Consome parseSkillCommands e aplica efeitos com semântica de !N%.
 */
import { STATUS_EFFECTS, type Character, type StatusEffectInstance, type Stats } from "@/data/types";
import { addStatusEffect, removeStatusEffect } from "@/lib/status-effects";
import {
  type ParsedSkillCommand,
  type EffectRegistration,
  parseSkillCommands,
  isValidPercent,
  resolveEffectId,
} from "@/lib/skill-command-parser";
import { rollDie } from "@/lib/utils";

export type PercentSemantics = "intensity" | "proportion" | "apply" | "none";

export const DEFAULT_PERCENT: Record<string, number> = {
  heal: 50, recovery: 25, regeneration: 20, lifesteal: 25,
  bleeding: 100, poison: 100, burn: 100, freeze: 100, cold: 100, slow: 100,
  blind: 100, weakness: 100, stun: 100, immobilize: 100, cancel: 100, clean: 100,
  explosion: 100, wet: 100, infect: 100, silk_thread: 100, strengthening: 100,
  defender: 100, agile: 100, atk: 100, atk_mgc: 100, def: 100, res: 100, int: 100, agi: 100,
};

export const PERCENT_SEMANTICS: Record<string, PercentSemantics> = {
  heal: "proportion", recovery: "proportion", regeneration: "proportion", lifesteal: "proportion",
  bleeding: "intensity", poison: "intensity", burn: "intensity", explosion: "intensity",
  freeze: "apply", cold: "apply", slow: "apply", blind: "apply", weakness: "apply",
  stun: "apply", immobilize: "apply", wet: "apply", infect: "apply", silk_thread: "apply",
  cancel: "none", clean: "none",
  strengthening: "intensity", defender: "intensity", agile: "intensity",
  atk: "intensity", atk_mgc: "intensity", def: "intensity", res: "intensity", int: "intensity", agi: "intensity",
};

export type RuntimeEffectDefinition = {
  id: string; name: string;
  category: "debuff" | "buff" | "recovery" | "cleanse";
  description: string; maxStacks?: number; defaultDuration?: number | null;
  defaultPercent?: number; percentSemantics?: PercentSemantics;
};

const runtimeEffects = new Map<string, RuntimeEffectDefinition>();

export function registerEffect(registration: EffectRegistration): { ok: true; id: string } | { ok: false; error: string } {
  const name = registration.name.trim();
  if (!name) return { ok: false, error: "Nome do efeito é obrigatório" };
  const id = registration.config.id?.trim() || name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  if (!id) return { ok: false, error: "Não foi possível gerar id para o efeito" };
  const category = (registration.config.category as RuntimeEffectDefinition["category"]) || "debuff";
  if (!["debuff", "buff", "recovery", "cleanse"].includes(category)) return { ok: false, error: `Categoria inválida: ${category}` };
  const maxStacks = registration.config.maxstacks ? Number(registration.config.maxstacks) : registration.config.maxStacks ? Number(registration.config.maxStacks) : undefined;
  const defaultDuration = registration.config.duration !== undefined ? Number(registration.config.duration) : registration.config.duracao !== undefined ? Number(registration.config.duracao) : null;
  const defaultPercent = registration.config.percent ? Number(registration.config.percent) : registration.config.percentual ? Number(registration.config.percentual) : 100;
  if (defaultPercent !== undefined && !isValidPercent(defaultPercent)) return { ok: false, error: `Percentual padrão inválido: ${defaultPercent}` };
  const def: RuntimeEffectDefinition = {
    id, name, category,
    description: registration.config.description || registration.config.descricao || name,
    maxStacks: Number.isFinite(maxStacks as number) ? maxStacks : undefined,
    defaultDuration: Number.isFinite(defaultDuration as number) ? (defaultDuration as number) : null,
    defaultPercent: isValidPercent(defaultPercent) ? defaultPercent : 100,
    percentSemantics: (registration.config.semantics as PercentSemantics) || (registration.config.semantica as PercentSemantics) || "apply",
  };
  runtimeEffects.set(id, def);
  DEFAULT_PERCENT[id] = def.defaultPercent ?? 100;
  PERCENT_SEMANTICS[id] = def.percentSemantics ?? "apply";
  return { ok: true, id };
}

export function getRuntimeEffect(id: string) { return runtimeEffects.get(id); }
export function clearRuntimeEffects() { runtimeEffects.clear(); }

export function rollDiceExpression(expr: { count: number; sides: number }): number {
  let total = 0;
  for (let i = 0; i < expr.count; i++) total += rollDie(expr.sides);
  return total;
}

export function rollAllDice(dice: ParsedSkillCommand["dice"]): { total: number; rolls: number[] } {
  const rolls: number[] = [];
  let total = 0;
  for (const d of dice) { const value = rollDiceExpression(d); rolls.push(value); total += value; }
  return { total, rolls };
}

export type CommandExecutionResult = {
  effectId: string; applied: boolean; value: number; percentUsed: number;
  duration: number | null; stacks: number; notes: string[];
  directHeal?: number; directDamage?: number; lifestealPercent?: number;
};

export type SkillCommandsExecutionResult = {
  results: CommandExecutionResult[]; effects: StatusEffectInstance[];
  errors: string[]; notes: string[]; totalHeal: number; totalDamage: number; lifestealPercent: number;
};

export type ExecuteContext = {
  attacker?: Character | null; defender?: Character | null;
  damageDealt?: number; currentEffects?: StatusEffectInstance[]; random?: () => number;
};

function resolvePercent(cmd: ParsedSkillCommand): number {
  if (cmd.percent !== null && isValidPercent(cmd.percent)) return cmd.percent;
  return DEFAULT_PERCENT[cmd.effectId] ?? 100;
}

function resolveDuration(cmd: ParsedSkillCommand): number | null {
  const raw = cmd.params["duração"] ?? cmd.params.duracao ?? cmd.params.duration;
  if (raw !== undefined) { const n = Number(raw); if (Number.isFinite(n) && n >= 0) return n; }
  const defaults: Record<string, number | null> = {
    bleeding: 2, stun: 1, freeze: 1, cold: 2, slow: 2, infect: 1, burn: 3, blind: 1,
    weakness: 2, cancel: 1, silk_thread: null, immobilize: 1, poison: 2, explosion: null,
    wet: 2, atk: 2, atk_mgc: 2, def: 2, res: 2, int: 2, agi: 2, strengthening: 2,
    defender: 2, agile: 2, heal: null, recovery: 2, lifesteal: null, regeneration: 2, clean: 1,
  };
  const runtime = runtimeEffects.get(cmd.effectId);
  if (runtime?.defaultDuration !== undefined) return runtime.defaultDuration;
  return defaults[cmd.effectId] ?? null;
}

function maxHpOf(ch: Character | null | undefined): number {
  if (!ch) return 0;
  const anyCh = ch as Character & { stats?: Stats; base?: Stats };
  if (anyCh.stats?.hp && anyCh.stats.hp > 0) return anyCh.stats.hp;
  if (anyCh.base?.hp && anyCh.base.hp > 0) return anyCh.base.hp;
  return Math.max(ch.current?.hp ?? 0, 1);
}

function executeSingleCommand(cmd: ParsedSkillCommand, ctx: ExecuteContext, effects: StatusEffectInstance[]) {
  const notes: string[] = [];
  const percent = resolvePercent(cmd);
  const semantics = PERCENT_SEMANTICS[cmd.effectId] ?? "apply";
  const duration = resolveDuration(cmd);
  const targetId = ctx.defender?.id ?? "target";
  const sourceId = ctx.attacker?.id;
  let value = 0, stacks = 1, applied = true, directHeal = 0, directDamage = 0;
  let lifestealPercent: number | undefined;
  let nextEffects = effects;
  const diceRoll = cmd.dice.length > 0 ? rollAllDice(cmd.dice) : null;
  if (diceRoll) { value = diceRoll.total; notes.push(`Rolagem ${cmd.dice.map((d) => d.raw).join("+")} = ${diceRoll.total}`); }

  switch (cmd.effectId) {
    case "heal": {
      const base = maxHpOf(ctx.defender ?? ctx.attacker);
      directHeal = diceRoll ? Math.max(0, Math.floor(value * (percent / 100))) : Math.max(0, Math.floor(base * (percent / 100)));
      value = directHeal;
      notes.push(`Cura ${directHeal} HP (!${percent}%)`);
      nextEffects = addStatusEffect(nextEffects, "heal", targetId, { sourceId, stacks: 1, duration: null });
      break;
    }
    case "recovery":
    case "regeneration": {
      const base = maxHpOf(ctx.defender ?? ctx.attacker);
      const perTurn = diceRoll ? Math.max(0, Math.floor(value * (percent / 100))) : Math.max(0, Math.floor(base * (percent / 100)));
      value = perTurn;
      nextEffects = addStatusEffect(nextEffects, cmd.effectId, targetId, { sourceId, stacks: 1, duration });
      notes.push(`${STATUS_EFFECTS[cmd.effectId]?.name ?? cmd.effectId}: ${perTurn} HP/turno (!${percent}%)`);
      break;
    }
    case "lifesteal": {
      lifestealPercent = percent; value = percent;
      nextEffects = addStatusEffect(nextEffects, "lifesteal", sourceId ?? targetId, { sourceId, stacks: 1, duration });
      notes.push(`Roubo de vida ${percent}% do dano causado`);
      break;
    }
    case "bleeding":
    case "poison": {
      const tick = diceRoll ? Math.max(1, Math.floor(value * (percent / 100))) : Math.max(1, Math.floor(2 * (percent / 100)));
      value = tick;
      nextEffects = addStatusEffect(nextEffects, cmd.effectId, targetId, { sourceId, stacks: 1, duration });
      notes.push(`${STATUS_EFFECTS[cmd.effectId]?.name}: ${tick}/turno (!${percent}%)`);
      break;
    }
    case "burn": {
      stacks = percent >= 50 ? Math.min(5, Math.ceil(percent / 20)) : Math.max(1, Math.round(percent / 100));
      nextEffects = addStatusEffect(nextEffects, "burn", targetId, { sourceId, stacks, duration });
      value = stacks;
      notes.push(`Queimadura x${stacks} (!${percent}%)`);
      break;
    }
    case "clean": {
      for (const d of Object.values(STATUS_EFFECTS).filter((x) => x.category === "debuff")) {
        nextEffects = removeStatusEffect(nextEffects, d.id, targetId, 99);
      }
      nextEffects = addStatusEffect(nextEffects, "clean", targetId, { sourceId, stacks: 1, duration: duration ?? 1 });
      notes.push("Limpeza: debuffs removidos");
      break;
    }
    case "cancel": {
      nextEffects = addStatusEffect(nextEffects, "cancel", targetId, { sourceId, stacks: 1, duration: duration ?? 1 });
      notes.push("Cancelamento aplicado");
      break;
    }
    default: {
      const def = STATUS_EFFECTS[cmd.effectId] ?? runtimeEffects.get(cmd.effectId);
      if (!def && !STATUS_EFFECTS[cmd.effectId]) { applied = false; notes.push(`Efeito não registrado: ${cmd.effectId}`); break; }
      if (semantics === "apply" && percent < 100 && (cmd.params.chance === "true" || cmd.params.chance === "1")) {
        const roll = (ctx.random ?? Math.random)();
        if (roll > percent / 100) {
          applied = false;
          notes.push(`${def?.name ?? cmd.effectId} falhou (!${percent}%)`);
          break;
        }
      }
      if (semantics === "intensity" && percent !== 100) stacks = Math.max(1, Math.round(percent / 100));
      nextEffects = addStatusEffect(nextEffects, cmd.effectId, targetId, { sourceId, stacks, duration });
      value = stacks;
      notes.push(`${STATUS_EFFECTS[cmd.effectId]?.name ?? cmd.effectId} aplicado` + (percent !== 100 ? ` (!${percent}%)` : ""));
      break;
    }
  }

  return {
    result: { effectId: cmd.effectId, applied, value, percentUsed: percent, duration, stacks, notes, directHeal: directHeal || undefined, directDamage: directDamage || undefined, lifestealPercent },
    effects: nextEffects,
  };
}

export function executeSkillCommands(skillText: string, ctx: ExecuteContext = {}): SkillCommandsExecutionResult {
  const parsed = parseSkillCommands(skillText);
  const errors = [...parsed.errors];
  const notes: string[] = [];
  const results: CommandExecutionResult[] = [];
  let effects = ctx.currentEffects ? [...ctx.currentEffects] : [];
  let totalHeal = 0, totalDamage = 0, lifestealPercent = 0;

  for (const reg of parsed.registrations) {
    const outcome = registerEffect(reg);
    if (outcome.ok) notes.push(`Efeito registrado: ${reg.name} (id=${outcome.id})`);
    else errors.push(outcome.error);
  }

  for (const cmd of parsed.commands) {
    if (!STATUS_EFFECTS[cmd.effectId] && !runtimeEffects.has(cmd.effectId)) {
      errors.push(`Efeito sem definição: ${cmd.effectId} (comando /${cmd.rawName})`);
      continue;
    }
    const { result, effects: next } = executeSingleCommand(cmd, ctx, effects);
    effects = next;
    results.push(result);
    notes.push(...result.notes);
    if (result.directHeal) totalHeal += result.directHeal;
    if (result.directDamage) totalDamage += result.directDamage;
    if (result.lifestealPercent) lifestealPercent = Math.max(lifestealPercent, result.lifestealPercent);
  }

  return { results, effects, errors, notes, totalHeal, totalDamage, lifestealPercent };
}

export function applyExecutionToCharacters(
  execution: SkillCommandsExecutionResult,
  attacker: Character | null | undefined,
  defender: Character | null | undefined,
  damageDealt = 0,
) {
  let healApplied = execution.totalHeal;
  let lifestealApplied = 0;
  let nextAttacker = attacker ? { ...attacker, current: { ...attacker.current } } : undefined;
  let nextDefender = defender ? { ...defender, current: { ...defender.current } } : undefined;

  if (nextDefender && execution.totalHeal > 0) {
    nextDefender.current.hp = Math.max(0, nextDefender.current.hp + execution.totalHeal);
  } else if (nextAttacker && execution.totalHeal > 0 && !nextDefender) {
    nextAttacker.current.hp = Math.max(0, nextAttacker.current.hp + execution.totalHeal);
  }

  if (execution.lifestealPercent > 0 && damageDealt > 0 && nextAttacker) {
    lifestealApplied = Math.floor(damageDealt * (execution.lifestealPercent / 100));
    nextAttacker.current.hp = Math.max(0, nextAttacker.current.hp + lifestealApplied);
    healApplied += lifestealApplied;
  }

  return { attacker: nextAttacker, defender: nextDefender, healApplied, lifestealApplied };
}

export { resolveEffectId, parseSkillCommands };
