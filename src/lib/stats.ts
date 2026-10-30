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
    "raceId" | "classId" | "brasaoXp" | "equipment"
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

  /* Bônus dos equipamentos equipados */
  if (ch.equipment) {
    for (const item of Object.values(ch.equipment)) {
      if (item?.bonus) {
        stats = addStats(stats, item.bonus);
      }
    }
  }

  const brasao = brasaoLevelFromXp(ch.brasaoXp);

  const allPct = BRASAO_ALL_PCT[brasao.level] ?? 0;
  const primPct = BRASAO_PRIMARY_PCT[brasao.level] ?? 0;

  if (allPct) {
    (Object.keys(stats) as StatKey[]).forEach((k) => {
      stats[k] = Math.round(
        stats[k] * (1 + allPct),
      );
    });
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
   SKILLS VAZIAS
   ========================================================= */

export function makeEmptySkills(
  count = 3,
): Skill[] {
  return Array.from({ length: count }, (_, i) => ({
    id: uid("sk"),
    slot: i,
    name: "",
    description: "",
    cost: { mp: 0, est: 0 },
    cooldown: 0,
    type: "attack",
    status: "draft",
  }));
}
