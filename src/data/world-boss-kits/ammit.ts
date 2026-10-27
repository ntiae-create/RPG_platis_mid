/**
 * Ammit — kit World Boss (A Balança / Peso 0–10).
 */

export type AmmitMeta = {
  turnsElapsed: number;
  /** Peso por characterId (0–10) */
  weight: Record<string, number>;
  /** ATK permanente por kills (fração, ex. 0.1 = +10%) */
  permanentAtkBonus: number;
  /** HP max bonus permanente por kills (fração) */
  permanentHpBonus: number;
  /** alvos sob Sombra do Abismo */
  abyssZone: string[];
  /** ids que não podem ser revividos por N turnos */
  noReviveUntil: Record<string, number>;
  /** ataques recebidos no turno atual (Corpo de Rocha) */
  hitsThisTurn: number;
  /** Nada Resta ativa (após fase / ultimate) */
  supremeActive: boolean;
};

export function emptyAmmitMeta(): AmmitMeta {
  return {
    turnsElapsed: 0,
    weight: {},
    permanentAtkBonus: 0,
    permanentHpBonus: 0,
    abyssZone: [],
    noReviveUntil: {},
    hitsThisTurn: 0,
    supremeActive: false,
  };
}

export type AmmitForm =
  | "guardia-limite"
  | "balanca-pesada"
  | "dentes-julgamento"
  | "nao-perdoa"
  | "devoracao-final";

export function ammitFormForLevel(level: number): AmmitForm {
  if (level >= 400) return "devoracao-final";
  if (level >= 300) return "nao-perdoa";
  if (level >= 200) return "dentes-julgamento";
  if (level >= 100) return "balanca-pesada";
  return "guardia-limite";
}

export function ammitFormLabel(form: AmmitForm): string {
  switch (form) {
    case "guardia-limite":
      return "Guardiã do Limite";
    case "balanca-pesada":
      return "A Balança Pesada";
    case "dentes-julgamento":
      return "Dentes do Julgamento";
    case "nao-perdoa":
      return "A Que Não Perdoa";
    case "devoracao-final":
      return "Devoração Final — O Fim do Peso";
  }
}

export type AmmitBossStats = {
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

export function getWeight(meta: AmmitMeta, id: string): number {
  return Math.max(0, Math.min(10, meta.weight[id] ?? 0));
}

export function addWeight(
  meta: AmmitMeta,
  id: string,
  amount: number,
  opts?: { doubled?: boolean },
): AmmitMeta {
  let a = amount;
  if (opts?.doubled || meta.supremeActive) {
    // Nada Resta: acúmulo mais rápido (+50% no mínimo)
    a = Math.ceil(a * (meta.supremeActive ? 1.5 : 1));
  }
  const next = Math.min(10, getWeight(meta, id) + a);
  return {
    ...meta,
    weight: { ...meta.weight, [id]: next },
  };
}

/** Reduz peso (proteção/suporte) */
export function reduceWeight(meta: AmmitMeta, id: string, amount: number): AmmitMeta {
  const next = Math.max(0, getWeight(meta, id) - Math.max(0, amount));
  const weight = { ...meta.weight, [id]: next };
  if (next === 0) delete weight[id];
  else weight[id] = next;
  return { ...meta, weight };
}

/** Mult de dano de Ammit vs alvo por Peso (0 → 1.0, 10 → ~2.0) */
export function ammitWeightDamageMult(meta: AmmitMeta, targetId: string): number {
  const w = getWeight(meta, targetId);
  return 1 + w * 0.1;
}

export function ammitEffectiveStats(
  base: AmmitBossStats,
  meta: AmmitMeta,
): AmmitBossStats {
  const atkMult = 1 + meta.permanentAtkBonus;
  const hpMult = 1 + meta.permanentHpBonus;
  return {
    ...base,
    hp: Math.floor(base.hp * hpMult),
    atk: Math.max(1, Math.floor(base.atk * atkMult)),
  };
}

/** Corpo de Rocha: 12% redução; dobra se hitsThisTurn > 2 */
export function ammitIncomingDamageMult(meta: AmmitMeta): number {
  const base = 0.88;
  if (meta.hitsThisTurn > 2) return base * 0.88; // dobra a resistência ≈ mais redução
  return base;
}

export function ammitRegisterHitTaken(meta: AmmitMeta): AmmitMeta {
  return { ...meta, hitsThisTurn: meta.hitsThisTurn + 1 };
}

/** Prioriza maior peso */
export function ammitPickPrimaryTarget(
  meta: AmmitMeta,
  targetIds: string[],
  preferred?: string,
): string | null {
  if (!targetIds.length) return null;
  let best = preferred && targetIds.includes(preferred) ? preferred : targetIds[0];
  let bestW = getWeight(meta, best);
  for (const id of targetIds) {
    const w = getWeight(meta, id);
    if (w > bestW) {
      best = id;
      bestW = w;
    }
  }
  return best;
}

export function ammitOnTurnAdvance(meta: AmmitMeta): {
  meta: AmmitMeta;
  notes: string[];
  abyssWeight: string[];
} {
  const notes: string[] = [];
  const next: AmmitMeta = {
    ...meta,
    turnsElapsed: meta.turnsElapsed + 1,
    hitsThisTurn: 0,
    weight: { ...meta.weight },
    abyssZone: [...meta.abyssZone],
    noReviveUntil: { ...meta.noReviveUntil },
  };

  // tick no-revive
  for (const id of Object.keys(next.noReviveUntil)) {
    next.noReviveUntil[id] -= 1;
    if (next.noReviveUntil[id] <= 0) delete next.noReviveUntil[id];
  }

  // Sombra do Abismo: +2 peso
  const abyssWeight: string[] = [];
  for (const id of next.abyssZone) {
    const before = getWeight(next, id);
    Object.assign(next, addWeight(next, id, 2));
    if (getWeight(next, id) > before) abyssWeight.push(id);
  }
  if (abyssWeight.length) {
    notes.push(`Sombra do Abismo: +2 Peso em ${abyssWeight.length} alvo(s)`);
  }

  return { meta: next, notes, abyssWeight };
}

/** Gula / kill */
export function ammitOnEnemyFallen(
  meta: AmmitMeta,
  bossMaxHp: number,
  bossHp: number,
  targetId: string,
  fromUltimate: boolean,
): { meta: AmmitMeta; newHp: number; notes: string[] } {
  const notes: string[] = [];
  let m: AmmitMeta = {
    ...meta,
    permanentAtkBonus: meta.permanentAtkBonus + 0.1,
    permanentHpBonus: meta.permanentHpBonus + 0.2,
    noReviveUntil: {
      ...meta.noReviveUntil,
      [targetId]: fromUltimate ? 99 : 3,
    },
  };
  if (fromUltimate) m = { ...m, supremeActive: true };
  const heal = Math.floor(bossMaxHp * 0.2);
  notes.push(
    `Gula Sem Fim: +20% HP max essência, +10% ATK permanente; sem reviver ${fromUltimate ? "permanente neste combate" : "3 turnos"}`,
  );
  return {
    meta: m,
    newHp: Math.min(Math.floor(bossMaxHp * (1 + m.permanentHpBonus)), bossHp + heal),
    notes,
  };
}

export function ammitLifesteal(
  damage: number,
  bossHp: number,
  bossMaxHp: number,
): { heal: number; newHp: number } {
  const heal = Math.floor(damage * 0.25);
  return { heal, newHp: Math.min(bossMaxHp, bossHp + heal) };
}

/** Cura de players na zona do abismo: 50% */
export function ammitPlayerHealMult(meta: AmmitMeta, targetId: string): number {
  return meta.abyssZone.includes(targetId) ? 0.5 : 1;
}

export function ammitCanRevive(meta: AmmitMeta, targetId: string): boolean {
  return !(meta.noReviveUntil[targetId] > 0);
}

/** Imobilidade da Sentença: peso 10 */
export function ammitMaxWeightDebuff(meta: AmmitMeta, targetId: string): {
  agiPenalty: number;
  cannotDodge: boolean;
  ignoreDefPct: number;
} {
  const w = getWeight(meta, targetId);
  if (w >= 10) {
    return { agiPenalty: 3, cannotDodge: true, ignoreDefPct: 0.2 };
  }
  if (w > 0) return { agiPenalty: 0, cannotDodge: false, ignoreDefPct: 0.2 * (w / 10) };
  return { agiPenalty: 0, cannotDodge: false, ignoreDefPct: 0 };
}

/** Nada Resta: <30% HP → peso dobrado no próximo add */
export function ammitShouldDoubleWeightGain(
  meta: AmmitMeta,
  hpRatio: number,
): boolean {
  return meta.supremeActive && hpRatio < 0.3;
}

export type AmmitSkillId =
  | "mordida-julgadora"
  | "golpe-de-cauda"
  | "abalo-do-juizo"
  | "mandibula-da-verdade"
  | "sombra-do-abismo"
  | "devoracao-da-alma";

export type AmmitSkillDef = {
  id: AmmitSkillId;
  name: string;
  unlockLevel: number;
  ultimate?: boolean;
  costMp?: number;
  costEst?: number;
  costMpPct?: number;
  costEstPct?: number;
};

export const AMMIT_SKILLS: AmmitSkillDef[] = [
  { id: "mordida-julgadora", name: "Mordida Julgadora", unlockLevel: 12, costMp: 22, costEst: 18 },
  { id: "golpe-de-cauda", name: "Golpe de Cauda", unlockLevel: 12, costMp: 25, costEst: 22 },
  { id: "abalo-do-juizo", name: "Abalo do Juízo", unlockLevel: 12, costMp: 30, costEst: 28 },
  { id: "mandibula-da-verdade", name: "Mandíbula da Verdade", unlockLevel: 200, costMp: 38, costEst: 35 },
  { id: "sombra-do-abismo", name: "Sombra do Abismo", unlockLevel: 300, costMp: 45, costEst: 40 },
  {
    id: "devoracao-da-alma",
    name: "Devoração da Alma",
    unlockLevel: 400,
    ultimate: true,
    costMpPct: 0.1,
    costEstPct: 0.12,
  },
];

export function ammitSkillByName(name: string): AmmitSkillDef | null {
  const n = name.trim().toLowerCase();
  return AMMIT_SKILLS.find((s) => s.name.toLowerCase() === n || s.id === n) ?? null;
}

export type AmmitTarget = {
  id: string;
  hp: number;
  maxHp: number;
};

export type AmmitResolveResult = {
  meta: AmmitMeta;
  bossHp: number;
  bossMp: number;
  bossEst: number;
  damages: { targetId: string; damage: number; killed: boolean }[];
  immobilizes: string[];
  notes: string[];
};

export function resolveAmmitSkill(
  skillName: string,
  opts: {
    level: number;
    baseStats: AmmitBossStats;
    meta: AmmitMeta;
    bossHp: number;
    bossMp: number;
    bossEst: number;
    primaryTargetId: string;
    targets: AmmitTarget[];
    rollDie: (n: number) => number;
  },
): AmmitResolveResult | null {
  const skill = ammitSkillByName(skillName);
  if (!skill || opts.level < skill.unlockLevel) return null;

  let meta = {
    ...opts.meta,
    weight: { ...opts.meta.weight },
    abyssZone: [...opts.meta.abyssZone],
    noReviveUntil: { ...opts.meta.noReviveUntil },
  };
  const stats = ammitEffectiveStats(opts.baseStats, meta);
  let mp = opts.bossMp;
  let est = opts.bossEst;
  let bossHp = opts.bossHp;
  const notes: string[] = [];
  const damages: AmmitResolveResult["damages"] = [];
  const immobilizes: string[] = [];

  const costMp = skill.costMpPct
    ? Math.floor(stats.mp * skill.costMpPct)
    : skill.costMp ?? 0;
  const costEst = skill.costEstPct
    ? Math.floor(stats.est * skill.costEstPct)
    : skill.costEst ?? 0;
  if (mp < costMp || est < costEst) {
    notes.push("Ammit: recursos insuficientes");
    return null;
  }
  mp -= costMp;
  est -= costEst;

  const ids = opts.targets.map((t) => t.id);
  const primaryId =
    ammitPickPrimaryTarget(meta, ids, opts.primaryTargetId) ?? opts.primaryTargetId;
  const primary =
    opts.targets.find((t) => t.id === primaryId) ?? opts.targets[0];
  if (!primary) return null;

  const hit = (t: AmmitTarget, raw: number) => {
    const deb = ammitMaxWeightDebuff(meta, t.id);
    let dmg = Math.floor(raw * ammitWeightDamageMult(meta, t.id));
    if (deb.ignoreDefPct > 0) dmg = Math.floor(dmg * (1 + deb.ignoreDefPct * 0.5));
    dmg = Math.max(1, dmg);
    const killed = t.hp - dmg <= 0;
    damages.push({ targetId: t.id, damage: dmg, killed });
    const ls = ammitLifesteal(dmg, bossHp, stats.hp);
    bossHp = ls.newHp;
    if (ls.heal > 0) notes.push(`Gula: +${ls.heal} HP`);
    return dmg;
  };

  if (skill.id === "mordida-julgadora") {
    let raw = stats.atk + opts.rollDie(8);
    if (getWeight(meta, primary.id) >= 5) raw = Math.floor(raw * 1.2);
    hit(primary, raw);
    meta = addWeight(meta, primary.id, 2);
    notes.push("Mordida Julgadora: +2 Peso");
  } else if (skill.id === "golpe-de-cauda") {
    const targets = opts.targets.slice(0, 3);
    for (const t of targets) {
      hit(t, Math.floor(stats.atk * 0.85) + opts.rollDie(6));
      meta = addWeight(meta, t.id, 1);
    }
    notes.push("Golpe de Cauda: área + empurrão +1 Peso");
  } else if (skill.id === "abalo-do-juizo") {
    for (const t of opts.targets) {
      hit(t, Math.floor(stats.atk * 0.55) + opts.rollDie(4));
      meta = addWeight(meta, t.id, 1);
    }
    notes.push("Abalo do Juízo: +1 Peso em todos");
  } else if (skill.id === "mandibula-da-verdade") {
    const raw = Math.floor(stats.atk * 1.5) + opts.rollDie(10) + opts.rollDie(10);
    hit(primary, raw);
    immobilizes.push(primary.id);
    meta = addWeight(meta, primary.id, 3);
    notes.push("Mandíbula da Verdade: imobiliza +3 Peso");
  } else if (skill.id === "sombra-do-abismo") {
    meta.abyssZone = opts.targets.map((t) => t.id);
    for (const t of opts.targets) {
      hit(t, Math.floor(stats.atkMgc * 0.6) + opts.rollDie(6));
      meta = addWeight(meta, t.id, 2);
    }
    notes.push("Sombra do Abismo: zona ativa");
  } else if (skill.id === "devoracao-da-alma") {
    meta.supremeActive = true;
    for (const t of opts.targets) {
      const ratio = t.maxHp > 0 ? t.hp / t.maxHp : 1;
      if (ratio < 0.5) meta = { ...meta, weight: { ...meta.weight, [t.id]: 10 } };
      const raw =
        Math.floor(stats.atk * 1.6) +
        Math.floor(stats.atkMgc) +
        opts.rollDie(12) +
        opts.rollDie(12);
      hit(t, raw);
    }
    notes.push("Devoração da Alma: Peso máximo em feridos + Noite do Juízo");
  }

  for (const d of damages) {
    if (!d.killed) continue;
    const fallen = ammitOnEnemyFallen(
      meta,
      stats.hp,
      bossHp,
      d.targetId,
      skill.id === "devoracao-da-alma",
    );
    meta = fallen.meta;
    bossHp = fallen.newHp;
    notes.push(...fallen.notes);
  }

  return {
    meta,
    bossHp,
    bossMp: mp,
    bossEst: est,
    damages,
    immobilizes,
    notes,
  };
}
