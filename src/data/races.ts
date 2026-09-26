import type { RaceDef, Stats } from "./types";

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
): Stats => ({ hp, mp, est, san, atk, atkMgc, def, res, agi, int });

/**
 * =========================================================
 * MECÂNICA DE DESESPERO
 * =========================================================
 *
 * Doppelganger e Kitsune podem liberar 170% de sua capacidade
 * quando a condição de desespero for ativada pelo sistema de
 * combate.
 *
 * "Status atual + 170%" = 270% do status atual.
 *
 * Exemplo:
 * 10 ATK → 27 ATK
 * 40 HP  → 108 HP
 *
 * O multiplicador é aplicado sobre os status atuais, portanto
 * acompanha automaticamente o crescimento do personagem,
 * incluindo níveis altos e pontos distribuídos.
 */

export const DESPERATION_BONUS_PERCENT = 170;
export const DESPERATION_MULTIPLIER = 1 + DESPERATION_BONUS_PERCENT / 100;

/**
 * Libera 170% adicionais dos status atuais.
 *
 * Arredondamento normal para manter os atributos inteiros.
 */
export const applyDesperationStats = (stats: Stats): Stats => ({
  hp: Math.round(stats.hp * DESPERATION_MULTIPLIER),
  mp: Math.round(stats.mp * DESPERATION_MULTIPLIER),
  est: Math.round(stats.est * DESPERATION_MULTIPLIER),
  san: Math.round(stats.san * DESPERATION_MULTIPLIER),
  atk: Math.round(stats.atk * DESPERATION_MULTIPLIER),
  atkMgc: Math.round(stats.atkMgc * DESPERATION_MULTIPLIER),
  def: Math.round(stats.def * DESPERATION_MULTIPLIER),
  res: Math.round(stats.res * DESPERATION_MULTIPLIER),
  agi: Math.round(stats.agi * DESPERATION_MULTIPLIER),
  int: Math.round(stats.int * DESPERATION_MULTIPLIER),
});

export const RACES: RaceDef[] = [
  {
    id: "humano",
    name: "Humano",
    tier: "basic",
    portrait: "/portraits/humano.jpg",
    unlock: "start",
    passive: {
      name: "Adaptatividade",
      description:
        "Ao sofrer um efeito negativo pela primeira vez, adapta-se. Na próxima aplicação do mesmo efeito, duração reduzida em 1 turno.",
    },
    base: s(32, 23, 40, 100, 4, 4, 8, 8, 8, 15),
  },
  {
    id: "meio-elfo",
    name: "Meio-elfo",
    tier: "basic",
    portrait: "/portraits/meio-elfo.jpg",
    unlock: "start",
    passive: {
      name: "Atordoamento Élfico",
      description: "Ataques e habilidades: 20% chance de Stun.",
    },
    base: s(30, 30, 35, 100, 3, 7, 6, 9, 10, 15),
  },
  {
    id: "elfo",
    name: "Elfo",
    tier: "basic",
    portrait: "/portraits/elfo.jpg",
    unlock: "start",
    passive: {
      name: "Atordoamento Ancestral",
      description: "Ataques e habilidades: 40% chance de Stun.",
    },
    base: s(29, 33, 35, 100, 3, 8, 5, 9, 12, 16),
  },
  {
    id: "semi-besta",
    name: "Semi-besta",
    tier: "basic",
    portrait: "/portraits/semi-besta.jpg",
    unlock: "start",
    passive: {
      name: "Frenesi Controlado",
      description: "≤50% HP → +2 AGI até o fim do combate.",
    },
    base: s(37, 18, 45, 90, 9, 3, 7, 6, 10, 10),
  },
  {
    id: "besta",
    name: "Besta",
    tier: "basic",
    portrait: "/portraits/besta.jpg",
    unlock: "start",
    passive: {
      name: "Frenesi",
      description: "≤50% HP → +3 ATK até o fim do combate.",
    },
    base: s(42, 16, 50, 80, 11, 2, 6, 5, 9, 6),
  },
  {
    id: "lizard",
    name: "Lizard",
    tier: "rare",
    portrait: "/portraits/semi-besta.jpg",
    unlock: "mission",
    passive: {
      name: "Escamas de Aço",
      description: "Recebe 10% menos dano físico.",
    },
    base: s(40, 20, 42, 90, 7, 3, 10, 7, 6, 10),
  },
  {
    id: "aqua",
    name: "Aqua",
    tier: "rare",
    portrait: "/portraits/elfo.jpg",
    unlock: "mission",
    passive: {
      name: "Selos do Além",
      description:
        "20% chance de aplicar Selo do Além (−10% recuperação de HP do alvo por 2 turnos).",
    },
    base: s(28, 36, 32, 100, 3, 8, 5, 10, 9, 14),
  },
  {
    id: "morto-vivo",
    name: "Morto-vivo",
    tier: "rare",
    portrait: "/portraits/vampiro.jpg",
    unlock: "mission",
    passive: {
      name: "Criação Indesejada",
      description:
        "Ao receber dano que levaria a 0 HP: 20% chance de permanecer com 1 HP.",
    },
    base: s(38, 22, 30, 60, 6, 6, 8, 8, 5, 12),
  },
  {
    id: "demonio",
    name: "Demônio",
    tier: "rare",
    portrait: "/portraits/vampiro.jpg",
    unlock: "mission",
    passive: {
      name: "Injustiça Benigna",
      description: "20% chance de ignorar completamente um efeito negativo.",
    },
    base: s(34, 28, 38, 70, 8, 7, 6, 6, 9, 12),
  },
  {
    id: "divino",
    name: "Divino",
    tier: "rare",
    portrait: "/portraits/elfo.jpg",
    unlock: "mission",
    passive: {
      name: "Justiça Maldita",
      description: "20% chance de refletir efeito negativo de volta.",
    },
    base: s(33, 32, 36, 110, 5, 8, 7, 10, 7, 15),
  },
  {
    id: "driade",
    name: "Dríade",
    tier: "rare",
    portrait: "/portraits/meio-elfo.jpg",
    unlock: "mission",
    passive: {
      name: "Floresta da Vida",
      description: "Em terreno natural: recupera 2% do HP máximo por turno.",
    },
    base: s(30, 34, 32, 100, 3, 9, 6, 9, 8, 14),
  },
  {
    id: "lupino",
    name: "Lupino",
    tier: "rare",
    portrait: "/portraits/besta.jpg",
    unlock: "mission",
    passive: {
      name: "Instinto de Matilha",
      description: "≥1 aliado próximo → +2 AGI.",
    },
    base: s(36, 18, 44, 85, 8, 3, 6, 6, 12, 10),
  },
  {
    id: "anao",
    name: "Anão",
    tier: "rare",
    portrait: "/portraits/humano.jpg",
    unlock: "mission",
    passive: {
      name: "Constituição Anã",
      description:
        "Ao receber ataque que reduziria HP para ≤50%: +2 DEF até o fim do combate.",
    },
    base: s(40, 16, 38, 95, 7, 3, 12, 8, 4, 10),
  },
  {
    id: "orc",
    name: "Orc",
    tier: "rare",
    portrait: "/portraits/besta.jpg",
    unlock: "mission",
    passive: {
      name: "Fúria Orc",
      description:
        "Ao entrar na batalha: todos com nível ≤ ao do Orc perdem −1 em todos os atributos.",
    },
    base: s(44, 14, 46, 75, 12, 2, 8, 5, 6, 6),
  },
  {
    id: "goblin",
    name: "Goblin",
    tier: "rare",
    portrait: "/portraits/semi-besta.jpg",
    unlock: "mission",
    passive: {
      name: "Oportunista",
      description: "Ao atacar inimigo com ≤50% HP: +20% dano.",
    },
    base: s(26, 20, 40, 80, 6, 4, 4, 5, 14, 12),
  },
  {
    id: "oni",
    name: "Oni",
    tier: "rare",
    portrait: "/portraits/vampiro.jpg",
    unlock: "mission",
    passive: {
      name: "Presença Demoníaca",
      description: "Inimigos próximos sofrem −2 DEF.",
    },
    base: s(42, 22, 40, 70, 10, 5, 7, 6, 7, 8),
  },
  {
    id: "gigante",
    name: "Gigante",
    tier: "rare",
    portrait: "/portraits/besta.jpg",
    unlock: "mission",
    passive: {
      name: "Força Colossal",
      description: "Ataques básicos: 20% chance de Stun.",
    },
    base: s(50, 12, 48, 85, 14, 2, 10, 4, 3, 6),
  },
  {
    id: "quimera",
    name: "Quimera",
    tier: "rare",
    portrait: "/portraits/dragonoide.jpg",
    unlock: "mission",
    passive: {
      name: "Mutação",
      description: "No início da batalha: +2 em um atributo aleatório.",
    },
    base: s(38, 24, 40, 80, 8, 6, 7, 7, 8, 10),
  },
  {
    id: "homunculo",
    name: "Homúnculo",
    tier: "rare",
    portrait: "/portraits/humano.jpg",
    unlock: "mission",
    passive: {
      name: "Corpo Artificial",
      description:
        "Ao ser derrotado: não morre nem concede XP. Fica em Stun. Ao ser tocado, é reativado.",
    },
    base: s(28, 30, 35, 50, 5, 8, 8, 8, 6, 16),
  },
  {
    id: "dragonoide",
    name: "Dragonoide",
    tier: "legendary",
    portrait: "/portraits/dragonoide.jpg",
    unlock: "mission",
    passive: {
      name: "Dragon's Finger",
      description:
        "40% chance de aplicar 1 Marca Dracônica. Ao 3 Marcas: consome e causa dano adicional = 25% do ATK. Pode acumular novamente.",
    },
    base: s(46, 24, 42, 90, 12, 8, 10, 8, 6, 12),
  },
  {
    id: "umbral",
    name: "Umbral",
    tier: "legendary",
    portrait: "/portraits/vampiro.jpg",
    unlock: "mission",
    extraPassives: [
      {
        name: "Corpo Umbral",
        description: "Área escura → invisível por 1 turno.",
      },
      {
        name: "Forma da Marca do Vazio",
        description:
          "≤50% HP → forma de sombra por 2 turnos (incapaz de ser atacada).",
      },
    ],
    passive: {
      name: "Marca do Vazio",
      description: "Aplica 1 Marca Umbral. Ao 3 → Cego por 1 turno.",
    },
    base: s(32, 36, 38, 70, 6, 10, 5, 9, 14, 14),
  },
  {
    id: "vampiro",
    name: "Vampiro",
    tier: "extreme",
    portrait: "/portraits/vampiro.jpg",
    unlock: "mission",
    passive: {
      name: "Blood Hugh",
      description:
        "3 Blood. Cada habilidade base concede 1 Blood. Ao 3 Blood: estado máximo de regeneração. Ataques básicos com Sangramento recuperam 50% do dano em HP.",
    },
    base: s(36, 30, 40, 60, 9, 8, 6, 8, 11, 13),
  },
  {
    id: "fae",
    name: "Fae",
    tier: "extreme",
    portrait: "/portraits/elfo.jpg",
    unlock: "mission",
    extraPassives: [
      {
        name: "Sorte Feérica",
        description:
          "20% chance de transformar efeito negativo em positivo.",
      },
      {
        name: "Travessura",
        description: "20% chance de evitar completamente o ataque.",
      },
    ],
    passive: {
      name: "Frenesi Maluco",
      description:
        "Ao entrar na batalha → +2 AGI e +2 ATK (mantém controle).",
    },
    base: s(28, 38, 36, 90, 4, 10, 5, 10, 14, 16),
  },

  /*
   * =======================================================
   * DOPPELGANGER
   * =======================================================
   */
  {
    id: "doppelganger",
    name: "Doppelganger",
    tier: "extra",
    portrait: "/portraits/humano.jpg",
    unlock: "master",
    passive: {
      name: "Assimilação",
      description:
        "1 Stack de Copy por turno. Ao 5 Stacks (1× por batalha): assimila personagem/monstro (até +10 níveis). Assume valores, classe, habilidades e passivas. Termina quando HP/MP/EST = 0. Não copia equipamentos/inventário.",
    },
    base: s(
      40,
      38,
      48,
      100,
      10,
      9,
      10,
      9,
      14,
      20,
    ),
  },

  /*
   * =======================================================
   * KITSUNE
   * =======================================================
   */
  {
    id: "kitsune",
    name: "Kitsune",
    tier: "extra",
    portrait: "/portraits/meio-elfo.jpg",
    unlock: "master",
    extraPassives: [
      {
        name: "Kitsune + Bufão",
        description:
          "Clones também acumulam Stacks. Unidades = 1 + clones.",
      },
      {
        name: "Liberação de Desespero",
        description:
          "Quando seus companheiros entram em estado crítico, libera 170% adicionais de sua capacidade. Todos os status atuais passam a 270% do valor original enquanto o estado permanecer ativo.",
      },
    ],
    passive: {
      name: "Mestre Ilusionista / Cartas do Além",
      description:
        "1 Stack de Ilusão por turno de ataques → ao 3 cria Ilusão (não pode ser atacada). Quando Ilusão é atacada → começa Stacks do Além. Ao 3 Stacks → imune aos próximos 2 ataques.",
    },
    base: s(
      38,
      48,
      45,
      110,
      8,
      15,
      8,
      14,
      18,
      24,
    ),
  },
];

export const RACE_BY_ID = Object.fromEntries(
  RACES.map((r) => [r.id, r]),
) as Record<string, RaceDef>;

export const BASIC_RACE_IDS = RACES
  .filter((r) => r.tier === "basic")
  .map((r) => r.id);

export const TIER_LABEL: Record<RaceDef["tier"], string> = {
  basic: "Basic",
  rare: "Rare",
  legendary: "Legendary",
  extreme: "Extreme",
  extra: "Extra",
};
