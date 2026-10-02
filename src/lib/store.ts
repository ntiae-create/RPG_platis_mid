import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Character,
  InventoryItem,
  ChatMsg,
  CombatLogEntry,
  MapEntity,
  Skill,
  StatKey,
} from "@/data/types";
import { CLASS_BY_ID } from "@/data/classes";
import { RACE_BY_ID } from "@/data/races";
import { BOSSES, GRID_H, GRID_W } from "@/data/world";
import { createCharacter, finalStats, makeEmptySkills, skillSlots } from "./stats";
import { applyDamage, resolveAttack, type CombatKind } from "./combat";
import { xpToNextLevel } from "@/data/progression";
import { uid } from "./utils";

export type Role = "jogador" | "mestre";
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
  continentId: string | null;
  layer: number;
  layers: LayerFrame[];
  viewX: number;
  viewY: number;
  explored: Record<string, string[]>;
  entities: MapEntity[];
  hiddenEntities: string[];
  combatActive: boolean;
  attackerId: string | null;
  defenderId: string | null;
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
  startCombat: () => void;
  nextTurn: () => void;
  endCombat: () => void;
  clearCombatLog: () => void;
  rollCombat: (kind: CombatKind, skillId?: string) => void;
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
  | "continentId"
  | "layer"
  | "layers"
  | "viewX"
  | "viewY"
  | "explored"
  | "entities"
  | "hiddenEntities"
  | "combatActive"
  | "combatOrder"
  | "combatTurnIndex"
  | "combatRound"
  | "attackerId"
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
    continentId: null,
    layer: 0,
    layers: [],
    viewX: 990,
    viewY: 1490,
    explored: {},
    entities: [],
    hiddenEntities: [],
    combatActive: false,
    attackerId: null,
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

function exploreKey(continentId: string, layer: number) {
  return `${continentId}:${layer}`;
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

      openContinent: (id) =>
        set({
          continentId: id,
          layer: 0,
          layers: [],
          viewX: 990,
          viewY: 1490,
          tab: "mapa",
        }),
      closeContinent: () => set({ continentId: null, layer: 0, layers: [] }),
      zoomIntoCell: (x, y) => {
        const s = get();
        set({
          layer: s.layer + 1,
          layers: [...s.layers, { x, y }],
          viewX: 990,
          viewY: 1490,
        });
      },
      zoomOut: () => {
        const s = get();
        if (s.layer <= 0) {
          set({ continentId: null });
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
        const key = exploreKey(s.continentId, s.layer);
        const setExplored = new Set(s.explored[key] ?? []);
        setExplored.add(`${x},${y}`);
        const trapRoll = Math.random();
        let trap = s.trap;
        if (trapRoll < 0.04 && !trap) {
          trap = { cell: `${x},${y}`, remaining: 1800, armed: true };
        }
        get().patchCharacter(id, {
          position: { ...ch.position, continentId: s.continentId, layer: s.layer, x, y },
        });
        set({
          explored: { ...s.explored, [key]: [...setExplored] },
          trap,
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

      startCombat: () => {
        const s = get();

        const order = s.slots
          .filter((id): id is string => Boolean(id))
          .filter((id) => Boolean(s.characters[id]))
          .sort((a, b) => {
            const aStats = finalStats(s.characters[a]);
            const bStats = finalStats(s.characters[b]);

            if (bStats.agi !== aStats.agi) {
              return bStats.agi - aStats.agi;
            }

            if (bStats.int !== aStats.int) {
              return bStats.int - aStats.int;
            }

            return finalStats(s.characters[b]).est - finalStats(s.characters[a]).est;
          });

        if (order.length === 0) return;

        const firstId = order[0];

        set({
          combatActive: true,
          combatOrder: order,
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
              text: `Combate iniciado. ${s.characters[firstId].name} começa pela iniciativa.`,
            },
          ],
        });
      },

      nextTurn: () => {
        const s = get();

        if (!s.combatActive || s.combatOrder.length === 0) return;

        const nextIndex = s.combatTurnIndex + 1;
        const wrapped = nextIndex >= s.combatOrder.length;
        const index = wrapped ? 0 : nextIndex;
        const nextId = s.combatOrder[index];

        if (!nextId || !s.characters[nextId]) return;

        set({
          combatTurnIndex: index,
          combatRound: wrapped ? s.combatRound + 1 : s.combatRound,
          attackerId: nextId,
          defenderId: null,
          pendingCounter: null,
        });
      },
      clearCombatLog: () => set({ combatLog: [] }),

      endCombat: () => {
        const s = get();

        set({
          combatActive: false,
          combatOrder: [],
          combatTurnIndex: 0,
          combatRound: 0,
          attackerId: null,
          defenderId: null,
          pendingCounter: null,
        });
      },

      selectFighter: (which, id) => {
        if (which === "attacker") set({ attackerId: id, combatActive: true });
        else set({ defenderId: id, combatActive: true });
      },

      rollCombat: (kind, skillId) => {
        const s = get();
        const atk = s.attackerId ? s.characters[s.attackerId] : null;
        const def = s.defenderId ? s.characters[s.defenderId] : null;
        if (!atk || !def) return;

        if (
          s.combatActive &&
          s.combatOrder.length > 0 &&
          s.combatOrder[s.combatTurnIndex] !== atk.id
        ) {
          return;
        }

        const skill = skillId ? atk.skills.find((k) => k.id === skillId) : undefined;
        if (skill && skill.status !== "approved") return;
        if (skill) {
          const cur = { ...atk.current };
          cur.hp -= skill.cost.hp;
          cur.mp -= skill.cost.mp;
          cur.est -= skill.cost.est;
          if (cur.hp < 0 || cur.mp < 0 || cur.est < 0) return;
          get().patchCharacter(atk.id, { current: cur });
        }
        const res = resolveAttack({
          attacker: get().characters[atk.id],
          defender: def,
          kind,
          skill: skill && skill.status === "approved" ? skill : null,
          allyNearby: s.slots.filter(Boolean).length > 1,
        });
        if (res.hit && res.damage > 0) {
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
          pendingCounter: res.counterAvailable
            ? { defenderId: def.id, attackerId: atk.id }
            : null,
          tab: "combate",
        });
      },

      resolveCounter: (mode) => {
        const s = get();
        if (!s.pendingCounter) return;
        const def = s.characters[s.pendingCounter.defenderId];
        const atk = s.characters[s.pendingCounter.attackerId];
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
        const res = resolveAttack({
          attacker: get().characters[def.id],
          defender: atk,
          kind: "physical",
        });
        if (res.hit) {
          const applied = applyDamage(atk, res.damage);
          get().patchCharacter(atk.id, { current: applied.ch.current });
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

        s.slots.forEach((id) => {
          if (id) s.grantXp(id, s.combatXpAward);
        });

        if (s.masterId) {
          s.grantXp(s.masterId, s.combatXpAward);
        }

        set({
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
