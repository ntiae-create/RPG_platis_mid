/**
 * Hati + Skoll — Irmãos Eternos (kits gêmeos world boss).
 * Combat pode usar bossId "hati" | "skoll" com meta compartilhada twin.
 */

export type TwinBrotherId = "hati" | "skoll";

export type HatiSkollMeta = {
  turnsElapsed: number;
  /** irmão parceiro ainda vivo */
  brotherAlive: boolean;
  /** quem morreu primeiro (se houver) */
  fallenBrother: TwinBrotherId | null;
  /** bônus permanente após morte do irmão */
  survivorBonusApplied: boolean;
  /** buff de Uivo Sagrado em Hati: +N em atributos, turnos */
  hatiBuff: number;
  hatiBuffTurns: number;
  /** zona Odor de Sangue: -N ATK/ATK MGC/AGI */
  bloodScentPenalty: number;
  bloodScentTurns: number;
  bloodScentTargets: string[];
};

export function emptyHatiSkollMeta(brotherAlive = true): HatiSkollMeta {
  return {
    turnsElapsed: 0,
    brotherAlive,
    fallenBrother: null,
    survivorBonusApplied: false,
    hatiBuff: 0,
    hatiBuffTurns: 0,
    bloodScentPenalty: 0,
    bloodScentTurns: 0,
    bloodScentTargets: [],
  };
}

/** Bônus do sobrevivente por nível */
export function twinSurvivorBonus(level: number): {
  atk: number;
  atkMgc: number;
  agi: number;
  /** 0–1 redução na duração de debuffs */
  debuffDurationResist: number;
} {
  if (level >= 400) return { atk: 10, atkMgc: 10, agi: 10, debuffDurationResist: 0.75 };
  if (level >= 300) return { atk: 6, atkMgc: 6, agi: 6, debuffDurationResist: 0.6 };
  if (level >= 200) return { atk: 4, atkMgc: 4, agi: 4, debuffDurationResist: 0.4 };
  if (level >= 100) return { atk: 3, atkMgc: 3, agi: 3, debuffDurationResist: 0.25 };
  return { atk: 2, atkMgc: 2, agi: 2, debuffDurationResist: 0.1 };
}

/** Resistência a debuffs enquanto AMBOS vivos (Lv.400 alto) */
export function twinBothAliveDebuffResist(level: number): number {
  if (level >= 400) return 0.5;
  if (level >= 300) return 0.35;
  if (level >= 200) return 0.2;
  if (level >= 100) return 0.1;
  return 0;
}

export type TwinBossStats = {
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

export function twinEffectiveStats(
  who: TwinBrotherId,
  base: TwinBossStats,
  meta: HatiSkollMeta,
  level: number,
): TwinBossStats {
  let { atk, atkMgc, agi } = base;
  if (!meta.brotherAlive && meta.survivorBonusApplied) {
    const b = twinSurvivorBonus(level);
    atk += b.atk;
    atkMgc += b.atkMgc;
    agi += b.agi;
  }
  if (who === "hati" && meta.hatiBuffTurns > 0 && meta.hatiBuff > 0) {
    atk += meta.hatiBuff;
    atkMgc += meta.hatiBuff;
    agi += meta.hatiBuff;
  }
  return { ...base, atk, atkMgc, agi };
}

export function twinOnBrotherFallen(
  meta: HatiSkollMeta,
  fallen: TwinBrotherId,
): { meta: HatiSkollMeta; notes: string[] } {
  if (!meta.brotherAlive) return { meta, notes: [] };
  return {
    meta: {
      ...meta,
      brotherAlive: false,
      fallenBrother: fallen,
      survivorBonusApplied: true,
    },
    notes: [
      `Irmãos Eternos: ${fallen === "hati" ? "Hati" : "Skoll"} caiu. O sobrevivente recebe o bônus permanente.`,
    ],
  };
}

export function hatiSkollOnTurnAdvance(meta: HatiSkollMeta): {
  meta: HatiSkollMeta;
  notes: string[];
} {
  const notes: string[] = [];
  const next: HatiSkollMeta = {
    ...meta,
    turnsElapsed: meta.turnsElapsed + 1,
    bloodScentTargets: [...meta.bloodScentTargets],
  };

  if (next.hatiBuffTurns > 0) {
    next.hatiBuffTurns -= 1;
    if (next.hatiBuffTurns <= 0) {
      next.hatiBuff = 0;
      notes.push("Uivo Sagrado em Hati expirou");
    }
  }

  if (next.bloodScentTurns > 0) {
    next.bloodScentTurns -= 1;
    if (next.bloodScentTurns <= 0) {
      next.bloodScentPenalty = 0;
      next.bloodScentTargets = [];
      notes.push("Odor de Sangue dissipou");
    }
  }

  return { meta: next, notes };
}

function uivoSagradoBonus(level: number): number {
  if (level >= 400) return 8;
  if (level >= 300) return 5;
  if (level >= 200) return 3;
  if (level >= 100) return 2;
  return 1;
}

function odorPenalty(level: number): number {
  if (level >= 300) return 4;
  if (level >= 200) return 3;
  if (level >= 100) return 2;
  return 1;
}

// ——— Hati skills ———

export type HatiSkillId =
  | "hate-cure"
  | "sombra-odiosa"
  | "uivo-grotesco"
  | "eclipse-final";

export const HATI_SKILLS = [
  { id: "hate-cure" as const, name: "Hate Cure", unlockLevel: 12, costMp: 30, costEst: 25 },
  { id: "sombra-odiosa" as const, name: "Sombra Odiosa", unlockLevel: 12, costMp: 25, costEst: 30 },
  { id: "uivo-grotesco" as const, name: "Uivo Grotesco", unlockLevel: 12, costMp: 40, costEst: 35 },
  {
    id: "eclipse-final" as const,
    name: "Eclipse Final",
    unlockLevel: 400,
    costMpPct: 0.1,
    costEstPct: 0.1,
    ultimate: true,
  },
];

// ——— Skoll skills ———

export type SkollSkillId =
  | "feicao-luminosa"
  | "uivo-sagrado"
  | "odor-de-sangue"
  | "eclipse-final";

export const SKOLL_SKILLS = [
  { id: "feicao-luminosa" as const, name: "Feição Luminosa", unlockLevel: 12, costMp: 30, costEst: 25 },
  { id: "uivo-sagrado" as const, name: "Uivo Sagrado", unlockLevel: 12, costMp: 35, costEst: 20 },
  { id: "odor-de-sangue" as const, name: "Odor de Sangue", unlockLevel: 12, costMp: 40, costEst: 35 },
  {
    id: "eclipse-final" as const,
    name: "Eclipse Final",
    unlockLevel: 400,
    costMpPct: 0.1,
    costEstPct: 0.1,
    ultimate: true,
  },
];

export function hatiSkillByName(name: string) {
  const n = name.trim().toLowerCase();
  return HATI_SKILLS.find((s) => s.name.toLowerCase() === n || s.id === n) ?? null;
}

export function skollSkillByName(name: string) {
  const n = name.trim().toLowerCase();
  return SKOLL_SKILLS.find((s) => s.name.toLowerCase() === n || s.id === n) ?? null;
}

export type TwinTarget = { id: string; hp: number; maxHp: number };

export type TwinResolveResult = {
  meta: HatiSkollMeta;
  bossHp: number;
  bossMp: number;
  bossEst: number;
  damages: { targetId: string; damage: number; killed: boolean }[];
  /** infect / bleed / stun / sensitivity */
  status: { targetId: string; kind: "infect" | "bleed" | "stun" | "sensitivity"; duration: number }[];
  notes: string[];
};

export function resolveHatiSkill(
  skillName: string,
  opts: {
    level: number;
    baseStats: TwinBossStats;
    meta: HatiSkollMeta;
    bossHp: number;
    bossMp: number;
    bossEst: number;
    primaryTargetId: string;
    targets: TwinTarget[];
    rollDie: (n: number) => number;
  },
): TwinResolveResult | null {
  const skill = hatiSkillByName(skillName);
  if (!skill || opts.level < skill.unlockLevel) return null;

  let meta = { ...opts.meta, bloodScentTargets: [...opts.meta.bloodScentTargets] };
  const stats = twinEffectiveStats("hati", opts.baseStats, meta, opts.level);
  let mp = opts.bossMp;
  let est = opts.bossEst;
  const bossHp = opts.bossHp;
  const notes: string[] = [];
  const damages: TwinResolveResult["damages"] = [];
  const status: TwinResolveResult["status"] = [];

  const costMp =
    "costMpPct" in skill && skill.costMpPct
      ? Math.floor(stats.mp * skill.costMpPct)
      : skill.costMp ?? 0;
  const costEst =
    "costEstPct" in skill && skill.costEstPct
      ? Math.floor(stats.est * skill.costEstPct)
      : skill.costEst ?? 0;
  if (mp < costMp || est < costEst) {
    notes.push("Hati: recursos insuficientes");
    return null;
  }
  mp -= costMp;
  est -= costEst;

  const primary =
    opts.targets.find((t) => t.id === opts.primaryTargetId) ?? opts.targets[0];
  if (!primary) return null;

  const hit = (t: TwinTarget, raw: number) => {
    const dmg = Math.max(1, raw);
    damages.push({ targetId: t.id, damage: dmg, killed: t.hp - dmg <= 0 });
  };

  if (skill.id === "hate-cure") {
    hit(primary, Math.floor(stats.atkMgc * 1.1) + opts.rollDie(8));
    status.push({ targetId: primary.id, kind: "infect", duration: 3 });
    status.push({ targetId: primary.id, kind: "bleed", duration: 2 });
    notes.push("Hate Cure: Infecção + Sangramento");
  } else if (skill.id === "sombra-odiosa") {
    hit(primary, Math.floor(stats.atkMgc * 1.35) + opts.rollDie(10) + opts.rollDie(6));
    notes.push("Sombra Odiosa: alto dano de Trevas");
  } else if (skill.id === "uivo-grotesco") {
    for (const t of opts.targets.slice(0, 4)) {
      hit(t, Math.floor(stats.atkMgc * 0.8) + opts.rollDie(6));
      status.push({ targetId: t.id, kind: "stun", duration: 1 });
    }
    notes.push("Uivo Grotesco: área + Stun");
  } else if (skill.id === "eclipse-final") {
    const sync = meta.brotherAlive ? 1.4 : 1.15;
    for (const t of opts.targets) {
      hit(
        t,
        Math.floor((stats.atk + stats.atkMgc) * sync) +
          opts.rollDie(12) +
          opts.rollDie(12),
      );
    }
    notes.push(
      meta.brotherAlive
        ? "Eclipse Final: Luz e Trevas em sincronia"
        : "Eclipse Final (irmão caído)",
    );
  }

  return { meta, bossHp, bossMp: mp, bossEst: est, damages, status, notes };
}

export function resolveSkollSkill(
  skillName: string,
  opts: {
    level: number;
    baseStats: TwinBossStats;
    meta: HatiSkollMeta;
    bossHp: number;
    bossMp: number;
    bossEst: number;
    primaryTargetId: string;
    targets: TwinTarget[];
    rollDie: (n: number) => number;
  },
): TwinResolveResult | null {
  const skill = skollSkillByName(skillName);
  if (!skill || opts.level < skill.unlockLevel) return null;

  let meta = { ...opts.meta, bloodScentTargets: [...opts.meta.bloodScentTargets] };
  const stats = twinEffectiveStats("skoll", opts.baseStats, meta, opts.level);
  let mp = opts.bossMp;
  let est = opts.bossEst;
  const bossHp = opts.bossHp;
  const notes: string[] = [];
  const damages: TwinResolveResult["damages"] = [];
  const status: TwinResolveResult["status"] = [];

  const costMp =
    "costMpPct" in skill && skill.costMpPct
      ? Math.floor(stats.mp * skill.costMpPct)
      : skill.costMp ?? 0;
  const costEst =
    "costEstPct" in skill && skill.costEstPct
      ? Math.floor(stats.est * skill.costEstPct)
      : skill.costEst ?? 0;
  if (mp < costMp || est < costEst) {
    notes.push("Skoll: recursos insuficientes");
    return null;
  }
  mp -= costMp;
  est -= costEst;

  const primary =
    opts.targets.find((t) => t.id === opts.primaryTargetId) ?? opts.targets[0];
  if (!primary) return null;

  const hit = (t: TwinTarget, raw: number) => {
    const dmg = Math.max(1, raw);
    damages.push({ targetId: t.id, damage: dmg, killed: t.hp - dmg <= 0 });
  };

  if (skill.id === "feicao-luminosa") {
    for (const t of opts.targets.slice(0, 3)) {
      hit(t, Math.floor(stats.atkMgc * 1.05) + opts.rollDie(8));
      status.push({ targetId: t.id, kind: "sensitivity", duration: 2 });
    }
    notes.push("Feição Luminosa: até 3 alvos + sensibilidade");
  } else if (skill.id === "uivo-sagrado") {
    const b = uivoSagradoBonus(opts.level);
    meta.hatiBuff = b;
    meta.hatiBuffTurns = 3;
    notes.push(`Uivo Sagrado: Hati +${b} em atributos por 3 turnos`);
  } else if (skill.id === "odor-de-sangue") {
    const p = odorPenalty(opts.level);
    meta.bloodScentPenalty = p;
    meta.bloodScentTurns = 2;
    meta.bloodScentTargets = opts.targets.map((t) => t.id);
    for (const t of opts.targets) {
      hit(t, Math.floor(stats.atkMgc * 0.5) + opts.rollDie(4));
    }
    notes.push(`Odor de Sangue: −${p} ATK/ATK MGC/AGI na zona`);
  } else if (skill.id === "eclipse-final") {
    const sync = meta.brotherAlive ? 1.4 : 1.15;
    for (const t of opts.targets) {
      hit(
        t,
        Math.floor((stats.atk + stats.atkMgc) * sync) +
          opts.rollDie(12) +
          opts.rollDie(12),
      );
    }
    notes.push(
      meta.brotherAlive
        ? "Eclipse Final: Luz e Trevas em sincronia"
        : "Eclipse Final (irmão caído)",
    );
  }

  return { meta, bossHp, bossMp: mp, bossEst: est, damages, status, notes };
}
