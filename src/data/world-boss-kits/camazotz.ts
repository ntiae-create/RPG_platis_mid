/**
 * Camazotz — kit World Boss (A Noite que Cai + formas por nível).
 */

export type NightPhase = "clear" | "partial" | "total" | "eternal";

export type CamazotzMeta = {
  turnsElapsed: number;
  nightPhase: NightPhase;
  /** stacks de +8% ATK (máx 5 = +40%) */
  soproStacks: number;
  soproTurnsLeft: number;
  /** +ATK permanente após kill no ultimate */
  permanentAtkPct: number;
  /** alvos sob Lua de Sangue */
  bloodMoonTargets: string[];
  /** próximo ataque em área bloqueado (Asas do Eclipse) */
  blockNextAoe: boolean;
  /** luz apagada pelo boss após tentativa de iluminar */
  lightSuppressed: boolean;
};

export function emptyCamazotzMeta(): CamazotzMeta {
  return {
    turnsElapsed: 0,
    nightPhase: "clear",
    soproStacks: 0,
    soproTurnsLeft: 0,
    permanentAtkPct: 0,
    bloodMoonTargets: [],
    blockNextAoe: false,
    lightSuppressed: false,
  };
}

export type CamazotzForm =
  | "morcego-caverna"
  | "voz-noite"
  | "dentes-lua"
  | "deus-escuridao"
  | "eclipse-total";

export function camazotzFormForLevel(level: number): CamazotzForm {
  if (level >= 400) return "eclipse-total";
  if (level >= 300) return "deus-escuridao";
  if (level >= 200) return "dentes-lua";
  if (level >= 100) return "voz-noite";
  return "morcego-caverna";
}

export function camazotzFormLabel(form: CamazotzForm): string {
  switch (form) {
    case "morcego-caverna":
      return "Morcego da Caverna";
    case "voz-noite":
      return "Voz da Noite";
    case "dentes-lua":
      return "Dentes da Lua";
    case "deus-escuridao":
      return "Deus da Escuridão";
    case "eclipse-total":
      return "Eclipse Total — Camazotz Supremo";
  }
}

export type CamazotzBossStats = {
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

function isNight(phase: NightPhase): boolean {
  return phase === "partial" || phase === "total" || phase === "eternal";
}

/** ATK efetivo: noite parcial +15%, sopro, permanente, noite eterna +25% dano saído */
export function camazotzEffectiveAtk(
  baseAtk: number,
  meta: CamazotzMeta,
): number {
  let mult = 1 + meta.permanentAtkPct / 100;
  if (meta.nightPhase === "partial") mult *= 1.15;
  if (meta.soproTurnsLeft > 0 && meta.soproStacks > 0) {
    let sopro = meta.soproStacks * 0.08;
    if (isNight(meta.nightPhase)) sopro *= 2;
    mult *= 1 + Math.min(0.4 * (isNight(meta.nightPhase) ? 2 : 1), sopro);
    // cap: stacks max 5 → 40% normal, 80% night via double on each 8%
    const capped = Math.min(meta.soproStacks, 5) * 0.08;
    const nightBonus = isNight(meta.nightPhase) ? capped * 2 : capped;
    mult = (1 + meta.permanentAtkPct / 100) * (meta.nightPhase === "partial" ? 1.15 : 1);
    mult *= 1 + Math.min(isNight(meta.nightPhase) ? 0.8 : 0.4, nightBonus);
  } else if (meta.nightPhase === "partial") {
    mult = (1 + meta.permanentAtkPct / 100) * 1.15;
  }
  if (meta.nightPhase === "eternal") mult *= 1.25;
  return Math.max(1, Math.floor(baseAtk * mult));
}

export function camazotzEffectiveStats(
  base: CamazotzBossStats,
  meta: CamazotzMeta,
): CamazotzBossStats {
  return {
    ...base,
    atk: camazotzEffectiveAtk(base.atk, meta),
  };
}

/** A Noite que Cai — avança fase no tick de turno */
export function camazotzOnTurnAdvance(meta: CamazotzMeta): {
  meta: CamazotzMeta;
  notes: string[];
} {
  const notes: string[] = [];
  const next: CamazotzMeta = {
    ...meta,
    turnsElapsed: meta.turnsElapsed + 1,
    bloodMoonTargets: [...meta.bloodMoonTargets],
  };

  if (next.soproTurnsLeft > 0) {
    next.soproTurnsLeft -= 1;
    if (next.soproTurnsLeft <= 0) {
      next.soproStacks = 0;
      notes.push("Sopro da Lua: bônus de ATK expirou");
    }
  }

  // Turno 1 clear, 3 partial, 5 total; eternal se já ativa permanece
  if (next.nightPhase !== "eternal") {
    if (next.turnsElapsed >= 5) {
      if (next.nightPhase !== "total") {
        next.nightPhase = "total";
        notes.push("Noite Total — Passiva Suprema disponível (Noite Eterna pode ativar)");
      }
    } else if (next.turnsElapsed >= 3) {
      if (next.nightPhase === "clear") {
        next.nightPhase = "partial";
        notes.push("Noite Parcial: Camazotz +15% ATK");
      }
    }
  }

  return { meta: next, notes };
}

/** Ativa Noite Eterna (suprema) */
export function camazotzActivateEternalNight(meta: CamazotzMeta): CamazotzMeta {
  return { ...meta, nightPhase: "eternal", lightSuppressed: true };
}

/** Tentativa de iluminar o campo — Camazotz apaga */
export function camazotzSuppressLight(meta: CamazotzMeta): {
  meta: CamazotzMeta;
  notes: string[];
} {
  return {
    meta: { ...meta, lightSuppressed: true },
    notes: ["Camazotz apaga a luz do campo."],
  };
}

/** Visão Noturna: não cega; não erra vs HP < 50% */
export function camazotzCannotBeBlinded(): boolean {
  return true;
}

export function camazotzNeverMissLowHp(targetHpRatio: number): boolean {
  return targetHpRatio < 0.5;
}

/** Sopro da Lua após hit */
export function camazotzOnSuccessfulHit(meta: CamazotzMeta): CamazotzMeta {
  const stacks = Math.min(5, meta.soproStacks + 1);
  return { ...meta, soproStacks: stacks, soproTurnsLeft: 2 };
}

/** Drenagem Sombria: 22% ou 35% se sangrando */
export function camazotzLifesteal(
  damage: number,
  targetBleeding: boolean,
  bossHp: number,
  bossMaxHp: number,
): { heal: number; newHp: number } {
  const pct = targetBleeding ? 0.35 : 0.22;
  const heal = Math.floor(damage * pct);
  return { heal, newHp: Math.min(bossMaxHp, bossHp + heal) };
}

/** Cura de players sob Noite Eterna: 50% */
export function camazotzPlayerHealMult(meta: CamazotzMeta): number {
  return meta.nightPhase === "eternal" ? 0.5 : 1;
}

export type CamazotzSkillId =
  | "mordida-sombria"
  | "voo-do-corvo"
  | "chamado-dos-morcegos"
  | "lua-de-sangue"
  | "asas-do-eclipse"
  | "devorador-da-escuridao";

export type CamazotzSkillDef = {
  id: CamazotzSkillId;
  name: string;
  unlockLevel: number;
  ultimate?: boolean;
  costMp?: number;
  costEst?: number;
  costMpPct?: number;
  costEstPct?: number;
};

export const CAMAZOTZ_SKILLS: CamazotzSkillDef[] = [
  { id: "mordida-sombria", name: "Mordida Sombria", unlockLevel: 12, costMp: 20, costEst: 17 },
  { id: "voo-do-corvo", name: "Voo do Corvo", unlockLevel: 12, costMp: 24, costEst: 21 },
  { id: "chamado-dos-morcegos", name: "Chamado dos Morcegos", unlockLevel: 12, costMp: 30, costEst: 26 },
  { id: "lua-de-sangue", name: "Lua de Sangue", unlockLevel: 200, costMp: 38, costEst: 34 },
  { id: "asas-do-eclipse", name: "Asas do Eclipse", unlockLevel: 300, costMp: 42, costEst: 38 },
  {
    id: "devorador-da-escuridao",
    name: "Devorador da Escuridão",
    unlockLevel: 400,
    ultimate: true,
    costMpPct: 0.1,
    costEstPct: 0.12,
  },
];

export function camazotzSkillByName(name: string): CamazotzSkillDef | null {
  const n = name.trim().toLowerCase();
  return (
    CAMAZOTZ_SKILLS.find((s) => s.name.toLowerCase() === n || s.id === n) ?? null
  );
}

export type CamazotzTarget = {
  id: string;
  hp: number;
  maxHp: number;
  bleeding: boolean;
};

export type CamazotzResolveResult = {
  meta: CamazotzMeta;
  bossHp: number;
  bossMp: number;
  bossEst: number;
  damages: { targetId: string; damage: number; killed: boolean }[];
  bleeds: { targetId: string; duration: number; stacks?: number }[];
  agiDebuffs: string[];
  notes: string[];
};

export function resolveCamazotzSkill(
  skillName: string,
  opts: {
    level: number;
    baseStats: CamazotzBossStats;
    meta: CamazotzMeta;
    bossHp: number;
    bossMp: number;
    bossEst: number;
    primaryTargetId: string;
    targets: CamazotzTarget[];
    rollDie: (n: number) => number;
  },
): CamazotzResolveResult | null {
  const skill = camazotzSkillByName(skillName);
  if (!skill || opts.level < skill.unlockLevel) return null;

  let meta = {
    ...opts.meta,
    bloodMoonTargets: [...opts.meta.bloodMoonTargets],
  };
  const stats = camazotzEffectiveStats(opts.baseStats, meta);
  let mp = opts.bossMp;
  let est = opts.bossEst;
  let bossHp = opts.bossHp;
  const notes: string[] = [];
  const damages: CamazotzResolveResult["damages"] = [];
  const bleeds: CamazotzResolveResult["bleeds"] = [];
  const agiDebuffs: string[] = [];

  const costMp = skill.costMpPct
    ? Math.floor(stats.mp * skill.costMpPct)
    : skill.costMp ?? 0;
  const costEst = skill.costEstPct
    ? Math.floor(stats.est * skill.costEstPct)
    : skill.costEst ?? 0;
  if (mp < costMp || est < costEst) {
    notes.push("Camazotz: recursos insuficientes");
    return null;
  }
  mp -= costMp;
  est -= costEst;

  // Ecos da Caverna: -1 AGI em todos ao usar skill
  for (const t of opts.targets) agiDebuffs.push(t.id);
  notes.push("Ecos da Caverna: -1 AGI nos inimigos no próximo turno");

  const primary =
    opts.targets.find((t) => t.id === opts.primaryTargetId) ?? opts.targets[0];
  if (!primary) return null;

  const applyHit = (
    t: CamazotzTarget,
    raw: number,
    optsHit?: { ignoreDefPct?: number; bloodMoonBonus?: boolean },
  ) => {
    let dmg = raw;
    if (optsHit?.ignoreDefPct) dmg = Math.floor(dmg * (1 + optsHit.ignoreDefPct * 0.5));
    if (meta.bloodMoonTargets.includes(t.id) || optsHit?.bloodMoonBonus) {
      dmg = Math.floor(dmg * 1.2);
    }
    if (meta.nightPhase === "eternal") dmg = Math.floor(dmg * 1.25);
    dmg = Math.max(1, dmg);
    const killed = t.hp - dmg <= 0;
    damages.push({ targetId: t.id, damage: dmg, killed });
    meta = camazotzOnSuccessfulHit(meta);
    const ls = camazotzLifesteal(dmg, t.bleeding, bossHp, stats.hp);
    bossHp = ls.newHp;
    if (ls.heal > 0) notes.push(`Drenagem Sombria: +${ls.heal} HP`);
    return dmg;
  };

  if (skill.id === "mordida-sombria") {
    const dmg = Math.max(1, stats.atk + opts.rollDie(8));
    applyHit(primary, dmg);
    bleeds.push({ targetId: primary.id, duration: 2 });
    const extra = Math.floor(stats.hp * 0.1);
    bossHp = Math.min(stats.hp, bossHp + extra);
    notes.push(`Mordida Sombria: sangramento + recupera ${extra} HP`);
  } else if (skill.id === "voo-do-corvo") {
    const dmg = Math.max(1, Math.floor(stats.atk * 1.1) + opts.rollDie(8));
    applyHit(primary, dmg, { ignoreDefPct: 0.18 });
    notes.push("Voo do Corvo: investida, ignora 18% DEF");
  } else if (skill.id === "chamado-dos-morcegos") {
    for (const t of opts.targets) {
      const dmg = Math.max(1, Math.floor(stats.atk * 0.55) + opts.rollDie(6));
      applyHit(t, dmg);
      bleeds.push({ targetId: t.id, duration: 1 });
    }
    notes.push("Chamado dos Morcegos: área + sangramento 1 turno");
  } else if (skill.id === "lua-de-sangue") {
    meta.bloodMoonTargets = opts.targets.map((t) => t.id);
    for (const t of opts.targets) {
      const dmg = Math.max(1, Math.floor(stats.atkMgc * 0.7) + opts.rollDie(6));
      applyHit(t, dmg, { bloodMoonBonus: true });
      bleeds.push({ targetId: t.id, duration: 2 });
    }
    const zoneHeal = Math.floor(stats.hp * 0.05 * Math.max(1, opts.targets.length));
    bossHp = Math.min(stats.hp, bossHp + zoneHeal);
    notes.push(`Lua de Sangue: zona ativa, +${zoneHeal} HP`);
  } else if (skill.id === "asas-do-eclipse") {
    meta.blockNextAoe = true;
    for (const t of opts.targets) {
      const dmg =
        Math.floor(stats.atkMgc * 1.1) + opts.rollDie(10) + opts.rollDie(6);
      applyHit(t, dmg);
    }
    notes.push("Asas do Eclipse: bloqueia próximo AOE + onda de Trevas");
  } else if (skill.id === "devorador-da-escuridao") {
    meta = camazotzActivateEternalNight(meta);
    for (const t of opts.targets) {
      let dmg =
        Math.floor(stats.atk * 1.6) +
        Math.floor(stats.atkMgc) +
        opts.rollDie(12) +
        opts.rollDie(12);
      applyHit(t, dmg);
      bleeds.push({ targetId: t.id, duration: 3, stacks: 3 });
    }
    notes.push("Devorador da Escuridão: Noite Eterna + sangramento máximo");
    for (const d of damages) {
      if (d.killed) {
        meta = {
          ...meta,
          permanentAtkPct: meta.permanentAtkPct + 15,
        };
        notes.push("+15% ATK permanente pela queda");
      }
    }
  }

  return {
    meta,
    bossHp,
    bossMp: mp,
    bossEst: est,
    damages,
    bleeds,
    agiDebuffs,
    notes,
  };
}

/** Tick Lua de Sangue: sangramento + cura do boss */
export function camazotzBloodMoonTick(
  meta: CamazotzMeta,
  stats: CamazotzBossStats,
  targets: CamazotzTarget[],
): {
  bleeds: string[];
  bossHeal: number;
  notes: string[];
} {
  if (!meta.bloodMoonTargets.length) {
    return { bleeds: [], bossHeal: 0, notes: [] };
  }
  const bleeds = meta.bloodMoonTargets.filter((id) =>
    targets.some((t) => t.id === id && t.hp > 0),
  );
  const bossHeal = Math.floor(stats.hp * 0.03 * Math.max(1, bleeds.length));
  return {
    bleeds,
    bossHeal,
    notes: bleeds.length
      ? [`Lua de Sangue: ${bleeds.length} alvo(s) sangram; Camazotz +${bossHeal} HP`]
      : [],
  };
}
