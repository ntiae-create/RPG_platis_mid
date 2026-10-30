import { CLASS_BY_ID } from "@/data/classes";
import type { Character, StatKey, Stats } from "@/data/types";
import { finalStats } from "./stats";

/**
 * Distribui automaticamente attrPoints e poolPoints de um NPC de forma equilibrada.
 * Só deve ser usada em NPCs (não em jogadores).
 */
export function autoAllocateNpcGrowth(ch: Character): Character {
  const cls = CLASS_BY_ID[ch.classId];
  const primary: StatKey = cls?.primary ?? "atk";

  const ATTR_ROTATION: Record<string, StatKey[]> = {
    atk: ["atk", "hp", "def"],
    atkMgc: ["atkMgc", "mp", "int"],
    int: ["int", "mp", "atkMgc"],
    def: ["def", "hp", "res"],
    res: ["res", "hp", "def"],
    agi: ["agi", "atk", "est"],
    hp: ["hp", "def", "atk"],
    mp: ["mp", "int", "atkMgc"],
    est: ["est", "agi", "atk"],
    san: ["san", "res", "int"],
  };
  const attrOrder = ATTR_ROTATION[primary] ?? ["atk", "def", "hp"];

  const magicPrimaries = new Set<StatKey>(["atkMgc", "int", "mp"]);
  const poolOrder: StatKey[] = magicPrimaries.has(primary)
    ? ["mp", "hp", "est"]
    : ["hp", "est", "mp"];

  let attrPoints = ch.attrPoints ?? 0;
  let poolPoints = ch.poolPoints ?? 0;
  const allocated: Partial<Stats> = { ...(ch.allocated ?? {}) };
  let attrIdx = 0;
  let poolIdx = 0;

  while (attrPoints > 0) {
    const key = attrOrder[attrIdx % attrOrder.length];
    allocated[key] = (allocated[key] ?? 0) + 1;
    attrPoints -= 1;
    attrIdx += 1;
  }

  while (poolPoints > 0) {
    const key = poolOrder[poolIdx % poolOrder.length];
    allocated[key] = (allocated[key] ?? 0) + 1;
    poolPoints -= 1;
    poolIdx += 1;
  }

  const next: Character = {
    ...ch,
    attrPoints: 0,
    poolPoints: 0,
    allocated,
  };
  const s = finalStats(next);
  const prev = finalStats(ch);
  next.current = {
    ...next.current,
    hp: Math.max(
      next.current.hp,
      Math.min(s.hp, next.current.hp + Math.max(0, s.hp - prev.hp)),
    ),
    mp: s.mp,
    est: s.est,
    san: s.san,
  };
  return next;
}
