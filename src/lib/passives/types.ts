import type { Character, Stats } from "@/data/types";

export type PassiveOrigin = "race" | "class" | "personal" | "character";

export type PassiveTrigger =
  | "combat_start"
  | "turn_start"
  | "before_attack_stats"
  | "on_hit"
  | "on_miss"
  | "on_damage_taken"
  | "on_lethal_damage"
  | "before_status_applied"
  | "combat_end";

export type PassiveRuntimeEntry = {
  id: string;
  characterId: string;
  origin: PassiveOrigin;
  name: string;
  stacks: number;
  maxStacks: number | null;
  turnsRemaining: number | null;
  active: boolean;
  meta: Record<string, string | number | boolean>;
};

export type PassiveCombatState = {
  entries: PassiveRuntimeEntry[];
};

export type StatMods = Partial<Stats> & {
  damageDealtMult?: number;
  damageTakenMult?: number;
};

export type PassiveContext = {
  self: Character;
  opponent?: Character | null;
  maxHp: number;
  kind?: "physical" | "magical";
  allyNearby?: boolean;
  naturalTerrain?: boolean;
  fromStealth?: boolean;
  state: PassiveCombatState;
};

export type PassiveVisual = {
  id: string;
  name: string;
  origin: PassiveOrigin;
  active: boolean;
  detail: string;
  stacks?: number;
  maxStacks?: number;
  turnsRemaining?: number | null;
};
