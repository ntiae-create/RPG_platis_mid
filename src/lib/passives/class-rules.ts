/**
 * Regras mecânicas das passivas de classe oficiais (src/data/classes.ts).
 */
import type { Character, Stats } from "@/data/types";
import type { PassiveCombatState, StatMods } from "./types";

function entry(state: PassiveCombatState, characterId: string, id: string) {
  return state.entries.find((e) => e.characterId === characterId && e.id === id);
}

function ensure(
  state: PassiveCombatState,
  characterId: string,
  id: string,
  name: string,
  defaults?: Partial<{
    stacks: number;
    maxStacks: number | null;
    turnsRemaining: number | null;
    active: boolean;
    meta: Record<string, string | number | boolean>;
  }>,
) {
  let e = entry(state, characterId, id);
  if (!e) {
    e = {
      id,
      characterId,
      origin: "class",
      name,
      stacks: defaults?.stacks ?? 0,
      maxStacks: defaults?.maxStacks ?? null,
      turnsRemaining: defaults?.turnsRemaining ?? null,
      active: defaults?.active ?? false,
      meta: defaults?.meta ?? {},
    };
    state.entries.push(e);
  }
  return e;
}

/**
 * Berserk — Fúria Crescente:
 * A cada 10% de HP perdido, +1 ATK. Em ≤50% HP, Fúria Máxima (+5 ATK total, não sobe abaixo).
 */
export function classBerserkAtkBonus(ch: Character, maxHp: number): {
  bonus: number;
  note?: string;
} {
  if (ch.classId !== "berserk" || maxHp <= 0) return { bonus: 0 };
  const lostPercent = Math.max(0, Math.round((1 - ch.current.hp / maxHp) * 100));
  if (lostPercent >= 50) {
    return { bonus: 5, note: "Fúria Máxima: +5 ATK" };
  }
  const steps = Math.floor(lostPercent / 10);
  if (steps <= 0) return { bonus: 0 };
  return { bonus: steps, note: `Fúria Crescente: +${steps} ATK` };
}

/** Assassino — Ponto Fraco: +25% de costas/furtividade */
export function classAssassinDamageMult(
  ch: Character,
  fromStealth: boolean,
): { mult: number; note?: string } {
  if (ch.classId !== "assassino" || !fromStealth) return { mult: 1 };
  return { mult: 1.25, note: "Ponto Fraco +25%" };
}

/**
 * Feiticeiro — Magic Booster: +1 ATK MGC por skill (stack), ao chegar a 5 → Descontrole.
 */
export function classFeiticeiroOnSkill(
  state: PassiveCombatState,
  ch: Character,
): { atkMgcBonus: number; detonate: boolean; note?: string } {
  if (ch.classId !== "feiticeiro") return { atkMgcBonus: 0, detonate: false };
  const e = ensure(state, ch.id, "class:feiticeiro:booster", "Magic Booster", {
    stacks: 0,
    maxStacks: 5,
    active: true,
  });
  e.stacks = Math.min((e.maxStacks ?? 5), e.stacks + 1);
  e.active = true;
  if (e.stacks >= 5) {
    e.stacks = 0;
    return {
      atkMgcBonus: 0,
      detonate: true,
      note: "Descontrole de Mana: dano = MP restante, stacks resetados",
    };
  }
  return {
    atkMgcBonus: e.stacks,
    detonate: false,
    note: `Magic Booster: +${e.stacks} ATK MGC (${e.stacks}/5)`,
  };
}

export function classFeiticeiroAtkMgcFromState(
  state: PassiveCombatState,
  characterId: string,
  classId: string,
): number {
  if (classId !== "feiticeiro") return 0;
  const e = entry(state, characterId, "class:feiticeiro:booster");
  return e?.active ? e.stacks : 0;
}

export function classMagoOnSkill(
  state: PassiveCombatState,
  ch: Character,
  affinityId: string | undefined,
): { note?: string } {
  if (ch.classId !== "mago") return {};
  const e = ensure(state, ch.id, "class:mago:octagrama", "Octagrama Arcano", {
    stacks: 0,
    maxStacks: 8,
    active: true,
    meta: { lastAffinity: "" },
  });
  const last = String(e.meta.lastAffinity ?? "");
  if (affinityId && affinityId !== last) {
    e.stacks = Math.min(8, e.stacks + 1);
    e.meta = { ...e.meta, lastAffinity: affinityId };
    e.active = true;
    if (e.stacks >= 8) {
      e.meta = { ...e.meta, primed: true };
      return { note: "Octagrama Arcano: 8/8 — próximo ataque +50% mágico" };
    }
    return { note: `Octagrama Arcano: ${e.stacks}/8` };
  }
  if (affinityId) e.meta = { ...e.meta, lastAffinity: affinityId };
  return {};
}

export function classMagoConsumePrime(
  state: PassiveCombatState,
  ch: Character,
  kind: "physical" | "magical",
): { mult: number; note?: string } {
  if (ch.classId !== "mago" || kind !== "magical") return { mult: 1 };
  const e = entry(state, ch.id, "class:mago:octagrama");
  if (!e?.meta.primed) return { mult: 1 };
  e.meta = { ...e.meta, primed: false };
  e.stacks = 0;
  return { mult: 1.5, note: "Octagrama Arcano: +50% dano mágico (consumido)" };
}

export function classBufaoCombatStart(
  state: PassiveCombatState,
  ch: Character,
): string | null {
  if (ch.classId !== "bufao") return null;
  const e = ensure(state, ch.id, "class:bufao:carta", "Carta do Louco", {
    stacks: 1,
    maxStacks: null,
    active: true,
    meta: { extremistUsed: false },
  });
  e.stacks = Math.max(1, e.stacks);
  e.active = true;
  return "Carta do Louco: 1 stack (+1 AGI)";
}

export function classBufaoOnTurn(
  state: PassiveCombatState,
  ch: Character,
): { note?: string } {
  if (ch.classId !== "bufao") return {};
  const e = ensure(state, ch.id, "class:bufao:carta", "Carta do Louco", {
    stacks: 1,
    active: true,
    meta: { extremistUsed: false },
  });
  e.stacks += 1;
  e.active = true;
  if (e.stacks >= 5 && !e.meta.extremistUsed) {
    e.meta = { ...e.meta, extremistUsed: true, extremistReady: true };
    return { note: "Carta do Louco: 5 stacks — EXTREMISTA disponível" };
  }
  return { note: `Carta do Louco: ${e.stacks} stacks` };
}

export function classBufaoAgiBonus(
  state: PassiveCombatState,
  ch: Character,
  baseAgi: number,
): { bonus: number; extremist: boolean } {
  if (ch.classId !== "bufao") return { bonus: 0, extremist: false };
  const e = entry(state, ch.id, "class:bufao:carta");
  if (!e?.active) return { bonus: 0, extremist: false };
  let bonus = e.stacks;
  if (e.stacks >= 5) {
    bonus += Math.floor(baseAgi * 0.25);
  }
  const extremist = Boolean(e.meta.extremistReady);
  return { bonus, extremist };
}

export function classBufaoConsumeExtremist(
  state: PassiveCombatState,
  ch: Character,
): boolean {
  if (ch.classId !== "bufao") return false;
  const e = entry(state, ch.id, "class:bufao:carta");
  if (!e?.meta.extremistReady) return false;
  e.meta = { ...e.meta, extremistReady: false };
  return true;
}

export function classAttackerStatMods(
  state: PassiveCombatState,
  ch: Character,
  maxHp: number,
  base: Stats,
): StatMods {
  const mods: StatMods = {};
  const berserk = classBerserkAtkBonus(ch, maxHp);
  if (berserk.bonus) mods.atk = (mods.atk ?? 0) + berserk.bonus;
  const booster = classFeiticeiroAtkMgcFromState(state, ch.id, ch.classId);
  if (booster) mods.atkMgc = (mods.atkMgc ?? 0) + booster;
  const bufao = classBufaoAgiBonus(state, ch, base.agi);
  if (bufao.bonus) mods.agi = (mods.agi ?? 0) + bufao.bonus;
  const esp = classEspadachimOnTurn(state, ch);
  if (esp.atk) mods.atk = (mods.atk ?? 0) + esp.atk;
  const cel = classCavaleiroCelesteStatMods(state, ch);
  if (cel.agi) mods.agi = (mods.agi ?? 0) + cel.agi;
  const art = classArtificeProjectMods(state, ch);
  for (const k of Object.keys(art)) mods[k] = (mods[k] ?? 0) + art[k];
  return mods;
}

export function classArqueiroOnHit(state: PassiveCombatState, ch: Character): {
  damageMult: number;
  note?: string;
} {
  if (ch.classId !== "arqueiro") return { damageMult: 1 };
  const e = ensure(state, ch.id, "class:arqueiro:conc", "Concentração Absoluta", {
    stacks: 0,
    maxStacks: 2,
    active: true,
    meta: {},
  });
  if (e.meta.concentrated) {
    e.meta = { ...e.meta, concentrated: false };
    e.stacks = 0;
    return { damageMult: 2, note: "Concentração Absoluta: dano ×2" };
  }
  e.stacks = Math.min(2, e.stacks + 1);
  if (e.stacks >= 2) {
    e.meta = { ...e.meta, concentrated: true };
    e.stacks = 0;
    return { damageMult: 1, note: "Concentração ativada — próximo ataque ×2" };
  }
  return { damageMult: 1, note: `Concentração ${e.stacks}/2` };
}

export function classArqueiroOnMiss(state: PassiveCombatState, ch: Character): void {
  if (ch.classId !== "arqueiro") return;
  const e = entry(state, ch.id, "class:arqueiro:conc");
  if (e) {
    e.stacks = 0;
    e.meta = { ...e.meta, concentrated: false };
  }
}

export function classAlquimistaOnHit(
  state: PassiveCombatState,
  ch: Character,
  defenderId: string,
  targetHasPoison: boolean,
  roll: () => number = Math.random,
): { applyPoison: boolean; applyStun: boolean; notes: string[] } {
  const notes: string[] = [];
  if (ch.classId !== "alquimista") return { applyPoison: false, applyStun: false, notes };
  let applyPoison = false;
  if (roll() < 0.3) {
    applyPoison = true;
    notes.push("Preparação Alquímica: Veneno");
  }
  let applyStun = false;
  if (targetHasPoison || applyPoison) {
    const e = ensure(state, defenderId, `class:alquimista:count:${ch.id}`, "Contagem Veneno", {
      stacks: 0,
      maxStacks: 3,
      active: true,
    });
    e.stacks += 1;
    if (e.stacks >= 3) {
      e.stacks = 0;
      applyStun = true;
      notes.push("Preparação Alquímica: Atordoamento");
    }
  }
  return { applyPoison, applyStun, notes };
}

export function classCacadorOnHit(
  state: PassiveCombatState,
  ch: Character,
  defenderId: string,
): { damageMult: number; note?: string } {
  if (ch.classId !== "cacador") return { damageMult: 1 };
  let e = entry(state, defenderId, `class:cacador:marca:${ch.id}`);
  if (!e?.active) {
    e = ensure(state, defenderId, `class:cacador:marca:${ch.id}`, "Marca do Caçador", {
      active: true,
      turnsRemaining: 3,
      stacks: 1,
    });
    e.active = true;
    e.turnsRemaining = 3;
    return { damageMult: 1.2, note: "Marca do Caçador: +20% (3 turnos)" };
  }
  return { damageMult: 1.2, note: "Marca do Caçador: +20%" };
}

export function classPugilistaOnBasicHit(state: PassiveCombatState, ch: Character): StatMods & {
  damageMult?: number;
  note?: string;
} {
  if (ch.classId !== "pugilista") return {};
  const e = ensure(state, ch.id, "class:pugilista:seq", "Punhos de Ferro", {
    stacks: 0,
    active: true,
  });
  e.stacks += 1;
  e.active = true;
  const mods: StatMods & { damageMult?: number; note?: string } = {};
  if (e.stacks >= 5) {
    mods.damageMult = 1.45;
    mods.atk = 2;
    mods.agi = 2;
    mods.note = "Punhos de Ferro: 5º golpe +45% e encerra sequência";
    e.stacks = 0;
  } else if (e.stacks >= 3) {
    mods.agi = 2;
    mods.note = `Punhos de Ferro: sequência ${e.stacks}`;
  } else {
    mods.note = `Punhos de Ferro: sequência ${e.stacks}`;
  }
  return mods;
}

export function classPugilistaReset(state: PassiveCombatState, ch: Character): void {
  if (ch.classId !== "pugilista") return;
  const e = entry(state, ch.id, "class:pugilista:seq");
  if (e) e.stacks = 0;
}

export function classGuerreiroStanceMods(
  state: PassiveCombatState,
  ch: Character,
): StatMods {
  if (ch.classId !== "guerreiro") return {};
  const e = entry(state, ch.id, "class:guerreiro:postura");
  const stance = String(e?.meta.stance ?? "ofensiva");
  if (stance === "defensiva") return { def: 2 };
  if (stance === "mobilidade") return { agi: 2 };
  return { atk: 2 };
}

export function classGuerreiroSetStance(
  state: PassiveCombatState,
  ch: Character,
  stance: "ofensiva" | "defensiva" | "mobilidade",
): void {
  if (ch.classId !== "guerreiro") return;
  const e = ensure(state, ch.id, "class:guerreiro:postura", "Postura de Combate", {
    active: true,
    meta: { stance },
  });
  e.active = true;
  e.meta = { stance };
}

export function classTankAllyDefBonus(
  state: PassiveCombatState,
  defenderId: string,
  positions: Record<string, { x: number; y: number }>,
  characters: Record<string, Character>,
): number {
  let bonus = 0;
  for (const [id, ch] of Object.entries(characters)) {
    if (ch.classId !== "tank" || ch.current.hp <= 0) continue;
    const tankPos = positions[id];
    const defPos = positions[defenderId];
    if (!tankPos || !defPos) continue;
    if (tankPos.x > 3) continue;
    const dist = Math.abs(tankPos.x - defPos.x) + Math.abs(tankPos.y - defPos.y);
    if (dist <= 4 && id !== defenderId) bonus += 3;
  }
  return bonus;
}

export function classBufaoExtremistBonusDamage(baseAgi: number): number {
  return Math.max(0, baseAgi);
}


/** Monge — Disciplina: a cada 3 ataques consecutivos +1 stack (máx 3); cada stack +1 AGI +1 DEF */
export function classMongeOnHit(state, ch){
  if(ch.classId!=="monge") return {};
  const e=ensure(state,ch.id,"class:monge:disc","Disciplina Corporal",{stacks:0,maxStacks:3,active:true,meta:{hits:0}});
  e.meta={...e.meta,hits:Number(e.meta.hits||0)+1};
  if(Number(e.meta.hits)%3===0){ e.stacks=Math.min(3,e.stacks+1); e.active=true; }
  return {agi:e.stacks,def:e.stacks,note:e.stacks?("Disciplina "+e.stacks+"/3"):undefined};
}
/** Duelista — 3 acertos → Domínio (+25% dano no alvo marcado) */
export function classDuelistaOnHit(state,ch,targetId){
  if(ch.classId!=="duelista") return {mult:1};
  const e=ensure(state,ch.id,"class:duelista:duelo","Domínio do Duelo",{stacks:0,maxStacks:3,active:true,meta:{}});
  e.stacks=Math.min(3,e.stacks+1); e.active=true;
  if(e.stacks>=3){ e.meta={...e.meta,domainTarget:targetId}; e.stacks=0; return {mult:1.25,note:"Domínio do Duelo +25%"}; }
  if(e.meta.domainTarget===targetId) return {mult:1.25,note:"Domínio ativo +25%"};
  return {mult:1,note:"Duelo "+e.stacks+"/3"};
}
/** Gladiador — adversário marcado: +2 ATK +2 DEF e +20% dano */
export function classGladiadorSetAdversary(state,ch,targetId){
  if(ch.classId!=="gladiador") return;
  const e=ensure(state,ch.id,"class:gladiador:adv","Arena Sangrenta",{active:true,meta:{targetId}});
  e.active=true; e.meta={targetId};
}
export function classGladiadorOnHit(state,ch,targetId){
  if(ch.classId!=="gladiador") return {mult:1};
  const e=entry(state,ch.id,"class:gladiador:adv");
  if(e?.meta?.targetId===targetId) return {mult:1.2,note:"Arena Sangrenta +20%"};
  return {mult:1};
}
export function classGladiadorStatMods(state,ch){
  if(ch.classId!=="gladiador") return {};
  const e=entry(state,ch.id,"class:gladiador:adv");
  if(e?.active) return {atk:2,def:2};
  return {};
}
/** Lanceiro — +2 ATK (alcance simplificado: sempre em combate ativo) */
export function classLanceiroStatMods(ch){
  if(ch.classId!=="lanceiro") return {};
  return {atk:2};
}
/** Druida — terreno natural +2 DEF +2 RES */
export function classDruidaStatMods(ch,naturalTerrain){
  if(ch.classId!=="druida"||!naturalTerrain) return {};
  return {def:2,res:2};
}
/** Cryomante — 3 hits gelo → congelado (flag applyFreeze) */
export function classCryomanteOnHit(state,ch,targetId){
  if(ch.classId!=="cryomante") return {applyFreeze:false,notes:[]};
  const e=ensure(state,targetId,"class:cryomante:cong:"+ch.id,"Congelamento",{stacks:0,maxStacks:3,active:true});
  e.stacks=Math.min(3,e.stacks+1); e.active=true;
  const notes=["Congelamento "+e.stacks+"/3"];
  if(e.stacks>=3){ e.stacks=0; e.active=false; return {applyFreeze:true,notes:[...notes,"Congelado 1 turno"]}; }
  return {applyFreeze:false,notes};
}
/** Anatomista — 3 hits no mesmo alvo → Ponto Vital 2 turnos (+30% dano) */
export function classAnatomistaOnHit(state,ch,targetId){
  if(ch.classId!=="anatomista") return {mult:1};
  const e=ensure(state,ch.id,"class:anatomista:seq","Anatomia Perfeita",{stacks:0,meta:{targetId:""}});
  if(e.meta.targetId!==targetId){ e.meta={targetId}; e.stacks=1; }
  else e.stacks+=1;
  if(e.stacks>=3){
    const v=ensure(state,targetId,"class:anatomista:vital","Ponto Vital",{active:true,turnsRemaining:2});
    v.active=true; v.turnsRemaining=2; e.stacks=0;
    return {mult:1.3,note:"Ponto Vital +30%"};
  }
  const v=entry(state,targetId,"class:anatomista:vital");
  if(v?.active) return {mult:1.3,note:"Ponto Vital ativo +30%"};
  return {mult:1,note:"Anatomia "+e.stacks+"/3"};
}
/** Ceifador — golpe final: cura aliados com parte do dano */
export function classCeifadorOnKill(damage){
  return {healPool:Math.max(1,Math.floor(damage*0.5)),note:"Colheita Sombria: cura em aliados"};
}
/** Clérigo — skill suporte: +1 stack (máx 3) → +1 DEF/RES por stack; aos 3 cura */
export function classClerigoOnSupport(state,ch){
  if(ch.classId!=="clerigo") return {heal:0};
  const e=ensure(state,ch.id,"class:clerigo:bencao","Bênção Sagrada",{stacks:0,maxStacks:3,active:true,turnsRemaining:2});
  e.stacks=Math.min(3,e.stacks+1); e.active=true; e.turnsRemaining=2;
  if(e.stacks>=3){ e.stacks=0; return {heal:0.15,note:"Bênção: cura 15% HP máx",def:0,res:0}; }
  return {heal:0,def:e.stacks,res:e.stacks,note:"Bênção "+e.stacks+"/3"};
}
/** Cavaleiro — Investida: próximo ataque +50% */
export function classCavaleiroArmInvestida(state,ch){
  if(ch.classId!=="cavaleiro") return;
  const e=ensure(state,ch.id,"class:cavaleiro:investida","Investida Montada",{active:true});
  e.active=true; e.meta={armed:true};
}
export function classCavaleiroConsumeInvestida(state,ch){
  if(ch.classId!=="cavaleiro") return {mult:1};
  const e=entry(state,ch.id,"class:cavaleiro:investida");
  if(e?.meta?.armed){ e.meta={armed:false}; e.active=false; return {mult:1.5,note:"Investida +50%"}; }
  return {mult:1};
}

/** ===== Lote 2 — classes restantes (motor puro) ===== */
export function classNecromanteOnKill(state,ch){
  if(ch.classId!=="necromante") return {note:null};
  const e=ensure(state,ch.id,"class:necromante:almas","Servos da Morte",{stacks:0,maxStacks:15,active:true});
  e.stacks=Math.min(15,e.stacks+1); e.active=true;
  let note="Alma "+e.stacks+"/15";
  if(e.stacks>=3 && e.stacks%3===0) note+=" · pode invocar Servo (50% attrs)";
  return {note};
}
export function classBardoOnSupport(state,ch){
  if(ch.classId!=="bardo") return {note:null};
  const e=ensure(state,ch.id,"class:bardo:sinfonia","Sinfonia de Almanaque",{stacks:0,maxStacks:3,active:true,turnsRemaining:2});
  e.stacks=Math.min(3,e.stacks+1); e.active=true; e.turnsRemaining=2;
  if(e.stacks>=3){ e.meta={...e.meta,harmonia:true}; e.stacks=0; return {note:"Harmonia 2 turnos: +20% dano/+cura aliados",harmonia:true}; }
  return {note:"Sinfonia "+e.stacks+"/3 (+1 attrs aliados)"};
}
export function classInvocadorOnSummon(state,ch,summonId){
  if(ch.classId!=="invocador") return {note:null};
  const e=ensure(state,ch.id,"class:invocador:vinculo","Vínculo de Invocação",{stacks:0,maxStacks:5,active:true,meta:{last:""}});
  if(summonId && summonId!==e.meta.last){ e.stacks=Math.min(5,e.stacks+1); e.meta={...e.meta,last:summonId}; }
  e.active=true;
  if(e.stacks>=5 && ch.level>=20) return {note:"ALEISTER desbloqueado (attrs x2)",aleister:true};
  return {note:"Vínculo "+e.stacks+"/5"};
}
export function classOraculoCombatStart(state,ch){
  if(ch.classId!=="oraculo") return null;
  const e=ensure(state,ch.id,"class:oraculo:prep","Presságio",{active:true,meta:{preparacao:true,stacks:0}});
  e.active=true; e.meta={...e.meta,preparacao:true};
  return "Presságio: Preparação (não é surpreendido)";
}
export function classOraculoOnPredict(state,ch){
  if(ch.classId!=="oraculo") return {note:null};
  const e=ensure(state,ch.id,"class:oraculo:prep","Presságio",{stacks:0,active:true,meta:{}});
  e.stacks=Math.min(5,Number(e.stacks||0)+1);
  return {note:"Presságio stack "+e.stacks};
}
export function classArtificeProjectMods(state,ch){
  if(ch.classId!=="artifice") return {};
  const e=entry(state,ch.id,"class:artifice:proj");
  const tier=Number(e?.meta?.tier||0);
  if(tier===1) return {atk:1,def:1};
  if(tier===2) return {atk:2,def:2,agi:1};
  if(tier===3) return {atk:3,def:3,agi:2,atkMgc:2};
  return {};
}
export function classArtificeSetProject(state,ch,tier){
  if(ch.classId!=="artifice") return;
  const e=ensure(state,ch.id,"class:artifice:proj","Mestre das Criações",{active:true,meta:{tier}});
  e.active=true; e.meta={tier:Math.max(1,Math.min(3,tier))};
}
export function classBufferHealerOnSupport(state,ch){
  if(ch.classId!=="buffer-healer") return {mult:1,note:null};
  const e=ensure(state,ch.id,"class:buffer:ress","Ressonância Vital",{stacks:0,maxStacks:3,active:true});
  e.stacks=Math.min(3,e.stacks+1); e.active=true;
  const mult=1+e.stacks*0.1;
  if(e.stacks>=3){ e.meta={...e.meta,maxima:true,turns:2}; e.stacks=0; return {mult:1.3,note:"Ressonância Máxima 2 turnos",maxima:true}; }
  return {mult,note:"Ressonância "+e.stacks+"/3 (+"+(e.stacks*10)+"% cura/buff)"};
}
export function classPaladinoCombatStart(state,ch,allyId){
  if(ch.classId!=="paladino"||!allyId) return null;
  const e=ensure(state,ch.id,"class:paladino:juramento","Juramento Sagrado",{active:true,meta:{allyId,fe:0}});
  e.active=true; e.meta={allyId,fe:0};
  return "Juramento Sagrado com aliado";
}
export function classPaladinoShareDamage(state,paladinoId,targetId,damage){
  const e=entry(state,paladinoId,"class:paladino:juramento");
  if(!e?.active||e.meta.allyId!==targetId||damage<=0) return {share:0};
  const share=Math.floor(damage*0.2);
  e.meta={...e.meta,fe:Math.min(3,Number(e.meta.fe||0)+1)};
  let note=null;
  if(Number(e.meta.fe)>=3){ e.meta={...e.meta,fe:0,sagrado:true,turns:4}; note="Estado Sagrado 4 turnos"; }
  return {share,note};
}
export function classBruxoOnSkill(state,ch,offensive){
  if(ch.classId!=="bruxo") return {mult:1,hpCost:0};
  const cost=Math.max(1,Math.floor(ch.current.hp*0.1));
  const e=ensure(state,ch.id,"class:bruxo:pacto","Pacto Profano",{stacks:0,maxStacks:5,active:true});
  e.stacks=Math.min(5,e.stacks+1); e.active=true;
  return {mult:offensive?1.25:1.25,hpCost:cost,note:"Pacto "+e.stacks+"/5 · -"+cost+" HP · +25%"};
}
export function classRoninOnTurnStart(state,ch,attackedLastTurn){
  if(ch.classId!=="ronin") return null;
  if(attackedLastTurn){ const e=entry(state,ch.id,"class:ronin:espera"); if(e) e.active=false; return null; }
  const e=ensure(state,ch.id,"class:ronin:espera","Postura de Espera",{active:true});
  e.active=true; e.meta={armed:true};
  return "Postura de Espera: próximo ataque +50%";
}
export function classRoninConsume(state,ch,defenderHpRatio){
  if(ch.classId!=="ronin") return {mult:1,forceCrit:false};
  const e=entry(state,ch.id,"class:ronin:espera");
  if(!e?.meta?.armed) return {mult:1,forceCrit:false};
  e.meta={armed:false}; e.active=false;
  return {mult:1.5,forceCrit:defenderHpRatio<=0.3,note:"Ronin +50%"+(defenderHpRatio<=0.3?" · crítico":"")};
}
export function classEspadachimOnTurn(state,ch){
  if(ch.classId!=="espadachim") return {atk:0};
  const e=ensure(state,ch.id,"class:espadachim:turno","Espadachim Silencioso",{stacks:0,maxStacks:5,active:true});
  if(!e.meta.awakened){ e.stacks=Math.min(5,e.stacks+1); }
  if(e.stacks>=5){ e.meta={...e.meta,awakened:true}; }
  e.active=true;
  return {atk:e.meta.awakened?0:e.stacks,awakened:Boolean(e.meta.awakened),note:e.meta.awakened?"Espada desperta +25% físico":("Silêncio "+e.stacks+"/5")};
}
export function classEspadachimDamageMult(state,ch){
  if(ch.classId!=="espadachim") return {mult:1};
  const e=entry(state,ch.id,"class:espadachim:turno");
  if(e?.meta?.awakened) return {mult:1.25,note:"Espada desperta +25%"};
  return {mult:1};
}
export function classXamaOnHit(state,ch){
  if(ch.classId!=="xama") return {note:null};
  const e=ensure(state,ch.id,"class:xama:espirito","Pacto dos Espíritos",{stacks:0,maxStacks:3,active:true});
  e.stacks=Math.min(3,e.stacks+1); e.active=true;
  return {note:"Espírito "+e.stacks+"/3",atkMgc:e.stacks};
}
export function classRunomanteOnSkill(state,ch,runeId){
  if(ch.classId!=="runomante") return {note:null};
  const e=ensure(state,ch.id,"class:runomante:runa","Runa Primordial",{stacks:0,active:true,meta:{last:""}});
  if(runeId && runeId!==e.meta.last){ e.stacks=Math.min(4,e.stacks+1); e.meta={...e.meta,last:runeId}; }
  return {note:"Runa "+e.stacks+"/4",mult:1+e.stacks*0.05};
}
export function classDancarinoOnHit(state,ch,targetId){
  if(ch.classId!=="dancarino-de-laminas") return {mult:1};
  const e=ensure(state,ch.id,"class:danca:hit","Dança da Morte",{stacks:0,meta:{targets:""}});
  const set=new Set(String(e.meta.targets||"").split(",").filter(Boolean));
  set.add(targetId);
  e.meta={...e.meta,targets:[...set].join(",")};
  if(set.size>=3){ e.meta={...e.meta,targets:"",danca:true,turns:2}; return {mult:1.3,note:"Dança da Morte 2 turnos +30%"}; }
  if(e.meta.danca) return {mult:1.3,note:"Dança ativa +30%"};
  return {mult:1,note:"Dança alvos "+set.size+"/3"};
}
export function classBatedorDamageMult(state,ch,targetRevealed){
  if(ch.classId!=="batedor") return {mult:1};
  if(targetRevealed) return {mult:1.2,note:"Olhos do Predador +20% em revelado"};
  return {mult:1};
}
export function classCavaleiroCelesteCombatStart(state,ch){
  if(ch.classId!=="cavaleiro-celeste") return null;
  const e=ensure(state,ch.id,"class:celeste:ar","Ascensão Celestial",{active:true,meta:{aereo:true}});
  e.active=true; e.meta={aereo:true};
  return "Ascensão: +2 AGI · -30% dano corpo a corpo recebido";
}
export function classCavaleiroCelesteStatMods(state,ch){
  if(ch.classId!=="cavaleiro-celeste") return {};
  const e=entry(state,ch.id,"class:celeste:ar");
  if(e?.meta?.aereo) return {agi:2};
  return {};
}
export function classCavaleiroCelesteDamageTakenMult(state,ch,kind){
  if(ch.classId!=="cavaleiro-celeste") return 1;
  const e=entry(state,ch.id,"class:celeste:ar");
  if(e?.meta?.aereo && kind==="physical") return 0.7;
  return 1;
}
export function classElementalistaOnSkill(state,ch,affinityId){
  if(ch.classId!=="elementalista") return {mult:1};
  const e=ensure(state,ch.id,"class:elem:conv","Convergência Elemental",{stacks:0,meta:{last:"",chain:0}});
  if(affinityId && affinityId!==e.meta.last){ e.meta={...e.meta,last:affinityId,chain:Number(e.meta.chain||0)+1}; e.stacks=Math.min(4,e.stacks+1); }
  else e.meta={...e.meta,chain:0};
  if(Number(e.meta.chain)>=4){ e.meta={...e.meta,conv:true,turns:2,chain:0}; return {mult:1.25,note:"Convergência 2 turnos +25%"}; }
  return {mult:1.1,note:"Afinidade diferente +10%"};
}
export function classDomadorShareDamage(state,domadorId,damage){
  const e=entry(state,domadorId,"class:domador:laco");
  if(!e?.active||!e.meta.creatureId) return {share:0};
  return {share:Math.floor(damage*0.2),creatureId:e.meta.creatureId};
}
export function classDomadorSetBond(state,ch,creatureId){
  if(ch.classId!=="domador") return;
  const e=ensure(state,ch.id,"class:domador:laco","Laço Bestial",{active:true,meta:{creatureId}});
  e.active=true; e.meta={creatureId};
}
export function classDomadorStatMods(state,ch,nearCreature){
  if(ch.classId!=="domador") return {};
  if(nearCreature) return {agi:2};
  const e=entry(state,ch.id,"class:domador:laco");
  if(e?.meta?.fury) return {atk:3,agi:2};
  return {};
}
export function classCronomanteTryRewind(state,ch,allyHpRatio){
  if(ch.classId!=="cronomante") return {ok:false};
  const e=ensure(state,ch.id,"class:crono:dist","Distorção Temporal",{active:true,meta:{used:false}});
  if(e.meta.used) return {ok:false};
  if(allyHpRatio>0.3) return {ok:false};
  e.meta={...e.meta,used:true};
  return {ok:true,note:"Retrocesso Temporal (1x/combate)"};
}
export function classAlquimistaSombrioOnSkill(state,ch,offensive){
  if(ch.classId!=="alquimista-sombrio") return {mult:1,hpCost:0};
  const cost=Math.max(1,Math.floor((ch.current.hp||1)*0.05)); // approx max via current
  return {mult:1.25,hpCost:cost,note:"Transmutação -5% HP · +25%"};
}
export function classMarioneteShareToLinked(state,mestreId,damage){
  const e=entry(state,mestreId,"class:marionete:fio");
  if(!e?.active||!e.meta.linkedId) return {share:0};
  return {share:Math.floor(damage*0.2),linkedId:e.meta.linkedId};
}
export function classMarioneteSetLink(state,ch,linkedId){
  if(ch.classId!=="mestre-de-marionetes") return;
  const e=ensure(state,ch.id,"class:marionete:fio","Fios do Destino",{active:true,meta:{linkedId}});
  e.active=true; e.meta={linkedId};
}
export function classArmadilheiroTrigger(state,ch,type){
  if(ch.classId!=="armadilheiro") return {note:null};
  const e=ensure(state,ch.id,"class:armadilha:prep","Armadilha Mortal",{stacks:0,maxStacks:3,active:true});
  if(e.stacks>=3) return {note:"Máx 3 armadilhas"};
  e.stacks+=1;
  return {note:"Armadilha "+type+" ("+e.stacks+"/3)",type};
}
export function classIlusionistaOnHit(state,ch,targetId){
  if(ch.classId!=="ilusionista") return {note:null};
  // only one target
  for(const x of state.entries){ if(x.id==="class:ilusionista:inv"&&x.characterId!==targetId) x.active=false; }
  const e=ensure(state,targetId,"class:ilusionista:inv","Inversão Sensorial",{active:true,turnsRemaining:2});
  e.active=true; e.turnsRemaining=2;
  const m=ensure(state,ch.id,"class:ilusionista:count","Mundo Invertido",{stacks:0,meta:{ids:""}});
  const set=new Set(String(m.meta.ids||"").split(",").filter(Boolean));
  set.add(targetId);
  m.meta={...m.meta,ids:[...set].join(",")};
  if(set.size>=4){ m.meta={...m.meta,mundo:true}; return {note:"Inversão · Mundo Invertido pronto (4 alvos)"}; }
  return {note:"Inversão Sensorial 2 turnos ("+set.size+"/4)"};
}
