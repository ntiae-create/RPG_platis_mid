/**
 * Jörmungandr — kit World Boss (Cabeça + Cauda, Escamas Abissais).
 */

export type JormungandrMeta = {
  turnsElapsed: number;
  /** partes conectadas (sem obstáculo entre cabeça e cauda) */
  bodyConnected: boolean;
  /** turnos consecutivos adjacentes por alvo (Mar que Tudo Engole) */
  adjacentTurns: Record<string, number>;
  /** Molhado: turns left por alvo */
  wet: Record<string, number>;
  /** Redemoinho ativo: turnos restantes + alvo ids na zona */
  whirlpoolTurns: number;
  whirlpoolTargets: string[];
  /** Círculo do Mundo (extremos se tocam) */
  worldCircle: boolean;
  /** Ragnarök combat form <25% */
  ragnarok: boolean;
  /** dobrar regen após ultimate sob 25% */
  doubleRegen: boolean;
};

export function emptyJormungandrMeta(): JormungandrMeta {
  return {
    turnsElapsed: 0,
    bodyConnected: true,
    adjacentTurns: {},
    wet: {},
    whirlpoolTurns: 0,
    whirlpoolTargets: [],
    worldCircle: false,
    ragnarok: false,
    doubleRegen: false,
  };
}

export type JormungandrForm =
  | "serpente-jovem"
  | "anel-oceanico"
  | "abismo-vivo"
  | "circulo-mundo"
  | "ragnarok-mares";

export function jormungandrFormForLevel(level: number): JormungandrForm {
  if (level >= 400) return "ragnarok-mares";
  if (level >= 300) return "circulo-mundo";
  if (level >= 200) return "abismo-vivo";
  if (level >= 100) return "anel-oceanico";
  return "serpente-jovem";
}

export function jormungandrFormLabel(form: JormungandrForm): string {
  switch (form) {
    case "serpente-jovem":
      return "Serpente Marinha";
    case "anel-oceanico":
      return "Anel Oceânico";
    case "abismo-vivo":
      return "Abismo Vivo";
    case "circulo-mundo":
      return "Círculo do Mundo";
    case "ragnarok-mares":
      return "Ragnarök das Águas";
  }
}

export type JormungandrBossStats = {
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

/** Escamas Abissais: redução física por faixa de HP */
export function jormungandrPhysicalDamageTakenMult(hpRatio: number): number {
  if (hpRatio <= 0.25) return 0.7;
  if (hpRatio <= 0.5) return 0.8;
  if (hpRatio <= 0.75) return 0.9;
  return 1;
}

export function jormungandrEffectiveStats(
  base: JormungandrBossStats,
  meta: JormungandrMeta,
  bossHp: number,
): JormungandrBossStats {
  const ratio = base.hp > 0 ? bossHp / base.hp : 1;
  const ragnarok = meta.ragnarok || ratio <= 0.25;
  let atk = base.atk;
  let atkMgc = base.atkMgc;
  let def = base.def;
  let res = base.res;
  if (ragnarok) {
    atk = Math.floor(atk * 1.3);
    atkMgc = Math.floor(atkMgc * 1.3);
    def = Math.floor(def * 0.7);
    res = Math.floor(res * 0.7);
  }
  if (!meta.bodyConnected) {
    // perde bônus de passivas de corpo até reconectar — simplificado: -10% atk
    atk = Math.floor(atk * 0.9);
    atkMgc = Math.floor(atkMgc * 0.9);
  }
  return { ...base, atk, atkMgc, def, res };
}

/** Corpo Ininterrupto: 50% chance de redirecionar o alvo cabeça↔cauda */
export function jormungandrRedirectHit(
  aimedPart: "head" | "tail",
  roll: () => number = Math.random,
): "head" | "tail" {
  if (roll() < 0.5) return aimedPart === "head" ? "tail" : "head";
  return aimedPart;
}

export function applyWet(meta: JormungandrMeta, targetId: string, turns = 2): JormungandrMeta {
  return {
    ...meta,
    wet: { ...meta.wet, [targetId]: Math.max(meta.wet[targetId] ?? 0, turns) },
  };
}

export function jormungandrOnTurnAdvance(
  meta: JormungandrMeta,
  base: JormungandrBossStats,
  bossHp: number,
  bossMp: number,
  bossEst: number,
  adjacentEnemyIds: string[],
): {
  meta: JormungandrMeta;
  bossMp: number;
  bossEst: number;
  dragDamages: { targetId: string; damage: number }[];
  whirlpoolDamages: { targetId: string; damage: number }[];
  notes: string[];
} {
  const notes: string[] = [];
  let next: JormungandrMeta = {
    ...meta,
    turnsElapsed: meta.turnsElapsed + 1,
    adjacentTurns: { ...meta.adjacentTurns },
    wet: { ...meta.wet },
    whirlpoolTargets: [...meta.whirlpoolTargets],
  };

  const ratio = base.hp > 0 ? bossHp / base.hp : 1;
  if (ratio <= 0.25 && !next.ragnarok) {
    next.ragnarok = true;
    notes.push("Ragnarök: +30% ATK/ATK MGC, resistências reduzidas");
  }

  // Fluxo Contínuo
  let mp = bossMp;
  let est = bossEst;
  const mpRegen = Math.floor(base.mp * 0.05 * (next.doubleRegen ? 2 : 1));
  const estRegen = Math.floor(base.est * 0.03 * (next.doubleRegen ? 2 : 1));
  mp = Math.min(base.mp, mp + mpRegen);
  est = Math.min(base.est, est + estRegen);
  notes.push(`Fluxo Contínuo: +${mpRegen} MP, +${estRegen} EST`);

  // tick wet
  for (const id of Object.keys(next.wet)) {
    next.wet[id] -= 1;
    if (next.wet[id] <= 0) delete next.wet[id];
  }

  // Mar que Tudo Engole
  const dragDamages: { targetId: string; damage: number }[] = [];
  const seen = new Set(adjacentEnemyIds);
  for (const id of Object.keys(next.adjacentTurns)) {
    if (!seen.has(id)) delete next.adjacentTurns[id];
  }
  for (const id of adjacentEnemyIds) {
    next.adjacentTurns[id] = (next.adjacentTurns[id] ?? 0) + 1;
    if (next.adjacentTurns[id] >= 2) {
      const dmg = Math.max(1, Math.floor(base.atkMgc * 0.2));
      dragDamages.push({ targetId: id, damage: dmg });
      notes.push(`Arrastão em ${id}`);
      next.adjacentTurns[id] = 0;
    }
  }

  // Redemoinho tick
  const whirlpoolDamages: { targetId: string; damage: number }[] = [];
  if (next.whirlpoolTurns > 0) {
    for (const id of next.whirlpoolTargets) {
      const dmg = Math.max(1, Math.floor(base.atkMgc * 0.35));
      whirlpoolDamages.push({ targetId: id, damage: dmg });
    }
    next.whirlpoolTurns -= 1;
    if (next.whirlpoolTurns <= 0) {
      next.whirlpoolTargets = [];
      notes.push("Redemoinho Eterno dissipou");
    } else {
      notes.push(`Redemoinho Eterno (${next.whirlpoolTurns} turno(s))`);
    }
  }

  return { meta: next, bossMp: mp, bossEst: est, dragDamages, whirlpoolDamages, notes };
}

export type JormungandrSkillId =
  | "golpe-de-cauda"
  | "jato-de-profundidade"
  | "inundacao"
  | "redemoinho-eterno"
  | "respiracao-do-abismo"
  | "fim-das-aguas";

export type JormungandrSkillDef = {
  id: JormungandrSkillId;
  name: string;
  unlockLevel: number;
  ultimate?: boolean;
  costMp?: number;
  costEst?: number;
  costMpPct?: number;
  costEstPct?: number;
};

export const JORMUNGANDR_SKILLS: JormungandrSkillDef[] = [
  { id: "golpe-de-cauda", name: "Golpe de Cauda", unlockLevel: 12, costMp: 20, costEst: 15 },
  { id: "jato-de-profundidade", name: "Jato de Profundidade", unlockLevel: 12, costMp: 25, costEst: 20 },
  { id: "inundacao", name: "Inundação", unlockLevel: 12, costMp: 35, costEst: 25 },
  { id: "redemoinho-eterno", name: "Redemoinho Eterno", unlockLevel: 200, costMp: 45, costEst: 35 },
  { id: "respiracao-do-abismo", name: "Respiração do Abismo", unlockLevel: 300, costMp: 55, costEst: 45 },
  {
    id: "fim-das-aguas",
    name: "Fim das Águas — Ragnarök",
    unlockLevel: 400,
    ultimate: true,
    costMpPct: 0.1,
    costEstPct: 0.1,
  },
];

export function jormungandrSkillByName(name: string): JormungandrSkillDef | null {
  const n = name.trim().toLowerCase();
  return (
    JORMUNGANDR_SKILLS.find(
      (s) =>
        s.name.toLowerCase() === n ||
        s.id === n ||
        s.name.toLowerCase().includes(n.replace(/[—–-]/g, " ").slice(0, 12)),
    ) ?? null
  );
}

export type JormungandrTarget = {
  id: string;
  hp: number;
  maxHp: number;
};

export type JormungandrResolveResult = {
  meta: JormungandrMeta;
  bossHp: number;
  bossMp: number;
  bossEst: number;
  damages: { targetId: string; damage: number; killed: boolean }[];
  notes: string[];
};

export function resolveJormungandrSkill(
  skillName: string,
  opts: {
    level: number;
    baseStats: JormungandrBossStats;
    meta: JormungandrMeta;
    bossHp: number;
    bossMp: number;
    bossEst: number;
    primaryTargetId: string;
    targets: JormungandrTarget[];
    rollDie: (n: number) => number;
  },
): JormungandrResolveResult | null {
  const skill = jormungandrSkillByName(skillName);
  if (!skill || opts.level < skill.unlockLevel) return null;

  let meta: JormungandrMeta = {
    ...opts.meta,
    adjacentTurns: { ...opts.meta.adjacentTurns },
    wet: { ...opts.meta.wet },
    whirlpoolTargets: [...opts.meta.whirlpoolTargets],
  };
  const stats = jormungandrEffectiveStats(opts.baseStats, meta, opts.bossHp);
  let mp = opts.bossMp;
  let est = opts.bossEst;
  let bossHp = opts.bossHp;
  const notes: string[] = [];
  const damages: JormungandrResolveResult["damages"] = [];

  const costMp = skill.costMpPct
    ? Math.floor(stats.mp * skill.costMpPct)
    : skill.costMp ?? 0;
  const costEst = skill.costEstPct
    ? Math.floor(stats.est * skill.costEstPct)
    : skill.costEst ?? 0;
  if (mp < costMp || est < costEst) {
    notes.push("Jörmungandr: recursos insuficientes");
    return null;
  }
  mp -= costMp;
  est -= costEst;

  const primary =
    opts.targets.find((t) => t.id === opts.primaryTargetId) ?? opts.targets[0];
  if (!primary) return null;

  const hit = (t: JormungandrTarget, raw: number) => {
    let dmg = Math.max(1, raw);
    if (meta.worldCircle) dmg = Math.floor(dmg * 1.05);
    const killed = t.hp - dmg <= 0;
    damages.push({ targetId: t.id, damage: dmg, killed });
    return dmg;
  };

  if (skill.id === "golpe-de-cauda") {
    const slice = opts.targets.slice(0, 3);
    for (const t of slice) {
      hit(t, Math.floor(stats.atk * 0.95) + opts.rollDie(8));
    }
    notes.push("Golpe de Cauda: área + empurrão");
  } else if (skill.id === "jato-de-profundidade") {
    for (const t of opts.targets) {
      hit(t, Math.floor(stats.atkMgc * 0.85) + opts.rollDie(6));
      meta = applyWet(meta, t.id, 2);
    }
    notes.push("Jato de Profundidade: linha + Molhado");
  } else if (skill.id === "inundacao") {
    for (const t of opts.targets) {
      hit(t, Math.floor(stats.atkMgc * 0.7) + opts.rollDie(6));
      meta = applyWet(meta, t.id, 2);
    }
    notes.push("Inundação: área + Molhado");
  } else if (skill.id === "redemoinho-eterno") {
    meta.whirlpoolTurns = 2;
    meta.whirlpoolTargets = opts.targets.map((t) => t.id);
    for (const t of opts.targets) {
      hit(t, Math.floor(stats.atkMgc * 0.6) + opts.rollDie(6));
    }
    notes.push("Redemoinho Eterno: vórtice 2 turnos");
  } else if (skill.id === "respiracao-do-abismo") {
    for (const t of opts.targets) {
      hit(
        t,
        Math.floor(stats.atkMgc * 1.25) + opts.rollDie(10) + opts.rollDie(8),
      );
    }
    notes.push("Respiração do Abismo: linha massiva");
  } else if (skill.id === "fim-das-aguas") {
    meta.worldCircle = true;
    for (const t of opts.targets) {
      hit(
        t,
        Math.floor(stats.atk * 1.2) +
          Math.floor(stats.atkMgc * 1.3) +
          opts.rollDie(12) +
          opts.rollDie(12),
      );
      meta = applyWet(meta, t.id, 99);
    }
    notes.push("Fim das Águas — Ragnarök: Molhado permanente neste combate");
    const ratio = opts.baseStats.hp > 0 ? opts.bossHp / opts.baseStats.hp : 1;
    if (ratio <= 0.25) {
      const heal = Math.floor(opts.baseStats.hp * 0.15);
      bossHp = Math.min(opts.baseStats.hp, bossHp + heal);
      meta.doubleRegen = true;
      meta.ragnarok = true;
      notes.push(`Renascimento: +${heal} HP, regen MP/EST dobrada`);
    }
  }

  return { meta, bossHp, bossMp: mp, bossEst: est, damages, notes };
}
