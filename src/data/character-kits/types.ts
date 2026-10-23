/**
 * Kits de personagem — habilidades e passiva exclusivas por id/nome.
 * Nunca compartilhadas entre personagens.
 */
import type { Character, SkillAffinity, SkillType } from "@/data/types";
import type { PassiveCombatState } from "@/lib/passives/types";

export type KitSkillDef = {
  /** id estável dentro do kit */
  id: string;
  name: string;
  type: SkillType;
  affinity: SkillAffinity;
  /** skill de brasão — exige level mínimo */
  brasaoLevel?: number;
  cost: { hp: number; mp: number; est: number };
  target: "unico" | "area";
  range: number;
  duration: number;
  cooldown: number;
  description: string;
};

export type KitResolveContext = {
  attacker: Character;
  /** aliados (personagens jogáveis/NPC aliados no combate) */
  allyIds: string[];
  /** inimigos (combatEnemies ids) */
  enemyIds: string[];
  defenderId: string | null;
  passiveState: PassiveCombatState;
  /** aplica status no alvo */
  applyStatus: (
    effectId: string,
    targetId: string,
    options?: { stacks?: number; duration?: number | null; power?: number; sourceId?: string },
  ) => void;
  /** dano direto a inimigo */
  damageEnemy: (enemyId: string, amount: number) => void;
  /** cura personagem aliado */
  healAlly: (allyId: string, amount: number) => void;
  log: (text: string) => void;
  rollDie: (sides: number) => number;
};

export type CharacterKit = {
  /** match estável — nome normalizado */
  matchName: string;
  displayName: string;
  personalPassive: {
    id: string;
    name: string;
    description: string;
  };
  skills: KitSkillDef[];
  onCombatStart?: (ctx: {
    self: Character;
    allyIds: string[];
    passiveState: PassiveCombatState;
    applyStatus: KitResolveContext["applyStatus"];
    log: (text: string) => void;
  }) => void;
  /** chamado no fim do turno N da passiva (ex.: após 3 turnos de imunidade) */
  onPassiveTurn?: (ctx: {
    self: Character;
    allyIds: string[];
    turnInCombat: number;
    passiveState: PassiveCombatState;
    applyStatus: KitResolveContext["applyStatus"];
    log: (text: string) => void;
  }) => void;
  resolveSkill: (skillId: string, ctx: KitResolveContext) => void;
};

export function normalizeCharName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase();
}
