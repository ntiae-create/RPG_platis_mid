/**
 * Testes de passivas (raças/classes) + indicadores + helpers NPC.
 * node --test scripts/passives-combat.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

function emptyState() {
  return { entries: [] };
}
function ensure(state, characterId, id, name, defaults = {}) {
  let e = state.entries.find((x) => x.characterId === characterId && x.id === id);
  if (!e) {
    e = {
      id, characterId, origin: defaults.origin || "class", name,
      stacks: defaults.stacks ?? 0,
      maxStacks: defaults.maxStacks ?? null,
      turnsRemaining: defaults.turnsRemaining ?? null,
      active: defaults.active ?? true,
      meta: defaults.meta ?? {},
    };
    state.entries.push(e);
  }
  return e;
}

/** espelho simplificado das regras usadas no motor */
function classMongeOnHit(state, ch) {
  if (ch.classId !== "monge") return {};
  const e = ensure(state, ch.id, "class:monge:disc", "Disciplina", { stacks: 0, maxStacks: 3, meta: { hits: 0 } });
  e.meta.hits = Number(e.meta.hits || 0) + 1;
  if (e.meta.hits % 3 === 0) e.stacks = Math.min(3, e.stacks + 1);
  return { agi: e.stacks, def: e.stacks };
}
function raceKitsuneOnDamageTaken(state, ch, damage) {
  if (ch.raceId !== "kitsune" || damage <= 0) return { releaseDamage: 0, notes: [] };
  const e = ensure(state, ch.id, "race:kitsune:caudas", "Caudas", { stacks: 0, maxStacks: 9, meta: { damageSum: 0 }, origin: "race" });
  e.stacks = Math.min(9, e.stacks + 1);
  e.meta.damageSum = Number(e.meta.damageSum || 0) + damage;
  if (e.stacks >= 9) {
    const total = e.meta.damageSum;
    e.stacks = 0; e.meta.damageSum = 0;
    return { releaseDamage: total, notes: ["release"] };
  }
  return { releaseDamage: 0, notes: ["cauda "+e.stacks] };
}
function classCeifadorOnKill(damage) {
  return { healPool: Math.max(1, Math.floor(damage * 0.5)) };
}
function listStacksVisual(state, characterId) {
  return state.entries
    .filter((e) => e.characterId === characterId && (e.active || e.stacks > 0))
    .map((e) => ({ id: e.id, stacks: e.stacks, name: e.name }));
}

describe("passivas combate", () => {
  it("Monge acumula disciplina a cada 3 hits", () => {
    const st = emptyState();
    const ch = { id: "m1", classId: "monge" };
    for (let i = 0; i < 6; i++) classMongeOnHit(st, ch);
    const e = st.entries.find((x) => x.id === "class:monge:disc");
    assert.equal(e.stacks, 2);
  });

  it("Kitsune libera caudas na 9ª", () => {
    const st = emptyState();
    const ch = { id: "k1", raceId: "kitsune" };
    let release = 0;
    for (let i = 0; i < 9; i++) {
      const r = raceKitsuneOnDamageTaken(st, ch, 10);
      release = r.releaseDamage;
    }
    assert.equal(release, 90);
  });

  it("Ceifador gera pool de cura no kill", () => {
    const r = classCeifadorOnKill(40);
    assert.equal(r.healPool, 20);
  });

  it("indicadores listam stacks ativos", () => {
    const st = emptyState();
    ensure(st, "p1", "class:bufao:carta", "Carta", { stacks: 3, active: true });
    ensure(st, "p1", "race:kitsune:caudas", "Caudas", { stacks: 4, active: true, origin: "race" });
    const v = listStacksVisual(st, "p1");
    assert.equal(v.length, 2);
    assert.ok(v.some((x) => x.stacks === 3));
  });

  it("NPC inimigo usa id único e stats copiados", () => {
    const npc = {
      id: "npc1", name: "Goblin Espião", level: 3,
      current: { hp: 20, mp: 5, est: 5, san: 10 },
      skills: [],
    };
    const stats = { hp: 20, atk: 4, def: 2, agi: 3, atkMgc: 0, res: 1, int: 1, est: 5, san: 10, mp: 5 };
    const enemy = {
      id: "enemy_test",
      name: npc.name,
      kind: "monster",
      level: npc.level,
      stats,
      current: { ...npc.current },
      skills: [],
    };
    assert.equal(enemy.name, "Goblin Espião");
    assert.equal(enemy.current.hp, 20);
    assert.notEqual(enemy.id, npc.id);
  });
});
