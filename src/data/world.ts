import type { AffinityId } from "./types";
import { hashString, mulberry32 } from "@/lib/utils";

export const GRID_W = 2000;
export const GRID_H = 3000;

export type Continent = {
  id: string;
  name: string;
  biome: string;
  affinity?: AffinityId;
  dungeonCount: number;
  x: number;
  y: number;
  blurb: string;
};

export type WorldBoss = {
  id: string;
  name: string;
  symbol: string;
  brasao: string;
  bonusPct: number;
  affinity?: AffinityId | AffinityId[];
  continentId: string;
  levelStart: number;
  progression: number[];
};

const NAMES_A = [
  "Cripta",
  "Ruína",
  "Fosso",
  "Catacumba",
  "Torre",
  "Covil",
  "Santuário",
  "Mina",
  "Fortaleza",
  "Abismo",
  "Câmara",
  "Ninho",
  "Templo",
  "Labirinto",
  "Cisterna",
];
const NAMES_B = [
  "do Véu",
  "de Cinzas",
  "do Sal",
  "da Maré",
  "do Espinho",
  "do Ossário",
  "da Bruma",
  "do Eco",
  "da Serpe",
  "do Juramento",
  "da Noite",
  "do Ferro",
  "da Raiz",
  "do Vento Morto",
  "da Chama Fria",
];

const TOTAL_DUNGEONS = 2390;
const CONTINENT_COUNT = 22;
const BASE = Math.floor(TOTAL_DUNGEONS / CONTINENT_COUNT);
const REMAINDER = TOTAL_DUNGEONS % CONTINENT_COUNT;

function dCount(i: number) {
  return BASE + (i < REMAINDER ? 1 : 0);
}

export const CONTINENTS: Continent[] = [
  {
    id: "vindheim",
    name: "Vindheim",
    biome: "Planícies de tempestade",
    affinity: "vento",
    dungeonCount: dCount(0),
    x: 18,
    y: 22,
    blurb: "Correntes eternas varrem os planaltos. Ninho de Hræsvelgr.",
  },
  {
    id: "solheim",
    name: "Solheim",
    biome: "Estepes solares",
    affinity: "luz",
    dungeonCount: dCount(1),
    x: 38,
    y: 18,
    blurb: "O sol nunca se põe por completo. Território de Skoll.",
  },
  {
    id: "nottland",
    name: "Nottland",
    biome: "Noite perpétua",
    affinity: "trevas",
    dungeonCount: dCount(2),
    x: 58,
    y: 16,
    blurb: "A lua caça o horizonte. Território de Hati.",
  },
  {
    id: "jordrike",
    name: "Jordrike",
    biome: "Montanhas vivas",
    affinity: "terra",
    dungeonCount: dCount(3),
    x: 28,
    y: 38,
    blurb: "As raízes de Eikthyrnir atravessam o leito da terra.",
  },
  {
    id: "seidheim",
    name: "Seidheim",
    biome: "Bosques rúnicos",
    affinity: "magico",
    dungeonCount: dCount(4),
    x: 48,
    y: 34,
    blurb: "Ratatoskr corre entre as árvores que falam.",
  },
  {
    id: "hafsvik",
    name: "Hafsvik",
    biome: "Arquipélago",
    affinity: "agua",
    dungeonCount: dCount(5),
    x: 72,
    y: 30,
    blurb: "O mar enrola-se em si. Jormungandr dorme nas fossas.",
  },
  {
    id: "eldfjall",
    name: "Eldfjall",
    biome: "Cadeia vulcânica",
    affinity: "fogo",
    dungeonCount: dCount(6),
    x: 22,
    y: 58,
    blurb: "Raios caminham sobre lava. Raiju marca o céu.",
  },
  {
    id: "jarnvidr",
    name: "Jarnvidr",
    biome: "Floresta de ferro",
    affinity: "fisico",
    dungeonCount: dCount(7),
    x: 44,
    y: 54,
    blurb: "Folhas de aço. Fenrir está acorrentado — por enquanto.",
  },
  {
    id: "duat",
    name: "Duat",
    biome: "Deserto funerário",
    dungeonCount: dCount(8),
    x: 66,
    y: 52,
    blurb: "Areia que julga os mortos. Ammit espera na balança.",
  },
  {
    id: "xibalba",
    name: "Xibalba",
    biome: "Cavernas de obsidiana",
    dungeonCount: dCount(9),
    x: 14,
    y: 74,
    blurb: "O eco das asas. Camazotz reina no teto invisível.",
  },
  {
    id: "yomi",
    name: "Yomi",
    biome: "Vales nevoentos",
    dungeonCount: dCount(10),
    x: 36,
    y: 72,
    blurb: "Teias entre os cedros. Tsuchigumo tece destinos.",
  },
  {
    id: "wastes",
    name: "Ermos de Wendigo",
    biome: "Tundra canibal",
    dungeonCount: dCount(11),
    x: 58,
    y: 70,
    blurb: "Fome que anda. Wendigo não esquece um nome.",
  },
  {
    id: "midgard",
    name: "Midgard",
    biome: "Terras médias",
    dungeonCount: dCount(12),
    x: 50,
    y: 48,
    blurb: "O eixo mortal. Cidades, estradas e o primeiro fogo.",
  },
  {
    id: "asgard",
    name: "Asgard",
    biome: "Cidadelas altas",
    dungeonCount: dCount(13),
    x: 80,
    y: 14,
    blurb: "Muralhas de ouro velho. Poucos sobem; menos descem.",
  },
  {
    id: "jotunheim",
    name: "Jotunheim",
    biome: "Campos de gigantes",
    dungeonCount: dCount(14),
    x: 8,
    y: 40,
    blurb: "Pedras do tamanho de fortalezas. O chão respira.",
  },
  {
    id: "alfheim",
    name: "Alfheim",
    biome: "Bosques élficos",
    dungeonCount: dCount(15),
    x: 78,
    y: 44,
    blurb: "Luz filtrada, caminhos que se recusam a ser mapas.",
  },
  {
    id: "svartalfheim",
    name: "Svartalfheim",
    biome: "Cidades subterrâneas",
    dungeonCount: dCount(16),
    x: 32,
    y: 88,
    blurb: "Forjas e contratos. O minério canta quando mente.",
  },
  {
    id: "muspelheim",
    name: "Muspelheim",
    biome: "Mar de fogo",
    dungeonCount: dCount(17),
    x: 10,
    y: 90,
    blurb: "O primeiro calor. Nada aqui é metáfora.",
  },
  {
    id: "niflheim",
    name: "Niflheim",
    biome: "Névoa primordial",
    dungeonCount: dCount(18),
    x: 82,
    y: 78,
    blurb: "Gelo anterior às palavras. Distâncias mentem.",
  },
  {
    id: "helheim",
    name: "Helheim",
    biome: "Reino inferior",
    dungeonCount: dCount(19),
    x: 70,
    y: 88,
    blurb: "Portões silenciosos. Os que entram pagam com memória.",
  },
  {
    id: "vanaheim",
    name: "Vanaheim",
    biome: "Campos férteis",
    dungeonCount: dCount(20),
    x: 88,
    y: 58,
    blurb: "Colheitas que curam e envenenam na mesma taça.",
  },
  {
    id: "platis",
    name: "Platis",
    biome: "Capital do mundo",
    dungeonCount: dCount(21),
    x: 50,
    y: 62,
    blurb: "O umbigo do mapa. Aqui se assinam brasões e se perdem nomes.",
  },
];

export const CONTINENT_BY_ID = Object.fromEntries(CONTINENTS.map((c) => [c.id, c]));

export const BOSSES: WorldBoss[] = [
  {
    id: "hraesvelgr",
    name: "Hræsvelgr",
    symbol: "vento",
    brasao: "Vento",
    bonusPct: 50,
    affinity: "vento",
    continentId: "vindheim",
    levelStart: 12,
    progression: [12, 100, 200, 300, 400],
  },
  {
    id: "skoll",
    name: "Skoll",
    symbol: "luz",
    brasao: "Luz",
    bonusPct: 100,
    affinity: "luz",
    continentId: "solheim",
    levelStart: 12,
    progression: [12, 100, 200, 300, 400],
  },
  {
    id: "hati",
    name: "Hati",
    symbol: "trevas",
    brasao: "Trevas",
    bonusPct: 100,
    affinity: "trevas",
    continentId: "nottland",
    levelStart: 12,
    progression: [12, 100, 200, 300, 400],
  },
  {
    id: "eikthyrnir",
    name: "Eikthyrnir",
    symbol: "terra",
    brasao: "Terra",
    bonusPct: 50,
    affinity: "terra",
    continentId: "jordrike",
    levelStart: 12,
    progression: [12, 100, 200, 300, 400],
  },
  {
    id: "ratatoskr",
    name: "Ratatoskr",
    symbol: "magico",
    brasao: "Mágico",
    bonusPct: 50,
    affinity: "magico",
    continentId: "seidheim",
    levelStart: 12,
    progression: [12, 100, 200, 300, 400],
  },
  {
    id: "jormungandr",
    name: "Jormungandr",
    symbol: "agua",
    brasao: "Água",
    bonusPct: 50,
    affinity: "agua",
    continentId: "hafsvik",
    levelStart: 12,
    progression: [12, 100, 200, 300, 400],
  },
  {
    id: "raiju",
    name: "Raiju",
    symbol: "fogo",
    brasao: "Fogo",
    bonusPct: 50,
    affinity: "fogo",
    continentId: "eldfjall",
    levelStart: 12,
    progression: [12, 100, 200, 300, 400],
  },
  {
    id: "fenrir",
    name: "Fenrir",
    symbol: "fisico",
    brasao: "Físico",
    bonusPct: 50,
    affinity: "fisico",
    continentId: "jarnvidr",
    levelStart: 12,
    progression: [12, 100, 200, 300, 400],
  },
  {
    id: "ammit",
    name: "Ammit",
    symbol: "juizo",
    brasao: "—",
    bonusPct: 0,
    continentId: "duat",
    levelStart: 12,
    progression: [12, 100, 200, 300, 400],
  },
  {
    id: "camazotz",
    name: "Camazotz",
    symbol: "asa",
    brasao: "—",
    bonusPct: 0,
    continentId: "xibalba",
    levelStart: 12,
    progression: [12, 100, 200, 300, 400],
  },
  {
    id: "tsuchigumo",
    name: "Tsuchigumo",
    symbol: "teia",
    brasao: "—",
    bonusPct: 0,
    continentId: "yomi",
    levelStart: 12,
    progression: [12, 100, 200, 300, 400],
  },
  {
    id: "wendigo",
    name: "Wendigo",
    symbol: "fome",
    brasao: "—",
    bonusPct: 0,
    continentId: "wastes",
    levelStart: 12,
    progression: [12, 100, 200, 300, 400],
  },
];

export type WorldBossStats = {
  hp: number;
  mp: number;
  est: number;
  atk: number;
  atkMgc: number;
  def: number;
  res: number;
  agi: number;
  int: number;
  san: number;
};

export type WorldBossLevel = {
  level: number;
  stats: WorldBossStats;
};

export type WorldBossPassive = {
  name: string;
  description: string;
};

export type WorldBossSkill = {
  name: string;
  description: string;
  unlockLevel?: number;
  ultimate?: boolean;
};

export type WorldBossDetail = {
  id: string;
  image?: string;
  type: "World Boss";
  creatureType: string;
  specialMechanic: string;
  levels: WorldBossLevel[];
  passives: WorldBossPassive[];
  skills: WorldBossSkill[];
};

export const WORLD_BOSS_DETAILS: WorldBossDetail[] = [
  {
    id: "hraesvelgr",
    type: "World Boss",
    creatureType: "Besta",
    specialMechanic:
      "Ao entrar na batalha, faz uma onda de choque mandando os inimigos para locais aleatórios, espalhando eles.",
    levels: [
      {
        level: 12,
        stats: {
          hp: 100,
          mp: 180,
          est: 350,
          atk: 14,
          atkMgc: 18,
          def: 8,
          res: 35,
          agi: 18,
          int: 28,
          san: 1000,
        },
      },
      {
        level: 100,
        stats: {
          hp: 1000,
          mp: 1362,
          est: 1815,
          atk: 53,
          atkMgc: 68,
          def: 30,
          res: 131,
          agi: 68,
          int: 105,
          san: 1300,
        },
      },
      {
        level: 200,
        stats: {
          hp: 2500,
          mp: 3135,
          est: 4012,
          atk: 91,
          atkMgc: 117,
          def: 52,
          res: 228,
          agi: 117,
          int: 182,
          san: 1600,
        },
      },
      {
        level: 300,
        stats: {
          hp: 5000,
          mp: 6090,
          est: 7675,
          atk: 138,
          atkMgc: 177,
          def: 79,
          res: 344,
          agi: 177,
          int: 275,
          san: 1900,
        },
      },
      {
        level: 400,
        stats: {
          hp: 10000,
          mp: 12000,
          est: 15000,
          atk: 236,
          atkMgc: 303,
          def: 135,
          res: 589,
          agi: 303,
          int: 471,
          san: 2200,
        },
      },
    ],
    passives: [
      {
        name: "Senhor dos Céus",
        description:
          "Enquanto estiver no ar, Hræsvelgr fica imune a ataques corpo a corpo.",
      },
      {
        name: "Rei da Tempestade",
        description:
          "Hræsvelgr domina o campo através de zonas de Vento e correntes de ar, utilizando o ambiente para controlar o posicionamento dos inimigos.",
      },
    ],
    skills: [
      {
        name: "Tempestade do Devorador",
        description:
          "Ataque de Vento frontal que causa dano e empurra o alvo.",
      },
      {
        name: "Asas do Fim",
        description:
          "Libera uma explosão de Vento ao redor de si, atingindo a área próxima e causando deslocamento aleatório nos alvos atingidos.",
      },
      {
        name: "Queda do Céu",
        description:
          "Hræsvelgr desaparece do campo e retorna no turno seguinte, realizando um ataque de área de Vento com grande impacto e empurrando os inimigos.",
      },
      {
        name: "O Uivo dos Céus",
        description:
          "Um poderoso uivo de Vento que afeta o campo de batalha e reforça o domínio aéreo de Hræsvelgr.",
      },
      {
        name: "Sopro do Abismo",
        description: "Ataque de Vento de longo alcance.",
        unlockLevel: 200,
      },
      {
        name: "Penas do Armagedon",
        description:
          "Hræsvelgr lança uma chuva de penas cortantes sobre o campo. Os projéteis podem ser repelidos durante 2 turnos.",
        unlockLevel: 400,
      },
      {
        name: "Fúria do Devorador dos Céus",
        description:
          "A manifestação máxima do poder de Hræsvelgr, liberando sua força de Vento sobre o campo de batalha.",
        unlockLevel: 400,
        ultimate: true,
      },
    ],
  },
];

export type Dungeon = {
  id: string;
  name: string;
  continentId: string;
  x: number;
  y: number;
  type: "fixed" | "procedural";
  difficulty: number;
  cleared: boolean;
};

export function dungeonsFor(continentId: string): Dungeon[] {
  const c = CONTINENT_BY_ID[continentId];
  if (!c) return [];
  const rng = mulberry32(hashString(`dungeon:${continentId}`));
  const out: Dungeon[] = [];
  for (let i = 0; i < c.dungeonCount; i++) {
    const a = NAMES_A[Math.floor(rng() * NAMES_A.length)];
    const b = NAMES_B[Math.floor(rng() * NAMES_B.length)];
    out.push({
      id: `${continentId}-d${i + 1}`,
      name: `${a} ${b}`,
      continentId,
      x: Math.floor(rng() * GRID_W),
      y: Math.floor(rng() * GRID_H),
      type: rng() > 0.35 ? "fixed" : "procedural",
      difficulty: 1 + Math.floor(rng() * 12),
      cleared: false,
    });
  }
  return out;
}

export const TOTAL_DUNGEON_COUNT = CONTINENTS.reduce((n, c) => n + c.dungeonCount, 0);
