/**
 * Tsuchigumo — kit World Boss (Campo de Teias + Fios de Seda).
 */

export type TsuchigumoMeta = {
  /** ids de "celulas"/slots de teia no campo (simplificado: contagem + alvos cobertos) */
  webCount: number;
  /** alvos atualmente sobre teia */
  websOn: string[];
  /** fios de seda por alvo */
  silkStacks: Record<string, number>;
  /** alvos que mudaram de posicao no turno (Sensibilidade) */
  movedThisTurn: string[];
  /** fios nao decaem sozinhos por N turnos (Império) */
  silkLockTurns: number;
  /** Túnel pode repetir no mesmo turno se houver teia */
  tunnelExtraAvailable: boolean;
  turnsElapsed: number;
};

export function emptyTsuchigumoMeta(): TsuchigumoMeta {
  return {
    webCount: 1,
    websOn: [],
    silkStacks: {},
    movedThisTurn: [],
    silkLockTurns: 0,
    tunnelExtraAvailable: false,
    turnsElapsed: 0,
  };
}

export type TsuchiBossStats = {
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

export function tsuchiEffectiveStats(
  base: TsuchiBossStats,
  meta: TsuchigumoMeta,
  bossOnOwnWeb: boolean,
): TsuchiBossStats {
  const defMult = bossOnOwnWeb ? 1.15 : 1;
  return {
    ...base,
    def: Math.max(1, Math.floor(base.def * defMult)),
  };
}

/** Solo Aliado: +20% dano se alvo sobre teia */
export function tsuchiWebDamageMult(meta: TsuchigumoMeta, targetId: string): number {
  return meta.websOn.includes(targetId) ? 1.2 : 1;
}

/** Sensibilidade: +5% ATK se moveu no turno */
export function tsuchiMovedDamageMult(meta: TsuchigumoMeta, targetId: string): number {
  return meta.movedThisTurn.includes(targetId) ? 1.05 : 1;
}

export function tsuchiOnTurnAdvance(meta: TsuchigumoMeta, bossMaxEst: number): {
  meta: TsuchigumoMeta;
  estRegen: number;
  silkDamage: { targetId: string; damage: number }[];
  notes: string[];
} {
  const notes: string[] = [];
  const next: TsuchigumoMeta = {
    ...meta,
    turnsElapsed: meta.turnsElapsed + 1,
    movedThisTurn: [],
    silkStacks: { ...meta.silkStacks },
    websOn: [...meta.websOn],
  };
  // reconstrução lenta de teias
  if (next.webCount < 12) {
    next.webCount += 1;
    notes.push(`Tsuchigumo: teias se reconstroem (domínio ${next.webCount})`);
  }
  // Solo Aliado: +5% EST se em teia própria (sempre no proprio campo simplificado)
  const estRegen = Math.max(1, Math.floor(bossMaxEst * 0.05));
  notes.push(`Solo Aliado: +${estRegen} EST`);

  // Dominância: fios causam dano contínuo
  const silkDamage: { targetId: string; damage: number }[] = [];
  for (const [id, stacks] of Object.entries(next.silkStacks)) {
    if (stacks > 0) {
      const dmg = stacks * 3;
      silkDamage.push({ targetId: id, damage: dmg });
    }
  }

  // Fios desaparecem se parado (exceto silkLock)
  if (next.silkLockTurns > 0) {
    next.silkLockTurns -= 1;
  } else {
    for (const id of Object.keys(next.silkStacks)) {
      // decai 1 se nao moveu — movedThisTurn ja limpo; decai gradual
      next.silkStacks[id] = Math.max(0, (next.silkStacks[id] || 0) - 1);
      if (next.silkStacks[id] === 0) delete next.silkStacks[id];
    }
  }

  next.tunnelExtraAvailable = false;
  return { meta: next, estRegen, silkDamage, notes };
}

export function tsuchiAddSilk(
  meta: TsuchigumoMeta,
  targetId: string,
  amount: number,
): { meta: TsuchigumoMeta; immobilize: boolean } {
  const stacks = Math.min(5, (meta.silkStacks[targetId] || 0) + amount);
  const silkStacks = { ...meta.silkStacks, [targetId]: stacks };
  return {
    meta: { ...meta, silkStacks },
    immobilize: stacks >= 3,
  };
}

export function tsuchiAddWeb(meta: TsuchigumoMeta, targetId?: string): TsuchigumoMeta {
  const websOn = targetId && !meta.websOn.includes(targetId)
    ? [...meta.websOn, targetId]
    : [...meta.websOn];
  return {
    ...meta,
    webCount: Math.min(20, meta.webCount + 1),
    websOn,
  };
}

export type TsuchiSkillId =
  | "fio-lancado"
  | "mordida-venenosa"
  | "terremoto-de-patas"
  | "rede-de-prisao"
  | "tunel-das-sombras"
  | "imperio-de-fios";

export type TsuchiSkillDef = {
  id: TsuchiSkillId;
  name: string;
  unlockLevel: number;
  ultimate?: boolean;
  costMp?: number;
  costEst?: number;
  costMpPct?: number;
  costEstPct?: number;
};

export const TSUCHIGUMO_SKILLS: TsuchiSkillDef[] = [
  { id: "fio-lancado", name: "Fio Lançado", unlockLevel: 12, costMp: 18, costEst: 15 },
  { id: "mordida-venenosa", name: "Mordida Venenosa", unlockLevel: 12, costMp: 22, costEst: 20 },
  { id: "terremoto-de-patas", name: "Terremoto de Patas", unlockLevel: 12, costMp: 28, costEst: 25 },
  { id: "rede-de-prisao", name: "Rede de Prisão", unlockLevel: 200, costMp: 38, costEst: 32 },
  { id: "tunel-das-sombras", name: "Túnel das Sombras", unlockLevel: 300, costMp: 45, costEst: 38 },
  {
    id: "imperio-de-fios",
    name: "Império de Fios",
    unlockLevel: 400,
    ultimate: true,
    costMpPct: 0.1,
    costEstPct: 0.12,
  },
];

export function tsuchiSkillByName(name: string): TsuchiSkillDef | null {
  const n = name.trim().toLowerCase();
  return (
    TSUCHIGUMO_SKILLS.find((s) => s.name.toLowerCase() === n || s.id === n) ?? null
  );
}

export type TsuchiTarget = {
  id: string;
  hp: number;
  maxHp: number;
};

export type TsuchiResolveResult = {
  meta: TsuchigumoMeta;
  bossHp: number;
  bossMp: number;
  bossEst: number;
  damages: { targetId: string; damage: number }[];
  silkApplies: { targetId: string; stacks: number }[];
  immobilizes: string[];
  poisons: { targetId: string; duration: number }[];
  notes: string[];
  /** Túnel: pode agir de novo */
  extraAction: boolean;
};

export function resolveTsuchigumoSkill(
  skillName: string,
  opts: {
    level: number;
    baseStats: TsuchiBossStats;
    meta: TsuchigumoMeta;
    bossHp: number;
    bossMp: number;
    bossEst: number;
    primaryTargetId: string;
    targets: TsuchiTarget[];
    rollDie: (n: number) => number;
  },
): TsuchiResolveResult | null {
  const skill = tsuchiSkillByName(skillName);
  if (!skill || opts.level < skill.unlockLevel) return null;

  const bossOnWeb = true;
  const stats = tsuchiEffectiveStats(opts.baseStats, opts.meta, bossOnWeb);
  let mp = opts.bossMp;
  let est = opts.bossEst;
  let meta = {
    ...opts.meta,
    silkStacks: { ...opts.meta.silkStacks },
    websOn: [...opts.meta.websOn],
  };
  const notes: string[] = [];
  const damages: TsuchiResolveResult["damages"] = [];
  const silkApplies: TsuchiResolveResult["silkApplies"] = [];
  const immobilizes: string[] = [];
  const poisons: TsuchiResolveResult["poisons"] = [];
  let extraAction = false;

  const costMp = skill.costMpPct
    ? Math.floor(stats.mp * skill.costMpPct)
    : skill.costMp ?? 0;
  const costEst = skill.costEstPct
    ? Math.floor(stats.est * skill.costEstPct)
    : skill.costEst ?? 0;
  if (mp < costMp || est < costEst) {
    notes.push("Tsuchigumo: recursos insuficientes");
    return null;
  }
  mp -= costMp;
  est -= costEst;

  const primary =
    opts.targets.find((t) => t.id === opts.primaryTargetId) ?? opts.targets[0];
  if (!primary) return null;

  const hit = (t: TsuchiTarget, raw: number) => {
    let dmg = Math.max(
      1,
      Math.floor(
        raw *
          tsuchiWebDamageMult(meta, t.id) *
          tsuchiMovedDamageMult(meta, t.id),
      ),
    );
    damages.push({ targetId: t.id, damage: dmg });
    return dmg;
  };

  const applySilk = (targetId: string, n: number) => {
    const r = tsuchiAddSilk(meta, targetId, n);
    meta = r.meta;
    silkApplies.push({ targetId, stacks: n });
    if (r.immobilize) immobilizes.push(targetId);
  };

  if (skill.id === "fio-lancado") {
    const dmg = Math.max(1, Math.floor(stats.atk * 0.7) + opts.rollDie(6));
    hit(primary, dmg);
    applySilk(primary.id, 1);
    notes.push("Fio Lançado: dano + 1 Fio de Seda");
  } else if (skill.id === "mordida-venenosa") {
    const dmg = Math.max(1, stats.atk + opts.rollDie(8));
    hit(primary, dmg);
    applySilk(primary.id, 1);
    const hasSilk = (meta.silkStacks[primary.id] || 0) > 0;
    poisons.push({ targetId: primary.id, duration: hasSilk ? 3 : 2 });
    // Dupla Ameaça: 2o alvo se houver outro
    const second = opts.targets.find((t) => t.id !== primary.id);
    if (second) {
      hit(second, Math.floor(dmg * 0.5));
      notes.push("Dupla Ameaça: segundo alvo");
    }
    notes.push("Mordida Venenosa: veneno " + (hasSilk ? "3" : "2") + " turnos");
  } else if (skill.id === "terremoto-de-patas") {
    for (const t of opts.targets) {
      const dmg = Math.max(1, Math.floor(stats.atk * 0.85) + opts.rollDie(6));
      hit(t, dmg);
      meta = tsuchiAddWeb(meta, t.id);
    }
    notes.push("Terremoto de Patas: área + teias");
  } else if (skill.id === "rede-de-prisao") {
    for (const t of opts.targets) {
      applySilk(t.id, 2);
      meta = tsuchiAddWeb(meta, t.id);
      immobilizes.push(t.id);
    }
    notes.push("Rede de Prisão: 2 Fios + não pode sair");
  } else if (skill.id === "tunel-das-sombras") {
    const dmg =
      Math.floor(stats.atk * 1.4) + opts.rollDie(10) + opts.rollDie(10);
    hit(primary, dmg);
    applySilk(primary.id, 1);
    meta = tsuchiAddWeb(meta, primary.id);
    if (meta.webCount >= 2) {
      extraAction = true;
      meta.tunnelExtraAvailable = true;
      notes.push("Túnel das Sombras: teia conectada — ação extra");
    } else {
      notes.push("Túnel das Sombras: dano massivo + teia");
    }
  } else if (skill.id === "imperio-de-fios") {
    for (const t of opts.targets) {
      const dmg =
        Math.floor(stats.atk * 0.9) +
        Math.floor(stats.atkMgc * 0.9) +
        opts.rollDie(8);
      hit(t, dmg);
      applySilk(t.id, 2);
      meta = tsuchiAddWeb(meta, t.id);
    }
    meta.webCount = Math.max(meta.webCount, opts.targets.length + 4);
    meta.silkLockTurns = 3;
    const heal = Math.floor(stats.hp * 0.1 * Math.max(1, meta.webCount));
    notes.push(
      `Império de Fios: campo coberto, fios travados 3t, +${heal} HP (${meta.webCount} teias)`,
    );
    return {
      meta,
      bossHp: Math.min(stats.hp, opts.bossHp + heal),
      bossMp: mp,
      bossEst: est,
      damages,
      silkApplies,
      immobilizes,
      poisons,
      notes,
      extraAction: false,
    };
  }

  return {
    meta,
    bossHp: opts.bossHp,
    bossMp: mp,
    bossEst: est,
    damages,
    silkApplies,
    immobilizes,
    poisons,
    notes,
    extraAction,
  };
}
