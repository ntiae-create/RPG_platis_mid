/**
 * Fenrir — kit World Boss (Corrente Gleipnir + Fúria do Corpo).
 */

export type FenrirMeta = {
  turnsElapsed: number;
  /** enfraquecimentos da corrente (rompe em 4) */
  gleipnirStacks: number;
  gleipnirBroken: boolean;
  /** Fúria do Corpo: +4% ATK por golpe, máx +30% */
  furyPct: number;
  /** turnos consecutivos sem inimigo "adjacente" */
  turnsAwayFromEnemies: number;
  /** postura quebrada nos alvos (1 turno sem bônus DEF) */
  brokenGuard: Record<string, number>;
};

export function emptyFenrirMeta(): FenrirMeta {
  return {
    turnsElapsed: 0,
    gleipnirStacks: 0,
    gleipnirBroken: false,
    furyPct: 0,
    turnsAwayFromEnemies: 0,
    brokenGuard: {},
  };
}

export type FenrirForm =
  | "lobo-selvagem"
  | "fera-furia"
  | "pressagiado-ragnarok"
  | "mandibula-destino"
  | "ragnarok-fim-deuses";

export function fenrirFormForLevel(level: number): FenrirForm {
  if (level >= 400) return "ragnarok-fim-deuses";
  if (level >= 300) return "mandibula-destino";
  if (level >= 200) return "pressagiado-ragnarok";
  if (level >= 100) return "fera-furia";
  return "lobo-selvagem";
}

export function fenrirFormLabel(form: FenrirForm): string {
  switch (form) {
    case "lobo-selvagem":
      return "Lobo Selvagem";
    case "fera-furia":
      return "Fera da Fúria Crescente";
    case "pressagiado-ragnarok":
      return "O Pressagiado do Ragnarök";
    case "mandibula-destino":
      return "A Mandíbula do Destino";
    case "ragnarok-fim-deuses":
      return "Ragnarök — O Fim dos Deuses";
  }
}

export type FenrirBossStats = {
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

/** ATK efetivo: Gleipnir -12% se presa; +15% permanente se rompida; fúria; supremas */
export function fenrirEffectiveAtk(
  baseAtk: number,
  meta: FenrirMeta,
  bossHpRatio: number,
): number {
  let mult = 1;
  if (!meta.gleipnirBroken) mult *= 0.88;
  else mult *= 1.15;
  mult *= 1 + Math.min(0.3, meta.furyPct / 100);
  return Math.max(1, Math.floor(baseAtk * mult));
}

export function fenrirEffectiveDef(
  baseDef: number,
  bossHpRatio: number,
): number {
  let mult = 1;
  if (bossHpRatio <= 0.25) mult *= 1.3;
  else if (bossHpRatio <= 0.5) mult *= 1.15;
  return Math.max(1, Math.floor(baseDef * mult));
}

export function fenrirEffectiveStats(
  base: FenrirBossStats,
  meta: FenrirMeta,
  bossHp: number,
): FenrirBossStats {
  const ratio = base.hp > 0 ? bossHp / base.hp : 1;
  return {
    ...base,
    atk: fenrirEffectiveAtk(base.atk, meta, ratio),
    def: fenrirEffectiveDef(base.def, ratio),
  };
}

/** % DEF ignorada */
export function fenrirIgnoreDefPct(meta: FenrirMeta, bossHpRatio: number): number {
  if (bossHpRatio <= 0.25) return 0.5; // Força Absoluta
  if (meta.gleipnirBroken) return 0.25; // Peso do Mundo baseline when free? kit says supreme ignores 25 always when active - treat as always when broken or always at high power
  return 0.25; // O Peso do Mundo — Suprema (ativa no kit como regra geral de penetração)
}

/** Enfraquece Gleipnir (golpe físico ok ou dano recebido) */
export function fenrirWeakenGleipnir(meta: FenrirMeta): {
  meta: FenrirMeta;
  notes: string[];
} {
  if (meta.gleipnirBroken) return { meta, notes: [] };
  const stacks = meta.gleipnirStacks + 1;
  const notes: string[] = [`Gleipnir enfraquece (${stacks}/4)`];
  if (stacks >= 4) {
    return {
      meta: {
        ...meta,
        gleipnirStacks: 4,
        gleipnirBroken: true,
      },
      notes: [...notes, "Gleipnir se rompe! +15% ATK permanente; críticos empurram"],
    };
  }
  return { meta: { ...meta, gleipnirStacks: stacks }, notes };
}

/** Fúria: +4% por golpe (máx 30) */
export function fenrirAddFury(meta: FenrirMeta): FenrirMeta {
  return {
    ...meta,
    furyPct: Math.min(30, meta.furyPct + 4),
    turnsAwayFromEnemies: 0,
  };
}

export function fenrirOnTurnAdvance(
  meta: FenrirMeta,
  hasAdjacentEnemy: boolean,
): { meta: FenrirMeta; notes: string[] } {
  const notes: string[] = [];
  let next: FenrirMeta = {
    ...meta,
    turnsElapsed: meta.turnsElapsed + 1,
    brokenGuard: { ...meta.brokenGuard },
  };

  // tick broken guard
  for (const id of Object.keys(next.brokenGuard)) {
    next.brokenGuard[id] -= 1;
    if (next.brokenGuard[id] <= 0) delete next.brokenGuard[id];
  }

  if (hasAdjacentEnemy) {
    next.turnsAwayFromEnemies = 0;
  } else {
    next.turnsAwayFromEnemies += 1;
    if (next.turnsAwayFromEnemies >= 2 && next.furyPct > 0) {
      next.furyPct = Math.max(0, next.furyPct - 4);
      notes.push(`Fúria do Corpo decai (−4%, agora +${next.furyPct}% ATK)`);
    }
  }

  return { meta: next, notes };
}

/** 10% quebrar guarda */
export function fenrirTryBreakGuard(
  meta: FenrirMeta,
  targetId: string,
  roll: () => number,
): { meta: FenrirMeta; broke: boolean } {
  if (roll() < 0.1) {
    return {
      meta: {
        ...meta,
        brokenGuard: { ...meta.brokenGuard, [targetId]: 1 },
      },
      broke: true,
    };
  }
  return { meta, broke: false };
}

export type FenrirSkillId =
  | "mordida-da-fera"
  | "garras-rachadoras"
  | "corrida-do-predador"
  | "pisada-colossal"
  | "chibatada-de-cauda"
  | "mandibula-do-ragnarok";

export type FenrirSkillDef = {
  id: FenrirSkillId;
  name: string;
  unlockLevel: number;
  ultimate?: boolean;
  costMp?: number;
  costEst?: number;
  costMpPct?: number;
  costEstPct?: number;
};

export const FENRIR_SKILLS: FenrirSkillDef[] = [
  { id: "mordida-da-fera", name: "Mordida da Fera", unlockLevel: 12, costMp: 15, costEst: 22 },
  { id: "garras-rachadoras", name: "Garras Rachadoras", unlockLevel: 12, costMp: 18, costEst: 25 },
  { id: "corrida-do-predador", name: "Corrida do Predador", unlockLevel: 12, costMp: 20, costEst: 30 },
  { id: "pisada-colossal", name: "Pisada Colossal", unlockLevel: 200, costMp: 28, costEst: 38 },
  { id: "chibatada-de-cauda", name: "Chibatada de Cauda", unlockLevel: 300, costMp: 32, costEst: 42 },
  {
    id: "mandibula-do-ragnarok",
    name: "MANDÍBULA DO RAGNARÖK",
    unlockLevel: 400,
    ultimate: true,
    costMpPct: 0.08,
    costEstPct: 0.12,
  },
];

export function fenrirSkillByName(name: string): FenrirSkillDef | null {
  const n = name.trim().toLowerCase();
  return (
    FENRIR_SKILLS.find(
      (s) => s.name.toLowerCase() === n || s.id === n || s.name.toLowerCase().includes(n),
    ) ?? null
  );
}

export type FenrirTarget = {
  id: string;
  hp: number;
  maxHp: number;
  /** simplificação: adjacente ao boss */
  adjacent?: boolean;
};

export type FenrirResolveResult = {
  meta: FenrirMeta;
  bossHp: number;
  bossMp: number;
  bossEst: number;
  damages: { targetId: string; damage: number; killed: boolean }[];
  /** perde ação próximo turno */
  actionLocks: string[];
  notes: string[];
};

export function resolveFenrirSkill(
  skillName: string,
  opts: {
    level: number;
    baseStats: FenrirBossStats;
    meta: FenrirMeta;
    bossHp: number;
    bossMp: number;
    bossEst: number;
    primaryTargetId: string;
    targets: FenrirTarget[];
    rollDie: (n: number) => number;
    random?: () => number;
  },
): FenrirResolveResult | null {
  const skill = fenrirSkillByName(skillName);
  if (!skill || opts.level < skill.unlockLevel) return null;

  const random = opts.random ?? Math.random;
  let meta: FenrirMeta = {
    ...opts.meta,
    brokenGuard: { ...opts.meta.brokenGuard },
  };
  const ratio = opts.baseStats.hp > 0 ? opts.bossHp / opts.baseStats.hp : 1;
  const stats = fenrirEffectiveStats(opts.baseStats, meta, opts.bossHp);
  let mp = opts.bossMp;
  let est = opts.bossEst;
  let bossHp = opts.bossHp;
  const notes: string[] = [];
  const damages: FenrirResolveResult["damages"] = [];
  const actionLocks: string[] = [];

  const costMp = skill.costMpPct
    ? Math.floor(stats.mp * skill.costMpPct)
    : skill.costMp ?? 0;
  const costEst = skill.costEstPct
    ? Math.floor(stats.est * skill.costEstPct)
    : skill.costEst ?? 0;
  if (mp < costMp || est < costEst) {
    notes.push("Fenrir: recursos insuficientes");
    return null;
  }
  mp -= costMp;
  est -= costEst;

  const primary =
    opts.targets.find((t) => t.id === opts.primaryTargetId) ?? opts.targets[0];
  if (!primary) return null;

  const applyHit = (
    t: FenrirTarget,
    raw: number,
    extraIgnoreDef = 0,
  ) => {
    let dmg = raw;
    if (t.adjacent !== false) dmg = Math.floor(dmg * 1.15); // Força Bruta adjacente default
    const ignore = Math.min(0.9, fenrirIgnoreDefPct(meta, ratio) + extraIgnoreDef);
    dmg = Math.floor(dmg * (1 + ignore * 0.4));
    if (meta.brokenGuard[t.id]) dmg = Math.floor(dmg * 1.1);
    dmg = Math.max(1, dmg);
    const killed = t.hp - dmg <= 0;
    damages.push({ targetId: t.id, damage: dmg, killed });

    meta = fenrirAddFury(meta);
    const g = fenrirWeakenGleipnir(meta);
    meta = g.meta;
    notes.push(...g.notes);

    const br = fenrirTryBreakGuard(meta, t.id, random);
    meta = br.meta;
    if (br.broke) notes.push(`Guarda de ${t.id} quebrada`);

    // Força Absoluta heal
    if (ratio <= 0.25) {
      const heal = Math.floor(opts.baseStats.hp * 0.05);
      bossHp = Math.min(opts.baseStats.hp, bossHp + heal);
      if (heal > 0) notes.push(`Força Absoluta: +${heal} HP`);
    }
    return dmg;
  };

  if (skill.id === "mordida-da-fera") {
    let raw = Math.floor(stats.atk * 1.2) + opts.rollDie(10);
    const tRatio = primary.maxHp > 0 ? primary.hp / primary.maxHp : 1;
    if (tRatio < 0.5) {
      raw = Math.floor(raw * 1.2);
      notes.push("Mordida da Fera: alvo ferido — acerto garantido +20% dano");
    }
    applyHit(primary, raw);
  } else if (skill.id === "garras-rachadoras") {
    const d1 = applyHit(primary, stats.atk + opts.rollDie(8));
    notes.push(`Garras: 1º golpe ${d1}`);
    applyHit(primary, Math.floor(stats.atk * 0.9) + opts.rollDie(8), 0.2);
    notes.push("Garras: 2º golpe ignora +20% DEF");
  } else if (skill.id === "corrida-do-predador") {
    for (const t of opts.targets) {
      applyHit(t, Math.floor(stats.atk * 0.9) + opts.rollDie(6));
      actionLocks.push(t.id);
    }
    notes.push("Corrida do Predador: linha — derruba e remove ação");
  } else if (skill.id === "pisada-colossal") {
    for (const t of opts.targets) {
      let raw = Math.floor(stats.atk * 1.1) + opts.rollDie(8);
      // colisão obstáculo simplificada: +15% se "adjacent"
      if (t.adjacent) raw = Math.floor(raw * 1.15);
      applyHit(t, raw);
    }
    notes.push("Pisada Colossal: área + empurrão");
  } else if (skill.id === "chibatada-de-cauda") {
    for (const t of opts.targets) {
      applyHit(t, Math.floor(stats.atk * 1.05) + opts.rollDie(8));
      meta = {
        ...meta,
        brokenGuard: { ...meta.brokenGuard, [t.id]: 1 },
      };
    }
    notes.push("Chibatada de Cauda: quebra postura 1 turno");
  } else if (skill.id === "mandibula-do-ragnarok") {
    let ignoreExtra = meta.gleipnirBroken ? 0.25 : 0;
    applyHit(
      primary,
      Math.floor(stats.atk * 1.8) + opts.rollDie(12) + opts.rollDie(12),
      ignoreExtra,
    );
    for (const t of opts.targets) {
      if (t.id === primary.id) continue;
      applyHit(t, Math.floor(stats.atk * 0.7) + opts.rollDie(6), ignoreExtra);
    }
    if (meta.gleipnirBroken) {
      const heal = Math.floor(opts.baseStats.hp * 0.1);
      bossHp = Math.min(opts.baseStats.hp, bossHp + heal);
      notes.push(`Ragnarök: Gleipnir rompida — penetração dobrada, +${heal} HP`);
    } else {
      notes.push("MANDÍBULA DO RAGNARÖK");
    }
  }

  return {
    meta,
    bossHp,
    bossMp: mp,
    bossEst: est,
    damages,
    actionLocks,
    notes,
  };
}
