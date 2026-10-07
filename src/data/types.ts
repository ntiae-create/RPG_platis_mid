export type StatusEffectCategory =
  | "debuff"
  | "buff"
  | "recovery"
  | "cleanse";

export type StatusEffectDefinition = {
  id: string;
  name: string;
  stateName: string;
  englishName: string;
  category: StatusEffectCategory;
  description: string;
  maxStacks?: number;
};

export type StatusEffectInstance = {
  id: string;
  targetId: string;
  sourceId?: string;
  stacks: number;
  duration: number | null;
};

export const STATUS_EFFECTS: Record<string, StatusEffectDefinition> = {
  bleeding: {
    id: "bleeding",
    name: "Sangramento",
    stateName: "Sangrando",
    englishName: "Bleeding",
    category: "debuff",
    description: "-2 HP por turno durante 2 turnos.",
  },
  stun: {
    id: "stun",
    name: "Atordoamento",
    stateName: "Atordoado",
    englishName: "Stun",
    category: "debuff",
    description: "Impede ações por 1 turno.",
  },
  freeze: {
    id: "freeze",
    name: "Congelamento",
    stateName: "Congelado",
    englishName: "Freeze",
    category: "debuff",
    description: "Incapacita por 1 turno.",
  },
  cold: {
    id: "cold",
    name: "Frio",
    stateName: "Com Frio",
    englishName: "Cold",
    category: "debuff",
    description: "-1 AGI por 2 turnos; acumula até 3; com 3 acúmulos aplica Congelamento por 1 turno.",
    maxStacks: 3,
  },
  slow: {
    id: "slow",
    name: "Lentidão",
    stateName: "Lento",
    englishName: "Slow",
    category: "debuff",
    description: "-2 AGI por 2 turnos.",
  },
  infect: {
    id: "infect",
    name: "Infecção",
    stateName: "Infectado",
    englishName: "Infect",
    category: "debuff",
    description: "Cura não funciona por 1 turno.",
  },
  burn: {
    id: "burn",
    name: "Queimadura",
    stateName: "Queimado",
    englishName: "Burn",
    category: "debuff",
    description: "+10% de dano recebido por 3 turnos; acumula até 5.",
    maxStacks: 5,
  },
  blind: {
    id: "blind",
    name: "Cegueira",
    stateName: "Cego",
    englishName: "Blind",
    category: "debuff",
    description: "Ataques ficam sujeitos à condição de cegueira por 1 turno.",
  },
  weakness: {
    id: "weakness",
    name: "Fraqueza",
    stateName: "Enfraquecido",
    englishName: "Weakness",
    category: "debuff",
    description: "-3 DEF por 2 turnos.",
  },
  cancel: {
    id: "cancel",
    name: "Cancelamento",
    stateName: "Cancelado",
    englishName: "Cancel",
    category: "cleanse",
    description: "Impede BUFFs e habilidades que concedam BUFFs por 1 turno.",
  },
  silk_thread: {
    id: "silk_thread",
    name: "Fio de Seda",
    stateName: "Com Fios de Seda",
    englishName: "Silk Thread",
    category: "debuff",
    description: "Acumula; com 3 acúmulos aplica Imobilização por 1 turno.",
    maxStacks: 3,
  },
  immobilize: {
    id: "immobilize",
    name: "Imobilização",
    stateName: "Imobilizado",
    englishName: "Immobilize",
    category: "debuff",
    description: "Impede ações por 1 turno.",
  },
  poison: {
    id: "poison",
    name: "Envenenamento",
    stateName: "Envenenado",
    englishName: "Poison",
    category: "debuff",
    description: "Dano/efeito de veneno por 2 turnos; em Tsuchigumo, recebe +1 turno se houver Fios de Seda.",
  },
  explosion: {
    id: "explosion",
    name: "Explosão",
    stateName: "Explosão",
    englishName: "Explosion",
    category: "debuff",
    description: "Acumula 2 cargas. Ao atingir 2 cargas, causa uma explosão que causa 20% da soma do dano dos dois ataques que geraram as cargas.",
    maxStacks: 2,
  },
  wet: {
    id: "wet",
    name: "Molhado",
    stateName: "Molhado",
    englishName: "Wet",
    category: "debuff",
    description: "Estado elemental usado nas interações de Água e Vento.",
  },

  atk: {
    id: "atk",
    name: "ATK",
    stateName: "ATK",
    englishName: "ATK",
    category: "buff",
    description: "+2 ATK por 2 turnos.",
  },
  atk_mgc: {
    id: "atk_mgc",
    name: "ATK MGC",
    stateName: "ATK MGC",
    englishName: "Magic ATK",
    category: "buff",
    description: "+2 ATK MGC por 2 turnos.",
  },
  def: {
    id: "def",
    name: "DEF",
    stateName: "DEF",
    englishName: "DEF",
    category: "buff",
    description: "+2 DEF por 2 turnos.",
  },
  res: {
    id: "res",
    name: "RES",
    stateName: "RES",
    englishName: "RES",
    category: "buff",
    description: "+2 RES por 2 turnos.",
  },
  int: {
    id: "int",
    name: "INT",
    stateName: "INT",
    englishName: "INT",
    category: "buff",
    description: "+5 INT por 2 turnos.",
  },
  agi: {
    id: "agi",
    name: "AGI",
    stateName: "AGI",
    englishName: "AGI",
    category: "buff",
    description: "+2 AGI por 2 turnos.",
  },
  strengthening: {
    id: "strengthening",
    name: "Fortalecimento",
    stateName: "Fortalecido",
    englishName: "Strengthening",
    category: "buff",
    description: "+2 ATK e +2 ATK MGC por 2 turnos.",
  },
  defender: {
    id: "defender",
    name: "Defensor",
    stateName: "Defensor",
    englishName: "Defender",
    category: "buff",
    description: "+2 DEF e +2 RES por 2 turnos.",
  },
  agile: {
    id: "agile",
    name: "Ágil",
    stateName: "Ágil",
    englishName: "Agile",
    category: "buff",
    description: "+2 AGI e +5 INT por 2 turnos.",
  },

  heal: {
    id: "heal",
    name: "Cura",
    stateName: "Curado",
    englishName: "Heal",
    category: "recovery",
    description: "Recupera de 10% a 100% do HP, progressivo por nível.",
  },
  recovery: {
    id: "recovery",
    name: "Recuperação",
    stateName: "Em Recuperação",
    englishName: "Recovery",
    category: "recovery",
    description: "Recupera de 5% a 50% do HP progressivamente durante 2 turnos.",
  },
  lifesteal: {
    id: "lifesteal",
    name: "Roubo de Vida",
    stateName: "Com Roubo de Vida",
    englishName: "Lifesteal",
    category: "recovery",
    description: "Converte de 10% a 100% do dano causado em HP.",
  },
  regeneration: {
    id: "regeneration",
    name: "Regeneração",
    stateName: "Regenerando",
    englishName: "Regeneration",
    category: "recovery",
    description: "Recupera de 2% a 40% do HP durante 2 turnos.",
  },

  clean: {
    id: "clean",
    name: "Limpeza",
    stateName: "Limpo",
    englishName: "Clean",
    category: "cleanse",
    description: "Remove debuffs gerais e concede imunidade a debuffs gerais por 1 turno.",
  },
};

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

  /* Retrato padrão/legado da raça */
  portrait: string;

  /* Retratos oficiais separados por gênero */
  portraits: {
    masculino: string;
    feminino: string;
  };

  passive: {
    name: string;
    description: string;
  };

  extraPassives?: {
    name: string;
    description: string;
  }[];

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
  passive: {
    name: string;
    description: string;
  };
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

export type SkillAffinity =
  | "agua"
  | "luz"
  | "terra"
  | "trevas"
  | "vento"
  | "fogo"
  | "fisico"
  | "magico";

export type Skill = {
  id: string;
  slot: 0 | 1 | 2 | 3;
  name: string;
  affinity: SkillAffinity;
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
  tier?: "basic" | "medium" | "rare";
  desc: string;
  qty: number;
  price?: number;
  bonus?: Partial<{
    hp: number;
    mp: number;
    atk: number;
    atkMgc: number;
    def: number;
    agi: number;
    int: number;
  }>;
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
   * Gênero escolhido durante a criação
   * do personagem.
   */
  gender: Gender;

  /*
   * Imagem final exibida no card.
   *
   * O retrato oficial da raça agora pode ser
   * determinado automaticamente através de:
   *
   * raceId + gender
   *
   * O campo é mantido para compatibilidade
   * com personagens já existentes.
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

export type CombatEnemy = {
  id: string;
  name: string;
  kind: "monster" | "boss";
  level: number;
  stats: Stats;
  current: {
    hp: number;
    mp: number;
    est: number;
    san: number;
  };
  skills: Skill[];
  image?: string;
};


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



export type AffinityReactionDefinition = {
  id: string;
  firstAffinity: AffinityId | "wet";
  secondAffinity: AffinityId | "wet";
  resultEffectId: string;
  chance: number;
  reactionBlockTurns: number;
};

export const AFFINITY_REACTIONS: AffinityReactionDefinition[] = [
  {
    id: "water-earth-slow",
    firstAffinity: "agua",
    secondAffinity: "terra",
    resultEffectId: "slow",
    chance: 0.15,
    reactionBlockTurns: 3,
  },
  {
    id: "light-light-blind",
    firstAffinity: "luz",
    secondAffinity: "luz",
    resultEffectId: "blind",
    chance: 0.15,
    reactionBlockTurns: 3,
  },
  {
    id: "dark-dark-blind",
    firstAffinity: "trevas",
    secondAffinity: "trevas",
    resultEffectId: "blind",
    chance: 0.15,
    reactionBlockTurns: 3,
  },
  {
    id: "fire-fire-explosion",
    firstAffinity: "fogo",
    secondAffinity: "fogo",
    resultEffectId: "explosion",
    chance: 0.15,
    reactionBlockTurns: 3,
  },
  {
    id: "fire-wind-burn",
    firstAffinity: "fogo",
    secondAffinity: "vento",
    resultEffectId: "burn",
    chance: 0.15,
    reactionBlockTurns: 3,
  },
  {
    id: "dark-light-stun",
    firstAffinity: "trevas",
    secondAffinity: "luz",
    resultEffectId: "stun",
    chance: 0.15,
    reactionBlockTurns: 3,
  },
  {
    id: "water-water-wet",
    firstAffinity: "agua",
    secondAffinity: "agua",
    resultEffectId: "wet",
    chance: 0.15,
    reactionBlockTurns: 3,
  },
  {
    id: "wet-wind-freeze",
    firstAffinity: "wet",
    secondAffinity: "vento",
    resultEffectId: "freeze",
    chance: 0.15,
    reactionBlockTurns: 3,
  },
  {
    id: "earth-dark-infect",
    firstAffinity: "terra",
    secondAffinity: "trevas",
    resultEffectId: "infect",
    chance: 0.15,
    reactionBlockTurns: 3,
  },
];

