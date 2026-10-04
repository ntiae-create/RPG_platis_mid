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
    blurb: "O sol nunca se põe por completo.",
  },
  {
    id: "nottland",
    name: "Nottland",
    biome: "Noite perpétua",
    affinity: "trevas",
    dungeonCount: dCount(2),
    x: 58,
    y: 16,
    blurb: "A lua caça o horizonte.",
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
    blurb: "Folhas de aço. O domínio onde os irmãos eternos caçam juntos.",
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
    continentId: "jarnvidr",
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
    continentId: "jarnvidr",
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
    image: "/images/world-bosses/hraesvelgr.webp",
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


  {
    id: "eikthyrnir",
    type: "World Boss",
    creatureType: "Besta",
    specialMechanic: "Eikthyrnir acumula Efeitos de Natureza. Durante cada rodada, o mesmo atributo de dano não pode ser repetido contra ele. Ao entrar na fase de Imortal Terrestre, começa com 10 Efeitos de Natureza; enquanto eles existirem, permanece imortal.",
    levels: [
      { level: 12, stats: { hp: 120, mp: 110, est: 180, atk: 16, atkMgc: 6, def: 20, res: 15, agi: 13, int: 12, san: 1000 } },
      { level: 100, stats: { hp: 1200, mp: 1100, est: 1800, atk: 60, atkMgc: 23, def: 75, res: 56, agi: 49, int: 45, san: 1300 } },
      { level: 200, stats: { hp: 3000, mp: 2750, est: 4500, atk: 104, atkMgc: 39, def: 130, res: 98, agi: 85, int: 78, san: 1600 } },
      { level: 300, stats: { hp: 6000, mp: 5500, est: 9000, atk: 157, atkMgc: 59, def: 197, res: 148, agi: 128, int: 118, san: 1900 } },
      { level: 400, stats: { hp: 10000, mp: 11000, est: 18000, atk: 269, atkMgc: 101, def: 337, res: 253, agi: 219, int: 202, san: 2200 } },
    ],
    passives: [
      { name: "Temor Terrestre", description: "A 20% de HP ou menos, entra em Postura. Enquanto estiver nessa postura, ataques mágicos que o atingirem têm o dano refletido ao atacante." },
      { name: "Raízes Ancestrais", description: "DEF aumenta conforme o HP diminui: acima de 75% = 0%; até 75% = +10%; até 50% = +20%; até 25% = +30%." },
      { name: "Fúria da Natureza", description: "ATK aumenta conforme o HP diminui: acima de 75% = 0%; até 75% = +10%; até 50% = +20%; até 25% = +30%." },
      { name: "Efeito de Natureza", description: "Sempre que um ataque atinge Eikthyrnir, remove 1 Efeito de Natureza e registra o atributo usado pelo atacante. Se o mesmo atacante usar novamente o mesmo atributo dentro da janela do nível, Eikthyrnir ganha +1 Efeito de Natureza. Janela: 2 ataques no Lv.12, 3 no Lv.100, 4 no Lv.200, 5 no Lv.300 e 6 no Lv.400. Cada efeito concede +10% ATK e +10% ATK MGC. Durante cada rodada, o mesmo atributo de dano não pode ser repetido contra Eikthyrnir." },
      { name: "Temor da Terra — Imortal Terrestre", description: "Ao entrar nessa fase, começa com 10 Efeitos de Natureza. Enquanto existirem, sua imortalidade permanece ativa. Os inimigos precisam reduzir os 10 efeitos a zero para quebrar a imortalidade e poder derrotá-lo. A regra de não repetir o mesmo atributo durante a rodada continua ativa." },
    ],
    skills: [
      { name: "Chifrada Terrestre", description: "Ataque físico de alvo único com os chifres. Dano: 4 + D[ATK]. Sem efeito adicional." },
      { name: "Investida dos Chifres", description: "Avança em linha, atingindo múltiplos inimigos. Dano: 3 + D[ATK]. Sem efeito adicional." },
      { name: "Ruptura Terrestre", description: "Golpeia o solo, causando dano físico a todos os inimigos. Dano: 4 + D[ATK]. Sem efeito adicional." },
      { name: "Ira da Terra", description: "Ataque mágico de Terra contra todos os inimigos. Dano: 5 + D[ATK MGC]. Também concede +1 Efeito de Natureza." },
      { name: "Colisão da Natureza", description: "Protege os Efeitos de Natureza existentes. Durante a próxima rodada, Efeitos de Natureza não podem ser removidos." },
      { name: "Penitência da Natureza", description: "Ultimate Lv.400. Cria o Domínio da Natureza. Se possuir 10 Efeitos de Natureza ao usar a Ultimate, entra em Natureza Primordial. Durante essa rodada, os efeitos não podem ser reduzidos e recebe +100% ATK e +100% ATK MGC. Na rodada seguinte, nenhum atributo de dano pode ser repetido contra Eikthyrnir. Se um inimigo violar a regra, sofre Stun por 1 turno.", unlockLevel: 400, ultimate: true },
    ],
  },

  {
    id: "skoll",
    image: "/images/world-bosses/skoll.webp",
    type: "World Boss",
    creatureType: "Besta",
    specialMechanic:
      "Skoll e Hati são irmãos eternos e lutam em sincronia. Enquanto ambos estiverem vivos, permanecem vinculados. Se um for derrotado, o sobrevivente recebe os bônus de Irmãos Eternos correspondentes ao seu nível.",
    levels: [
      { level: 12, stats: { hp: 100, mp: 210, est: 300, atk: 8, atkMgc: 12, def: 4, res: 46, agi: 16, int: 32, san: 1000 } },
      { level: 100, stats: { hp: 510, mp: 1389, est: 1670, atk: 30, atkMgc: 45, def: 15, res: 173, agi: 60, int: 120, san: 1300 } },
      { level: 200, stats: { hp: 1275, mp: 3158, est: 3725, atk: 52, atkMgc: 78, def: 26, res: 299, agi: 104, int: 208, san: 1600 } },
      { level: 300, stats: { hp: 2550, mp: 6105, est: 7150, atk: 79, atkMgc: 118, def: 39, res: 452, agi: 157, int: 315, san: 1900 } },
      { level: 400, stats: { hp: 5100, mp: 12000, est: 14000, atk: 135, atkMgc: 202, def: 67, res: 775, agi: 269, int: 539, san: 2200 } },
    ],
    passives: [
      {
        name: "Irmãos Eternos",
        description:
          "Enquanto Skoll e Hati estiverem vivos, os dois lutam em sincronia. Se um for derrotado, o sobrevivente recebe permanentemente: Lv.12: +2 ATK, +2 ATK MGC e +2 AGI; Lv.100: +3 em cada atributo e resistência à duração de efeitos negativos; Lv.200: +4 em cada atributo e resistência maior a efeitos negativos; Lv.300: +6 em cada atributo e duração de efeitos negativos drasticamente reduzida; Lv.400: enquanto ambos estiverem vivos, possuem alta resistência a efeitos negativos e, se um morrer, o sobrevivente recebe +10 ATK, +10 ATK MGC e +10 AGI até o final do combate.",
      },
    ],
    skills: [
      {
        name: "Feição Luminosa",
        description:
          "Custo: 30 MP / 25 EST. Dispara um poderoso raio de Luz, podendo atingir até 3 jogadores. Pode aplicar o efeito de aumento de sensibilidade previsto para a habilidade.",
      },
      {
        name: "Uivo Sagrado",
        description:
          "Custo: 35 MP / 20 EST. Skoll fortalece Hati, concedendo a ele bônus em todos os atributos: Lv.12 +1; Lv.100 +2; Lv.200 +3; Lv.300 +5; Lv.400 +8.",
      },
      {
        name: "Odor de Sangue",
        description:
          "Custo: 40 MP / 35 EST. Cria uma zona de 2 blocos. Inimigos dentro da área sofrem redução de ATK, ATK MGC e AGI: Lv.12 -1; Lv.100 -2; Lv.200 -3; Lv.300 -4; Lv.400 -4.",
      },
      {
        name: "Eclipse Final",
        description:
          "Custo definido pela versão atual dos status. Skoll e Hati combinam Luz e Trevas, criando um Eclipse que representa o ápice do poder dos dois irmãos.",
        unlockLevel: 400,
        ultimate: true,
      },
    ],
  },

  {
    id: "hati",
    image: "/images/world-bosses/hati.webp",
    type: "World Boss",
    creatureType: "Besta",
    specialMechanic:
      "Hati e Skoll são irmãos eternos e lutam em sincronia. Enquanto ambos estiverem vivos, permanecem vinculados. Se um for derrotado, o sobrevivente recebe os bônus de Irmãos Eternos correspondentes ao seu nível.",
    levels: [
      { level: 12, stats: { hp: 100, mp: 160, est: 300, atk: 12, atkMgc: 8, def: 9, res: 30, agi: 14, int: 21, san: 1000 } },
      { level: 100, stats: { hp: 490, mp: 1244, est: 1770, atk: 45, atkMgc: 30, def: 34, res: 113, agi: 53, int: 79, san: 1300 } },
      { level: 200, stats: { hp: 1225, mp: 2870, est: 3975, atk: 78, atkMgc: 52, def: 59, res: 195, agi: 91, int: 137, san: 1600 } },
      { level: 300, stats: { hp: 2450, mp: 5580, est: 7650, atk: 118, atkMgc: 79, def: 89, res: 295, agi: 138, int: 207, san: 1900 } },
      { level: 400, stats: { hp: 4900, mp: 11000, est: 15000, atk: 202, atkMgc: 135, def: 152, res: 505, agi: 235, int: 354, san: 2200 } },
    ],
    passives: [
      {
        name: "Irmãos Eternos",
        description:
          "Enquanto Hati e Skoll estiverem vivos, os dois lutam em sincronia. Se um for derrotado, o sobrevivente recebe: Lv.12 +2 ATK, +2 ATK MGC e +2 AGI; Lv.100 +3 em cada atributo; Lv.200 +4 em cada atributo; Lv.300 +6 em cada atributo; Lv.400 +10 em cada atributo. A resistência a efeitos negativos também aumenta conforme o nível.",
      },
    ],
    skills: [
      {
        name: "Hate Cure",
        description:
          "Custo: 30 MP / 25 EST. Ataque de Trevas que aplica Infecção, restringindo a recuperação de HP/vida do alvo. Também pode aplicar Sangramento, causando dano a cada rodada.",
      },
      {
        name: "Sombra Odiosa",
        description:
          "Custo: 25 MP / 30 EST. Ataque de Trevas contra um único alvo. Não possui efeitos secundários adicionais; seu foco é causar alto dano direto.",
      },
 {
        name: "Uivo Grotesco",
        description:
          "Custo: 40 MP / 35 EST. Uivo de Trevas em uma área de até 2 blocos. Aplica Stun e o alvo afetado perde sua próxima ação.",
      },
      {
        name: "Eclipse Final",
        description:
          "Custo definido pela versão atual dos status. Skoll e Hati combinam Luz e Trevas, criando um Eclipse que representa o ápice do poder dos dois irmãos.",
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
