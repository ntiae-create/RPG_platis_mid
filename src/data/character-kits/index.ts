import type { Character } from "@/data/types";
import type { CharacterKit } from "./types";
import { normalizeCharName } from "./types";
import { hilakKit } from "./hilak";
import { brasaoLevelFromXp } from "@/data/progression";

/** Todos os kits registrados */
export const CHARACTER_KITS: CharacterKit[] = [hilakKit];

export function getCharacterKit(ch: Pick<Character, "name" | "id">): CharacterKit | null {
  const n = normalizeCharName(ch.name);
  return CHARACTER_KITS.find((k) => k.matchName === n) ?? null;
}

/** Nível de brasão efetivo do personagem (0–8) */
export function characterBrasaoLevel(ch: Pick<Character, "brasaoXp" | "level">): number {
  return brasaoLevelFromXp(ch.brasaoXp ?? 0).level;
}

export function getKitSkill(
  ch: Pick<Character, "name" | "id" | "level" | "brasaoXp">,
  skillId: string,
) {
  const kit = getCharacterKit(ch);
  if (!kit) return null;
  const skill = kit.skills.find((s) => s.id === skillId || s.name === skillId);
  if (!skill) return null;
  // brasaoLevel = nível do BRASÃO (brasaoXp), não o level de personagem
  if (skill.brasaoLevel != null && characterBrasaoLevel(ch) < skill.brasaoLevel) {
    return null;
  }
  return { kit, skill };
}

export * from "./types";
export { hilakKit };
