import type { Character } from "@/data/types";
import type { CharacterKit } from "./types";
import { normalizeCharName } from "./types";
import { hilakKit } from "./hilak";

/** Todos os kits registrados */
export const CHARACTER_KITS: CharacterKit[] = [hilakKit];

export function getCharacterKit(ch: Pick<Character, "name" | "id">): CharacterKit | null {
  const n = normalizeCharName(ch.name);
  return CHARACTER_KITS.find((k) => k.matchName === n) ?? null;
}

export function getKitSkill(ch: Pick<Character, "name" | "id" | "level">, skillId: string) {
  const kit = getCharacterKit(ch);
  if (!kit) return null;
  const skill = kit.skills.find((s) => s.id === skillId || s.name === skillId);
  if (!skill) return null;
  if (skill.brasaoLevel && (ch.level ?? 1) < skill.brasaoLevel) return null;
  return { kit, skill };
}

export * from "./types";
export { hilakKit };
