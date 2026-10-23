/**
 * Hilak — NPC do mestre (estilo player).
 * Kit exclusivo: só aplica se o nome do personagem casar com "Hilak".
 */
import type { CharacterKit, KitResolveContext } from "./types";

function rollNdS(rollDie: (n: number) => number, n: number, sides: number): number {
  let t = 0;
  for (let i = 0; i < n; i++) t += rollDie(sides);
  return t;
}

export const hilakKit: CharacterKit = {
  matchName: "hilak",
  displayName: "Hilak",
  personalPassive: {
    id: "hilak-immunity-all",
    name: "Imunity all",
    description:
      "Ao entrar em batalha, os aliados se tornam imunes a debuffs por 3 turnos. No fim dos 3 turnos, todos os aliados ganham +2 RES por 2 turnos.",
  },
  skills: [
    {
      id: "hilak-quebra-chamas",
      name: "Quebra das Chamas",
      type: "debuff",
      affinity: "fogo",
      cost: { hp: 0, mp: 8, est: 1 },
      target: "area",
      range: 12,
      duration: 4,
      cooldown: 2,
      description: "Causa /queimadura [2d6] duração=3",
    },
    {
      id: "hilak-cura-infernal",
      name: "Cura infernal",
      type: "heal",
      affinity: "fogo",
      cost: { hp: 0, mp: 12, est: 1 },
      target: "area",
      range: 12,
      duration: 4,
      cooldown: 4,
      description: "Círculo de fogo: regeneração de 50% do HP máximo aos aliados",
    },
    {
      id: "hilak-chamas-criticas",
      name: "Chamas Críticas",
      type: "ataque-magico",
      affinity: "fogo",
      cost: { hp: 2, mp: 15, est: 3 },
      target: "area",
      range: 6,
      duration: 3,
      cooldown: 5,
      description: "Dano de combustão a todos os inimigos próximos",
    },
    {
      id: "hilak-armagedon",
      name: "Chamas do Armagedon",
      type: "ataque-magico",
      affinity: "fogo",
      brasaoLevel: 6,
      cost: { hp: 0, mp: 0, est: 2 },
      target: "area",
      range: 12,
      duration: 2,
      cooldown: 0,
      description:
        "Combustão + queimadura; inimigos entram em explosão e infect por 2 turnos (brasão Nv.6)",
    },
  ],

  onCombatStart({ self, allyIds, passiveState, applyStatus, log }) {
    const targets = allyIds.includes(self.id) ? allyIds : [...allyIds, self.id];
    for (const id of targets) {
      applyStatus("clean", id, { duration: 3, stacks: 1, sourceId: self.id });
    }
    const existing = passiveState.entries.find(
      (e) => e.characterId === self.id && e.id === "char:hilak:immunity-all",
    );
    if (!existing) {
      passiveState.entries.push({
        id: "char:hilak:immunity-all",
        characterId: self.id,
        origin: "character",
        name: "Imunity all",
        stacks: 1,
        maxStacks: 1,
        turnsRemaining: 3,
        active: true,
        meta: { phase: "immunity", ownerId: self.id },
      });
    } else {
      existing.active = true;
      existing.turnsRemaining = 3;
      existing.meta = { ...existing.meta, phase: "immunity", ownerId: self.id };
    }
    log(`${self.name}: Imunity all — aliados imunes a debuffs por 3 turnos`);
  },

  onPassiveTurn({ self, allyIds, passiveState, log }) {
    const e = passiveState.entries.find(
      (x) => x.characterId === self.id && x.id === "char:hilak:immunity-all",
    );
    if (!e || !e.active) return;
    if (e.meta?.phase === "immunity" && (e.turnsRemaining ?? 0) <= 0) {
      e.meta = { ...e.meta, phase: "res-buff" };
      e.turnsRemaining = 2;
      e.name = "Imunity all · +2 RES";
      for (const id of allyIds.includes(self.id) ? allyIds : [...allyIds, self.id]) {
        const buffId = `char:hilak:res-buff:${id}`;
        const buff = passiveState.entries.find((x) => x.id === buffId);
        if (!buff) {
          passiveState.entries.push({
            id: buffId,
            characterId: id,
            origin: "character",
            name: "Bênção de Hilak (+2 RES)",
            stacks: 1,
            maxStacks: 1,
            turnsRemaining: 2,
            active: true,
            meta: { res: 2, from: self.id },
          });
        } else {
          buff.active = true;
          buff.turnsRemaining = 2;
          buff.meta = { res: 2, from: self.id };
        }
      }
      log(`${self.name}: Imunity all — aliados ganham +2 RES por 2 turnos`);
    }
  },

  resolveSkill(skillId, ctx: KitResolveContext) {
    const { attacker, enemyIds, allyIds, applyStatus, damageEnemy, healAlly, log, rollDie } = ctx;

    if (skillId === "hilak-quebra-chamas") {
      const power = rollNdS(rollDie, 2, 6);
      for (const eid of enemyIds) {
        applyStatus("burn", eid, {
          duration: 3,
          stacks: 1,
          power,
          sourceId: attacker.id,
        });
      }
      log(`${attacker.name}: Quebra das Chamas — queimadura [2d6]=${power} · 3 turnos em área`);
      return;
    }

    if (skillId === "hilak-cura-infernal") {
      for (const aid of allyIds) {
        applyStatus("regeneration", aid, {
          duration: 4,
          stacks: 1,
          power: 50,
          sourceId: attacker.id,
        });
        healAlly(aid, -1);
      }
      log(`${attacker.name}: Cura infernal — regeneração 50% nos aliados (4 turnos)`);
      return;
    }

    if (skillId === "hilak-chamas-criticas") {
      const dmg = rollNdS(rollDie, 3, 8);
      for (const eid of enemyIds) {
        damageEnemy(eid, Math.max(1, dmg));
        applyStatus("combustion", eid, { duration: 3, stacks: 1, sourceId: attacker.id });
      }
      log(`${attacker.name}: Chamas Críticas — combustão e ${dmg} de dano em área`);
      return;
    }

    if (skillId === "hilak-armagedon") {
      if ((attacker.level ?? 1) < 6) {
        log(`${attacker.name}: Chamas do Armagedon requer brasão Nv.6`);
        return;
      }
      const dmg = rollNdS(rollDie, 4, 8);
      for (const eid of enemyIds) {
        damageEnemy(eid, Math.max(1, dmg));
        applyStatus("combustion", eid, { duration: 2, stacks: 1, sourceId: attacker.id });
        applyStatus("burn", eid, { duration: 2, stacks: 1, sourceId: attacker.id });
        applyStatus("explosion", eid, { duration: 2, stacks: 1, sourceId: attacker.id });
        applyStatus("infect", eid, { duration: 2, stacks: 1, sourceId: attacker.id });
      }
      log(
        `${attacker.name}: Chamas do Armagedon — combustão, queimadura, explosão e infect (2 turnos)`,
      );
      return;
    }
  },
};
