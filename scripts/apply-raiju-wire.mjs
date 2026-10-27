#!/usr/bin/env node
/**
 * Aplica wire do Raiju em src/lib/store.ts (idempotente).
 * Uso: node scripts/apply-raiju-wire.mjs
 */
import { readFileSync, writeFileSync } from "fs";

const f = "src/lib/store.ts";
let t = readFileSync(f, "utf8");
if (t.includes("emptyRaijuMeta") && t.includes("resolveRaijuSkill(")) {
  console.log("Raiju já está wired. Nada a fazer.");
  process.exit(0);
}
if (t.length < 50000) {
  console.error("store.ts parece incompleto (" + t.length + " bytes). Restaure antes.");
  process.exit(1);
}

const oldImp = `  emptyFenrirMeta,
  resolveFenrirSkill,
  fenrirOnTurnAdvance,
  fenrirWeakenGleipnir,
  fenrirAddFury,
  type FenrirMeta,
} from "@/data/world-boss-kits";`;
const newImp = `  emptyFenrirMeta,
  resolveFenrirSkill,
  fenrirOnTurnAdvance,
  fenrirWeakenGleipnir,
  fenrirAddFury,
  type FenrirMeta,
  emptyRaijuMeta,
  resolveRaijuSkill,
  raijuOnTurnAdvance,
  raijuMeleeReflect,
  raijuBlocksHeal,
  type RaijuMeta,
} from "@/data/world-boss-kits";`;
if (!t.includes(oldImp)) {
  console.error("Marker de import Fenrir não encontrado.");
  process.exit(1);
}
t = t.replace(oldImp, newImp);

if (!t.includes("raijuMeta?:")) {
  t = t.replace(
    "  fenrirMeta?: FenrirMeta;\n",
    "  fenrirMeta?: FenrirMeta;\n  raijuMeta?: RaijuMeta;\n",
  );
}

if (!t.includes('raijuMeta: bossId === "raiju"')) {
  t = t.replace(
    'fenrirMeta: bossId === "fenrir" ? emptyFenrirMeta() : undefined,',
    'fenrirMeta: bossId === "fenrir" ? emptyFenrirMeta() : undefined,\n          raijuMeta: bossId === "raiju" ? emptyRaijuMeta() : undefined,',
  );
}

if (!t.includes("raijuOnTurnAdvance(")) {
  const anchor = '        if (!executingMasterAction && combat.bossId === "fenrir") {';
  if (!t.includes(anchor)) {
    console.error("Anchor tick fenrir não encontrado.");
    process.exit(1);
  }
  const block = `        if (!executingMasterAction && combat.bossId === "raiju") {
          const aliveIds = combat.turnOrder.filter(
            (id) => id !== "world-boss" && (get().characters[id]?.current.hp ?? 0) > 0,
          );
          const adv = raijuOnTurnAdvance(
            combat.raijuMeta || emptyRaijuMeta(),
            aliveIds,
            20,
            rollDie,
          );
          turnNotes = (typeof turnNotes !== "undefined" ? turnNotes : []).concat(adv.notes);
          for (const d of [...adv.dotDamages, ...adv.trailDamages]) {
            const ch = poisonCharacters[d.targetId] ?? get().characters[d.targetId];
            if (ch && ch.current.hp > 0) {
              poisonCharacters = {
                ...poisonCharacters,
                [d.targetId]: {
                  ...ch,
                  current: {
                    ...ch.current,
                    hp: Math.max(0, ch.current.hp - d.damage),
                  },
                },
              };
            }
          }
          (combat as { _raijuMeta?: typeof adv.meta })._raijuMeta = adv.meta;
        }
`;
  t = t.replace(anchor, block + anchor);
}

const oldSet = `            affinityReactionBlocks,
            ...(wendigoMetaTurn ? { wendigoMeta: wendigoMetaTurn } : {}),
          },`;
const newSet = `            affinityReactionBlocks,
            ...(wendigoMetaTurn ? { wendigoMeta: wendigoMetaTurn } : {}),
            ...((combat as any)._fenrirMeta
              ? { fenrirMeta: (combat as any)._fenrirMeta }
              : {}),
            ...((combat as any)._ammitMeta
              ? { ammitMeta: (combat as any)._ammitMeta }
              : {}),
            ...((combat as any)._camaMeta
              ? { camazotzMeta: (combat as any)._camaMeta }
              : {}),
            ...((combat as any)._raijuMeta
              ? { raijuMeta: (combat as any)._raijuMeta }
              : {}),
            ...((combat as any)._tsuchiAdv
              ? { tsuchigumoMeta: (combat as any)._tsuchiAdv.meta }
              : {}),
          },`;
if (t.includes(oldSet)) {
  t = t.replace(oldSet, newSet);
}

if (!t.includes("resolveRaijuSkill(")) {
  const anchor2 = '              if (combat.bossId === "fenrir" && skillExecution) {';
  if (!t.includes(anchor2)) {
    console.error("Anchor skill fenrir não encontrado.");
    process.exit(1);
  }
  const block2 = `              if (combat.bossId === "raiju" && skillExecution) {
                const wb = get().worldBossCombat!;
                const meta = wb.raijuMeta || emptyRaijuMeta();
                const alive = combat.turnOrder
                  .filter((id) => id !== "world-boss")
                  .map((id) => get().characters[id])
                  .filter((c) => c && c.current.hp > 0);
                const targets = alive.map((c) => ({
                  id: c.id,
                  hp: c.current.hp,
                  maxHp: finalStats(c).hp,
                }));
                const resolved = resolveRaijuSkill(skillExecution.skill.name, {
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
                      current: {
                        ...ch.current,
                        hp: Math.max(0, ch.current.hp - d.damage),
                      },
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
                      raijuMeta: resolved.meta,
                      cooldowns: skillExecution.cooldowns,
                    },
                    combatLog: [
                      ...resolved.notes.map((text) => ({
                        id: uid("lg"),
                        at: Date.now(),
                        kind: "system",
                        text,
                      })),
                      {
                        id: uid("lg"),
                        at: Date.now(),
                        kind: "system",
                        text: "O World Boss usa " + skillExecution.skill.name + ".",
                      },
                      ...get().combatLog,
                    ].slice(0, 80),
                  });
                }
              }

`;
  t = t.replace(anchor2, block2 + anchor2);
}

writeFileSync(f, t);
console.log("OK: Raiju wired em", f, "(" + t.length + " bytes)");
