/**
 * Wendigo — kit de World Boss 100% funcional (regras de combate).
 * Independente de narrativa em WORLD_BOSS_DETAILS; o motor chama estas funções.
 */

export type WendigoMeta = {
  hunger: number;
  /** ações extras no próximo turno do boss */
  extraActionsPending: number;
  /** % ATK acumulado (máx 40) */
  fomeAtkPct: number;
  /** % AGI acumulado (máx 20) */
  fomeAgiPct: number;
  /** escudo Carne Extra */
  carneExtra: number;
  /** multiplicador permanente de atributos (1 + 0.1 * kills) */
  permanentAttrMult: number;
  /** turnos desde o início (para fome a cada 3) */
  turnsElapsed: number;
  /** alvos sob névoa da morte (ids) */
  nevoaTargets: string[];
};

export function emptyWendigoMeta(): WendigoMeta {
  return {
    hunger: 0,
    extraActionsPending: 0,
    fomeAtkPct: 0,
    fomeAgiPct: 0,
    carneExtra: 0,
    permanentAttrMult: 1,
    turnsElapsed: 0,
    nevoaTargets: [],
  };
}

export type WendigoBossStats = {
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

export function wendigoEffectiveStats(
  base: WendigoBossStats,
  meta: WendigoMeta,
): WendigoBossStats {
  const m = meta.permanentAttrMult;
  const atkMult = m * (1 + meta.fomeAtkPct / 100);
  const agiMult = m * (1 + meta.fomeAgiPct / 100);
  return {
    hp: Math.floor(base.hp * m),
    mp: Math.floor(base.mp * m),
    est: Math.floor(base.est * m),
    atk: Math.max(1, Math.floor(base.atk * atkMult)),
    atkMgc: Math.max(1, Math.floor(base.atkMgc * m)),
    agi: Math.max(1, Math.floor(base.agi * agiMult)),
    def: Math.max(1, Math.floor(base.def * m)),
    res: Math.max(1, Math.floor(base.res * m)),
    int: Math.max(1, Math.floor(base.int * m)),
    san: Math.floor(base.san * m),
  };
}

/** EST cost +25% (Presença da Neve Eterna) */
export function wendigoEstCostMultiplier(): number {
  return 1.25;
}

/** Fome a cada 3 turnos desde o início */
export function wendigoOnTurnAdvance(meta: WendigoMeta): {
  meta: WendigoMeta;
  notes: string[];
} {
  const notes: string[] = [];
  const next = { ...meta, turnsElapsed: meta.turnsElapsed + 1 };
  if (next.turnsElapsed > 0 && next.turnsElapsed % 3 === 0) {
    next.hunger += 1;
    next.extraActionsPending += 1;
    notes.push(
      `Wendigo: Fome nível ${next.hunger} — +1 ação extra no próximo turno`,
    );
  }
  return { meta: next, notes };
}

/** Inimigo sofreu dano → Fome Incessante */
export function wendigoOnEnemyDamaged(
  meta: WendigoMeta,
  opts?: { doubled?: boolean },
): WendigoMeta {
  const mult = opts?.doubled ? 2 : 1;
  return {
    ...meta,
    fomeAtkPct: Math.min(40, meta.fomeAtkPct + 4 * mult),
    fomeAgiPct: Math.min(20, meta.fomeAgiPct + 2 * mult),
  };
}

/** Alguém caiu → fome + heal 15% max + dobro Fome Incessante + Vazio +10% attrs */
export function wendigoOnEnemyFallen(
  meta: WendigoMeta,
  bossMaxHp: number,
  bossCurrentHp: number,
): { meta: WendigoMeta; heal: number; notes: string[] } {
  let m = wendigoOnEnemyDamaged(meta, { doubled: true });
  m = {
    ...m,
    hunger: m.hunger + 1,
    permanentAttrMult: m.permanentAttrMult + 0.1,
  };
  const heal = Math.floor(bossMaxHp * 0.15);
  return {
    meta: m,
    heal,
    notes: [
      `Wendigo devora a queda: +1 Fome (total ${m.hunger}), +15% HP, atributos +10% permanente`,
    ],
  };
}

/** Carne que Rouba: 20% dano → cura; excesso → escudo máx 40% HP */
export function wendigoCarneQueRouba(
  meta: WendigoMeta,
  damageDealt: number,
  bossMaxHp: number,
  bossCurrentHp: number,
): { meta: WendigoMeta; newHp: number; notes: string[] } {
  const steal = Math.floor(damageDealt * 0.2);
  let hp = bossCurrentHp + steal;
  let shield = meta.carneExtra;
  const notes: string[] = [];
  if (hp > bossMaxHp) {
    const excess = hp - bossMaxHp;
    hp = bossMaxHp;
    const cap = Math.floor(bossMaxHp * 0.4);
    shield = Math.min(cap, shield + excess);
    notes.push(`Carne Extra: escudo ${shield}/${cap}`);
  } else if (steal > 0) {
    notes.push(`Carne que Rouba: +${steal} HP`);
  }
  return { meta: { ...meta, carneExtra: shield }, newHp: hp, notes };
}

/** Dano ao boss absorve Carne Extra primeiro */
export function wendigoAbsorbShield(
  meta: WendigoMeta,
  incoming: number,
): { meta: WendigoMeta; remaining: number } {
  if (meta.carneExtra <= 0) return { meta, remaining: incoming };
  if (incoming <= meta.carneExtra) {
    return {
      meta: { ...meta, carneExtra: meta.carneExtra - incoming },
      remaining: 0,
    };
  }
  const left = incoming - meta.carneExtra;
  return { meta: { ...meta, carneExtra: 0 }, remaining: left };
}

/** Vazio Interior: mult de dano vs alvo por HP ratio */
export function wendigoVoidDamageMult(targetHpRatio: number): number {
  if (targetHpRatio < 0.5) return 1.3;
  return 1;
}

export function wendigoBlocksHeal(targetHpRatio: number): boolean {
  return targetHpRatio < 0.25;
}

export type WendigoSkillId =
  | "garras-de-gelo"
  | "uivo-da-solidao"
  | "passo-do-esquecimento"
  | "fome-que-avanca"
  | "nevoa-da-morte"
  | "devoracao-absoluta";

export type WendigoSkillDef = {
  id: WendigoSkillId;
  name: string;
  unlockLevel: number;
  ultimate?: boolean;
  costMp?: number;
  costEst?: number;
  costMpPct?: number;
  costEstPct?: number;
};

export const WENDIGO_SKILLS: WendigoSkillDef[] = [
  { id: "garras-de-gelo", name: "Garras de Gelo", unlockLevel: 12, costMp: 20, costEst: 18 },
  { id: "uivo-da-solidao", name: "Uivo da Solidão", unlockLevel: 12, costMp: 28, costEst: 22 },
  { id: "passo-do-esquecimento", name: "Passo do Esquecimento", unlockLevel: 12, costMp: 25, costEst: 28 },
  { id: "fome-que-avanca", name: "Fome que Avança", unlockLevel: 200, costMp: 35, costEst: 35 },
  { id: "nevoa-da-morte", name: "Névoa da Morte", unlockLevel: 300, costMp: 45, costEst: 40 },
  {
    id: "devoracao-absoluta",
    name: "Devoração Absoluta",
    unlockLevel: 400,
    ultimate: true,
    costMpPct: 0.1,
    costEstPct: 0.12,
  },
];

export function wendigoSkillByName(name: string): WendigoSkillDef | null {
  const n = name.trim().toLowerCase();
  return WENDIGO_SKILLS.find((s) => s.name.toLowerCase() === n || s.id === n) ?? null;
}

export type WendigoTargetState = {
  id: string;
  hp: number;
  maxHp: number;
  coldStacks: number;
  frozen: boolean;
};

export type WendigoResolveResult = {
  meta: WendigoMeta;
  bossHp: number;
  bossMp: number;
  bossEst: number;
  damages: { targetId: string; damage: number; killed: boolean }[];
  coldApplies: { targetId: string; stacks: number }[];
  freezes: string[];
  healCut: string[];
  notes: string[];
};

function baseStrikeDamage(
  stats: WendigoBossStats,
  rollDie: (n: number) => number,
  _defPad: number,
  ignoreDefPct = 0,
): number {
  const raw = stats.atk + rollDie(8) + rollDie(8);
  const defFactor = 1 - ignoreDefPct * 0.5;
  return Math.max(1, Math.floor(raw * defFactor));
}

export function resolveWendigoSkill(
  skillName: string,
  opts: {
    level: number;
    baseStats: WendigoBossStats;
    meta: WendigoMeta;
    bossHp: number;
    bossMp: number;
    bossEst: number;
    primaryTargetId: string;
    targets: WendigoTargetState[];
    rollDie: (n: number) => number;
  },
): WendigoResolveResult | null {
  const skill = wendigoSkillByName(skillName);
  if (!skill || opts.level < skill.unlockLevel) return null;

  const stats = wendigoEffectiveStats(opts.baseStats, opts.meta);
  let mp = opts.bossMp;
  let est = opts.bossEst;
  let meta = { ...opts.meta, nevoaTargets: [...opts.meta.nevoaTargets] };
  const notes: string[] = [];
  const damages: WendigoResolveResult["damages"] = [];
  const coldApplies: WendigoResolveResult["coldApplies"] = [];
  const freezes: string[] = [];
  const healCut: string[] = [];

  const costMp = skill.costMpPct
    ? Math.floor(stats.mp * skill.costMpPct)
    : skill.costMp ?? 0;
  const costEst = skill.costEstPct
    ? Math.floor(stats.est * skill.costEstPct)
    : skill.costEst ?? 0;
  if (mp < costMp || est < costEst) {
    notes.push("Wendigo: recursos insuficientes");
    return null;
  }
  mp -= costMp;
  est -= costEst;

  const primary =
    opts.targets.find((t) => t.id === opts.primaryTargetId) ?? opts.targets[0];
  if (!primary) return null;

  const applyHit = (t: WendigoTargetState, dmg: number, cold = 0) => {
    const ratio = t.maxHp > 0 ? t.hp / t.maxHp : 1;
    const final = Math.floor(dmg * wendigoVoidDamageMult(ratio));
    const killed = t.hp - final <= 0;
    damages.push({ targetId: t.id, damage: final, killed });
    if (cold > 0) coldApplies.push({ targetId: t.id, stacks: cold });
    const newStacks = Math.min(3, t.coldStacks + cold);
    if (newStacks >= 3) freezes.push(t.id);
    return final;
  };

  if (skill.id === "garras-de-gelo") {
    const dmg = baseStrikeDamage(stats, opts.rollDie, 8);
    const dealt = applyHit(primary, dmg, 1);
    notes.push(`Garras de Gelo: ${dealt} dano + Frio`);
  } else if (skill.id === "uivo-da-solidao") {
    for (const t of opts.targets) {
      const dmg = Math.max(1, Math.floor(stats.atkMgc * 0.6) + opts.rollDie(6));
      applyHit(t, dmg, 0);
      healCut.push(t.id);
    }
    notes.push("Uivo da Solidão: área — dano, -AGI, -20% cura");
  } else if (skill.id === "passo-do-esquecimento") {
    const dmg = baseStrikeDamage(stats, opts.rollDie, 8, 0.15);
    const dealt = applyHit(primary, Math.floor(dmg * 1.15), 1);
    notes.push(`Passo do Esquecimento: ${dealt} (costas, -15% DEF, Frio)`);
  } else if (skill.id === "fome-que-avanca") {
    let d1 = baseStrikeDamage(stats, opts.rollDie, 10);
    if (primary.frozen) d1 = Math.floor(d1 * 1.3);
    applyHit(primary, d1, 1);
    let d2 = baseStrikeDamage(stats, opts.rollDie, 10);
    if (primary.frozen) d2 = Math.floor(d2 * 1.3);
    applyHit(primary, d2, 0);
    notes.push("Fome que Avança: golpe duplo");
  } else if (skill.id === "nevoa-da-morte") {
    meta.nevoaTargets = opts.targets.map((t) => t.id);
    for (const t of opts.targets) {
      const dmg = Math.max(1, Math.floor(stats.atkMgc * 0.4) + opts.rollDie(4));
      applyHit(t, dmg, 1);
    }
    notes.push("Névoa da Morte: zona ativa");
  } else if (skill.id === "devoracao-absoluta") {
    for (const t of opts.targets) {
      let dmg =
        Math.floor(stats.atk * 1.5) +
        Math.floor(stats.atkMgc) +
        opts.rollDie(12) +
        opts.rollDie(12);
      const ratio = t.maxHp > 0 ? t.hp / t.maxHp : 1;
      if (ratio < 0.3) dmg += Math.floor((t.maxHp - t.hp) * 0.5);
      applyHit(t, dmg, 1);
    }
    notes.push("Devoração Absoluta");
  }

  const totalDealt = damages.reduce((a, d) => a + d.damage, 0);
  let bossHp = opts.bossHp;
  const carne = wendigoCarneQueRouba(meta, totalDealt, stats.hp, bossHp);
  meta = carne.meta;
  bossHp = carne.newHp;
  notes.push(...carne.notes);

  if (totalDealt > 0) meta = wendigoOnEnemyDamaged(meta);

  for (const d of damages) {
    if (!d.killed) continue;
    const fallen = wendigoOnEnemyFallen(meta, stats.hp, bossHp);
    meta = fallen.meta;
    bossHp = Math.min(stats.hp, bossHp + fallen.heal);
    notes.push(...fallen.notes);
    if (skill.id === "devoracao-absoluta") {
      meta = { ...meta, hunger: meta.hunger + 1 };
      bossHp = Math.min(stats.hp, bossHp + Math.floor(stats.hp * 0.5));
      notes.push("Devoração: +50% HP e +2 Fome pela queda");
    }
  }

  return {
    meta,
    bossHp,
    bossMp: mp,
    bossEst: est,
    damages,
    coldApplies,
    freezes,
    healCut,
    notes,
  };
}

export function wendigoNevoaTick(
  meta: WendigoMeta,
  stats: WendigoBossStats,
  targets: WendigoTargetState[],
  rollDie: (n: number) => number,
): {
  damages: { targetId: string; damage: number }[];
  coldApplies: { targetId: string; stacks: number }[];
} {
  if (!meta.nevoaTargets.length) return { damages: [], coldApplies: [] };
  const damages: { targetId: string; damage: number }[] = [];
  const coldApplies: { targetId: string; stacks: number }[] = [];
  for (const id of meta.nevoaTargets) {
    const t = targets.find((x) => x.id === id);
    if (!t || t.hp <= 0) continue;
    const dmg = Math.max(1, Math.floor(stats.atkMgc * 0.25) + rollDie(4));
    damages.push({ targetId: id, damage: dmg });
    coldApplies.push({ targetId: id, stacks: 1 });
  }
  return { damages, coldApplies };
}
