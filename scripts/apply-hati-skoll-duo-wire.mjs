#!/usr/bin/env node
/**
 * Atualiza wire Hati/Skoll para modo duo (bossId hati-skoll).
 * Idempotente em cima do wire anterior.
 */
import { readFileSync, writeFileSync } from "fs";

const f = "src/lib/store.ts";
let t = readFileSync(f, "utf8");
if (t.length < 50000) {
  console.error("store.ts incompleto");
  process.exit(1);
}

// Imports extras para duo
const need = [
  "createDuoHatiSkollMeta",
  "twinApplyDamage",
  "twinDisplayCurrent",
  "twinActionOrder",
  "twinBothDefeated",
  "twinPickDamageTarget",
];
if (!t.includes("createDuoHatiSkollMeta")) {
  if (t.includes("emptyHatiSkollMeta,")) {
    t = t.replace(
      "emptyHatiSkollMeta,",
      "emptyHatiSkollMeta,\n  createDuoHatiSkollMeta,\n  twinApplyDamage,\n  twinDisplayCurrent,\n  twinActionOrder,\n  twinBothDefeated,\n  twinPickDamageTarget,",
    );
    console.log("imports duo: OK");
  } else {
    console.error("emptyHatiSkollMeta não está no import — rode apply-hati-skoll-wire.mjs antes");
    process.exit(1);
  }
} else {
  console.log("imports duo: já tinha");
}

// Init duo no startWorldBossCombat
if (!t.includes('bossId === "hati-skoll"')) {
  const markers = [
    'hatiSkollMeta: bossId === "hati" || bossId === "skoll" ? emptyHatiSkollMeta() : undefined,',
    'hatiSkollMeta: bossId === "hati" || bossId === "skoll" ? emptyHatiSkollMeta(true) : undefined,',
  ];
  let done = false;
  for (const m of markers) {
    if (!t.includes(m)) continue;
    t = t.replace(
      m,
      `hatiSkollMeta:
            bossId === "hati-skoll"
              ? createDuoHatiSkollMeta(bossLevel.stats, bossLevel.stats)
              : bossId === "hati" || bossId === "skoll"
                ? emptyHatiSkollMeta()
                : undefined,`,
    );
    // bossLevel may not be in scope at that point - check
    done = true;
    console.log("init duo: tentativa OK (verifique bossLevel no escopo)");
    break;
  }
  if (!done) {
    // fallback: after fenrir meta line style
    const alt = 'fenrirMeta: bossId === "fenrir" ? emptyFenrirMeta() : undefined,';
    if (t.includes("hatiSkollMeta:") && t.includes('bossId === "hati"')) {
      console.log("init: já parcialmente presente");
    } else if (t.includes(alt)) {
      t = t.replace(
        alt,
        alt +
          `\n          hatiSkollMeta:
            bossId === "hati-skoll"
              ? createDuoHatiSkollMeta(
                  { hp: 100, mp: 165, est: 335 },
                  { hp: 100, mp: 165, est: 335 },
                )
              : bossId === "hati" || bossId === "skoll"
                ? emptyHatiSkollMeta()
                : undefined,`,
      );
      console.log("init duo via fenrir anchor");
    }
  }
}

// Fix init if bossLevel used incorrectly - use numeric defaults when needed
if (t.includes("createDuoHatiSkollMeta(bossLevel.stats") && !t.includes("const bossLevel")) {
  // in startWorldBossCombat, boss is found - search for levels.find nearby
  t = t.replace(
    /createDuoHatiSkollMeta\(bossLevel\.stats, bossLevel\.stats\)/g,
    `createDuoHatiSkollMeta(
              (boss?.levels?.find((l: { level: number }) => l.level === level)?.stats) || {
                hp: 100, mp: 165, est: 335,
              },
              (boss?.levels?.find((l: { level: number }) => l.level === level)?.stats) || {
                hp: 100, mp: 165, est: 335,
              },
            )`,
  );
  console.log("init stats: fix boss level lookup");
}

// Skill resolve: for hati-skoll run BOTH living brothers when master picks a skill
// Mark with comment to avoid double insert
if (!t.includes("/* twin-duo-resolve */")) {
  const anchors = [
    '              if ((combat.bossId === "hati" || combat.bossId === "skoll") && skillExecution) {',
    '              if (combat.bossId === "hati" && skillExecution) {',
  ];
  for (const at of anchors) {
    if (!t.includes(at)) continue;
    // Expand condition to include hati-skoll
    t = t.replace(
      at,
      at.replace(
        '(combat.bossId === "hati" || combat.bossId === "skoll")',
        '(combat.bossId === "hati" || combat.bossId === "skoll" || combat.bossId === "hati-skoll")',
      ),
    );
    // If still single hati only, widen
    t = t.replace(
      '              if (combat.bossId === "hati" && skillExecution) {',
      '              if ((combat.bossId === "hati" || combat.bossId === "skoll" || combat.bossId === "hati-skoll") && skillExecution) {',
    );
    break;
  }

  // Inject duo branch: if hati-skoll, resolve active then the other living
  const resolveStart =
    '                const resolved =\n                  combat.bossId === "hati"';
  if (t.includes(resolveStart) && !t.includes("/* twin-duo-resolve */")) {
    t = t.replace(
      resolveStart,
      `                /* twin-duo-resolve */
                let actorId = combat.bossId === "skoll" ? "skoll" : combat.bossId === "hati" ? "hati" : (wb.hatiSkollMeta?.activeActor || "hati");
                if (combat.bossId === "hati-skoll") {
                  const order = twinActionOrder(wb.hatiSkollMeta || emptyHatiSkollMeta());
                  actorId = order[0] || "hati";
                }
                const resolved =
                  actorId === "hati"`,
    );
    // Fix ternary - original was combat.bossId === "hati" ? resolveHati : resolveSkoll
    t = t.replace(
      /actorId === "hati"\s*\n\s*\? resolveHatiSkill/,
      'actorId === "hati"\n                    ? resolveHatiSkill',
    );
    console.log("duo resolve actor: parcial — confira o ternário no store");
  }
}

writeFileSync(f, t);
console.log("OK: duo wire aplicado (" + t.length + " bytes)");
console.log("Dica: se o ternário de resolve quebrou, rode grep resolveHatiSkill e ajuste actorId.");
console.log("Para iniciar duo: startWorldBossCombat(\"hati-skoll\", level)");
