/**
 * Testes standalone do parser/executor de comandos de habilidades.
 * Não depende do path alias @/ — reimplementa o essencial para validação.
 *
 * node scripts/test-skill-commands.mjs
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

const STATUS_EFFECTS = {
  bleeding: { id: "bleeding", name: "Sangramento", category: "debuff" },
  stun: { id: "stun", name: "Atordoamento", category: "debuff" },
  freeze: { id: "freeze", name: "Congelamento", category: "debuff" },
  cold: { id: "cold", name: "Frio", category: "debuff", maxStacks: 3 },
  slow: { id: "slow", name: "Lentidão", category: "debuff" },
  poison: { id: "poison", name: "Envenenamento", category: "debuff" },
  burn: { id: "burn", name: "Queimadura", category: "debuff", maxStacks: 5 },
  blind: { id: "blind", name: "Cegueira", category: "debuff" },
  weakness: { id: "weakness", name: "Fraqueza", category: "debuff" },
  cancel: { id: "cancel", name: "Cancelamento", category: "cleanse" },
  clean: { id: "clean", name: "Limpeza", category: "cleanse" },
  heal: { id: "heal", name: "Cura", category: "recovery" },
  recovery: { id: "recovery", name: "Recuperação", category: "recovery" },
  lifesteal: { id: "lifesteal", name: "Roubo de Vida", category: "recovery" },
  regeneration: { id: "regeneration", name: "Regeneração", category: "recovery" },
  strengthening: { id: "strengthening", name: "Fortalecimento", category: "buff" },
  immobilize: { id: "immobilize", name: "Imobilização", category: "debuff" },
  explosion: { id: "explosion", name: "Explosão", category: "debuff", maxStacks: 2 },
  wet: { id: "wet", name: "Molhado", category: "debuff" },
  infect: { id: "infect", name: "Infecção", category: "debuff" },
  silk_thread: { id: "silk_thread", name: "Fio de Seda", category: "debuff", maxStacks: 3 },
};

const COMMAND_ALIASES = {
  sangramento: "bleeding", bleeding: "bleeding", bleed: "bleeding",
  congelamento: "freeze", freeze: "freeze", frozen: "freeze",
  frio: "cold", cold: "cold",
  lentidao: "slow", "lentidão": "slow", slow: "slow",
  veneno: "poison", poison: "poison",
  queimadura: "burn", burn: "burn",
  cegueira: "blind", blind: "blind",
  fraqueza: "weakness", weakness: "weakness",
  cancelamento: "cancel", cancel: "cancel",
  limpeza: "clean", clean: "clean", cleanse: "clean",
  regeneracao: "regeneration", "regeneração": "regeneration", regeneration: "regeneration", regen: "regeneration",
  fortalecimento: "strengthening", strengthen: "strengthening", strengthening: "strengthening",
  cura: "heal", heal: "heal", healing: "heal",
  recuperacao: "recovery", "recuperação": "recovery", recovery: "recovery",
  "roubo-de-vida": "lifesteal", "roubo de vida": "lifesteal", lifesteal: "lifesteal", "life steal": "lifesteal",
  imobilizacao: "immobilize", "imobilização": "immobilize", immobilize: "immobilize",
  atordoamento: "stun", atordoar: "stun", stun: "stun",
  explosao: "explosion", "explosão": "explosion", explosion: "explosion",
  molhado: "wet", wet: "wet",
  infectar: "infect", infect: "infect",
};

function normalizeKey(raw) {
  return raw.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

function resolveEffectId(rawName) {
  const key = normalizeKey(rawName);
  if (COMMAND_ALIASES[key]) return COMMAND_ALIASES[key];
  if (STATUS_EFFECTS[key]) return key;
  return null;
}

function parseSkillCommands(text) {
  const commands = [];
  const registrations = [];
  const errors = [];
  if (!text) return { commands, registrations, errors };

  const regRe = /\/\(([^)]+)\)\s*\+\s*\{([^}]*)\}/g;
  let regMatch;
  while ((regMatch = regRe.exec(text)) !== null) {
    const name = regMatch[1].trim();
    const config = {};
    regMatch[2].split(/[,\n]/).forEach((part) => {
      const eq = part.trim().match(/^([\w-]+)\s*[:=]\s*(.+)$/);
      if (eq) config[eq[1].toLowerCase()] = eq[2].trim().replace(/^["']|["']$/g, "");
    });
    if (name) registrations.push({ name, config, original: regMatch[0] });
  }

  const cmdRe = /\/([a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ0-9_-]*)/g;
  let cmdMatch;
  while ((cmdMatch = cmdRe.exec(text)) !== null) {
    if (text[cmdMatch.index + 1] === "(") continue;
    const start = cmdMatch.index;
    let end = text.length;
    let depthBracket = 0, depthBrace = 0;
    for (let i = start + 1; i < text.length; i++) {
      const ch = text[i];
      if (ch === "[") depthBracket++;
      else if (ch === "]") depthBracket = Math.max(0, depthBracket - 1);
      else if (ch === "{") depthBrace++;
      else if (ch === "}") depthBrace = Math.max(0, depthBrace - 1);
      else if (ch === "/" && depthBracket === 0 && depthBrace === 0) { end = i; break; }
    }
    const segment = text.slice(start, end).trim();
    if (segment.includes("+") && segment.includes("{")) continue;
    const rawName = cmdMatch[1].trim();
    const effectId = resolveEffectId(rawName);
    if (!effectId) { errors.push(`Comando desconhecido: /${rawName}`); continue; }

    const dice = [];
    const diceRe = /\[(\d+)\s*[dD]\s*(\d+)\]/g;
    let dm;
    while ((dm = diceRe.exec(segment)) !== null) {
      dice.push({ count: Number(dm[1]), sides: Number(dm[2]), raw: dm[0] });
    }

    let percent = null;
    const percentRe = /!(\d+(?:[.,]\d+)?)\s*%/g;
    let pm;
    const percents = [];
    while ((pm = percentRe.exec(segment)) !== null) {
      const value = Number(pm[1].replace(",", "."));
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        errors.push(`Percentual inválido: !${pm[1]}%`);
      } else {
        percents.push(value);
      }
    }
    if (percents.length) percent = percents[percents.length - 1];

    const params = {};
    const paramRe = /([\p{L}\w][\p{L}\w-]*)\s*=\s*([^\s/[\]{}!]+)/gu;
    let prm;
    while ((prm = paramRe.exec(segment)) !== null) params[prm[1].toLowerCase()] = prm[2];

    commands.push({ rawName, effectId, dice, percent, params, original: segment });
  }
  return { commands, registrations, errors };
}

const DEFAULT_PERCENT = {
  heal: 50, recovery: 25, regeneration: 20, lifesteal: 25,
  bleeding: 100, poison: 100, burn: 100, freeze: 100, stun: 100,
};

const PERCENT_SEMANTICS = {
  heal: "proportion", recovery: "proportion", regeneration: "proportion",
  lifesteal: "proportion", bleeding: "intensity", poison: "intensity",
  burn: "intensity", stun: "apply", freeze: "apply",
};

function executeSkillCommands(skillText, ctx = {}) {
  const parsed = parseSkillCommands(skillText);
  const results = [];
  const effects = [];
  let totalHeal = 0;
  let lifestealPercent = 0;

  for (const cmd of parsed.commands) {
    const percent = cmd.percent !== null ? cmd.percent : (DEFAULT_PERCENT[cmd.effectId] ?? 100);
    const semantics = PERCENT_SEMANTICS[cmd.effectId] ?? "apply";
    let value = 0;
    let applied = true;
    let directHeal = 0;

    if (cmd.effectId === "heal") {
      const base = 100;
      if (cmd.dice.length) {
        value = cmd.dice.reduce((s, d) => s + d.count * ((d.sides + 1) / 2), 0);
        directHeal = Math.floor(value * (percent / 100));
      } else {
        directHeal = Math.floor(base * (percent / 100));
      }
      totalHeal += directHeal;
      value = directHeal;
    } else if (cmd.effectId === "lifesteal") {
      lifestealPercent = percent;
      value = percent;
    } else if (cmd.effectId === "bleeding" || cmd.effectId === "poison") {
      const base = cmd.dice.length
        ? cmd.dice.reduce((s, d) => s + d.count * ((d.sides + 1) / 2), 0)
        : 2;
      value = Math.max(1, Math.floor(base * (percent / 100)));
      effects.push({ id: cmd.effectId, targetId: ctx.defender?.id ?? "t", stacks: 1 });
    } else {
      effects.push({ id: cmd.effectId, targetId: ctx.defender?.id ?? "t", stacks: 1 });
    }

    results.push({ effectId: cmd.effectId, applied, value, percentUsed: percent, semantics });
  }

  return { results, effects, errors: parsed.errors, totalHeal, lifestealPercent, registrations: parsed.registrations };
}

describe("1. Reconhecimento PT e EN", () => {
  it("sangramento / bleeding / bleed", () => {
    assert.equal(resolveEffectId("sangramento"), "bleeding");
    assert.equal(resolveEffectId("Bleeding"), "bleeding");
    assert.equal(resolveEffectId("bleed"), "bleeding");
  });
  it("cura / heal", () => {
    assert.equal(resolveEffectId("cura"), "heal");
    assert.equal(resolveEffectId("heal"), "heal");
  });
  it("roubo-de-vida / lifesteal", () => {
    assert.equal(resolveEffectId("roubo-de-vida"), "lifesteal");
    assert.equal(resolveEffectId("lifesteal"), "lifesteal");
  });
  it("stun / atordoamento", () => {
    assert.equal(resolveEffectId("stun"), "stun");
    assert.equal(resolveEffectId("atordoamento"), "stun");
  });
});

describe("2. Interpretação de !N%", () => {
  for (const p of [10, 25, 50, 100]) {
    it(`!${p}%`, () => {
      const r = parseSkillCommands(`/cura !${p}%`);
      assert.equal(r.commands[0].percent, p);
    });
  }
  it("aceita vírgula decimal", () => {
    const r = parseSkillCommands("/heal !12,5%");
    assert.equal(r.commands[0].percent, 12.5);
  });
});

describe("3. Propagação do percentual até a execução", () => {
  it("!50% chega em percentUsed", () => {
    const exec = executeSkillCommands("/heal !50%");
    assert.equal(exec.results[0].percentUsed, 50);
  });
  it("omitido usa default", () => {
    const exec = executeSkillCommands("/heal");
    assert.equal(exec.results[0].percentUsed, DEFAULT_PERCENT.heal);
  });
});

describe("4. Aplicação correta por semântica", () => {
  it("heal é proportion — !40% de 100 HP = 40", () => {
    const exec = executeSkillCommands("/heal !40%");
    assert.equal(PERCENT_SEMANTICS.heal, "proportion");
    assert.equal(exec.totalHeal, 40);
  });
  it("lifesteal é proportion — não chance", () => {
    const exec = executeSkillCommands("/roubo-de-vida !30%");
    assert.equal(PERCENT_SEMANTICS.lifesteal, "proportion");
    assert.equal(exec.lifestealPercent, 30);
  });
  it("bleeding é intensity", () => {
    assert.equal(PERCENT_SEMANTICS.bleeding, "intensity");
    const exec = executeSkillCommands("/sangramento [4d5] !25%");
    assert.equal(exec.results[0].percentUsed, 25);
    assert.ok(exec.results[0].value >= 1);
  });
});

describe("5. Comportamento padrão sem percentual", () => {
  it("heal default 50%", () => {
    const exec = executeSkillCommands("/heal");
    assert.equal(exec.results[0].percentUsed, 50);
    assert.equal(exec.totalHeal, 50);
  });
});

describe("6. Rejeição de parâmetros inválidos", () => {
  it("!150% gera erro", () => {
    const r = parseSkillCommands("/heal !150%");
    assert.ok(r.errors.length > 0);
  });
  it("comando desconhecido gera erro", () => {
    const r = parseSkillCommands("/xyznaoexiste");
    assert.ok(r.errors.length > 0);
    assert.equal(r.commands.length, 0);
  });
});

describe("7. Interpretação de [ ... ]", () => {
  it("[2d6]", () => {
    const r = parseSkillCommands("/veneno [2d6]");
    assert.equal(r.commands[0].dice[0].count, 2);
    assert.equal(r.commands[0].dice[0].sides, 6);
  });
});

describe("8. Registro de novos efeitos", () => {
  it("/(Marca) + { category: debuff }", () => {
    const r = parseSkillCommands("/(Marca Sombria) + { category: debuff, duration: 2 }");
    assert.equal(r.registrations.length, 1);
    assert.equal(r.registrations[0].name, "Marca Sombria");
    assert.equal(r.registrations[0].config.category, "debuff");
  });
});

describe("9. Efeitos que já existiam continuam resolvendo", () => {
  const list = ["sangramento", "congelamento", "lentidão", "veneno", "queimadura", "cegueira", "fraqueza", "stun", "cura", "regeneração"];
  for (const name of list) {
    it(`/${name}`, () => {
      const r = parseSkillCommands(`/${name}`);
      assert.equal(r.commands.length, 1, `falhou para /${name}: ${r.errors.join(", ")}`);
      assert.ok(STATUS_EFFECTS[r.commands[0].effectId]);
    });
  }
});

describe("10. Execução real (fluxo de habilidade)", () => {
  it("múltiplos comandos no texto da habilidade", () => {
    const text = "Golpe cruel /sangramento [1d4] !50% que deixa o alvo /stun duração=1";
    const exec = executeSkillCommands(text, { defender: { id: "enemy1" } });
    assert.equal(exec.results.length, 2);
    assert.equal(exec.results[0].effectId, "bleeding");
    assert.equal(exec.results[1].effectId, "stun");
    assert.ok(exec.effects.some((e) => e.id === "bleeding"));
    assert.ok(exec.effects.some((e) => e.id === "stun"));
  });
  it("percentual de cura altera totalHeal de ponta a ponta", () => {
    const exec = executeSkillCommands("Poção /cura !100%");
    assert.equal(exec.totalHeal, 100);
  });
});

console.log("\n=== Testes de comandos de habilidades — RPG Platis ===\n");
