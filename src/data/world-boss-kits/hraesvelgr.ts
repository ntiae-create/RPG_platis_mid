/**
 * Hræsvelgr — kit World Boss (domínio aéreo + Vento).
 */

export type HraesvelgrMeta = {
  turnsElapsed: number;
  /** no ar = imune a corpo a corpo */
  airborne: boolean;
  /** Queda do Céu: some e ataca no próximo turno */
  skyfallPending: boolean;
  /** Penas do Armagedon: turnos em que projéteis podem ser repelidos */
  featherStormTurns: number;
  /** Uivo dos Céus reforça domínio aéreo */
  aerialDominion: number;
};

export function emptyHraesvelgrMeta(): HraesvelgrMeta {
  return {
    turnsElapsed: 0,
    airborne: true,
    skyfallPending: false,
    featherStormTurns: 0,
    aerialDominion: 0,
  };
}

export type HraesvelgrBossStats = {
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

export function hraesvelgrEffectiveStats(
  base: HraesvelgrBossStats,
  meta: HraesvelgrMeta,
): HraesvelgrBossStats {
  const mult = 1 + meta.aerialDominion * 0.05;
  return {
    ...base,
    atk: Math.max(1, Math.floor(base.atk * mult)),
    atkMgc: Math.max(1, Math.floor(base.atkMgc * mult)),
    agi: Math.max(1, Math.floor(base.agi * (1 + meta.aerialDominion * 0.03))),
  };
}

/** Senhor dos Céus: imune a melee enquanto airborne */
export function hraesvelgrBlocksMelee(meta: HraesvelgrMeta): boolean {
  return meta.airborne;
}

export function hraesvelgrOnTurnAdvance(
  meta: HraesvelgrMeta,
  base: HraesvelgrBossStats,
  targets: { id: string; hp: number; maxHp: number }[],
  rollDie: (n: number) => number,
): {
  meta: HraesvelgrMeta;
  skyfallDamages: { targetId: string; damage: number }[];
  notes: string[];
} {
  const notes: string[] = [];
  let next: HraesvelgrMeta = { ...meta, turnsElapsed: meta.turnsElapsed + 1 };
  const skyfallDamages: { targetId: string; damage: number }[] = [];

  if (next.featherStormTurns > 0) {
    next.featherStormTurns -= 1;
    if (next.featherStormTurns <= 0) notes.push("Penas do Armagedon: janela de repelir encerrou");
    else notes.push(`Penas do Armagedon: repelir (${next.featherStormTurns} turno(s))`);
  }

  if (next.skyfallPending) {
    next.skyfallPending = false;
    next.airborne = true;
    const stats = hraesvelgrEffectiveStats(base, next);
    for (const t of targets) {
      if (t.hp <= 0) continue;
      const dmg =
        Math.floor(stats.atk * 1.2) +
        Math.floor(stats.atkMgc * 0.5) +
        rollDie(10);
      skyfallDamages.push({ targetId: t.id, damage: Math.max(1, dmg) });
    }
    notes.push("Queda do Céu: impacto de área + empurrão");
  }

  return { meta: next, skyfallDamages, notes };
}

/** Onda de choque inicial: “espalha” alvos (notas + flag) */
export function hraesvelgrBattleStartShock(): string[] {
  return [
    "Hræsvelgr entra em batalha: onda de choque espalha os inimigos pelo campo.",
  ];
}

export type HraesvelgrSkillId =
  | "tempestade-do-devorador"
  | "asas-do-fim"
  | "queda-do-ceu"
  | "uivo-dos-ceus"
  | "sopro-do-abismo"
  | "penas-do-armagedon"
  | "furia-do-devorador";

export type HraesvelgrSkillDef = {
  id: HraesvelgrSkillId;
  name: string;
  unlockLevel: number;
  ultimate?: boolean;
  costMp?: number;
  costEst?: number;
  costMpPct?: number;
  costEstPct?: number;
};

export const HRAESVELGR_SKILLS: HraesvelgrSkillDef[] = [
  {
    id: "tempestade-do-devorador",
    name: "Tempestade do Devorador",
    unlockLevel: 12,
    costMp: 22,
    costEst: 18,
  },
  { id: "asas-do-fim", name: "Asas do Fim", unlockLevel: 12, costMp: 28, costEst: 24 },
  { id: "queda-do-ceu", name: "Queda do Céu", unlockLevel: 12, costMp: 30, costEst: 28 },
  { id: "uivo-dos-ceus", name: "O Uivo dos Céus", unlockLevel: 12, costMp: 26, costEst: 20 },
  { id: "sopro-do-abismo", name: "Sopro do Abismo", unlockLevel: 200, costMp: 40, costEst: 32 },
  {
    id: "penas-do-armagedon",
    name: "Penas do Armagedon",
    unlockLevel: 400,
    costMp: 48,
    costEst: 38,
  },
  {
    id: "furia-do-devorador",
    name: "Fúria do Devorador dos Céus",
    unlockLevel: 400,
    ultimate: true,
    costMpPct: 0.1,
    costEstPct: 0.12,
  },
];

export function hraesvelgrSkillByName(name: string): HraesvelgrSkillDef | null {
  const n = name.trim().toLowerCase();
  return (
    HRAESVELGR_SKILLS.find(
      (s) =>
        s.name.toLowerCase() === n ||
        s.id === n ||
        s.name.toLowerCase().includes(n.slice(0, 12)),
    ) ?? null
  );
}

export type HraesvelgrTarget = {
  id: string;
  hp: number;
  maxHp: number;
};

export type HraesvelgrResolveResult = {
  meta: HraesvelgrMeta;
  bossHp: number;
  bossMp: number;
  bossEst: number;
  damages: { targetId: string; damage: number; killed: boolean }[];
  notes: string[];
};

export function resolveHraesvelgrSkill(
  skillName: string,
  opts: {
    level: number;
    baseStats: HraesvelgrBossStats;
    meta: HraesvelgrMeta;
    bossHp: number;
    bossMp: number;
    bossEst: number;
    primaryTargetId: string;
    targets: HraesvelgrTarget[];
    rollDie: (n: number) => number;
  },
): HraesvelgrResolveResult | null {
  const skill = hraesvelgrSkillByName(skillName);
  if (!skill || opts.level < skill.unlockLevel) return null;

  let meta: HraesvelgrMeta = { ...opts.meta };
  const stats = hraesvelgrEffectiveStats(opts.baseStats, meta);
  let mp = opts.bossMp;
  let est = opts.bossEst;
  const bossHp = opts.bossHp;
  const notes: string[] = [];
  const damages: HraesvelgrResolveResult["damages"] = [];

  const costMp = skill.costMpPct
    ? Math.floor(stats.mp * skill.costMpPct)
    : skill.costMp ?? 0;
  const costEst = skill.costEstPct
    ? Math.floor(stats.est * skill.costEstPct)
    : skill.costEst ?? 0;
  if (mp < costMp || est < costEst) {
    notes.push("Hræsvelgr: recursos insuficientes");
    return null;
  }
  mp -= costMp;
  est -= costEst;

  const primary =
    opts.targets.find((t) => t.id === opts.primaryTargetId) ?? opts.targets[0];
  if (!primary) return null;

  const hit = (t: HraesvelgrTarget, raw: number) => {
    const dmg = Math.max(1, raw);
    damages.push({
      targetId: t.id,
      damage: dmg,
      killed: t.hp - dmg <= 0,
    });
  };

  if (skill.id === "tempestade-do-devorador") {
    hit(primary, Math.floor(stats.atkMgc * 1.05) + opts.rollDie(8));
    notes.push("Tempestade do Devorador: Vento + empurrão");
  } else if (skill.id === "asas-do-fim") {
    for (const t of opts.targets) {
      hit(t, Math.floor(stats.atkMgc * 0.85) + opts.rollDie(6));
    }
    notes.push("Asas do Fim: explosão + deslocamento aleatório");
  } else if (skill.id === "queda-do-ceu") {
    meta.skyfallPending = true;
    meta.airborne = false; // some do campo
    notes.push("Queda do Céu: Hræsvelgr desaparece — retorna no próximo turno");
  } else if (skill.id === "uivo-dos-ceus") {
    meta.aerialDominion = Math.min(5, meta.aerialDominion + 1);
    meta.airborne = true;
    for (const t of opts.targets) {
      hit(t, Math.floor(stats.atkMgc * 0.55) + opts.rollDie(4));
    }
    notes.push(`Uivo dos Céus: domínio aéreo ${meta.aerialDominion}/5`);
  } else if (skill.id === "sopro-do-abismo") {
    for (const t of opts.targets) {
      hit(t, Math.floor(stats.atkMgc * 1.2) + opts.rollDie(10));
    }
    notes.push("Sopro do Abismo: Vento de longo alcance");
  } else if (skill.id === "penas-do-armagedon") {
    meta.featherStormTurns = 2;
    for (const t of opts.targets) {
      hit(t, Math.floor(stats.atk * 0.9) + Math.floor(stats.atkMgc * 0.7) + opts.rollDie(8));
    }
    notes.push("Penas do Armagedon: chuva de penas — repelir por 2 turnos");
  } else if (skill.id === "furia-do-devorador") {
    meta.airborne = true;
    meta.aerialDominion = Math.min(5, meta.aerialDominion + 2);
    for (const t of opts.targets) {
      hit(
        t,
        Math.floor(stats.atk * 1.3) +
          Math.floor(stats.atkMgc * 1.4) +
          opts.rollDie(12) +
          opts.rollDie(10),
      );
    }
    notes.push("Fúria do Devorador dos Céus — domínio máximo de Vento");
  }

  return { meta, bossHp, bossMp: mp, bossEst: est, damages, notes };
}
