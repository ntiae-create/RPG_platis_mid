export type CardRarity = "SR" | "SSR" | "UR" | "UR_MAX";

export function getCardRarity(level: number): CardRarity {
  if (level >= 150) return "UR_MAX";
  if (level >= 100) return "UR";
  if (level >= 50) return "SSR";
  return "SR";
}
