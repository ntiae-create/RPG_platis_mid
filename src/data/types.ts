export type StatKey =
  | "hp"
  | "mp"
  | "est"
  | "san"
  | "atk"
  | "atkMgc"
  | "def"
  | "res"
  | "agi"
  | "int";

export type Stats = Record<StatKey, number>;

export type RaceTier =
  | "basic"
  | "rare"
  | "legendary"
  | "extreme"
  | "extra";

/* =========================================================
   GÊNERO DO PERSONAGEM
   ========================================================= */

export type Gender = "masculino" | "feminino";

/* =========================================================
   RAÇA
   ========================================================= */

export type RaceDef = {
  id: string;
  name: string;
  tier: RaceTier;
  portrait: string;
  passive: { name: string; description: string };
  extraPassives?: { name: string; description: string }[];
  base: Stats;
  unlock: "start" | "mission" | "master";
};

/* =========================================================
   CLASSE
   ========================================================= */

export type ClassDef = {
  id: string;
  name: string;
  primary: StatKey;
  bonus: Partial<Stats>;
  passive: { name: string; description: string };
};

/* =========================================================
   AFINIDADES
   ========================================================= */

export type AffinityId =
  | "fogo"
  | "agua"
  | "terra"
  | "vento"
  | "luz"
  | "trevas"
  | "fisico"
  | "magico";

export type AffinityDef = {
  id: AffinityId;
  name: string;
  symbol: string;
  icon: string;
  card: string;
  effect: string;
};

/* =========================================================
   HABILIDADES
   ========================================================= */

export type SkillType =
  | "buff"
  | "debuff"
  | "heal"
  | "ataque"
  | "ataque-magico";

export type SkillStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected";

export type TargetMode =
  | "unico"
  | "area";

export type AreaDir =
  | "cima"
  | "baixo"
  | "lados"
  | "diagonal"
  | "personalizado";

export type Skill = {
  id: string;
  slot: 0 | 1 | 2 | 3;
  name: string;
  description: string;
  image?: string;
  type: SkillType;
  cost: {
    hp: number;
    mp: number;
    est: number;
  };
  target: TargetMode;
  areaCount: number;
  areaSquares: number;
  direction: AreaDir;
  range: number;
  duration: number;
  cooldown: number;
  status: SkillStatus;
  masterNote?: string;
};

/* =========================================================
   INVENTÁRIO
   ========================================================= */

export type InventoryItem = {
  id: string;
  name: string;
  slot?: "arma" | "armadura" | "botas" | "reliquia" | "colar";
  desc: string;
  qty: number;
};

/* =========================================================
   MOEDAS
   ========================================================= */

export type Currency = {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
};

/* =========================================================
   PERSONAGEM
   ========================================================= */

export type Character = {
  id: string;

  name: string;

  /*
   * NOVO:
   * Gênero escolhido durante a criação do personagem.
   */
  gender: Gender;

  /*
   * Imagem final exibida no card.
   * Posteriormente será escolhida automaticamente
   * de acordo com raça + gênero.
   */
  image: string;

  raceId: string;
  classId: string;
  affinityId: AffinityId;

  level: number;
  xp: number;
  brasaoXp: number;

  attrPoints: number;
  poolPoints: number;

  allocated: Partial<Stats>;

  current: {
    hp: number;
    mp: number;
    est: number;
    san: number;
  };

  skills: Skill[];

  personalPassive: {
    name: string;
    description: string;
    stacks: number;
  };

  inventory: InventoryItem[];

  equipment: {
    arma?: InventoryItem;
    armadura?: InventoryItem;
    botas?: InventoryItem;
    reliquia?: InventoryItem;
    colar?: InventoryItem;
  };

  currency: Currency;

  position: {
    continentId: string;
    layer: number;
    x: number;
    y: number;
  };

  unlockedRaces: string[];

  isMaster: boolean;

  isDemo?: boolean;
};

/* =========================================================
   ENTIDADES DO MAPA
   ========================================================= */

export type MapEntity = {
  id: string;

  kind:
    | "player"
    | "monster"
    | "boss"
    | "npc"
    | "dungeon"
    | "trap";

  name: string;

  continentId: string;

  layer: number;

  x: number;

  y: number;

  image?: string;

  hidden?: boolean;

  hp?: number;

  hpMax?: number;
};

/* =========================================================
   LOG DE COMBATE
   ========================================================= */

export type CombatLogEntry = {
  id: string;
  at: number;
  text: string;

  kind:
    | "roll"
    | "hit"
    | "miss"
    | "crit"
    | "counter"
    | "passive"
    | "xp"
    | "system";
};

/* =========================================================
   CHAT
   ========================================================= */

export type ChatMsg = {
  id: string;
  from: string;
  fromId: string;
  text: string;
  at: number;
};
