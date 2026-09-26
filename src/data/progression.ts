import type { StatKey } from "./types";

export const MAX_LEVEL = 150;
export const XP_PER_LEVEL = 100;
export const ATTR_PER_LEVEL = 3;
export const SAN_PER_LEVEL = 2;
export const POOL_EVERY = 5;
export const POOL_POINTS = 8;
export const INV_BASE = 20;
export const INV_EVERY = 5;
export const INV_BONUS = 10;

export const BRASAO_LEVELS = [
  { level: 0, xp: 0, name: "Sem Brasão", effect: "—" },
  { level: 1, xp: 3000, name: "Inicial", effect: "+2% status principal da Classe" },
  { level: 2, xp: 6000, name: "Leve", effect: "+5% status principal" },
  { level: 3, xp: 9000, name: "Pequeno", effect: "+7% status principal" },
  { level: 4, xp: 12000, name: "Médio", effect: "−20% Cooldown" },
  { level: 5, xp: 15000, name: "Pesado", effect: "+25% todos os status" },
  { level: 6, xp: 18000, name: "Grande", effect: "+1 Skill (4ª habilidade)" },
  { level: 7, xp: 23000, name: "Arcano", effect: "+50% todos os status" },
  { level: 8, xp: 30000, name: "Extra", effect: "Tenta invocar o Guardião" },
] as const;

export const BRASAO_PRIMARY_PCT: Record<number, number> = {
  1: 0.02,
  2: 0.05,
  3: 0.07,
};

export const BRASAO_ALL_PCT: Record<number, number> = {
  5: 0.25,
  7: 0.5,
};

export function brasaoLevelFromXp(xp: number): (typeof BRASAO_LEVELS)[number] {
  let current = BRASAO_LEVELS[0];
  for (const b of BRASAO_LEVELS) {
    if (xp >= b.xp) current = b;
  }
  return current;
}

export function xpToNextLevel(level: number): number {
  return level * XP_PER_LEVEL;
}

export function inventorySlots(level: number): number {
  return INV_BASE + Math.floor((level - 1) / INV_EVERY) * INV_BONUS;
}

export const STAT_LABELS: Record<StatKey, string> = {
  hp: "HP",
  mp: "MP",
  est: "EST",
  san: "Sanidade",
  atk: "ATK",
  atkMgc: "ATK MGC",
  def: "DEF",
  res: "RES",
  agi: "AGI",
  int: "INT",
};

export const COMBAT_DICE = [4, 6, 8, 10, 12, 15, 20, 50, 100] as const;

export const BRONZE_PER_SILVER = 100;
export const SILVER_PER_GOLD = 100;
export const GOLD_PER_PLATINUM = 1000;
export const MYSTERY_BOX_SILVER = 40;
