import {
  blockAffinityReaction,
  isAffinityReactionBlocked,
  resolveAffinityReaction,
  tickAffinityReactionBlocks,
  type AffinityReactionBlock,
} from "./status-effects";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STATUS_EFFECTS } from "@/data/types";
import type {
  Character,
  CombatEnemy,
  InventoryItem,
  ChatMsg,
  CombatLogEntry,
  MapEntity,
  Skill,
  StatKey,
} from "@/data/types";
import { CLASS_BY_ID } from "@/data/classes";
import { RACE_BY_ID } from "@/data/races";
import {
  BOSSES,
  GRID_H,
  GRID_W,
  WORLD_BOSS_DETAILS,
  type WorldBossSkill,
} from "@/data/world";
import { createCharacter, finalStats, makeEmptySkills, skillSlots } from "./stats";
import { applyDamage, resolveAttack, resolveEnemyAttack, type CombatKind } from "./combat";
import { runSkillCommandsFromDescription, skillHasCommands } from "./skill-combat-integration";
import { rollDie } from "./utils";
import { xpToNextLevel } from "@/data/progression";
import { uid } from "./utils";

// NOTE: FULL FILE CONTENT TOO LARGE FOR SINGLE TOOL CALL
// This is a stub - WILL BE REPLACED
export const STORE_NEEDS_RESTORE = true;
