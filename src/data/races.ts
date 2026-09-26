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
): Stats => ({ hp, mp, est, san, atk, atkMgc, def, res, agi, int });

/**
 * =========================================================
 * RETRATOS DAS 25 RAÇAS
 * =========================================================
 *
 * Cada raça possui:
 *
 * 1. portrait
 *    → retrato padrão/legado da raça.
 *
 * 2. portraits.masculino
 *    → retrato masculino oficial.
 *
 * 3. portraits.feminino
 *    → retrato feminino oficial.
 *
 * Os retratos por gênero seguem:
 *
 * /portraits/{raceId}_masculina.jpg
 * /portraits/{raceId}_feminina.jpg
 *
 * Exemplo:
 *
 * /portraits/humano_masculina.jpg
 * /portraits/humano_feminina.jpg
 *
 * O personagem possui seu próprio campo "gender".
 * Portanto, o sistema pode selecionar automaticamente
 * o retrato correspondente à raça + gênero escolhido.
 */

/**
 * Retorna o retrato específico do gênero escolhido.
 *
 * Esta função é a ponte entre:
 *
 * Character.gender
 *       ↓
 * RACE_BY_ID
 *       ↓
 * RaceDef.portraits
 *       ↓
 * imagem correspondente
 */
export const getRacePortrait = (
  raceId: string,
  gender: Gender,
): string => {
  const race = RACE_BY_ID[raceId];

  if (!race) {
    return "/portraits/humano.jpg";
  }

  return race.portraits[gender];
};

/**
 * Retorna o retrato padrão da raça.
 *
 * Usado quando não houver gênero disponível
 * ou quando alguma parte antiga do sistema ainda
 * precisar utilizar somente o retrato padrão.
 */
export const getDefaultRacePortrait = (
  raceId: string,
): string => {
  return RACE_BY_ID[raceId]?.portrait ?? "/portraits/humano.jpg";
};

/**
 * =========================================================
 * MECÂNICA DE DESESPERO
 * =========================================================
 *
 * Doppelganger e Kitsune possuem uma passiva bônus de Desespero.
 *
 * Quando a condição de Desespero correspondente for ativada,
 * a raça libera 170% adicionais de sua capacidade.
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

export const DESPERATION_MULTIPLIER =
  1 + DESPERATION_BONUS_PERCENT / 100;

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
  // ========================================================
  // NORMAL — 19 RAÇAS
  // ========================================================

  {
    id: "humano",
    name: "Humano",
    tier: "basic",
    portrait: "/portraits/humano.jpg",
    portraits: {
      masculino: "/portraits/humano_masculina.jpg",
      feminino: "/portraits/humano_feminina.jpg",
    },
    unlock: "start",
    passive: {
      name: "Adaptatividade",
      description:
        "Ao sofrer um efeito negativo pela primeira vez, adapta-se a ele. Na próxima aplicação do mesmo efeito, sua duração é reduzida em 1 turno.",
    },
    base: s(32, 23, 40, 100, 4, 4, 8, 8, 8, 15),
  },

  {
    id: "meio-elfo",
    name: "Meio-elfo",
    tier: "basic",
    portrait: "/portraits/meio-elfo.jpg",
    portraits: {
      masculino: "/portraits/meio-elfo_masculina.jpg",
      feminino: "/portraits/meio-elfo_feminina.jpg",
    },
    unlock: "start",
    passive: {
      name: "Atordoamento Élfico",
      description:
        "Ataques e habilidades possuem 20% de chance de causar Stun no alvo.",
    },
    base: s(30, 30, 35, 100, 3, 7, 6, 9, 10, 15),
  },

  {
    id: "elfo",
    name: "Elfo",
    tier: "basic",
    portrait: "/portraits/elfo.jpg",
    portraits: {
      masculino: "/portraits/elfo_masculina.jpg",
      feminino: "/portraits/elfo_feminina.jpg",
    },
    unlock: "start",
    passive: {
      name: "Atordoamento Ancestral",
      description:
        "Ataques e habilidades possuem 40% de chance de causar Stun no alvo.",
    },
    base: s(29, 33, 35, 100, 3, 8, 5, 9, 12, 16),
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
    base: s(37, 18, 45, 90, 9, 3, 7, 6, 10, 10),
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
    base: s(42, 16, 50, 80, 11, 2, 6, 5, 9, 6),
  },

  {
    id: "lizard",
    name: "Lizard",
    tier: "rare",
    portrait: "/portraits/lizard.jpg",
    portraits: {
      masculino: "/portraits/lizard_masculina.jpg",
      feminino: "/portraits/lizard_feminina.jpg",
    },
    unlock: "mission",
    passive: {
      name: "Escamas de Aço",
      description:
        "Recebe 10% menos dano físico.",
    },
    base: s(40, 20, 42, 90, 7, 3, 10, 7, 6, 10),
  },

  {
    id: "aqua",
    name: "Aqua",
    tier: "rare",
    portrait: "/portraits/aqua.jpg",
    portraits: {
      masculino: "/portraits/aqua_masculina.jpg",
      feminino: "/portraits/aqua_feminina.jpg",
    },
    unlock: "mission",
    passive: {
      name: "Selos do Além",
      description:
        "Ataques possuem 20% de chance de aplicar um Selo do Além, reduzindo em 10% a recuperação de HP do alvo durante 2 turnos.",
    },
    base: s(28, 36, 32, 100, 3, 8, 5, 10, 9, 14),
  },

  {
    id: "morto-vivo",
    name: "Morto-vivo",
    tier: "rare",
    portrait: "/portraits/morto-vivo.jpg",
    portraits: {
      masculino: "/portraits/morto-vivo_masculina.jpg",
      feminino: "/portraits/morto-vivo_feminina.jpg",
    },
    unlock: "mission",
    passive: {
      name: "Criação Indesejada",
      description:
        "Ao receber dano que o levaria a 0 HP, possui 20% de chance de permanecer com 1 HP.",
    },
    base: s(38, 22, 30, 60, 6, 6, 8, 8, 5, 12),
  },

  {
    id: "demonio",
    name: "Demônio",
    tier: "rare",
    portrait: "/portraits/demonio.jpg",
    portraits: {
      masculino: "/portraits/demonio_masculina.jpg",
      feminino: "/portraits/demonio_feminina.jpg",
    },
    unlock: "mission",
    passive: {
      name: "Injustiça Benigna",
      description:
        "Possui 20% de chance de ignorar completamente um efeito negativo recebido.",
    },
    base: s(34, 28, 38, 70, 8, 7, 6, 6, 9, 12),
  },

  {
    id: "divino",
    name: "Divino",
    tier: "rare",
    portrait: "/portraits/divino.jpg",
    portraits: {
      masculino: "/portraits/divino_masculina.jpg",
      feminino: "/portraits/divino_feminina.jpg",
    },
    unlock: "mission",
    passive: {
      name: "Justiça Maldita",
      description:
        "Possui 20% de chance de refletir um efeito negativo recebido de volta ao inimigo que o aplicou.",
    },
    base: s(33, 32, 36, 110, 5, 8, 7, 10, 7, 15),
  },

  {
    id: "driade",
    name: "Dríade",
    tier: "rare",
    portrait: "/portraits/driade.jpg",
    portraits: {
      masculino: "/portraits/driade_masculina.jpg",
      feminino: "/portraits/driade_feminina.jpg",
    },
    unlock: "mission",
    passive: {
      name: "Floresta da Vida",
      description:
        "Enquanto estiver em terreno natural, recupera 2% do HP máximo por turno.",
    },
    base: s(30, 34, 32, 100, 3, 9, 6, 9, 8, 14),
  },

  {
    id: "lupino",
    name: "Lupino",
    tier: "rare",
    portrait: "/portraits/lupino.jpg",
    portraits: {
      masculino: "/portraits/lupino_masculina.jpg",
      feminino: "/portraits/lupino_feminina.jpg",
    },
    unlock: "mission",
    passive: {
      name: "Instinto de Matilha",
      description:
        "Quando houver pelo menos 1 aliado próximo, recebe +2 AGI.",
    },
    base: s(36, 18, 44, 85, 8, 3, 6, 6, 12, 10),
  },

  {
    id: "anao",
    name: "Anão",
    tier: "rare",
    portrait: "/portraits/anao.jpg",
    portraits: {
      masculino: "/portraits/anao_masculina.jpg",
      feminino: "/portraits/anao_feminina.jpg",
    },
    unlock: "mission",
    passive: {
      name: "Constituição Anã",
      description:
        "Ao receber um ataque que reduziria seu HP para 50% ou menos, recebe +2 DEF até o fim do combate.",
    },
    base: s(40, 16, 38, 95, 7, 3, 12, 8, 4, 10),
  },

  {
    id: "orc",
    name: "Orc",
    tier: "rare",
    portrait: "/portraits/orc.jpg",
    portraits: {
      masculino: "/portraits/orc_masculina.jpg",
      feminino: "/portraits/orc_feminina.jpg",
    },
    unlock: "mission",
    passive: {
      name: "Fúria Orc",
      description:
        "FERA COVARDE — Ao entrar na batalha, todo personagem com nível inferior ou igual ao do Orc perde -1 de todos os atributos.",
    },
    base: s(44, 14, 46, 75, 12, 2, 8, 5, 6, 6),
  },

  {
    id: "goblin",
    name: "Goblin",
    tier: "rare",
    portrait: "/portraits/goblin.jpg",
    portraits: {
      masculino: "/portraits/goblin_masculina.jpg",
      feminino: "/portraits/goblin_feminina.jpg",
    },
    unlock: "mission",
    passive: {
      name: "Oportunista",
      description:
        "Ao atacar um inimigo com 50% ou menos de HP, causa +20% de dano.",
    },
    base: s(26, 20, 40, 80, 6, 4, 4, 5, 14, 12),
  },

  {
    id: "oni",
    name: "Oni",
    tier: "rare",
    portrait: "/portraits/oni.jpg",
    portraits: {
      masculino: "/portraits/oni_masculina.jpg",
      feminino: "/portraits/oni_feminina.jpg",
    },
    unlock: "mission",
    passive: {
      name: "Presença Demoníaca",
      description:
        "Inimigos próximos ao Oni sofrem -2 DEF enquanto ele estiver em combate.",
    },
    base: s(42, 22, 40, 70, 10, 5, 7, 6, 7, 8),
  },

  {
    id: "gigante",
    name: "Gigante",
    tier: "rare",
    portrait: "/portraits/gigante.jpg",
    portraits: {
      masculino: "/portraits/gigante_masculina.jpg",
      feminino: "/portraits/gigante_feminina.jpg",
    },
    unlock: "mission",
    passive: {
      name: "Força Colossal",
      description:
        "Ataques básicos possuem 20% de chance de causar Stun.",
    },
    base: s(50, 12, 48, 85, 14, 2, 10, 4, 3, 6),
  },

  {
    id: "quimera",
    name: "Quimera",
    tier: "rare",
    portrait: "/portraits/quimera.jpg",
    portraits: {
      masculino: "/portraits/quimera_masculina.jpg",
      feminino: "/portraits/quimera_feminina.jpg",
    },
    unlock: "mission",
    passive: {
      name: "Mutação",
      description:
        "No início da batalha, recebe +2 em um atributo aleatório.",
    },
    base: s(38, 24, 40, 80, 8, 6, 7, 7, 8, 10),
  },

  {
    id: "homunculo",
    name: "Homúnculo",
    tier: "rare",
    portrait: "/portraits/homunculo.jpg",
    portraits: {
      masculino: "/portraits/homunculo_masculina.jpg",
      feminino: "/portraits/homunculo_feminina.jpg",
    },
    unlock: "mission",
    passive: {
      name: "Corpo Artificial",
      description:
        "Ao ser derrotado, o Homúnculo não morre nem concede XP. Fica em Stun. Ao ser tocado por qualquer personagem, é reativado e retorna ao combate.",
    },
    base: s(28, 30, 35, 50, 5, 8, 8, 8, 6, 16),
  },

  // ========================================================
  // LEGENDARY — 2 RAÇAS
  // ========================================================

  {
    id: "dragonoide",
    name: "Dragonoide",
    tier: "legendary",
    portrait: "/portraits/dragonoide.jpg",
    portraits: {
      masculino: "/portraits/dragonoide_masculina.jpg",
      feminino: "/portraits/dragonoide_feminina.jpg",
    },
    unlock: "mission",
    passive: {
      name: "Dragon's Finger",
      description:
        "Ataques possuem 40% de chance de aplicar 1 Marca Dracônica. Ao alcançar 3 Marcas Dracônicas no alvo, as marcas são consumidas e causam dano adicional equivalente a 25% do ATK do Dragonoide. Depois disso, as marcas podem ser acumuladas novamente.",
    },
    base: s(46, 24, 42, 90, 12, 8, 10, 8, 6, 12),
  },

  {
    id: "umbral",
    name: "Umbral",
    tier: "legendary",
    portrait: "/portraits/umbral.jpg",
    portraits: {
      masculino: "/portraits/umbral_masculina.jpg",
      feminino: "/portraits/umbral_feminina.jpg",
    },
    unlock: "mission",
    extraPassives: [
      {
        name: "Corpo Umbral",
        description:
          "Ao entrar em uma área escura, a Umbral fica invisível por 1 turno.",
      },
      {
        name: "Forma da Marca do Vazio",
        description:
          "Ao chegar a 50% ou menos de HP, assume sua forma de sombra por 2 turnos, ficando incapaz de ser atacada.",
      },
    ],
    passive: {
      name: "Marca do Vazio",
      description:
        "Seus ataques aplicam 1 Marca Umbral no alvo. Ao atingir 3 Marcas, elas são consumidas e o alvo fica Cego por 1 turno.",
    },
    base: s(32, 36, 38, 70, 6, 10, 5, 9, 14, 14),
  },

  // ========================================================
  // EXTREME — 2 RAÇAS
  // ========================================================

  {
    id: "vampiro",
    name: "Vampiro",
    tier: "extreme",
    portrait: "/portraits/vampiro.jpg",
    portraits: {
      masculino: "/portraits/vampiro_masculina.jpg",
      feminino: "/portraits/vampiro_feminina.jpg",
    },
    unlock: "mission",
    passive: {
      name: "Blood Hugh",
      description:
        "O Vampiro possui 3 Blood para acumular. Cada uma de suas 3 habilidades base possui um efeito Blood, concedendo 1 Blood ao ser utilizada. Ao alcançar 3 Blood, atinge seu estado máximo de regeneração, mantendo o Roubo de Vida máximo pelo restante da partida. Enquanto estiver nesse estado, ataques básicos que causarem Sangramento recuperam 50% do dano causado em HP.",
    },
    base: s(36, 30, 40, 60, 9, 8, 6, 8, 11, 13),
  },

  {
    id: "fae",
    name: "Fae",
    tier: "extreme",
    portrait: "/portraits/fae.jpg",
    portraits: {
      masculino: "/portraits/fae_masculina.jpg",
      feminino: "/portraits/fae_feminina.jpg",
    },
    unlock: "mission",
    extraPassives: [
      {
        name: "Sorte Feérica",
        description:
          "Possui 20% de chance de transformar um efeito negativo recebido em um efeito positivo equivalente.",
      },
      {
        name: "Travessura",
        description:
          "Ao sofrer dano, possui 20% de chance de evitar completamente o ataque.",
      },
    ],
    passive: {
      name: "Frenesi Maluco",
      description:
        "Ao entrar na batalha, entra imediatamente em Frenesi, mas mantém controle total de suas ações. Recebe +2 AGI e +2 ATK.",
    },
    base: s(28, 38, 36, 90, 4, 10, 5, 10, 14, 16),
  },

  // ========================================================
  // EXTRA — 2 RAÇAS
  // ========================================================

  {
    id: "doppelganger",
    name: "Doppelganger",
    tier: "extra",
    portrait: "/portraits/doppelganger.jpg",
    portraits: {
      masculino: "/portraits/doppelganger_masculina.jpg",
      feminino: "/portraits/doppelganger_feminina.jpg",
    },
    unlock: "master",

    passive: {
      name: "Assimilação",
      description:
        "Recebe 1 Stack de Assimilação por turno. Ao alcançar 5 Stacks, pode assimilar, uma vez por batalha, um personagem, jogador ou monstro válido. Pode assimilar seres de até 10 níveis acima de seu próprio nível. Durante a assimilação, assume os valores atuais, classe, habilidades e passivas do ser assimilado. A transformação termina quando HP, MP ou EST chega a 0, retornando à forma original com os atributos e recursos que possuía no momento da transformação. Não pode assimilar equipamentos ou inventário. Bosses especiais podem ser imunes.",
    },

    extraPassives: [
      {
        name: "Maldito Espelho",
        description:
          "Ao assimilar alguém, o Doppelganger segue a mesma linha de combate do ser assimilado, imitando seus golpes e ações. Enquanto reproduz uma ação, não recebe o dano correspondente, mas pode reproduzi-la contra o alvo. Ao atingir 20% do HP máximo original do Doppelganger, ativa o Efeito da Morte.",
      },
      {
        name: "Liberação de Desespero",
        description:
          "Quando a condição de desespero é ativada, libera 170% adicionais de sua capacidade. Todos os status atuais passam a 270% do valor original enquanto o estado permanecer ativo.",
      },
      {
        name: "Alma Ronin",
        description:
          "Quando o Doppelganger estiver utilizando a classe Ronin, manifesta um espírito Ronin que luta ao seu lado. O espírito reproduz os ataques do Doppelganger, permitindo ataques simultâneos e aumentando o dano causado para 2x. A combinação também mantém a capacidade defensiva proporcionada pelo Maldito Espelho.",
      },
    ],

    base: s(40, 40, 40, 100, 10, 10, 10, 10, 16, 20),
  },

  {
    id: "kitsune",
    name: "Kitsune",
    tier: "extra",
    portrait: "/portraits/kitsune.jpg",
    portraits: {
      masculino: "/portraits/kitsune_masculina.jpg",
      feminino: "/portraits/kitsune_feminina.jpg",
    },
    unlock: "master",

    passive: {
      name: "Mestre Ilusionista, Cartas do Além",
      description:
        "Stack de Ilusão: recebe 1 Stack de Ilusão por turno de ataques. Ao alcançar 3 Stacks, cria uma Ilusão e reinicia os Stacks. Ilusão: enquanto a Ilusão estiver ativa, a Kitsune não pode ser atacada. Quando a Ilusão for atacada, ela desaparece e a Kitsune começa a acumular Stacks do Além. Stack do Além: recebe 1 Stack do Além por turno de ataques. Ao alcançar 3 Stacks, torna-se imune aos próximos 2 ataques e os Stacks são reiniciados.",
    },

    extraPassives: [
      {
        name: "Encontre o Joker",
        description:
          "Se a Kitsune pertencer à classe Bufão, os Clones também acumulam Stacks de Ilusão e Stacks do Além. 0 clones: 1 Kitsune; 1 clone: 2 unidades; 2 clones: 3 unidades; 3 clones: 4 unidades. Cada unidade pode gerar suas próprias ilusões e efeitos de Stack do Além.",
      },
      {
        name: "Liberação de Desespero",
        description:
          "Quando seus companheiros entram em estado crítico, libera 170% adicionais de sua capacidade. Todos os status atuais passam a 270% do valor original enquanto o estado permanecer ativo.",
      },
      {
        name: "Raposa do Caos, Caudas Vingativas",
        description:
          "A cada ataque recebido, a Kitsune manifesta 1 Cauda e acumula o dano sofrido. Ao manifestar a 9ª Cauda, libera todo o dano acumulado em 9 ataques, distribuídos entre os inimigos presentes. Se houver menos de 9 inimigos, os ataques restantes são distribuídos novamente entre os inimigos disponíveis. Após a liberação, as 9 Caudas desaparecem e o dano acumulado é zerado.",
      },
    ],

    base: s(38, 48, 45, 110, 8, 15, 8, 14, 18, 24),
  },
];

/**
 * =========================================================
 * ACESSO RÁPIDO
 * =========================================================
 */

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

Atenção a um detalhe: para esse "races.ts" compilar, o "RaceDef" do seu "types.ts" também precisa receber:

portraits: {
  masculino: string;
  feminino: string;
};

O "Gender" que você já tem está correto.

Depois disso, o próximo arquivo que precisa ser alterado é justamente o "CharacterCard.tsx", para ele usar "character.gender" em vez de continuar usando "character.image". Só então o gênero escolhido pelo jogador terá efeito visual real no card.
