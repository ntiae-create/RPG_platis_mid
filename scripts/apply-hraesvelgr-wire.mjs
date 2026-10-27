#!/usr/bin/env node
/** Wire Hræsvelgr em src/lib/store.ts (idempotente). */
import { readFileSync, writeFileSync } from "fs";

const f = "src/lib/store.ts";
let t = readFileSync(f, "utf8");
if (t.includes("emptyHraesvelgrMeta") && t.includes("resolveHraesvelgrSkill(")) {
  console.log("Hræsvelgr já está wired. Nada a fazer.");
  process.exit(0);
}
if (t.length < 50000) {
  console.error("store.ts incompleto (" + t.length + " bytes).");
  process.exit(1);
}

const importMarkers = [
  {
    old: `  emptyHatiSkollMeta,
  resolveHatiSkill,
  resolveSkollSkill,
  hatiSkollOnTurnAdvance,
  twinOnBrotherFallen,
  type HatiSkollMeta,
} from "@/data/world-boss-kits";`,
    neu: `  emptyHatiSkollMeta,
  resolveHatiSkill,
  resolveSkollSkill,
  hatiSkollOnTurnAdvance,
  twinOnBrotherFallen,
  type HatiSkollMeta,
  emptyHraesvelgrMeta,
  resolveHraesvelgrSkill,
  hraesvelgrOnTurnAdvance,
  hraesvelgrBlocksMelee,
  type HraesvelgrMeta,
} from "@/data/world-boss-kits";`,
  },
  {
    old: `  emptyFenrirMeta,
  resolveFenrirSkill,
  fenrirOnTurnAdvance,
  fenrirWeakenGleipnir,
  fenrirAddFury,
  type FenrirMeta,
} from "@/data/world-boss-kits";`,
    neu: `  emptyFenrirMeta,
  resolveFenrirSkill,
  fenrirOnTurnAdvance,
  fenrirWeakenGleipnir,
  fenrirAddFury,
  type FenrirMeta,
  emptyHraesvelgrMeta,
  resolveHraesvelgrSkill,
  hraesvelgrOnTurnAdvance,
  hraesvelgrBlocksMelee,
  type HraesvelgrMeta,
} from "@/data/world-boss-kits";`,
  },
];

if (!t.includes("emptyHraesvelgrMeta")) {
  let ok = false;
  for (const m of importMarkers) {
    if (t.includes(m.old)) {
      t = t.replace(m.old, m.neu);
      ok = true;
      break;
    }
  }
  if (!ok) {
    console.error("Marker de import não encontrado.");
    process.exit(1);
  }
}

if (!t.includes("hraesvelgrMeta?:")) {
  for (const k of ["  hatiSkollMeta?: HatiSkollMeta;\n", "  fenrirMeta?: FenrirMeta;\n"]) {
    if (t.includes(k)) {
      t = t.replace(k, k + "  hraesvelgrMeta?: HraesvelgrMeta;\n");
      break;
    }
  }
}

if (!t.includes('hraesvelgrMeta: bossId === "hraesvelgr"')) {
  for (const i of [
    'hatiSkollMeta: bossId === "hati" || bossId === "skoll" ? emptyHatiSkollMeta() : undefined,',
    'fenrirMeta: bossId === "fenrir" ? emptyFenrirMeta() : undefined,',
  ]) {
    if (t.includes(i)) {
      t = t.replace(
        i,
        i +
          '\n          hraesvelgrMeta: bossId === "hraesvelgr" ? emptyHraesvelgrMeta() : undefined,',
      );
      break;
    }
  }
}

if (!t.includes("hraesvelgrOnTurnAdvance(")) {
  const anchors = [
    '        if (!executingMasterAction && (combat.bossId === "hati" || combat.bossId === "skoll")) {',
    '        if (!executingMasterAction && combat.bossId === "fenrir") {',
  ];
  for (const a of anchors) {
    if (!t.includes(a)) continue;
    t = t.replace(
      a,
      `        if (!executingMasterAction && combat.bossId === "hraesvelgr") {
          const alive = combat.turnOrder
            .filter((id) => id !== "world-boss")
            .map((id) => get().characters[id])
            .filter((c) => c && c.current.hp > 0)
            .map((c) => ({ id: c.id, hp: c.current.hp, maxHp: finalStats(c).hp }));
          const baseStats = {
            hp: 100, mp: 100, est: 100, atk: 22, atkMgc: 24, agi: 18, def: 12, res: 12, int: 14, san: 14,
          };
          const adv = hraesvelgrOnTurnAdvance(
            combat.hraesvelgrMeta || emptyHraesvelgrMeta(),
            baseStats,
            alive,
            rollDie,
          );
          turnNotes = (typeof turnNotes !== "undefined" ? turnNotes : []).concat(adv.notes);
          for (const d of adv.skyfallDamages) {
            const ch = poisonCharacters[d.targetId] ?? get().characters[d.targetId];
            if (ch && ch.current.hp > 0) {
              poisonCharacters = {
                ...poisonCharacters,
                [d.targetId]: {
                  ...ch,
                  current: { ...ch.current, hp: Math.max(0, ch.current.hp - d.damage) },
                },
              };
            }
          }
          (combat as any)._hraeMeta = adv.meta;
        }
` + a,
    );
    break;
  }
}

if (t.includes("_hraeMeta") && !t.includes("hraesvelgrMeta: (combat as any)._hraeMeta")) {
  const marker = "...(wendigoMetaTurn ? { wendigoMeta: wendigoMetaTurn } : {}),";
  if (t.includes(marker)) {
    t = t.replace(
      marker,
      marker +
        `\n            ...((combat as any)._hraeMeta ? { hraesvelgrMeta: (combat as any)._hraeMeta } : {}),`,
    );
  }
}

if (!t.includes("resolveHraesvelgrSkill(")) {
  const anchors = [
    '              if ((combat.bossId === "hati" || combat.bossId === "skoll") && skillExecution) {',
    '              if (combat.bossId === "fenrir" && skillExecution) {',
  ];
  for (const at of anchors) {
    if (!t.includes(at)) continue;
    const block = `              if (combat.bossId === "hraesvelgr" && skillExecution) {
                const wb = get().worldBossCombat!;
                const meta = wb.hraesvelgrMeta || emptyHraesvelgrMeta();
                const alive = combat.turnOrder
                  .filter((id) => id !== "world-boss")
                  .map((id) => get().characters[id])
                  .filter((c) => c && c.current.hp > 0);
                const targets = alive.map((c) => ({
                  id: c.id, hp: c.current.hp, maxHp: finalStats(c).hp,
                }));
                const resolved = resolveHraesvelgrSkill(skillExecution.skill.name, {
                  level: combat.level,
                  baseStats: bossLevel.stats,
                  meta,
                  bossHp: wb.current.hp,
                  bossMp: wb.current.mp,
                  bossEst: wb.current.est,
                  primaryTargetId: targetId,
                  targets,
                  rollDie,
                });
                if (resolved) {
                  for (const d of resolved.damages) {
                    const ch = get().characters[d.targetId];
                    if (!ch) continue;
                    get().patchCharacter(d.targetId, {
                      current: { ...ch.current, hp: Math.max(0, ch.current.hp - d.damage) },
                    });
                  }
                  set({
                    worldBossCombat: {
                      ...get().worldBossCombat!,
                      current: {
                        ...get().worldBossCombat!.current,
                        hp: resolved.bossHp,
                        mp: resolved.bossMp,
                        est: resolved.bossEst,
                      },
                      hraesvelgrMeta: resolved.meta,
                      cooldowns: skillExecution.cooldowns,
                    },
                    combatLog: [
                      ...resolved.notes.map((text) => ({
                        id: uid("lg"), at: Date.now(), kind: "system", text,
                      })),
                      {
                        id: uid("lg"), at: Date.now(), kind: "system",
                        text: "O World Boss usa " + skillExecution.skill.name + ".",
                      },
                      ...get().combatLog,
                    ].slice(0, 80),
                  });
                }
              }

`;
    t = t.replace(at, block + at);
    break;
  }
}

writeFileSync(f, t);
console.log("OK: Hræsvelgr wired em", f, "(" + t.length + " bytes)");
