export type {
  PassiveCombatState,
  PassiveRuntimeEntry,
  PassiveVisual,
  PassiveContext,
  StatMods,
  PassiveOrigin,
  PassiveTrigger,
} from "./types";

export {
  emptyPassiveState,
  raceStatMods,
  applyStatMods,
  raceStunChance,
  raceAvoidAttack,
  raceDamageDealtMult,
  raceOnLethal,
  raceAfterDamageTaken,
  raceOnHitSeal,
  raceCombatStart,
  tickPassiveDurations,
  raceHealReceivedMult,
  raceTurnStartHeal,
  raceAdaptStatusDuration,
  raceOnNegativeStatus,
  isAllyNearby,
  raceOrcCombatStart,
  raceOrcPenaltyMods,
  raceDragonoideOnHit,
  raceDragonFuryMods,
  raceUmbralOnHit,
  raceVampireOnSkill,
  raceVampireLifestealMult,
  raceKitsuneOnAttack,
  raceKitsuneOnAttackTurn,
  raceKitsuneTryAvoidHit,
  raceDoppelOnTurn,
  raceHomunculusOnLethal,
  raceDoppelAssimilate,
  raceDoppelTryRestore,
  raceDoppelCanAssimilate,
  isNaturalTerrain,
  NATURAL_ARENA_IDS,
  raceFaeOnNegativeStatus,
  raceUmbralCheckForm,
  raceIsUntargetable,
  raceUmbralOnArenaEnter,
  isDarkTerrain,
  DARK_ARENA_IDS,
  raceKitsuneOnDamageTaken,
  raceKitsuneCheckDesperation,
  raceDoppelCheckDesperation,
  raceDesperationStatMult,
  raceDoppelRoninDamageMult,
  raceDoppelMirrorAbsorb,
  raceDoppelMirrorTurnReset,
  raceKitsuneJokerExtraStack,
  raceHomunculusTryReactivate,
} from "./race-rules";

export {
  classBerserkAtkBonus,
  classAssassinDamageMult,
  classFeiticeiroOnSkill,
  classFeiticeiroAtkMgcFromState,
  classMagoOnSkill,
  classMagoConsumePrime,
  classBufaoCombatStart,
  classBufaoOnTurn,
  classBufaoAgiBonus,
  classBufaoConsumeExtremist,
  classAttackerStatMods,
  classArqueiroOnHit,
  classArqueiroOnMiss,
  classAlquimistaOnHit,
  classCacadorOnHit,
  classPugilistaOnBasicHit,
  classPugilistaReset,
  classGuerreiroStanceMods,
  classGuerreiroSetStance,
  classTankAllyDefBonus,
  classMongeOnHit,
  classDuelistaOnHit,
  classGladiadorSetAdversary,
  classGladiadorOnHit,
  classGladiadorStatMods,
  classLanceiroStatMods,
  classDruidaStatMods,
  classCryomanteOnHit,
  classAnatomistaOnHit,
  classCeifadorOnKill,
  classClerigoOnSupport,
  classCavaleiroArmInvestida,
  classCavaleiroConsumeInvestida,
  classNecromanteOnKill,
  classBardoOnSupport,
  classInvocadorOnSummon,
  classOraculoCombatStart,
  classOraculoOnPredict,
  classArtificeProjectMods,
  classArtificeSetProject,
  classBufferHealerOnSupport,
  classPaladinoCombatStart,
  classPaladinoShareDamage,
  classBruxoOnSkill,
  classRoninOnTurnStart,
  classRoninConsume,
  classEspadachimOnTurn,
  classEspadachimDamageMult,
  classXamaOnHit,
  classRunomanteOnSkill,
  classDancarinoOnHit,
  classBatedorDamageMult,
  classCavaleiroCelesteCombatStart,
  classCavaleiroCelesteStatMods,
  classCavaleiroCelesteDamageTakenMult,
  classElementalistaOnSkill,
  classDomadorShareDamage,
  classDomadorSetBond,
  classDomadorStatMods,
  classCronomanteTryRewind,
  classAlquimistaSombrioOnSkill,
  classMarioneteShareToLinked,
  classMarioneteSetLink,
  classArmadilheiroTrigger,
  classIlusionistaOnHit,
  classBufaoExtremistBonusDamage,
} from "./class-rules";

export {
  registerLazuliHit,
  computeTankShare,
  type LazuliMarkState,
  type LazuliResult,
} from "./lazuli";

import type { Character } from "@/data/types";
import type { PassiveCombatState, PassiveVisual } from "./types";
import { RACE_BY_ID } from "@/data/races";
import { CLASS_BY_ID } from "@/data/classes";
import { classBerserkAtkBonus, classFeiticeiroAtkMgcFromState, classBufaoAgiBonus } from "./class-rules";

export function listPassiveVisuals(
  ch: Character,
  maxHp: number,
  state: PassiveCombatState,
): PassiveVisual[] {
  const visuals: PassiveVisual[] = [];
  const race = RACE_BY_ID[ch.raceId];
  const cls = CLASS_BY_ID[ch.classId];
  const hpRatio = maxHp > 0 ? ch.current.hp / maxHp : 1;

  if (race) {
    if (race.id === "besta") {
      const active = hpRatio <= 0.5;
      visuals.push({
        id: "race:besta:frenesi",
        name: "Frenesi",
        origin: "race",
        active,
        detail: active ? "ATIVA · ATK +3 (≤50% HP)" : "Inativa · ativa com ≤50% HP",
      });
    } else if (race.id === "semi-besta") {
      const active = hpRatio <= 0.5;
      visuals.push({
        id: "race:semi-besta:frenesi",
        name: "Frenesi Controlado",
        origin: "race",
        active,
        detail: active ? "ATIVA · AGI +2 (≤50% HP)" : "Inativa · ativa com ≤50% HP",
      });
    } else if (race.id === "fae") {
      visuals.push({
        id: "race:fae:frenesi",
        name: "Frenesi Maluco",
        origin: "race",
        active: true,
        detail: "ATIVA · ATK +2 · AGI +2",
      });
    } else if (race.id === "lizard") {
      visuals.push({
        id: "race:lizard:escamas",
        name: "Escamas de Aço",
        origin: "race",
        active: true,
        detail: "ATIVA · −10% dano físico recebido",
      });
    } else if (race.id === "driade") {
      visuals.push({
        id: "race:driade:floresta",
        name: "Floresta da Vida",
        origin: "race",
        active: true,
        detail: "ATIVA em terreno natural · +2% HP máx / turno",
      });
    } else {
      const rt = state.entries.find(
        (e) => e.characterId === ch.id && e.origin === "race" && e.active,
      );
      visuals.push({
        id: `race:${race.id}`,
        name: race.passive.name,
        origin: "race",
        active: Boolean(rt?.active),
        detail: rt?.active
          ? `ATIVA${rt.turnsRemaining != null ? ` · ${rt.turnsRemaining} turnos` : ""}${
              rt.stacks ? ` · stacks ${rt.stacks}` : ""
            }`
          : race.passive.description.slice(0, 96),
        stacks: rt?.stacks || undefined,
        maxStacks: rt?.maxStacks ?? undefined,
        turnsRemaining: rt?.turnsRemaining,
      });
    }
  }

  if (cls) {
    if (cls.id === "berserk") {
      const b = classBerserkAtkBonus(ch, maxHp);
      visuals.push({
        id: "class:berserk:furia",
        name: "Fúria Crescente",
        origin: "class",
        active: b.bonus > 0,
        detail: b.bonus > 0 ? `ATIVA · ATK +${b.bonus}` : "Inativa · ganha ATK conforme HP perdido",
      });
    } else if (cls.id === "feiticeiro") {
      const stacks = classFeiticeiroAtkMgcFromState(state, ch.id, ch.classId);
      visuals.push({
        id: "class:feiticeiro:booster",
        name: "Magic Booster",
        origin: "class",
        active: stacks > 0,
        detail: stacks > 0 ? `ATIVA · +${stacks} ATK MGC` : "Inativa · +1 ATK MGC por skill",
        stacks,
        maxStacks: 5,
      });
    } else if (cls.id === "mago") {
      const e = state.entries.find(
        (x) => x.characterId === ch.id && x.id === "class:mago:octagrama",
      );
      visuals.push({
        id: "class:mago:octagrama",
        name: "Octagrama Arcano",
        origin: "class",
        active: Boolean(e?.active),
        detail: e?.meta.primed
          ? "PRIMED · próximo ataque mágico +50%"
          : `Stacks ${e?.stacks ?? 0}/8`,
        stacks: e?.stacks ?? 0,
        maxStacks: 8,
      });
    } else if (cls.id === "bufao") {
      const e = state.entries.find(
        (x) => x.characterId === ch.id && x.id === "class:bufao:carta",
      );
      const agi = classBufaoAgiBonus(state, ch, 10);
      visuals.push({
        id: "class:bufao:carta",
        name: "Carta do Louco",
        origin: "class",
        active: Boolean(e?.active),
        detail: e
          ? `Stacks ${e.stacks} · AGI +${agi.bonus}${agi.extremist ? " · EXTREMISTA" : ""}`
          : "Entra com 1 stack",
        stacks: e?.stacks ?? 0,
      });
    } else if (cls.id === "assassino") {
      visuals.push({
        id: "class:assassino:ponto",
        name: "Ponto Fraco",
        origin: "class",
        active: false,
        detail: "ATIVA em furtividade/costas · +25% dano",
      });
    } else {
      visuals.push({
        id: `class:${cls.id}`,
        name: cls.passive.name,
        origin: "class",
        active: false,
        detail: "Cadastrada — motor de classe em expansão",
      });
    }
  }

  return visuals;
}
