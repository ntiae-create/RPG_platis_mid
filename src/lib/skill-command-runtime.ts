import { rollDie } from "./utils";

/**
 * SKILL_NAME_PERCENT_REGISTRY
 * Liga nomes de habilidades às operações numéricas usadas pelo !N%.
 * Os registros serão preenchidos com os nomes oficiais das habilidades.
 */
export type SkillPercentRegistration = {
  names: string[];
  operation: string;
  numberMode: "percentage" | "multiplier" | "fixed";
};

export const SKILL_NAME_PERCENT_REGISTRY: SkillPercentRegistration[] = [
  {
    "names": [
      "sangramento"
    ],
    "operation": "bleed",
    "numberMode": "percentage"
  },
  {
    "names": [
      "fio-de-seda"
    ],
    "operation": "silk_thread",
    "numberMode": "percentage"
  },
  {
    "names": [
      "congelamento"
    ],
    "operation": "freeze",
    "numberMode": "percentage"
  },
  {
    "names": [
      "lentidão"
    ],
    "operation": "slow",
    "numberMode": "percentage"
  },
  {
    "names": [
      "veneno",
      "infectar"
    ],
    "operation": "poison",
    "numberMode": "percentage"
  },
  {
    "names": [
      "queimadura"
    ],
    "operation": "burn",
    "numberMode": "percentage"
  },
  {
    "names": [
      "combustão"
    ],
    "operation": "combustion",
    "numberMode": "percentage"
  },
  {
    "names": [
      "explosão"
    ],
    "operation": "explosion",
    "numberMode": "percentage"
  },
  {
    "names": [
      "cegueira"
    ],
    "operation": "blind",
    "numberMode": "percentage"
  },
  {
    "names": [
      "fraqueza"
    ],
    "operation": "weakness",
    "numberMode": "percentage"
  },
  {
    "names": [
      "cancelamento"
    ],
    "operation": "cancel",
    "numberMode": "percentage"
  },
  {
    "names": [
      "limpeza"
    ],
    "operation": "clean",
    "numberMode": "percentage"
  },
  {
    "names": [
      "regeneração"
    ],
    "operation": "regeneration",
    "numberMode": "percentage"
  },
  {
    "names": [
      "fortalecimento"
    ],
    "operation": "strengthen",
    "numberMode": "percentage"
  },
  {
    "names": [
      "heal",
      "cura",
      "recuperar",
      "recuperação"
    ],
    "operation": "heal",
    "numberMode": "percentage"
  },
  {
    "names": [
      "roubo-de-vida"
    ],
    "operation": "lifesteal",
    "numberMode": "percentage"
  },
  {
    "names": [
      "molhado"
    ],
    "operation": "wet",
    "numberMode": "percentage"
  },
  {
    "names": [
      "atordoamento"
    ],
    "operation": "stun",
    "numberMode": "percentage"
  },
  {
    "names": [
      "imobilização"
    ],
    "operation": "immobilize",
    "numberMode": "percentage"
  },
  {
    "names": [
      "defensor"
    ],
    "operation": "defender",
    "numberMode": "percentage"
  },
  {
    "names": [
      "ágil"
    ],
    "operation": "agile",
    "numberMode": "percentage"
  },
  {
    "names": [
      "atk"
    ],
    "operation": "atk",
    "numberMode": "fixed"
  },
  {
    "names": [
      "atk-mgc"
    ],
    "operation": "atk_mgc",
    "numberMode": "fixed"
  },
  {
    "names": [
      "def"
    ],
    "operation": "def",
    "numberMode": "fixed"
  },
  {
    "names": [
      "res"
    ],
    "operation": "res",
    "numberMode": "fixed"
  },
  {
    "names": [
      "int"
    ],
    "operation": "int",
    "numberMode": "fixed"
  },
  {
    "names": [
      "agi"
    ],
    "operation": "agi",
    "numberMode": "fixed"
  }
];

export function resolveSkillPercentRegistration(name: string): SkillPercentRegistration | undefined {
  const normalize = (value: string) =>
    value.normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const wanted = normalize(name);
  return SKILL_NAME_PERCENT_REGISTRY.find(entry =>
    entry.names.some(alias => normalize(alias) === wanted)
  );
}


export type ParsedSkillCommand = {
  command: string;
  damage: number | null;
  duration: number | null;
  stacks: number;
  percent: number | null;
  operation?: string | null;
  raw: string;
};

const ALIASES: Record<string, string> = {
  "/sangramento": "bleeding",
  "/fio-de-seda": "silk_thread",
  "/fio de seda": "silk_thread",
  "/bleeding": "bleeding",
  "/congelamento": "freeze",
  "/freeze": "freeze",
  "/lentidão": "slow",
  "/lentidao": "slow",
  "/slow": "slow",
  "/veneno": "poison",
  "/envenenamento": "poison",
  "/venenoso": "poison",
  "/poison": "poison",
  "/queimadura": "burn",
  "/burn": "burn",
  "/combustão": "combustion",
  "/combustao": "combustion",
  "/explosão": "explosion",
  "/explosao": "explosion",
  "/explosion": "explosion",
  "/cegueira": "blind",
  "/blind": "blind",
  "/fraqueza": "weakness",
  "/weakness": "weakness",
  "/cancelamento": "cancel",
  "/cancel": "cancel",
  "/limpeza": "clean",
  "/clean": "clean",
  "/regeneração": "regeneration",
  "/regeneracao": "regeneration",
  "/regeneration": "regeneration",
  "/fortalecimento": "strengthening",
  "/strengthening": "strengthening",
  "/heal": "heal",
  "/cura": "heal",
  "/recuperar": "recovery",
  "/recuperação": "recovery",
  "/recuperacao": "recovery",
  "/recovery": "recovery",
  "/roubo-de-vida": "lifesteal",
  "/lifesteal": "lifesteal",
  "/molhado": "wet",
  "/wet": "wet",
  "/infectar": "infect",
  "/infect": "infect",
  "/atordoamento": "stun",
  "/stun": "stun",
  "/imobilização": "immobilize",
  "/imobilizacao": "immobilize",
  "/immobilize": "immobilize",
  "/defensor": "defender",
  "/ágil": "agile",
  "/agil": "agile",
  "/atk": "atk",
  "/atk-mgc": "atk_mgc",
  "/def": "def",
  "/res": "res",
  "/int": "int",
  "/agi": "agi",
};

export function resolveSkillPercentForCommand(
  skillName: string,
  value: number | null | undefined,
  fallback = 10,
): { operation: string | null; percent: number } {
  const registration = resolveSkillPercentRegistration(skillName);
  return {
    operation: registration?.operation ?? null,
    percent: normalizeSkillPercent(value, fallback),
  };
}

export function normalizeSkillPercent(value: number | null | undefined, fallback = 10): number {
  const percent = value ?? fallback;
  return Math.max(1, Math.min(100, percent));
}

export function parseSkillCommands(input: string): ParsedSkillCommand[] {
  if (!input.trim()) return [];

  const parsed: ParsedSkillCommand[] = [];

  for (const line of input.split(/\r?\n/)) {
    const raw = line.trim();
    if (!raw) continue;

    const match = raw.match(/^(\/[\p{L}\p{N}_-]+)(.*)$/u);
    if (!match) throw new Error(`Comando inválido: ${raw}`);

    const command = ALIASES[match[1].toLocaleLowerCase("pt-BR")];
    if (!command) throw new Error(`Comando não reconhecido: ${match[1]}`);

    const args = match[2];
    const dice = args.match(/\[(\d+)d(\d+)\]/i);
    let damage: number | null = null;

    if (dice) {
      const count = Number(dice[1]);
      const sides = Number(dice[2]);

      if (count < 1 || count > 100 || sides < 1 || sides > 1000) {
        throw new Error(`Rolagem fora do limite: ${dice[0]}`);
      }

      damage = 0;
      for (let i = 0; i < count; i++) {
        damage += rollDie(sides);
      }
    }

    const durationMatch = args.match(/dura[cç][aã]o\s*=\s*(\d+)/i);
    const stacksMatch = args.match(/(?:stacks|ac[uú]mulos)\s*=\s*(\d+)/i);
    const percentMatch = args.match(/!(\d+(?:[.,]\d+)?)\s*%/);
    const duration = durationMatch ? Number(durationMatch[1]) : null;
    const stacks = stacksMatch ? Number(stacksMatch[1]) : 1;
    const percent = percentMatch ? Number(percentMatch[1].replace(",", ".")) : null;

    if (duration !== null && (duration < 0 || duration > 1000)) {
      throw new Error(`Duração inválida: ${raw}`);
    }

    if (stacks < 1 || stacks > 100) {
      throw new Error(`Acúmulos inválidos: ${raw}`);
    }

    if (percent !== null && (percent <= 0 || percent > 100)) {
      throw new Error(`Percentual inválido: ${raw}. Use um valor maior que 0 e até 100%.`);
    }

    const remainder = args
      .replace(/\[\d+d\d+\]/ig, "")
      .replace(/dura[cç][aã]o\s*=\s*\d+/ig, "")
      .replace(/(?:stacks|ac[uú]mulos)\s*=\s*\d+/ig, "")
      .replace(/!\d+(?:[.,]\d+)?\s*%/g, "")
      .replace(/\{[^}]*\}/g, "")
      .trim();

    if (remainder) {
      throw new Error(`Parâmetro ainda não suportado em "${raw}": ${remainder}`);
    }

    parsed.push({
      command,
      damage,
      duration,
      stacks,
      percent,
      operation: SKILL_NAME_PERCENT_REGISTRY.find(entry =>
        entry.operation === command ||
        entry.names.some(name =>
          name.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-") === command
        )
      )?.operation ?? command,
      raw,
    });
  }

  return parsed;
}
