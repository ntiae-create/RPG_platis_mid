/**
 * Raiju — kit World Boss (Campo em Chamas + Combustão).
 */

export type RaijuMeta = {
  turnsElapsed: number;
  /** combustão stacks por alvo (máx 3); duration null = Fogo Eterno */
  combustion: Record<string, { stacks: number; turnsLeft: number | null }>;
  /** células/alvos com rastro de fogo (ids simplificados) */
  fireTrail: string[];
  /** Fogo Eterno ativa (combustão sem duração) */
  eternalFire: boolean;
  /** alvos que não podem curar neste turno (Chama que Se Alimenta) */
  noHealUntil: Record<string, number>;
};

export function emptyRaijuMeta(): RaijuMeta {
  return {
    turnsElapsed: 0,
    combustion: {},
    fireTrail: [],
    eternalFire: false,
    noHealUntil: {},
  };
}

export type RaijuForm =
  | "fera-centelha"
  | "lobo-chama-viva"
  | "corpo-combustao"
  | "chama-nao-apaga"
  | "sol-forma-fera";

export function raijuFormForLevel(level: number): RaijuForm {
  if (level >= 400) return "sol-forma-fera";
  if (level >= 300) return "chama-nao-apaga";
  if (level >= 200) return "corpo-combustao";
  if (level >= 100) return "lobo-chama-viva";
  return "fera-centelha";
}

export function raijuFormLabel(form: RaijuForm): string {
  switch (form) {
    case "fera-centelha":
      return "Fera da Centelha";
    case "lobo-chama-viva":
      return "Lobo da Chama Viva";
    case "corpo-combustao":
      return "Corpo em Combustão";
    case "chama-nao-apaga":
      return "A Chama que Não Apaga";
    case "sol-forma-fera":
      return "Sol em Forma de Fera — Fogo Eterno";
  }
}

export type RaijuBossStats = {
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

export function countCombustionTargets(meta: RaijuMeta): number {
  return Object.values(meta.combustion).filter((c) => c.stacks > 0).length;
}

export function allEnemiesBurning(meta: RaijuMeta, targetIds: string[]): boolean {
  if (!targetIds.length) return false;
  return targetIds.every((id) => (meta.combustion[id]?.stacks ?? 0) > 0);
}

/** Fogo Crescente: +8% ATK / +5% AGI por alvo em combustão (cap 24/15) */
export function raijuEffectiveStats(
  base: RaijuBossStats,
  meta: RaijuMeta,
): RaijuBossStats {
  const n = Math.min(3, countCombustionTargets(meta));
  const atkPct = n * 0.08;
  const agiPct = n * 0.05;
  let atkMult = 1 + atkPct;
  // Fogo Eterno supreme when all burning handled in damage
  return {
    ...base,
    atk: Math.max(1, Math.floor(base.atk * atkMult)),
    agi: Math.max(1, Math.floor(base.agi * (1 + agiPct))),
  };
}

export function applyCombustion(
  meta: RaijuMeta,
  targetId: string,
  stacks: number,
): RaijuMeta {
  const cur = meta.combustion[targetId];
  const nextStacks = Math.min(3, (cur?.stacks ?? 0) + stacks);
  const turnsLeft = meta.eternalFire ? null : 2;
  return {
    ...meta,
    combustion: {
      ...meta.combustion,
      [targetId]: { stacks: nextStacks, turnsLeft },
    },
    noHealUntil: {
      ...meta.noHealUntil,
      [targetId]: 1,
    },
  };
}

export function extinguishCombustion(meta: RaijuMeta, targetId: string): RaijuMeta {
  const combustion = { ...meta.combustion };
  delete combustion[targetId];
  return { ...meta, combustion };
}

export function raijuOnTurnAdvance(
  meta: RaijuMeta,
  aliveIds: string[],
  baseAtkMgc: number,
  rollDie: (n: number) => number,
): {
  meta: RaijuMeta;
  dotDamages: { targetId: string; damage: number }[];
  trailDamages: { targetId: string; damage: number }[];
  notes: string[];
} {
  const notes: string[] = [];
  let next: RaijuMeta = {
    ...meta,
    turnsElapsed: meta.turnsElapsed + 1,
    combustion: { ...meta.combustion },
    fireTrail: [...meta.fireTrail],
    noHealUntil: { ...meta.noHealUntil },
  };

  // tick no-heal
  for (const id of Object.keys(next.noHealUntil)) {
    next.noHealUntil[id] -= 1;
    if (next.noHealUntil[id] <= 0) delete next.noHealUntil[id];
  }

  // spread fire trail slowly
  if (next.fireTrail.length < Math.max(4, aliveIds.length)) {
    for (const id of aliveIds) {
      if (!next.fireTrail.includes(id) && Math.random() < 0.25) {
        next.fireTrail.push(id);
        notes.push(`Campo em Chamas se espalha (${id})`);
        break;
      }
    }
  }

  const trailDamages: { targetId: string; damage: number }[] = [];
  for (const id of next.fireTrail) {
    if (!aliveIds.includes(id)) continue;
    const dmg = Math.max(1, Math.floor(baseAtkMgc * 0.15) + rollDie(4));
    trailDamages.push({ targetId: id, damage: dmg });
    if (Math.random() < 0.35) {
      next = applyCombustion(next, id, 1);
      notes.push(`Rastro de fogo: Combustão em ${id}`);
    }
  }

  const dotDamages: { targetId: string; damage: number }[] = [];
  for (const [id, c] of Object.entries(next.combustion)) {
    if (c.stacks <= 0) continue;
    const dmg = Math.max(1, c.stacks * (3 + rollDie(4)));
    dotDamages.push({ targetId: id, damage: dmg });
    if (!next.eternalFire && c.turnsLeft !== null) {
      const left = c.turnsLeft - 1;
      if (left <= 0) {
        delete next.combustion[id];
        notes.push(`Combustão em ${id} apagou`);
      } else {
        next.combustion[id] = { stacks: c.stacks, turnsLeft: left };
      }
    }
  }

  return { meta: next, dotDamages, trailDamages, notes };
}

/** Corpo em Chama: retorno melee */
export function raijuMeleeReflect(
  bossHpRatio: number,
  baseAtk: number,
): number {
  const base = Math.max(1, Math.floor(baseAtk * 0.12));
  return bossHpRatio < 0.5 ? base * 2 : base;
}

export function raijuBlocksHeal(meta: RaijuMeta, targetId: string): boolean {
  return (meta.noHealUntil[targetId] ?? 0) > 0;
}

export function raijuOnEnemyFallenBurning(
  meta: RaijuMeta,
  targetId: string,
  bossMaxHp: number,
  bossHp: number,
): { meta: RaijuMeta; newHp: number; notes: string[] } {
  const burning = (meta.combustion[targetId]?.stacks ?? 0) > 0;
  if (!burning) return { meta, newHp: bossHp, notes: [] };
  const heal = Math.floor(bossMaxHp * 0.1);
  return {
    meta,
    newHp: Math.min(bossMaxHp, bossHp + heal),
    notes: [`Chama que Se Alimenta: +${heal} HP (inimigo caiu em Combustão)`],
  };
}

export type RaijuSkillId =
  | "uivo-da-centelha"
  | "garras-incandescentes"
  | "corrida-flamejante"
  | "explosao-de-cinzas"
  | "relampago-em-chama"
  | "o-sol-desperto";

export type RaijuSkillDef = {
  id: RaijuSkillId;
  name: string;
  unlockLevel: number;
  ultimate?: boolean;
  costMp?: number;
  costEst?: number;
  costMpPct?: number;
  costEstPct?: number;
};

export const RAIJU_SKILLS: RaijuSkillDef[] = [
  { id: "uivo-da-centelha", name: "Uivo da Centelha", unlockLevel: 12, costMp: 22, costEst: 18 },
  { id: "garras-incandescentes", name: "Garras Incandescentes", unlockLevel: 12, costMp: 25, costEst: 20 },
  { id: "corrida-flamejante", name: "Corrida Flamejante", unlockLevel: 12, costMp: 30, costEst: 25 },
  { id: "explosao-de-cinzas", name: "Explosão de Cinzas", unlockLevel: 200, costMp: 40, costEst: 32 },
  { id: "relampago-em-chama", name: "Relâmpago em Chama", unlockLevel: 300, costMp: 48, costEst: 38 },
  {
    id: "o-sol-desperto",
    name: "O SOL DESPERTO",
    unlockLevel: 400,
    ultimate: true,
    costMpPct: 0.1,
    costEstPct: 0.1,
  },
];

export function raijuSkillByName(name: string): RaijuSkillDef | null {
  const n = name.trim().toLowerCase();
  return (
    RAIJU_SKILLS.find(
      (s) =>
        s.name.toLowerCase() === n ||
        s.id === n ||
        s.name.toLowerCase().includes(n.replace(/^o\s+/, "")),
    ) ?? null
  );
}

export type RaijuTarget = {
  id: string;
  hp: number;
  maxHp: number;
};

export type RaijuResolveResult = {
  meta: RaijuMeta;
  bossHp: number;
  bossMp: number;
  bossEst: number;
  damages: { targetId: string; damage: number; killed: boolean }[];
  notes: string[];
};

export function resolveRaijuSkill(
  skillName: string,
  opts: {
    level: number;
    baseStats: RaijuBossStats;
    meta: RaijuMeta;
    bossHp: number;
    bossMp: number;
    bossEst: number;
    primaryTargetId: string;
    targets: RaijuTarget[];
    rollDie: (n: number) => number;
  },
): RaijuResolveResult | null {
  const skill = raijuSkillByName(skillName);
  if (!skill || opts.level < skill.unlockLevel) return null;

  let meta: RaijuMeta = {
    ...opts.meta,
    combustion: { ...opts.meta.combustion },
    fireTrail: [...opts.meta.fireTrail],
    noHealUntil: { ...opts.meta.noHealUntil },
  };
  const stats = raijuEffectiveStats(opts.baseStats, meta);
  let mp = opts.bossMp;
  let est = opts.bossEst;
  let bossHp = opts.bossHp;
  const notes: string[] = [];
  const damages: RaijuResolveResult["damages"] = [];

  const costMp = skill.costMpPct
    ? Math.floor(stats.mp * skill.costMpPct)
    : skill.costMp ?? 0;
  const costEst = skill.costEstPct
    ? Math.floor(stats.est * skill.costEstPct)
    : skill.costEst ?? 0;
  if (mp < costMp || est < costEst) {
    notes.push("Raiju: recursos insuficientes");
    return null;
  }
  mp -= costMp;
  est -= costEst;

  const primary =
    opts.targets.find((t) => t.id === opts.primaryTargetId) ?? opts.targets[0];
  if (!primary) return null;

  const ids = opts.targets.map((t) => t.id);
  const allBurn = allEnemiesBurning(meta, ids);
  const fireDmgMult =
    meta.eternalFire && allBurn ? 1.3 : 1;
  const ignoreRes = meta.eternalFire && allBurn ? 0.25 : 0;

  const hit = (t: RaijuTarget, raw: number, alreadyBurningBonus = false) => {
    let dmg = Math.floor(raw * fireDmgMult);
    if (alreadyBurningBonus && (meta.combustion[t.id]?.stacks ?? 0) > 0) {
      dmg = Math.floor(dmg * 1.2);
    }
    if (ignoreRes > 0) dmg = Math.floor(dmg * (1 + ignoreRes * 0.4));
    dmg = Math.max(1, dmg);
    const killed = t.hp - dmg <= 0;
    damages.push({ targetId: t.id, damage: dmg, killed });
    meta = applyCombustion(meta, t.id, 0); // ensure noHeal from fire damage path below
    meta = {
      ...meta,
      noHealUntil: { ...meta.noHealUntil, [t.id]: 1 },
    };
    return dmg;
  };

  if (skill.id === "uivo-da-centelha") {
    for (const t of opts.targets) {
      hit(t, Math.floor(stats.atkMgc * 0.55) + opts.rollDie(6));
      meta = applyCombustion(meta, t.id, 1);
    }
    notes.push("Uivo da Centelha: área + 1 Combustão");
  } else if (skill.id === "garras-incandescentes") {
    const burning = (meta.combustion[primary.id]?.stacks ?? 0) > 0;
    hit(primary, stats.atk + opts.rollDie(8), burning);
    meta = applyCombustion(meta, primary.id, 1);
    notes.push("Garras Incandescentes" + (burning ? " (+20% já queimando)" : ""));
  } else if (skill.id === "corrida-flamejante") {
    for (const t of opts.targets) {
      hit(t, Math.floor(stats.atk * 0.9) + opts.rollDie(6));
      meta = applyCombustion(meta, t.id, 1);
      if (!meta.fireTrail.includes(t.id)) meta.fireTrail.push(t.id);
    }
    notes.push("Corrida Flamejante: rastro de fogo");
  } else if (skill.id === "explosao-de-cinzas") {
    for (const t of opts.targets) {
      const was = (meta.combustion[t.id]?.stacks ?? 0) > 0;
      hit(t, Math.floor(stats.atkMgc * 0.9) + opts.rollDie(8));
      meta = applyCombustion(meta, t.id, was ? 2 : 1);
      if (was) {
        for (const o of opts.targets) {
          if (o.id === t.id) continue;
          meta = applyCombustion(meta, o.id, 1);
        }
      }
    }
    notes.push("Explosão de Cinzas: combustão extra / espalha");
  } else if (skill.id === "relampago-em-chama") {
    hit(
      primary,
      Math.floor(stats.atk * 1.3) + Math.floor(stats.atkMgc) + opts.rollDie(10),
    );
    meta = applyCombustion(meta, primary.id, 2);
    for (const t of opts.targets) {
      if (t.id === primary.id) continue;
      hit(t, Math.floor(stats.atkMgc * 0.7) + opts.rollDie(6));
      meta = applyCombustion(meta, t.id, 1);
    }
    notes.push("Relâmpago em Chama");
  } else if (skill.id === "o-sol-desperto") {
    meta.eternalFire = true;
    for (const t of opts.targets) {
      hit(
        t,
        Math.floor(stats.atk * 1.4) +
          Math.floor(stats.atkMgc * 1.2) +
          opts.rollDie(12) +
          opts.rollDie(8),
      );
      meta = applyCombustion(meta, t.id, 3);
      meta = {
        ...meta,
        combustion: {
          ...meta.combustion,
          [t.id]: { stacks: 3, turnsLeft: null },
        },
      };
    }
    notes.push("O SOL DESPERTO: Combustão máxima + Fogo Eterno");
  }

  for (const d of damages) {
    if (!d.killed) continue;
    const fallen = raijuOnEnemyFallenBurning(
      meta,
      d.targetId,
      stats.hp,
      bossHp,
    );
    meta = fallen.meta;
    bossHp = fallen.newHp;
    notes.push(...fallen.notes);
  }

  return { meta, bossHp, bossMp: mp, bossEst: est, damages, notes };
}
