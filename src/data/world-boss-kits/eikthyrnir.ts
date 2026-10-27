/**
 * Eikthyrnir — kit World Boss (Efeitos de Natureza + Imortal Terrestre).
 */

export type DamageAttribute =
  | "physical"
  | "fire"
  | "water"
  | "earth"
  | "wind"
  | "light"
  | "dark"
  | "arcane"
  | "nature"
  | "other";

export type EikthyrnirMeta = {
  turnsElapsed: number;
  /** 0–10+ efeitos de natureza */
  natureStacks: number;
  /** fase Temor / Postura ≤20% HP */
  terrestrialStance: boolean;
  /** Imortal Terrestre ativa (começou com 10 stacks) */
  immortalTerrestrial: boolean;
  /** atributos já usados nesta rodada (não repetir) */
  attributesThisRound: DamageAttribute[];
  /** histórico recente por atacante: atributos usados na janela */
  attackerHistory: Record<string, DamageAttribute[]>;
  /** Colisão da Natureza: proteger stacks por 1 rodada */
  protectNatureRounds: number;
  /** Natureza Primordial (ultimate com 10 stacks) */
  primordialRound: boolean;
  /** rodada seguinte ao ultimate: viola atributo → stun */
  strictNoRepeatRound: boolean;
};

export function emptyEikthyrnirMeta(): EikthyrnirMeta {
  return {
    turnsElapsed: 0,
    natureStacks: 0,
    terrestrialStance: false,
    immortalTerrestrial: false,
    attributesThisRound: [],
    attackerHistory: {},
    protectNatureRounds: 0,
    primordialRound: false,
    strictNoRepeatRound: false,
  };
}

export function eikthyrnirAttributeWindow(level: number): number {
  if (level >= 400) return 6;
  if (level >= 300) return 5;
  if (level >= 200) return 4;
  if (level >= 100) return 3;
  return 2;
}

export type EikthyrnirBossStats = {
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

/** DEF/ATK por faixa de HP */
export function eikthyrnirHpBandBonus(hpRatio: number): number {
  if (hpRatio <= 0.25) return 0.3;
  if (hpRatio <= 0.5) return 0.2;
  if (hpRatio <= 0.75) return 0.1;
  return 0;
}

export function eikthyrnirEffectiveStats(
  base: EikthyrnirBossStats,
  meta: EikthyrnirMeta,
  bossHp: number,
): EikthyrnirBossStats {
  const ratio = base.hp > 0 ? bossHp / base.hp : 1;
  const band = eikthyrnirHpBandBonus(ratio);
  const stackMult = 1 + meta.natureStacks * 0.1;
  let atk = Math.floor(base.atk * (1 + band) * stackMult);
  let atkMgc = Math.floor(base.atkMgc * stackMult);
  let def = Math.floor(base.def * (1 + band));
  if (meta.primordialRound) {
    atk = Math.floor(atk * 2);
    atkMgc = Math.floor(atkMgc * 2);
  }
  return { ...base, atk, atkMgc, def };
}

/** Imortal enquanto Immortal Terrestre e stacks > 0 */
export function eikthyrnirIsImmortal(meta: EikthyrnirMeta): boolean {
  return meta.immortalTerrestrial && meta.natureStacks > 0;
}

export function eikthyrnirEnterImmortalPhase(meta: EikthyrnirMeta): EikthyrnirMeta {
  return {
    ...meta,
    immortalTerrestrial: true,
    natureStacks: Math.max(meta.natureStacks, 10),
    terrestrialStance: true,
  };
}

/**
 * Quando um ataque atinge Eikthyrnir:
 * - não pode repetir atributo na mesma rodada (retorna blocked)
 * - remove 1 stack (se não protegido)
 * - se mesmo atacante repetir atributo na janela → +1 stack
 */
export function eikthyrnirOnDamaged(
  meta: EikthyrnirMeta,
  opts: {
    attackerId: string;
    attribute: DamageAttribute;
    level: number;
    bossHpRatio: number;
  },
): {
  meta: EikthyrnirMeta;
  blocked: boolean;
  reflectMagic: boolean;
  stunAttacker: boolean;
  notes: string[];
} {
  const notes: string[] = [];
  let next: EikthyrnirMeta = {
    ...meta,
    attributesThisRound: [...meta.attributesThisRound],
    attackerHistory: { ...meta.attackerHistory },
  };

  // Postura ≤20%
  if (opts.bossHpRatio <= 0.2) {
    next.terrestrialStance = true;
  }

  // Entrada Imortal Terrestre automática se ≤20% e ainda não ativou
  if (opts.bossHpRatio <= 0.2 && !next.immortalTerrestrial) {
    next = eikthyrnirEnterImmortalPhase(next);
    notes.push("Temor da Terra — Imortal Terrestre: 10 Efeitos de Natureza");
  }

  // Mesmo atributo na rodada
  if (next.attributesThisRound.includes(opts.attribute)) {
    const stun =
      next.strictNoRepeatRound === true;
    notes.push(
      `Atributo ${opts.attribute} já usado nesta rodada — ataque bloqueado` +
        (stun ? " (Stun 1 turno)" : ""),
    );
    return {
      meta: next,
      blocked: true,
      reflectMagic: false,
      stunAttacker: stun,
      notes,
    };
  }
  next.attributesThisRound.push(opts.attribute);

  // Histórico do atacante na janela
  const window = eikthyrnirAttributeWindow(opts.level);
  const hist = [...(next.attackerHistory[opts.attackerId] ?? [])];
  const repeatedInWindow = hist.includes(opts.attribute);
  hist.push(opts.attribute);
  while (hist.length > window) hist.shift();
  next.attackerHistory[opts.attackerId] = hist;

  if (repeatedInWindow) {
    next.natureStacks += 1;
    notes.push(
      `Mesmo atributo na janela (${window}): +1 Efeito de Natureza (agora ${next.natureStacks})`,
    );
  }

  // Remove 1 stack se não protegido / não primordial
  if (
    next.protectNatureRounds <= 0 &&
    !next.primordialRound &&
    next.natureStacks > 0
  ) {
    next.natureStacks -= 1;
    notes.push(`Efeito de Natureza removido (${next.natureStacks} restantes)`);
    if (next.immortalTerrestrial && next.natureStacks <= 0) {
      notes.push("Imortalidade quebrada — Eikthyrnir pode ser derrotado");
    }
  } else if (next.protectNatureRounds > 0 || next.primordialRound) {
    notes.push("Efeitos de Natureza protegidos nesta rodada");
  }

  const reflectMagic =
    next.terrestrialStance && opts.bossHpRatio <= 0.2; // Temor Terrestre: mágico refletido

  return {
    meta: next,
    blocked: false,
    reflectMagic,
    stunAttacker: false,
    notes,
  };
}

/** Aplica dano considerando imortalidade (HP mínimo 1) */
export function eikthyrnirApplyIncomingDamage(
  meta: EikthyrnirMeta,
  currentHp: number,
  damage: number,
): { newHp: number; absorbed: boolean } {
  if (eikthyrnirIsImmortal(meta)) {
    const newHp = Math.max(1, currentHp - damage);
    return { newHp, absorbed: currentHp - damage <= 0 };
  }
  return { newHp: Math.max(0, currentHp - damage), absorbed: false };
}

export function eikthyrnirOnTurnAdvance(meta: EikthyrnirMeta): {
  meta: EikthyrnirMeta;
  notes: string[];
} {
  const notes: string[] = [];
  let next: EikthyrnirMeta = {
    ...meta,
    turnsElapsed: meta.turnsElapsed + 1,
    attributesThisRound: [], // nova rodada
    attackerHistory: { ...meta.attackerHistory },
  };

  if (next.protectNatureRounds > 0) {
    next.protectNatureRounds -= 1;
    if (next.protectNatureRounds <= 0) notes.push("Colisão da Natureza encerrou");
  }

  if (next.primordialRound) {
    next.primordialRound = false;
    next.strictNoRepeatRound = true;
    notes.push(
      "Natureza Primordial encerrou — próxima rodada: atributo repetido causa Stun",
    );
  } else if (next.strictNoRepeatRound) {
    next.strictNoRepeatRound = false;
  }

  return { meta: next, notes };
}

export type EikthyrnirSkillId =
  | "chifrada-terrestre"
  | "investida-dos-chifres"
  | "ruptura-terrestre"
  | "ira-da-terra"
  | "colisao-da-natureza"
  | "penitencia-da-natureza";

export type EikthyrnirSkillDef = {
  id: EikthyrnirSkillId;
  name: string;
  unlockLevel: number;
  ultimate?: boolean;
  costMp?: number;
  costEst?: number;
};

export const EIKTHYRNIR_SKILLS: EikthyrnirSkillDef[] = [
  { id: "chifrada-terrestre", name: "Chifrada Terrestre", unlockLevel: 12, costMp: 12, costEst: 16 },
  { id: "investida-dos-chifres", name: "Investida dos Chifres", unlockLevel: 12, costMp: 16, costEst: 20 },
  { id: "ruptura-terrestre", name: "Ruptura Terrestre", unlockLevel: 12, costMp: 22, costEst: 24 },
  { id: "ira-da-terra", name: "Ira da Terra", unlockLevel: 12, costMp: 28, costEst: 22 },
  { id: "colisao-da-natureza", name: "Colisão da Natureza", unlockLevel: 12, costMp: 20, costEst: 18 },
  {
    id: "penitencia-da-natureza",
    name: "Penitência da Natureza",
    unlockLevel: 400,
    ultimate: true,
    costMp: 40,
    costEst: 40,
  },
];

export function eikthyrnirSkillByName(name: string): EikthyrnirSkillDef | null {
  const n = name.trim().toLowerCase();
  return (
    EIKTHYRNIR_SKILLS.find(
      (s) => s.name.toLowerCase() === n || s.id === n,
    ) ?? null
  );
}

export type EikthyrnirTarget = {
  id: string;
  hp: number;
  maxHp: number;
};

export type EikthyrnirResolveResult = {
  meta: EikthyrnirMeta;
  bossHp: number;
  bossMp: number;
  bossEst: number;
  damages: { targetId: string; damage: number; killed: boolean }[];
  notes: string[];
};

export function resolveEikthyrnirSkill(
  skillName: string,
  opts: {
    level: number;
    baseStats: EikthyrnirBossStats;
    meta: EikthyrnirMeta;
    bossHp: number;
    bossMp: number;
    bossEst: number;
    primaryTargetId: string;
    targets: EikthyrnirTarget[];
    rollDie: (n: number) => number;
  },
): EikthyrnirResolveResult | null {
  const skill = eikthyrnirSkillByName(skillName);
  if (!skill || opts.level < skill.unlockLevel) return null;

  let meta: EikthyrnirMeta = {
    ...opts.meta,
    attributesThisRound: [...opts.meta.attributesThisRound],
    attackerHistory: { ...opts.meta.attackerHistory },
  };
  const stats = eikthyrnirEffectiveStats(opts.baseStats, meta, opts.bossHp);
  let mp = opts.bossMp;
  let est = opts.bossEst;
  const bossHp = opts.bossHp;
  const notes: string[] = [];
  const damages: EikthyrnirResolveResult["damages"] = [];

  const costMp = skill.costMp ?? 0;
  const costEst = skill.costEst ?? 0;
  if (mp < costMp || est < costEst) {
    notes.push("Eikthyrnir: recursos insuficientes");
    return null;
  }
  mp -= costMp;
  est -= costEst;

  const primary =
    opts.targets.find((t) => t.id === opts.primaryTargetId) ?? opts.targets[0];
  if (!primary) return null;

  const hit = (t: EikthyrnirTarget, raw: number) => {
    const dmg = Math.max(1, raw);
    damages.push({
      targetId: t.id,
      damage: dmg,
      killed: t.hp - dmg <= 0,
    });
  };

  // D[ATK] ≈ roll em cima do atk efetivo (simplificado)
  const dAtk = () => stats.atk + opts.rollDie(8);
  const dAtkMgc = () => stats.atkMgc + opts.rollDie(8);

  if (skill.id === "chifrada-terrestre") {
    hit(primary, 4 + dAtk());
    notes.push("Chifrada Terrestre");
  } else if (skill.id === "investida-dos-chifres") {
    for (const t of opts.targets) hit(t, 3 + dAtk());
    notes.push("Investida dos Chifres");
  } else if (skill.id === "ruptura-terrestre") {
    for (const t of opts.targets) hit(t, 4 + dAtk());
    notes.push("Ruptura Terrestre");
  } else if (skill.id === "ira-da-terra") {
    for (const t of opts.targets) hit(t, 5 + dAtkMgc());
    meta.natureStacks += 1;
    notes.push(`Ira da Terra: +1 Efeito de Natureza (${meta.natureStacks})`);
  } else if (skill.id === "colisao-da-natureza") {
    meta.protectNatureRounds = 1;
    notes.push("Colisão da Natureza: efeitos protegidos na próxima rodada");
  } else if (skill.id === "penitencia-da-natureza") {
    notes.push("Penitência da Natureza — Domínio da Natureza");
    if (meta.natureStacks >= 10) {
      meta.primordialRound = true;
      meta.protectNatureRounds = Math.max(meta.protectNatureRounds, 1);
      notes.push(
        "Natureza Primordial: +100% ATK/ATK MGC, efeitos não reduzem nesta rodada",
      );
    }
    // dano de domínio
    for (const t of opts.targets) {
      hit(t, Math.floor(stats.atk * 1.2) + Math.floor(stats.atkMgc) + opts.rollDie(12));
    }
  }

  return { meta, bossHp, bossMp: mp, bossEst: est, damages, notes };
}
