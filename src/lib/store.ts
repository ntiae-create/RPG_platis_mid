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
import { rollDie } from "./utils";
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
};
export type MesaTab =
  | "personagem"
  | "mapa"
  | "combate"
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
  startWorldBossCombat: (bossId: string, level: number) => void;
  worldBossAttack: (characterId: string) => void;
  nextWorldBossTurn: () => void;
  nextTurn: () => void;
  endCombat: () => void;
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
  unequipItem: (slot: "arma" | "armadura" | "botas" | "reliquia" | "colar") => void;
  discardItem: (itemId: string) => void;
  grantItem: (characterId: string, item: InventoryItem) => void;
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
> {
  return {
    version: SAVE_VERSION,
    role: null,
    selfId: null,
    characters: {},
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
): WorldBossSkill | null {
  const available = getWorldBossAvailableSkills(bossId, level).filter(
    (skill) => getWorldBossCooldown(cooldowns, skill.name) === 0,
  );

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
): {
  skill: WorldBossSkill;
  cooldowns: WorldBossCooldown[];
} | null {
  const skill = chooseWorldBossSkill(
    combat.bossId,
    combat.level,
    combat.cooldowns,
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

export const usePlatis = create<AppState>()(
  persist(
    (set, get) => ({
      ...empty(),

      setRole: (role) => set({ role, tab: role === "mestre" ? "mesa" : "personagem" }),
      setTab: (tab) => set({ tab }),

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
        const next = { ...ch, ...patch };
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
        set({ characters: { ...get().characters, [id]: next }, entities });
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
        const skills = [...ch.skills];
        const prev = skills[slot];
        skills[slot] = {
          ...(prev ?? makeEmptySkills(1)[0]),
          ...skill,
          id: prev?.id ?? uid("sk"),
          slot: slot as 0 | 1 | 2 | 3,
          status: "pending",
        };
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
        let xp = ch.xp + amount;
        const next = { ...ch, xp };
        let gained = 0;
        const maxLevel = next.isMaster ? 999 : 150;
        while (next.level < maxLevel && xp >= xpToNextLevel(next.level)) {
          xp -= xpToNextLevel(next.level);
          next.level += 1;
          next.attrPoints += 3;
          next.allocated = { ...next.allocated, san: (next.allocated.san ?? 0) + 2 };
          if (next.level % 5 === 0) next.poolPoints += 8;
          gained += 1;
        }
        next.xp = xp;
        const stats = finalStats(next);
        next.current = { ...next.current, san: stats.san };
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

        const reachedBoss = s.entities.find(
          (entity) =>
            entity.kind === "boss" &&
            entity.continentId === s.continentId &&
            entity.layer === s.layer &&
            entity.x === x &&
            entity.y === y
        );

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

        const nextX = Math.max(0, Math.min(29, Math.round(x)));
        const nextY = Math.max(0, Math.min(29, Math.round(y)));

        set({
          combatPositions: {
            ...get().combatPositions,
            [id]: {
              x: nextX,
              y: nextY,
            },
          },
        });
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
            cooldowns: [],
      affinityReactionBlocks: [],
          },
        });
      },

      nextWorldBossTurn: () => {
        const s = get();
        const combat = s.worldBossCombat;
        const affinityReactionBlocks = combat
          ? tickAffinityReactionBlocks(combat.affinityReactionBlocks)
          : [];
        const worldBossEffects = combat
          ? tickWorldBossEffects(combat.effects)
          : [];

        if (!combat || !s.combatActive || s.combatMode !== "world-boss") return;
        if (combat.turnOrder.length === 0) return;

        let nextIndex = combat.turnIndex;
        let nextId: string | null = null;
        let wrapped = false;

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

        if (!nextId) return;

        const targetId =
          nextId === "world-boss"
            ? combat.turnOrder.find(
                (id) =>
                  id !== "world-boss" &&
                  Boolean(s.characters[id]) &&
                  s.characters[id].current.hp > 0,
              ) ?? null
            : "world-boss";

        let poisonCharacters = s.characters;

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
          },
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

        if (nextId === "world-boss" && targetId) {
          const boss = WORLD_BOSS_DETAILS.find(
            (entry) => entry.id === combat.bossId,
          );
          const bossLevel = boss?.levels.find(
            (entry) => entry.level === combat.level,
          );
          const target = s.characters[targetId];

          if (bossLevel && target) {
            const skillExecution = executeWorldBossSkill({
              ...combat,
              cooldowns: get().worldBossCombat?.cooldowns ?? [],
            });

            if (skillExecution) {
              let reactionBlocks =
                get().worldBossCombat?.affinityReactionBlocks ?? [];

              const skillAffinity = skillExecution.skill.affinityId;
              const targetAffinity = target.affinityId;

              if (skillAffinity && targetAffinity) {
                const reaction = resolveAffinityReaction(
                  skillAffinity,
                  targetAffinity,
                );

                if (
                  reaction &&
                  !isAffinityReactionBlocked(
                    reactionBlocks,
                    reaction.reactionId,
                  )
                ) {
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

            if (nextPlayerHp > 0) {
              get().nextWorldBossTurn();
            }
          }
        }
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

        const nextHp = Math.max(0, combat.current.hp - damage);

        const logEntry = {
          id: uid("lg"),
          at: Date.now(),
          kind: hit ? ("hit" as const) : ("miss" as const),
          text: hit
            ? `${character.name} acerta o World Boss por ${damage} de dano.`
            : `${character.name} erra o ataque contra o World Boss.`,
        };

        set({
          worldBossCombat: {
            ...combat,
            current: {
              ...combat.current,
              hp: nextHp,
            },
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

        const order = s.combatParticipants
          .filter((id) => Boolean(s.characters[id] || s.combatEnemies[id]))
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

            return bStats.est - aStats.est;
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
              y: 2 + playerIndex * 2,
            };
            playerIndex += 1;
          } else if (s.combatEnemies[id]) {
            combatPositions[id] = {
              x: 28,
              y: 2 + enemyIndex * 2,
            };
            enemyIndex += 1;
          }
        }

        set({
          combatActive: true,
          combatParticipants: [...s.combatParticipants],
          combatXpParticipants: [...s.combatParticipants],
          combatOrder: order,
          combatPositions,
          combatTurnIndex: 0,
          combatRound: 1,
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
          ],
        });
      },

      nextTurn: () => {
        const s = get();

        if (!s.combatActive || s.combatOrder.length === 0) return;

        let index = s.combatTurnIndex;
        let wrapped = false;
        let nextId: string | undefined;

        for (let step = 1; step <= s.combatOrder.length; step += 1) {
          const candidateIndex = (s.combatTurnIndex + step) % s.combatOrder.length;
          const candidateId = s.combatOrder[candidateIndex];

          const character = s.characters[candidateId];
          const enemy = s.combatEnemies[candidateId];

          if (
            (character && character.current.hp > 0) ||
            (enemy && enemy.current.hp > 0)
          ) {
            index = candidateIndex;
            wrapped = candidateIndex <= s.combatTurnIndex;
            nextId = candidateId;
            break;
          }
        }

        if (!nextId) return;

        const isEnemyTurn = Boolean(s.combatEnemies[nextId]);
        const targetId = isEnemyTurn
          ? s.combatOrder.find(
              (id) =>
                Boolean(s.characters[id]) &&
                s.combatParticipants.includes(id) &&
                s.characters[id].current.hp > 0,
            ) ?? null
          : null;

        set({
          combatTurnIndex: index,
          combatRound: wrapped ? s.combatRound + 1 : s.combatRound,
          attackerId: nextId,
          defenderId: targetId,
          pendingCounter: null,
        });

        if (isEnemyTurn && targetId) {
          get().rollCombat("physical");
        }
      },
      clearCombatLog: () => set({ combatLog: [] }),

      endCombat: () => {
        const s = get();

        set({
          combatActive: false,
          combatParticipants: [],
          combatXpParticipants: [],
          combatOrder: [],
          combatTurnIndex: 0,
          combatRound: 0,
          attackerId: null,
    combatEnemies: {},
          defenderId: null,
          pendingCounter: null,
        });
      },

      setWorldBoss: (id) => set({ worldBossId: id }),

      addCombatEnemy: (enemy) => {
        const id = uid("enemy");
        set({
          combatEnemies: {
            ...get().combatEnemies,
            [id]: { ...enemy, id },
          },
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
        if (which === "attacker") set({ attackerId: id, combatActive: true });
        else set({ defenderId: id, combatActive: true });
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

        const skill = "raceId" in atk ? (skillId ? atk.skills.find((k) => k.id === skillId) : undefined) : undefined;
        if (skill && skill.status !== "approved") return;
        if (skill && "raceId" in atk) {
          const cur = { ...atk.current };
          cur.hp -= skill.cost.hp;
          cur.mp -= skill.cost.mp;
          cur.est -= skill.cost.est;
          if (cur.hp < 0 || cur.mp < 0 || cur.est < 0) return;
          get().patchCharacter(atk.id, { current: cur });
        }
        const res = "raceId" in atk && "raceId" in def
          ? resolveAttack({
              attacker: atk,
              defender: def,
              kind,
              skill: skill && skill.status === "approved" ? skill : null,
              allyNearby: s.slots.filter(Boolean).length > 1,
            })
          : resolveEnemyAttack({
              attacker: atk,
              defender: def,
              kind,
            });
        if (res.hit && res.damage > 0) {
          if ("raceId" in def) {
            const applied = applyDamage(def, res.damage);
            if (applied.survivedAt1) {
              res.log.push({
                id: uid("lg"),
                at: Date.now(),
                kind: "passive",
                text: `${def.name} permanece com 1 HP (Criação Indesejada).`,
              });
            }
            get().patchCharacter(def.id, { current: applied.ch.current });
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

        const defeatedCharacter = get().characters[def.id];
        const defeatedEnemy = get().combatEnemies[def.id];

        const defeatedId =
          defeatedCharacter && defeatedCharacter.current.hp <= 0
            ? def.id
            : defeatedEnemy && defeatedEnemy.current.hp <= 0
              ? def.id
              : null;

        if (defeatedId) {
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
          remainingPlayers.length === 0 || remainingEnemies.length === 0;

        if (combatFinished) {
          set({
            combatActive: false,
            combatParticipants: [],
            combatOrder: [],
            combatPositions: {},
            attackerId: null,
            defenderId: null,
            pendingCounter: null,
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
      discardItem: (itemId) => {
        const id = get().selfId;
        if (!id) return;
        const ch = get().characters[id];
        if (!ch) return;
        const inventory = ch.inventory.filter((item) => item.id !== itemId);
        get().patchCharacter(id, { inventory });
      },

      grantItem: (characterId, item) => {
        const ch = get().characters[characterId];
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

        get().patchCharacter(characterId, { inventory });
      },
      disarmTrap: () => set({ trap: null }),
    }),
    {
      name: "rpg-platis-v1",
      version: SAVE_VERSION,
      storage: persistStorage,
      partialize: (s) => ({
        version: s.version,
        role: s.role,
        selfId: s.selfId,
        characters: s.characters,
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
