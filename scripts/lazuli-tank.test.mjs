/**
 * Testes comportamentais importando o código real de src/lib/passives/lazuli.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { registerLazuliHit, computeTankShare } from "../src/lib/passives/lazuli.ts";

describe("Lazuli (módulo real) — marcas 1–4", () => {
  it("1ª marca", () => {
    const r = registerLazuliHit({
      existing: null,
      sourceId: "d1",
      targetId: "t1",
      finalDamage: 10,
      furyAlreadyActive: false,
    });
    assert.equal(r.deathDamage, 0);
    assert.equal(r.mark?.stacks, 1);
    assert.deepEqual(r.mark?.damageValues, [10]);
    assert.equal(r.totalDamage, 10);
    assert.equal(r.triggerFury, false);
  });

  it("acumula 4 marcas sem morte", () => {
    let mark = null;
    for (const dmg of [10, 12, 8, 15]) {
      const r = registerLazuliHit({
        existing: mark,
        sourceId: "d1",
        targetId: "t1",
        finalDamage: dmg,
        furyAlreadyActive: false,
      });
      assert.equal(r.deathDamage, 0);
      mark = r.mark;
    }
    assert.equal(mark.stacks, 4);
    assert.deepEqual(mark.damageValues, [10, 12, 8, 15]);
  });
});

describe("Lazuli (módulo real) — 5ª marca", () => {
  it("soma dos 5 danos; extra não vira marca; marca consumida", () => {
    let mark = null;
    let last;
    for (const dmg of [10, 20, 15, 5, 30]) {
      last = registerLazuliHit({
        existing: mark,
        sourceId: "d1",
        targetId: "t1",
        finalDamage: dmg,
        furyAlreadyActive: false,
      });
      mark = last.mark;
    }
    assert.equal(last.deathDamage, 80);
    assert.equal(last.totalDamage, 110);
    assert.equal(last.mark, null);
    assert.equal(last.triggerFury, true);
  });

  it("Fúria não re-dispara se já ativa", () => {
    let mark = null;
    let last;
    for (const dmg of [2, 2, 2, 2, 2]) {
      last = registerLazuliHit({
        existing: mark,
        sourceId: "d1",
        targetId: "t1",
        finalDamage: dmg,
        furyAlreadyActive: true,
      });
      mark = last.mark;
    }
    assert.equal(last.triggerFury, false);
    assert.equal(last.deathDamage, 10);
  });

  it("re-ciclo após consumo", () => {
    let mark = null;
    for (const dmg of [1, 1, 1, 1, 1]) {
      const r = registerLazuliHit({
        existing: mark,
        sourceId: "d1",
        targetId: "t1",
        finalDamage: dmg,
        furyAlreadyActive: false,
      });
      mark = r.mark;
    }
    assert.equal(mark, null);
    const again = registerLazuliHit({
      existing: null,
      sourceId: "d1",
      targetId: "t1",
      finalDamage: 7,
      furyAlreadyActive: true,
    });
    assert.equal(again.mark?.stacks, 1);
    assert.deepEqual(again.mark?.damageValues, [7]);
  });

  it("pares source/target isolados", () => {
    const a = registerLazuliHit({
      existing: null,
      sourceId: "d1",
      targetId: "t1",
      finalDamage: 10,
      furyAlreadyActive: false,
    });
    const b = registerLazuliHit({
      existing: null,
      sourceId: "d1",
      targetId: "t2",
      finalDamage: 20,
      furyAlreadyActive: false,
    });
    assert.equal(a.mark?.targetId, "t1");
    assert.equal(b.mark?.targetId, "t2");
  });

  it("dano 0 não cria marca", () => {
    const r = registerLazuliHit({
      existing: null,
      sourceId: "d1",
      targetId: "t1",
      finalDamage: 0,
      furyAlreadyActive: false,
    });
    assert.equal(r.deathDamage, 0);
    assert.equal(r.totalDamage, 0);
  });
});

describe("Muralha (módulo real)", () => {
  const tanks = [{ id: "tank1", hp: 50, x: 2, y: 2 }];
  const defPos = { x: 3, y: 2 };

  it("50% e soma = original", () => {
    const r = computeTankShare({
      damage: 17,
      defenderId: "ally",
      tanks,
      defenderPos: defPos,
    });
    assert.equal(r.tankShare, 8);
    assert.equal(r.damageToDef, 9);
    assert.equal(r.tankShare + r.damageToDef, 17);
  });

  it("tank morto", () => {
    const r = computeTankShare({
      damage: 20,
      defenderId: "ally",
      tanks: [{ id: "tank1", hp: 0, x: 2, y: 2 }],
      defenderPos: defPos,
    });
    assert.equal(r.tankShare, 0);
    assert.equal(r.tankId, null);
  });

  it("não protege a si mesmo", () => {
    const r = computeTankShare({
      damage: 20,
      defenderId: "tank1",
      tanks,
      defenderPos: { x: 2, y: 2 },
    });
    assert.equal(r.tankShare, 0);
  });

  it("fora de alcance", () => {
    const r = computeTankShare({
      damage: 20,
      defenderId: "ally",
      tanks: [{ id: "tank1", hp: 50, x: 0, y: 0 }],
      defenderPos: { x: 10, y: 10 },
    });
    assert.equal(r.tankShare, 0);
  });
});

describe("Integração simulada — ordem Lazuli → Muralha", () => {
  it("5ª marca: total = base+death; Muralha divide o total uma vez", () => {
    let mark = null;
    let last;
    for (const dmg of [10, 10, 10, 10, 10]) {
      last = registerLazuliHit({
        existing: mark,
        sourceId: "dragon",
        targetId: "ally",
        finalDamage: dmg,
        furyAlreadyActive: false,
      });
      mark = last.mark;
    }
    const total = last.totalDamage;
    assert.equal(total, 60);
    const share = computeTankShare({
      damage: total,
      defenderId: "ally",
      tanks: [{ id: "tank1", hp: 100, x: 2, y: 2 }],
      defenderPos: { x: 3, y: 2 },
    });
    assert.equal(share.tankShare + share.damageToDef, 60);
    assert.equal(share.tankShare, 30);
    assert.equal(share.damageToDef, 30);
  });
});
