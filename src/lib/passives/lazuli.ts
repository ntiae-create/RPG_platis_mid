/**
 * Lazuli (Dragonoide) — lógica pura e determinística.
 * Marcas por par (sourceId, targetId); 5ª marca dispara Efeito da Morte.
 */

export type LazuliMarkState = {
  sourceId: string;
  targetId: string;
  stacks: number;
  damageValues: number[];
};

export type LazuliResult = {
  /** marcas restantes após a ação (vazio se consumidas) */
  mark: LazuliMarkState | null;
  /** dano adicional do Efeito da Morte (0 se não ativou) */
  deathDamage: number;
  /** true se deve conceder Fúria do Dragão neste momento */
  triggerFury: boolean;
  /** dano total a aplicar = finalDamage + deathDamage */
  totalDamage: number;
  note: string;
};

/**
 * Registra um ataque elegível (já com dano final, críticos e mods).
 * Não conta o próprio deathDamage como nova marca.
 */
export function registerLazuliHit(opts: {
  existing: LazuliMarkState | null;
  sourceId: string;
  targetId: string;
  finalDamage: number;
  furyAlreadyActive: boolean;
}): LazuliResult {
  const { sourceId, targetId, finalDamage, furyAlreadyActive } = opts;
  if (finalDamage <= 0) {
    return {
      mark: opts.existing,
      deathDamage: 0,
      triggerFury: false,
      totalDamage: 0,
      note: "",
    };
  }

  const prev = opts.existing;
  const damageValues = [...(prev?.damageValues ?? []), finalDamage].slice(-5);
  const stacks = (prev?.stacks ?? 0) + 1;

  if (stacks >= 5) {
    const deathDamage = damageValues.reduce((sum, v) => sum + v, 0);
    return {
      mark: null,
      deathDamage,
      triggerFury: !furyAlreadyActive,
      totalDamage: finalDamage + deathDamage,
      note: `Lazuli — Efeito da Morte: ${deathDamage} de dano adicional acumulado`,
    };
  }

  return {
    mark: {
      sourceId,
      targetId,
      stacks,
      damageValues,
    },
    deathDamage: 0,
    triggerFury: false,
    totalDamage: finalDamage,
    note: `Lazuli: Marca Dracônica (${stacks}/5)`,
  };
}

/**
 * Muralha (Tank) — calcula divisão de dano (50% floor no tank).
 * Um único tank elegível: vivo, não é o alvo, na frente (x <= frontMax),
 * distância Manhattan <= range.
 */
export function computeTankShare(opts: {
  damage: number;
  defenderId: string;
  tanks: Array<{ id: string; hp: number; x: number; y: number }>;
  defenderPos: { x: number; y: number } | null;
  frontMaxX?: number;
  maxRange?: number;
}): { damageToDef: number; tankShare: number; tankId: string | null } {
  const { damage, defenderId, tanks, defenderPos } = opts;
  const frontMaxX = opts.frontMaxX ?? 3;
  const maxRange = opts.maxRange ?? 4;

  if (damage <= 0 || !defenderPos) {
    return { damageToDef: damage, tankShare: 0, tankId: null };
  }

  let best: { id: string; dist: number } | null = null;
  for (const t of tanks) {
    if (t.id === defenderId || t.hp <= 0) continue;
    if (t.x > frontMaxX) continue;
    const dist = Math.abs(t.x - defenderPos.x) + Math.abs(t.y - defenderPos.y);
    if (dist > maxRange) continue;
    if (!best || dist < best.dist) best = { id: t.id, dist };
  }

  if (!best) {
    return { damageToDef: damage, tankShare: 0, tankId: null };
  }

  const tankShare = Math.floor(damage * 0.5);
  return {
    damageToDef: damage - tankShare,
    tankShare,
    tankId: best.id,
  };
}
