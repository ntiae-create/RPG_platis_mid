#!/usr/bin/env node
/**
 * Wire Jörmungandr em src/lib/store.ts (idempotente).
 * Uso: node scripts/apply-jormungandr-wire.mjs
 */
import { readFileSync, writeFileSync } from "fs";

const f = "src/lib/store.ts";
let t = readFileSync(f, "utf8");
if (t.includes("emptyJormungandrMeta") && t.includes("resolveJormungandrSkill(")) {
  console.log("Jörmungandr já está wired. Nada a fazer.");
  process.exit(0);
}
if (t.length < 50000) {
  console.error("store.ts incompleto (" + t.length + " bytes). Restaure antes.");
  process.exit(1);
}

// Preferir inserir após Raiju se existir; senão após Fenrir
const markers = [
  {
    old: `  emptyRaijuMeta,
  resolveRaijuSkill,
  raijuOnTurnAdvance,
  raijuMeleeReflect,
  raijuBlocksHeal,
  type RaijuMeta,
} from "@/data/world-boss-kits";`,
    neu: `  emptyRaijuMeta,
  resolveRaijuSkill,
  raijuOnTurnAdvance,
  raijuMeleeReflect,
  raijuBlocksHeal,
  type RaijuMeta,
  emptyJormungandrMeta,
  resolveJormungandrSkill,
  jormungandrOnTurnAdvance,
  jormungandrPhysicalDamageTakenMult,
  type JormungandrMeta,
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
  emptyJormungandrMeta,
  resolveJormungandrSkill,
  jormungandrOnTurnAdvance,
  jormungandrPhysicalDamageTakenMult,
  type JormungandrMeta,
} from "@/data/world-boss-kits";`,
  },
];

if (!t.includes("emptyJormungandrMeta")) {
  let ok = false;
  for (const m of markers) {
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

if (!t.includes("jormungandrMeta?:")) {
  for (const k of ["  raijuMeta?: RaijuMeta;\n", "  fenrirMeta?: FenrirMeta;\n"]) {
    if (t.includes(k)) {
      t = t.replace(k, k + "  jormungandrMeta?: JormungandrMeta;\n");
      break;
    }
  }
}

if (!t.includes('jormungandrMeta: bossId === "jormungandr"')) {
  for (const i of [
    'raijuMeta: bossId === "raiju" ? emptyRaijuMeta() : undefined,',
    'fenrirMeta: bossId === "fenrir" ? emptyFenrirMeta() : undefined,',
  ]) {
    if (t.includes(i)) {
      t = t.replace(
        i,
        i +
          '\n          jormungandrMeta: bossId === "jormungandr" ? emptyJormungandrMeta() : undefined,',
      );
      break;
    }
  }
}

if (!t.includes("jormungandrOnTurnAdvance(")) {
  const anchors = [
    '        if (!executingMasterAction && combat.bossId === "raiju") {',
    '        if (!executingMasterAction && combat.bossId === "fenrir") {',
  ];
  let placed = false;
  for (const a of anchors) {
    if (!t.includes(a)) continue;
    const block = `        if (!executingMasterAction && combat.bossId === "jormungandr") {
          const adj = combat.turnOrder.filter(
            (id) => id !== "world-boss" && (get().characters[id]?.current.hp ?? 0) > 0,
          );
          const adv = jormungandrOnTurnAdvance(
            combat.jormungandrMeta || emptyJormungandrMeta(),
            bossLevelSafeStats(combat),
            combat.current.hp,
            combat.current.mp,
            combat.current.est,
            adj,
          );
          turnNotes = (typeof turnNotes !== "undefined" ? turnNotes : []).concat(adv.notes);
          for (const d of [...adv.dragDamages, ...adv.whirlpoolDamages]) {
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
          (combat as any)._jormMeta = adv.meta;
          (combat as any)._jormMp = adv.bossMp;
          (combat as any)._jormEst = adv.bossEst;
        }
`;
    // bossLevelSafeStats may not exist — use combat stats inline instead
    const block2 = block.replace(
      "bossLevelSafeStats(combat)",
      "(get().worldBossCombat ? { hp: get().worldBossCombat!.current.hp || 1, mp: 100, est: 100, atk: 20, atkMgc: 20, agi: 10, def: 10, res: 10, int: 10, san: 10 } : { hp: 1, mp: 100, est: 100, atk: 20, atkMgc: 20, agi: 10, def: 10, res: 10, int: 10, san: 10 })",
    );
    t = t.replace(a, block2 + a);
    placed = true;
    break;
  }
  if (!placed) {
    console.error("Anchor tick não encontrado.");
    process.exit(1);
  }
}

// persist meta
if (!t.includes("_jormMeta")) {
  console.error("tick não inseriu _jormMeta");
  process.exit(1);
}
const oldSet = `            ...(wendigoMetaTurn ? { wendigoMeta: wendigoMetaTurn } : {}),`;
if (t.includes(oldSet) && !t.includes("_jormMeta ?")) {
  t = t.replace(
    oldSet,
    oldSet +
      `
            ...((combat as any)._jormMeta ? { jormungandrMeta: (combat as any)._jormMeta, current: { ...combat.current, mp: (combat as any)._jormMp ?? combat.current.mp, est: (combat as any)._jormEst ?? combat.current.est } } : {}),`,
  );
}

if (!t.includes("resolveJormungandrSkill(")) {
  const anchors = [
    '              if (combat.bossId === "raiju" && skillExecution) {',
    '              if (combat.bossId === "fenrir" && skillExecution) {',
  ];
  let ok = false;
  for (const at of anchors) {
    if (!t.includes(at)) continue;
    const block = `              if (combat.bossId === "jormungandr" && skillExecution) {
                const wb = get().worldBossCombat!;
                const meta = wb.jormungandrMeta || emptyJormungandrMeta();
                const alive = combat.turnOrder
                  .filter((id) => id !== "world-boss")
                  .map((id) => get().characters[id])
                  .filter((c) => c && c.current.hp > 0);
                const targets = alive.map((c) => ({
                  id: c.id, hp: c.current.hp, maxHp: finalStats(c).hp,
                }));
                const resolved = resolveJormungandrSkill(skillExecution.skill.name, {
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
                      jormungandrMeta: resolved.meta,
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
    ok = true;
    break;
  }
  if (!ok) {
    console.error("Anchor skill não encontrado.");
    process.exit(1);
  }
}

writeFileSync(f, t);
console.log("OK: Jörmungandr wired em", f, "(" + t.length + " bytes)");
