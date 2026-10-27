#!/usr/bin/env node
/**
 * Wire Ratatoskr em src/lib/store.ts (idempotente).
 * Uso: node scripts/apply-ratatoskr-wire.mjs
 */
import { readFileSync, writeFileSync } from "fs";

const f = "src/lib/store.ts";
let t = readFileSync(f, "utf8");
if (t.includes("emptyRatatoskrMeta") && t.includes("resolveRatatoskrSkill(")) {
  console.log("Ratatoskr já está wired. Nada a fazer.");
  process.exit(0);
}
if (t.length < 50000) {
  console.error("store.ts incompleto (" + t.length + " bytes).");
  process.exit(1);
}

const importMarkers = [
  {
    old: `  emptyJormungandrMeta,
  resolveJormungandrSkill,
  jormungandrOnTurnAdvance,
  jormungandrPhysicalDamageTakenMult,
  type JormungandrMeta,
} from "@/data/world-boss-kits";`,
    neu: `  emptyJormungandrMeta,
  resolveJormungandrSkill,
  jormungandrOnTurnAdvance,
  jormungandrPhysicalDamageTakenMult,
  type JormungandrMeta,
  emptyRatatoskrMeta,
  resolveRatatoskrSkill,
  ratatoskrOnTurnAdvance,
  ratatoskrFellTree,
  type RatatoskrMeta,
} from "@/data/world-boss-kits";`,
  },
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
  emptyRatatoskrMeta,
  resolveRatatoskrSkill,
  ratatoskrOnTurnAdvance,
  ratatoskrFellTree,
  type RatatoskrMeta,
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
  emptyRatatoskrMeta,
  resolveRatatoskrSkill,
  ratatoskrOnTurnAdvance,
  ratatoskrFellTree,
  type RatatoskrMeta,
} from "@/data/world-boss-kits";`,
  },
];

if (!t.includes("emptyRatatoskrMeta")) {
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

if (!t.includes("ratatoskrMeta?:")) {
  for (const k of [
    "  jormungandrMeta?: JormungandrMeta;\n",
    "  raijuMeta?: RaijuMeta;\n",
    "  fenrirMeta?: FenrirMeta;\n",
  ]) {
    if (t.includes(k)) {
      t = t.replace(k, k + "  ratatoskrMeta?: RatatoskrMeta;\n");
      break;
    }
  }
}

if (!t.includes('ratatoskrMeta: bossId === "ratatoskr"')) {
  for (const i of [
    'jormungandrMeta: bossId === "jormungandr" ? emptyJormungandrMeta() : undefined,',
    'raijuMeta: bossId === "raiju" ? emptyRaijuMeta() : undefined,',
    'fenrirMeta: bossId === "fenrir" ? emptyFenrirMeta() : undefined,',
  ]) {
    if (t.includes(i)) {
      t = t.replace(
        i,
        i +
          '\n          ratatoskrMeta: bossId === "ratatoskr" ? emptyRatatoskrMeta() : undefined,',
      );
      break;
    }
  }
}

if (!t.includes("ratatoskrOnTurnAdvance(")) {
  const anchors = [
    '        if (!executingMasterAction && combat.bossId === "jormungandr") {',
    '        if (!executingMasterAction && combat.bossId === "raiju") {',
    '        if (!executingMasterAction && combat.bossId === "fenrir") {',
  ];
  let placed = false;
  for (const a of anchors) {
    if (!t.includes(a)) continue;
    const block = `        if (!executingMasterAction && combat.bossId === "ratatoskr") {
          const baseStats = {
            hp: 100, mp: 100, est: 100, atk: 20, atkMgc: 25, agi: 12, def: 12, res: 15, int: 20, san: 20,
          };
          const adv = ratatoskrOnTurnAdvance(
            combat.ratatoskrMeta || emptyRatatoskrMeta(),
            baseStats,
            combat.current.mp,
            combat.current.hp,
          );
          turnNotes = (typeof turnNotes !== "undefined" ? turnNotes : []).concat(adv.notes);
          (combat as any)._rataMeta = adv.meta;
          (combat as any)._rataMp = adv.bossMp;
          (combat as any)._rataHp = adv.bossHp;
        }
`;
    t = t.replace(a, block + a);
    placed = true;
    break;
  }
  if (!placed) {
    console.error("Anchor tick não encontrado.");
    process.exit(1);
  }
}

if (t.includes("...(wendigoMetaTurn ? { wendigoMeta: wendigoMetaTurn } : {}),") && !t.includes("_rataMeta")) {
  // ensure _rataMeta was set by tick
}
if (t.includes("_rataMeta") && !t.includes("ratatoskrMeta: (combat as any)._rataMeta")) {
  const marker = "...(wendigoMetaTurn ? { wendigoMeta: wendigoMetaTurn } : {}),";
  if (t.includes(marker)) {
    t = t.replace(
      marker,
      marker +
        `\n            ...((combat as any)._rataMeta ? { ratatoskrMeta: (combat as any)._rataMeta, current: { ...combat.current, mp: (combat as any)._rataMp ?? combat.current.mp, hp: (combat as any)._rataHp ?? combat.current.hp } } : {}),`,
    );
  }
}

if (!t.includes("resolveRatatoskrSkill(")) {
  const anchors = [
    '              if (combat.bossId === "jormungandr" && skillExecution) {',
    '              if (combat.bossId === "raiju" && skillExecution) {',
    '              if (combat.bossId === "fenrir" && skillExecution) {',
  ];
  let ok = false;
  for (const at of anchors) {
    if (!t.includes(at)) continue;
    const block = `              if (combat.bossId === "ratatoskr" && skillExecution) {
                const wb = get().worldBossCombat!;
                const meta = wb.ratatoskrMeta || emptyRatatoskrMeta();
                const alive = combat.turnOrder
                  .filter((id) => id !== "world-boss")
                  .map((id) => get().characters[id])
                  .filter((c) => c && c.current.hp > 0);
                const targets = alive.map((c) => ({
                  id: c.id, hp: c.current.hp, maxHp: finalStats(c).hp,
                }));
                const resolved = resolveRatatoskrSkill(skillExecution.skill.name, {
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
                      ratatoskrMeta: resolved.meta,
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
console.log("OK: Ratatoskr wired em", f, "(" + t.length + " bytes)");
