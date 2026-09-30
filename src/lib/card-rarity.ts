export type CardRarity = "SR" | "SSR" | "UR" | "UR_MAX" | "LR" | "LR_EXTRA";

export function getCardRarity(
  level: number,
  raceId?: string,
  isMaster = false,
): CardRarity {
  if (isMaster && level >= 800 && (raceId === "kitsune" || raceId === "doppelganger")) {
    return "LR_EXTRA";
  }

  if (isMaster && level >= 400) return "LR";
  if (level >= 150) return "UR_MAX";
  if (level >= 100) return "UR";
  if (level >= 50) return "SSR";
  return "SR";
}
