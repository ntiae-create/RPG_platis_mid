/**
 * Ratatoskr — kit World Boss (12 Árvores Ancestrais + Energia Arcana).
 */

export const RATATOSKR_TREE_COUNT = 12;

export type RatatoskrMeta = {
  turnsElapsed: number;
  /** árvores ainda de pé (0–12) */
  treesRemaining: number;
  /** fase real após derrubar a 12ª */
  realCombat: boolean;
  /** Energia Arcana 0–5 */
  arcaneStacks: number;
  /** Conhecimento em Crescimento: +10% ATK MGC / +5% INT a cada 3 turnos (acumulativo) */
  growthAtkMgcPct: number;
  growthIntPct: number;
  /** graça da Suprema (+15% poder mágico por pilha) */
  graceStacks: number;
  /** próximo ataque amplificado (Eco da Árvore) */
  nextAttackAmplified: boolean;
  /** manifestação Yggdrasil: turnos restantes */
  yggdrasilTurns: number;
  /** escudo mágico quando MP cheio */
  magicShield: number;
};

export function emptyRatatoskrMeta(): RatatoskrMeta {
  return {
    turnsElapsed: 0,
    treesRemaining: RATATOSKR_TREE_COUNT,
    realCombat: false,
    arcaneStacks: 0,
    growthAtkMgcPct: 0,
    growthIntPct: 0,
    graceStacks: 0,
    nextAttackAmplified: false,
    yggdrasilTurns: 0,
    magicShield: 0,
  };
}

export type RatatoskrForm =
  | "mensageiro-ramos"
  | "eco-planos"
  | "canal-vivo"
  | "raiz-aberta"
  | "yggdrasil-manifesto";

export function ratatoskrFormForLevel(level: number): RatatoskrForm {
  if (level >= 400) return "yggdrasil-manifesto";
  if (level >= 300) return "raiz-aberta";
  if (level >= 200) return "canal-vivo";
  if (level >= 100) return "eco-planos";
  return "mensageiro-ramos";
}

export function ratatoskrFormLabel(form: RatatoskrForm): string {
  switch (form) {
    case "mensageiro-ramos":
      return "Mensageiro dos Ramos";
    case "eco-planos":
      return "Eco entre Planos";
    case "canal-vivo":
      return "Canal Vivo";
    case "raiz-aberta":
      return "Raiz Aberta";
    case "yggdrasil-manifesto":
      return "Yggdrasil Manifesto";
  }
}

export type RatatoskrBossStats = {
  hp: number;
  mp: number;
  est: number;
  atk: number;
  atkMgc: number;
  agi: number;
  def: number;
  res: number;
  int: number;
  san: number;
};

export function ratatoskrAddArcane(meta: RatatoskrMeta, n = 1): RatatoskrMeta {
  return {
    ...meta,
    arcaneStacks: Math.min(5, meta.arcaneStacks + n),
  };
}

export function ratatoskrSpendArcane(
  meta: RatatoskrMeta,
  n: number,
): { meta: RatatoskrMeta; spent: number } {
  const spent = Math.min(n, meta.arcaneStacks);
  return {
    meta: { ...meta, arcaneStacks: meta.arcaneStacks - spent },
    spent,
  };
}

/** RES mágica reduzida 10% por árvore derrubada (permanente no combate) */
export function ratatoskrResMult(meta: RatatoskrMeta): number {
  const felled = RATATOSKR_TREE_COUNT - meta.treesRemaining;
  return Math.max(0.1, 1 - felled * 0.1);
}

export function ratatoskrMagicPowerMult(meta: RatatoskrMeta): number {
  const arcane = meta.arcaneStacks * 0.08;
  const grace = meta.graceStacks * 0.15;
  const growth = meta.growthAtkMgcPct / 100;
  const ygg = meta.yggdrasilTurns > 0 ? 0.1 * meta.yggdrasilTurns : 0;
  return 1 + arcane + grace + growth + ygg;
}

export function ratatoskrEffectiveStats(
  base: RatatoskrBossStats,
  meta: RatatoskrMeta,
): RatatoskrBossStats {
  const pow = ratatoskrMagicPowerMult(meta);
  const intBonus = 1 + meta.growthIntPct / 100;
  return {
    ...base,
    atkMgc: Math.max(1, Math.floor(base.atkMgc * pow)),
    int: Math.max(1, Math.floor(base.int * intBonus)),
    res: Math.max(1, Math.floor(base.res * ratatoskrResMult(meta))),
  };
}

/** Derruba uma árvore; na 12ª inicia combate real */
export function ratatoskrFellTree(meta: RatatoskrMeta): {
  meta: RatatoskrMeta;
  notes: string[];
} {
  if (meta.treesRemaining <= 0 || meta.realCombat) {
    return { meta, notes: [] };
  }
  const treesRemaining = meta.treesRemaining - 1;
  const notes = [
    `Árvore Ancestral derrubada (${RATATOSKR_TREE_COUNT - treesRemaining}/${RATATOSKR_TREE_COUNT}). RES mágica −10%.`,
  ];
  if (treesRemaining <= 0) {
    return {
      meta: {
        ...meta,
        treesRemaining: 0,
        realCombat: true,
        arcaneStacks: 5,
      },
      notes: [
        ...notes,
        "A 12ª árvore cai. Projeções se dissipam. Ratatoskr desce — combate real. Energia Arcana máxima.",
      ],
    };
  }
  return { meta: { ...meta, treesRemaining }, notes };
}

export function ratatoskrOnTurnAdvance(
  meta: RatatoskrMeta,
  base: RatatoskrBossStats,
  bossMp: number,
  bossHp: number,
): {
  meta: RatatoskrMeta;
  bossMp: number;
  bossHp: number;
  notes: string[];
} {
  const notes: string[] = [];
  let next: RatatoskrMeta = {
    ...meta,
    turnsElapsed: meta.turnsElapsed + 1,
  };

  // Canal da Árvore: +1 arcane / turno
  next = ratatoskrAddArcane(next, 1);
  notes.push(`Canal da Árvore: Energia Arcana ${next.arcaneStacks}/5`);

  // Conhecimento a cada 3 turnos
  if (next.turnsElapsed % 3 === 0) {
    next.growthAtkMgcPct += 10;
    next.growthIntPct += 5;
    notes.push(
      `Conhecimento em Crescimento: +${next.growthAtkMgcPct}% ATK MGC, +${next.growthIntPct}% INT`,
    );
  }

  // Fonte Inesgotável + MP por árvore intacta (fase pré-real)
  let mp = bossMp;
  const treeMp =
    !next.realCombat && next.treesRemaining > 0
      ? Math.floor(base.mp * 0.05 * next.treesRemaining)
      : 0;
  const baseRegen = Math.floor(base.mp * 0.08);
  mp = Math.min(base.mp, mp + baseRegen + treeMp);
  if (treeMp > 0) notes.push(`Ecos das árvores: +${treeMp} MP`);
  notes.push(`Fonte Inesgotável: +${baseRegen} MP`);

  let hp = bossHp;
  if (mp >= base.mp) {
    const shield = Math.floor(base.hp * 0.05);
    next.magicShield += shield;
    notes.push(`MP cheio: escudo mágico +${shield}`);
  }

  if (next.yggdrasilTurns > 0) {
    next.yggdrasilTurns -= 1;
    next.graceStacks += 1;
    notes.push(`Yggdrasil: graça ${next.graceStacks}, turnos restantes ${next.yggdrasilTurns}`);
  }

  return { meta: next, bossMp: mp, bossHp: hp, notes };
}

/** Mensagem entre Planos: 20% duplicar */
export function ratatoskrTryDuplicate(roll: () => number = Math.random): boolean {
  return roll() < 0.2;
}

export type RatatoskrSkillId =
  | "sussurro-da-folhagem"
  | "caminho-dos-ramos"
  | "eco-da-arvore"
  | "cascata-de-luz"
  | "vento-das-eras"
  | "yggdrasil-raiz-e-ceu";

export type RatatoskrSkillDef = {
  id: RatatoskrSkillId;
  name: string;
  unlockLevel: number;
  ultimate?: boolean;
  costMp?: number;
  costEst?: number;
  costMpPct?: number;
  costEstPct?: number;
};

export const RATATOSKR_SKILLS: RatatoskrSkillDef[] = [
  { id: "sussurro-da-folhagem", name: "Sussurro da Folhagem", unlockLevel: 12, costMp: 18, costEst: 12 },
  { id: "caminho-dos-ramos", name: "Caminho dos Ramos", unlockLevel: 12, costMp: 25, costEst: 18 },
  { id: "eco-da-arvore", name: "Eco da Árvore", unlockLevel: 12, costMp: 20, costEst: 15 },
  { id: "cascata-de-luz", name: "Cascata de Luz", unlockLevel: 200, costMp: 38, costEst: 28 },
  { id: "vento-das-eras", name: "O Vento das Eras", unlockLevel: 300, costMp: 45, costEst: 35 },
  {
    id: "yggdrasil-raiz-e-ceu",
    name: "YGGDRASIL — RAIZ E CÉU",
    unlockLevel: 400,
    ultimate: true,
    costMpPct: 0.12,
    costEstPct: 0.08,
  },
];

export function ratatoskrSkillByName(name: string): RatatoskrSkillDef | null {
  const n = name.trim().toLowerCase();
  return (
    RATATOSKR_SKILLS.find(
      (s) =>
        s.name.toLowerCase() === n ||
        s.id === n ||
        s.name.toLowerCase().includes(n.replace(/[—–-]/g, " ").slice(0, 10)),
    ) ?? null
  );
}

export type RatatoskrTarget = {
  id: string;
  hp: number;
  maxHp: number;
};

export type RatatoskrResolveResult = {
  meta: RatatoskrMeta;
  bossHp: number;
  bossMp: number;
  bossEst: number;
  damages: { targetId: string; damage: number; killed: boolean }[];
  /** ids com −10% RES mágica 2 turnos */
  resShred: string[];
  notes: string[];
};

export function resolveRatatoskrSkill(
  skillName: string,
  opts: {
    level: number;
    baseStats: RatatoskrBossStats;
    meta: RatatoskrMeta;
    bossHp: number;
    bossMp: number;
    bossEst: number;
    primaryTargetId: string;
    targets: RatatoskrTarget[];
    rollDie: (n: number) => number;
    /** Eco da Árvore: "heal_mp" | "amplify" */
    ecoMode?: "heal_mp" | "amplify";
    random?: () => number;
  },
): RatatoskrResolveResult | null {
  const skill = ratatoskrSkillByName(skillName);
  if (!skill || opts.level < skill.unlockLevel) return null;

  const random = opts.random ?? Math.random;
  let meta: RatatoskrMeta = { ...opts.meta };
  const stats = ratatoskrEffectiveStats(opts.baseStats, meta);
  let mp = opts.bossMp;
  let est = opts.bossEst;
  let bossHp = opts.bossHp;
  const notes: string[] = [];
  const damages: RatatoskrResolveResult["damages"] = [];
  const resShred: string[] = [];

  const costMp = skill.costMpPct
    ? Math.floor(stats.mp * skill.costMpPct)
    : skill.costMp ?? 0;
  const costEst = skill.costEstPct
    ? Math.floor(stats.est * skill.costEstPct)
    : skill.costEst ?? 0;
  if (mp < costMp || est < costEst) {
    notes.push("Ratatoskr: recursos insuficientes");
    return null;
  }
  mp -= costMp;
  est -= costEst;

  // Suprema: cada skill +1 graça no Lv.400+
  if (opts.level >= 400) {
    meta.graceStacks += 1;
    notes.push(`Graça da Árvore: ${meta.graceStacks}`);
  }

  const primary =
    opts.targets.find((t) => t.id === opts.primaryTargetId) ?? opts.targets[0];
  if (!primary) return null;

  const amplify = meta.nextAttackAmplified;
  if (amplify) {
    meta.nextAttackAmplified = false;
    notes.push("Eco: próximo ataque amplificado");
  }

  const hit = (t: RatatoskrTarget, raw: number) => {
    let dmg = Math.max(1, Math.floor(raw * (amplify ? 1.35 : 1)));
    if (ratatoskrTryDuplicate(random)) {
      dmg = Math.floor(dmg * 1.15);
      notes.push("Mensagem entre Planos: efeito reforçado");
    }
    const killed = t.hp - dmg <= 0;
    damages.push({ targetId: t.id, damage: dmg, killed });
    return dmg;
  };

  if (skill.id === "sussurro-da-folhagem") {
    hit(primary, stats.atkMgc + opts.rollDie(8));
    meta = ratatoskrAddArcane(meta, 1);
    notes.push("Sussurro da Folhagem: +1 Energia Arcana");
  } else if (skill.id === "caminho-dos-ramos") {
    for (const t of opts.targets) {
      hit(t, Math.floor(stats.atkMgc * 0.75) + opts.rollDie(6));
      resShred.push(t.id);
    }
    notes.push("Caminho dos Ramos: −10% RES mágica 2 turnos");
  } else if (skill.id === "eco-da-arvore") {
    const mode = opts.ecoMode ?? (meta.arcaneStacks >= 2 ? "amplify" : "heal_mp");
    const { meta: after, spent } = ratatoskrSpendArcane(meta, meta.arcaneStacks);
    meta = after;
    if (mode === "amplify") {
      meta.nextAttackAmplified = true;
      notes.push(`Eco da Árvore: gastou ${spent} pilhas — próximo ataque amplificado`);
    } else {
      const restore = Math.floor(stats.mp * 0.05 * Math.max(1, spent));
      mp = Math.min(stats.mp, mp + restore);
      notes.push(`Eco da Árvore: gastou ${spent} pilhas — +${restore} MP`);
    }
  } else if (skill.id === "cascata-de-luz") {
    for (const t of opts.targets) {
      hit(t, Math.floor(stats.atkMgc * 1.15) + opts.rollDie(10));
    }
    meta = ratatoskrAddArcane(meta, 2);
    notes.push("Cascata de Luz: +2 Energia Arcana");
  } else if (skill.id === "vento-das-eras") {
    for (const t of opts.targets) {
      hit(t, Math.floor(stats.atkMgc * 0.95) + opts.rollDie(8));
    }
    notes.push("O Vento das Eras: global — atraso nos inimigos");
  } else if (skill.id === "yggdrasil-raiz-e-ceu") {
    meta.arcaneStacks = 5;
    meta.yggdrasilTurns = 3;
    meta.graceStacks += 2;
    for (const t of opts.targets) {
      hit(
        t,
        Math.floor(stats.atkMgc * 1.6) +
          Math.floor(stats.int * 0.5) +
          opts.rollDie(12) +
          opts.rollDie(12),
      );
    }
    mp = Math.min(stats.mp, mp + Math.floor(stats.mp * 0.2));
    est = Math.min(stats.est, est + Math.floor(stats.est * 0.15));
    const heal = Math.floor(opts.baseStats.hp * 0.1);
    bossHp = Math.min(opts.baseStats.hp, bossHp + heal);
    notes.push("YGGDRASIL — RAIZ E CÉU: Energia máxima, manifestação 3 turnos");
  }

  return { meta, bossHp, bossMp: mp, bossEst: est, damages, resShred, notes };
}
