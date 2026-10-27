/**
 * Hati + Skoll — Irmãos Eternos.
 * Solo: bossId "hati" | "skoll".
 * Duo: bossId "hati-skoll" — os dois no campo, turnos em sincronia.
 */

export type TwinBrotherId = "hati" | "skoll";

export type TwinVitals = {
  hp: number;
  mp: number;
  est: number;
  maxHp: number;
  maxMp: number;
  maxEst: number;
  alive: boolean;
};

export type HatiSkollMeta = {
  turnsElapsed: number;
  /** true = luta dos dois juntos (bossId hati-skoll) */
  duoMode: boolean;
  hati: TwinVitals;
  skoll: TwinVitals;
  /** quem age agora no turno do boss (duo alterna ou ambos no mesmo round) */
  activeActor: TwinBrotherId;
  /** irmão parceiro ainda vivo (solo ou após queda no duo) */
  brotherAlive: boolean;
  fallenBrother: TwinBrotherId | null;
  survivorBonusApplied: boolean;
  hatiBuff: number;
  hatiBuffTurns: number;
  bloodScentPenalty: number;
  bloodScentTurns: number;
  bloodScentTargets: string[];
};

function vitalsFromStats(stats: {
  hp: number;
  mp: number;
  est: number;
}): TwinVitals {
  return {
    hp: stats.hp,
    mp: stats.mp,
    est: stats.est,
    maxHp: stats.hp,
    maxMp: stats.mp,
    maxEst: stats.est,
    alive: true,
  };
}

/** Solo (um boss) — brotherAlive true até o “outro” ser marcado caído manualmente */
export function emptyHatiSkollMeta(brotherAlive = true): HatiSkollMeta {
  const blank: TwinVitals = {
    hp: 0,
    mp: 0,
    est: 0,
    maxHp: 0,
    maxMp: 0,
    maxEst: 0,
    alive: brotherAlive,
  };
  return {
    turnsElapsed: 0,
    duoMode: false,
    hati: { ...blank },
    skoll: { ...blank },
    activeActor: "hati",
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

/** Duo: dois corpos com stats do nível (mesma base ou bases distintas) */
export function createDuoHatiSkollMeta(
  hatiStats: { hp: number; mp: number; est: number },
  skollStats: { hp: number; mp: number; est: number } = hatiStats,
): HatiSkollMeta {
  return {
    turnsElapsed: 0,
    duoMode: true,
    hati: vitalsFromStats(hatiStats),
    skoll: vitalsFromStats(skollStats),
    activeActor: "hati",
    brotherAlive: true,
    fallenBrother: null,
    survivorBonusApplied: false,
    hatiBuff: 0,
    hatiBuffTurns: 0,
    bloodScentPenalty: 0,
    bloodScentTurns: 0,
    bloodScentTargets: [],
  };
}

export function twinSurvivorBonus(level: number): {
  atk: number;
  atkMgc: number;
  agi: number;
  debuffDurationResist: number;
} {
  if (level >= 400) return { atk: 10, atkMgc: 10, agi: 10, debuffDurationResist: 0.75 };
  if (level >= 300) return { atk: 6, atkMgc: 6, agi: 6, debuffDurationResist: 0.6 };
  if (level >= 200) return { atk: 4, atkMgc: 4, agi: 4, debuffDurationResist: 0.4 };
  if (level >= 100) return { atk: 3, atkMgc: 3, agi: 3, debuffDurationResist: 0.25 };
  return { atk: 2, atkMgc: 2, agi: 2, debuffDurationResist: 0.1 };
}

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

export function twinIsAlive(meta: HatiSkollMeta, who: TwinBrotherId): boolean {
  if (!meta.duoMode) return meta.brotherAlive || who === meta.activeActor;
  return who === "hati" ? meta.hati.alive && meta.hati.hp > 0 : meta.skoll.alive && meta.skoll.hp > 0;
}

export function twinBothDefeated(meta: HatiSkollMeta): boolean {
  if (!meta.duoMode) return false;
  return !twinIsAlive(meta, "hati") && !twinIsAlive(meta, "skoll");
}

export function twinAnyAlive(meta: HatiSkollMeta): boolean {
  if (!meta.duoMode) return true;
  return twinIsAlive(meta, "hati") || twinIsAlive(meta, "skoll");
}

/** HP/MP/EST exibidos no card do boss (soma no duo) */
export function twinDisplayCurrent(meta: HatiSkollMeta): {
  hp: number;
  mp: number;
  est: number;
  maxHp: number;
} {
  if (!meta.duoMode) {
    return {
      hp: meta.hati.hp || meta.skoll.hp,
      mp: meta.hati.mp || meta.skoll.mp,
      est: meta.hati.est || meta.skoll.est,
      maxHp: meta.hati.maxHp || meta.skoll.maxHp,
    };
  }
  return {
    hp: (meta.hati.alive ? meta.hati.hp : 0) + (meta.skoll.alive ? meta.skoll.hp : 0),
    mp: (meta.hati.alive ? meta.hati.mp : 0) + (meta.skoll.alive ? meta.skoll.mp : 0),
    est: (meta.hati.alive ? meta.hati.est : 0) + (meta.skoll.alive ? meta.skoll.est : 0),
    maxHp: meta.hati.maxHp + meta.skoll.maxHp,
  };
}

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
  if (meta.fallenBrother === fallen) return { meta, notes: [] };
  const notes: string[] = [
    `Irmãos Eternos: ${fallen === "hati" ? "Hati" : "Skoll"} caiu.`,
  ];
  let next: HatiSkollMeta = {
    ...meta,
    hati: { ...meta.hati },
    skoll: { ...meta.skoll },
    bloodScentTargets: [...meta.bloodScentTargets],
  };
  if (fallen === "hati") {
    next.hati = { ...next.hati, hp: 0, alive: false };
  } else {
    next.skoll = { ...next.skoll, hp: 0, alive: false };
  }
  const other: TwinBrotherId = fallen === "hati" ? "skoll" : "hati";
  const otherAlive = twinIsAlive(next, other);
  next.brotherAlive = otherAlive;
  next.fallenBrother = fallen;
  if (otherAlive) {
    next.survivorBonusApplied = true;
    next.activeActor = other;
    notes.push(
      `O sobrevivente (${other === "hati" ? "Hati" : "Skoll"}) recebe o bônus permanente de Irmãos Eternos.`,
    );
  } else {
    notes.push("Os dois irmãos foram derrotados.");
  }
  return { meta: next, notes };
}

/** Dano a um irmão específico (duo). Retorna se caiu. */
export function twinApplyDamage(
  meta: HatiSkollMeta,
  who: TwinBrotherId,
  damage: number,
): { meta: HatiSkollMeta; notes: string[]; killed: boolean } {
  if (!meta.duoMode) {
    return { meta, notes: [], killed: false };
  }
  const notes: string[] = [];
  let next: HatiSkollMeta = {
    ...meta,
    hati: { ...meta.hati },
    skoll: { ...meta.skoll },
    bloodScentTargets: [...meta.bloodScentTargets],
  };
  const body = who === "hati" ? next.hati : next.skoll;
  if (!body.alive) return { meta: next, notes: [`${who} já está fora de combate`], killed: false };
  body.hp = Math.max(0, body.hp - Math.max(0, damage));
  notes.push(`${who === "hati" ? "Hati" : "Skoll"} sofreu ${damage} de dano (HP ${body.hp}/${body.maxHp})`);
  if (body.hp <= 0) {
    body.alive = false;
    const fallen = twinOnBrotherFallen(next, who);
    return { meta: fallen.meta, notes: [...notes, ...fallen.notes], killed: true };
  }
  if (who === "hati") next.hati = body;
  else next.skoll = body;
  return { meta: next, notes, killed: false };
}

/** Alvo padrão ao atacar o duo: irmão ativo, senão qualquer vivo */
export function twinPickDamageTarget(
  meta: HatiSkollMeta,
  preferred?: TwinBrotherId,
): TwinBrotherId | null {
  if (!meta.duoMode) return meta.activeActor;
  if (preferred && twinIsAlive(meta, preferred)) return preferred;
  if (twinIsAlive(meta, meta.activeActor)) return meta.activeActor;
  if (twinIsAlive(meta, "hati")) return "hati";
  if (twinIsAlive(meta, "skoll")) return "skoll";
  return null;
}

/** No turno do boss em duo: ordem de ação [hati, skoll] filtrando mortos */
export function twinActionOrder(meta: HatiSkollMeta): TwinBrotherId[] {
  if (!meta.duoMode) return [meta.activeActor];
  const order: TwinBrotherId[] = [];
  if (twinIsAlive(meta, "hati")) order.push("hati");
  if (twinIsAlive(meta, "skoll")) order.push("skoll");
  return order;
}

export function hatiSkollOnTurnAdvance(meta: HatiSkollMeta): {
  meta: HatiSkollMeta;
  notes: string[];
} {
  const notes: string[] = [];
  const next: HatiSkollMeta = {
    ...meta,
    turnsElapsed: meta.turnsElapsed + 1,
    hati: { ...meta.hati },
    skoll: { ...meta.skoll },
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

  // Duo: próximo round começa com Hati se vivo
  if (next.duoMode) {
    next.activeActor = twinIsAlive(next, "hati") ? "hati" : "skoll";
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
  status: { targetId: string; kind: "infect" | "bleed" | "stun" | "sensitivity"; duration: number }[];
  notes: string[];
};

function spendFromBrother(
  meta: HatiSkollMeta,
  who: TwinBrotherId,
  costMp: number,
  costEst: number,
): HatiSkollMeta | null {
  if (!meta.duoMode) return meta;
  const body = who === "hati" ? { ...meta.hati } : { ...meta.skoll };
  if (!body.alive || body.mp < costMp || body.est < costEst) return null;
  body.mp -= costMp;
  body.est -= costEst;
  if (who === "hati") return { ...meta, hati: body };
  return { ...meta, skoll: body };
}

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
  if (opts.meta.duoMode && !twinIsAlive(opts.meta, "hati")) {
    return null;
  }

  let meta: HatiSkollMeta = {
    ...opts.meta,
    hati: { ...opts.meta.hati },
    skoll: { ...opts.meta.skoll },
    bloodScentTargets: [...opts.meta.bloodScentTargets],
  };
  const stats = twinEffectiveStats("hati", opts.baseStats, meta, opts.level);
  let mp = opts.bossMp;
  let est = opts.bossEst;
  let bossHp = opts.bossHp;
  const notes: string[] = [];
  const damages: TwinResolveResult["damages"] = [];
  const status: TwinResolveResult["status"] = [];

  const costMp =
    "costMpPct" in skill && skill.costMpPct
      ? Math.floor((meta.duoMode ? meta.hati.maxMp : stats.mp) * skill.costMpPct)
      : skill.costMp ?? 0;
  const costEst =
    "costEstPct" in skill && skill.costEstPct
      ? Math.floor((meta.duoMode ? meta.hati.maxEst : stats.est) * skill.costEstPct)
      : skill.costEst ?? 0;

  if (meta.duoMode) {
    const spent = spendFromBrother(meta, "hati", costMp, costEst);
    if (!spent) {
      notes.push("Hati: recursos insuficientes");
      return null;
    }
    meta = spent;
    meta.activeActor = "hati";
  } else {
    if (mp < costMp || est < costEst) {
      notes.push("Hati: recursos insuficientes");
      return null;
    }
    mp -= costMp;
    est -= costEst;
  }

  const primary =
    opts.targets.find((t) => t.id === opts.primaryTargetId) ?? opts.targets[0];
  if (!primary) return null;

  const hit = (t: TwinTarget, raw: number) => {
    const dmg = Math.max(1, raw);
    damages.push({ targetId: t.id, damage: dmg, killed: t.hp - dmg <= 0 });
  };

  notes.push("Hati age");

  if (skill.id === "hate-cure") {
    hit(primary, Math.floor(stats.atkMgc * 1.1) + opts.rollDie(8));
    status.push({ targetId: primary.id, kind: "infect", duration: 3 });
    status.push({ targetId: primary.id, kind: "bleed", duration: 2 });
    notes.push("Hate Cure: Infecção + Sangramento");
  } else if (skill.id === "sombra-odiosa") {
    hit(primary, Math.floor(stats.atkMgc * 1.35) + opts.rollDie(10) + opts.rollDie(6));
    notes.push("Sombra Odiosa");
  } else if (skill.id === "uivo-grotesco") {
    for (const t of opts.targets.slice(0, 4)) {
      hit(t, Math.floor(stats.atkMgc * 0.8) + opts.rollDie(6));
      status.push({ targetId: t.id, kind: "stun", duration: 1 });
    }
    notes.push("Uivo Grotesco: área + Stun");
  } else if (skill.id === "eclipse-final") {
    const sync = twinIsAlive(meta, "skoll") ? 1.4 : 1.15;
    for (const t of opts.targets) {
      hit(
        t,
        Math.floor((stats.atk + stats.atkMgc) * sync) +
          opts.rollDie(12) +
          opts.rollDie(12),
      );
    }
    notes.push(
      twinIsAlive(meta, "skoll")
        ? "Eclipse Final: Luz e Trevas em sincronia"
        : "Eclipse Final (Skoll caído)",
    );
  }

  if (meta.duoMode) {
    const d = twinDisplayCurrent(meta);
    bossHp = d.hp;
    mp = d.mp;
    est = d.est;
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
  if (opts.meta.duoMode && !twinIsAlive(opts.meta, "skoll")) {
    return null;
  }

  let meta: HatiSkollMeta = {
    ...opts.meta,
    hati: { ...opts.meta.hati },
    skoll: { ...opts.meta.skoll },
    bloodScentTargets: [...opts.meta.bloodScentTargets],
  };
  const stats = twinEffectiveStats("skoll", opts.baseStats, meta, opts.level);
  let mp = opts.bossMp;
  let est = opts.bossEst;
  let bossHp = opts.bossHp;
  const notes: string[] = [];
  const damages: TwinResolveResult["damages"] = [];
  const status: TwinResolveResult["status"] = [];

  const costMp =
    "costMpPct" in skill && skill.costMpPct
      ? Math.floor((meta.duoMode ? meta.skoll.maxMp : stats.mp) * skill.costMpPct)
      : skill.costMp ?? 0;
  const costEst =
    "costEstPct" in skill && skill.costEstPct
      ? Math.floor((meta.duoMode ? meta.skoll.maxEst : stats.est) * skill.costEstPct)
      : skill.costEst ?? 0;

  if (meta.duoMode) {
    const spent = spendFromBrother(meta, "skoll", costMp, costEst);
    if (!spent) {
      notes.push("Skoll: recursos insuficientes");
      return null;
    }
    meta = spent;
    meta.activeActor = "skoll";
  } else {
    if (mp < costMp || est < costEst) {
      notes.push("Skoll: recursos insuficientes");
      return null;
    }
    mp -= costMp;
    est -= costEst;
  }

  const primary =
    opts.targets.find((t) => t.id === opts.primaryTargetId) ?? opts.targets[0];
  if (!primary) return null;

  const hit = (t: TwinTarget, raw: number) => {
    const dmg = Math.max(1, raw);
    damages.push({ targetId: t.id, damage: dmg, killed: t.hp - dmg <= 0 });
  };

  notes.push("Skoll age");

  if (skill.id === "feicao-luminosa") {
    for (const t of opts.targets.slice(0, 3)) {
      hit(t, Math.floor(stats.atkMgc * 1.05) + opts.rollDie(8));
      status.push({ targetId: t.id, kind: "sensitivity", duration: 2 });
    }
    notes.push("Feição Luminosa");
  } else if (skill.id === "uivo-sagrado") {
    const b = uivoSagradoBonus(opts.level);
    meta.hatiBuff = b;
    meta.hatiBuffTurns = 3;
    notes.push(`Uivo Sagrado: Hati +${b} atributos (3 turnos)`);
  } else if (skill.id === "odor-de-sangue") {
    const p = odorPenalty(opts.level);
    meta.bloodScentPenalty = p;
    meta.bloodScentTurns = 2;
    meta.bloodScentTargets = opts.targets.map((t) => t.id);
    for (const t of opts.targets) {
      hit(t, Math.floor(stats.atkMgc * 0.5) + opts.rollDie(4));
    }
    notes.push(`Odor de Sangue: −${p} ATK/ATK MGC/AGI`);
  } else if (skill.id === "eclipse-final") {
    const sync = twinIsAlive(meta, "hati") ? 1.4 : 1.15;
    for (const t of opts.targets) {
      hit(
        t,
        Math.floor((stats.atk + stats.atkMgc) * sync) +
          opts.rollDie(12) +
          opts.rollDie(12),
      );
    }
    notes.push(
      twinIsAlive(meta, "hati")
        ? "Eclipse Final: Luz e Trevas em sincronia"
        : "Eclipse Final (Hati caído)",
    );
  }

  if (meta.duoMode) {
    const d = twinDisplayCurrent(meta);
    bossHp = d.hp;
    mp = d.mp;
    est = d.est;
  }

  return { meta, bossHp, bossMp: mp, bossEst: est, damages, status, notes };
}
