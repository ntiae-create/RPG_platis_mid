#!/usr/bin/env node
/** Wire Eikthyrnir em src/lib/store.ts (idempotente). */
import { readFileSync, writeFileSync } from "fs";

const f = "src/lib/store.ts";
let t = readFileSync(f, "utf8");
if (t.includes("emptyEikthyrnirMeta") && t.includes("resolveEikthyrnirSkill(")) {
  console.log("Eikthyrnir já está wired. Nada a fazer.");
  process.exit(0);
}
if (t.length < 50000) {
  console.error("store.ts incompleto (" + t.length + " bytes).");
  process.exit(1);
}

const importMarkers = [
  {
    old: `  emptyRatatoskrMeta,
  resolveRatatoskrSkill,
  ratatoskrOnTurnAdvance,
  ratatoskrFellTree,
  type RatatoskrMeta,
} from "@/data/world-boss-kits";`,
    neu: `  emptyRatatoskrMeta,
  resolveRatatoskrSkill,
  ratatoskrOnTurnAdvance,
  ratatoskrFellTree,
  type RatatoskrMeta,
  emptyEikthyrnirMeta,
  resolveEikthyrnirSkill,
  eikthyrnirOnTurnAdvance,
  eikthyrnirOnDamaged,
  eikthyrnirApplyIncomingDamage,
  type EikthyrnirMeta,
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
  emptyEikthyrnirMeta,
  resolveEikthyrnirSkill,
  eikthyrnirOnTurnAdvance,
  eikthyrnirOnDamaged,
  eikthyrnirApplyIncomingDamage,
  type EikthyrnirMeta,
} from "@/data/world-boss-kits";`,
  },
];

if (!t.includes("emptyEikthyrnirMeta")) {
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

if (!t.includes("eikthyrnirMeta?:")) {
  for (const k of [
    "  ratatoskrMeta?: RatatoskrMeta;\n",
    "  fenrirMeta?: FenrirMeta;\n",
  ]) {
    if (t.includes(k)) {
      t = t.replace(k, k + "  eikthyrnirMeta?: EikthyrnirMeta;\n");
      break;
    }
  }
}

if (!t.includes('eikthyrnirMeta: bossId === "eikthyrnir"')) {
  for (const i of [
    'ratatoskrMeta: bossId === "ratatoskr" ? emptyRatatoskrMeta() : undefined,',
    'fenrirMeta: bossId === "fenrir" ? emptyFenrirMeta() : undefined,',
  ]) {
    if (t.includes(i)) {
      t = t.replace(
        i,
        i +
          '\n          eikthyrnirMeta: bossId === "eikthyrnir" ? emptyEikthyrnirMeta() : undefined,',
      );
      break;
    }
  }
}

if (!t.includes("eikthyrnirOnTurnAdvance(")) {
  const anchors = [
    '        if (!executingMasterAction && combat.bossId === "ratatoskr") {',
    '        if (!executingMasterAction && combat.bossId === "fenrir") {',
  ];
  let placed = false;
  for (const a of anchors) {
    if (!t.includes(a)) continue;
    t = t.replace(
      a,
      `        if (!executingMasterAction && combat.bossId === "eikthyrnir") {
          const adv = eikthyrnirOnTurnAdvance(combat.eikthyrnirMeta || emptyEikthyrnirMeta());
          turnNotes = (typeof turnNotes !== "undefined" ? turnNotes : []).concat(adv.notes);
          (combat as any)._eikMeta = adv.meta;
        }
` + a,
    );
    placed = true;
    break;
  }
  if (!placed) {
    console.error("Anchor tick não encontrado.");
    process.exit(1);
  }
}

if (t.includes("_eikMeta") && !t.includes("eikthyrnirMeta: (combat as any)._eikMeta")) {
  const marker = "...(wendigoMetaTurn ? { wendigoMeta: wendigoMetaTurn } : {}),";
  if (t.includes(marker)) {
    t = t.replace(
      marker,
      marker +
        `\n            ...((combat as any)._eikMeta ? { eikthyrnirMeta: (combat as any)._eikMeta } : {}),`,
    );
  }
}

if (!t.includes("resolveEikthyrnirSkill(")) {
  const anchors = [
    '              if (combat.bossId === "ratatoskr" && skillExecution) {',
    '              if (combat.bossId === "fenrir" && skillExecution) {',
  ];
  let ok = false;
  for (const at of anchors) {
    if (!t.includes(at)) continue;
    const block = `              if (combat.bossId === "eikthyrnir" && skillExecution) {
                const wb = get().worldBossCombat!;
                const meta = wb.eikthyrnirMeta || emptyEikthyrnirMeta();
                const alive = combat.turnOrder
                  .filter((id) => id !== "world-boss")
                  .map((id) => get().characters[id])
                  .filter((c) => c && c.current.hp > 0);
                const targets = alive.map((c) => ({
                  id: c.id, hp: c.current.hp, maxHp: finalStats(c).hp,
                }));
                const resolved = resolveEikthyrnirSkill(skillExecution.skill.name, {
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
                      eikthyrnirMeta: resolved.meta,
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
console.log("OK: Eikthyrnir wired em", f, "(" + t.length + " bytes)");
