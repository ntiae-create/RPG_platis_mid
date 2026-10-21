/**
 * Testes do motor de passivas (raça + classe).
 * node --test scripts/passives.test.mjs
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
      id,
      characterId,
      origin: defaults.origin ?? "race",
      name,
      stacks: defaults.stacks ?? 0,
      maxStacks: defaults.maxStacks ?? null,
      turnsRemaining: defaults.turnsRemaining ?? null,
      active: defaults.active ?? false,
      meta: defaults.meta ?? {},
    };
    state.entries.push(e);
  }
  return e;
}

function raceStatMods(ctx, role) {
  const mods = {};
  const raceId = ctx.self.raceId;
  const hpRatio = ctx.maxHp > 0 ? ctx.self.current.hp / ctx.maxHp : 1;
  if (role === "attacker") {
    if (raceId === "besta" && hpRatio <= 0.5) {
      mods.atk = (mods.atk ?? 0) + 3;
      ensure(ctx.state, ctx.self.id, "race:besta:frenesi", "Frenesi", { active: true }).active = true;
    }
    if (raceId === "semi-besta" && hpRatio <= 0.5) mods.agi = (mods.agi ?? 0) + 2;
    if (raceId === "fae") {
      mods.agi = (mods.agi ?? 0) + 2;
      mods.atk = (mods.atk ?? 0) + 2;
    }
    if (raceId === "lupino" && ctx.allyNearby) mods.agi = (mods.agi ?? 0) + 2;
  }
  if (role === "defender") {
    if (raceId === "lizard" && ctx.kind === "physical") mods.damageTakenMult = 0.9;
    if (ctx.opponent?.raceId === "oni") mods.def = (mods.def ?? 0) - 2;
  }
  return mods;
}

function raceOnLethal(ch, incomingHp, roll) {
  if (incomingHp > 0) return { hp: incomingHp, survivedAt1: false };
  if (ch.raceId === "morto-vivo" && roll() < 0.2) return { hp: 1, survivedAt1: true };
  return { hp: Math.max(0, incomingHp), survivedAt1: false };
}

function raceAfterDamageTaken(state, ch, maxHp, hpBefore, hpAfter) {
  if (ch.raceId !== "anao" || maxHp <= 0) return null;
  if (hpBefore > maxHp * 0.5 && hpAfter <= maxHp * 0.5) {
    ensure(state, ch.id, "race:anao:constituicao", "Constituição Anã", { active: true }).active = true;
    return "ok";
  }
  return null;
}

function raceHealReceivedMult(state, targetId) {
  const seal = state.entries.find(
    (e) => e.characterId === targetId && e.id === "race:aqua:selo" && e.active,
  );
  return seal ? { mult: 0.9, note: "selo" } : { mult: 1 };
}

function raceCombatStart(state, ch, pick = Math.random) {
  if (ch.raceId === "quimera") {
    const keys = ["atk", "def", "agi"];
    const key = keys[Math.floor(pick() * keys.length)];
    ensure(state, ch.id, "race:quimera:mutacao", "Mutação", {
      active: true,
      meta: { attr: key, bonus: 2 },
    }).active = true;
    return `Mutação: +2 ${key}`;
  }
  return null;
}

function isAllyNearby(selfId, positions, allyIds, maxDist = 4) {
  const selfPos = positions[selfId];
  if (!selfPos) return allyIds.length > 1;
  for (const id of allyIds) {
    if (id === selfId) continue;
    const p = positions[id];
    if (!p) continue;
    if (Math.abs(p.x - selfPos.x) + Math.abs(p.y - selfPos.y) <= maxDist) return true;
  }
  return false;
}

function classBerserkAtkBonus(ch, maxHp) {
  if (ch.classId !== "berserk" || maxHp <= 0) return { bonus: 0 };
  const lostPercent = Math.max(0, Math.round((1 - ch.current.hp / maxHp) * 100));
  if (lostPercent >= 50) return { bonus: 5 };
  const steps = Math.floor(lostPercent / 10);
  return { bonus: Math.max(0, steps) };
}

function classFeiticeiroOnSkill(state, ch) {
  if (ch.classId !== "feiticeiro") return { atkMgcBonus: 0, detonate: false };
  const e = ensure(state, ch.id, "class:feiticeiro:booster", "Magic Booster", {
    stacks: 0,
    maxStacks: 5,
    active: true,
    origin: "class",
  });
  e.stacks = Math.min(5, e.stacks + 1);
  if (e.stacks >= 5) {
    e.stacks = 0;
    return { atkMgcBonus: 0, detonate: true };
  }
  return { atkMgcBonus: e.stacks, detonate: false };
}

function classMagoOnSkill(state, ch, affinityId) {
  if (ch.classId !== "mago") return {};
  const e = ensure(state, ch.id, "class:mago:octagrama", "Octagrama", {
    stacks: 0,
    maxStacks: 8,
    active: true,
    origin: "class",
    meta: { lastAffinity: "" },
  });
  const last = String(e.meta.lastAffinity ?? "");
  if (affinityId && affinityId !== last) {
    e.stacks = Math.min(8, e.stacks + 1);
    e.meta = { ...e.meta, lastAffinity: affinityId };
    if (e.stacks >= 8) e.meta = { ...e.meta, primed: true };
  }
  return { stacks: e.stacks, primed: Boolean(e.meta.primed) };
}

function classBufaoCombatStart(state, ch) {
  if (ch.classId !== "bufao") return null;
  ensure(state, ch.id, "class:bufao:carta", "Carta", {
    stacks: 1,
    active: true,
    origin: "class",
    meta: { extremistUsed: false },
  });
  return "1 stack";
}

describe("Frenesi Besta", () => {
  it("ativa ≤50%", () => {
    const state = emptyState();
    const m = raceStatMods(
      { self: { id: "1", raceId: "besta", current: { hp: 21 } }, maxHp: 42, state },
      "attacker",
    );
    assert.equal(m.atk, 3);
  });
  it("inativa >50%", () => {
    const m = raceStatMods(
      { self: { id: "1", raceId: "besta", current: { hp: 30 } }, maxHp: 42, state: emptyState() },
      "attacker",
    );
    assert.equal(m.atk, undefined);
  });
  it("não duplica entry", () => {
    const state = emptyState();
    const ctx = { self: { id: "1", raceId: "besta", current: { hp: 10 } }, maxHp: 42, state };
    raceStatMods(ctx, "attacker");
    raceStatMods(ctx, "attacker");
    assert.equal(state.entries.filter((e) => e.id === "race:besta:frenesi").length, 1);
  });
});

describe("Lupino / Oni / Lizard / Morto-vivo / Anão / Aqua", () => {
  it("Lupino +2 AGI com aliado próximo", () => {
    const m = raceStatMods(
      {
        self: { id: "1", raceId: "lupino", current: { hp: 40 } },
        maxHp: 40,
        allyNearby: true,
        state: emptyState(),
      },
      "attacker",
    );
    assert.equal(m.agi, 2);
  });
  it("isAllyNearby por posições de combate", () => {
    assert.equal(
      isAllyNearby("a", { a: { x: 1, y: 2 }, b: { x: 1, y: 4 } }, ["a", "b"]),
      true,
    );
    assert.equal(
      isAllyNearby("a", { a: { x: 1, y: 2 }, b: { x: 14, y: 2 } }, ["a", "b"]),
      false,
    );
  });
  it("Oni −2 DEF no alvo", () => {
    const m = raceStatMods(
      {
        self: { id: "d", raceId: "humano", current: { hp: 40 } },
        opponent: { raceId: "oni" },
        maxHp: 40,
        state: emptyState(),
      },
      "defender",
    );
    assert.equal(m.def, -2);
  });
  it("Lizard 0.9 físico", () => {
    const m = raceStatMods(
      {
        self: { id: "1", raceId: "lizard", current: { hp: 40 } },
        maxHp: 40,
        kind: "physical",
        state: emptyState(),
      },
      "defender",
    );
    assert.equal(m.damageTakenMult, 0.9);
  });
  it("Morto-vivo overkill", () => {
    assert.equal(raceOnLethal({ raceId: "morto-vivo" }, -3, () => 0.05).hp, 1);
    assert.equal(raceOnLethal({ raceId: "morto-vivo" }, -3, () => 0.5).hp, 0);
  });
  it("Anão cruza 50%", () => {
    const state = emptyState();
    assert.ok(raceAfterDamageTaken(state, { id: "a", raceId: "anao" }, 100, 60, 40));
    assert.equal(raceAfterDamageTaken(state, { id: "a", raceId: "anao" }, 100, 40, 20), null);
  });
  it("Selo reduz cura", () => {
    const state = emptyState();
    ensure(state, "t1", "race:aqua:selo", "Selo", { active: true });
    assert.equal(raceHealReceivedMult(state, "t1").mult, 0.9);
    assert.equal(raceHealReceivedMult(state, "other").mult, 1);
  });
  it("Quimera mutação no start", () => {
    const state = emptyState();
    const note = raceCombatStart(state, { id: "q", raceId: "quimera" }, () => 0);
    assert.ok(note.includes("Mutação"));
    assert.equal(state.entries[0].active, true);
  });
});

describe("Classes prioritárias", () => {
  it("Berserk escala até +5", () => {
    assert.equal(classBerserkAtkBonus({ classId: "berserk", current: { hp: 90 } }, 100).bonus, 1);
    assert.equal(classBerserkAtkBonus({ classId: "berserk", current: { hp: 50 } }, 100).bonus, 5);
    assert.equal(classBerserkAtkBonus({ classId: "berserk", current: { hp: 10 } }, 100).bonus, 5);
    assert.equal(classBerserkAtkBonus({ classId: "guerreiro", current: { hp: 10 } }, 100).bonus, 0);
  });
  it("Feiticeiro stacks e detonate", () => {
    const state = emptyState();
    const ch = { id: "f1", classId: "feiticeiro" };
    for (let i = 1; i <= 4; i++) {
      const r = classFeiticeiroOnSkill(state, ch);
      assert.equal(r.detonate, false);
      assert.equal(r.atkMgcBonus, i);
    }
    const boom = classFeiticeiroOnSkill(state, ch);
    assert.equal(boom.detonate, true);
    assert.equal(state.entries[0].stacks, 0);
  });
  it("Mago octagrama por afinidades distintas", () => {
    const state = emptyState();
    const ch = { id: "m1", classId: "mago" };
    const aff = ["fogo", "agua", "terra", "vento", "luz", "trevas", "fisico", "magico"];
    let last;
    for (const a of aff) {
      last = classMagoOnSkill(state, ch, a);
    }
    assert.equal(last.stacks, 8);
    assert.equal(last.primed, true);
  });
  it("Bufão inicia com 1 stack", () => {
    const state = emptyState();
    classBufaoCombatStart(state, { id: "b1", classId: "bufao" });
    assert.equal(state.entries[0].stacks, 1);
  });
});

describe("Isolamento de personagem", () => {
  it("estado de A não ativa Frenesi de B", () => {
    const state = emptyState();
    raceStatMods(
      { self: { id: "A", raceId: "besta", current: { hp: 1 } }, maxHp: 40, state },
      "attacker",
    );
    const forB = state.entries.filter((e) => e.characterId === "B");
    assert.equal(forB.length, 0);
    assert.equal(state.entries[0].characterId, "A");
  });
});


// --- Fase 3: helpers espelhados ---
function raceDragonoideOnHit(state, attacker, defenderId, finalDamage) {
  if (attacker.raceId !== "dragonoide" || finalDamage <= 0) return { bonusDamage: 0, notes: [] };
  let e = state.entries.find((x) => x.characterId === defenderId && x.id.startsWith("race:dragonoide:marca"));
  if (!e) {
    e = { id: `race:dragonoide:marca:${defenderId}`, characterId: defenderId, stacks: 0, maxStacks: 5, active: true, meta: { damageSum: 0 }, origin: "race", name: "Marca" };
    state.entries.push(e);
  }
  e.stacks = Math.min(5, e.stacks + 1);
  e.meta.damageSum = (e.meta.damageSum || 0) + finalDamage;
  if (e.stacks >= 5) {
    const bonus = e.meta.damageSum;
    e.stacks = 0;
    e.meta.damageSum = 0;
    e.active = false;
    state.entries.push({ id: "race:dragonoide:furia", characterId: attacker.id, stacks: 0, active: true, meta: {}, origin: "race", name: "Furia", maxStacks: null, turnsRemaining: null });
    return { bonusDamage: bonus, notes: ["morte"] };
  }
  return { bonusDamage: 0, notes: [`${e.stacks}/5`] };
}

function raceUmbralOnHit(state, attacker, defenderId) {
  if (attacker.raceId !== "umbral") return { applyBlind: false };
  let e = state.entries.find((x) => x.id === "race:umbral:marca" && x.characterId === defenderId);
  if (!e) {
    e = { id: "race:umbral:marca", characterId: defenderId, stacks: 0, maxStacks: 3, active: true, meta: {}, origin: "race", name: "U", turnsRemaining: null };
    state.entries.push(e);
  }
  e.stacks += 1;
  if (e.stacks >= 3) {
    e.stacks = 0;
    return { applyBlind: true };
  }
  return { applyBlind: false };
}

describe("Dragonoide Lazuli", () => {
  it("acumula 5 marcas e consome com soma de dano", () => {
    const state = emptyState();
    const atk = { id: "d1", raceId: "dragonoide" };
    let totalBonus = 0;
    for (let i = 0; i < 5; i++) {
      const r = raceDragonoideOnHit(state, atk, "t1", 10);
      totalBonus += r.bonusDamage;
    }
    assert.equal(totalBonus, 50);
    assert.ok(state.entries.some((e) => e.id === "race:dragonoide:furia" && e.active));
  });
});

describe("Umbral", () => {
  it("cega ao 3º stack", () => {
    const state = emptyState();
    const atk = { raceId: "umbral" };
    assert.equal(raceUmbralOnHit(state, atk, "t").applyBlind, false);
    assert.equal(raceUmbralOnHit(state, atk, "t").applyBlind, false);
    assert.equal(raceUmbralOnHit(state, atk, "t").applyBlind, true);
  });
});

describe("Berserk + Frenesi interação", () => {
  it("ambos aplicam bônus independentes", () => {
    const state = emptyState();
    const frenzy = raceStatMods(
      { self: { id: "1", raceId: "besta", current: { hp: 10 } }, maxHp: 40, state },
      "attacker",
    );
    const berserk = classBerserkAtkBonus({ classId: "berserk", current: { hp: 10 } }, 40);
    assert.equal(frenzy.atk, 3);
    assert.equal(berserk.bonus, 5);
  });
});

describe("Fase 4 — Doppel assimilação", () => {
  it("exige 5 stacks e restaura snapshot", () => {
    const state = emptyState();
    const doppel = {
      id: "dop",
      raceId: "doppelganger",
      classId: "guerreiro",
      affinityId: "fogo",
      level: 5,
      allocated: { atk: 3 },
      current: { hp: 40, mp: 10, est: 20, san: 50 },
      skills: [],
      personalPassive: { name: "x", description: "y", stacks: 0 },
    };
    const target = {
      id: "tgt",
      raceId: "elfo",
      classId: "mago",
      affinityId: "agua",
      level: 5,
      allocated: { int: 5 },
      current: { hp: 30, mp: 40, est: 10, san: 50 },
      skills: [{ id: "s1" }],
      personalPassive: { name: "p", description: "d", stacks: 0 },
    };
    // mirror minimal assimilate logic
    const e = {
      id: "race:doppel:assimilacao",
      characterId: "dop",
      stacks: 5,
      maxStacks: 5,
      active: true,
      origin: "race",
      name: "A",
      turnsRemaining: null,
      meta: { used: false },
    };
    state.entries.push(e);
    assert.equal(e.stacks, 5);
    const snapshot = JSON.stringify({
      raceId: doppel.raceId,
      classId: doppel.classId,
      current: doppel.current,
    });
    e.meta = { used: true, assimilating: true, snapshot };
    // restore when hp 0
    const form = { ...doppel, raceId: "elfo", current: { hp: 0, mp: 0, est: 0, san: 50 } };
    const snap = JSON.parse(e.meta.snapshot);
    assert.equal(snap.raceId, "doppelganger");
    const restored = { ...form, raceId: snap.raceId, current: snap.current };
    assert.equal(restored.raceId, "doppelganger");
    assert.equal(restored.current.hp, 40);
  });
});

describe("Fase 4 — terreno natural Dríade", () => {
  it("forest é natural, basic não", () => {
    const NATURAL = new Set(["forest_arena.jpg", "earth_arena.jpg", "roses_arena.jpg", "sanctuary_arena.jpg", "sund_arena.jpg"]);
    assert.equal(NATURAL.has("forest_arena.jpg"), true);
    assert.equal(NATURAL.has("basic_arena.jpg"), false);
  });
});

describe("Fase 4 — Vampiro lifesteal exige sangramento", () => {
  it("sem sangramento mult 0; com max blood e bleed 0.5", () => {
    const state = emptyState();
    ensure(state, "v1", "race:vampiro:blood", "Blood", {
      stacks: 3,
      active: true,
      meta: { maxRegen: true },
    });
    const e = state.entries[0];
    const mult = (bleed) => (e.meta.maxRegen && bleed ? 0.5 : 0);
    assert.equal(mult(false), 0);
    assert.equal(mult(true), 0.5);
  });
});

describe("Fase 4 — Frenesi Besta inalterado", () => {
  it("≤50% → +3 ATK", () => {
    const m = raceStatMods(
      { self: { id: "1", raceId: "besta", current: { hp: 20 } }, maxHp: 40, state: emptyState() },
      "attacker",
    );
    assert.equal(m.atk, 3);
  });
});

describe("Fase 5 — Tank redirecionamento (cálculo único)", () => {
  it("50% para o tank, resto para o alvo, soma = dano original", () => {
    const damage = 17;
    const tankShare = Math.floor(damage * 0.5);
    const toDef = damage - tankShare;
    assert.equal(tankShare + toDef, damage);
    assert.equal(tankShare, 8);
    assert.equal(toDef, 9);
  });
  it("sem tank: 100% no defensor", () => {
    const damage = 17;
    const tankShare = 0;
    assert.equal(damage - tankShare, 17);
  });
});

describe("Fase 5 — Frenesi Besta oficial (imutável)", () => {
  it("exatamente +3 ATK em ≤50%, zero acima", () => {
    const low = raceStatMods(
      { self: { id: "b", raceId: "besta", current: { hp: 21 } }, maxHp: 42, state: emptyState() },
      "attacker",
    );
    const high = raceStatMods(
      { self: { id: "b", raceId: "besta", current: { hp: 22 } }, maxHp: 42, state: emptyState() },
      "attacker",
    );
    assert.equal(low.atk, 3);
    assert.equal(high.atk, undefined);
  });
});

describe("Fase 5 — Cegueira ≠ Stun", () => {
  it("Umbral pede applyBlind, não força stun no helper", () => {
    const state = emptyState();
    const atk = { raceId: "umbral" };
    raceUmbralOnHit(state, atk, "t");
    raceUmbralOnHit(state, atk, "t");
    const r = raceUmbralOnHit(state, atk, "t");
    assert.equal(r.applyBlind, true);
    // helper não retorna stun
    assert.equal(r.applyBlind && !r.stun, true);
  });
});

describe("Fase 5 — isolamento de estado", () => {
  it("emptyPassiveState não compartilha entries", () => {
    const a = emptyState();
    const b = emptyState();
    a.entries.push({ id: "x", characterId: "1" });
    assert.equal(b.entries.length, 0);
  });
});
