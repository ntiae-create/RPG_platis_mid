import {
  emptyWendigoMeta,
  resolveWendigoSkill,
  wendigoAbsorbShield,
  wendigoOnTurnAdvance,
  wendigoEstCostMultiplier,
  wendigoBlocksHeal,
  type WendigoMeta,
  emptyTsuchigumoMeta,
  resolveTsuchigumoSkill,
  tsuchiOnTurnAdvance,
  type TsuchigumoMeta,
  emptyCamazotzMeta,
  resolveCamazotzSkill,
  camazotzOnTurnAdvance,
  camazotzPlayerHealMult,
  type CamazotzMeta,
  emptyAmmitMeta,
  resolveAmmitSkill,
  ammitOnTurnAdvance,
  ammitRegisterHitTaken,
  ammitIncomingDamageMult,
  addWeight as ammitAddWeight,
  type AmmitMeta,
  emptyFenrirMeta,
  resolveFenrirSkill,
  fenrirOnTurnAdvance,
  fenrirWeakenGleipnir,
  fenrirAddFury,
  type FenrirMeta,
  emptyRaijuMeta,
  resolveRaijuSkill,
  raijuOnTurnAdvance,
  raijuMeleeReflect,
  raijuBlocksHeal,
  type RaijuMeta,
  emptyJormungandrMeta,
  resolveJormungandrSkill,
  jormungandrOnTurnAdvance,
  jormungandrPhysicalDamageTakenMult,
  type JormungandrMeta,
  emptyRatatoskrMeta,
  resolveRatatoskrSkill,
  ratatoskrOnTurnAdvance,
  ratatoskrFellTree,
  type RatatoskrMeta,
  emptyEikthyrnirMeta,
  resolveEikthyrnirSkill,
  eikthyrnirOnTurnAdvance,
  eikthyrnirOnDamaged,
  eikthyrnirApplyIncomingDamage,
  type EikthyrnirMeta,
  emptyHatiSkollMeta,
  createDuoHatiSkollMeta,
  twinApplyDamage,
  twinDisplayCurrent,
  twinActionOrder,
  twinBothDefeated,
  twinPickDamageTarget,
  resolveHatiSkill,
  resolveSkollSkill,
  hatiSkollOnTurnAdvance,
  twinOnBrotherFallen,
  type HatiSkollMeta,
  emptyHraesvelgrMeta,
  resolveHraesvelgrSkill,
  hraesvelgrOnTurnAdvance,
  hraesvelgrBlocksMelee,
  type HraesvelgrMeta,
} from "@/data/world-boss-kits";
import { getCharacterKit, getKitSkill } from "@/data/character-kits";
import { rollDie } from "@/lib/utils";
import { parseSkillCommands, normalizeSkillPercent } from "./skill-command-runtime";
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
import type { StatusEffectInstance } from "@/data/types";
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
import {
  emptyPassiveState,
  raceCombatStart,
  classBufaoCombatStart,
  classCronomanteTryRewind,
  classArtificeSetProject,
  classGladiadorSetAdversary,
  classCavaleiroArmInvestida,
  classMarioneteShareToLinked,
  classDomadorShareDamage,
  classPaladinoShareDamage,
  classFeiticeiroOnSkill,
  classRoninOnTurnStart,
  classEspadachimOnTurn,
  classCavaleiroCelesteCombatStart,
  classOraculoCombatStart,
  classElementalistaOnSkill,
  classAlquimistaSombrioOnSkill,
  classBruxoOnSkill,
  classCeifadorOnKill,
  classClerigoOnSupport,
  classBufferHealerOnSupport,
  classBardoOnSupport,
  classNecromanteOnKill,
  classMagoOnSkill,
  classBufaoOnTurn,
  raceAfterDamageTaken,
  raceHealReceivedMult,
  raceTurnStartHeal,
  tickPassiveDurations,
  isAllyNearby,
  raceOrcCombatStart,
  raceDoppelOnTurn,
  raceVampireOnSkill,
  raceAdaptStatusDuration,
  raceOnNegativeStatus,
  raceKitsuneOnAttackTurn,
  raceHomunculusTryReactivate,
  raceKitsuneJokerExtraStack,
  raceDoppelMirrorTurnReset,
  raceDoppelMirrorAbsorb,
  raceDoppelRoninDamageMult,
  raceDesperationStatMult,
  raceDoppelCheckDesperation,
  raceKitsuneCheckDesperation,
  raceKitsuneOnDamageTaken,
  raceUmbralOnArenaEnter,
  raceFaeOnNegativeStatus,
  raceUmbralCheckForm,
  raceIsUntargetable,
  raceDoppelAssimilate,
  raceDoppelTryRestore,
  raceDoppelCanAssimilate,
  isNaturalTerrain,
  raceVampireLifestealMult,
  classTankAllyDefBonus,
  classGuerreiroSetStance,
  classMarioneteSetLink,
  classDomadorSetBond,
  classPaladinoCombatStart,
  registerLazuliHit,
  computeTankShare,
  type PassiveCombatState,
} from "./passives";
import { xpToNextLevel } from "@/data/progression";
import { uid } from "./utils";

export type Role = "jogador" | "mestre";

export type WorldBossCooldown = {
  skillName: string;
  remaining: number;
};

export type WorldBossEffect = {
  id: string;
  name: string;
  stacks: number;
  duration: number | null;
  source: "boss" | "player" | "system";
  targetId: string;
  damageValues?: number[];
};

export type WorldBossCombatState = {
  bossId: string;
  level: number;
  current: {
    hp: number;
    mp: number;
    est: number;
    san: number;
  };
  turnOrder: string[];
  turnIndex: number;
  round: number;
  targetId: string | null;
  effects: WorldBossEffect[];
  cooldowns: WorldBossCooldown[];
  affinityReactionBlocks: AffinityReactionBlock[];
  /** Kit Wendigo (só bossId === wendigo) */
  wendigoMeta?: WendigoMeta;
  tsuchigumoMeta?: TsuchigumoMeta;
  camazotzMeta?: CamazotzMeta;
  ammitMeta?: AmmitMeta;
  fenrirMeta?: FenrirMeta;
  raijuMeta?: RaijuMeta;
  jormungandrMeta?: JormungandrMeta;
  ratatoskrMeta?: RatatoskrMeta;
  eikthyrnirMeta?: EikthyrnirMeta;
  hatiSkollMeta?: HatiSkollMeta;
  hraesvelgrMeta?: HraesvelgrMeta;
};
export type MesaTab =
  | "personagem"
  | "mapa"
  | "combate"
  | "config-combate"
  | "habilidades"
  | "inventario"
  | "mundo"
  | "mesa";

export type LayerFrame = { x: number; y: number };

export type MasterEventType =
  | "cte"
  | "emboscada"
  | "escolha"
  | "puzzle"
  | "teste"
  | "narrativo";

export type MasterEventStatus =
  | "rascunho"
  | "ativo"
  | "resolvido"
  | "cancelado";

export type MasterEventCteStatus =
  | "aguardando"
  | "executado";

export type MasterEventCteResult =
  | "sucesso"
  | "falha";

export type MasterEventTarget =
  | "todos"
  | "jogadores"
  | "especificos";

export type MasterEventChoice = {
  id: string;
  label: string;
  consequence?: string;
};

export type MasterEventEncounter = {
  name: string;
  description: string;
  level?: number;
  quantity?: number;
};

export type MasterEventTrap = {
  name: string;
  description: string;
  difficulty?: number;
  trigger?: "manual" | "entrada" | "movimento";
};

export type MasterEventReward = {
  xp?: number;
  brasao?: number;
  bronze?: number;
  silver?: number;
  gold?: number;
  platinum?: number;
  itemIds?: string[];
};

export type QuestStatus = "rascunho" | "publicada" | "concluida" | "cancelada";
export type Quest = {
  id: string;
  title: string;
  description: string;
  objective: string;
  difficulty: string;
  status: QuestStatus;
  createdAt: number;
  completedAt?: number;
  reward: { xp?: number; brasao?: number; bronze?: number; silver?: number; gold?: number; platinum?: number };
  participations: { characterId: string; status: "aceita" | "recusada" | "concluida"; acceptedAt?: number; rewardedAt?: number; rewardSnapshot?: { xp?: number; brasao?: number; bronze?: number; silver?: number; gold?: number; platinum?: number } }[];
};

export type MasterEvent = {
  id: string;
  type: MasterEventType;
  title: string;
  description: string;
  status: MasterEventStatus;
  createdAt: number;

  target: MasterEventTarget;
  targetCharacterIds: string[];

  timerMs?: number;

  cteStatus?: MasterEventCteStatus;
  cteResult?: MasterEventCteResult;
  cteExecutedAt?: number;


  choices?: MasterEventChoice[];

  puzzleAnswer?: string;

  testAttribute?: string;
  testDifficulty?: number;

  encounter?: MasterEventEncounter;

  trap?: MasterEventTrap;

  reward?: MasterEventReward;
};

type AppState = {
  version: number;
  role: Role | null;
  selfId: string | null;
  characters: Record<string, Character>;
  npcs: Record<string, Character>;
  shopCatalog: InventoryItem[];
  combatNpcIds: string[];
  slots: (string | null)[];
  masterId: string | null;
  movementLocked: boolean;
  showGrid: boolean;
  worldMapView: "map" | "globe";
  continentId: string | null;
  layer: number;
  layers: LayerFrame[];
  viewX: number;
  viewY: number;
  explored: Record<string, string[]>;
  entities: MapEntity[];
  hiddenEntities: string[];
  combatActive: boolean;
  combatMode: "normal" | "world-boss";
  combatParticipants: string[];
  combatXpParticipants: string[];
  combatPositions: Record<string, { x: number; y: number }>;
  allowBossEscape: boolean;
  attackerId: string | null;
  defenderId: string | null;
  combatEnemies: Record<string, CombatEnemy>;
  combatStatusEffects: StatusEffectInstance[];
  combatPassiveState: PassiveCombatState;
  combatArena: string | null;
  worldBossCombat: WorldBossCombatState | null;
  worldBossId: string | null;
  combatOrder: string[];
  combatTurnIndex: number;
  combatRound: number;
  combatLog: CombatLogEntry[];
  lastRoll: {
    sides: number;
    value: number;
    attacker: number;
    defender: number;
    label: string;
  } | null;
  pendingCounter: { defenderId: string; attackerId: string } | null;
  combatXpAward: number;
  chat: ChatMsg[];
  tab: MesaTab;
  trap: { cell: string; remaining: number; armed: boolean } | null;
  masterEvents: MasterEvent[];
  createQuest: (quest: Quest) => void;
  updateQuest: (id: string, updates: Partial<Quest>) => void;
  respondToQuest: (questId: string, characterId: string, accept: boolean) => void;
  completeQuest: (questId: string, characterId: string) => void;
  quests: Quest[];
  syncQuests: (quests: Quest[]) => void;
  activeMasterEventId: string | null;

  setRole: (role: Role) => void;
  setTab: (tab: MesaTab) => void;
  createMasterEvent: (event: MasterEvent) => void;
  activateMasterEvent: (id: string) => void;
  resolveMasterEvent: (id: string) => void;
  cancelMasterEvent: (id: string) => void;
  respondToCte: (id: string, result: "sucesso" | "falha") => void;
  clearActiveMasterEvent: () => void;
  addCharacter: (ch: Character, asSelf?: boolean) => void;
  createNpc: (npc: Character) => void;
  addNpcToCombat: (npcId: string) => void;
  addNpcAsEnemy: (npcId: string) => void;
  updateNpc: (id: string, patch: Partial<Character>) => void;
  removeNpc: (id: string) => void;
  grantNpcXp: (id: string, amount: number) => void;
  publishCharacterAsNpc: (characterId: string) => void;
  setActiveMasterCharacter: (characterId: string) => void;
  removeCharacter: (characterId: string) => void;
  updateSelf: (patch: Partial<Character>) => void;
  patchCharacter: (id: string, patch: Partial<Character>) => void;
  seedDemo: () => void;
  resetAll: () => void;

  submitSkill: (slot: number, skill: Omit<Skill, "id" | "slot" | "status">) => void;
  masterSkill: (
    characterId: string,
    skillId: string,
    action: "approve" | "reject" | "edit",
    edit?: Partial<Skill>,
  ) => void;
  setPersonalPassive: (name: string, description: string) => void;

  grantXp: (characterId: string, amount: number) => void;
  grantBrasaoXp: (characterId: string, amount: number) => void;
  completeQuestAndReward: (questId: string) => string[];
  spendAttr: (key: StatKey, pool?: boolean) => void;
  unlockRace: (characterId: string, raceId: string) => void;

  setWorldMapView: (view: "map" | "globe") => void;
  openContinent: (id: string) => void;
  closeContinent: () => void;
  zoomIntoCell: (x: number, y: number) => void;
  zoomOut: () => void;
  panTo: (x: number, y: number) => void;
  moveSelf: (dx: number, dy: number) => void;
  teleport: (characterId: string, x: number, y: number) => void;
  toggleGrid: () => void;
  toggleLock: () => void;
  toggleHidden: (id: string) => void;
  addEntity: (e: Omit<MapEntity, "id">) => void;
  centerOn: (characterId: string) => void;

  selectFighter: (which: "attacker" | "defender", id: string | null) => void;
  toggleCombatParticipant: (id: string) => void;
  moveCombatParticipant: (id: string, x: number, y: number) => void;
  setAllowBossEscape: (value: boolean) => void;
  startCombat: () => void;
  setCombatArena: (arenaId: string) => void;
  setWarriorStance: (characterId: string, stance: "ofensiva" | "defensiva" | "mobilidade") => void;
  armCavaleiroInvestida: (characterId: string) => void;
  setGladiadorAdversary: (characterId: string, targetId: string) => void;
  setArtificeProject: (characterId: string, tier: 1 | 2 | 3) => void;
  tryCronomanteRewind: (characterId: string, targetId: string) => void;
  setPaladinoOath: (characterId: string, allyId: string) => void;
  setDomadorBond: (characterId: string, creatureId: string) => void;
  setMarioneteLink: (characterId: string, linkedId: string) => void;
  assimilateTarget: (doppelId: string, targetId: string) => void;
  startWorldBossCombat: (bossId: string, level: number) => void;
  worldBossAttack: (characterId: string) => void;
  worldBossMasterAction: (skillName: string | null, targetId: string) => void;
  nextWorldBossTurn: (skillName?: string | null, targetId?: string) => void;
  nextTurn: () => void;
  endCombat: () => void;
  applyCombatStatusEffect: (effectId: string, targetId: string, options?: { sourceId?: string; stacks?: number; duration?: number | null; power?: number }) => boolean;
  removeCombatStatusEffect: (effectId: string, targetId: string) => void;
  clearCombatStatusEffects: () => void;
  addCombatEnemy: (enemy: Omit<CombatEnemy, "id">) => void;
  setWorldBoss: (id: string | null) => void;
  removeCombatEnemy: (id: string) => void;
  removeCombatEnemySkill: (enemyId: string, skillId: string) => void;
  updateCombatEnemySkill: (
    enemyId: string,
    skillId: string,
    patch: Partial<Skill>,
  ) => void;
  clearCombatLog: () => void;
  rollCombat: (kind: CombatKind, skillId?: string) => void;
  attemptEscape: (characterId: string) => void;
  resolveCounter: (mode: "attack" | "defend") => void;
  rollLoose: (sides: number) => void;
  setCombatXpAward: (n: number) => void;
  awardCombatXp: () => void;

  sendChat: (text: string) => void;
  buyMysteryBox: () => void;
  equipItem: (itemId: string) => void;
  equipItemFor: (characterId: string, itemId: string) => void;
  unequipItemFor: (characterId: string, slot: "arma" | "armadura" | "botas" | "reliquia" | "colar") => void;
  useItemFor: (characterId: string, itemId: string) => void;
  restoreVitals: (characterId: string) => void;
  unequipItem: (slot: "arma" | "armadura" | "botas" | "reliquia" | "colar") => void;
  discardItem: (itemId: string) => void;
  useItem: (itemId: string) => void;
  grantItem: (characterId: string, item: InventoryItem) => void;
  addShopListing: (item: InventoryItem) => void;
  removeShopListing: (itemId: string) => void;
  buyFromShop: (characterId: string, itemId: string) => boolean;
  grantCurrency: (characterId: string, amount: { bronze?: number; silver?: number; gold?: number; platinum?: number }) => void;
  disarmTrap: () => void;
};

const SAVE_VERSION = 1;

const persistStorage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return localStorage;
});

function empty(): Pick<
  AppState,
  | "version"
  | "role"
  | "selfId"
  | "characters"
  | "npcs"
  | "shopCatalog"
  | "combatNpcIds"
  | "slots"
  | "masterId"
  | "movementLocked"
  | "showGrid"
  | "worldMapView"
  | "continentId"
  | "layer"
  | "layers"
  | "viewX"
  | "viewY"
  | "explored"
  | "entities"
  | "hiddenEntities"
  | "combatActive"
  | "combatMode"
  | "combatParticipants"
  | "combatXpParticipants"
  | "combatPositions"
  | "allowBossEscape"
  | "combatOrder"
  | "combatTurnIndex"
  | "combatRound"
  | "attackerId"
  | "combatEnemies"
  | "combatStatusEffects"
  | "combatPassiveState"
  | "combatArena"
  | "worldBossId"
  | "worldBossCombat"
  | "defenderId"
  | "combatLog"
  | "lastRoll"
  | "pendingCounter"
  | "combatXpAward"
  | "chat"
  | "tab"
  | "trap"
  | "masterEvents"
  | "activeMasterEventId"
  | "quests"
> {
  return {
    version: SAVE_VERSION,
    role: null,
    selfId: null,
    characters: {},
    npcs: {},
    shopCatalog: [],
    combatNpcIds: [],
    slots: Array.from({ length: 8 }, () => null),
    masterId: null,
    movementLocked: false,
    showGrid: true,
    worldMapView: "map",
    continentId: null,
    layer: 0,
    layers: [],
    viewX: 990,
    viewY: 1490,
    explored: {},
    entities: [],
    hiddenEntities: [],
    combatActive: false,
    combatMode: "normal",
    combatParticipants: [],
    combatXpParticipants: [],
    combatPositions: {},
    allowBossEscape: false,
    attackerId: null,
    combatEnemies: {},
    combatStatusEffects: [],
    combatPassiveState: emptyPassiveState(),
    combatArena: null,
    worldBossId: null,
    worldBossCombat: null,
    defenderId: null,
    combatOrder: [],
    combatTurnIndex: 0,
    combatRound: 0,
    combatLog: [],
    lastRoll: null,
    pendingCounter: null,
    combatXpAward: 50,
    chat: [],
    tab: "personagem",
    trap: null,
    masterEvents: [],
    quests: [],
    activeMasterEventId: null,
  };
}

function demoParty(): Character[] {
  const kael = createCharacter({
    name: "Kael Vard",
    raceId: "humano",
    classId: "guerreiro",
    affinityId: "fogo",
  });
  kael.isDemo = true;
  kael.position = { continentId: "platis", layer: 0, x: 1002, y: 1500 };
  kael.skills[0] = {
    ...kael.skills[0],
    name: "Corte Ardente",
    description: "Golpe em arco que deixa brasa no ferro.",
    type: "ataque",
    cost: { hp: 0, mp: 0, est: 4 },
    status: "approved",
  };

  const lyra = createCharacter({
    name: "Lyra Quel",
    raceId: "elfo",
    classId: "mago",
    affinityId: "luz",
  });
  lyra.isDemo = true;
  lyra.position = { continentId: "platis", layer: 0, x: 998, y: 1501 };
  lyra.skills[0] = {
    ...lyra.skills[0],
    name: "Octagrama Menor",
    description: "Selo de luz que fere e marca.",
    type: "ataque-magico",
    cost: { hp: 0, mp: 8, est: 0 },
    status: "approved",
  };

  const rusk = createCharacter({
    name: "Rusk",
    raceId: "besta",
    classId: "berserk",
    affinityId: "fisico",
  });
  rusk.isDemo = true;
  rusk.position = { continentId: "platis", layer: 0, x: 1001, y: 1498 };
  rusk.skills[0] = {
    ...rusk.skills[0],
    name: "Dilacerar",
    description: "Investida em linha reta.",
    type: "ataque",
    cost: { hp: 0, mp: 0, est: 5 },
    status: "approved",
  };

  return [kael, lyra, rusk];
}

function bossEntities(): MapEntity[] {
  return BOSSES.map((b) => ({
    id: `boss-${b.id}`,
    kind: "boss" as const,
    name: b.name,
    continentId: b.continentId,
    layer: 0,
    x: 400 + (hash(b.id) % 1200),
    y: 500 + (hash(b.id + "y") % 2000),
    hp: 120 + b.bonusPct,
    hpMax: 120 + b.bonusPct,
  }));
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function exploreKey(characterId: string, continentId: string, layer: number) {
  return `${characterId}:${continentId}:${layer}`;
}

function addWorldBossEffect(
  effects: WorldBossEffect[],
  effect: Omit<WorldBossEffect, "stacks"> & { stacks?: number },
): WorldBossEffect[] {
  const existing = effects.find(
    (item) =>
      item.id === effect.id &&
      item.targetId === effect.targetId,
  );

  const maxStacks = STATUS_EFFECTS[effect.id]?.maxStacks;

  if (existing) {
    const nextStacks = existing.stacks + (effect.stacks ?? 1);

    return effects.map((item) =>
      item === existing
        ? {
            ...item,
            stacks:
              maxStacks !== undefined
                ? Math.min(maxStacks, nextStacks)
                : nextStacks,
            duration: effect.duration,
          }
        : item,
    );
  }

  const initialStacks = effect.stacks ?? 1;

  return [
    ...effects,
    {
      ...effect,
      stacks:
        maxStacks !== undefined
          ? Math.min(maxStacks, initialStacks)
          : initialStacks,
    },
  ];
}

function tickWorldBossEffects(
  effects: WorldBossEffect[],
): WorldBossEffect[] {
  return effects
    .map((effect) =>
      effect.duration === null
        ? effect
        : {
            ...effect,
            duration: Math.max(0, effect.duration - 1),
          },
    )
    .filter(
      (effect) =>
        effect.duration === null || effect.duration > 0,
    );
}

function removeWorldBossEffect(
  effects: WorldBossEffect[],
  effectId: string,
  targetId: string,
  stacks = 1,
): WorldBossEffect[] {
  return effects
    .map((effect) => {
      if (effect.id !== effectId || effect.targetId !== targetId) {
        return effect;
      }

      return {
        ...effect,
        stacks: Math.max(0, effect.stacks - stacks),
      };
    })
    .filter(
      (effect) =>
        effect.stacks > 0 ||
        effect.id !== effectId ||
        effect.targetId !== targetId,
    );
}

function hasWorldBossEffect(
  effects: WorldBossEffect[],
  effectId: string,
  targetId: string,
): boolean {
  return effects.some(
    (effect) =>
      effect.id === effectId &&
      effect.targetId === targetId &&
      effect.stacks > 0,
  );
}

function initializeWorldBossEffects(
  bossId: string,
): WorldBossEffect[] {
  const effects: WorldBossEffect[] = [];

  switch (bossId) {
    default:
      return effects;
  }
}

function getWorldBossAvailableSkills(
  bossId: string,
  level: number,
) {
  const boss = WORLD_BOSS_DETAILS.find(
    (entry) => entry.id === bossId,
  );

  if (!boss) return [];

  return boss.skills.filter(
    (skill) =>
      !skill.ultimate &&
      (!skill.unlockLevel || level >= skill.unlockLevel),
  );
}

function getWorldBossCooldown(
  cooldowns: WorldBossCooldown[],
  skillName: string,
): number {
  return (
    cooldowns.find((cooldown) => cooldown.skillName === skillName)
      ?.remaining ?? 0
  );
}

function setWorldBossCooldown(
  cooldowns: WorldBossCooldown[],
  skillName: string,
  turns = 1,
): WorldBossCooldown[] {
  const existing = cooldowns.some(
    (cooldown) => cooldown.skillName === skillName,
  );

  if (existing) {
    return cooldowns.map((cooldown) =>
      cooldown.skillName === skillName
        ? { ...cooldown, remaining: turns }
        : cooldown,
    );
  }

  return [
    ...cooldowns,
    {
      skillName,
      remaining: turns,
    },
  ];
}

function tickWorldBossCooldowns(
  cooldowns: WorldBossCooldown[],
): WorldBossCooldown[] {
  return cooldowns
    .map((cooldown) => ({
      ...cooldown,
      remaining: Math.max(0, cooldown.remaining - 1),
    }))
    .filter((cooldown) => cooldown.remaining > 0);
}

function chooseWorldBossSkill(
  bossId: string,
  level: number,
  cooldowns: WorldBossCooldown[],
  requestedSkillName?: string,
): WorldBossSkill | null {
  const available = getWorldBossAvailableSkills(bossId, level).filter(
    (skill) => getWorldBossCooldown(cooldowns, skill.name) === 0,
  );

  if (requestedSkillName) {
    return available.find((skill) => skill.name === requestedSkillName) ?? null;
  }

  if (available.length === 0) return null;

  return available[Math.floor(Math.random() * available.length)] ?? null;
}

function canUseWorldBossSkill(
  skill: WorldBossSkill,
  cooldowns: WorldBossCooldown[],
): boolean {
  return getWorldBossCooldown(cooldowns, skill.name) === 0;
}

function getWorldBossSkillCooldown(
  level: number,
  skill: WorldBossSkill,
): number {
  if (skill.ultimate) return 0;

  if (level >= 400) return 6;
  if (level >= 300) return 5;
  if (level >= 200) return 4;
  if (level >= 100) return 3;
  return 2;
}

function executeWorldBossSkill(
  combat: WorldBossCombatState,
  requestedSkillName?: string,
): {
  skill: WorldBossSkill;
  cooldowns: WorldBossCooldown[];
} | null {
  const skill = chooseWorldBossSkill(
    combat.bossId,
    combat.level,
    combat.cooldowns,
    requestedSkillName,
  );

  if (!skill || !canUseWorldBossSkill(skill, combat.cooldowns)) {
    return null;
  }

  const cooldowns = setWorldBossCooldown(
    combat.cooldowns,
    skill.name,
    getWorldBossSkillCooldown(combat.level, skill),
  );

  return {
    skill,
    cooldowns,
  };
}

function applyCharacterXpProgression(
  character: Character,
  amount: number,
): { next: Character; gained: number } {
  let xp = character.xp + amount;
  const next = { ...character, xp };
  let gained = 0;
  const maxLevel = next.isMaster ? 999 : 150;

  while (next.level < maxLevel && xp >= xpToNextLevel(next.level)) {
    xp -= xpToNextLevel(next.level);
    next.level += 1;
    next.attrPoints += 3;
    next.allocated = {
      ...next.allocated,
      san: (next.allocated.san ?? 0) + 2,
    };
    if (next.level % 5 === 0) next.poolPoints += 8;
    gained += 1;
  }

  next.xp = xp;
  const stats = finalStats(next);
  next.current = { ...next.current, san: stats.san };

  return { next, gained };
}

export const usePlatis = create<AppState>()(
  persist(
    (set, get) => ({
      ...empty(),

      createNpc: (npc) => set((s) => ({
        npcs: { ...s.npcs, [npc.id]: npc },
      })),

      addNpcToCombat: (npcId) => set((s) => {
        if (s.combatMode === "world-boss") return s;
        const npc = s.npcs[npcId];
        if (!npc || npc.current.hp <= 0) return s;
        const alreadyIncluded = s.combatParticipants.includes(npcId);
        const existingCharacter = s.characters[npcId];
        const characters = existingCharacter
          ? s.characters
          : { ...s.characters, [npcId]: { ...npc, isMaster: false } };
        const combatNpcIds = existingCharacter
          ? s.combatNpcIds
          : [...new Set([...s.combatNpcIds, npcId])];
        const combatParticipants = alreadyIncluded
          ? s.combatParticipants
          : [...s.combatParticipants, npcId];
        const combatPositions = {
          ...s.combatPositions,
          ...(s.combatActive && !s.combatPositions[npcId]
            ? { [npcId]: { x: 1, y: Math.min(11, 2 + combatParticipants.length * 2) } }
            : {}),
        };
        const combatOrder = s.combatActive && !s.combatOrder.includes(npcId)
          ? [...s.combatOrder, npcId]
          : s.combatOrder;
        const combatLog = alreadyIncluded ? s.combatLog : [
          ...s.combatLog,
          { id: uid("lg"), at: Date.now(), kind: "system" as const,
            text: npc.name + " foi adicionado como aliado ao combate." },
        ].slice(-80);
        return {
          characters, combatNpcIds, combatParticipants, combatPositions,
          combatOrder,
          combatXpParticipants: s.combatActive && !s.combatXpParticipants.includes(npcId)
            ? [...s.combatXpParticipants, npcId] : s.combatXpParticipants,
          combatLog,
        };
      }),
      addNpcAsEnemy: (npcId) => {
        const s = get();
        if (s.combatMode === "world-boss") return;
        const npc = s.npcs[npcId];
        if (!npc || npc.current.hp <= 0) return;
        const stats = finalStats(npc);
        const id = uid("enemy");
        const enemy = {
          id,
          name: npc.name,
          kind: "monster" as const,
          level: npc.level || 1,
          stats: { ...stats },
          current: {
            hp: npc.current.hp,
            mp: npc.current.mp,
            est: npc.current.est,
            san: npc.current.san,
          },
          skills: Array.isArray(npc.skills) ? npc.skills.map((sk) => ({ ...sk })) : [],
          image: npc.portrait || undefined,
        };
        const combatEnemies = { ...s.combatEnemies, [id]: enemy };
        let combatParticipants = s.combatParticipants;
        let combatOrder = s.combatOrder;
        let combatPositions = { ...s.combatPositions };
        if (s.combatActive && !combatParticipants.includes(id)) {
          combatParticipants = [...combatParticipants, id];
          combatOrder = [...combatOrder, id];
          combatPositions[id] = { x: 14, y: Math.min(11, 2 + Object.keys(combatEnemies).length * 2) };
        }
        set({
          combatEnemies,
          combatParticipants,
          combatOrder,
          combatPositions,
          combatLog: [{
            id: uid("lg"),
            at: Date.now(),
            kind: "system",
            text: npc.name + " entrou como INIMIGO no combate.",
          }, ...s.combatLog].slice(0, 80),
        });
      },

      updateNpc: (id, patch) => set((s) => {
        const current = s.npcs[id];
        if (!current) return s;
        return { npcs: { ...s.npcs, [id]: { ...current, ...patch, id } } };
      }),
      removeNpc: (id) => set((s) => {
        const npcs = { ...s.npcs };
        delete npcs[id];
        return { npcs };
      }),
      grantNpcXp: (id, amount) => {
        const npc = get().npcs[id];
        if (!npc || !Number.isFinite(amount) || amount <= 0) return;

        const xpAmount = Math.floor(amount);
        if (xpAmount <= 0) return;

        if (npc.npcSourceCharacterId) {
          const sourceId = npc.npcSourceCharacterId;
          if (!get().characters[sourceId]) return;

          get().grantXp(sourceId, xpAmount);

          const updatedCharacter = get().characters[sourceId];
          if (!updatedCharacter) return;

          set((s) => {
            const currentNpc = s.npcs[id];
            if (!currentNpc) return s;

            return {
              npcs: {
                ...s.npcs,
                [id]: {
                  ...currentNpc,
                  ...updatedCharacter,
                  id,
                  isMaster: currentNpc.isMaster,
                  npcSourceCharacterId: sourceId,
                },
              },
            };
          });
          return;
        }

        let gained = 0;
        let finalLevel = npc.level;

        set((s) => {
          const currentNpc = s.npcs[id];
          if (!currentNpc) return s;

          const result = applyCharacterXpProgression(currentNpc, xpAmount);
          gained = result.gained;
          finalLevel = result.next.level;

          return {
            npcs: {
              ...s.npcs,
              [id]: result.next,
            },
          };
        });

        if (gained > 0) {
          set((s) => ({
            combatLog: [{
              id: uid("lg"),
              at: Date.now(),
              kind: "xp" as const,
              text: `${npc.name} sobe ${gained} nível(is) → Nv. ${finalLevel}.`,
            }, ...s.combatLog].slice(0, 80),
          }));
        }
      },
      publishCharacterAsNpc: (characterId) => set((s) => {
        const character = s.characters[characterId];
        if (!character || !character.isMaster) return s;
        return {
          npcs: {
            ...s.npcs,
            [characterId]: { ...character, isMaster: false, npcSourceCharacterId: characterId },
          },
        };
      }),

      setRole: (role) => set({ role, tab: role === "mestre" ? "mesa" : "personagem" }),
      setTab: (tab) => set({ tab }),

      syncQuests: (quests) => set({ quests }),
      createQuest: (quest) =>
        set((s) => ({ quests: [...s.quests, quest] })),
      updateQuest: (id, updates) =>
        set((s) => ({ quests: s.quests.map((q) => q.id === id ? { ...q, ...updates } : q) })),
      respondToQuest: (questId, characterId, accept) =>
        set((s) => ({ quests: s.quests.map((q) => {
          if (q.id !== questId || q.status !== "publicada") return q;
          const old = q.participations.find((p) => p.characterId === characterId);
          if (old) return q;
          return { ...q, participations: [...q.participations, {
            characterId, status: accept ? "aceita" as const : "recusada" as const,
            ...(accept ? { acceptedAt: Date.now() } : {})
          }] };
        }) })),
      completeQuest: (questId, characterId) =>
        set((s) => ({ quests: s.quests.map((q) => q.id !== questId ? q : {
          ...q, participations: q.participations.map((p) =>
            p.characterId === characterId && p.status === "aceita"
              ? { ...p, status: "concluida" as const } : p)
        }) })),
      completeQuestAndReward: (questId) => {
        const state = get();
        if (state.role !== "mestre") return [];
        const quest = state.quests.find((q) => q.id === questId && q.status === "publicada");
        if (!quest) return [];
        const eligible = quest.participations.filter(
          (p) => p.status === "aceita" && !p.rewardedAt
        );
        if (eligible.length === 0) return [];
        return eligible.map((p) => p.characterId);
      },
      createMasterEvent: (event) =>
        set((s) => ({
          masterEvents: [...s.masterEvents, event],
        })),

      activateMasterEvent: (id) =>
        set((s) => ({
          masterEvents: s.masterEvents.map((event) =>
            event.id === id
              ? { ...event, status: "ativo" }
              : event,
          ),
          activeMasterEventId: id,
        })),

      resolveMasterEvent: (id) =>
        set((s) => ({
          masterEvents: s.masterEvents.map((event) =>
            event.id === id
              ? { ...event, status: "resolvido" }
              : event,
          ),
          activeMasterEventId:
            s.activeMasterEventId === id
              ? null
              : s.activeMasterEventId,
        })),

      cancelMasterEvent: (id) =>
        set((s) => ({
          masterEvents: s.masterEvents.map((event) =>
            event.id === id
              ? { ...event, status: "cancelado" }
              : event,
          ),
          activeMasterEventId:
            s.activeMasterEventId === id
              ? null
              : s.activeMasterEventId,
        })),

      respondToCte: (id, result) =>
        set((s) => ({
          masterEvents: s.masterEvents.map((event) =>
            event.id === id
              ? { ...event, cteStatus: "executado", cteResult: result, cteExecutedAt: Date.now() }
              : event,
          ),
        })),
      clearActiveMasterEvent: () =>
        set({
          activeMasterEventId: null,
        }),


      setActiveMasterCharacter: (characterId) => {
    const ch = get().characters[characterId];
    if (!ch?.isMaster) return;
    set({ masterId: characterId, selfId: characterId });
  },

  addCharacter: (ch, asSelf = true) => {
        const s = get();
        const characters = { ...s.characters, [ch.id]: ch };
        const slots = [...s.slots];
        let masterId = s.masterId;

        if (ch.isMaster) {
          masterId = ch.id;
        } else {
          const existingIdx = slots.findIndex((id) => id === ch.id);
          if (existingIdx < 0) {
            const emptyIdx = slots.findIndex((id) => id === null);
            if (emptyIdx >= 0) slots[emptyIdx] = ch.id;
          }
        }

        const entities = [
          ...s.entities.filter((e) => e.id !== ch.id),
          {
            id: ch.id,
            kind: "player" as const,
            name: ch.name,
            continentId: ch.position.continentId,
            layer: ch.position.layer,
            x: ch.position.x,
            y: ch.position.y,
            image: ch.image,
          },
        ];

        set({
          characters,
          slots,
          masterId,
          selfId: asSelf ? ch.id : s.selfId,
          entities: s.entities.length ? entities : [...bossEntities(), ...entities],
        });
      },

      removeCharacter: (characterId) => {
        const s = get();
        const characters = { ...s.characters };
        delete characters[characterId];
        const slots = s.slots.map((id) => (id === characterId ? null : id));
        const entities = s.entities.filter((e) => e.id !== characterId);
        set({
          characters,
          slots,
          entities,
          selfId: s.selfId === characterId ? null : s.selfId,
          masterId: s.masterId === characterId ? null : s.masterId,
        });
      },
      updateSelf: (patch) => {
        const id = get().selfId;
        if (!id) return;
        get().patchCharacter(id, patch);
      },

      patchCharacter: (id, patch) => {
        const ch = get().characters[id];
        if (!ch) return;
        let safePatch = patch;
        if (
          patch.current &&
          typeof patch.current.hp === "number" &&
          patch.current.hp > ch.current.hp
        ) {
          const st = get();
          if (
            st.combatMode === "world-boss" &&
            st.worldBossCombat
          ) {
            if (st.worldBossCombat.bossId === "wendigo") {
              const maxHp = finalStats(ch).hp;
              const ratio = maxHp > 0 ? ch.current.hp / maxHp : 1;
              if (wendigoBlocksHeal(ratio)) {
                safePatch = {
                  ...patch,
                  current: { ...patch.current, hp: ch.current.hp },
                };
                set({
                  combatLog: [
                    {
                      id: uid("lg"),
                      at: Date.now(),
                      kind: "system",
                      text: ch.name + ": Vazio Interior bloqueia cura (HP < 25%).",
                    },
                    ...get().combatLog,
                  ].slice(0, 80),
                });
              }
            } else if (st.worldBossCombat.bossId === "camazotz") {
              const mult = camazotzPlayerHealMult(
                st.worldBossCombat.camazotzMeta || emptyCamazotzMeta()
              );
              if (mult < 1) {
                const gained = patch.current.hp - ch.current.hp;
                const reduced = Math.floor(gained * mult);
                safePatch = {
                  ...patch,
                  current: { ...patch.current, hp: ch.current.hp + reduced },
                };
              }
            }
          }
        }
        const next = { ...ch, ...safePatch };
        const entities = get().entities.map((e) =>
          e.id === id
            ? {
                ...e,
                name: next.name,
                image: next.image,
                continentId: next.position.continentId,
                layer: next.position.layer,
                x: next.position.x,
                y: next.position.y,
              }
            : e,
        );
        const state = get();
        const linkedNpc = state.npcs[id];
        const npcs = linkedNpc?.npcSourceCharacterId === id
          ? { ...state.npcs, [id]: { ...next, isMaster: false, npcSourceCharacterId: id } }
          : state.npcs;
        set({ characters: { ...state.characters, [id]: next }, entities, npcs });
      },

      seedDemo: () => {
        const s = get();
        const party = demoParty();
        const characters = { ...s.characters };
        const slots = [...s.slots];
        const extras: MapEntity[] = [];
        party.forEach((ch) => {
          const emptyIdx = slots.findIndex((x) => x === null);
          if (emptyIdx < 0) return;
          characters[ch.id] = ch;
          slots[emptyIdx] = ch.id;
          extras.push({
            id: ch.id,
            kind: "player",
            name: ch.name,
            continentId: ch.position.continentId,
            layer: ch.position.layer,
            x: ch.position.x,
            y: ch.position.y,
            image: ch.image,
          });
        });
        const entities = [
          ...(s.entities.length ? s.entities : bossEntities()),
          ...extras.filter((e) => !s.entities.some((x) => x.id === e.id)),
        ];
        set({ characters, slots, entities });
      },

      resetAll: () => set({ ...empty() }),

      submitSkill: (slot, skill) => {
        const id = get().selfId;
        if (!id) return;
        const ch = get().characters[id];
        if (!ch) return;
        const max = skillSlots(ch.brasaoXp);
        if (slot >= max) return;
        const prev = ch.skills.find((item) => item.slot === slot);
        const nextSkill = {
          ...(prev ?? makeEmptySkills(1)[0]),
          ...skill,
          id: prev?.id ?? uid("sk"),
          slot: slot as 0 | 1 | 2 | 3,
          status: "pending" as const,
        };
        const skills = [
          ...ch.skills.filter((item) => item.slot !== slot),
          nextSkill,
        ].sort((a, b) => a.slot - b.slot);
        get().patchCharacter(id, { skills });
      },

      masterSkill: (characterId, skillId, action, edit) => {
        const ch = get().characters[characterId];
        if (!ch) return;
        const skills = ch.skills.map((sk) => {
          if (sk.id !== skillId) return sk;
          if (action === "approve") return { ...sk, ...edit, status: "approved" as const };
          if (action === "reject")
            return { ...sk, status: "rejected" as const, masterNote: edit?.masterNote };
          return { ...sk, ...edit, status: "pending" as const };
        });
        get().patchCharacter(characterId, { skills });
      },

      setPersonalPassive: (name, description) => {
        const id = get().selfId;
        if (!id) return;
        get().patchCharacter(id, {
          personalPassive: { name, description, stacks: 0 },
        });
      },

      grantXp: (characterId, amount) => {
        const ch = get().characters[characterId];
        if (!ch) return;

        const { next, gained } = applyCharacterXpProgression(ch, amount);
        get().patchCharacter(characterId, next);

        if (gained) {
          set({
            combatLog: [
              {
                id: uid("lg"),
                at: Date.now(),
                kind: "xp" as const,
                text: `${ch.name} sobe ${gained} nível(is) → Nv. ${next.level}.`,
              },
              ...get().combatLog,
            ].slice(0, 80),
          });
        }
      },

      grantBrasaoXp: (characterId, amount) => {
        const ch = get().characters[characterId];
        if (!ch) return;
        const brasaoXp = Math.max(0, ch.brasaoXp + amount);
        const skills = [...ch.skills];
        if (skillSlots(brasaoXp) === 4 && skills.length < 4) {
          skills.push({
            ...makeEmptySkills(1)[0],
            slot: 3,
          });
        }
        get().patchCharacter(characterId, { brasaoXp, skills });
      },

      spendAttr: (key, pool = false) => {
        const id = get().selfId;
        if (!id) return;
        const ch = get().characters[id];
        if (!ch) return;
        if (pool) {
          if (ch.poolPoints <= 0) return;
          if (key !== "hp" && key !== "mp" && key !== "est") return;
          const allocated = { ...ch.allocated, [key]: (ch.allocated[key] ?? 0) + 1 };
          const next = { ...ch, poolPoints: ch.poolPoints - 1, allocated };
          const s = finalStats(next);
          next.current = {
            hp: key === "hp" ? ch.current.hp + 1 : ch.current.hp,
            mp: key === "mp" ? s.mp : ch.current.mp,
            est: key === "est" ? s.est : ch.current.est,
            san: ch.current.san,
          };
          get().patchCharacter(id, next);
        } else {
          if (ch.attrPoints <= 0) return;
          const combatKeys: StatKey[] = ["atk", "atkMgc", "def", "res", "agi", "int"];
          if (!combatKeys.includes(key)) return;
          const allocated = { ...ch.allocated, [key]: (ch.allocated[key] ?? 0) + 1 };
          get().patchCharacter(id, { attrPoints: ch.attrPoints - 1, allocated });
        }
      },

      unlockRace: (characterId, raceId) => {
        const ch = get().characters[characterId];
        if (!ch) return;
        if (ch.unlockedRaces.includes(raceId)) return;
        get().patchCharacter(characterId, {
          unlockedRaces: [...ch.unlockedRaces, raceId],
        });
      },

      setWorldMapView: (view) => set({ worldMapView: view }),
      openContinent: (id) =>
        set({
          continentId: id,
          layer: 1,
          layers: [],
          viewX: 990,
          viewY: 1490,
          tab: "mapa",
        }),
      closeContinent: () => set({ continentId: null, layer: 0, layers: [] }),
      zoomIntoCell: (x, y) => {
        const s = get();
        if (s.layer >= 3 || !s.continentId) return;
        set({
          layer: s.layer + 1,
          layers: [...s.layers, { x, y }],
          viewX: 990,
          viewY: 1490,
        });
      },
      zoomOut: () => {
        const s = get();
        if (s.layer <= 1) {
          set({
            continentId: null,
            layer: 0,
            layers: [],
            viewX: 990,
            viewY: 1490,
          });
          return;
        }
        const layers = s.layers.slice(0, -1);
        const last = layers[layers.length - 1];
        set({
          layer: s.layer - 1,
          layers,
          viewX: last ? last.x - 10 : 990,
          viewY: last ? last.y - 10 : 1490,
        });
      },
      panTo: (x, y) => set({ viewX: x, viewY: y }),

      moveSelf: (dx, dy) => {
        const s = get();
        if (s.movementLocked && s.role !== "mestre") return;
        const id = s.selfId;
        if (!id) return;
        const ch = s.characters[id];
        if (!ch) return;
        if (!s.continentId) return;
        const x = Math.max(0, Math.min(GRID_W - 1, ch.position.x + dx));
        const y = Math.max(0, Math.min(GRID_H - 1, ch.position.y + dy));
        const key = exploreKey(id, s.continentId, s.layer);
        const setExplored = new Set(s.explored[key] ?? []);
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const seenX = x + ox;
            const seenY = y + oy;
            if (
              seenX >= 0 &&
              seenX < GRID_W &&
              seenY >= 0 &&
              seenY < GRID_H
            ) {
              setExplored.add(`${seenX},${seenY}`);
            }
          }
        }

        const reachedBoss = !s.combatActive
          ? s.entities.find((entity) => {
              if (
                entity.kind !== "boss" ||
                entity.continentId !== s.continentId ||
                entity.layer !== s.layer
              ) return false;

              const insideNow =
                Math.abs(entity.x - x) <= 20 &&
                Math.abs(entity.y - y) <= 20;
              const wasOutside =
                Math.abs(entity.x - ch.position.x) > 20 ||
                Math.abs(entity.y - ch.position.y) > 20;

              return insideNow && wasOutside;
            })
          : undefined;

        const trapRoll = Math.random();
        let trap = s.trap;
        if (trapRoll < 0.04 && !trap) {
          trap = { cell: `${x},${y}`, remaining: 1800, armed: true };
        }
        get().patchCharacter(id, {
          position: { ...ch.position, continentId: s.continentId, layer: s.layer, x, y },
        });

        if (reachedBoss) {
          get().startWorldBossCombat(
            reachedBoss.id.replace(/^boss-/, ""),
            12,
          );
        }

        set({
          explored: { ...s.explored, [key]: [...setExplored] },
          trap,
          worldBossId: reachedBoss
            ? reachedBoss.id.replace(/^boss-/, "")
            : s.worldBossId,
        });
      },

      teleport: (characterId, x, y) => {
        const ch = get().characters[characterId];
        if (!ch) return;
        const continentId = get().continentId ?? ch.position.continentId;
        get().patchCharacter(characterId, {
          position: { ...ch.position, continentId, layer: get().layer, x, y },
        });
        set({ viewX: x - 10, viewY: y - 10 });
      },

      toggleGrid: () => set({ showGrid: !get().showGrid }),
      toggleLock: () => set({ movementLocked: !get().movementLocked }),
      toggleHidden: (id) => {
        const hid = new Set(get().hiddenEntities);
        if (hid.has(id)) hid.delete(id);
        else hid.add(id);
        set({ hiddenEntities: [...hid] });
      },
      addEntity: (e) => set({ entities: [...get().entities, { ...e, id: uid("en") }] }),
      centerOn: (characterId) => {
        const ch = get().characters[characterId];
        if (!ch) return;
        set({
          continentId: ch.position.continentId,
          layer: ch.position.layer,
          viewX: ch.position.x - 10,
          viewY: ch.position.y - 10,
          tab: "mapa",
        });
      },

      toggleCombatParticipant: (id) => {
        const participants = get().combatParticipants;
        const exists = participants.includes(id);

        set({
          combatParticipants: exists
            ? participants.filter((participantId) => participantId !== id)
            : [...participants, id],
        });
      },

      moveCombatParticipant: (id, x, y) => {
        if (!get().combatParticipants.includes(id)) return;

        const nextX = Math.max(0, Math.min(15, Math.round(x)));
        const nextY = Math.max(0, Math.min(11, Math.round(y)));

        set({
          combatPositions: {
            ...get().combatPositions,
            [id]: {
              x: nextX,
              y: nextY,
            },
          },
        });

        // Homunculo: tocado = adjacente (manhattan 1) enquanto stun de Corpo Artificial
        const s = get();
        const logs = [];
        for (const hid of s.combatParticipants) {
          const h = s.characters[hid];
          if (!h || h.raceId !== "homunculo") continue;
          const stunned = s.combatStatusEffects.some(
            (e) => e.targetId === hid && e.id === "stun" && e.stacks > 0
          );
          if (!stunned) continue;
          const hp = s.combatPositions[hid];
          const mp = s.combatPositions[id];
          if (!hp || !mp) continue;
          const dist = Math.abs(hp.x - mp.x) + Math.abs(hp.y - mp.y);
          if (dist !== 1) continue;
          const r = raceHomunculusTryReactivate(h, true);
          if (r.ok) {
            get().removeCombatStatusEffect("stun", hid);
            logs.push({ id: uid("lg"), at: Date.now(), kind: "passive", text: h.name+": "+(r.note||"reativado") });
          }
        }
        if (logs.length) set({ combatLog: [...logs, ...get().combatLog].slice(0, 80) });
      },

      setAllowBossEscape: (value) => {
        set({ allowBossEscape: value });
      },

      startWorldBossCombat: (bossId, level) => {
        const boss = WORLD_BOSS_DETAILS.find((item) => item.id === bossId);
        if (!boss) return;

        const bossLevel =
          boss.levels.find((entry) => entry.level === level) ??
          boss.levels[boss.levels.length - 1];

        if (!bossLevel) return;

        const s = get();

        const playerIds = s.slots.filter(
          (id): id is string =>
            Boolean(id && s.characters[id] && s.characters[id].current.hp > 0),
        );

        const bossTurnId = "world-boss";

        const order = [...playerIds, bossTurnId].sort((a, b) => {
          const aStats =
            a === bossTurnId ? bossLevel.stats : finalStats(s.characters[a]);
          const bStats =
            b === bossTurnId ? bossLevel.stats : finalStats(s.characters[b]);

          if (bStats.agi !== aStats.agi) return bStats.agi - aStats.agi;
          if (bStats.int !== aStats.int) return bStats.int - aStats.int;
          return bStats.est - aStats.est;
        });

        const turnIndex = 0;
        const firstId = order[turnIndex] ?? null;

        set({
          combatMode: "world-boss",
          combatActive: true,
          worldBossId: bossId,
          worldBossCombat: {
            bossId,
            level: bossLevel.level,
            current: {
              hp: bossLevel.stats.hp,
              mp: bossLevel.stats.mp,
              est: bossLevel.stats.est,
              san: bossLevel.stats.san,
            },
            turnOrder: order,
            turnIndex,
            round: 1,
            targetId:
              firstId === bossTurnId
                ? playerIds[0] ?? null
                : bossTurnId,
            effects: initializeWorldBossEffects(bossId),
          wendigoMeta: bossId === "wendigo" ? emptyWendigoMeta() : undefined,
          tsuchigumoMeta: bossId === "tsuchigumo" ? emptyTsuchigumoMeta() : undefined,
          camazotzMeta: bossId === "camazotz" ? emptyCamazotzMeta() : undefined,
          ammitMeta: bossId === "ammit" ? emptyAmmitMeta() : undefined,
          fenrirMeta: bossId === "fenrir" ? emptyFenrirMeta() : undefined,
          raijuMeta: bossId === "raiju" ? emptyRaijuMeta() : undefined,
          jormungandrMeta: bossId === "jormungandr" ? emptyJormungandrMeta() : undefined,
          ratatoskrMeta: bossId === "ratatoskr" ? emptyRatatoskrMeta() : undefined,
          eikthyrnirMeta: bossId === "eikthyrnir" ? emptyEikthyrnirMeta() : undefined,
          hatiSkollMeta:
            bossId === "hati-skoll"
              ? createDuoHatiSkollMeta(bossLevel.stats, bossLevel.stats)
              : bossId === "hati" || bossId === "skoll"
                ? emptyHatiSkollMeta()
                : undefined,
          hraesvelgrMeta: bossId === "hraesvelgr" ? emptyHraesvelgrMeta() : undefined,
            cooldowns: [],
      affinityReactionBlocks: [],
          },
        });
      },

      nextWorldBossTurn: (requestedSkillName, requestedTargetId) => {
        const s = get();
        const combat = s.worldBossCombat;
        const executingMasterAction = Boolean(
          combat &&
          combat.turnOrder[combat.turnIndex] === "world-boss" &&
          requestedTargetId !== undefined
        );
        const affinityReactionBlocks = combat
          ? executingMasterAction
            ? combat.affinityReactionBlocks
            : tickAffinityReactionBlocks(combat.affinityReactionBlocks)
          : [];
        const worldBossEffects = combat
          ? executingMasterAction
            ? combat.effects
            : tickWorldBossEffects(combat.effects)
          : [];

        if (!combat || !s.combatActive || s.combatMode !== "world-boss") return;
        if (combat.turnOrder.length === 0) return;

        let nextIndex = combat.turnIndex;
        let nextId: string | null = executingMasterAction ? "world-boss" : null;
        let wrapped = false;

        if (!executingMasterAction) {
          for (let step = 1; step <= combat.turnOrder.length; step += 1) {
          const candidateIndex =
            (combat.turnIndex + step) % combat.turnOrder.length;
          const candidateId = combat.turnOrder[candidateIndex];

          if (candidateId === "world-boss") {
            if (combat.current.hp > 0) {
              nextIndex = candidateIndex;
              nextId = candidateId;
              wrapped = candidateIndex <= combat.turnIndex;
              break;
            }
            continue;
          }

          const character = s.characters[candidateId];

          if (character && character.current.hp > 0) {
            nextIndex = candidateIndex;
            nextId = candidateId;
            wrapped = candidateIndex <= combat.turnIndex;
            break;
          }
        }

          }

        if (!nextId) return;

        const targetId =
          nextId === "world-boss"
            ? (executingMasterAction ? requestedTargetId ?? null : null)
            : "world-boss";

        let poisonCharacters = s.characters;

        if (!executingMasterAction) {
          for (const effect of combat.effects) {
          if (
            effect.id !== "poison" ||
            !effect.targetId ||
            effect.duration === null ||
            effect.duration <= 0
          ) {
            continue;
          }

          const poisonedCharacter = poisonCharacters[effect.targetId];

          if (!poisonedCharacter || poisonedCharacter.current.hp <= 0) {
            continue;
          }

          poisonCharacters = {
            ...poisonCharacters,
            [effect.targetId]: {
              ...poisonedCharacter,
              current: {
                ...poisonedCharacter.current,
                hp: Math.max(
                  0,
                  poisonedCharacter.current.hp - 2,
                ),
              },
            },
          };
          }
        }

        let turnNotes = [];
        let wendigoMetaTurn = combat.wendigoMeta;
        if (!executingMasterAction && combat.bossId === "tsuchigumo") {
          const adv = tsuchiOnTurnAdvance(
            combat.tsuchigumoMeta || emptyTsuchigumoMeta(),
            bossLevelSafeEst(combat),
          );
          // apply silk DoT + EST regen below after set — store notes
          turnNotes = adv.notes;
          // stash for set
          (combat as { _tsuchiAdv?: typeof adv })._tsuchiAdv = adv;
        }
        if (!executingMasterAction && combat.bossId === "hraesvelgr") {
          const alive = combat.turnOrder
            .filter((id) => id !== "world-boss")
            .map((id) => get().characters[id])
            .filter((c) => c && c.current.hp > 0)
            .map((c) => ({ id: c.id, hp: c.current.hp, maxHp: finalStats(c).hp }));
          const baseStats = {
            hp: 100, mp: 100, est: 100, atk: 22, atkMgc: 24, agi: 18, def: 12, res: 12, int: 14, san: 14,
          };
          const adv = hraesvelgrOnTurnAdvance(
            combat.hraesvelgrMeta || emptyHraesvelgrMeta(),
            baseStats,
            alive,
            rollDie,
          );
          turnNotes = (typeof turnNotes !== "undefined" ? turnNotes : []).concat(adv.notes);
          for (const d of adv.skyfallDamages) {
            const ch = poisonCharacters[d.targetId] ?? get().characters[d.targetId];
            if (ch && ch.current.hp > 0) {
              poisonCharacters = {
                ...poisonCharacters,
                [d.targetId]: {
                  ...ch,
                  current: { ...ch.current, hp: Math.max(0, ch.current.hp - d.damage) },
                },
              };
            }
          }
          (combat as any)._hraeMeta = adv.meta;
        }
        if (!executingMasterAction && (combat.bossId === "hati" || combat.bossId === "skoll")) {
          const adv = hatiSkollOnTurnAdvance(combat.hatiSkollMeta || emptyHatiSkollMeta());
          turnNotes = (typeof turnNotes !== "undefined" ? turnNotes : []).concat(adv.notes);
          (combat as any)._twinMeta = adv.meta;
        }
        if (!executingMasterAction && combat.bossId === "eikthyrnir") {
          const adv = eikthyrnirOnTurnAdvance(combat.eikthyrnirMeta || emptyEikthyrnirMeta());
          turnNotes = (typeof turnNotes !== "undefined" ? turnNotes : []).concat(adv.notes);
          (combat as any)._eikMeta = adv.meta;
        }
        if (!executingMasterAction && combat.bossId === "ratatoskr") {
          const baseStats = {
            hp: 100, mp: 100, est: 100, atk: 20, atkMgc: 25, agi: 12, def: 12, res: 15, int: 20, san: 20,
          };
          const adv = ratatoskrOnTurnAdvance(
            combat.ratatoskrMeta || emptyRatatoskrMeta(),
            baseStats,
            combat.current.mp,
            combat.current.hp,
          );
          turnNotes = (typeof turnNotes !== "undefined" ? turnNotes : []).concat(adv.notes);
          (combat as any)._rataMeta = adv.meta;
          (combat as any)._rataMp = adv.bossMp;
          (combat as any)._rataHp = adv.bossHp;
        }
        if (!executingMasterAction && combat.bossId === "jormungandr") {
          const adj = combat.turnOrder.filter(
            (id) => id !== "world-boss" && (get().characters[id]?.current.hp ?? 0) > 0,
          );
          const adv = jormungandrOnTurnAdvance(
            combat.jormungandrMeta || emptyJormungandrMeta(),
            (get().worldBossCombat ? { hp: get().worldBossCombat!.current.hp || 1, mp: 100, est: 100, atk: 20, atkMgc: 20, agi: 10, def: 10, res: 10, int: 10, san: 10 } : { hp: 1, mp: 100, est: 100, atk: 20, atkMgc: 20, agi: 10, def: 10, res: 10, int: 10, san: 10 }),
            combat.current.hp,
            combat.current.mp,
            combat.current.est,
            adj,
          );
          turnNotes = (typeof turnNotes !== "undefined" ? turnNotes : []).concat(adv.notes);
          for (const d of [...adv.dragDamages, ...adv.whirlpoolDamages]) {
            const ch = poisonCharacters[d.targetId] ?? get().characters[d.targetId];
            if (ch && ch.current.hp > 0) {
              poisonCharacters = {
                ...poisonCharacters,
                [d.targetId]: {
                  ...ch,
                  current: { ...ch.current, hp: Math.max(0, ch.current.hp - d.damage) },
                },
              };
            }
          }
          (combat as any)._jormMeta = adv.meta;
          (combat as any)._jormMp = adv.bossMp;
          (combat as any)._jormEst = adv.bossEst;
        }
        if (!executingMasterAction && combat.bossId === "raiju") {
          const aliveIds = combat.turnOrder.filter(
            (id) => id !== "world-boss" && (get().characters[id]?.current.hp ?? 0) > 0,
          );
          const adv = raijuOnTurnAdvance(
            combat.raijuMeta || emptyRaijuMeta(),
            aliveIds,
            20,
            rollDie,
          );
          turnNotes = (typeof turnNotes !== "undefined" ? turnNotes : []).concat(adv.notes);
          for (const d of [...adv.dotDamages, ...adv.trailDamages]) {
            const ch = poisonCharacters[d.targetId] ?? get().characters[d.targetId];
            if (ch && ch.current.hp > 0) {
              poisonCharacters = {
                ...poisonCharacters,
                [d.targetId]: {
                  ...ch,
                  current: {
                    ...ch.current,
                    hp: Math.max(0, ch.current.hp - d.damage),
                  },
                },
              };
            }
          }
          (combat as { _raijuMeta?: typeof adv.meta })._raijuMeta = adv.meta;
        }
        if (!executingMasterAction && combat.bossId === "fenrir") {
          const adv = fenrirOnTurnAdvance(combat.fenrirMeta || emptyFenrirMeta(), true);
          turnNotes = (typeof turnNotes !== "undefined" ? turnNotes : []).concat(adv.notes);
          (combat as any)._fenrirMeta = adv.meta;
        }
        if (!executingMasterAction && combat.bossId === "ammit") {
          const adv = ammitOnTurnAdvance(combat.ammitMeta || emptyAmmitMeta());
          turnNotes = (typeof turnNotes !== "undefined" ? turnNotes : []).concat(adv.notes);
          (combat as any)._ammitMeta = adv.meta;
        }
        if (!executingMasterAction && combat.bossId === "camazotz") {
          const adv = camazotzOnTurnAdvance(combat.camazotzMeta || emptyCamazotzMeta());
          turnNotes = turnNotes.concat(adv.notes);
          (combat as any)._camaMeta = adv.meta;
        }
        if (!executingMasterAction && combat.bossId === "wendigo") {
          const adv = wendigoOnTurnAdvance(combat.wendigoMeta || emptyWendigoMeta());
          wendigoMetaTurn = adv.meta;
          turnNotes = adv.notes;
        }

        set({
          characters: poisonCharacters,
          worldBossCombat: {
            ...combat,
            turnIndex: nextIndex,
            round: wrapped ? combat.round + 1 : combat.round,
            targetId,
            cooldowns: combat.cooldowns,
            effects: worldBossEffects,
            affinityReactionBlocks,
            ...(wendigoMetaTurn ? { wendigoMeta: wendigoMetaTurn } : {}),
            ...((combat as any)._hraeMeta ? { hraesvelgrMeta: (combat as any)._hraeMeta } : {}),
            ...((combat as any)._twinMeta ? { hatiSkollMeta: (combat as any)._twinMeta } : {}),
            ...((combat as any)._eikMeta ? { eikthyrnirMeta: (combat as any)._eikMeta } : {}),
            ...((combat as any)._rataMeta ? { ratatoskrMeta: (combat as any)._rataMeta, current: { ...combat.current, mp: (combat as any)._rataMp ?? combat.current.mp, hp: (combat as any)._rataHp ?? combat.current.hp } } : {}),
            ...((combat as any)._jormMeta ? { jormungandrMeta: (combat as any)._jormMeta, current: { ...combat.current, mp: (combat as any)._jormMp ?? combat.current.mp, est: (combat as any)._jormEst ?? combat.current.est } } : {}),
            ...((combat as any)._fenrirMeta
              ? { fenrirMeta: (combat as any)._fenrirMeta }
              : {}),
            ...((combat as any)._ammitMeta
              ? { ammitMeta: (combat as any)._ammitMeta }
              : {}),
            ...((combat as any)._camaMeta
              ? { camazotzMeta: (combat as any)._camaMeta }
              : {}),
            ...((combat as any)._raijuMeta
              ? { raijuMeta: (combat as any)._raijuMeta }
              : {}),
            ...((combat as any)._tsuchiAdv
              ? { tsuchigumoMeta: (combat as any)._tsuchiAdv.meta }
              : {}),
          },
          ...(turnNotes.length
            ? {
                combatLog: [
                  ...turnNotes.map((text) => ({
                    id: uid("lg"),
                    at: Date.now(),
                    kind: "system",
                    text,
                  })),
                  ...get().combatLog,
                ].slice(0, 80),
              }
            : {}),
        });

        if (
          nextId === "world-boss" &&
          combat.bossId === "ratatoskr"
        ) {
          const effects = addWorldBossEffect(combat.effects, {
            id: "ratatoskr-arcane-energy",
            name: "Energia Arcana",
            duration: null,
            source: "boss",
            targetId: "world-boss",
            stacks: 1,
          }).map((effect) =>
            effect.id === "ratatoskr-arcane-energy"
              ? { ...effect, stacks: Math.min(5, effect.stacks) }
              : effect,
          );

          set({
            worldBossCombat: {
              ...get().worldBossCombat!,
              effects,
            },
          });
        }

        if (nextId === "world-boss" && !executingMasterAction) return;

        if (nextId === "world-boss" && targetId) {
          const boss = WORLD_BOSS_DETAILS.find(
            (entry) => entry.id === combat.bossId,
          );
          const bossLevel = boss?.levels.find(
            (entry) => entry.level === combat.level,
          );
          const target = s.characters[targetId];

          if (bossLevel && target) {
            const skillExecution =
              typeof requestedSkillName === "string"
                ? executeWorldBossSkill(
                    {
                      ...combat,
                      cooldowns: get().worldBossCombat?.cooldowns ?? [],
                    },
                    requestedSkillName,
                  )
                : null;

            if (typeof requestedSkillName === "string" && !skillExecution) return;

            if (skillExecution) {
              let reactionBlocks =
                get().worldBossCombat?.affinityReactionBlocks ?? [];

              const skillAffinity = skillExecution.skill.affinityId;
              const hasDragonFury = get().combatStatusEffects.some(
                (effect) =>
                  effect.id === "dragon-fury" &&
                  effect.targetId === targetId &&
                  effect.stacks > 0,
              );
              const targetAffinities = [
                ...new Set([
                  target.affinityId,
                  ...(hasDragonFury ? ["fogo"] : []),
                ]),
              ];

              if (skillAffinity) {
                let reaction: ReturnType<typeof resolveAffinityReaction> = null;

                for (const targetAffinity of targetAffinities) {
                  if (!targetAffinity) continue;
                  const candidate = resolveAffinityReaction(
                    skillAffinity,
                    targetAffinity,
                  );
                  if (
                    candidate &&
                    !isAffinityReactionBlocked(
                      reactionBlocks,
                      candidate.reactionId,
                    )
                  ) {
                    reaction = candidate;
                    break;
                  }
                }

                if (reaction) {
                  if (!reaction.activated) {
                    reactionBlocks = blockAffinityReaction(
                      reactionBlocks,
                      reaction.reactionId,
                      reaction.blockTurns,
                    );
                  } else {
                    const reactionEffect = STATUS_EFFECTS[reaction.effectId];

                    if (reactionEffect) {
                      const reactionDurations: Record<string, number | null> = {
                        bleeding: 2,
                        stun: 1,
                        freeze: 1,
                        cold: 2,
                        slow: 2,
                        infect: 1,
                        burn: 3,
                        blind: 1,
                        weakness: 2,
                        poison:
                          reaction.effectId === "poison" &&
                          get().worldBossCombat?.effects.some(
                            (effect) =>
                              effect.id === "silk_thread" &&
                              effect.targetId === targetId,
                          )
                            ? 3
                            : 2,
                        cancel: 1,
                        wet: null,
                        silk_thread: null,
                        explosion: null,
                      };

                      let reactionWorldBossEffects = addWorldBossEffect(
                        get().worldBossCombat?.effects ?? [],
                        {
                          id: reaction.effectId,
                          name: reactionEffect.name,
                          duration:
                            reactionDurations[reaction.effectId] ?? null,
                          source: "system",
                          targetId,
                          stacks: 1,
                        },
                      );

                      if (
                        reaction.effectId === "cold" &&
                        reactionWorldBossEffects.find(
                          (effect) =>
                            effect.id === "cold" &&
                            effect.targetId === targetId,
                        )?.stacks === 3
                      ) {
                        reactionWorldBossEffects = removeWorldBossEffect(
                          reactionWorldBossEffects,
                          "cold",
                          targetId,
                        );

                        reactionWorldBossEffects = addWorldBossEffect(
                          reactionWorldBossEffects,
                          {
                            id: "freeze",
                            name: STATUS_EFFECTS.freeze.name,
                            duration: 1,
                            source: "system",
                            targetId,
                            stacks: 1,
                          },
                        );
                      }

                      if (
                        reaction.effectId === "silk_thread" &&
                        reactionWorldBossEffects.find(
                          (effect) =>
                            effect.id === "silk_thread" &&
                            effect.targetId === targetId,
                        )?.stacks === 3
                      ) {
                        reactionWorldBossEffects = removeWorldBossEffect(
                          reactionWorldBossEffects,
                          "silk_thread",
                          targetId,
                        );

                        reactionWorldBossEffects = addWorldBossEffect(
                          reactionWorldBossEffects,
                          {
                            id: "immobilize",
                            name: STATUS_EFFECTS.immobilize.name,
                            duration: 1,
                            source: "system",
                            targetId,
                            stacks: 1,
                          },
                        );
                      }

                      set({
                        worldBossCombat: {
                          ...get().worldBossCombat!,
                          effects: reactionWorldBossEffects,
                        },
                      });
                    }
                  }
                }
              }

              const skillLog = {
                id: uid("lg"),
                at: Date.now(),
                kind: "system" as const,
                              text: `O World Boss usa ${skillExecution.skill.name}.`,
              };

              set({
                worldBossCombat: {
                  ...get().worldBossCombat!,
                  cooldowns: skillExecution.cooldowns,
                  affinityReactionBlocks: reactionBlocks,
                },
                combatLog: [skillLog, ...get().combatLog].slice(0, 80),
                tab: "combate",
              });
// --- Kit Wendigo ---
              if (combat.bossId === "tsuchigumo" && skillExecution) {
                const wb = get().worldBossCombat!;
                const meta = wb.tsuchigumoMeta || emptyTsuchigumoMeta();
                const alive = combat.turnOrder
                  .filter((id) => id !== "world-boss")
                  .map((id) => get().characters[id])
                  .filter((c) => c && c.current.hp > 0);
                const targets = alive.map((c) => ({
                  id: c.id,
                  hp: c.current.hp,
                  maxHp: finalStats(c).hp,
                }));
                const resolved = resolveTsuchigumoSkill(skillExecution.skill.name, {
                  level: combat.level,
                  baseStats: bossLevel.stats,
                  meta,
                  bossHp: wb.current.hp,
                  bossMp: wb.current.mp,
                  bossEst: wb.current.est,
                  primaryTargetId: targetId,
                  targets,
                  rollDie,
                });
                if (resolved) {
                  let effects = wb.effects;
                  for (const s of resolved.silkApplies) {
                    effects = addWorldBossEffect(effects, {
                      id: "silk_thread", name: "Fio de Seda", duration: 3, source: "boss",
                      targetId: s.targetId, stacks: s.stacks,
                    });
                    get().applyCombatStatusEffect("silk_thread", s.targetId, {
                      duration: 3, stacks: s.stacks, sourceId: "world-boss",
                    });
                  }
                  for (const id of resolved.immobilizes) {
                    get().applyCombatStatusEffect("immobilize", id, {
                      duration: 1, sourceId: "world-boss",
                    });
                  }
                  for (const p of resolved.poisons) {
                    get().applyCombatStatusEffect("poison", p.targetId, {
                      duration: p.duration, sourceId: "world-boss",
                    });
                  }
                  for (const d of resolved.damages) {
                    const ch = get().characters[d.targetId];
                    if (!ch) continue;
                    get().patchCharacter(d.targetId, {
                      current: { ...ch.current, hp: Math.max(0, ch.current.hp - d.damage) },
                    });
                  }
                  set({
                    worldBossCombat: {
                      ...get().worldBossCombat!,
                      current: {
                        ...get().worldBossCombat!.current,
                        hp: resolved.bossHp,
                        mp: resolved.bossMp,
                        est: resolved.bossEst,
                      },
                      effects,
                      tsuchigumoMeta: resolved.meta,
                      cooldowns: skillExecution.cooldowns,
                    },
                    combatLog: [
                      ...resolved.notes.map((text) => ({
                        id: uid("lg"), at: Date.now(), kind: "system", text,
                      })),
                      {
                        id: uid("lg"), at: Date.now(), kind: "system",
                        text: "O World Boss usa " + skillExecution.skill.name + ".",
                      },
                      ...get().combatLog,
                    ].slice(0, 80),
                  });
                }
              }

              if (combat.bossId === "hraesvelgr" && skillExecution) {
                const wb = get().worldBossCombat!;
                const meta = wb.hraesvelgrMeta || emptyHraesvelgrMeta();
                const alive = combat.turnOrder
                  .filter((id) => id !== "world-boss")
                  .map((id) => get().characters[id])
                  .filter((c) => c && c.current.hp > 0);
                const targets = alive.map((c) => ({
                  id: c.id, hp: c.current.hp, maxHp: finalStats(c).hp,
                }));
                const resolved = resolveHraesvelgrSkill(skillExecution.skill.name, {
                  level: combat.level,
                  baseStats: bossLevel.stats,
                  meta,
                  bossHp: wb.current.hp,
                  bossMp: wb.current.mp,
                  bossEst: wb.current.est,
                  primaryTargetId: targetId,
                  targets,
                  rollDie,
                });
                if (resolved) {
                  for (const d of resolved.damages) {
                    const ch = get().characters[d.targetId];
                    if (!ch) continue;
                    get().patchCharacter(d.targetId, {
                      current: { ...ch.current, hp: Math.max(0, ch.current.hp - d.damage) },
                    });
                  }
                  set({
                    worldBossCombat: {
                      ...get().worldBossCombat!,
                      current: {
                        ...get().worldBossCombat!.current,
                        hp: resolved.bossHp,
                        mp: resolved.bossMp,
                        est: resolved.bossEst,
                      },
                      hraesvelgrMeta: resolved.meta,
                      cooldowns: skillExecution.cooldowns,
                    },
                    combatLog: [
                      ...resolved.notes.map((text) => ({
                        id: uid("lg"), at: Date.now(), kind: "system", text,
                      })),
                      {
                        id: uid("lg"), at: Date.now(), kind: "system",
                        text: "O World Boss usa " + skillExecution.skill.name + ".",
                      },
                      ...get().combatLog,
                    ].slice(0, 80),
                  });
                }
              }

              if ((combat.bossId === "hati" || combat.bossId === "skoll" || combat.bossId === "hati-skoll") && skillExecution) {
                const wb = get().worldBossCombat!;
                const meta = wb.hatiSkollMeta || emptyHatiSkollMeta();
                const alive = combat.turnOrder
                  .filter((id) => id !== "world-boss")
                  .map((id) => get().characters[id])
                  .filter((c) => c && c.current.hp > 0);
                const targets = alive.map((c) => ({
                  id: c.id, hp: c.current.hp, maxHp: finalStats(c).hp,
                }));
                /* twin-duo-resolve */
                let actorId = combat.bossId === "skoll" ? "skoll" : combat.bossId === "hati" ? "hati" : (wb.hatiSkollMeta?.activeActor || "hati");
                if (combat.bossId === "hati-skoll") {
                  const order = twinActionOrder(wb.hatiSkollMeta || emptyHatiSkollMeta());
                  actorId = order[0] || "hati";
                }
                const resolved =
                  actorId === "hati"
                    ? resolveHatiSkill(skillExecution.skill.name, {
                        level: combat.level,
                        baseStats: bossLevel.stats,
                        meta,
                        bossHp: wb.current.hp,
                        bossMp: wb.current.mp,
                        bossEst: wb.current.est,
                        primaryTargetId: targetId,
                        targets,
                        rollDie,
                      })
                    : resolveSkollSkill(skillExecution.skill.name, {
                        level: combat.level,
                        baseStats: bossLevel.stats,
                        meta,
                        bossHp: wb.current.hp,
                        bossMp: wb.current.mp,
                        bossEst: wb.current.est,
                        primaryTargetId: targetId,
                        targets,
                        rollDie,
                      });
                if (resolved) {
                  for (const d of resolved.damages) {
                    const ch = get().characters[d.targetId];
                    if (!ch) continue;
                    get().patchCharacter(d.targetId, {
                      current: { ...ch.current, hp: Math.max(0, ch.current.hp - d.damage) },
                    });
                  }
                  for (const s of resolved.status) {
                    const id =
                      s.kind === "infect"
                        ? "infect"
                        : s.kind === "bleed"
                          ? "bleeding"
                          : s.kind === "stun"
                            ? "stun"
                            : "weakness";
                    try {
                      get().applyCombatStatusEffect(id as any, s.targetId, {
                        duration: s.duration,
                        sourceId: "world-boss",
                      });
                    } catch {}
                  }
                  set({
                    worldBossCombat: {
                      ...get().worldBossCombat!,
                      current: {
                        ...get().worldBossCombat!.current,
                        hp: resolved.bossHp,
                        mp: resolved.bossMp,
                        est: resolved.bossEst,
                      },
                      hatiSkollMeta: resolved.meta,
                      cooldowns: skillExecution.cooldowns,
                    },
                    combatLog: [
                      ...resolved.notes.map((text) => ({
                        id: uid("lg"), at: Date.now(), kind: "system", text,
                      })),
                      {
                        id: uid("lg"), at: Date.now(), kind: "system",
                        text: "O World Boss usa " + skillExecution.skill.name + ".",
                      },
                      ...get().combatLog,
                    ].slice(0, 80),
                  });
                }
              }

              if (combat.bossId === "eikthyrnir" && skillExecution) {
                const wb = get().worldBossCombat!;
                const meta = wb.eikthyrnirMeta || emptyEikthyrnirMeta();
                const alive = combat.turnOrder
                  .filter((id) => id !== "world-boss")
                  .map((id) => get().characters[id])
                  .filter((c) => c && c.current.hp > 0);
                const targets = alive.map((c) => ({
                  id: c.id, hp: c.current.hp, maxHp: finalStats(c).hp,
                }));
                const resolved = resolveEikthyrnirSkill(skillExecution.skill.name, {
                  level: combat.level,
                  baseStats: bossLevel.stats,
                  meta,
                  bossHp: wb.current.hp,
                  bossMp: wb.current.mp,
                  bossEst: wb.current.est,
                  primaryTargetId: targetId,
                  targets,
                  rollDie,
                });
                if (resolved) {
                  for (const d of resolved.damages) {
                    const ch = get().characters[d.targetId];
                    if (!ch) continue;
                    get().patchCharacter(d.targetId, {
                      current: { ...ch.current, hp: Math.max(0, ch.current.hp - d.damage) },
                    });
                  }
                  set({
                    worldBossCombat: {
                      ...get().worldBossCombat!,
                      current: {
                        ...get().worldBossCombat!.current,
                        hp: resolved.bossHp,
                        mp: resolved.bossMp,
                        est: resolved.bossEst,
                      },
                      eikthyrnirMeta: resolved.meta,
                      cooldowns: skillExecution.cooldowns,
                    },
                    combatLog: [
                      ...resolved.notes.map((text) => ({
                        id: uid("lg"), at: Date.now(), kind: "system", text,
                      })),
                      {
                        id: uid("lg"), at: Date.now(), kind: "system",
                        text: "O World Boss usa " + skillExecution.skill.name + ".",
                      },
                      ...get().combatLog,
                    ].slice(0, 80),
                  });
                }
              }

              if (combat.bossId === "ratatoskr" && skillExecution) {
                const wb = get().worldBossCombat!;
                const meta = wb.ratatoskrMeta || emptyRatatoskrMeta();
                const alive = combat.turnOrder
                  .filter((id) => id !== "world-boss")
                  .map((id) => get().characters[id])
                  .filter((c) => c && c.current.hp > 0);
                const targets = alive.map((c) => ({
                  id: c.id, hp: c.current.hp, maxHp: finalStats(c).hp,
                }));
                const resolved = resolveRatatoskrSkill(skillExecution.skill.name, {
                  level: combat.level,
                  baseStats: bossLevel.stats,
                  meta,
                  bossHp: wb.current.hp,
                  bossMp: wb.current.mp,
                  bossEst: wb.current.est,
                  primaryTargetId: targetId,
                  targets,
                  rollDie,
                });
                if (resolved) {
                  for (const d of resolved.damages) {
                    const ch = get().characters[d.targetId];
                    if (!ch) continue;
                    get().patchCharacter(d.targetId, {
                      current: { ...ch.current, hp: Math.max(0, ch.current.hp - d.damage) },
                    });
                  }
                  set({
                    worldBossCombat: {
                      ...get().worldBossCombat!,
                      current: {
                        ...get().worldBossCombat!.current,
                        hp: resolved.bossHp,
                        mp: resolved.bossMp,
                        est: resolved.bossEst,
                      },
                      ratatoskrMeta: resolved.meta,
                      cooldowns: skillExecution.cooldowns,
                    },
                    combatLog: [
                      ...resolved.notes.map((text) => ({
                        id: uid("lg"), at: Date.now(), kind: "system", text,
                      })),
                      {
                        id: uid("lg"), at: Date.now(), kind: "system",
                        text: "O World Boss usa " + skillExecution.skill.name + ".",
                      },
                      ...get().combatLog,
                    ].slice(0, 80),
                  });
                }
              }

              if (combat.bossId === "jormungandr" && skillExecution) {
                const wb = get().worldBossCombat!;
                const meta = wb.jormungandrMeta || emptyJormungandrMeta();
                const alive = combat.turnOrder
                  .filter((id) => id !== "world-boss")
                  .map((id) => get().characters[id])
                  .filter((c) => c && c.current.hp > 0);
                const targets = alive.map((c) => ({
                  id: c.id, hp: c.current.hp, maxHp: finalStats(c).hp,
                }));
                const resolved = resolveJormungandrSkill(skillExecution.skill.name, {
                  level: combat.level,
                  baseStats: bossLevel.stats,
                  meta,
                  bossHp: wb.current.hp,
                  bossMp: wb.current.mp,
                  bossEst: wb.current.est,
                  primaryTargetId: targetId,
                  targets,
                  rollDie,
                });
                if (resolved) {
                  for (const d of resolved.damages) {
                    const ch = get().characters[d.targetId];
                    if (!ch) continue;
                    get().patchCharacter(d.targetId, {
                      current: { ...ch.current, hp: Math.max(0, ch.current.hp - d.damage) },
                    });
                  }
                  set({
                    worldBossCombat: {
                      ...get().worldBossCombat!,
                      current: {
                        ...get().worldBossCombat!.current,
                        hp: resolved.bossHp,
                        mp: resolved.bossMp,
                        est: resolved.bossEst,
                      },
                      jormungandrMeta: resolved.meta,
                      cooldowns: skillExecution.cooldowns,
                    },
                    combatLog: [
                      ...resolved.notes.map((text) => ({
                        id: uid("lg"), at: Date.now(), kind: "system", text,
                      })),
                      {
                        id: uid("lg"), at: Date.now(), kind: "system",
                        text: "O World Boss usa " + skillExecution.skill.name + ".",
                      },
                      ...get().combatLog,
                    ].slice(0, 80),
                  });
                }
              }

              if (combat.bossId === "raiju" && skillExecution) {
                const wb = get().worldBossCombat!;
                const meta = wb.raijuMeta || emptyRaijuMeta();
                const alive = combat.turnOrder
                  .filter((id) => id !== "world-boss")
                  .map((id) => get().characters[id])
                  .filter((c) => c && c.current.hp > 0);
                const targets = alive.map((c) => ({
                  id: c.id,
                  hp: c.current.hp,
                  maxHp: finalStats(c).hp,
                }));
                const resolved = resolveRaijuSkill(skillExecution.skill.name, {
                  level: combat.level,
                  baseStats: bossLevel.stats,
                  meta,
                  bossHp: wb.current.hp,
                  bossMp: wb.current.mp,
                  bossEst: wb.current.est,
                  primaryTargetId: targetId,
                  targets,
                  rollDie,
                });
                if (resolved) {
                  for (const d of resolved.damages) {
                    const ch = get().characters[d.targetId];
                    if (!ch) continue;
                    get().patchCharacter(d.targetId, {
                      current: {
                        ...ch.current,
                        hp: Math.max(0, ch.current.hp - d.damage),
                      },
                    });
                  }
                  set({
                    worldBossCombat: {
                      ...get().worldBossCombat!,
                      current: {
                        ...get().worldBossCombat!.current,
                        hp: resolved.bossHp,
                        mp: resolved.bossMp,
                        est: resolved.bossEst,
                      },
                      raijuMeta: resolved.meta,
                      cooldowns: skillExecution.cooldowns,
                    },
                    combatLog: [
                      ...resolved.notes.map((text) => ({
                        id: uid("lg"),
                        at: Date.now(),
                        kind: "system",
                        text,
                      })),
                      {
                        id: uid("lg"),
                        at: Date.now(),
                        kind: "system",
                        text: "O World Boss usa " + skillExecution.skill.name + ".",
                      },
                      ...get().combatLog,
                    ].slice(0, 80),
                  });
                }
              }

              if (combat.bossId === "fenrir" && skillExecution) {
                const wb = get().worldBossCombat!;
                const meta = wb.fenrirMeta || emptyFenrirMeta();
                const alive = combat.turnOrder
                  .filter((id) => id !== "world-boss")
                  .map((id) => get().characters[id])
                  .filter((c) => c && c.current.hp > 0);
                const targets = alive.map((c) => ({
                  id: c.id, hp: c.current.hp, maxHp: finalStats(c).hp, adjacent: true,
                }));
                const resolved = resolveFenrirSkill(skillExecution.skill.name, {
                  level: combat.level,
                  baseStats: bossLevel.stats,
                  meta,
                  bossHp: wb.current.hp,
                  bossMp: wb.current.mp,
                  bossEst: wb.current.est,
                  primaryTargetId: targetId,
                  targets,
                  rollDie,
                });
                if (resolved) {
                  for (const d of resolved.damages) {
                    const ch = get().characters[d.targetId];
                    if (!ch) continue;
                    get().patchCharacter(d.targetId, {
                      current: { ...ch.current, hp: Math.max(0, ch.current.hp - d.damage) },
                    });
                  }
                  set({
                    worldBossCombat: {
                      ...get().worldBossCombat!,
                      current: {
                        ...get().worldBossCombat!.current,
                        hp: resolved.bossHp, mp: resolved.bossMp, est: resolved.bossEst,
                      },
                      fenrirMeta: resolved.meta,
                      cooldowns: skillExecution.cooldowns,
                    },
                    combatLog: [
                      ...resolved.notes.map((text) => ({ id: uid("lg"), at: Date.now(), kind: "system" as const, text })),
                      { id: uid("lg"), at: Date.now(), kind: "system" as const, text: "O World Boss usa " + skillExecution.skill.name + "." },
                      ...get().combatLog,
                    ].slice(0, 80),
                  });
                }
              }

              if (combat.bossId === "ammit" && skillExecution) {
                const wb = get().worldBossCombat!;
                const meta = wb.ammitMeta || emptyAmmitMeta();
                const alive = combat.turnOrder
                  .filter((id) => id !== "world-boss")
                  .map((id) => get().characters[id])
                  .filter((c) => c && c.current.hp > 0);
                const targets = alive.map((c) => ({
                  id: c.id, hp: c.current.hp, maxHp: finalStats(c).hp,
                }));
                const resolved = resolveAmmitSkill(skillExecution.skill.name, {
                  level: combat.level,
                  baseStats: bossLevel.stats,
                  meta,
                  bossHp: wb.current.hp,
                  bossMp: wb.current.mp,
                  bossEst: wb.current.est,
                  primaryTargetId: targetId,
                  targets,
                  rollDie,
                });
                if (resolved) {
                  for (const id of resolved.immobilizes) {
                    get().applyCombatStatusEffect("immobilize", id, { duration: 1, sourceId: "world-boss" });
                  }
                  for (const d of resolved.damages) {
                    const ch = get().characters[d.targetId];
                    if (!ch) continue;
                    get().patchCharacter(d.targetId, {
                      current: { ...ch.current, hp: Math.max(0, ch.current.hp - d.damage) },
                    });
                  }
                  set({
                    worldBossCombat: {
                      ...get().worldBossCombat!,
                      current: {
                        ...get().worldBossCombat!.current,
                        hp: resolved.bossHp, mp: resolved.bossMp, est: resolved.bossEst,
                      },
                      ammitMeta: resolved.meta,
                      cooldowns: skillExecution.cooldowns,
                    },
                    combatLog: [
                      ...resolved.notes.map((text) => ({ id: uid("lg"), at: Date.now(), kind: "system" as const, text })),
                      { id: uid("lg"), at: Date.now(), kind: "system" as const, text: "O World Boss usa " + skillExecution.skill.name + "." },
                      ...get().combatLog,
                    ].slice(0, 80),
                  });
                }
              }

              if (combat.bossId === "camazotz" && skillExecution) {
                const wb = get().worldBossCombat!;
                const meta = wb.camazotzMeta || emptyCamazotzMeta();
                const alive = combat.turnOrder
                  .filter((id) => id !== "world-boss")
                  .map((id) => get().characters[id])
                  .filter((c) => c && c.current.hp > 0);
                const targets = alive.map((c) => ({
                  id: c.id,
                  hp: c.current.hp,
                  maxHp: finalStats(c).hp,
                  bleeding: get().combatStatusEffects.some((e) => e.id === "bleeding" && e.targetId === c.id),
                }));
                const resolved = resolveCamazotzSkill(skillExecution.skill.name, {
                  level: combat.level,
                  baseStats: bossLevel.stats,
                  meta,
                  bossHp: wb.current.hp,
                  bossMp: wb.current.mp,
                  bossEst: wb.current.est,
                  primaryTargetId: targetId,
                  targets,
                  rollDie,
                });
                if (resolved) {
                  for (const b of resolved.bleeds) {
                    get().applyCombatStatusEffect("bleeding", b.targetId, {
                      duration: b.duration,
                      stacks: b.stacks || 1,
                      sourceId: "world-boss",
                    });
                  }
                  for (const d of resolved.damages) {
                    const ch = get().characters[d.targetId];
                    if (!ch) continue;
                    get().patchCharacter(d.targetId, {
                      current: { ...ch.current, hp: Math.max(0, ch.current.hp - d.damage) },
                    });
                  }
                  set({
                    worldBossCombat: {
                      ...get().worldBossCombat!,
                      current: {
                        ...get().worldBossCombat!.current,
                        hp: resolved.bossHp,
                        mp: resolved.bossMp,
                        est: resolved.bossEst,
                      },
                      camazotzMeta: resolved.meta,
                      cooldowns: skillExecution.cooldowns,
                    },
                    combatLog: [
                      ...resolved.notes.map((text) => ({
                        id: uid("lg"), at: Date.now(), kind: "system" as const, text,
                      })),
                      {
                        id: uid("lg"), at: Date.now(), kind: "system" as const,
                        text: "O World Boss usa " + skillExecution.skill.name + ".",
                      },
                      ...get().combatLog,
                    ].slice(0, 80),
                  });
                }
              }

              if (combat.bossId === "wendigo" && skillExecution) {
                const wb = get().worldBossCombat!;
                const meta = wb.wendigoMeta || emptyWendigoMeta();
                const alive = combat.turnOrder
                  .filter((id) => id !== "world-boss")
                  .map((id) => get().characters[id])
                  .filter((c) => c && c.current.hp > 0);
                const targets = alive.map((c) => ({
                  id: c.id,
                  hp: c.current.hp,
                  maxHp: finalStats(c).hp,
                  coldStacks: (wb.effects.find((e) => e.id === "cold" && e.targetId === c.id)?.stacks) || 0,
                  frozen: wb.effects.some((e) => e.id === "freeze" && e.targetId === c.id && e.stacks > 0),
                }));
                const resolved = resolveWendigoSkill(skillExecution.skill.name, {
                  level: combat.level,
                  baseStats: bossLevel.stats,
                  meta,
                  bossHp: wb.current.hp,
                  bossMp: wb.current.mp,
                  bossEst: wb.current.est,
                  primaryTargetId: targetId,
                  targets,
                  rollDie,
                });
                if (resolved) {
                  let effects = wb.effects;
                  for (const c of resolved.coldApplies) {
                    effects = addWorldBossEffect(effects, {
                      id: "cold", name: "Frio", duration: 2, source: "boss", targetId: c.targetId, stacks: c.stacks || 1,
                    });
                  }
                  for (const fid of resolved.freezes) {
                    effects = addWorldBossEffect(effects, {
                      id: "freeze", name: "Congelamento", duration: 1, source: "boss", targetId: fid, stacks: 1,
                    });
                    get().applyCombatStatusEffect("freeze", fid, { duration: 1, sourceId: "world-boss" });
                  }
                  for (const d of resolved.damages) {
                    const ch = get().characters[d.targetId];
                    if (!ch) continue;
                    const nh = Math.max(0, ch.current.hp - d.damage);
                    get().patchCharacter(d.targetId, { current: { ...ch.current, hp: nh } });
                  }
                  set({
                    worldBossCombat: {
                      ...get().worldBossCombat!,
                      current: {
                        ...get().worldBossCombat!.current,
                        hp: resolved.bossHp,
                        mp: resolved.bossMp,
                        est: resolved.bossEst,
                      },
                      effects,
                      wendigoMeta: resolved.meta,
                      cooldowns: skillExecution.cooldowns,
                    },
                    combatLog: [
                      ...resolved.notes.map((text) => ({ id: uid("lg"), at: Date.now(), kind: "system", text })),
                      { id: uid("lg"), at: Date.now(), kind: "system", text: "O World Boss usa " + skillExecution.skill.name + "." },
                      ...get().combatLog,
                    ].slice(0, 80),
                  });
                }
              }

            }

            const triggeredExplosion =
              skillExecution &&
              get().worldBossCombat?.effects.some(
                (effect) =>
                  effect.id === "explosion" &&
                  effect.targetId === targetId,
              );

            const targetStats = finalStats(target);
            const targetColdStacks =
              combat.effects.find(
                (effect) =>
                  effect.id === "cold" &&
                  effect.targetId === targetId,
              )?.stacks ?? 0;

            targetStats.agi = Math.max(
              0,
              targetStats.agi - targetColdStacks,
            );

            const arcaneEnergy =
              combat.bossId === "ratatoskr"
                ? get().worldBossCombat?.effects.find(
                    (effect) =>
                      effect.id === "ratatoskr-arcane-energy" &&
                      effect.targetId === "world-boss",
                  )?.stacks ?? 0
                : 0;

            const bossMagicMultiplier =
              1 + arcaneEnergy * 0.08;

            const effectiveMagicAttack = Math.floor(
              bossLevel.stats.atkMgc * bossMagicMultiplier,
            );

            const attackerRoll = rollDie(20);
            const defenderRoll = rollDie(20);

            let hit = attackerRoll > defenderRoll;

            if (attackerRoll === defenderRoll) {
              hit =
                bossLevel.stats.agi > targetStats.agi ||
                (bossLevel.stats.agi === targetStats.agi &&
                  bossLevel.stats.int > targetStats.int);
            }

            const critical =
              attackerRoll === 20 ? 3 : attackerRoll >= 15 ? 2 : 1;

            const usesMagicSkill =
              skillExecution?.skill.name === "Sombra Odiosa";

            const attackPower = usesMagicSkill
              ? effectiveMagicAttack
              : bossLevel.stats.atk;

            const defensePower = usesMagicSkill
              ? targetStats.res
              : targetStats.def;

            const damage = hit
              ? Math.max(
                  1,
                  rollDie(Math.max(1, attackPower)) -
                    Math.floor(defensePower / 2),
                ) * critical
              : 0;

            if (triggeredExplosion) {
              const currentEffects =
                get().worldBossCombat?.effects ?? [];
              const explosionEffect = currentEffects.find(
                (effect) =>
                  effect.id === "explosion" &&
                  effect.targetId === targetId,
              );

              if (explosionEffect) {
                const damageValues = [
                  ...(explosionEffect.damageValues ?? []),
                  damage,
                ];

                if (damageValues.length >= 2) {
                  const explosionDamage = Math.floor(
                    (damageValues[0] + damageValues[1]) * 0.2,
                  );

                  set({
                    worldBossCombat: {
                      ...get().worldBossCombat!,
                      effects: removeWorldBossEffect(
                        currentEffects,
                        "explosion",
                        targetId,
                      ),
                    },
                  });

                  set({
                    characters: {
                      ...get().characters,
                      [targetId]: {
                        ...target,
                        current: {
                          ...target.current,
                          hp: Math.max(
                            0,
                            target.current.hp - explosionDamage,
                          ),
                        },
                      },
                    },
                    combatLog: [
                      {
                        id: uid("lg"),
                        at: Date.now(),
                        kind: "system" as const,
                        text: `Explosão causa ${explosionDamage} de dano em ${target.name}.`,
                      },
                      ...get().combatLog,
                    ].slice(0, 80),
                  });
                } else {
                  set({
                    worldBossCombat: {
                      ...get().worldBossCombat!,
                      effects: currentEffects.map((effect) =>
                        effect.id === "explosion" &&
                        effect.targetId === targetId
                          ? { ...effect, damageValues }
                          : effect,
                      ),
                    },
                  });
                }
              }
            }

            const nextPlayerHp = Math.max(
              0,
              target.current.hp - damage,
            );

            const logEntry = {
              id: uid("lg"),
              at: Date.now(),
              kind: hit ? ("hit" as const) : ("miss" as const),
              text: skillExecution
                ? hit
                  ? `O World Boss usa ${skillExecution.skill.name} em ${target.name} e causa ${damage} de dano.`
                  : `O World Boss usa ${skillExecution.skill.name}, mas erra ${target.name}.`
                : hit
                  ? `O World Boss ataca ${target.name} e causa ${damage} de dano.`
                  : `O World Boss erra o ataque contra ${target.name}.`,
            };

            set({
              characters: {
                ...s.characters,
                [targetId]: {
                  ...target,
                  current: {
                    ...target.current,
                    hp: nextPlayerHp,
                  },
                },
              },
              combatLog: [logEntry, ...s.combatLog].slice(0, 80),
              tab: "combate",
            });

            const updatedCooldowns = tickWorldBossCooldowns(
              get().worldBossCombat?.cooldowns ?? [],
            );

            set({
              worldBossCombat: {
                ...get().worldBossCombat!,
                cooldowns: updatedCooldowns,
              },
            });

            get().nextWorldBossTurn();
          }
        }
      },

      worldBossMasterAction: (skillName, targetId) => {

        const s = get();

        const combat = s.worldBossCombat;

        if (!combat || !s.combatActive || s.combatMode !== "world-boss" || s.role !== "mestre") return;

        if (combat.turnOrder[combat.turnIndex] !== "world-boss") return;

        const target = s.characters[targetId];

        if (!target || target.current.hp <= 0) return;

        if (skillName !== null) {

          const skill = getWorldBossAvailableSkills(combat.bossId, combat.level).find((entry) => entry.name === skillName);

          if (!skill || !canUseWorldBossSkill(skill, combat.cooldowns)) return;

        }

        get().nextWorldBossTurn(skillName, targetId);

      },


      worldBossAttack: (characterId) => {
        const s = get();
        const combat = s.worldBossCombat;

        if (!combat || !s.combatActive || s.combatMode !== "world-boss") return;
        if (!s.characters[characterId]) return;

        const currentActor = combat.turnOrder[combat.turnIndex];
        if (currentActor !== characterId) return;
        if (combat.targetId !== "world-boss") return;

        const character = s.characters[characterId];
        if (character.current.hp <= 0) return;

        if (
          combat.effects.some(
            (effect) =>
              (effect.id === "freeze" ||
                effect.id === "immobilize") &&
              effect.targetId === characterId,
          )
        ) {
          get().nextWorldBossTurn();
          return;
        }

        const boss = WORLD_BOSS_DETAILS.find(
          (entry) => entry.id === combat.bossId,
        );
        const bossLevel = boss?.levels.find(
          (entry) => entry.level === combat.level,
        );

        if (!boss || !bossLevel) return;

        const stats = finalStats(character);
        const attackerRoll = rollDie(20);
        const defenderRoll = rollDie(20);

        let hit = attackerRoll > defenderRoll;

        if (attackerRoll === defenderRoll) {
          if (stats.agi !== bossLevel.stats.agi) {
            hit = stats.agi > bossLevel.stats.agi;
          } else {
            hit = stats.int > bossLevel.stats.int;
          }
        }

        const critical =
          attackerRoll === 20 ? 3 : attackerRoll >= 15 ? 2 : 1;

        const damage = hit
          ? rollDie(Math.max(1, stats.atk)) * critical
          : 0;

        let nextHp = Math.max(0, combat.current.hp - damage);
        let wendigoMeta = combat.wendigoMeta;
        let shieldNote = "";
        if (hit && damage > 0 && combat.bossId === "ammit") {
          let meta = ammitRegisterHitTaken(combat.ammitMeta || emptyAmmitMeta());
          const mult = ammitIncomingDamageMult(meta);
          const reduced = Math.max(0, Math.floor(damage * mult));
          // weight on attacker for dealing damage
          meta = addWeight(meta, characterId, 1);
          nextHp = Math.max(0, combat.current.hp - reduced);
          wendigoMeta = undefined as never;
          (combat as any)._ammitAfterHit = meta;
          shieldNote = mult < 1 ? " (Corpo de Rocha)" : "";
        } else if (hit && damage > 0 && combat.bossId === "wendigo") {
          const meta = combat.wendigoMeta || emptyWendigoMeta();
          const absorbed = wendigoAbsorbShield(meta, damage);
          wendigoMeta = absorbed.meta;
          nextHp = Math.max(0, combat.current.hp - absorbed.remaining);
          const blocked = damage - absorbed.remaining;
          if (blocked > 0) shieldNote = " (Carne Extra absorveu " + blocked + ")";
        }

        const logEntry = {
          id: uid("lg"),
          at: Date.now(),
          kind: hit ? ("hit" as const) : ("miss" as const),
          text: hit
            ? character.name + " acerta o World Boss por " + damage + " de dano" + shieldNote + "."
            : character.name + " erra o ataque contra o World Boss.",
        };

        set({
          worldBossCombat: {
            ...combat,
            current: {
              ...combat.current,
              hp: nextHp,
            },
            ...(wendigoMeta ? { wendigoMeta } : {}),
          },
          combatLog: [logEntry, ...s.combatLog].slice(0, 80),
          tab: "combate",
        });

        if (nextHp > 0) {
          get().nextWorldBossTurn();
        }
      },

      startCombat: () => {
        const s = get();

        const allParticipants = [...new Set([
          ...s.combatParticipants,
          ...s.slots.filter((id): id is string => Boolean(id)),
          ...Object.keys(s.combatEnemies),
        ])];

        const order = allParticipants
          .filter((id) => {
            const character = s.characters[id];
            const enemy = s.combatEnemies[id];
            return Boolean(
              (character && character.current.hp > 0) ||
              (enemy && enemy.current.hp > 0)
            );
          })
          .sort((a, b) => {
            const aStats = s.characters[a]
              ? finalStats(s.characters[a])
              : s.combatEnemies[a].stats;

            const bStats = s.characters[b]
              ? finalStats(s.characters[b])
              : s.combatEnemies[b].stats;

            if (bStats.agi !== aStats.agi) {
              return bStats.agi - aStats.agi;
            }

            if (bStats.int !== aStats.int) {
              return bStats.int - aStats.int;
            }

            if (bStats.est !== aStats.est) {
              return bStats.est - aStats.est;
            }

            const aName = (s.characters[a] ?? s.combatEnemies[a]).name;
            const bName = (s.characters[b] ?? s.combatEnemies[b]).name;

            return aName.localeCompare(bName, "pt-BR", {
              sensitivity: "base",
            });
          });

        if (order.length < 2) return;

        const firstId = order[0];

        const combatPositions: Record<string, { x: number; y: number }> = {};

        let playerIndex = 0;
        let enemyIndex = 0;

        for (const id of order) {
          if (s.characters[id]) {
            combatPositions[id] = {
              x: 1,
              y: Math.min(11, 2 + playerIndex * 2),
            };
            playerIndex += 1;
          } else if (s.combatEnemies[id]) {
            combatPositions[id] = {
              x: 14,
              y: Math.min(11, 2 + enemyIndex * 2),
            };
            enemyIndex += 1;
          }
        }

        const passiveState = emptyPassiveState();
        const startNotes: string[] = [];
        const partyChars = order.map((id) => s.characters[id]).filter(Boolean) as import("@/data/types").Character[];
        for (const id of order) {
          const ch = s.characters[id];
          if (!ch) continue;
          const raceNote = raceCombatStart(passiveState, ch);
          {
            const kit = getCharacterKit(ch);
            if (kit?.onCombatStart) {
              const allyIds = order.filter((id) => Boolean(s.characters[id]));
              kit.onCombatStart({
                self: ch,
                allyIds,
                passiveState,
                applyStatus: (effectId, targetId, options) => {
                  // deferred via get after set — use direct push for start
                  get().applyCombatStatusEffect(effectId, targetId, { ...options, sourceId: ch.id });
                },
                log: (text) => startNotes.push(text),
              });
            }
          }
          if (raceNote) startNotes.push(`${ch.name}: ${raceNote}`);
          const bufaoNote = classBufaoCombatStart(passiveState, ch);
          {
            const o = classOraculoCombatStart(passiveState, ch);
            if (o) startNotes.push(ch.name+": "+o);
            const c = classCavaleiroCelesteCombatStart(passiveState, ch);
            if (c) startNotes.push(ch.name+": "+c);
            const e = classEspadachimOnTurn(passiveState, ch);
            if (e.note) startNotes.push(ch.name+": "+e.note);
          }
          if (bufaoNote) startNotes.push(`${ch.name}: ${bufaoNote}`);
          if (ch.raceId === "orc") {
            for (const n of raceOrcCombatStart(passiveState, ch, partyChars)) {
              startNotes.push(n);
            }
          }
        }

        set({
          combatActive: true,
          combatParticipants: [...order],
          combatXpParticipants: [...order],
          combatOrder: order,
          combatPositions,
          combatTurnIndex: 0,
          combatRound: 1,
          combatStatusEffects: [],
          combatPassiveState: passiveState,
          attackerId: firstId,
          defenderId: order.length > 1 ? order[1] : null,
          pendingCounter: null,
          combatLog: [
            {
              id: uid("lg"),
              at: Date.now(),
              kind: "system" as const,
              text: `Combate iniciado. ${(s.characters[firstId] ?? s.combatEnemies[firstId]).name} começa pela iniciativa.`,
            },
            ...startNotes.map((text) => ({
              id: uid("lg"),
              at: Date.now(),
              kind: "system" as const,
              text,
            })),
          ],
        });
      },

      setCombatArena: (arenaId) => set({ combatArena: arenaId }),

      setWarriorStance: (characterId, stance) => {
        const s = get();
        const ch = s.characters[characterId];
        if (!ch || ch.classId !== "guerreiro") return;
        const st = {
          ...s.combatPassiveState,
          entries: s.combatPassiveState.entries.map((e) => ({ ...e, meta: { ...e.meta } })),
        };
        classGuerreiroSetStance(st, ch, stance);
        set({
          combatPassiveState: st,
          combatLog: [{
            id: uid("lg"),
            at: Date.now(),
            kind: "system" as const,
            text: `${ch.name}: Postura ${stance}`,
          }, ...s.combatLog].slice(0, 80),
        });
      },


      armCavaleiroInvestida: (characterId) => {
        const s = get();
        const ch = s.characters[characterId];
        if (!ch || ch.classId !== "cavaleiro" || !s.combatActive) return;
        const st = { ...s.combatPassiveState, entries: s.combatPassiveState.entries.map((e) => ({ ...e, meta: { ...e.meta } })) };
        classCavaleiroArmInvestida(st, ch);
        set({
          combatPassiveState: st,
          combatLog: [{ id: uid("lg"), at: Date.now(), kind: "system", text: ch.name+": Investida armada (+50% próximo ataque)" }, ...s.combatLog].slice(0, 80),
        });
      },

      setGladiadorAdversary: (characterId, targetId) => {
        const s = get();
        const ch = s.characters[characterId];
        if (!ch || ch.classId !== "gladiador" || !s.combatActive) return;
        const st = { ...s.combatPassiveState, entries: s.combatPassiveState.entries.map((e) => ({ ...e, meta: { ...e.meta } })) };
        classGladiadorSetAdversary(st, ch, targetId);
        const tname = (s.characters[targetId]||s.combatEnemies[targetId])?.name || targetId;
        set({
          combatPassiveState: st,
          combatLog: [{ id: uid("lg"), at: Date.now(), kind: "system", text: ch.name+": Adversário = "+tname }, ...s.combatLog].slice(0, 80),
        });
      },

      setArtificeProject: (characterId, tier) => {
        const s = get();
        const ch = s.characters[characterId];
        if (!ch || ch.classId !== "artifice") return;
        const st = { ...s.combatPassiveState, entries: s.combatPassiveState.entries.map((e) => ({ ...e, meta: { ...e.meta } })) };
        classArtificeSetProject(st, ch, tier);
        set({
          combatPassiveState: st,
          combatLog: [{ id: uid("lg"), at: Date.now(), kind: "system", text: ch.name+": Projeto "+tier }, ...s.combatLog].slice(0, 80),
        });
      },

      tryCronomanteRewind: (characterId, targetId) => {
        const s = get();
        const ch = s.characters[characterId];
        const target = s.characters[targetId];
        if (!ch || ch.classId !== "cronomante" || !target || !s.combatActive) return;
        const st = { ...s.combatPassiveState, entries: s.combatPassiveState.entries.map((e) => ({ ...e, meta: { ...e.meta } })) };
        const maxHp = finalStats(target).hp;
        const ratio = maxHp > 0 ? target.current.hp / maxHp : 1;
        const r = classCronomanteTryRewind(st, ch, ratio);
        if (!r.ok) {
          set({ combatLog: [{ id: uid("lg"), at: Date.now(), kind: "system", text: ch.name+": Retrocesso indisponível" }, ...s.combatLog].slice(0, 80) });
          return;
        }
        // simplificação: cura 40% do HP máximo (proxy do snapshot do turno anterior)
        const heal = Math.floor(maxHp * 0.4);
        get().patchCharacter(targetId, { current: { ...target.current, hp: Math.min(maxHp, target.current.hp + heal) } });
        set({
          combatPassiveState: st,
          combatLog: [{ id: uid("lg"), at: Date.now(), kind: "passive", text: ch.name+": "+(r.note||"Retrocesso")+" em "+target.name+" (+"+heal+" HP)" }, ...s.combatLog].slice(0, 80),
        });
      },

      setPaladinoOath: (characterId, allyId) => {
        const s = get();
        const ch = s.characters[characterId];
        if (!ch || ch.classId !== "paladino" || !s.combatActive) return;
        const st = { ...s.combatPassiveState, entries: s.combatPassiveState.entries.map((e) => ({ ...e, meta: { ...e.meta } })) };
        const note = classPaladinoCombatStart(st, ch, allyId);
        set({
          combatPassiveState: st,
          combatLog: [{ id: uid("lg"), at: Date.now(), kind: "system", text: ch.name+": "+(note||"Juramento") }, ...s.combatLog].slice(0, 80),
        });
      },

      setDomadorBond: (characterId, creatureId) => {
        const s = get();
        const ch = s.characters[characterId];
        if (!ch || ch.classId !== "domador") return;
        const st = { ...s.combatPassiveState, entries: s.combatPassiveState.entries.map((e) => ({ ...e, meta: { ...e.meta } })) };
        classDomadorSetBond(st, ch, creatureId);
        set({ combatPassiveState: st, combatLog: [{ id: uid("lg"), at: Date.now(), kind: "system", text: ch.name+": Laço Bestial" }, ...s.combatLog].slice(0, 80) });
      },

      setMarioneteLink: (characterId, linkedId) => {
        const s = get();
        const ch = s.characters[characterId];
        if (!ch || ch.classId !== "mestre-de-marionetes") return;
        const st = { ...s.combatPassiveState, entries: s.combatPassiveState.entries.map((e) => ({ ...e, meta: { ...e.meta } })) };
        classMarioneteSetLink(st, ch, linkedId);
        set({ combatPassiveState: st, combatLog: [{ id: uid("lg"), at: Date.now(), kind: "system", text: ch.name+": Fio vinculado" }, ...s.combatLog].slice(0, 80) });
      },

      assimilateTarget: (doppelId, targetId) => {
        const s = get();
        const doppel = s.characters[doppelId];
        const target = s.characters[targetId] ?? null;
        const enemy = s.combatEnemies[targetId];
        if (!doppel || !s.combatActive) return;
        // monstro: sintetiza Character mínimo
        let targetCh = target;
        if (!targetCh && enemy) {
          targetCh = {
            ...doppel,
            id: enemy.id,
            name: enemy.name,
            raceId: "humano",
            classId: "guerreiro",
            level: enemy.level,
            allocated: {},
            current: { ...enemy.current },
            skills: [],
          } as typeof doppel;
        }
        if (!targetCh) return;
        const st = {
          ...s.combatPassiveState,
          entries: s.combatPassiveState.entries.map((e) => ({ ...e, meta: { ...e.meta } })),
        };
        const result = raceDoppelAssimilate(st, doppel, targetCh);
        if ("error" in result) {
          set({
            combatLog: [{
              id: uid("lg"),
              at: Date.now(),
              kind: "system" as const,
              text: `Assimilação falhou: ${result.error}`,
            }, ...s.combatLog].slice(0, 80),
          });
          return;
        }
        get().patchCharacter(doppelId, {
          raceId: result.next.raceId,
          classId: result.next.classId,
          affinityId: result.next.affinityId,
          allocated: result.next.allocated,
          current: result.next.current,
          skills: result.next.skills,
        });
        set({
          combatPassiveState: st,
          combatLog: [{
            id: uid("lg"),
            at: Date.now(),
            kind: "passive" as const,
            text: result.note,
          }, ...get().combatLog].slice(0, 80),
        });
      },

      nextTurn: () => {
        const initial = get();
        if (!initial.combatActive) return;

        const aliveParticipants = initial.combatParticipants.filter((id) => {
          const character = initial.characters[id];
          const enemy = initial.combatEnemies[id];
          return Boolean(
            (character && character.current.hp > 0) ||
            (enemy && enemy.current.hp > 0)
          );
        });

        const turnOrder = (initial.combatOrder.length > 0
          ? initial.combatOrder
          : aliveParticipants
        ).filter((id) => aliveParticipants.includes(id));

        if (turnOrder.length === 0) return;

        let currentState = initial;
        let currentIndex = currentState.attackerId
          ? turnOrder.indexOf(currentState.attackerId)
          : -1;
        if (currentIndex < 0) {
          currentIndex = Math.max(-1, currentState.combatTurnIndex);
        }

        // Avança iterativamente para evitar recursão entre inimigos incapacitados.
        for (let attempts = 0; attempts < turnOrder.length; attempts++) {
          const nextIndex = (currentIndex + 1) % turnOrder.length;
          const nextId = turnOrder[nextIndex];
          if (!nextId) return;

          const wrapped = nextIndex <= currentIndex;
          const isEnemyTurn = Boolean(currentState.combatEnemies[nextId]);
          const effectsAtTurnStart = currentState.combatStatusEffects.filter(
            (effect) => effect.targetId === nextId
          );

          const blockingEffect = effectsAtTurnStart.find(
            (effect) =>
              effect.stacks > 0 &&
              ["stun", "freeze", "immobilize"].includes(effect.id)
          );

          let nextCharacters = currentState.characters;
          let nextEnemies = currentState.combatEnemies;

          // Kitsune: 1 stack por turno em que atacou
          {
            const prevId = currentState.attackerId;
            if (prevId && currentState.characters[prevId]) {
              const passives = {
                ...currentState.combatPassiveState,
                entries: currentState.combatPassiveState.entries.map((e) => ({ ...e, meta: { ...e.meta } })),
              };
              const flag = passives.entries.find(
                (e) => e.characterId === prevId && e.id === "race:kitsune:turn-flag" && e.meta?.attacked,
              );
              if (flag) {
                raceKitsuneOnAttackTurn(passives, currentState.characters[prevId]);
                flag.meta = { ...flag.meta, attacked: false };
                flag.active = false;
                currentState = { ...currentState, combatPassiveState: passives };
              }
            }
          }

          {
            const passivesPre = {
              ...currentState.combatPassiveState,
              entries: currentState.combatPassiveState.entries.map((e) => ({ ...e, meta: { ...e.meta } })),
            };
            if (currentState.attackerId) raceDoppelMirrorTurnReset(passivesPre, currentState.attackerId);
            currentState = { ...currentState, combatPassiveState: passivesPre };
          }
          // Passivas de turno (duração, Bufão stacks, Dríade)
          {
            const passives = {
              ...currentState.combatPassiveState,
              entries: currentState.combatPassiveState.entries.map((e) => ({ ...e, meta: { ...e.meta } })),
            };
            tickPassiveDurations(passives, nextId);
            const actorCh = nextCharacters[nextId];
            if (actorCh) {
              classBufaoOnTurn(passives, actorCh);
              const dop = raceDoppelOnTurn(passives, actorCh);
              {
                const rn = classRoninOnTurnStart(passives, actorCh, false);
                if (rn) { /* postura */ }
                const es = classEspadachimOnTurn(passives, actorCh);
                if (es.note) { /* stack turno */ }
              }
              if (actorCh.raceId === "kitsune") {
                const allies = currentState.combatParticipants
                  .map((pid) => currentState.characters[pid])
                  .filter(Boolean)
                  .map((c) => ({ id: c.id, hp: c.current.hp, maxHp: finalStats(c).hp }));
                const kn = raceKitsuneCheckDesperation(passives, actorCh, allies);
                if (kn) {
                  // log deferred via state
                }
              }

              if (dop) { /* log via combat state */ }
              const maxHp = finalStats(actorCh).hp;
              const terrain = isNaturalTerrain(currentState.combatArena);
              const heal = raceTurnStartHeal(actorCh, maxHp, terrain);
              if (heal.amount > 0) {
                nextCharacters = {
                  ...nextCharacters,
                  [nextId]: {
                    ...actorCh,
                    current: {
                      ...actorCh.current,
                      hp: Math.min(maxHp, actorCh.current.hp + heal.amount),
                    },
                  },
                };
              }
            }
            currentState = { ...currentState, combatPassiveState: passives };
          }

          for (const bleedingEffect of effectsAtTurnStart.filter((effect) => effect.id === "bleeding")) {
            const character = nextCharacters[nextId];
            const enemy = nextEnemies[nextId];
            const actor = character ?? enemy;
            if (!actor || actor.current.hp <= 0) continue;

            const maxHp = character ? finalStats(character).hp : enemy.stats.hp;
            const damage = bleedingEffect.power == null
              ? 2
              : Math.max(1, Math.ceil(maxHp * Math.min(100, Math.max(1, bleedingEffect.power)) / 100));

            if (character) {
              nextCharacters = {
                ...nextCharacters,
                [nextId]: {
                  ...character,
                  current: {
                    ...character.current,
                    hp: Math.max(0, character.current.hp - damage),
                  },
                },
              };
            } else if (enemy) {
              nextEnemies = {
                ...nextEnemies,
                [nextId]: {
                  ...enemy,
                  current: {
                    ...enemy.current,
                    hp: Math.max(0, enemy.current.hp - damage),
                  },
                },
              };
            }
          }

          for (const poisonEffect of effectsAtTurnStart.filter((effect) => effect.id === "poison")) {
            const character = nextCharacters[nextId];
            const enemy = nextEnemies[nextId];
            const actor = character ?? enemy;
            if (!actor || actor.current.hp <= 0) continue;

            const maxHp = character ? finalStats(character).hp : enemy.stats.hp;
            const damage = poisonEffect.power == null
              ? 2
              : Math.max(1, Math.ceil(maxHp * normalizeSkillPercent(poisonEffect.power) / 100));

            if (character) {
              nextCharacters = {
                ...nextCharacters,
                [nextId]: {
                  ...character,
                  current: {
                    ...character.current,
                    hp: Math.max(0, character.current.hp - damage),
                  },
                },
              };
            } else if (enemy) {
              nextEnemies = {
                ...nextEnemies,
                [nextId]: {
                  ...enemy,
                  current: {
                    ...enemy.current,
                    hp: Math.max(0, enemy.current.hp - damage),
                  },
                },
              };
            }
          }

          /* SKILL_GRADUAL_RECOVERY_TICK */
          for (const effect of effectsAtTurnStart) {
            if (effect.id !== "recovery" && effect.id !== "regeneration") continue;

            const character = nextCharacters[nextId];
            const enemy = nextEnemies[nextId];
            const actor = character ?? enemy;
            if (!actor || actor.current.hp <= 0) continue;

            const maxHp = character
              ? finalStats(character).hp
              : enemy.stats.hp;
            const totalPercent = Math.max(1, Math.min(100, effect.power ?? 10));
            const healAmount = Math.max(1, Math.ceil(maxHp * totalPercent / 200));
            const nextHp = Math.min(maxHp, actor.current.hp + healAmount);

            if (character) {
              nextCharacters = {
                ...nextCharacters,
                [nextId]: {
                  ...character,
                  current: { ...character.current, hp: nextHp },
                },
              };
            } else if (enemy) {
              nextEnemies = {
                ...nextEnemies,
                [nextId]: {
                  ...enemy,
                  current: { ...enemy.current, hp: nextHp },
                },
              };
            }
          }

          // NORMAL_EXPLOSION_DURATION_TICK
          if (currentState.combatMode === "normal") {
            for (const effect of currentState.combatStatusEffects) {
              if (
                effect.id !== "explosion" ||
                effect.targetId !== currentState.attackerId ||
                effect.duration === null ||
                effect.duration > 1
              ) continue;

              const damage = Math.max(0, (effect.initialDuration ?? effect.duration ?? 1) * 2);
              const character = nextCharacters[effect.targetId];
              const enemy = nextEnemies[effect.targetId];

              if (damage > 0 && character) {
                nextCharacters = {
                  ...nextCharacters,
                  [effect.targetId]: {
                    ...character,
                    current: {
                      ...character.current,
                      hp: Math.max(0, character.current.hp - damage),
                    },
                  },
                };
              } else if (damage > 0 && enemy) {
                nextEnemies = {
                  ...nextEnemies,
                  [effect.targetId]: {
                    ...enemy,
                    current: {
                      ...enemy.current,
                      hp: Math.max(0, enemy.current.hp - damage),
                    },
                  },
                };
              }

              if (damage > 0 && (character || enemy)) {
                currentState = {
                  ...currentState,
                  combatLog: [{
                    id: uid("lg"),
                    at: Date.now(),
                    kind: "system" as const,
                    text: `Explosão causa ${damage} de dano em ${(character ?? enemy)!.name}.`,
                  }, ...currentState.combatLog].slice(0, 80),
                };
              }
            }
          }

          const previousId = currentState.attackerId;
          const nextStatusEffects = currentState.combatStatusEffects
            .map((effect) => {
              if (effect.targetId !== previousId || effect.duration === null) {
                return effect;
              }
              return {
                ...effect,
                duration: Math.max(0, effect.duration - 1),
              };
            })
            .filter(
              (effect) => effect.duration === null || effect.duration > 0
            );

          const nextActor = nextCharacters[nextId] ?? nextEnemies[nextId];
          if (!nextActor || nextActor.current.hp <= 0) {
            const updatedOrder = turnOrder.filter((id) => {
              const character = nextCharacters[id];
              const enemy = nextEnemies[id];
              return Boolean(
                (character && character.current.hp > 0) ||
                (enemy && enemy.current.hp > 0)
              );
            });

            set({
              characters: nextCharacters,
              combatEnemies: nextEnemies,
              combatStatusEffects: nextStatusEffects,
              combatOrder: updatedOrder,
              combatTurnIndex: updatedOrder.length
                ? updatedOrder.indexOf(nextId)
                : 0,
              combatLog: currentState.combatLog,
              pendingCounter: null,
            });

            if (updatedOrder.length === 0) return;
            currentState = get();
            const survivingIndex = updatedOrder.indexOf(nextId);
            currentIndex = survivingIndex >= 0
              ? survivingIndex
              : Math.min(nextIndex, updatedOrder.length - 1);
            continue;
          }

          const survivingCharacters = Object.values(nextCharacters).filter(
            (character) =>
              turnOrder.includes(character.id) && character.current.hp > 0
          );
          const targetId = isEnemyTurn
            ? survivingCharacters[0]?.id ?? null
            : null;

          const logEntries = blockingEffect
            ? [{
                id: uid("log"),
                at: Date.now(),
                kind: "system" as const,
                text: `${(nextCharacters[nextId] ?? nextEnemies[nextId]).name} não pode agir: ${({
                  stun: "Atordoamento",
                  freeze: "Congelamento",
                  immobilize: "Imobilização",
                } as Record<string, string>)[blockingEffect.id] ?? blockingEffect.id}.`,
              }, ...currentState.combatLog].slice(0, 80)
            : currentState.combatLog;

          set({
            characters: nextCharacters,
            combatEnemies: nextEnemies,
            combatStatusEffects: nextStatusEffects,
            combatOrder: turnOrder,
            combatTurnIndex: nextIndex,
            combatRound: wrapped
              ? currentState.combatRound + 1
              : currentState.combatRound,
            attackerId: nextId,
            defenderId: targetId,
            pendingCounter: null,
            combatLog: logEntries,
          });

          currentState = get();
          currentIndex = nextIndex;

          // Se o próximo combatente estiver incapacitado, avança sem chamar
          // rollCombat recursivamente. O efeito continua ativo até seu turno acabar.
          if (blockingEffect) continue;

          if (isEnemyTurn && targetId) {
            get().rollCombat("physical");
          }
          return;
        }
      },

      clearCombatLog: () => set({ combatLog: [] }),

      endCombat: () => {
        const s = get();
        if (s.combatMode === "world-boss") return;

        const characters = { ...s.characters };
        const npcs = { ...s.npcs };
        for (const id of s.combatNpcIds) {
          const fighter = characters[id];
          const originalNpc = npcs[id];
          if (fighter && originalNpc && !originalNpc.npcSourceCharacterId) {
            npcs[id] = { ...originalNpc, current: fighter.current };
            delete characters[id];
          }
        }

        set({
          characters,
          npcs,
          combatNpcIds: [],
          combatActive: false,
          combatParticipants: [],
          combatXpParticipants: [],
          combatOrder: [],
          combatTurnIndex: 0,
          combatRound: 0,
          attackerId: null,
          combatEnemies: {},
          combatStatusEffects: [],
          combatPassiveState: emptyPassiveState(),
          combatArena: get().combatArena,
          defenderId: null,
          pendingCounter: null,
        });
      },

      applyCombatStatusEffect: (effectId, targetId, options = {}) => {
        const s = get();
        if (!s.combatActive || s.combatMode !== "normal") return false;
        if (!s.combatParticipants.includes(targetId)) return false;
        const target = s.characters[targetId] ?? s.combatEnemies[targetId];
        const definition = STATUS_EFFECTS[effectId];
        if (!target || target.current.hp <= 0 || !definition) return false;

        // CLEAN_IMMUNITY_NORMAL_COMBAT
        const hasCleanImmunity = s.combatStatusEffects.some(
          (effect) =>
            effect.targetId === targetId &&
            effect.id === "clean" &&
            (effect.duration === null || (effect.duration ?? 0) > 0)
        );
        if (hasCleanImmunity && definition.category === "debuff") {
          set({
            combatLog: [...s.combatLog, {
              id: uid("log"),
              at: Date.now(),
              kind: "system",
              text: `${target.name} está protegido contra debuffs por Limpeza.`,
            }],
          });
          return false;
        }

        const targetChar = s.characters[targetId];
        if (targetChar && definition.category === "debuff") {
          const faeRoll = raceFaeOnNegativeStatus(targetChar);
          if (faeRoll === "convert_to_buff") {
            set({
              combatLog: [{
                id: uid("lg"),
                at: Date.now(),
                kind: "passive",
                text: `${targetChar.name}: Sorte Feérica — debuff anulado/convertido`,
              }, ...s.combatLog].slice(0, 80),
            });
            return false;
          }
          const reaction = raceOnNegativeStatus(targetChar);
          if (reaction === "ignore") {
            set({
              combatLog: [{
                id: uid("lg"),
                at: Date.now(),
                kind: "passive" as const,
                text: `${targetChar.name}: Injustiça Benigna — efeito ignorado`,
              }, ...s.combatLog].slice(0, 80),
            });
            return false;
          }
          if (reaction === "reflect" && options.sourceId) {
            // aplica no source em vez do alvo
            return get().applyCombatStatusEffect(effectId, options.sourceId, {
              ...options,
              sourceId: targetId,
            });
          }
        }

        const existing = s.combatStatusEffects.find(
          (effect) => effect.id === effectId && effect.targetId === targetId
        );
        const requestedStacks = Math.max(1, Math.floor(options.stacks ?? 1));
        const stacks = Math.min(
          definition.maxStacks ?? Number.MAX_SAFE_INTEGER,
          (existing?.stacks ?? 0) + requestedStacks
        );
        let duration = options.duration === undefined
          ? (existing?.duration ?? 1)
          : options.duration;
        if (targetChar && definition.category === "debuff") {
          const adapted = raceAdaptStatusDuration(
            s.combatPassiveState,
            targetChar,
            effectId,
            duration,
          );
          duration = adapted.duration;
          if (adapted.note) {
            set({
              combatPassiveState: s.combatPassiveState,
              combatLog: [{
                id: uid("lg"),
                at: Date.now(),
                kind: "passive" as const,
                text: `${targetChar.name}: ${adapted.note}`,
              }, ...get().combatLog].slice(0, 80),
            });
          }
        }

        const nextEffects = existing
          ? s.combatStatusEffects.map((effect) =>
              effect.id === effectId && effect.targetId === targetId
                ? {
                    ...effect,
                    stacks,
                    duration,
                    power: options.power ?? effect.power,
                    sourceId: options.sourceId ?? effect.sourceId,
                    ...(effectId === "explosion"
                      ? {
                          initialDuration: options.duration === undefined
                            ? (effect.initialDuration ?? effect.duration ?? duration ?? 1)
                            : (duration ?? 1),
                          damageValues: effect.damageValues ?? [],
                        }
                      : {}),
                  }
                : effect
            )
          : [...s.combatStatusEffects, {
              id: effectId,
              targetId,
              sourceId: options.sourceId,
              stacks,
              duration,
              power: options.power,
              ...(effectId === "explosion" ? { initialDuration: duration ?? 1 } : {}),
            }];

        set({
          combatStatusEffects: nextEffects,
          combatLog: [...s.combatLog, {
            id: uid("log"),
            at: Date.now(),
            kind: "system",
            text: `${definition.name} aplicado em ${target.name}.`,
          }],
        });
        return true;
      },

      removeCombatStatusEffect: (effectId, targetId) => {
        set({
          combatStatusEffects: get().combatStatusEffects.filter(
            (effect) => effect.id !== effectId || effect.targetId !== targetId
          ),
        });
      },

      clearCombatStatusEffects: () => set({ combatStatusEffects: [] }),
      combatPassiveState: emptyPassiveState(),

      setWorldBoss: (id) => set({ worldBossId: id }),

      addCombatEnemy: (enemy) => {
        // addCombatEnemy joins participants
        const id = uid("enemy");
        const s = get();
        const full = { ...enemy, id };
        const combatEnemies = { ...s.combatEnemies, [id]: full };
        let combatParticipants = s.combatParticipants;
        let combatOrder = s.combatOrder;
        let combatPositions = { ...s.combatPositions };
        if (s.combatActive && !combatParticipants.includes(id)) {
          combatParticipants = [...combatParticipants, id];
          combatOrder = [...combatOrder, id];
          combatPositions[id] = { x: 14, y: Math.min(11, 2 + Object.keys(combatEnemies).length * 2) };
        }
        set({
          combatEnemies,
          combatParticipants,
          combatOrder,
          combatPositions,
          combatLog: [{
            id: uid("lg"),
            at: Date.now(),
            kind: "system",
            text: full.name + " (inimigo) adicionado ao combate.",
          }, ...s.combatLog].slice(0, 80),
        });
      },
      removeCombatEnemy: (id) => {
        const enemies = { ...get().combatEnemies };
        delete enemies[id];
        set({ combatEnemies: enemies });
      },

      updateCombatEnemySkill: (enemyId, skillId, patch) => {
        const enemy = get().combatEnemies[enemyId];
        if (!enemy) return;

        set({
          combatEnemies: {
            ...get().combatEnemies,
            [enemyId]: {
              ...enemy,
              skills: enemy.skills.map((skill) =>
                skill.id === skillId ? { ...skill, ...patch } : skill,
              ),
            },
          },
        });
      },

      removeCombatEnemySkill: (enemyId, skillId) => {
        const enemy = get().combatEnemies[enemyId];
        if (!enemy) return;

        set({
          combatEnemies: {
            ...get().combatEnemies,
            [enemyId]: {
              ...enemy,
              skills: enemy.skills.filter((skill) => skill.id !== skillId),
            },
          },
        });
      },

      selectFighter: (which, id) => {
        const state = get();
        const fighter = id ? (state.characters[id] ?? state.combatEnemies[id] ?? null) : null;
        const combatParticipants = id && fighter
          ? [...new Set([...state.combatParticipants, id])]
          : state.combatParticipants;
        const combatPositions = { ...state.combatPositions };

        if (id && fighter && !(id in combatPositions)) {
          const isEnemy = Boolean(state.combatEnemies[id]);
          const sameSideCount = combatParticipants.filter((participantId) =>
            isEnemy
              ? Boolean(state.combatEnemies[participantId])
              : Boolean(state.characters[participantId])
          ).length - 1;

          combatPositions[id] = {
            x: isEnemy ? 18 : 1,
            y: Math.min(11, 2 + Math.max(0, sameSideCount) * 2),
          };
        }

        set({
          ...(which === "attacker" ? { attackerId: id } : { defenderId: id }),
          combatParticipants,
          combatPositions,
          combatActive: true,
        });
      },

      rollCombat: (kind, skillId) => {
        const s = get();
        const atk = s.attackerId ? (s.characters[s.attackerId] ?? s.combatEnemies[s.attackerId] ?? null) : null;
        const def = s.defenderId ? (s.characters[s.defenderId] ?? s.combatEnemies[s.defenderId] ?? null) : null;
        if (!atk || !def) return;

        if (
          s.combatActive &&
          s.combatOrder.length > 0 &&
          s.combatOrder[s.combatTurnIndex] !== atk.id
        ) {
          return;
        }

        const blockingEffect = get().combatStatusEffects.find(
          (effect) =>
            effect.targetId === atk.id &&
            effect.stacks > 0 &&
            ["stun", "freeze", "immobilize"].includes(effect.id)
        );
        if (blockingEffect) {
          const effectNames: Record<string, string> = {
            stun: "Atordoamento",
            freeze: "Congelamento",
            immobilize: "Imobilização",
          };
          set({
            combatLog: [{
              id: uid("log"),
              at: Date.now(),
              kind: "system" as const,
              text: `${atk.name} não pode agir: ${effectNames[blockingEffect.id] ?? blockingEffect.id}.`,
            }, ...get().combatLog].slice(0, 80),
            pendingCounter: null,
          });
          if (!get().combatEnemies[atk.id]) get().nextTurn();
          return;
        }

        const skill = "raceId" in atk ? (skillId ? atk.skills.find((k) => k.id === skillId) : undefined) : undefined;
        const parsedSkillCommands = skill?.commandText
          ? parseSkillCommands(skill.commandText)
          : [];
        if (skill && skill.status !== "approved") return;
        if (skill && "raceId" in atk) {
          const cur = { ...atk.current };
          cur.hp -= skill.cost.hp;
          cur.mp -= skill.cost.mp;
          cur.est -= skill.cost.est;
          if (cur.hp < 0 || cur.mp < 0 || cur.est < 0) return;
          get().patchCharacter(atk.id, { current: cur });
        }
        const allyIds = s.combatParticipants.filter((id) => Boolean(s.characters[id]));
        const allyNearby =
          "raceId" in atk
            ? isAllyNearby(atk.id, s.combatPositions, allyIds)
            : false;
        const res = "raceId" in atk && "raceId" in def
          ? resolveAttack({
              attacker: atk,
              defender: def,
              kind,
              statusEffects: s.combatStatusEffects,
              skill: skill && skill.status === "approved" ? skill : null,
              allyNearby,
              passiveState: s.combatPassiveState,
            })
          : resolveEnemyAttack({
              attacker: atk,
              defender: def,
              kind,
              statusEffects: s.combatStatusEffects,
            });
        if (res.passiveState) {
          set({ combatPassiveState: res.passiveState });
        }


        // Kit de personagem (ex.: Hilak) — só se o nome casar
        if ("raceId" in atk) {
          const kitSkillId = skillId && String(skillId).startsWith("kit:")
            ? String(skillId).slice(4)
            : (skill?.name ? skill.name : skillId);
          const found = kitSkillId ? getKitSkill(atk, kitSkillId) : null;
          if (found) {
            const { kit, skill: kSkill } = found;
            // custos do kit
            const cur = { ...atk.current };
            cur.hp -= kSkill.cost.hp;
            cur.mp -= kSkill.cost.mp;
            cur.est -= kSkill.cost.est;
            if (cur.hp < 0 || cur.mp < 0 || cur.est < 0) {
              set({ combatLog: [{ id: uid("lg"), at: Date.now(), kind: "system", text: "Recursos insuficientes para "+kSkill.name }, ...get().combatLog].slice(0,80) });
              return;
            }
            get().patchCharacter(atk.id, { current: cur });
            const allyIds = get().combatParticipants.filter((id) => Boolean(get().characters[id]));
            const enemyIds = get().combatParticipants.filter((id) => Boolean(get().combatEnemies[id]));
            const logs = [];
            kit.resolveSkill(kSkill.id, {
              attacker: get().characters[atk.id],
              allyIds,
              enemyIds,
              defenderId: get().defenderId,
              passiveState: get().combatPassiveState,
              applyStatus: (effectId, targetId, options) => {
                get().applyCombatStatusEffect(effectId, targetId, { ...options, sourceId: atk.id });
              },
              damageEnemy: (enemyId, amount) => {
                const en = get().combatEnemies[enemyId];
                if (!en) return;
                const nh = Math.max(0, en.current.hp - amount);
                set({
                  combatEnemies: {
                    ...get().combatEnemies,
                    [enemyId]: { ...en, current: { ...en.current, hp: nh } },
                  },
                });
              },
              healAlly: (allyId, amount) => {
                const al = get().characters[allyId];
                if (!al) return;
                const maxHp = finalStats(al).hp;
                const heal = amount < 0 ? Math.floor(maxHp * 0.5) : amount;
                get().patchCharacter(allyId, {
                  current: { ...al.current, hp: Math.min(maxHp, al.current.hp + heal) },
                });
              },
              log: (text) => logs.push(text),
              rollDie: (sides) => rollDie(sides),
            });
            if (logs.length) {
              set({
                combatLog: [
                  ...logs.map((text) => ({ id: uid("lg"), at: Date.now(), kind: "system", text })),
                  ...get().combatLog,
                ].slice(0, 80),
                combatPassiveState: get().combatPassiveState,
              });
            }
          }
        }

        // Skill used: stacks de classe (Feiticeiro / Mago)
        if (skill && "raceId" in atk) {
          const st = get().combatPassiveState;
          if (atk.classId === "feiticeiro") {
            const r = classFeiticeiroOnSkill(st, atk);
            if (r.note) {
              set({
                combatPassiveState: st,
                combatLog: [{ id: uid("lg"), at: Date.now(), kind: "system" as const, text: r.note }, ...get().combatLog].slice(0, 80),
              });
            }
            if (r.detonate) {
              const mpLeft = Math.max(0, atk.current.mp);
              // Descontrole: dano em área = MP restante (aplicado ao defensor como simplificação)
              res.damage = Math.max(res.damage, mpLeft);
              get().patchCharacter(atk.id, { current: { ...atk.current, mp: 0 } });
            }
          }
          if (atk.classId === "mago") {
            const r = classMagoOnSkill(st, atk, atk.affinityId);
            if (r.note) {
              set({
                combatPassiveState: st,
                combatLog: [{ id: uid("lg"), at: Date.now(), kind: "system" as const, text: r.note }, ...get().combatLog].slice(0, 80),
              });
            }
          }

          if (atk.classId === "bruxo") {
            const r = classBruxoOnSkill(st, atk, skill.type==="ataque"||skill.type==="ataque-magico");
            if (r.hpCost) get().patchCharacter(atk.id,{current:{...get().characters[atk.id].current,hp:Math.max(1,get().characters[atk.id].current.hp-r.hpCost)}});
            if (r.note) set({combatPassiveState:st,combatLog:[{id:uid("lg"),at:Date.now(),kind:"passive",text:r.note},...get().combatLog].slice(0,80)});
            if (r.mult!==1) res.damage=Math.round(res.damage*r.mult);
          }
          if (atk.classId === "alquimista-sombrio") {
            const r = classAlquimistaSombrioOnSkill(st, atk, true);
            if (r.note) set({combatPassiveState:st,combatLog:[{id:uid("lg"),at:Date.now(),kind:"passive",text:r.note},...get().combatLog].slice(0,80)});
            if (r.mult!==1) res.damage=Math.round(res.damage*r.mult);
          }
          if (atk.classId === "elementalista") {
            const r = classElementalistaOnSkill(st, atk, atk.affinityId);
            if (r.note) set({combatPassiveState:st,combatLog:[{id:uid("lg"),at:Date.now(),kind:"passive",text:r.note},...get().combatLog].slice(0,80)});
            if (r.mult!==1) res.damage=Math.round(res.damage*r.mult);
          }
          if (skill.type==="suporte"||skill.type==="cura"||skill.type==="buff") {
            if (atk.classId==="clerigo") {
              const r=classClerigoOnSupport(st,atk);
              if(r.note) set({combatPassiveState:st,combatLog:[{id:uid("lg"),at:Date.now(),kind:"passive",text:r.note},...get().combatLog].slice(0,80)});
            }
            if (atk.classId==="bardo") {
              const r=classBardoOnSupport(st,atk);
              if(r.note) set({combatPassiveState:st,combatLog:[{id:uid("lg"),at:Date.now(),kind:"passive",text:r.note},...get().combatLog].slice(0,80)});
            }
            if (atk.classId==="buffer-healer") {
              const r=classBufferHealerOnSupport(st,atk);
              if(r.note) set({combatPassiveState:st,combatLog:[{id:uid("lg"),at:Date.now(),kind:"passive",text:r.note},...get().combatLog].slice(0,80)});
            }
          }

          if (atk.raceId === "vampiro") {
            const r = raceVampireOnSkill(st, atk);
            if (r.note) {
              set({
                combatPassiveState: st,
                combatLog: [{ id: uid("lg"), at: Date.now(), kind: "passive" as const, text: r.note }, ...get().combatLog].slice(0, 80),
              });
            }
          }
        }

        const burnEffects = get().combatStatusEffects
          .filter((effect) => effect.targetId === def.id && effect.id === "burn");
        const burnMultiplier = burnEffects.reduce(
          (total, effect) =>
            total + effect.stacks * ((effect.power ?? 10) / 100),
          0,
        );
        if (res.hit && res.damage > 0 && burnMultiplier > 0) {
          res.damage = Math.max(1, Math.floor(res.damage * (1 + burnMultiplier)));
        }

        if (res.hit && parsedSkillCommands.some((command) => command.damage !== null)) {
          const commandDamage = parsedSkillCommands.reduce(
            (total, command) =>
              total + ([
                "heal", "recovery", "regeneration", "lifesteal",
                "clean", "strengthening", "defender", "agile",
                "atk", "atk_mgc", "def", "res", "int", "agi",
              ].includes(command.command)
                ? 0
                : command.damage ?? 0),
            0,
          );
          res.damage += commandDamage;
        }

        const lazuliBaseDamage = res.damage;
        let lazuliDeathDamage = 0;

        if (
          res.hit &&
          lazuliBaseDamage > 0 &&
          "raceId" in atk &&
          atk.raceId === "dragonoide"
        ) {
          const effects = get().combatStatusEffects;
          const mark = effects.find(
            (effect) =>
              effect.id === "draconic-mark" &&
              effect.targetId === def.id &&
              effect.sourceId === atk.id,
          );
          const furyAlreadyActive = effects.some(
            (effect) => effect.id === "dragon-fury" && effect.targetId === atk.id,
          );
          const existing = mark
            ? {
                sourceId: atk.id,
                targetId: def.id,
                stacks: mark.stacks,
                damageValues: [...(mark.damageValues ?? [])],
              }
            : null;
          const lazuli = registerLazuliHit({
            existing,
            sourceId: atk.id,
            targetId: def.id,
            finalDamage: lazuliBaseDamage,
            furyAlreadyActive,
          });
          lazuliDeathDamage = lazuli.deathDamage;

          let nextEffects = effects.filter(
            (effect) =>
              !(
                effect.id === "draconic-mark" &&
                effect.targetId === def.id &&
                effect.sourceId === atk.id
              ),
          );
          if (lazuli.mark) {
            nextEffects = [
              ...nextEffects,
              {
                id: "draconic-mark",
                targetId: def.id,
                sourceId: atk.id,
                stacks: lazuli.mark.stacks,
                duration: null,
                damageValues: lazuli.mark.damageValues,
              },
            ];
          }
          if (lazuli.triggerFury) {
            nextEffects = [
              ...nextEffects,
              {
                id: "dragon-fury",
                targetId: atk.id,
                sourceId: atk.id,
                stacks: 1,
                duration: null,
                // afinidade Fogo temporária (preserva original do personagem)
                power: 1,
              },
            ];
          }
          set({ combatStatusEffects: nextEffects });
          if (lazuli.note) {
            res.log.push({
              id: uid("lg"),
              at: Date.now(),
              kind: "passive",
              text: lazuli.note.includes("Efeito da Morte")
                ? `${lazuli.note} contra ${def.name}.`
                : `Lazuli: ${def.name} recebe a Marca Dracônica (${lazuli.mark?.stacks ?? 0}/5).`,
            });
          }
          if (lazuli.triggerFury) {
            res.log.push({
              id: uid("lg"),
              at: Date.now(),
              kind: "passive",
              text: `Lazuli — Fúria do Dragão: ${atk.name} recebe +2 em todos os atributos e afinidade Fogo temporária até o fim da batalha.`,
            });
          }
        }

        // O Efeito da Morte soma dano extra sem contar esse extra como uma nova marca.
        res.damage = lazuliBaseDamage + lazuliDeathDamage;

        if (res.hit && res.damage > 0) {
          if ("raceId" in def) {
            // Tank Muralha: 50% antes de applyDamage (qualquer fonte de dano no aliado)
            const positions = get().combatPositions;
            const defPos = positions[def.id] ?? null;
            const tankCandidates = Object.values(get().characters)
              .filter((c) => c.classId === "tank")
              .map((c) => {
                const p = positions[c.id];
                return {
                  id: c.id,
                  hp: c.current.hp,
                  x: p?.x ?? 99,
                  y: p?.y ?? 99,
                };
              });
            const share = computeTankShare({
              damage: res.damage,
              defenderId: def.id,
              tanks: tankCandidates,
              defenderPos: defPos,
            });
            let damageToDef = share.damageToDef;
            let tankShare = share.tankShare;
            let tankIdShare: string | null = share.tankId;

            const hpBefore = def.current.hp;
            const applied = applyDamage(def, damageToDef);
            {
              const dealt = Math.max(0, hpBefore - applied.ch.current.hp);
              const maxHp = "raceId" in def ? finalStats(def).hp : ((def as { stats?: { hp: number } }).stats?.hp ?? hpBefore);
              res.log.push({
                id: uid("lg"),
                at: Date.now(),
                kind: dealt > 0 ? "hit" : "miss",
                text: dealt > 0
                  ? def.name + " sofreu " + dealt + " de dano · HP " + hpBefore + " → " + applied.ch.current.hp + "/" + maxHp
                  : def.name + " nao perdeu HP (dano 0/bloqueado)",
              });
            }
            if (applied.survivedAt1 || applied.note) {
              res.log.push({
                id: uid("lg"),
                at: Date.now(),
                kind: "passive",
                text: applied.note ?? `${def.name} permanece com 1 HP (Criação Indesejada).`,
              });
            }
            if ((applied as { stunnedNotDead?: boolean }).stunnedNotDead) {
              get().applyCombatStatusEffect("stun", def.id, { duration: 2, sourceId: atk.id });
            }
            {
              const maxHp = finalStats(def).hp;
              const note = raceAfterDamageTaken(
                get().combatPassiveState,
                def,
                maxHp,
                hpBefore,
                applied.ch.current.hp,
              );
              if (note) {
                res.log.push({
                  id: uid("lg"),
                  at: Date.now(),
                  kind: "passive",
                  text: `${def.name}: ${note}`,
                });
                set({ combatPassiveState: get().combatPassiveState });
              }
              if ("raceId" in def && def.raceId === "umbral") {
                const umbralNote = raceUmbralCheckForm(
                  get().combatPassiveState,
                  applied.ch,
                  maxHp,
                  hpBefore,
                  applied.ch.current.hp,
                );
                if (umbralNote) {
                  res.log.push({
                    id: uid("lg"),
                    at: Date.now(),
                    kind: "passive",
                    text: `${def.name}: ${umbralNote}`,
                  });
                  set({ combatPassiveState: get().combatPassiveState });
                }
              }
            }
            
            
            {
              const mirNote = (res.notes || []).find((n) => String(n).startsWith("MIRROR_REFLECT:"));
              if (mirNote && atk && "raceId" in atk) {
                const amt = Math.max(1, parseInt(String(mirNote).split(":")[1], 10) || 1);
                const appliedM = applyDamage(atk, amt);
                get().patchCharacter(atk.id, { current: appliedM.ch.current });
                res.log.push({ id: uid("lg"), at: Date.now(), kind: "passive", text: def.name+": Espelho devolve "+amt+" em "+atk.name });
              }
            }
            if ("raceId" in def && def.raceId === "kitsune") {
              const kt = raceKitsuneOnDamageTaken(get().combatPassiveState, applied.ch, Math.max(0, hpBefore - applied.ch.current.hp));
              for (const n of kt.notes) res.log.push({ id: uid("lg"), at: Date.now(), kind: "passive", text: def.name+": "+n });
              if (kt.releaseDamage > 0) {
                const enemies = get().combatParticipants.filter((pid) => {
                  if (pid === def.id) return false;
                  const en = get().combatEnemies[pid];
                  const ch = get().characters[pid];
                  // inimigos de combate OU personagens do "outro lado" simplificado: todos com hp>0 que não sejam a kitsune
                  if (en && en.current.hp > 0) return true;
                  if (ch && ch.current.hp > 0 && ch.id !== def.id) {
                    // se for combate PvE, combatEnemies cobre; em PvP hit nos outros participantes exceto aliados próximos é difícil — usa enemies map
                    return false;
                  }
                  return false;
                });
                const list = enemies.length ? enemies : Object.keys(get().combatEnemies).filter((pid) => (get().combatEnemies[pid]?.current.hp ?? 0) > 0);
                if (list.length) {
                  const each = Math.max(1, Math.floor(kt.releaseDamage / list.length));
                  for (const pid of list) {
                    const en = get().combatEnemies[pid];
                    if (en) {
                      const nh = Math.max(0, en.current.hp - each);
                      get().removeCombatEnemy && null;
                      set({
                        combatEnemies: {
                          ...get().combatEnemies,
                          [pid]: { ...en, current: { ...en.current, hp: nh } },
                        },
                      });
                      res.log.push({ id: uid("lg"), at: Date.now(), kind: "passive", text: def.name+": Cauda → "+en.name+" -"+each });
                    }
                  }
                } else {
                  res.log.push({ id: uid("lg"), at: Date.now(), kind: "passive", text: def.name+": Caudas liberam "+kt.releaseDamage+" (sem alvos)" });
                }
              }
              set({ combatPassiveState: get().combatPassiveState });
            }
            if ("raceId" in def && def.raceId === "doppelganger") {
              const dnote = raceDoppelCheckDesperation(get().combatPassiveState, applied.ch, maxHp);
              if (dnote) res.log.push({ id: uid("lg"), at: Date.now(), kind: "passive", text: def.name+": "+dnote });
            }

            get().patchCharacter(def.id, { current: applied.ch.current });
            // Paladino / Domador / Marionete share
            {
              const st = get().combatPassiveState;
              const dealt = Math.max(0, (typeof hpBefore==="number"?hpBefore:0) - applied.ch.current.hp);
              for (const pid of get().combatParticipants) {
                const pc = get().characters[pid];
                if (!pc || pc.current.hp<=0) continue;
                if (pc.classId==="paladino") {
                  const sh = classPaladinoShareDamage(st, pid, def.id, dealt);
                  if (sh.share>0) {
                    const p2 = applyDamage(pc, sh.share);
                    get().patchCharacter(pid,{current:p2.ch.current});
                    res.log.push({id:uid("lg"),at:Date.now(),kind:"passive",text:pc.name+" assume "+sh.share+" (Juramento)"});
                    if (sh.note) res.log.push({id:uid("lg"),at:Date.now(),kind:"passive",text:pc.name+": "+sh.note});
                  }
                }
                if (pc.classId==="domador") {
                  const sh = classDomadorShareDamage(st, pid, dealt);
                  if (sh.share>0 && sh.creatureId) {
                    const cr = get().characters[sh.creatureId]||get().combatEnemies[sh.creatureId];
                    // log only if creature exists
                    res.log.push({id:uid("lg"),at:Date.now(),kind:"passive",text:pc.name+" Laço: "+sh.share+" → vínculo"});
                  }
                }
                if (pc.classId==="mestre-de-marionetes" && pid===atk.id) {
                  const sh = classMarioneteShareToLinked(st, pid, dealt);
                  if (sh.share>0) res.log.push({id:uid("lg"),at:Date.now(),kind:"passive",text:pc.name+" Fios: "+sh.share+" → alvo vinculado"});
                }
              }
            }

            if (tankIdShare && tankShare > 0) {
              const tank = get().characters[tankIdShare];
              if (tank) {
                const tankApplied = applyDamage(tank, tankShare);
                get().patchCharacter(tankIdShare, { current: tankApplied.ch.current });
                res.log.push({
                  id: uid("lg"),
                  at: Date.now(),
                  kind: "passive",
                  text: `${tank.name} (Muralha) assume ${tankShare} de dano de ${def.name}`,
                });
              }
            }

            // Vampiro: lifesteal 50% só com Blood máx + alvo sangrando (sobre dano total)
            if ("raceId" in atk && atk.raceId === "vampiro") {
              const bleeding = get().combatStatusEffects.some(
                (e) => e.targetId === def.id && e.id === "bleeding" && e.stacks > 0,
              );
              const mult = raceVampireLifestealMult(get().combatPassiveState, atk.id, bleeding);
              if (mult > 0) {
                const heal = Math.ceil(res.damage * mult);
                const maxHp = finalStats(atk).hp;
                const cur = get().characters[atk.id];
                if (cur) {
                  get().patchCharacter(atk.id, {
                    current: {
                      ...cur.current,
                      hp: Math.min(maxHp, cur.current.hp + heal),
                    },
                  });
                  res.log.push({
                    id: uid("lg"),
                    at: Date.now(),
                    kind: "passive",
                    text: `${atk.name}: Blood Hugh rouba ${heal} HP (requer sangramento)`,
                  });
                }
              }
            }

            if (res.applyBlind) {
              get().applyCombatStatusEffect("blind", def.id, { duration: 1, sourceId: atk.id });
            }

            {
              const st = get().combatPassiveState;
              const maybe = raceDoppelTryRestore(st, get().characters[def.id] ?? applied.ch);
              if (maybe) {
                get().patchCharacter(def.id, {
                  raceId: maybe.restored.raceId,
                  classId: maybe.restored.classId,
                  affinityId: maybe.restored.affinityId,
                  allocated: maybe.restored.allocated,
                  current: maybe.restored.current,
                  skills: maybe.restored.skills,
                });
                set({
                  combatPassiveState: st,
                  combatLog: [{
                    id: uid("lg"),
                    at: Date.now(),
                    kind: "passive" as const,
                    text: maybe.note,
                  }, ...get().combatLog].slice(0, 80),
                });
              }
            }
          } else {
            const enemy = get().combatEnemies[s.defenderId!];
            if (enemy) {
              set({
                combatEnemies: {
                  ...get().combatEnemies,
                  [enemy.id]: {
                    ...enemy,
                    current: { ...enemy.current, hp: Math.max(0, enemy.current.hp - res.damage) },
                  },
                },
              });
            }
          }
        }

        // NORMAL_COMBAT_EXPLOSION_TRIGGER: resolvido pelo fim da duração em nextTurn.

        // LIFESTEAL_ACTIVE_NORMAL_COMBAT
        if (res.hit && res.damage > 0) {
          const activeLifesteal = get().combatStatusEffects.find(
            (effect) => effect.id === "lifesteal" && effect.targetId === atk.id
          );
          if (activeLifesteal) {
            const character = get().characters[atk.id];
            if (character) {
              const maxHp = finalStats(character).hp;
              const percent = Math.max(1, Math.min(100, activeLifesteal.power ?? 10));
              const healing = Math.ceil(lazuliBaseDamage * percent / 100);
              get().patchCharacter(atk.id, {
                current: {
                  ...character.current,
                  hp: Math.min(maxHp, character.current.hp + healing),
                },
              });
            }
          }
        }

        /* SKILL_EFFECTS_NORMAL_COMBAT */
        /* SKILL_RECOVERY_AND_CLEAN */
        const commandEffects: NonNullable<typeof skill>["effects"] =
          parsedSkillCommands.map((command) => {
            const effectId = command.operation ?? command.command;
            return {
              effectId,
              stacks: command.stacks,
              percent: command.percent ?? undefined,
              duration: command.duration ?? undefined,
              chance: 100,
              target: [
                "heal", "recovery", "regeneration", "lifesteal",
                "clean", "strengthening", "defender", "agile",
                "atk", "atk_mgc", "def", "res", "int", "agi",
              ].includes(effectId) ? "attacker" : "defender",
            };
          });

        const runtimeEffects = [...(skill?.effects ?? []), ...(commandEffects ?? [])];
        const appliesWithoutHit =
          skill?.type === "buff" ||
          skill?.type === "heal" ||
          parsedSkillCommands.some((command) =>
            ["heal", "recovery", "regeneration", "lifesteal", "clean",
             "strengthening", "defender", "agile", "atk", "atk_mgc",
             "def", "res", "int", "agi"].includes(command.command)
          );

        if (runtimeEffects.length && (res.hit || appliesWithoutHit)) {
          for (const effect of runtimeEffects) {
            if (!effect.effectId) continue;
            const definition = STATUS_EFFECTS[effect.effectId];
            if (!definition) continue;

            const chance = Math.max(0, Math.min(100, effect.chance ?? 100));
            if (Math.random() * 100 >= chance) continue;

            const isSelfTarget = effect.target === "attacker";
            const canApplyOnMiss =
              isSelfTarget ||
              (!effect.target && (skill?.type === "buff" || skill?.type === "heal"));

            if (!res.hit && !canApplyOnMiss) continue;

            const targetId = isSelfTarget ? atk.id : def.id;

            if (effect.effectId === "heal") {
              const character = get().characters[targetId];
              if (character) {
                const maxHp = finalStats(character).hp;
                const percent = normalizeSkillPercent(effect.percent ?? effect.stacks, 10);
                const seal = raceHealReceivedMult(get().combatPassiveState, targetId);
                const rawHeal = Math.ceil(maxHp * percent / 100);
                const healAmt = Math.max(0, Math.floor(rawHeal * seal.mult));
                get().patchCharacter(targetId, {
                  current: {
                    ...character.current,
                    hp: Math.min(maxHp, character.current.hp + healAmt),
                  },
                });
                if (seal.note && healAmt < rawHeal) {
                  set({
                    combatLog: [{
                      id: uid("lg"),
                      at: Date.now(),
                      kind: "passive" as const,
                      text: `${character.name}: ${seal.note}`,
                    }, ...get().combatLog].slice(0, 80),
                  });
                }
              }
              continue;
            }
            if (effect.effectId === "clean") {
              const removable = get().combatStatusEffects.filter((entry) =>
                entry.targetId === targetId &&
                entry.id !== "clean" &&
                STATUS_EFFECTS[entry.id]?.category === "debuff"
              );
              for (const entry of removable) {
                get().removeCombatStatusEffect(entry.id, targetId);
              }
              get().applyCombatStatusEffect("clean", targetId, {
                sourceId: atk.id,
                stacks: 1,
                duration: effect.duration ?? 1,
              });
              continue;
            }

            if (effect.effectId === "lifesteal") {
              get().applyCombatStatusEffect("lifesteal", targetId, {
                sourceId: atk.id,
                stacks: 1,
                duration: effect.duration ?? skill?.duration ?? 1,
              });
              const currentEffects = get().combatStatusEffects;
              set({
                combatStatusEffects: currentEffects.map((entry) =>
                  entry.id === "lifesteal" && entry.targetId === targetId
                    ? { ...entry, power: normalizeSkillPercent(effect.percent ?? effect.stacks, 10) }
                    : entry
                ),
              });
              continue;
            }

            get().applyCombatStatusEffect(effect.effectId, targetId, {
              sourceId: atk.id,
              stacks: effect.stacks,
              duration: effect.duration ?? skill?.duration,
              power: effect.percent == null
                ? undefined
                : normalizeSkillPercent(effect.percent),
            });


            if (["recovery", "regeneration"].includes(effect.effectId)) {
              const currentEffects = get().combatStatusEffects;
              set({
                combatStatusEffects: currentEffects.map((entry) =>
                  entry.id === effect.effectId && entry.targetId === targetId
                    ? { ...entry, power: normalizeSkillPercent(effect.percent ?? effect.stacks, 10) }
                    : entry
                ),
              });
            }
          }
        }

        const defeatedCharacter = get().characters[def.id];
        const defeatedEnemy = get().combatEnemies[def.id];

        const defeatedId =
          defeatedCharacter && defeatedCharacter.current.hp <= 0
            ? def.id
            : defeatedEnemy && defeatedEnemy.current.hp <= 0
              ? def.id
              : null;

        if (defeatedId) {
          {
            const killer = get().characters[atk.id];
            const st = get().combatPassiveState;
            if (killer?.classId === "ceifador") {
              const r = classCeifadorOnKill(res.damage||0);
              if (r.healPool) {
                for (const pid of get().combatParticipants) {
                       const ally = get().characters[pid];
                  if (!ally || ally.current.hp<=0) continue;
                  const maxHp = finalStats(ally).hp;
                  const heal = Math.max(1, Math.floor(r.healPool / Math.max(1,get().combatParticipants.filter(id=>get().characters[id]?.current.hp>0).length)));
                  get().patchCharacter(pid,{current:{...ally.current,hp:Math.min(maxHp,ally.current.hp+heal)}});
                }
                set({combatLog:[{id:uid("lg"),at:Date.now(),kind:"passive",text:killer.name+": "+r.note},...get().combatLog].slice(0,80)});
              }
            }
            if (killer?.classId === "necromante") {
              const r = classNecromanteOnKill(st, killer);
              if (r.note) set({combatPassiveState:st,combatLog:[{id:uid("lg"),at:Date.now(),kind:"passive",text:killer.name+": "+r.note},...get().combatLog].slice(0,80)});
            }
          }
          const nextParticipants = get().combatParticipants.filter(
            (id) => id !== defeatedId,
          );
          const nextOrder = get().combatOrder.filter(
            (id) => id !== defeatedId,
          );
          const nextPositions = { ...get().combatPositions };
          delete nextPositions[defeatedId];

          set({
            combatParticipants: nextParticipants,
            combatOrder: nextOrder,
            combatPositions: nextPositions,
            defenderId: null,
          });
        }

        const remainingPlayers = get().combatParticipants.filter(
          (id) =>
            Boolean(get().characters[id]) &&
            get().characters[id].current.hp > 0,
        );

        const remainingEnemies = get().combatParticipants.filter(
          (id) =>
            Boolean(get().combatEnemies[id]) &&
            get().combatEnemies[id].current.hp > 0,
        );

        const combatFinished =
          Boolean(defeatedId) &&
          (
            remainingPlayers.length === 0 ||
            remainingEnemies.length === 0
          );

        if (combatFinished) {
          set({
            combatActive: false,
            combatParticipants: [],
            combatOrder: [],
            combatPositions: {},
            attackerId: null,
            defenderId: null,
            pendingCounter: null,
            combatStatusEffects: [],
            combatPassiveState: emptyPassiveState(),
            combatLog: [
              {
                id: uid("lg"),
                at: Date.now(),
                kind: "system" as const,
                text:
                  remainingPlayers.length === 0
                    ? "Combate encerrado: todos os jogadores foram derrotados."
                    : "Combate encerrado: todos os inimigos foram derrotados.",
              },
              ...get().combatLog,
            ].slice(0, 80),
          });

          return;
        }

        set({
          lastRoll: {
            sides: 20,
            value: res.attackerRoll,
            attacker: res.attackerRoll,
            defender: res.defenderRoll,
            label: `${atk.name} vs ${def.name}`,
          },
          combatLog: [...res.log, ...s.combatLog].slice(0, 80),
          pendingCounter:
            res.counterAvailable && !defeatedCharacter && !defeatedEnemy
              ? { defenderId: def.id, attackerId: atk.id }
              : null,
          tab: "combate",
        });

        if (s.combatEnemies[atk.id] && !res.counterAvailable) {
          get().nextTurn();
        }
      },

      attemptEscape: (characterId) => {
        const s = get();

        if (!s.combatActive) return;
        if (!s.combatParticipants.includes(characterId)) return;
        if (!s.characters[characterId]) return;

        const enemyId =
          s.defenderId && s.combatEnemies[s.defenderId]
            ? s.defenderId
            : s.combatParticipants.find((id) => Boolean(s.combatEnemies[id]));

        if (!enemyId) return;

        const enemy = s.combatEnemies[enemyId];

        if (enemy.kind === "boss" && !s.allowBossEscape) {
          set({
            combatLog: [
              ...s.combatLog,
              {
                id: uid("lg"),
                at: Date.now(),
                kind: "system" as const,
                text: "Fuga bloqueada: o Mestre não permite fuga contra Boss.",
              },
            ],
          });
          return;
        }

        const playerRoll = rollDie(100);
        const enemyRoll = rollDie(100);
        const success = playerRoll > enemyRoll;

        const nextParticipants = success
          ? s.combatParticipants.filter((id) => id !== characterId)
          : s.combatParticipants;

        const nextOrder = success
          ? s.combatOrder.filter((id) => id !== characterId)
          : s.combatOrder;

        const nextPositions = { ...s.combatPositions };

        if (success) {
          delete nextPositions[characterId];
        }

        const nextTurnIndex = success
          ? Math.min(s.combatTurnIndex, Math.max(0, nextOrder.length - 1))
          : s.combatTurnIndex;

        const nextAttackerId =
          success && s.attackerId === characterId
            ? (nextOrder[nextTurnIndex] ?? null)
            : s.attackerId;

        const nextDefenderId =
          success && s.defenderId === characterId
            ? (nextOrder.find((id) => id !== nextAttackerId) ?? null)
            : s.defenderId;

        set({
          combatParticipants: nextParticipants,
          combatOrder: nextOrder,
          combatTurnIndex: nextTurnIndex,
          combatPositions: nextPositions,
          attackerId: nextAttackerId,
          defenderId: nextDefenderId,
          pendingCounter: null,
          combatLog: [
            ...s.combatLog,
            {
              id: uid("lg"),
              at: Date.now(),
              kind: success ? "system" as const : "miss" as const,
              text: success
                ? `${s.characters[characterId].name} tenta fugir: D100 = ${playerRoll} contra D100 = ${enemyRoll}. Fuga bem-sucedida.`
                : `${s.characters[characterId].name} tenta fugir: D100 = ${playerRoll} contra D100 = ${enemyRoll}. Fuga falhou.`,
            },
          ],
        });
      },

      resolveCounter: (mode) => {
        const s = get();
        if (!s.pendingCounter) return;

        const def = s.characters[s.pendingCounter.defenderId];
        const atk =
          s.characters[s.pendingCounter.attackerId] ??
          s.combatEnemies[s.pendingCounter.attackerId];

        if (!def || !atk) {
          set({ pendingCounter: null });
          return;
        }

        if (mode === "defend") {
          set({
            pendingCounter: null,
            combatLog: [
              {
                id: uid("lg"),
                at: Date.now(),
                kind: "counter" as const,
                text: `${def.name} esquiva / defende (0 EST).`,
              },
              ...s.combatLog,
            ],
          });
          return;
        }

        if (def.current.est < 3) return;

        get().patchCharacter(def.id, {
          current: { ...def.current, est: def.current.est - 3 },
        });

        const res = "raceId" in atk
          ? resolveAttack({
              attacker: get().characters[def.id],
              defender: atk,
              kind: "physical",
            })
          : resolveEnemyAttack({
              attacker: get().characters[def.id],
              defender: atk,
              kind: "physical",
            });

        if (res.hit && res.damage > 0) {
          if ("raceId" in atk) {
            const applied = applyDamage(atk, res.damage);
            get().patchCharacter(atk.id, { current: applied.ch.current });
          } else {
            const enemy = get().combatEnemies[s.pendingCounter.attackerId];

            if (enemy) {
              set({
                combatEnemies: {
                  ...get().combatEnemies,
                  [enemy.id]: {
                    ...enemy,
                    current: {
                      ...enemy.current,
                      hp: Math.max(0, enemy.current.hp - res.damage),
                    },
                  },
                },
              });
            }
          }
        }

        set({
          pendingCounter: null,
          combatLog: [
            {
              id: uid("lg"),
              at: Date.now(),
              kind: "counter" as const,
              text: `${def.name} contra-ataca (−3 EST, sem crítico).`,
            },
            ...res.log,
            ...s.combatLog,
          ].slice(0, 80),
        });
      },

      rollLoose: (sides) => {
        const value = 1 + Math.floor(Math.random() * sides);
        const self = get().selfId ? get().characters[get().selfId!] : null;
        set({
          lastRoll: {
            sides,
            value,
            attacker: value,
            defender: 0,
            label: `${self?.name ?? "Mesa"} · D${sides}`,
          },
          combatLog: [
            {
              id: uid("lg"),
              at: Date.now(),
              kind: "roll" as const,
              text: `${self?.name ?? "Mesa"} rola D${sides} = ${value}.`,
            },
            ...get().combatLog,
          ].slice(0, 80),
          tab: "combate",
        });
      },

      setCombatXpAward: (n) => set({ combatXpAward: Math.max(0, n) }),
      awardCombatXp: () => {
        const s = get();

        s.combatXpParticipants.forEach((id) => {
          if (s.characters[id]) {
            s.grantXp(id, s.combatXpAward);
          }
        });

        set({
          combatXpParticipants: [],
          combatLog: [
            {
              id: uid("lg"),
              at: Date.now(),
              kind: "xp" as const,
              text: `O Mestre concede ${s.combatXpAward} XP de combate a todos os personagens na mesa.`,
            },
            ...s.combatLog,
          ],
        });
      },

      sendChat: (text) => {
        const t = text.trim();
        if (!t) return;
        const self = get().selfId ? get().characters[get().selfId!] : null;
        set({
          chat: [
            ...get().chat,
            {
              id: uid("msg"),
              from: self?.name ?? (get().role === "mestre" ? "Mestre" : "Jogador"),
              fromId: get().selfId ?? "anon",
              text: t,
              at: Date.now(),
            },
          ].slice(-80),
        });
      },

      buyMysteryBox: () => {
        const id = get().selfId;
        if (!id) return;
        const ch = get().characters[id];
        if (!ch) return;
        let sil = ch.currency.silver;
        let gold = ch.currency.gold;
        if (sil >= 40) sil -= 40;
        else if (gold > 0) {
          gold -= 1;
          sil += 105;
        } else return;
        const loot = [
          {
            name: "Poção menor",
            desc: "Recupera 8 HP.",
            tier: "basic" as const,
            price: 30,
          },
          {
            name: "Pó de prata",
            desc: "Material alquímico.",
            tier: "basic" as const,
            price: 30,
          },
          {
            name: "Adaga gasta",
            desc: "Arma simples. +1 ATK.",
            slot: "arma" as const,
            tier: "basic" as const,
            price: 30,
            bonus: { atk: 1 },
          },
          {
            name: "Amuleto opaco",
            desc: "Colar sem afinidade. +3 HP e +3 MP.",
            slot: "colar" as const,
            tier: "basic" as const,
            price: 30,
            bonus: { hp: 3, mp: 3 },
          },
        ][Math.floor(Math.random() * 4)];
        get().patchCharacter(id, {
          currency: { ...ch.currency, silver: sil, gold },
          inventory: [
            ...ch.inventory,
            {
              ...loot,
              id: uid("it"),
              name: loot.name,
              desc: loot.desc,
              qty: 1,
              slot: "slot" in loot ? loot.slot : undefined,
            },
          ],
        });
      },

      equipItem: (itemId) => {
        const id = get().selfId;
        if (!id) return;

        const ch = get().characters[id];
        if (!ch) return;

        const item = ch.inventory.find((i) => i.id === itemId);
        if (!item?.slot) return;

        const equipment = { ...ch.equipment };
        const previous = equipment[item.slot];

        // Se já existe um item nesse slot, ele volta para a mochila.
        const inventory = ch.inventory
          .filter((i) => i.id !== itemId)
          .concat(previous ? [previous] : []);

        equipment[item.slot] = item;

        get().patchCharacter(id, {
          equipment,
          inventory,
        });
      },

      unequipItem: (slot) => {
        const id = get().selfId;
        if (!id) return;

        const ch = get().characters[id];
        if (!ch) return;

        const item = ch.equipment[slot];
        if (!item) return;

        const equipment = { ...ch.equipment };
        delete equipment[slot];

        get().patchCharacter(id, {
          equipment,
          inventory: [...ch.inventory, item],
        });
      },
      useItem: (itemId) => {
        const id = get().selfId;
        if (!id) return;
        const ch = get().characters[id];
        if (!ch) return;

        const item = ch.inventory.find((entry) => entry.id === itemId);
        if (!item || item.qty < 1) return;

        const match = item.effect?.match(/^potion:(hp|mp|est|san):(\d+)$/i);
        if (!match) return;

        const stat = match[1].toLowerCase() as "hp" | "mp" | "est" | "san";
        const amount = Math.max(0, Number(match[2]) || 0);
        if (amount <= 0) return;

        const maximum = finalStats(ch)[stat];
        const currentValue = ch.current[stat];
        const recovered = Math.min(amount, Math.max(0, maximum - currentValue));
        if (recovered <= 0) return;

        const inventory = ch.inventory
          .map((entry) => entry.id === itemId
            ? { ...entry, qty: entry.qty - 1 }
            : entry)
          .filter((entry) => entry.qty > 0);

        get().patchCharacter(id, {
          current: { ...ch.current, [stat]: currentValue + recovered },
          inventory,
        });
      },

      discardItem: (itemId) => {
        const id = get().selfId;
        if (!id) return;
        const ch = get().characters[id];
        if (!ch) return;
        const inventory = ch.inventory.filter((item) => item.id !== itemId);
        get().patchCharacter(id, { inventory });
      },

      grantItem: (characterId, item) => {
        // grantItem supports npc
        const s = get();
        const ch = s.characters[characterId] ?? s.npcs[characterId];
        if (!ch) return;

        const inventory = [...ch.inventory];

        const existing = inventory.find(
          (invItem) => invItem.id === item.id,
        );

        if (existing) {
          existing.qty += Math.max(1, item.qty);
        } else {
          inventory.push({
            ...item,
            qty: Math.max(1, item.qty),
          });
        }

                if (get().characters[characterId]) get().patchCharacter(characterId, { inventory });
        if (get().npcs[characterId]) get().updateNpc(characterId, { inventory });
        // sync combat copy
        if (get().characters[characterId] && get().npcs[characterId]) {
          const s3 = get();
          set({ npcs: { ...s3.npcs, [characterId]: { ...s3.npcs[characterId], inventory } } });
        }

      },
      equipItemFor: (characterId, itemId) => {
        const s = get();
        const ch = s.characters[characterId] ?? s.npcs[characterId];
        if (!ch) return;
        const item = ch.inventory.find((i) => i.id === itemId);
        if (!item || !item.slot) return;
        const equipment = { ...ch.equipment };
        const previous = equipment[item.slot];
        const inventory = ch.inventory.filter((i) => i.id !== itemId).concat(previous ? [previous] : []);
        equipment[item.slot] = item;
        if (s.characters[characterId]) get().patchCharacter(characterId, { equipment, inventory });
        if (s.npcs[characterId]) get().updateNpc(characterId, { equipment, inventory });
      },

      unequipItemFor: (characterId, slot) => {
        const s = get();
        const ch = s.characters[characterId] ?? s.npcs[characterId];
        if (!ch) return;
        const item = ch.equipment[slot];
        if (!item) return;
        const equipment = { ...ch.equipment };
        delete equipment[slot];
        const inventory = [...ch.inventory, item];
        if (s.characters[characterId]) get().patchCharacter(characterId, { equipment, inventory });
        if (s.npcs[characterId]) get().updateNpc(characterId, { equipment, inventory });
      },

      useItemFor: (characterId, itemId) => {
        const s = get();
        const ch = s.characters[characterId] ?? s.npcs[characterId];
        if (!ch) return;
        const item = ch.inventory.find((entry) => entry.id === itemId);
        if (!item || item.qty < 1) return;
        const match = item.effect && item.effect.match(/^potion:(hp|mp|est|san):(\d+)$/i);
        if (!match) return;
        const stat = match[1].toLowerCase();
        const amount = Math.max(0, Number(match[2]) || 0);
        if (amount <= 0) return;
        const maximum = finalStats(ch)[stat];
        const currentValue = ch.current[stat];
        const recovered = Math.min(amount, Math.max(0, maximum - currentValue));
        if (recovered <= 0) return;
        const inventory = ch.inventory.map((entry) => entry.id === itemId ? { ...entry, qty: entry.qty - 1 } : entry).filter((entry) => entry.qty > 0);
        const current = { ...ch.current, [stat]: currentValue + recovered };
        if (s.characters[characterId]) get().patchCharacter(characterId, { current, inventory });
        if (s.npcs[characterId]) get().updateNpc(characterId, { current, inventory });
      },

      restoreVitals: (characterId) => {
        const s = get();
        const ch = s.characters[characterId] ?? s.npcs[characterId];
        if (!ch) return;
        const st = finalStats(ch);
        const current = { hp: st.hp, mp: st.mp, est: st.est, san: st.san };
        if (s.characters[characterId]) get().patchCharacter(characterId, { current });
        if (s.npcs[characterId]) get().updateNpc(characterId, { current });
        set({
          combatLog: [{
            id: uid("lg"),
            at: Date.now(),
            kind: "heal",
            text: ch.name + " recuperou HP/MP/EST/SAN completos.",
          }, ...get().combatLog].slice(0, 80),
        });
      },

      grantCurrency: (characterId, amount) => {
        const s = get();
        const ch = s.characters[characterId] ?? s.npcs[characterId];
        if (!ch) return;
        const currency = {
          bronze: Math.max(0, (ch.currency?.bronze ?? 0) + Math.floor(amount.bronze ?? 0)),
          silver: Math.max(0, (ch.currency?.silver ?? 0) + Math.floor(amount.silver ?? 0)),
          gold: Math.max(0, (ch.currency?.gold ?? 0) + Math.floor(amount.gold ?? 0)),
          platinum: Math.max(0, (ch.currency?.platinum ?? 0) + Math.floor(amount.platinum ?? 0)),
        };
        if (s.characters[characterId]) get().patchCharacter(characterId, { currency });
        if (s.npcs[characterId]) get().updateNpc(characterId, { currency });
      },

      addShopListing: (item) => {
        const listing = { ...item, id: item.id || uid("shop"), qty: Math.max(1, item.qty || 1) };
        set((s) => ({ shopCatalog: [...(s.shopCatalog || []), listing] }));
      },

      removeShopListing: (itemId) => {
        set((s) => ({ shopCatalog: (s.shopCatalog || []).filter((i) => i.id !== itemId) }));
      },

      buyFromShop: (characterId, itemId) => {
        const s = get();
        const ch = s.characters[characterId] ?? s.npcs[characterId];
        if (!ch) return false;
        const listing = (s.shopCatalog || []).find((i) => i.id === itemId);
        if (!listing) return false;
        const pc = listing.priceCurrency || {};
        const cost = {
          bronze: Math.max(0, Math.floor(pc.bronze ?? 0)),
          silver: Math.max(0, Math.floor(pc.silver ?? (listing.price ?? 0))),
          gold: Math.max(0, Math.floor(pc.gold ?? 0)),
          platinum: Math.max(0, Math.floor(pc.platinum ?? 0)),
        };
        const c = ch.currency || { bronze: 0, silver: 0, gold: 0, platinum: 0 };
        if ((c.bronze || 0) < cost.bronze) return false;
        if ((c.silver || 0) < cost.silver) return false;
        if ((c.gold || 0) < cost.gold) return false;
        if ((c.platinum || 0) < cost.platinum) return false;
        const currency = {
          bronze: (c.bronze || 0) - cost.bronze,
          silver: (c.silver || 0) - cost.silver,
          gold: (c.gold || 0) - cost.gold,
          platinum: (c.platinum || 0) - cost.platinum,
        };
        const granted = { ...listing, id: uid("item"), qty: 1 };
        delete (granted as { priceCurrency?: unknown }).priceCurrency;
        const inventory = [...(ch.inventory || [])];
        const existing = inventory.find(
          (inv) => inv.name === granted.name && inv.effect === granted.effect && !inv.slot && !granted.slot,
        );
        if (existing) existing.qty += 1;
        else inventory.push(granted);
        if (s.characters[characterId]) get().patchCharacter(characterId, { currency, inventory });
        if (s.npcs[characterId]) get().updateNpc(characterId, { currency, inventory });
        return true;
      },

      disarmTrap: () => set({ trap: null }),
    }),
    {
      name: "rpg-platis-v1",
      version: SAVE_VERSION,
      storage: persistStorage,
      partialize: (s) => ({
        shopCatalog: s.shopCatalog,
        version: s.version,
        role: s.role,
        selfId: s.selfId,
        characters: s.characters,
        npcs: s.npcs,
        quests: s.quests,
        slots: s.slots,
        masterId: s.masterId,
        movementLocked: s.movementLocked,
        showGrid: s.showGrid,
        worldMapView: s.worldMapView,
        continentId: s.continentId,
        layer: s.layer,
        layers: s.layers,
        viewX: s.viewX,
        viewY: s.viewY,
        explored: s.explored,
        entities: s.entities,
        hiddenEntities: s.hiddenEntities,
        combatLog: s.combatLog,
        combatXpAward: s.combatXpAward,
        chat: s.chat,
        tab: s.tab,
      }),
    },
  ),
);

void RACE_BY_ID;
void CLASS_BY_ID;
void GRID_H;
