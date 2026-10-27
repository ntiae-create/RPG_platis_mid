import type { Gender, RaceDef, Stats } from "./types";

const s = (
  hp: number,
  mp: number,
  est: number,
  san: number,
  atk: number,
  atkMgc: number,
  def: number,
  res: number,
  agi: number,
  int: number,
): Stats => ({
  hp,
  mp,
  est,
  san,
  atk,
  atkMgc,
  def,
  res,
  agi,
  int,
});

export const RACES: RaceDef[] = [
  {
    id: "humano",
    name: "Humano",
    tier: "basic",
    portrait: "/portraits/humano.jpg",
    portraits: {
      masculino: "/portraits/humano_masculino.jpg",
      feminino: "/portraits/humano_feminino.jpg",
    },
    unlock: "start",
    passive: {
      name: "Adaptatividade",
      description:
        "No início de cada combate, escolhe +1 em um atributo até o fim da batalha.",
    },
    base: s(32, 23, 40, 100, 4, 4, 8, 8, 8, 15),
  },

  {
    id: "meio-elfo",
    name: "Meio-elfo",
    tier: "basic",
    portrait: "/portraits/meio-elfo.jpg",
    portraits: {
      masculino: "/portraits/meio-elfo_masculino.jpg",
      feminino: "/portraits/meio-elfo_feminino.jpg",
    },
    unlock: "start",
    passive: {
      name: "Atordoamento Élfico",
      description:
        "Ataques e habilidades possuem 20% de chance de causar Stun no alvo.",
    },
    base: s(30, 30, 35, 100, 5, 8, 5, 9, 8, 15),
  },

  {
    id: "elfo",
    name: "Elfo",
    tier: "basic",
    portrait: "/portraits/elfo.jpg",
    portraits: {
      masculino: "/portraits/elfo_masculino.jpg",
      feminino: "/portraits/elfo_feminino.jpg",
    },
    unlock: "start",
    passive: {
      name: "Atordoamento Ancestral",
      description:
        "Ataques e habilidades possuem 40% de chance de causar Stun no alvo.",
    },
    base: s(29, 33, 35, 100, 5, 8, 5, 9, 9, 16),
  },

  {
    id: "semi-besta",
    name: "Semi-besta",
    tier: "basic",
    portrait: "/portraits/semi-besta.jpg",
    portraits: {
      masculino: "/portraits/semi-besta_masculina.jpg",
      feminino: "/portraits/semi-besta_feminina.jpg",
    },
    unlock: "start",
    passive: {
      name: "Frenesi Controlado",
      description:
        "Ao ficar com 50% ou menos de HP, recebe +2 AGI até o fim do combate.",
    },
    base: s(37, 18, 45, 90, 9, 3, 7, 6, 12, 13),
  },

  {
    id: "besta",
    name: "Besta",
    tier: "basic",
    portrait: "/portraits/besta.jpg",
    portraits: {
      masculino: "/portraits/besta_masculina.jpg",
      feminino: "/portraits/besta_feminina.jpg",
    },
    unlock: "start",
    passive: {
      name: "Frenesi",
      description:
        "Ao ficar com 50% ou menos de HP, recebe +3 ATK até o fim do combate.",
    },
    base: s(42, 16, 50, 80, 12, 2, 8, 6, 10, 8),
  },

  {
    id: "lizard",
    name: "Lizard",
    tier: "rare",
    portrait: "/portraits/lizard.jpg",
    portraits: {
      masculino: "/portraits/lizard_masculino.jpg",
      feminino: "/portraits/lizard_feminino.jpg",
    },
    unlock: "xp",
    passive: {
      name: "Escamas de Aço",
      description:
        "Recebe 10% menos dano físico.",
    },
    base: s(40, 20, 42, 90, 9, 5, 12, 10, 8, 10),
  },

  {
    id: "aqua",
    name: "Aqua",
    tier: "rare",
    portrait: "/portraits/aqua.jpg",
    portraits: {
      masculino: "/portraits/aqua_masculino.jpg",
      feminino: "/portraits/aqua_feminino.jpg",
    },
    unlock: "xp",
    passive: {
      name: "Selos do Além",
      description:
        "Ataques possuem 20% de chance de aplicar um Selo do Além, reduzindo em 10% a recuperação de HP do alvo durante 2 turnos.",
    },
    base: s(28, 36, 32, 100, 5, 9, 6, 13, 9, 19),
  },

  {
    id: "morto-vivo",
    name: "Morto-vivo",
    tier: "rare",
    portrait: "/portraits/morto-vivo.jpg",
    portraits: {
      masculino: "/portraits/morto-vivo_masculino.jpg",
      feminino: "/portraits/morto-vivo_feminino.jpg",
    },
    unlock: "xp",
    passive: {
      name: "Criação Indesejada",
      description:
        "Quando um ataque o levaria a 0 HP, possui 20% de chance de permanecer com 1 HP.",
    },
    base: s(38, 22, 30, 60, 6, 6, 8, 8, 5, 12),
  },

  {
    id: "demonio",
    name: "Demônio",
    tier: "rare",
    portrait: "/portraits/demonio.jpg",
    portraits: {
      masculino: "/portraits/demonio_masculino.jpg",
      feminino: "/portraits/demonio_feminino.jpg",
    },
    unlock: "xp",
    passive: {
      name: "Injustiça Benigna",
      description:
        "Possui 20% de chance de ignorar completamente um efeito negativo recebido.",
    },
    base: s(40, 30, 40, 120, 13, 8, 8, 10, 9, 22),
  },

  {
    id: "divino",
    name: "Divino",
    tier: "rare",
    portrait: "/portraits/divino.jpg",
    portraits: {
      masculino: "/portraits/divino_masculino.jpg",
      feminino: "/portraits/divino_feminino.jpg",
    },
    unlock: "xp",
    passive: {
      name: "Justiça Maldita",
      description:
        "Possui 20% de chance de refletir um efeito negativo recebido de volta ao inimigo que o aplicou.",
    },
    base: s(30, 40, 40, 120, 8, 13, 8, 10, 9, 22),
  },

  {
    id: "driade",
    name: "Dríade",
    tier: "rare",
    portrait: "/portraits/driade.jpg",
    portraits: {
      masculino: "/portraits/driade_masculino.jpg",
      feminino: "/portraits/driade_feminino.jpg",
    },
    unlock: "xp",
    passive: {
      name: "Floresta da Vida",
      description:
        "Enquanto estiver em terreno natural, recupera 2% do HP máximo por turno.",
    },
    base: s(30, 45, 38, 160, 4, 11, 7, 9, 9, 17),
  },

  {
    id: "lupino",
    name: "Lupino",
    tier: "rare",
    portrait: "/portraits/lupino.jpg",
    portraits: {
      masculino: "/portraits/lupino_masculino.jpg",
      feminino: "/portraits/lupino_feminino.jpg",
    },
    unlock: "xp",
    passive: {
      name: "Instinto de Matilha",
      description:
        "Quando houver pelo menos 1 aliado próximo, recebe +2 AGI.",
    },
    base: s(40, 25, 45, 130, 13, 6, 8, 8, 13, 15),
  },

  {
    id: "anao",
    name: "Anão",
    tier: "rare",
    portrait: "/portraits/anao.jpg",
    portraits: {
      masculino: "/portraits/anao_masculino.jpg",
      feminino: "/portraits/anao_feminino.jpg",
    },
    unlock: "xp",
    passive: {
      name: "Constituição Anã",
      description:
        "Ao receber um ataque que reduziria seu HP para 50% ou menos, recebe +2 DEF até o fim do combate.",
    },
    base: s(40, 16, 38, 95, 7, 3, 15, 12, 4, 20),
  },

  {
    id: "orc",
    name: "Orc",
    tier: "rare",
    portrait: "/portraits/orc.jpg",
    portraits: {
      masculino: "/portraits/orc_masculino.jpg",
      feminino: "/portraits/orc_feminino.jpg",
    },
    unlock: "xp",
    passive: {
      name: "Fúria Orc",
      description:
        "FERA COVARDE — Ao entrar na batalha, todo personagem com nível inferior ou igual ao do Orc perde -1 de todos os atributos.",
    },
    base: s(44, 14, 46, 75, 10, 2, 10, 8, 6, 6),
  },

  {
    id: "goblin",
    name: "Goblin",
    tier: "rare",
    portrait: "/portraits/goblin.jpg",
    portraits: {
      masculino: "/portraits/goblin_masculino.jpg",
      feminino: "/portraits/goblin_feminino.jpg",
    },
    unlock: "xp",
    passive: {
      name: "Oportunista",
      description:
        "Ao atacar um inimigo com 50% ou menos de HP, causa +20% de dano.",
    },
    base: s(26, 20, 40, 80, 6, 4, 4, 5, 9, 16),
  },

  {
    id: "oni",
    name: "Oni",
    tier: "rare",
    portrait: "/portraits/oni.jpg",
    portraits: {
      masculino: "/portraits/oni_masculino.jpg",
      feminino: "/portraits/oni_feminino.jpg",
    },
    unlock: "xp",
    passive: {
      name: "Presença Demoníaca",
      description:
        "Inimigos próximos ao Oni sofrem -2 DEF enquanto ele estiver em combate.",
    },
    base: s(45, 20, 50, 110, 14, 5, 10, 8, 12, 14),
  },

  {
    id: "gigante",
    name: "Gigante",
    tier: "rare",
    portrait: "/portraits/gigante.jpg",
    portraits: {
      masculino: "/portraits/gigante_masculino.jpg",
      feminino: "/portraits/gigante_feminino.jpg",
    },
    unlock: "xp",
    passive: {
      name: "Força Colossal",
      description:
        "Ataques básicos possuem 20% de chance de causar Stun.",
    },
    base: s(50, 25, 55, 110, 15, 5, 17, 17, 4, 10),
  },

  {
    id: "quimera",
    name: "Quimera",
    tier: "rare",
    portrait: "/portraits/quimera.jpg",
    portraits: {
      masculino: "/portraits/quimera_masculino.jpg",
      feminino: "/portraits/quimera_feminino.jpg",
    },
    unlock: "xp",
    passive: {
      name: "Mutação",
      description:
        "No início da batalha, recebe +2 em um atributo aleatório.",
    },
    base: s(40, 30, 45, 80, 10, 10, 10, 10, 10, 10),
  },

  {
    id: "homunculo",
    name: "Homúnculo",
    tier: "rare",
    portrait: "/portraits/homunculo.jpg",
    portraits: {
      masculino: "/portraits/homunculo_masculino.jpg",
      feminino: "/portraits/homunculo_feminino.jpg",
    },
    unlock: "xp",
    passive: {
      name: "Corpo Artificial",
      description:
        "Ao ser derrotado, não morre nem concede XP; fica em Stun e pode ser reativado quando tocado por um personagem, retornando ao combate.",
    },
    base: s(30, 30, 60, 200, 5, 8, 8, 8, 6, 16),
  },

  {
    id: "dragonoide",
    name: "Dragonoide",
    tier: "legendary",
    portrait: "/portraits/dragonoide.jpg",
    portraits: {
      masculino: "/portraits/dragonoide_masculino.jpg",
      feminino: "/portraits/dragonoide_feminino.jpg",
    },
    unlock: "special",
    passive: {
      name: "Lazuli",
      description:
        "Cada acerto aplica 1 Marca Dracônica (máx. 5). Ao atingir 5, consome as marcas e ativa Efeito da Morte. Fúria do Dragão: +2 em todos os atributos e afinidade Fogo temporária.",
    },
    base: s(75, 54, 72, 194, 21, 16, 20, 17, 18, 30),
  },

  {
    id: "umbral",
    name: "Umbral",
    tier: "legendary",
    portrait: "/portraits/umbral.jpg",
    portraits: {
      masculino: "/portraits/umbral_masculino.jpg",
      feminino: "/portraits/umbral_feminino.jpg",
    },
    unlock: "special",
    passive: {
      name: "Marca do Vazio",
      description:
        "Ataques acumulam marcas; ao atingir 3, aplica Cegueira por 1 turno. Corpo Umbral e Forma da Marca do Vazio conforme regras do kit.",
    },
    base: s(66, 80, 69, 210, 17, 21, 15, 16, 20, 32),
  },

  {
    id: "vampiro",
    name: "Vampiro",
    tier: "extreme",
    portrait: "/portraits/vampiro.jpg",
    portraits: {
      masculino: "/portraits/vampiro_masculino.jpg",
      feminino: "/portraits/vampiro_feminino.jpg",
    },
    unlock: "special",
    passive: {
      name: "Blood Hugh",
      description:
        "3 Blood pelas habilidades-base; no máximo, regeneração/roubo de vida. Ataques com Sangramento recuperam 50% do dano em HP.",
    },
    base: s(72, 71, 66, 205, 19, 19, 15, 17, 19, 42),
  },

  {
    id: "fae",
    name: "Fae",
    tier: "extreme",
    portrait: "/portraits/fae.jpg",
    portraits: {
      masculino: "/portraits/fae_masculino.jpg",
      feminino: "/portraits/fae_feminino.jpg",
    },
    unlock: "special",
    passive: {
      name: "Frenesi Maluco",
      description:
        "Entra em Frenesi ao iniciar a batalha (+2 AGI e +2 ATK). Sorte Feérica e Travessura conforme regras do kit.",
    },
    base: s(60, 89, 80, 203, 17, 17, 15, 19, 21, 43),
  },

  {
    id: "doppelganger",
    name: "Doppelganger",
    tier: "extra",
    portrait: "/portraits/doppelganger.jpg",
    portraits: {
      masculino: "/portraits/doppelganger_masculino.jpg",
      feminino: "/portraits/doppelganger_feminino.jpg",
    },
    unlock: "special",
    passive: {
      name: "Assimilação",
      description:
        "Stacks de assimilação, Maldito Espelho, Liberação de Desespero e Alma Ronin conforme regras do kit.",
    },
    base: s(110, 110, 110, 250, 25, 20, 21, 21, 22, 50),
  },

  {
    id: "kitsune",
    name: "Kitsune",
    tier: "extra",
    portrait: "/portraits/kitsune.jpg",
    portraits: {
      masculino: "/portraits/kitsune_masculino.jpg",
      feminino: "/portraits/kitsune_feminino.jpg",
    },
    unlock: "special",
    passive: {
      name: "Mestre Ilusionista",
      description:
        "Ilusão, Cartas do Além, Joker, Liberação de Desespero e Caudas Vingativas conforme regras do kit.",
    },
    base: s(110, 110, 110, 250, 20, 25, 21, 20, 23, 50),
  },
];

export const RACE_BY_ID = Object.fromEntries(
  RACES.map((race) => [race.id, race]),
) as Record<string, RaceDef>;

export function racePortrait(
  race: RaceDef,
  gender?: Gender | null,
): string {
  if (gender && race.portraits?.[gender]) return race.portraits[gender]!;
  return race.portrait;
}
