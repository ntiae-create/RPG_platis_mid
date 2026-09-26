import { CLASS_BY_ID } from "@/data/classes";
import { RACE_BY_ID } from "@/data/races";
import {
  BRASAO_ALL_PCT,
  BRASAO_PRIMARY_PCT,
  brasaoLevelFromXp,
  inventorySlots,
} from "@/data/progression";
import type {
  Character,
  Gender,
  Skill,
  StatKey,
  Stats,
} from "@/data/types";
import { uid } from "./utils";

const ZERO: Stats = {
  hp: 0,
  mp: 0,
  est: 0,
  san: 0,
  atk: 0,
  atkMgc: 0,
  def: 0,
  res: 0,
  agi: 0,
  int: 0,
};

export function emptyStats(): Stats {
  return { ...ZERO };
}

export function addStats(
  a: Stats,
  b: Partial<Stats>,
): Stats {
  const out = { ...a };

  (Object.keys(b) as StatKey[]).forEach((k) => {
    out[k] += b[k] ?? 0;
  });

  return out;
}

/* =========================================================
   STATUS FINAL
   ========================================================= */

export function finalStats(
  ch: Pick<
    Character,
    "raceId" | "classId" | "brasaoXp"
  > & {
    allocated?: Partial<Stats>;
  },
): Stats {
  const race = RACE_BY_ID[ch.raceId];
  const cls = CLASS_BY_ID[ch.classId];

  let stats = addStats(
    race?.base ?? emptyStats(),
    cls?.bonus ?? {},
  );

  stats = addStats(
    stats,
    ch.allocated ?? {},
  );

  const brasao = brasaoLevelFromXp(
    ch.brasaoXp,
  );

  const allPct =
    BRASAO_ALL_PCT[brasao.level] ?? 0;

  const primPct =
    BRASAO_PRIMARY_PCT[brasao.level] ?? 0;

  if (allPct) {
    (Object.keys(stats) as StatKey[]).forEach(
      (k) => {
        stats[k] = Math.round(
          stats[k] * (1 + allPct),
        );
      },
    );
  } else if (primPct && cls) {
    const key = cls.primary;

    stats[key] = Math.round(
      stats[key] * (1 + primPct),
    );
  }

  return stats;
}

/* =========================================================
   SLOTS DE HABILIDADES
   ========================================================= */

export function skillSlots(
  brasaoXp: number,
): number {
  return brasaoLevelFromXp(
    brasaoXp,
  ).level >= 6
    ? 4
    : 3;
}

/* =========================================================
   COOLDOWN
   ========================================================= */

export function cooldownFactor(
  brasaoXp: number,
): number {
  return brasaoLevelFromXp(
    brasaoXp,
  ).level >= 4
    ? 0.8
    : 1;
}

/* =========================================================
   HABILIDADES VAZIAS
   ========================================================= */

export function makeEmptySkills(
  count = 3,
): Skill[] {
  return Array.from(
    { length: count },
    (_, i) => ({
      id: uid("sk"),

      slot: i as
        | 0
        | 1
        | 2
        | 3,

      name: "",

      description: "",

      type: "ataque",

      cost: {
        hp: 0,
        mp: 4,
        est: 0,
      },

      target: "unico",

      areaCount: 1,

      areaSquares: 1,

      direction: "cima",

      range: 1,

      duration: 0,

      cooldown: 0,

      status: "draft",
    }),
  );
}

/* =========================================================
   IMAGEM POR RAÇA + GÊNERO
   =========================================================

   Por enquanto usamos o portrait da raça como fallback.

   Depois podemos colocar as imagens reais aqui.

   Exemplo:

   kitsune + masculino
   → /character-art/races/kitsune_masculino.png

   kitsune + feminino
   → /character-art/races/kitsune_feminino.png

   ========================================================= */

export function getCharacterImage(
  raceId: string,
  gender: Gender,
  customImage?: string,
): string {
  /*
   * Se o jogador enviou uma imagem própria,
   * ela tem prioridade.
   */
  if (customImage) {
    return customImage;
  }

  /*
   * Aqui ficará o catálogo das imagens
   * específicas de cada raça e gênero.
   *
   * Ainda estamos usando fallback porque
   * as imagens oficiais ainda não foram
   * cadastradas.
   */
  const raceImages: Record<
    string,
    Partial<Record<Gender, string>>
  > = {
    humano: {
      masculino: "/character-art/races/humano_masculino.png",
      feminino: "/character-art/races/humano_feminino.png",
    },

    "meio-elfo": {
      masculino:
        "/character-art/races/meio-elfo_masculino.png",
      feminino:
        "/character-art/races/meio-elfo_feminino.png",
    },

    elfo: {
      masculino:
        "/character-art/races/elfo_masculino.png",
      feminino:
        "/character-art/races/elfo_feminino.png",
    },

    "semi-besta": {
      masculino:
        "/character-art/races/semi-besta_masculino.png",
      feminino:
        "/character-art/races/semi-besta_feminino.png",
    },

    besta: {
      masculino:
        "/character-art/races/besta_masculino.png",
      feminino:
        "/character-art/races/besta_feminino.png",
    },

    kitsune: {
      masculino:
        "/character-art/races/kitsune_masculino.png",
      feminino:
        "/character-art/races/kitsune_feminino.png",
    },
  };

  const genderImage =
    raceImages[raceId]?.[gender];

  /*
   * Se a imagem específica existir no catálogo,
   * usamos ela.
   *
   * A verificação real do arquivo será feita
   * pelo navegador. Caso ainda não exista,
   * usamos o portrait da raça.
   */

  if (genderImage) {
    return genderImage;
  }

  const race =
    RACE_BY_ID[raceId];

  return (
    race?.portrait ||
    "/portraits/humano.jpg"
  );
}

/* =========================================================
   CRIAR PERSONAGEM
   ========================================================= */

export function createCharacter(input: {
  name: string;

  gender?: Gender;

  raceId: string;

  classId: string;

  affinityId: Character["affinityId"];

  image?: string;

  isMaster?: boolean;
}): Character {
  const race =
    RACE_BY_ID[input.raceId];

  /*
   * Compatibilidade:
   *
   * Se algum lugar antigo do projeto criar
   * um personagem sem informar gênero,
   * ele será considerado masculino.
   *
   * Isso evita quebrar personagens antigos.
   */
  const gender: Gender =
    input.gender ?? "masculino";

  const stats = finalStats({
    ...({} as Character),

    raceId: input.raceId,

    classId: input.classId,

    allocated: {},

    brasaoXp: 0,
  });

  const characterImage =
    getCharacterImage(
      input.raceId,
      gender,
      input.image,
    );

  return {
    id: uid("ch"),

    name:
      input.name.trim() ||
      "Sem nome",

    gender,

    image:
      characterImage,

    raceId:
      input.raceId,

    classId:
      input.classId,

    affinityId:
      input.affinityId,

    level: 1,

    xp: 0,

    brasaoXp: 0,

    attrPoints: 0,

    poolPoints: 0,

    allocated: {},

    current: {
      hp: stats.hp,
      mp: stats.mp,
      est: stats.est,
      san: stats.san,
    },

    skills:
      makeEmptySkills(3),

    personalPassive: {
      name: "—",
      description:
        "Ainda não definida.",
      stacks: 0,
    },

    inventory: [],

    equipment: {},

    currency: {
      bronze: 0,
      silver: 40,
      gold: 2,
      platinum: 0,
    },

    position: {
      continentId: "platis",
      layer: 0,
      x: 1000,
      y: 1500,
    },

    unlockedRaces: [
      "humano",
      "meio-elfo",
      "elfo",
      "semi-besta",
      "besta",
    ],

    isMaster:
      Boolean(input.isMaster),
  };
}

/* =========================================================
   RECARREGAR STATUS
   ========================================================= */

export function refillCurrent(
  ch: Character,
): Character {
  const s = finalStats(ch);

  return {
    ...ch,

    current: {
      hp: s.hp,
      mp: s.mp,
      est: s.est,
      san: s.san,
    },
  };
}

/* =========================================================
   LEVEL UP
   ========================================================= */

export function applyLevelUp(
  ch: Character,
  levels = 1,
): Character {
  const next = {
    ...ch,
  };

  for (
    let i = 0;
    i < levels;
    i++
  ) {
    if (next.level >= 150) {
      break;
    }

    next.level += 1;

    next.attrPoints += 3;

    next.allocated = {
      ...next.allocated,

      san:
        (next.allocated.san ?? 0) +
        2,
    };

    if (
      next.level % 5 === 0
    ) {
      next.poolPoints += 8;
    }
  }

  const s =
    finalStats(next);

  next.current = {
    hp: Math.min(
      s.hp,
      next.current.hp +
        (s.hp -
          finalStats(ch).hp),
    ),

    mp: s.mp,

    est: s.est,

    san: s.san,
  };

  void inventorySlots(
    next.level,
  );

  return next;
}
