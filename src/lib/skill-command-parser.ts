/**
 * Parser de comandos de habilidades do RPG Platis.
 *
 * Sintaxe oficial:
 * - "/"          → identifica o comando que ativa um efeito
 * - "[ ... ]"    → dados numéricos / rolagens (ex.: [2d6])
 * - "!N%"        → porcentagem de aplicação do efeito (ex.: !50%)
 * - "/(Efeito) + { ... }" → registro/configuração de novos efeitos
 *
 * A porcentagem NÃO é convertida automaticamente em chance de ativação.
 * Cada efeito define semanticamente o que o percentual significa
 * (intensidade, proporção de dano/cura/roubo de vida, etc.).
 */

import { STATUS_EFFECTS, type StatusEffectDefinition } from "@/data/types";
import { SKILL_COMMANDS } from "@/data/skill-commands";

export type DiceExpression = {
  count: number;
  sides: number;
  raw: string;
};

export type ParsedSkillCommand = {
  rawName: string;
  effectId: string;
  definition: StatusEffectDefinition | null;
  dice: DiceExpression[];
  percent: number | null;
  params: Record<string, string>;
  configBlock: string | null;
  original: string;
};

export type ParseSkillCommandsResult = {
  commands: ParsedSkillCommand[];
  registrations: EffectRegistration[];
  errors: string[];
};

export type EffectRegistration = {
  name: string;
  config: Record<string, string>;
  original: string;
};

const COMMAND_ALIASES: Record<string, string> = {
  sangramento: "bleeding",
  sangrando: "bleeding",
  bleeding: "bleeding",
  bleed: "bleeding",
  congelamento: "freeze",
  congelado: "freeze",
  freeze: "freeze",
  frozen: "freeze",
  frio: "cold",
  cold: "cold",
  lentidao: "slow",
  "lentidão": "slow",
  slow: "slow",
  slowness: "slow",
  veneno: "poison",
  envenenamento: "poison",
  poison: "poison",
  poisoning: "poison",
  queimadura: "burn",
  queimado: "burn",
  burn: "burn",
  burning: "burn",
  cegueira: "blind",
  cego: "blind",
  blind: "blind",
  blindness: "blind",
  fraqueza: "weakness",
  enfraquecido: "weakness",
  weakness: "weakness",
  weaken: "weakness",
  cancelamento: "cancel",
  cancel: "cancel",
  cancellation: "cancel",
  limpeza: "clean",
  clean: "clean",
  cleanse: "clean",
  purify: "clean",
  regeneracao: "regeneration",
  "regeneração": "regeneration",
  regeneration: "regeneration",
  regen: "regeneration",
  fortalecimento: "strengthening",
  fortalecido: "strengthening",
  strengthen: "strengthening",
  strengthening: "strengthening",
  cura: "heal",
  heal: "heal",
  healing: "heal",
  hp: "heal",
  recuperacao: "recovery",
  "recuperação": "recovery",
  recovery: "recovery",
  recover: "recovery",
  "roubo-de-vida": "lifesteal",
  "roubo de vida": "lifesteal",
  roubodevida: "lifesteal",
  lifesteal: "lifesteal",
  "life steal": "lifesteal",
  vampirism: "lifesteal",
  imobilizacao: "immobilize",
  "imobilização": "immobilize",
  imobilizado: "immobilize",
  immobilize: "immobilize",
  atordoamento: "stun",
  atordoar: "stun",
  stun: "stun",
  stunning: "stun",
  explosao: "explosion",
  "explosão": "explosion",
  explosion: "explosion",
  molhado: "wet",
  wet: "wet",
  infectar: "infect",
  infeccao: "infect",
  "infecção": "infect",
  infect: "infect",
  infection: "infect",
  "fio-de-seda": "silk_thread",
  "fio de seda": "silk_thread",
  silk_thread: "silk_thread",
  "silk thread": "silk_thread",
  atk: "atk",
  "atk-mgc": "atk_mgc",
  "atk mgc": "atk_mgc",
  atkmgc: "atk_mgc",
  def: "def",
  res: "res",
  int: "int",
  agi: "agi",
  defensor: "defender",
  defender: "defender",
  agil: "agile",
  "ágil": "agile",
  agile: "agile",
};

function normalizeKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function resolveEffectId(rawName: string): string | null {
  const key = normalizeKey(rawName);
  if (COMMAND_ALIASES[key]) return COMMAND_ALIASES[key];
  if (STATUS_EFFECTS[key]) return key;
  if (STATUS_EFFECTS[rawName]) return rawName;

  for (const cmd of SKILL_COMMANDS) {
    const cmdName = normalizeKey(cmd.command.replace(/^\//, ""));
    if (cmdName === key) {
      for (const p of cmd.parameters) {
        const pk = normalizeKey(p);
        if (COMMAND_ALIASES[pk]) return COMMAND_ALIASES[pk];
        if (STATUS_EFFECTS[pk]) return pk;
      }
    }
    for (const p of cmd.parameters) {
      if (normalizeKey(p) === key && COMMAND_ALIASES[normalizeKey(p)]) {
        return COMMAND_ALIASES[normalizeKey(p)];
      }
    }
  }
  return null;
}

const DICE_RE = /\[(\d+)\s*[dD]\s*(\d+)\]/g;
const PERCENT_RE = /!(\d+(?:[.,]\d+)?)\s*%/g;
const PARAM_RE = /([\p{L}\w][\p{L}\w-]*)\s*=\s*([^\s/[\]{}!]+)/gu;

function parseDice(text: string): DiceExpression[] {
  const result: DiceExpression[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(DICE_RE.source, "g");
  while ((m = re.exec(text)) !== null) {
    const count = Number(m[1]);
    const sides = Number(m[2]);
    if (count > 0 && sides > 0 && count <= 100 && sides <= 1000) {
      result.push({ count, sides, raw: m[0] });
    }
  }
  return result;
}

function parsePercent(text: string, errors: string[]): number | null {
  const matches: number[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(PERCENT_RE.source, "g");
  while ((m = re.exec(text)) !== null) {
    const raw = m[1].replace(",", ".");
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      errors.push(`Percentual inválido: !${m[1]}% (deve estar entre 0 e 100)`);
      continue;
    }
    matches.push(value);
  }
  if (matches.length === 0) return null;
  return matches[matches.length - 1];
}

function parseParams(text: string): Record<string, string> {
  const params: Record<string, string> = {};
  let m: RegExpExecArray | null;
  const re = new RegExp(PARAM_RE.source, PARAM_RE.flags || "g");
  while ((m = re.exec(text)) !== null) {
    params[m[1].toLowerCase()] = m[2];
  }
  return params;
}

function extractConfigBlock(text: string): string | null {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return text.slice(start + 1, i).trim();
    }
  }
  return null;
}

function parseConfigObject(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  const parts = block.split(/[,\n]/).map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const eq = part.match(/^([\w-]+)\s*[:=]\s*(.+)$/);
    if (eq) {
      out[eq[1].toLowerCase()] = eq[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return out;
}

export function parseSkillCommands(text: string): ParseSkillCommandsResult {
  const commands: ParsedSkillCommand[] = [];
  const registrations: EffectRegistration[] = [];
  const errors: string[] = [];

  if (!text || typeof text !== "string") {
    return { commands, registrations, errors };
  }

  const regRe = /\/\(([^)]+)\)\s*\+\s*\{([^}]*)\}/g;
  let regMatch: RegExpExecArray | null;
  while ((regMatch = regRe.exec(text)) !== null) {
    const name = regMatch[1].trim();
    const config = parseConfigObject(regMatch[2]);
    if (!name) {
      errors.push("Registro de efeito sem nome: /( ) + { ... }");
      continue;
    }
    registrations.push({ name, config, original: regMatch[0] });
  }

  const cmdRe = /\/([a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ0-9_-]*)/g;
  let cmdMatch: RegExpExecArray | null;
  const seenRanges: Array<{ start: number; end: number }> = [];

  while ((cmdMatch = cmdRe.exec(text)) !== null) {
    const start = cmdMatch.index;
    if (text[start + 1] === "(") continue;

    let end = text.length;
    let depthBracket = 0;
    let depthBrace = 0;
    for (let i = start + 1; i < text.length; i++) {
      const ch = text[i];
      if (ch === "[") depthBracket++;
      else if (ch === "]") depthBracket = Math.max(0, depthBracket - 1);
      else if (ch === "{") depthBrace++;
      else if (ch === "}") depthBrace = Math.max(0, depthBrace - 1);
      else if (ch === "/" && depthBracket === 0 && depthBrace === 0) {
        end = i;
        break;
      }
    }

    if (seenRanges.some((r) => start < r.end && end > r.start)) continue;
    seenRanges.push({ start, end });

    const segment = text.slice(start, end).trim();
    const rawName = cmdMatch[1].trim();

    if (segment.includes("+") && segment.includes("{")) {
      continue;
    }

    const effectId = resolveEffectId(rawName);
    if (!effectId) {
      errors.push(`Comando desconhecido: /${rawName}`);
      continue;
    }

    const definition = STATUS_EFFECTS[effectId] ?? null;
    const dice = parseDice(segment);
    const percent = parsePercent(segment, errors);
    const params = parseParams(segment);
    const configBlock = extractConfigBlock(segment);

    commands.push({
      rawName,
      effectId,
      definition,
      dice,
      percent,
      params,
      configBlock,
      original: segment,
    });
  }

  return { commands, registrations, errors };
}

export function isValidPercent(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

export function listKnownEffectIds(): string[] {
  return Object.keys(STATUS_EFFECTS);
}
