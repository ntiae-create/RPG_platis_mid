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

export type WorldCity = {
  id: string;
  continentId: string;
  name: string;
  type: "capital" | "city" | "village" | "outpost";
  x: number;
  y: number;
  population?: number;
  description?: string;
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

export const WORLD_CITIES: WorldCity[] = [
  {
    "id": "city-vindheim-1",
    "continentId": "vindheim",
    "name": "Stormheim",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Stormheim é um assentamento de vindheim."
  },
  {
    "id": "city-vindheim-2",
    "continentId": "vindheim",
    "name": "Vargard",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Vargard é um assentamento de vindheim."
  },
  {
    "id": "city-vindheim-3",
    "continentId": "vindheim",
    "name": "Skjold",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Skjold é um assentamento de vindheim."
  },
  {
    "id": "city-vindheim-4",
    "continentId": "vindheim",
    "name": "Ventobravo",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Ventobravo é um assentamento de vindheim."
  },
  {
    "id": "city-vindheim-5",
    "continentId": "vindheim",
    "name": "Hrafnvik",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Hrafnvik é um assentamento de vindheim."
  },
  {
    "id": "city-vindheim-6",
    "continentId": "vindheim",
    "name": "Pico do Trovão",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Pico do Trovão é um assentamento de vindheim."
  },
  {
    "id": "city-vindheim-7",
    "continentId": "vindheim",
    "name": "Posto dos Ventos",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Posto dos Ventos é um assentamento de vindheim."
  },
  {
    "id": "city-solheim-1",
    "continentId": "solheim",
    "name": "Aurora",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Aurora é um assentamento de solheim."
  },
  {
    "id": "city-solheim-2",
    "continentId": "solheim",
    "name": "Heliá",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Heliá é um assentamento de solheim."
  },
  {
    "id": "city-solheim-3",
    "continentId": "solheim",
    "name": "Solaria",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Solaria é um assentamento de solheim."
  },
  {
    "id": "city-solheim-4",
    "continentId": "solheim",
    "name": "Douravento",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Douravento é um assentamento de solheim."
  },
  {
    "id": "city-solheim-5",
    "continentId": "solheim",
    "name": "Lúmen",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Lúmen é um assentamento de solheim."
  },
  {
    "id": "city-solheim-6",
    "continentId": "solheim",
    "name": "Campo Solar",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Campo Solar é um assentamento de solheim."
  },
  {
    "id": "city-solheim-7",
    "continentId": "solheim",
    "name": "Vigia do Sol",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Vigia do Sol é um assentamento de solheim."
  },
  {
    "id": "city-nottland-1",
    "continentId": "nottland",
    "name": "Noxheim",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Noxheim é um assentamento de nottland."
  },
  {
    "id": "city-nottland-2",
    "continentId": "nottland",
    "name": "Nocturna",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Nocturna é um assentamento de nottland."
  },
  {
    "id": "city-nottland-3",
    "continentId": "nottland",
    "name": "Ebon",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Ebon é um assentamento de nottland."
  },
  {
    "id": "city-nottland-4",
    "continentId": "nottland",
    "name": "Véu Negro",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Véu Negro é um assentamento de nottland."
  },
  {
    "id": "city-nottland-5",
    "continentId": "nottland",
    "name": "Lua Baixa",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Lua Baixa é um assentamento de nottland."
  },
  {
    "id": "city-nottland-6",
    "continentId": "nottland",
    "name": "Umbra",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Umbra é um assentamento de nottland."
  },
  {
    "id": "city-nottland-7",
    "continentId": "nottland",
    "name": "Posto da Lua",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Posto da Lua é um assentamento de nottland."
  },
  {
    "id": "city-jordrike-1",
    "continentId": "jordrike",
    "name": "Pedrália",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Pedrália é um assentamento de jordrike."
  },
  {
    "id": "city-jordrike-2",
    "continentId": "jordrike",
    "name": "Monteserra",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Monteserra é um assentamento de jordrike."
  },
  {
    "id": "city-jordrike-3",
    "continentId": "jordrike",
    "name": "Rochaviva",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Rochaviva é um assentamento de jordrike."
  },
  {
    "id": "city-jordrike-4",
    "continentId": "jordrike",
    "name": "Eikgard",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Eikgard é um assentamento de jordrike."
  },
  {
    "id": "city-jordrike-5",
    "continentId": "jordrike",
    "name": "Vale da Raiz",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Vale da Raiz é um assentamento de jordrike."
  },
  {
    "id": "city-jordrike-6",
    "continentId": "jordrike",
    "name": "Pedra Alta",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Pedra Alta é um assentamento de jordrike."
  },
  {
    "id": "city-jordrike-7",
    "continentId": "jordrike",
    "name": "Vigia da Montanha",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Vigia da Montanha é um assentamento de jordrike."
  },
  {
    "id": "city-seidheim-1",
    "continentId": "seidheim",
    "name": "Runária",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Runária é um assentamento de seidheim."
  },
  {
    "id": "city-seidheim-2",
    "continentId": "seidheim",
    "name": "Eldrun",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Eldrun é um assentamento de seidheim."
  },
  {
    "id": "city-seidheim-3",
    "continentId": "seidheim",
    "name": "Verden",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Verden é um assentamento de seidheim."
  },
  {
    "id": "city-seidheim-4",
    "continentId": "seidheim",
    "name": "Raiz Serena",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Raiz Serena é um assentamento de seidheim."
  },
  {
    "id": "city-seidheim-5",
    "continentId": "seidheim",
    "name": "Folhaverde",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Folhaverde é um assentamento de seidheim."
  },
  {
    "id": "city-seidheim-6",
    "continentId": "seidheim",
    "name": "Bosque Antigo",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Bosque Antigo é um assentamento de seidheim."
  },
  {
    "id": "city-seidheim-7",
    "continentId": "seidheim",
    "name": "Vigia Rúnica",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Vigia Rúnica é um assentamento de seidheim."
  },
  {
    "id": "city-hafsvik-1",
    "continentId": "hafsvik",
    "name": "Maré Alta",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Maré Alta é um assentamento de hafsvik."
  },
  {
    "id": "city-hafsvik-2",
    "continentId": "hafsvik",
    "name": "Hafn",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Hafn é um assentamento de hafsvik."
  },
  {
    "id": "city-hafsvik-3",
    "continentId": "hafsvik",
    "name": "Vikstrand",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Vikstrand é um assentamento de hafsvik."
  },
  {
    "id": "city-hafsvik-4",
    "continentId": "hafsvik",
    "name": "Porto Azul",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Porto Azul é um assentamento de hafsvik."
  },
  {
    "id": "city-hafsvik-5",
    "continentId": "hafsvik",
    "name": "Ilha Serena",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Ilha Serena é um assentamento de hafsvik."
  },
  {
    "id": "city-hafsvik-6",
    "continentId": "hafsvik",
    "name": "Coralmar",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Coralmar é um assentamento de hafsvik."
  },
  {
    "id": "city-hafsvik-7",
    "continentId": "hafsvik",
    "name": "Farol Abissal",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Farol Abissal é um assentamento de hafsvik."
  },
  {
    "id": "city-eldfjall-1",
    "continentId": "eldfjall",
    "name": "Braseiro",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Braseiro é um assentamento de eldfjall."
  },
  {
    "id": "city-eldfjall-2",
    "continentId": "eldfjall",
    "name": "Vulkara",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Vulkara é um assentamento de eldfjall."
  },
  {
    "id": "city-eldfjall-3",
    "continentId": "eldfjall",
    "name": "Cinzerra",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Cinzerra é um assentamento de eldfjall."
  },
  {
    "id": "city-eldfjall-4",
    "continentId": "eldfjall",
    "name": "Caldeira",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Caldeira é um assentamento de eldfjall."
  },
  {
    "id": "city-eldfjall-5",
    "continentId": "eldfjall",
    "name": "Lavaforte",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Lavaforte é um assentamento de eldfjall."
  },
  {
    "id": "city-eldfjall-6",
    "continentId": "eldfjall",
    "name": "Fornalha",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Fornalha é um assentamento de eldfjall."
  },
  {
    "id": "city-eldfjall-7",
    "continentId": "eldfjall",
    "name": "Posto Ígneo",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Posto Ígneo é um assentamento de eldfjall."
  },
  {
    "id": "city-jarnvidr-1",
    "continentId": "jarnvidr",
    "name": "Ferroverde",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Ferroverde é um assentamento de jarnvidr."
  },
  {
    "id": "city-jarnvidr-2",
    "continentId": "jarnvidr",
    "name": "Jarnborg",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Jarnborg é um assentamento de jarnvidr."
  },
  {
    "id": "city-jarnvidr-3",
    "continentId": "jarnvidr",
    "name": "Aço Norte",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Aço Norte é um assentamento de jarnvidr."
  },
  {
    "id": "city-jarnvidr-4",
    "continentId": "jarnvidr",
    "name": "Folha de Ferro",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Folha de Ferro é um assentamento de jarnvidr."
  },
  {
    "id": "city-jarnvidr-5",
    "continentId": "jarnvidr",
    "name": "Ferrugem",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Ferrugem é um assentamento de jarnvidr."
  },
  {
    "id": "city-jarnvidr-6",
    "continentId": "jarnvidr",
    "name": "Forja Brava",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Forja Brava é um assentamento de jarnvidr."
  },
  {
    "id": "city-jarnvidr-7",
    "continentId": "jarnvidr",
    "name": "Posto de Aço",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Posto de Aço é um assentamento de jarnvidr."
  },
  {
    "id": "city-duat-1",
    "continentId": "duat",
    "name": "Anúris",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Anúris é um assentamento de duat."
  },
  {
    "id": "city-duat-2",
    "continentId": "duat",
    "name": "Kemet",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Kemet é um assentamento de duat."
  },
  {
    "id": "city-duat-3",
    "continentId": "duat",
    "name": "Areia Negra",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Areia Negra é um assentamento de duat."
  },
  {
    "id": "city-duat-4",
    "continentId": "duat",
    "name": "Necrópole",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Necrópole é um assentamento de duat."
  },
  {
    "id": "city-duat-5",
    "continentId": "duat",
    "name": "Oásis Morto",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Oásis Morto é um assentamento de duat."
  },
  {
    "id": "city-duat-6",
    "continentId": "duat",
    "name": "Olho de Rá",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Olho de Rá é um assentamento de duat."
  },
  {
    "id": "city-duat-7",
    "continentId": "duat",
    "name": "Vigia Funerária",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Vigia Funerária é um assentamento de duat."
  },
  {
    "id": "city-xibalba-1",
    "continentId": "xibalba",
    "name": "Obsidiana",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Obsidiana é um assentamento de xibalba."
  },
  {
    "id": "city-xibalba-2",
    "continentId": "xibalba",
    "name": "Xibal",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Xibal é um assentamento de xibalba."
  },
  {
    "id": "city-xibalba-3",
    "continentId": "xibalba",
    "name": "Batcán",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Batcán é um assentamento de xibalba."
  },
  {
    "id": "city-xibalba-4",
    "continentId": "xibalba",
    "name": "Caverna Alta",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Caverna Alta é um assentamento de xibalba."
  },
  {
    "id": "city-xibalba-5",
    "continentId": "xibalba",
    "name": "Pedra Sombria",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Pedra Sombria é um assentamento de xibalba."
  },
  {
    "id": "city-xibalba-6",
    "continentId": "xibalba",
    "name": "Eco Negro",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Eco Negro é um assentamento de xibalba."
  },
  {
    "id": "city-xibalba-7",
    "continentId": "xibalba",
    "name": "Posto do Abismo",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Posto do Abismo é um assentamento de xibalba."
  },
  {
    "id": "city-yomi-1",
    "continentId": "yomi",
    "name": "Yomira",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Yomira é um assentamento de yomi."
  },
  {
    "id": "city-yomi-2",
    "continentId": "yomi",
    "name": "Kage",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Kage é um assentamento de yomi."
  },
  {
    "id": "city-yomi-3",
    "continentId": "yomi",
    "name": "Neblina",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Neblina é um assentamento de yomi."
  },
  {
    "id": "city-yomi-4",
    "continentId": "yomi",
    "name": "Cedro Sombrio",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Cedro Sombrio é um assentamento de yomi."
  },
  {
    "id": "city-yomi-5",
    "continentId": "yomi",
    "name": "Vale das Almas",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Vale das Almas é um assentamento de yomi."
  },
  {
    "id": "city-yomi-6",
    "continentId": "yomi",
    "name": "Ponte Cinzenta",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Ponte Cinzenta é um assentamento de yomi."
  },
  {
    "id": "city-yomi-7",
    "continentId": "yomi",
    "name": "Vigia do Véu",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Vigia do Véu é um assentamento de yomi."
  },
  {
    "id": "city-wastes-1",
    "continentId": "wastes",
    "name": "Wendora",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Wendora é um assentamento de wastes."
  },
  {
    "id": "city-wastes-2",
    "continentId": "wastes",
    "name": "Gelo Feroz",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Gelo Feroz é um assentamento de wastes."
  },
  {
    "id": "city-wastes-3",
    "continentId": "wastes",
    "name": "Presadouro",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Presadouro é um assentamento de wastes."
  },
  {
    "id": "city-wastes-4",
    "continentId": "wastes",
    "name": "Tundra Alta",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Tundra Alta é um assentamento de wastes."
  },
  {
    "id": "city-wastes-5",
    "continentId": "wastes",
    "name": "Fome Branca",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Fome Branca é um assentamento de wastes."
  },
  {
    "id": "city-wastes-6",
    "continentId": "wastes",
    "name": "Neve Morta",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Neve Morta é um assentamento de wastes."
  },
  {
    "id": "city-wastes-7",
    "continentId": "wastes",
    "name": "Posto Congelado",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Posto Congelado é um assentamento de wastes."
  },
  {
    "id": "city-midgard-1",
    "continentId": "midgard",
    "name": "Nova Midgard",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Nova Midgard é um assentamento de midgard."
  },
  {
    "id": "city-midgard-2",
    "continentId": "midgard",
    "name": "Coração",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Coração é um assentamento de midgard."
  },
  {
    "id": "city-midgard-3",
    "continentId": "midgard",
    "name": "Valgard",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Valgard é um assentamento de midgard."
  },
  {
    "id": "city-midgard-4",
    "continentId": "midgard",
    "name": "Ponte Central",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Ponte Central é um assentamento de midgard."
  },
  {
    "id": "city-midgard-5",
    "continentId": "midgard",
    "name": "Campo Verde",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Campo Verde é um assentamento de midgard."
  },
  {
    "id": "city-midgard-6",
    "continentId": "midgard",
    "name": "Mercado Velho",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Mercado Velho é um assentamento de midgard."
  },
  {
    "id": "city-midgard-7",
    "continentId": "midgard",
    "name": "Posto Central",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Posto Central é um assentamento de midgard."
  },
  {
    "id": "city-asgard-1",
    "continentId": "asgard",
    "name": "Asgard",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Asgard é um assentamento de asgard."
  },
  {
    "id": "city-asgard-2",
    "continentId": "asgard",
    "name": "Valhalla",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Valhalla é um assentamento de asgard."
  },
  {
    "id": "city-asgard-3",
    "continentId": "asgard",
    "name": "Ouro Alto",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Ouro Alto é um assentamento de asgard."
  },
  {
    "id": "city-asgard-4",
    "continentId": "asgard",
    "name": "Bifröst",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Bifröst é um assentamento de asgard."
  },
  {
    "id": "city-asgard-5",
    "continentId": "asgard",
    "name": "Cidadela Celeste",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Cidadela Celeste é um assentamento de asgard."
  },
  {
    "id": "city-asgard-6",
    "continentId": "asgard",
    "name": "Aurílea",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Aurílea é um assentamento de asgard."
  },
  {
    "id": "city-asgard-7",
    "continentId": "asgard",
    "name": "Portão Superior",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Portão Superior é um assentamento de asgard."
  },
  {
    "id": "city-jotunheim-1",
    "continentId": "jotunheim",
    "name": "Jotun",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Jotun é um assentamento de jotunheim."
  },
  {
    "id": "city-jotunheim-2",
    "continentId": "jotunheim",
    "name": "Gigantheim",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Gigantheim é um assentamento de jotunheim."
  },
  {
    "id": "city-jotunheim-3",
    "continentId": "jotunheim",
    "name": "Pedra Colossal",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Pedra Colossal é um assentamento de jotunheim."
  },
  {
    "id": "city-jotunheim-4",
    "continentId": "jotunheim",
    "name": "Vale dos Gigantes",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Vale dos Gigantes é um assentamento de jotunheim."
  },
  {
    "id": "city-jotunheim-5",
    "continentId": "jotunheim",
    "name": "Punho de Pedra",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Punho de Pedra é um assentamento de jotunheim."
  },
  {
    "id": "city-jotunheim-6",
    "continentId": "jotunheim",
    "name": "Campo Antigo",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Campo Antigo é um assentamento de jotunheim."
  },
  {
    "id": "city-jotunheim-7",
    "continentId": "jotunheim",
    "name": "Posto Colossal",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Posto Colossal é um assentamento de jotunheim."
  },
  {
    "id": "city-alfheim-1",
    "continentId": "alfheim",
    "name": "Alfheim",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Alfheim é um assentamento de alfheim."
  },
  {
    "id": "city-alfheim-2",
    "continentId": "alfheim",
    "name": "Lúthien",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Lúthien é um assentamento de alfheim."
  },
  {
    "id": "city-alfheim-3",
    "continentId": "alfheim",
    "name": "Elaria",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Elaria é um assentamento de alfheim."
  },
  {
    "id": "city-alfheim-4",
    "continentId": "alfheim",
    "name": "Luzverde",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Luzverde é um assentamento de alfheim."
  },
  {
    "id": "city-alfheim-5",
    "continentId": "alfheim",
    "name": "Bosque Dourado",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Bosque Dourado é um assentamento de alfheim."
  },
  {
    "id": "city-alfheim-6",
    "continentId": "alfheim",
    "name": "Fonte Élfica",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Fonte Élfica é um assentamento de alfheim."
  },
  {
    "id": "city-alfheim-7",
    "continentId": "alfheim",
    "name": "Vigia das Fadas",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Vigia das Fadas é um assentamento de alfheim."
  },
  {
    "id": "city-svartalfheim-1",
    "continentId": "svartalfheim",
    "name": "Svartborg",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Svartborg é um assentamento de svartalfheim."
  },
  {
    "id": "city-svartalfheim-2",
    "continentId": "svartalfheim",
    "name": "Nidavellir",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Nidavellir é um assentamento de svartalfheim."
  },
  {
    "id": "city-svartalfheim-3",
    "continentId": "svartalfheim",
    "name": "Forja Negra",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Forja Negra é um assentamento de svartalfheim."
  },
  {
    "id": "city-svartalfheim-4",
    "continentId": "svartalfheim",
    "name": "Subferro",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Subferro é um assentamento de svartalfheim."
  },
  {
    "id": "city-svartalfheim-5",
    "continentId": "svartalfheim",
    "name": "Pedra Profunda",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Pedra Profunda é um assentamento de svartalfheim."
  },
  {
    "id": "city-svartalfheim-6",
    "continentId": "svartalfheim",
    "name": "Martelo Fundo",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Martelo Fundo é um assentamento de svartalfheim."
  },
  {
    "id": "city-svartalfheim-7",
    "continentId": "svartalfheim",
    "name": "Posto das Forjas",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Posto das Forjas é um assentamento de svartalfheim."
  },
  {
    "id": "city-muspelheim-1",
    "continentId": "muspelheim",
    "name": "Muspel",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Muspel é um assentamento de muspelheim."
  },
  {
    "id": "city-muspelheim-2",
    "continentId": "muspelheim",
    "name": "Ignivar",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Ignivar é um assentamento de muspelheim."
  },
  {
    "id": "city-muspelheim-3",
    "continentId": "muspelheim",
    "name": "Brasa Alta",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Brasa Alta é um assentamento de muspelheim."
  },
  {
    "id": "city-muspelheim-4",
    "continentId": "muspelheim",
    "name": "Fornalha Rubra",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Fornalha Rubra é um assentamento de muspelheim."
  },
  {
    "id": "city-muspelheim-5",
    "continentId": "muspelheim",
    "name": "Cinza Viva",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Cinza Viva é um assentamento de muspelheim."
  },
  {
    "id": "city-muspelheim-6",
    "continentId": "muspelheim",
    "name": "Rio de Magma",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Rio de Magma é um assentamento de muspelheim."
  },
  {
    "id": "city-muspelheim-7",
    "continentId": "muspelheim",
    "name": "Posto Ardente",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Posto Ardente é um assentamento de muspelheim."
  },
  {
    "id": "city-niflheim-1",
    "continentId": "niflheim",
    "name": "Nifl",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Nifl é um assentamento de niflheim."
  },
  {
    "id": "city-niflheim-2",
    "continentId": "niflheim",
    "name": "Névoa Alta",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Névoa Alta é um assentamento de niflheim."
  },
  {
    "id": "city-niflheim-3",
    "continentId": "niflheim",
    "name": "Gelo Eterno",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Gelo Eterno é um assentamento de niflheim."
  },
  {
    "id": "city-niflheim-4",
    "continentId": "niflheim",
    "name": "Brumária",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Brumária é um assentamento de niflheim."
  },
  {
    "id": "city-niflheim-5",
    "continentId": "niflheim",
    "name": "Vale Branco",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Vale Branco é um assentamento de niflheim."
  },
  {
    "id": "city-niflheim-6",
    "continentId": "niflheim",
    "name": "Frio Antigo",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Frio Antigo é um assentamento de niflheim."
  },
  {
    "id": "city-niflheim-7",
    "continentId": "niflheim",
    "name": "Posto da Névoa",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Posto da Névoa é um assentamento de niflheim."
  },
  {
    "id": "city-helheim-1",
    "continentId": "helheim",
    "name": "Helgard",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Helgard é um assentamento de helheim."
  },
  {
    "id": "city-helheim-2",
    "continentId": "helheim",
    "name": "Garm",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Garm é um assentamento de helheim."
  },
  {
    "id": "city-helheim-3",
    "continentId": "helheim",
    "name": "Portão Morto",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Portão Morto é um assentamento de helheim."
  },
  {
    "id": "city-helheim-4",
    "continentId": "helheim",
    "name": "Cinza Inferior",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Cinza Inferior é um assentamento de helheim."
  },
  {
    "id": "city-helheim-5",
    "continentId": "helheim",
    "name": "Vale Silencioso",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Vale Silencioso é um assentamento de helheim."
  },
  {
    "id": "city-helheim-6",
    "continentId": "helheim",
    "name": "Última Ponte",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Última Ponte é um assentamento de helheim."
  },
  {
    "id": "city-helheim-7",
    "continentId": "helheim",
    "name": "Posto dos Mortos",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Posto dos Mortos é um assentamento de helheim."
  },
  {
    "id": "city-vanaheim-1",
    "continentId": "vanaheim",
    "name": "Vana",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Vana é um assentamento de vanaheim."
  },
  {
    "id": "city-vanaheim-2",
    "continentId": "vanaheim",
    "name": "Verdália",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Verdália é um assentamento de vanaheim."
  },
  {
    "id": "city-vanaheim-3",
    "continentId": "vanaheim",
    "name": "Fertília",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Fertília é um assentamento de vanaheim."
  },
  {
    "id": "city-vanaheim-4",
    "continentId": "vanaheim",
    "name": "Campo Dourado",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Campo Dourado é um assentamento de vanaheim."
  },
  {
    "id": "city-vanaheim-5",
    "continentId": "vanaheim",
    "name": "Jardim dos Vanir",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Jardim dos Vanir é um assentamento de vanaheim."
  },
  {
    "id": "city-vanaheim-6",
    "continentId": "vanaheim",
    "name": "Rio Fértil",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Rio Fértil é um assentamento de vanaheim."
  },
  {
    "id": "city-vanaheim-7",
    "continentId": "vanaheim",
    "name": "Posto Verde",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Posto Verde é um assentamento de vanaheim."
  },
  {
    "id": "city-platis-1",
    "continentId": "platis",
    "name": "Platis",
    "type": "capital",
    "x": 993,
    "y": 1492,
    "population": 25000,
    "description": "Platis é um assentamento de platis."
  },
  {
    "id": "city-platis-2",
    "continentId": "platis",
    "name": "Nova Platis",
    "type": "city",
    "x": 997,
    "y": 1493,
    "population": 5000,
    "description": "Nova Platis é um assentamento de platis."
  },
  {
    "id": "city-platis-3",
    "continentId": "platis",
    "name": "Brasília",
    "type": "city",
    "x": 1001,
    "y": 1494,
    "population": 5000,
    "description": "Brasília é um assentamento de platis."
  },
  {
    "id": "city-platis-4",
    "continentId": "platis",
    "name": "Coração de Platis",
    "type": "city",
    "x": 1003,
    "y": 1496,
    "population": 5000,
    "description": "Coração de Platis é um assentamento de platis."
  },
  {
    "id": "city-platis-5",
    "continentId": "platis",
    "name": "Cidade dos Brasões",
    "type": "village",
    "x": 994,
    "y": 1498,
    "population": 800,
    "description": "Cidade dos Brasões é um assentamento de platis."
  },
  {
    "id": "city-platis-6",
    "continentId": "platis",
    "name": "Mercado Central",
    "type": "village",
    "x": 999,
    "y": 1499,
    "population": 800,
    "description": "Mercado Central é um assentamento de platis."
  },
  {
    "id": "city-platis-7",
    "continentId": "platis",
    "name": "Posto Real",
    "type": "outpost",
    "x": 1004,
    "y": 1500,
    "population": 250,
    "description": "Posto Real é um assentamento de platis."
  }
];

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
  cooldown?: number;
  affinityId?: "fogo" | "agua" | "terra" | "vento" | "luz" | "trevas" | "fisico" | "magico";
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
    id: "wendigo",
    image: "/images/world-bosses/wendigo.webp",
    type: "World Boss",
    creatureType: "Espírito Corrompido — Predador Abissal",
    specialMechanic: "A Transformação: a cada 3 turnos a fome aumenta e Wendigo recebe 1 ação extra no turno seguinte. Quando alguém cai, Wendigo se fortalece com a vítima. Quanto mais consome, mais difícil a batalha se torna.",
    levels: [
      { level: 12, stats: { hp: 100, mp: 165, est: 335, atk: 16, atkMgc: 13, agi: 15, def: 8, res: 36, int: 17, san: 1000 } },
      { level: 100, stats: { hp: 1000, mp: 1265, est: 1875, atk: 60, atkMgc: 49, agi: 56, def: 30, res: 134, int: 64, san: 1300 } },
      { level: 200, stats: { hp: 2500, mp: 2940, est: 4115, atk: 102, atkMgc: 83, agi: 95, def: 51, res: 230, int: 109, san: 1600 } },
      { level: 300, stats: { hp: 5000, mp: 5730, est: 7790, atk: 155, atkMgc: 126, agi: 145, def: 78, res: 350, int: 166, san: 1900 } },
      { level: 400, stats: { hp: 10000, mp: 11200, est: 14900, atk: 265, atkMgc: 215, agi: 247, def: 133, res: 595, int: 283, san: 2200 } },
    ],
    passives: [
      { name: "Fome Incessante", description: "Cada vez que um inimigo sofre dano, Wendigo recebe +4% ATK e +2% AGI, acumulando até +40% ATK e +20% AGI. Se alguém cair, Wendigo recebe o dobro do acúmulo." },
      { name: "Gélido Abraço", description: "Os ataques de Wendigo aplicam Frio: -1 AGI por 2 turnos, acumulável até 3 vezes. Com 3 acúmulos de Frio, o alvo sofre Congelamento e fica incapacitado por 1 turno." },
      { name: "Carne que Rouba", description: "20% do dano causado é convertido em cura. O excesso acima do HP máximo vira Carne Extra, um escudo que absorve dano." },
      { name: "Presença da Neve Eterna", description: "O campo inteiro congela. Todos os personagens gastam +25% EST em ações. Enquanto um inimigo estiver Congelado, sua recuperação de vida é reduzida pela metade." },
      { name: "O Vazio Interior — Suprema", description: "Inimigos abaixo de 50% HP recebem +30% de dano de todas as fontes de Wendigo. Abaixo de 25% HP não podem se curar. Cada inimigo derrotado concede +10% em todos os atributos permanentemente." },
    ],
    skills: [
      { name: "Garras de Gelo", description: "Corpo a corpo. 20 MP · 18 EST. Dano de Gelo + Trevas e aplica 1 pilha de Frio.", unlockLevel: 12 },
      { name: "Uivo da Solidão", description: "Área. 28 MP · 22 EST. Todos os alvos sofrem dano leve, -1 AGI por 2 turnos e -20% de cura recebida.", unlockLevel: 12 },
      { name: "Passo do Esquecimento", description: "Investida. 25 MP · 28 EST. Wendigo desaparece e reaparece atrás do alvo, causando dano surpresa, ignorando 15% DEF e aplicando Frio garantido pelas costas.", unlockLevel: 12 },
      { name: "Fome que Avança", description: "Golpe duplo. 35 MP · 35 EST. Dois ataques consecutivos; o segundo acerta mesmo se o primeiro for esquivado. Se o alvo estiver Congelado, causa +30% de dano.", unlockLevel: 200 },
      { name: "Névoa da Morte", description: "Zona. 45 MP · 40 EST. Cria uma área de neblina gélida que causa dano contínuo e acumula Frio. Ao sair, o efeito diminui.", unlockLevel: 300 },
      { name: "Devoração Absoluta", description: "Ultimate. 10% do MP máximo · 12% do EST máximo. Causa dano massivo a todos os inimigos. Alvos abaixo de 30% HP sofrem dano instantâneo proporcional à vida perdida. Se alguém cair através do golpe, Wendigo recupera 50% do HP máximo.", unlockLevel: 400, ultimate: true },
    ],
  },

  {
    id: "tsuchigumo",
    image: "/images/world-bosses/tsuchigumo.webp",
    type: "World Boss",
    creatureType: "Monstro Ancestral — Predador Subterrâneo",
    specialMechanic: "O Campo de Teias: Tsuchigumo transforma gradualmente o campo em seu território. As teias permitem movimento instantâneo para Tsuchigumo, dificultam os inimigos e podem ser destruídas por fogo ou destruição direta, mas são rapidamente reconstruídas. Quanto maior o domínio de teias, mais habilidades são desbloqueadas.",
    levels: [
      { level: 12, stats: { hp: 100, mp: 155, est: 345, atk: 15, atkMgc: 11, agi: 14, def: 9, res: 33, int: 15, san: 1000 } },
      { level: 100, stats: { hp: 1000, mp: 1190, est: 1925, atk: 56, atkMgc: 41, agi: 52, def: 34, res: 123, int: 56, san: 1300 } },
      { level: 200, stats: { hp: 2500, mp: 2770, est: 4235, atk: 95, atkMgc: 70, agi: 88, def: 58, res: 212, int: 96, san: 1600 } },
      { level: 300, stats: { hp: 5000, mp: 5400, est: 8000, atk: 144, atkMgc: 106, agi: 134, def: 88, res: 322, int: 146, san: 1900 } },
      { level: 400, stats: { hp: 10000, mp: 11000, est: 15000, atk: 245, atkMgc: 180, agi: 230, def: 150, res: 548, int: 248, san: 2200 } },
    ],
    passives: [
      { name: "Sensibilidade à Terra", description: "Tsuchigumo conhece a posição de todos no campo e não pode ser surpreendida. Inimigos que mudaram de posição durante o turno recebem +5% ATK de Tsuchigumo contra eles." },
      { name: "Fios que Prendem", description: "Cada ataque bem-sucedido aplica 1 Fio de Seda. Com 3 Fios de Seda, o alvo fica imobilizado por 1 turno. Os fios desaparecem gradualmente se o alvo permanecer parado." },
      { name: "Dupla Ameaça", description: "Ataques corpo a corpo podem atingir 2 alvos adjacentes quando próximos. Ataques à distância com teia podem se espalhar para mais 1 alvo próximo do alvo principal." },
      { name: "Solo Aliado", description: "Inimigos sobre teias ou terreno modificado sofrem -2 AGI e +20% de dano recebido. Enquanto Tsuchigumo estiver em sua própria teia, recebe +15% DEF e recupera 5% EST por turno." },
      { name: "Dominância Subterrânea — Suprema", description: "Tsuchigumo pode desaparecer no solo e reaparecer em qualquer teia existente. Sobre suas áreas, os custos de movimento dos inimigos dobram. Fios de Seda passam a causar dano contínuo enquanto permanecerem ativos." },
    ],
    skills: [
      { name: "Fio Lançado", description: "Alvo único. 18 MP · 15 EST. Dano leve, aplica 1 Fio de Seda e reduz o movimento do alvo em 1 bloco.", unlockLevel: 12 },
      { name: "Mordida Venenosa", description: "Corpo a corpo. 22 MP · 20 EST. Dano e Veneno por 2 turnos. Se o alvo possuir Fios de Seda, o Veneno dura +1 turno.", unlockLevel: 12 },
      { name: "Terremoto de Patas", description: "Área ao redor. 28 MP · 25 EST. Dano físico em todos os alvos adjacentes, derruba, remove uma ação parcial e cria uma área de teia ao redor de Tsuchigumo.", unlockLevel: 12 },
      { name: "Rede de Prisão", description: "Zona 3×3. 38 MP · 32 EST. Todos dentro recebem 2 Fios de Seda e não podem sair no próximo turno.", unlockLevel: 200 },
      { name: "Túnel das Sombras", description: "Teleporte + ataque. 45 MP · 38 EST. Tsuchigumo emerge sob o alvo, causando dano massivo, derrubando-o e criando uma teia. Se houver uma teia conectada, pode ser utilizado novamente no mesmo turno.", unlockLevel: 300 },
      { name: "Império de Fios", description: "Ultimate global. 10% do MP máximo · 12% do EST máximo. Cobre o campo inteiro com teias, aplica 2 Fios de Seda a todos os inimigos, causa dano de Terra + Sombras, impede que os fios acumulados desapareçam sozinhos por 3 turnos e recupera 10% do HP por teia ativa.", unlockLevel: 400, ultimate: true },
    ],
  },

  {
    id: "camazotz",
    image: "/images/world-bosses/camazotz.webp",
    type: "World Boss",
    creatureType: "Deus Ancestral — Predador Noturno",
    specialMechanic:
      "Formas: Lv.12 Morcego da Caverna; Lv.100 Voz da Noite; Lv.200 Dentes da Lua; Lv.300 Deus da Escuridão; Lv.400 Eclipse Total — Camazotz Supremo. A Noite que Cai: Turno 1 começa com o campo claro. No turno 3 ocorre a Noite Parcial e Camazotz recebe +15% ATK. No turno 5 ocorre a Noite Total e a Passiva Suprema é ativada. Se alguém tentar iluminar o campo, Camazotz pode apagar a luz novamente.",
    levels: [
      { level: 12, stats: { hp: 100, mp: 158, est: 342, atk: 15, atkMgc: 14, def: 8, res: 35, agi: 16, int: 18, san: 1000 } },
      { level: 100, stats: { hp: 1000, mp: 1205, est: 1895, atk: 58, atkMgc: 54, def: 31, res: 130, agi: 62, int: 67, san: 1300 } },
      { level: 200, stats: { hp: 2500, mp: 2795, est: 4195, atk: 98, atkMgc: 91, def: 53, res: 224, agi: 105, int: 114, san: 1600 } },
      { level: 300, stats: { hp: 5000, mp: 5465, est: 7940, atk: 150, atkMgc: 139, def: 81, res: 342, agi: 160, int: 175, san: 1900 } },
      { level: 400, stats: { hp: 10000, mp: 11050, est: 14970, atk: 255, atkMgc: 237, def: 138, res: 582, agi: 272, int: 298, san: 2200 } },
    ],
    passives: [
      {
        name: "Visão Noturna",
        description: "Camazotz não pode ser Cegado e não erra ataques contra alvos com menos de 50% HP. Inimigos com pouca vida deixam um rastro de sangue visível apenas para Camazotz.",
      },
      {
        name: "Sopro da Lua",
        description: "A cada ataque bem-sucedido, Camazotz recebe +8% ATK por 2 turnos, acumulável até +40% ATK. Se atacar durante a noite, o bônus dobra.",
      },
      {
        name: "Drenagem Sombria",
        description: "22% do dano causado é convertido em cura para Camazotz. Se o alvo estiver Sangrando, 35% do dano causado é convertido em cura.",
      },
      {
        name: "Ecos da Caverna",
        description: "Sempre que Camazotz utiliza uma habilidade, todos os inimigos sofrem -1 AGI no próximo turno. Se estiverem em uma área escura, também sofrem -10% RES.",
      },
      {
        name: "Noite Eterna — Suprema",
        description: "O campo se torna permanentemente escuro. Enquanto Noite Eterna estiver ativa, inimigos não podem receber bônus provenientes de Luz, recuperam apenas 50% da vida e Camazotz recebe +25% de dano contra todos.",
      },
    ],
    skills: [
      {
        name: "Mordida Sombria",
        description: "Lv.12 — Alvo Único — 20 MP · 17 EST. Causa dano de Trevas, aplica Sangramento por 2 turnos e recupera 10% do HP de Camazotz.",
        unlockLevel: 12,
      },
      {
        name: "Voo do Corvo",
        description: "Lv.12 — Investida — 24 MP · 21 EST. Camazotz atravessa o alvo em alta velocidade, causando dano, ignorando 18% da DEF e deixando um rastro de sombra no chão.",
        unlockLevel: 12,
      },
      {
        name: "Chamado dos Morcegos",
        description: "Lv.12 — Área — 30 MP · 26 EST. Invoca um enxame de morcegos que causa dano leve em todos os inimigos, aplica Sangramento por 1 turno e move Camazotz para trás após o ataque.",
        unlockLevel: 12,
      },
      {
        name: "Lua de Sangue",
        description: "Lv.200 — Zona — 38 MP · 34 EST. Cria uma área de luz vermelha. Quem permanecer dentro recebe +20% de dano e sofre Sangramento a cada turno. Enquanto estiver dentro da área, Camazotz se cura.",
        unlockLevel: 200,
      },
      {
        name: "Asas do Eclipse",
        description: "Lv.300 — Defesa + Ataque — 42 MP · 38 EST. Primeiro bloqueia o próximo ataque em área. Depois libera uma onda de Trevas que atinge todos os inimigos.",
        unlockLevel: 300,
      },
      {
        name: "Devorador da Escuridão",
        description: "Lv.400 — Ultimate — 10% do MP máximo · 12% do EST máximo. Camazotz se torna a própria noite, causando dano massivo a todos os inimigos e aplicando Sangramento máximo por 3 turnos. Se alguém cair através desse golpe, Camazotz recebe +15% ATK permanentemente.",
        unlockLevel: 400,
        ultimate: true,
      },
    ],
  },

  {
    id: "ammit",
    image: "/images/world-bosses/ammit.webp",
    type: "World Boss",
    creatureType: "Juízo Eterno — Monstro do Submundo",
    specialMechanic:
      "Formas: Lv.12 Guardiã do Limite; Lv.100 A Balança Pesada; Lv.200 Dentes do Julgamento; Lv.300 A Que Não Perdoa; Lv.400 Devoração Final — O Fim do Peso. A Balança: cada jogador possui Peso de 0 a 10. Ao causar dano recebe +1 Peso; ao receber dano recebe +2 Peso. Quanto maior o Peso, mais vulnerável o alvo se torna e mais dano recebe de Ammit. Ammit prioriza quem possui mais Peso. O Peso só diminui através de ações de proteção ou suporte.",
    levels: [
      { level: 12, stats: { hp: 100, mp: 160, est: 340, atk: 16, atkMgc: 12, def: 9, res: 34, agi: 13, int: 16, san: 1000 } },
      { level: 100, stats: { hp: 1000, mp: 1225, est: 1905, atk: 60, atkMgc: 45, def: 34, res: 127, agi: 49, int: 60, san: 1300 } },
      { level: 200, stats: { hp: 2500, mp: 2840, est: 4165, atk: 102, atkMgc: 76, def: 59, res: 218, agi: 84, int: 103, san: 1600 } },
      { level: 300, stats: { hp: 5000, mp: 5530, est: 7880, atk: 155, atkMgc: 116, def: 89, res: 332, agi: 128, int: 157, san: 1900 } },
      { level: 400, stats: { hp: 10000, mp: 11100, est: 14950, atk: 265, atkMgc: 198, def: 152, res: 565, agi: 220, int: 268, san: 2200 } },
    ],
    passives: [
      {
        name: "Pesagem do Coração",
        description: "Cada jogador acumula Peso. Ao causar dano recebe +1 Peso; ao receber dano recebe +2 Peso. Quanto maior o Peso acumulado, mais dano o alvo recebe de Ammit.",
      },
      {
        name: "Corpo de Rocha",
        description: "Ammit reduz todo dano recebido em 12%. Se for atacada no mesmo turno por mais de 2 alvos, sua resistência dobra temporariamente.",
      },
      {
        name: "Gula Sem Fim",
        description: "25% do dano causado é convertido em cura para Ammit. Se alguém cair, Ammit devora sua essência e recebe +20% do HP máximo e +10% ATK permanente.",
      },
      {
        name: "Imobilidade da Sentença",
        description: "Quem estiver com Peso máximo recebe -3 AGI e não pode desviar de ataques. Ammit ignora 20% da DEF de quem carrega Peso.",
      },
      {
        name: "Nada Resta — Suprema",
        description: "O Peso passa a acumular mais rapidamente. Quem cair abaixo de 30% HP ganha Peso Dobrado. Se Ammit derrotar alguém, o alvo não pode ser revivido por 3 turnos.",
      },
    ],
    skills: [
      {
        name: "Mordida Julgadora",
        description: "Lv.12 — Alvo Único — 22 MP · 18 EST. Causa dano físico e aplica +2 Peso. Se o alvo possuir 5 ou mais Peso, causa +20% de dano.",
        unlockLevel: 12,
      },
      {
        name: "Golpe de Cauda",
        description: "Lv.12 — Área Lateral — 25 MP · 22 EST. Atinge até 3 blocos, causa dano, empurra os alvos em 2 blocos e aplica +1 Peso a todos os atingidos.",
        unlockLevel: 12,
      },
      {
        name: "Abalo do Juízo",
        description: "Lv.12 — Área Global — 30 MP · 28 EST. Ammit faz o Peso colidir contra o solo, causando dano leve em todos e aplicando +1 Peso para cada jogador.",
        unlockLevel: 12,
      },
      {
        name: "Mandíbula da Verdade",
        description: "Lv.200 — Agarramento — 38 MP · 35 EST. Ammit avança e agarra o alvo. O alvo principal sofre dano massivo, fica Imobilizado por 1 turno e recebe +3 Peso. Se Ammit soltar o alvo antes, ele sofre dano extra.",
        unlockLevel: 200,
      },
      {
        name: "Sombra do Abismo",
        description: "Lv.300 — Área Persistente — 45 MP · 40 EST. Cria uma zona de escuridão. Quem permanecer dentro recebe +2 Peso por turno e recupera 50% menos vida. Ammit pode se mover livremente pela área.",
        unlockLevel: 300,
      },
      {
        name: "Devoração da Alma",
        description: "Lv.400 — Ultimate — 10% do MP máximo · 12% do EST máximo. Ammit abre sua boca sobre todos os inimigos, causando dano massivo. Inimigos abaixo de 50% HP recebem Peso máximo. Se alguém cair através desse golpe, não pode ser revivido e Ammit ganha bônus total.",
        unlockLevel: 400,
        ultimate: true,
      },
    ],
  },

  {
    id: "fenrir",
    image: "/images/world-bosses/fenrir.webp",
    type: "World Boss",
    creatureType: "Besta Divina / Predador Supremo",
    specialMechanic:
      "Formas: Lv.12 Lobo Selvagem; Lv.100 Fera da Fúria Crescente; Lv.200 O Pressagiado do Ragnarök; Lv.300 A Mandíbula do Destino; Lv.400 Ragnarök — O Fim dos Deuses. A Corrente Gleipnir: Fenrir começa limitado pela corrente, sofrendo -12% ATK e alcance de movimento reduzido. Cada golpe físico bem-sucedido ou dano recebido enfraquece a corrente. Ao atingir 4 enfraquecimentos, Gleipnir se rompe, remove a penalidade inicial, concede +15% ATK permanente e permite empurrar inimigos em acertos críticos.",
    levels: [
      { level: 12, stats: { hp: 100, mp: 140, est: 340, atk: 17, atkMgc: 8, def: 7, res: 28, agi: 16, int: 14, san: 1000 } },
      { level: 100, stats: { hp: 1000, mp: 1186, est: 1855, atk: 64, atkMgc: 30, def: 26, res: 104, agi: 60, int: 52, san: 1300 } },
      { level: 200, stats: { hp: 2500, mp: 2735, est: 4075, atk: 108, atkMgc: 51, def: 45, res: 180, agi: 102, int: 90, san: 1600 } },
      { level: 300, stats: { hp: 5000, mp: 5345, est: 7700, atk: 165, atkMgc: 78, def: 68, res: 275, agi: 156, int: 137, san: 1900 } },
      { level: 400, stats: { hp: 10000, mp: 10500, est: 15000, atk: 280, atkMgc: 132, def: 116, res: 470, agi: 265, int: 235, san: 2200 } },
    ],
    passives: [
      {
        name: "Força Bruta",
        description: "Quanto mais próximo do alvo, maior o dano. Ataques contra alvos adjacentes recebem +15% de dano físico. Ataques corpo a corpo possuem 10% de chance de quebrar guarda; quebrar guarda anula os bônus de DEF do alvo durante o turno.",
      },
      {
        name: "Fúria do Corpo",
        description: "A cada golpe recebido ou desferido, Fenrir recebe +4% ATK, acumulável até +30%. O bônus não diminui com o tempo e só começa a diminuir se Fenrir ficar 2 turnos consecutivos afastado de todos os inimigos.",
      },
      {
        name: "Corpo Indomável",
        description: "Fenrir é imune a Atordoamento e Empurrão. Efeitos que reduzem DEF ou ATK têm sua duração cortada pela metade. Com ≤50% HP recebe +15% DEF; com ≤25% HP recebe +30% DEF.",
      },
      {
        name: "Presença Esmagadora",
        description: "Inimigos adjacentes a Fenrir recebem -2 AGI e gastam +20% de EST ao realizar ações físicas. Ninguém consegue passar por Fenrir sem sofrer dano de passagem.",
      },
      {
        name: "O Peso do Mundo — Suprema",
        description: "Todos os ataques de Fenrir ignoram 25% da DEF do alvo. Quando Fenrir estiver abaixo de 25% HP, ativa Força Absoluta: ignora 50% da DEF do alvo e cada golpe bem-sucedido recupera 5% do HP de Fenrir.",
      },
    ],
    skills: [
      {
        name: "Mordida da Fera",
        description: "Lv.12 — Corpo a Corpo — 15 MP · 22 EST. Fenrir realiza uma investida violenta contra o alvo e causa dano físico elevado. Se o alvo estiver com menos de 50% HP, o acerto é garantido e o dano recebe +20%.",
        unlockLevel: 12,
      },
      {
        name: "Garras Rachadoras",
        description: "Lv.12 — Corpo a Corpo Duplo — 18 MP · 25 EST. Fenrir desfere dois golpes consecutivos. Se o primeiro golpe acertar, o segundo ignora 20% da DEF do alvo.",
        unlockLevel: 12,
      },
      {
        name: "Corrida do Predador",
        description: "Lv.12 — Investida em Linha — 20 MP · 30 EST. Fenrir avança em linha reta por até 4 blocos. Todos os inimigos no caminho são atingidos, sofrem dano físico, são derrubados e perdem sua ação no próximo turno.",
        unlockLevel: 12,
      },
      {
        name: "Pisada Colossal",
        description: "Lv.200 — Área ao Redor — 28 MP · 38 EST. Fenrir salta e causa enorme impacto contra o solo. Atinge todos os inimigos em até 2 blocos, causando dano físico e empurrando-os 2 blocos. Se o alvo colidir com um obstáculo, sofre dano adicional.",
        unlockLevel: 200,
      },
      {
        name: "Chibatada de Cauda",
        description: "Lv.300 — Área Traseira/Lateral — 32 MP · 42 EST. Fenrir realiza uma poderosa varredura com a cauda em alcance de 3 blocos. Causa dano físico, quebra a postura e remove os bônus defensivos dos alvos por 1 turno.",
        unlockLevel: 300,
      },
      {
        name: "MANDÍBULA DO RAGNARÖK",
        description: "Lv.400 — Ultimate — Alvo + Área — 8% do MP máximo · 12% do EST máximo. Fenrir agarra e esmaga o alvo principal, causando dano físico massivo. Uma onda de choque atinge todos os inimigos adjacentes. Se Gleipnir estiver rompida,  dobra a penetração de DEF e Fenrir recupera 10% do HP.",
        unlockLevel: 400,
        ultimate: true,
      },
    ],
  },

  {
    id: "raiju",
    image: "/images/world-bosses/raiju.webp",
    type: "World Boss",
    creatureType: "Besta Celeste / Fúria Incandescente",
    specialMechanic:
      "Formas: Lv.12 Fera da Centelha; Lv.100 Lobo da Chama Viva; Lv.200 Corpo em Combustão; Lv.300 A Chama que Não Apaga; Lv.400 Sol em Forma de Fera — Fogo Eterno. O Campo em Chamas: Raiju deixa rastros de Fogo ao se mover. Quem pisa neles sofre dano leve e pode receber Combustão. Áreas em chamas se espalham lentamente a cada turno. Áreas alagadas ou resfriadas fazem o fogo recuar. Quando Raiju reacende o fogo, recupera força.",
    levels: [
      { level: 12, stats: { hp: 100, mp: 185, est: 315, atk: 15, atkMgc: 16, def: 6, res: 34, agi: 17, int: 22, san: 1000 } },
      { level: 100, stats: { hp: 1000, mp: 1390, est: 1800, atk: 56, atkMgc: 60, def: 22, res: 127, agi: 64, int: 83, san: 1300 } },
      { level: 200, stats: { hp: 2500, mp: 3230, est: 3960, atk: 95, atkMgc: 102, def: 38, res: 218, agi: 110, int: 142, san: 1600 } },
      { level: 300, stats: { hp: 5000, mp: 6300, est: 7475, atk: 144, atkMgc: 155, def: 58, res: 332, agi: 167, int: 216, san: 1900 } },
      { level: 400, stats: { hp: 10000, mp: 11900, est: 14600, atk: 245, atkMgc: 265, def: 99, res: 565, agi: 285, int: 368, san: 2200 } },
    ],
    passives: [
      {
        name: "Chama Inicial",
        description: "Cada ataque bem-sucedido aplica Combustão. Combustão causa dano contínuo de Fogo por 2 turnos e pode acumular até 3.",
      },
      {
        name: "Fogo Crescente",
        description: "Para cada alvo em Combustão: +8% ATK e +5% AGI, até o máximo de +24% ATK e +15% AGI.",
      },
      {
        name: "Corpo em Chama",
        description: "Quem atacar Raiju corpo a corpo recebe dano leve de Fogo de retorno. Se Raiju estiver abaixo de 50% HP, o retorno é dobrado.",
      },
      {
        name: "Chama que Se Alimenta",
        description: "Inimigos que sofrerem dano de Fogo não podem recuperar vida durante 1 turno. Se um inimigo cair enquanto estiver em Combustão, Raiju recupera 10% HP.",
      },
      {
        name: "Fogo Eterno — Suprema",
        description: "Combustão deixa de possuir duração e permanece até ser extinguida por água ou resfriamento. Se todos os inimigos estiverem queimando: +30% dano de Fogo e ataques ignoram 25% RES.",
      },
    ],
    skills: [
      {
        name: "Uivo da Centelha",
        description: "Lv.12 — Área — 22 MP · 18 EST. Atinge todos os inimigos, causando dano leve de Fogo e 1 Combustão.",
        unlockLevel: 12,
      },
      {
        name: "Garras Incandescentes",
        description: "Lv.12 — Alvo único — 25 MP · 20 EST. Causa dano de Fogo + Combustão. Se já estiver queimando: +20% de dano.",
        unlockLevel: 12,
      },
      {
        name: "Corrida Flamejante",
        description: "Lv.12 — Investida em linha — 30 MP · 25 EST. Causa dano de Fogo e deixa um rastro de fogo.",
        unlockLevel: 12,
      },
      {
        name: "Explosão de Cinzas",
        description: "Lv.200 — Área ao redor — 40 MP · 32 EST. Atinge inimigos em até 2 blocos, causa dano de Fogo e aplica Combustão extra. Se já estiver queimando, espalha fogo para inimigos adjacentes.",
        unlockLevel: 200,
      },
      {
        name: "Relâmpago em Chama",
        description: "Lv.300 — Alvo + área — 48 MP · 38 EST. Causa dano massivo de Fogo no alvo principal e ondas de choque flamejantes nos inimigos ao redor.",
        unlockLevel: 300,
      },
      {
        name: "O SOL DESPERTO",
        description: "Lv.400 — Ultimate Global — 10% MP máximo · 10% EST máximo. Causa dano massivo de Fogo a todos os inimigos e aplica Combustão máxima, com 3 acúmulos. Se Fogo Eterno estiver ativo, renova e fortalece as chamas existentes.",
        unlockLevel: 400,
        ultimate: true,
      },
    ],
  },

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
    image: "/images/world-bosses/eikthyrnir.webp",
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
    id: "jormungandr",
    image: "/images/world-bosses/jormungandr.webp",
    type: "World Boss",
    creatureType: "Serpente Marinha / Boss Colossal",
    specialMechanic: "Jörmungandr ocupa dois pontos no campo: Cabeça e Cauda. Ataques em área atingem ambas se cobrirem o espaço entre elas. Efeitos de atordoamento e imobilidade afetam todo o corpo. Se separada por obstáculo, perde os bônus de suas passivas até se reconectar.",
    levels: [
      { level: 12, stats: { hp: 100, mp: 170, est: 320, atk: 15, atkMgc: 17, def: 7, res: 38, agi: 13, int: 25, san: 1000 } },
      { level: 100, stats: { hp: 1000, mp: 1285, est: 1790, atk: 56, atkMgc: 64, def: 26, res: 142, agi: 48, int: 94, san: 1300 } },
      { level: 200, stats: { hp: 2500, mp: 2990, est: 3920, atk: 95, atkMgc: 108, def: 45, res: 244, agi: 82, int: 162, san: 1600 } },
      { level: 300, stats: { hp: 5000, mp: 5835, est: 7380, atk: 144, atkMgc: 164, def: 68, res: 371, agi: 125, int: 246, san: 1900 } },
      { level: 400, stats: { hp: 10000, mp: 11500, est: 14500, atk: 245, atkMgc: 280, def: 116, res: 630, agi: 213, int: 418, san: 2200 } },
    ],
    passives: [
      { name: "Corpo Ininterrupto", description: "A serpente ocupa 2 blocos no campo. Ataques direcionados a uma parte têm 50% de chance de errar e acertar a outra parte." },
      { name: "Escamas Abissais", description: "A resistência a dano físico aumenta conforme o HP diminui: com HP ≤75%, +10%; ≤50%, +20%; ≤25%, +30%." },
      { name: "Fluxo Contínuo", description: "A cada turno, recupera 5% de MP e 3% de EST. Seus recursos não podem ser drenados." },
      { name: "Mar que Tudo Engole", description: "Inimigos que permanecem 2 turnos consecutivos adjacentes a Jörmungandr sofrem Arrastão: deslocamento forçado em direção a ela e dano leve de Água." },
      { name: "Círculo do Mundo — Suprema", description: "Seus dois extremos se tocam, formando uma zona interna no centro do campo. Inimigos dentro dela recebem -2 AGI e têm o custo de EST aumentado em 50%. Abaixo de 25% de HP, entra em Ragnarök: perde resistências, mas recebe +30% ATK e +30% ATK MGC." },
    ],
    skills: [
      { name: "Golpe de Cauda", description: "Área traseira. Custo: 20 MP e 15 EST. A cauda chicoteia violentamente, atingindo 3 blocos atrás, causando dano de Água e empurrando os alvos em 2 blocos.", unlockLevel: 12 },
      { name: "Jato de Profundidade", description: "Linha à frente. Custo: 25 MP e 20 EST. A cabeça dispara um jato de água comprimida que atravessa toda a linha, causando dano e aplicando Molhado (-1 AGI por 2 turnos).", unlockLevel: 12 },
      { name: "Inundação", description: "Área ampla. Custo: 35 MP e 25 EST. O nível da água sobe, causando dano de Água e aplicando Molhado a todos. O terreno pode ser coberto.", unlockLevel: 12 },
      { name: "Redemoinho Eterno", description: "Zona circular. Custo: 45 MP e 35 EST. Cria um vórtice de 3×3 blocos que puxa inimigos ao centro e causa dano repetido por 2 turnos, dificultando a saída da área.", unlockLevel: 200 },
      { name: "Respiração do Abismo", description: "Linha massiva. Custo: 55 MP e 45 EST. Um jato pressurizado atravessa todo o campo, causando dano massivo e lançando os alvos 3 blocos para trás.", unlockLevel: 300 },
      { name: "Fim das Águas — Ragnarök", description: "Ultimate Lv.400. Custo: 10% do MP máximo e 10% do EST máximo. Causa dano massivo a todos e reconfigura o campo. Molhado permanece até o fim. Se ativada abaixo de 25% de HP, causa Renascimento: recupera 15% de HP e dobra a recuperação de MP e EST.", unlockLevel: 400, ultimate: true },
    ],
  },
  {
    id: "ratatoskr",
    image: "/images/world-bosses/ratatoskr.webp",
    type: "World Boss",
    creatureType: "Guardião da Árvore-Mundo",
    specialMechanic: "Antes do combate real, os jogadores precisam derrubar 12 Árvores Ancestrais. Enquanto houver árvores, Ratatoskr envia Ecos e Projeções e recupera 5% de MP por árvore intacta a cada turno. Cada árvore derrubada reduz permanentemente sua RES mágica em 10%. Quando a 12ª cai, as Projeções desaparecem, Ratatoskr desce da Grande Árvore e inicia o combate real com Energia Arcana máxima.",
    levels: [
      { level: 12, stats: { hp: 100, mp: 200, est: 290, atk: 9, atkMgc: 18, def: 5, res: 42, agi: 15, int: 30, san: 1000 } },
      { level: 100, stats: { hp: 1000, mp: 1490, est: 1655, atk: 34, atkMgc: 68, def: 19, res: 157, agi: 56, int: 112, san: 1300 } },
      { level: 200, stats: { hp: 2500, mp: 3450, est: 3635, atk: 58, atkMgc: 116, def: 32, res: 270, agi: 95, int: 192, san: 1600 } },
      { level: 300, stats: { hp: 5000, mp: 6725, est: 6900, atk: 88, atkMgc: 177, def: 49, res: 412, agi: 145, int: 293, san: 1900 } },
      { level: 400, stats: { hp: 10000, mp: 12500, est: 14300, atk: 150, atkMgc: 300, def: 84, res: 705, agi: 247, int: 500, san: 2200 } },
    ],
    passives: [
      {
        name: "Canal da Árvore",
        description: "A cada turno, acumula 1 Energia Arcana, até 5 pilhas. Cada pilha concede +8% Poder Mágico. Habilidades podem gastar as pilhas para serem amplificadas.",
      },
      {
        name: "Conhecimento em Crescimento",
        description: "A cada 3 turnos, recebe +10% ATK MGC e +5% INT. O bônus não possui limite e não diminui.",
      },
      {
        name: "Mensagem entre Planos",
        description: "Possui 20% de chance de duplicar um efeito, podendo resultar em alvo extra ou duração +1. Efeitos de Silêncio e Supressão têm sua duração reduzida pela metade.",
      },
      {
        name: "Fonte Inesgotável",
        description: "Recupera 8% de MP por turno. Quando o MP estiver cheio, gera um escudo mágico. Recursos mágicos não podem ser drenados nem bloqueados.",
      },
      {
        name: "A Árvore é Toda Parte — Suprema",
        description: "No Lv.400, sua magia possui alcance global. Cada habilidade utilizada concede +1 pilha de graça. As pilhas concedem +15% Poder Mágico por pilha e sua magia não pode ser anulada.",
      },
    ],
    skills: [
      {
        name: "Sussurro da Folhagem",
        description: "Alvo único. Custo: 18 MP e 12 EST. Dispara uma rajada de energia brilhante, causando dano mágico e concedendo +1 pilha de Energia Arcana.",
        unlockLevel: 12,
      },
      {
        name: "Caminho dos Ramos",
        description: "Área. Custo: 25 MP e 18 EST. Ramos de luz surgem no campo, causando dano em área e reduzindo a RES mágica em 10% por 2 turnos.",
        unlockLevel: 12,
      },
      {
        name: "Eco da Árvore",
        description: "Suporte. Custo: 20 MP e 15 EST. Libera a energia acumulada e gasta as pilhas de Energia Arcana para escolher entre restaurar MP da equipe ou amplificar o próximo ataque.",
        unlockLevel: 12,
      },
      {
        name: "Cascata de Luz",
        description: "Linha. Custo: 38 MP e 28 EST. Libera um poderoso fluxo de energia entre céu e terra, causando dano mágico massivo em linha e concedendo +2 pilhas de Energia Arcana.",
        unlockLevel: 200,
      },
      {
        name: "O Vento das Eras",
        description: "Global. Custo: 45 MP e 35 EST. Utiliza magia ancestral para causar dano contra todos os inimigos, atrasando os inimigos e acelerando os aliados.",
        unlockLevel: 300,
      },
      {
        name: "YGGDRASIL — RAIZ E CÉU",
        description: "Ultimate Lv.400. Custo: 12% do MP máximo e 8% do EST máximo. Manifesta a própria Árvore-Mundo, causando dano colossal, levando a Energia Arcana ao máximo e restaurando recursos. Enquanto a manifestação durar, a magia de Ratatoskr cresce continuamente a cada instante.",
        unlockLevel: 400,
        ultimate: true,
      },
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
