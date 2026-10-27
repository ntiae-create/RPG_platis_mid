#!/usr/bin/env node
/** Wire Hati + Skoll em src/lib/store.ts (idempotente). */
import { readFileSync, writeFileSync } from "fs";

const f = "src/lib/store.ts";
let t = readFileSync(f, "utf8");
if (t.includes("emptyHatiSkollMeta") && t.includes("resolveHatiSkill(")) {
  console.log("Hati/Skoll já estão wired. Nada a fazer.");
  process.exit(0);
}
if (t.length < 50000) {
  console.error("store.ts incompleto (" + t.length + " bytes).");
  process.exit(1);
}

const importMarkers = [
  {
    old: `  emptyEikthyrnirMeta,
  resolveEikthyrnirSkill,
  eikthyrnirOnTurnAdvance,
  eikthyrnirOnDamaged,
  eikthyrnirApplyIncomingDamage,
  type EikthyrnirMeta,
} from "@/data/world-boss-kits";`,
    neu: `  emptyEikthyrnirMeta,
  resolveEikthyrnirSkill,
  eikthyrnirOnTurnAdvance,
  eikthyrnirOnDamaged,
  eikthyrnirApplyIncomingDamage,
  type EikthyrnirMeta,
  emptyHatiSkollMeta,
  resolveHatiSkill,
  resolveSkollSkill,
  hatiSkollOnTurnAdvance,
  twinOnBrotherFallen,
  type HatiSkollMeta,
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
  emptyHatiSkollMeta,
  resolveHatiSkill,
  resolveSkollSkill,
  hatiSkollOnTurnAdvance,
  twinOnBrotherFallen,
  type HatiSkollMeta,
} from "@/data/world-boss-kits";`,
  },
];

if (!t.includes("emptyHatiSkollMeta")) {
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

if (!t.includes("hatiSkollMeta?:")) {
  for (const k of ["  eikthyrnirMeta?: EikthyrnirMeta;\n", "  fenrirMeta?: FenrirMeta;\n"]) {
    if (t.includes(k)) {
      t = t.replace(k, k + "  hatiSkollMeta?: HatiSkollMeta;\n");
      break;
    }
  }
}

if (!t.includes('hatiSkollMeta: bossId === "hati"')) {
  for (const i of [
    'eikthyrnirMeta: bossId === "eikthyrnir" ? emptyEikthyrnirMeta() : undefined,',
    'fenrirMeta: bossId === "fenrir" ? emptyFenrirMeta() : undefined,',
  ]) {
    if (t.includes(i)) {
      t = t.replace(
        i,
        i +
          '\n          hatiSkollMeta: bossId === "hati" || bossId === "skoll" ? emptyHatiSkollMeta() : undefined,',
      );
      break;
    }
  }
}

if (!t.includes("hatiSkollOnTurnAdvance(")) {
  const anchors = [
    '        if (!executingMasterAction && combat.bossId === "eikthyrnir") {',
    '        if (!executingMasterAction && combat.bossId === "fenrir") {',
  ];
  for (const a of anchors) {
    if (!t.includes(a)) continue;
    t = t.replace(
      a,
      `        if (!executingMasterAction && (combat.bossId === "hati" || combat.bossId === "skoll")) {
          const adv = hatiSkollOnTurnAdvance(combat.hatiSkollMeta || emptyHatiSkollMeta());
          turnNotes = (typeof turnNotes !== "undefined" ? turnNotes : []).concat(adv.notes);
          (combat as any)._twinMeta = adv.meta;
        }
` + a,
    );
    break;
  }
}

if (t.includes("_twinMeta") && !t.includes("hatiSkollMeta: (combat as any)._twinMeta")) {
  const marker = "...(wendigoMetaTurn ? { wendigoMeta: wendigoMetaTurn } : {}),";
  if (t.includes(marker)) {
    t = t.replace(
      marker,
      marker +
        `\n            ...((combat as any)._twinMeta ? { hatiSkollMeta: (combat as any)._twinMeta } : {}),`,
    );
  }
}

if (!t.includes("resolveHatiSkill(")) {
  const anchors = [
    '              if (combat.bossId === "eikthyrnir" && skillExecution) {',
    '              if (combat.bossId === "fenrir" && skillExecution) {',
  ];
  for (const at of anchors) {
    if (!t.includes(at)) continue;
    const block = `              if ((combat.bossId === "hati" || combat.bossId === "skoll") && skillExecution) {
                const wb = get().worldBossCombat!;
                const meta = wb.hatiSkollMeta || emptyHatiSkollMeta();
                const alive = combat.turnOrder
                  .filter((id) => id !== "world-boss")
                  .map((id) => get().characters[id])
                  .filter((c) => c && c.current.hp > 0);
                const targets = alive.map((c) => ({
                  id: c.id, hp: c.current.hp, maxHp: finalStats(c).hp,
                }));
                const resolved =
                  combat.bossId === "hati"
                    ? resolveHatiSkill(skillExecution.skill.name, {
                        level: combat.level,
                        baseStats: bossLevel.stats,
                        meta,
                        bossHp: wb.current.hp,
                        bossMp: wb.current.mp,
                        bossEst: wb.current.est,
                        primaryTargetId: targetId,
                        targets,
                        rollDie,
                      })
                    : resolveSkollSkill(skillExecution.skill.name, {
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
                  for (const s of resolved.status) {
                    const id =
                      s.kind === "infect"
                        ? "infect"
                        : s.kind === "bleed"
                          ? "bleeding"
                          : s.kind === "stun"
                            ? "stun"
                            : "weakness";
                    try {
                      get().applyCombatStatusEffect(id as any, s.targetId, {
                        duration: s.duration,
                        sourceId: "world-boss",
                      });
                    } catch {}
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
                      hatiSkollMeta: resolved.meta,
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
console.log("OK: Hati/Skoll wired em", f, "(" + t.length + " bytes)");
