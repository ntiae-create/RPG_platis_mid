import {
  BellRing,
  Bot,
  Coins,
  Crosshair,
  Dices,
  FileText,
  Globe2,
  Map,
  MessageCircle,
  Package,
  Puzzle,
  ScrollText,
  Settings2,
  Swords,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePlatis } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PlayerSlots } from "@/components/mesa/player-slots";
import type { Character, Skill } from "@/data/types";

type MasterSection =
  | "eventos"
  | "comunicacao"
  | "missoes"
  | "npcs"
  | "mapa"
  | "combate"
  | "itens"
  | "economia"
  | "configuracoes"
  | "log"
  | "bosses"
  | "mundo"
  | "jogadores"
  | "xp-mestre";

const SECTIONS = [
  { id: "eventos", label: "Eventos", icon: Dices, desc: "CTE, emboscadas, escolhas e puzzles." },
  { id: "comunicacao", label: "Comunicação", icon: MessageCircle, desc: "Chat, mensagens e avisos." },
  { id: "missoes", label: "Missões", icon: ScrollText, desc: "Crie e controle missões." },
  { id: "npcs", label: "NPCs", icon: Bot, desc: "Crie e gerencie NPCs." },
  { id: "mapa", label: "Mapa do Mestre", icon: Map, desc: "Locais, marcadores e visibilidade." },
  { id: "combate", label: "Combate", icon: Swords, desc: "Turnos, efeitos, dano e cura." },
  { id: "itens", label: "Itens e Inventário", icon: Package, desc: "Itens, equipamentos e inventários." },
  { id: "economia", label: "Economia", icon: Coins, desc: "Moedas, recompensas e saldos." },
  { id: "configuracoes", label: "Configurações", icon: Settings2, desc: "Regras e configurações da mesa." },
  { id: "log", label: "Log", icon: FileText, desc: "Histórico das ações da mesa." },
  { id: "bosses", label: "Bosses Mundiais", icon: Crosshair, desc: "Controle dos Bosses do mundo." },
  { id: "mundo", label: "Mundo", icon: Globe2, desc: "Controle geral do mundo de Platis." },
  { id: "xp-mestre", label: "Personagens do Mestre", icon: Coins, desc: "Experiência e XP de Brasão do personagem do Mestre." },
  { id: "jogadores", label: "Jogadores", icon: Users, desc: "Gerencie os oito slots da mesa." },
] as const;

const EVENT_TYPES = [
  { id: "cte", label: "CTE", desc: "Evento sincronizado com tempo e reação." },
  { id: "emboscada", label: "Emboscada", desc: "Surpresa contra um ou mais jogadores." },
  { id: "escolha", label: "Escolha", desc: "Apresente alternativas com consequências." },
  { id: "puzzle", label: "Puzzle", desc: "Desafios de lógica, símbolos, números ou memória." },
  { id: "teste", label: "Teste", desc: "Desafio com atributo, habilidade ou dado." },
  { id: "narrativo", label: "Evento narrativo", desc: "Acontecimento conduzido pelo Mestre." },
] as const;

export function MasterPanel({
  p2pPeers,
  remoteCharacters,
  onKickPeer,
  onPatchRemoteCharacter,
}: {
  p2pPeers: {
    id: string;
    name: string;
    role: "mestre" | "jogador";
    connectionState: string;
  }[];
  remoteCharacters: Record<string, Character>;
  onKickPeer: (peerId: string) => void;
  onPatchRemoteCharacter: (characterId: string, patch: Partial<Character>) => void;
}) {
  const [section, setSection] = useState<MasterSection | null>(null);
  const nav = useNavigate();
  const [eventType, setEventType] = useState<string | null>(null);
  const [cteTimerMs, setCteTimerMs] = useState(3000);
  const [cteTarget, setCteTarget] = useState<"todos" | "especificos">("todos");
  const [cteTargetCharacterIds, setCteTargetCharacterIds] = useState<string[]>([]);

  const createMasterEvent = usePlatis((s) => s.createMasterEvent);
  const activateMasterEvent = usePlatis((s) => s.activateMasterEvent);
  const masterEvents = usePlatis((s) => s.masterEvents);
  const slots = usePlatis((s) => s.slots);
  const characters = usePlatis((s) => s.characters);
  const combatEnemies = usePlatis((s) => s.combatEnemies);
  const combatParticipants = usePlatis((s) => s.combatParticipants);
  const toggleCombatParticipant = usePlatis((s) => s.toggleCombatParticipant);
  const addCombatEnemy = usePlatis((s) => s.addCombatEnemy);
  const removeCombatEnemy = usePlatis((s) => s.removeCombatEnemy);
  const removeCombatEnemySkill = usePlatis((s) => s.removeCombatEnemySkill);
const updateCombatEnemySkill = usePlatis((s) => s.updateCombatEnemySkill);
  const startCombat = usePlatis((s) => s.startCombat);
  const endCombat = usePlatis((s) => s.endCombat);
  const combatActive = usePlatis((s) => s.combatActive);
  const allowBossEscape = usePlatis((s) => s.allowBossEscape);
  const setAllowBossEscape = usePlatis((s) => s.setAllowBossEscape);
  const masterId = usePlatis((s) => s.masterId);
  const setActiveMasterCharacter = usePlatis((s) => s.setActiveMasterCharacter);
  const grantXp = usePlatis((s) => s.grantXp);
  const grantBrasao = usePlatis((s) => s.grantBrasaoXp);
  const masterCharacter = masterId ? characters[masterId] : Object.values(characters).find((character) => character.isMaster);

  const [xpTargetId, setXpTargetId] = useState<string>("");
  const [xpAmount, setXpAmount] = useState(100);
  const [masterXpAmount, setMasterXpAmount] = useState(100);
  const [masterBrasaoAmount, setMasterBrasaoAmount] = useState(3000);
  const [enemyHp, setEnemyHp] = useState(100);
  const [enemyMp, setEnemyMp] = useState(100);
  const [enemyEst, setEnemyEst] = useState(100);
  const [enemyAtk, setEnemyAtk] = useState(10);
  const [enemyAtkMgc, setEnemyAtkMgc] = useState(10);
  const [enemyDef, setEnemyDef] = useState(10);
  const [enemyRes, setEnemyRes] = useState(10);
  const [enemyAgi, setEnemyAgi] = useState(10);
  const [enemyInt, setEnemyInt] = useState(10);
  const [enemySkillName, setEnemySkillName] = useState("");
  const [enemySkillMp, setEnemySkillMp] = useState(0);
  const [enemySkillEst, setEnemySkillEst] = useState(0);
  const [enemySkillType, setEnemySkillType] = useState<Skill["type"]>("ataque");
  const [enemySkillAffinity, setEnemySkillAffinity] = useState<Skill["affinity"]>("fisico");
  const [enemySkillTarget, setEnemySkillTarget] = useState<Skill["target"]>("unico");
  const [enemySkillRange, setEnemySkillRange] = useState(1);
  const [enemySkillDuration, setEnemySkillDuration] = useState(0);
  const [enemySkillCooldown, setEnemySkillCooldown] = useState(0);
  const [enemySkillDescription, setEnemySkillDescription] = useState("");
  const [editingEnemySkill, setEditingEnemySkill] = useState<string | null>(null);
  const [editingEnemyId, setEditingEnemyId] = useState<string | null>(null);

  useEffect(() => {
    if (!editingEnemyId || !editingEnemySkill) return;

    const enemy = combatEnemies[editingEnemyId];
    const skill = enemy?.skills.find((item) => item.id === editingEnemySkill);

    if (!skill) return;

    setEnemySkillName(skill.name);
    setEnemySkillMp(skill.cost.mp);
    setEnemySkillEst(skill.cost.est);
    setEnemySkillType(skill.type);
    setEnemySkillAffinity(skill.affinity);
    setEnemySkillTarget(skill.target);
    setEnemySkillRange(skill.range);
    setEnemySkillDuration(skill.duration);
    setEnemySkillCooldown(skill.cooldown);
    setEnemySkillDescription(skill.description);
  }, [editingEnemyId, editingEnemySkill, combatEnemies]);

  if (section === "jogadores") {
    return (
      <div className="space-y-3">
        <Button
          variant="ghost"
          onClick={() => setSection(null)}
        >
          ← Menu do Mestre
        </Button>

        <PlayerSlots
          p2pPeers={p2pPeers}
          remoteCharacters={remoteCharacters}
          onKickPeer={onKickPeer}
          onPatchRemoteCharacter={onPatchRemoteCharacter}
        />
      </div>
    );
  }

  if (section === "combate") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSection(null)}>
          ← Menu do Mestre
        </Button>

        <div>
          <h2 className="font-display text-3xl">Combate</h2>
          <p className="mt-1 text-sm text-muted">
            Controle monstros, Bosses, turnos e confrontos da mesa.
          </p>
        </div>

        <div className="panel space-y-4 p-4">
          <div>
  <h3 className="font-medium">👹 Criar inimigo</h3>
  <p className="mt-1 text-xs text-muted">Defina primeiro a identidade e os atributos do Monstro ou Boss.</p>
</div>
<input
            id="master-enemy-name"
            placeholder="Nome do monstro ou Boss"
            className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              id="master-enemy-kind"
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm"
            >
              <option value="monster">Monstro</option>
              <option value="boss">Boss</option>
            </select>

            <input
              id="master-enemy-level"
              type="number"
              min="1"
              defaultValue={1}
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm"
            />
          </div>
        <div className="pt-2">\n  <h4 className="font-medium">⚔️ Habilidade</h4>\n  <p className="mt-1 text-xs text-muted">Opcional. Configure uma habilidade especial para este inimigo.</p>\n</div>\n<input
          type="number"
          min="0"
          value={enemySkillCooldown}
          onChange={(e) => setEnemySkillCooldown(Math.max(0, Number(e.target.value) || 0))}
          placeholder="Cooldown em turnos (0 = sem cooldown)"
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
        />

        <input
          type="number"
          min="0"
          value={enemySkillDuration}
          onChange={(e) => setEnemySkillDuration(Math.max(0, Number(e.target.value) || 0))}
          placeholder="Duração em turnos (0 = instantânea)"
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
        />

        <input
          type="number"
          min="1"
          value={enemySkillRange}
          onChange={(e) => setEnemySkillRange(Math.max(1, Number(e.target.value) || 1))}
          placeholder="Alcance da habilidade"
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
        />

        {editingEnemySkill && editingEnemyId && (
          <Button
            onClick={() => {
              const enemy = combatEnemies[editingEnemyId];
              const skill = enemy?.skills.find(
                (item) => item.id === editingEnemySkill,
              );

              if (!skill) return;

              updateCombatEnemySkill(editingEnemyId, editingEnemySkill, {
                name: enemySkillName.trim(),
                type: enemySkillType,
                affinity: enemySkillAffinity,
                description: enemySkillDescription.trim(),
                cost: {
                  ...skill.cost,
                  mp: enemySkillMp,
                  est: enemySkillEst,
                },
                target: enemySkillTarget,
                range: enemySkillRange,
                duration: enemySkillDuration,
                cooldown: enemySkillCooldown,
              });

              setEditingEnemySkill(null);
              setEditingEnemyId(null);
            }}
          >
            Salvar habilidade
          </Button>
        )}

        <select
          value={enemySkillTarget}
          onChange={(e) => setEnemySkillTarget(e.target.value as Skill["target"])}
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
        >
          <option value="unico">Alvo único</option>
          <option value="area">Área</option>
          <option value="aliado">Aliado</option>
          <option value="grupo">Grupo</option>
          <option value="self">Próprio</option>
        </select>

        <select
          value={enemySkillAffinity}
          onChange={(e) => setEnemySkillAffinity(e.target.value as Skill["affinity"])}
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
        >
          <option value="fisico">Físico</option>
          <option value="magico">Mágico</option>
          <option value="luz">Luz</option>
          <option value="trevas">Trevas</option>
          <option value="fogo">Fogo</option>
          <option value="agua">Água</option>
          <option value="vento">Vento</option>
          <option value="terra">Terra</option>
        </select>

        <select
          value={enemySkillType}
          onChange={(e) => setEnemySkillType(e.target.value as Skill["type"])}
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
        >
          <option value="ataque">Ataque</option>
          <option value="defesa">Defesa</option>
          <option value="suporte">Suporte</option>
          <option value="controle">Controle</option>
        </select>

        <textarea
          value={enemySkillDescription}
          onChange={(e) => setEnemySkillDescription(e.target.value)}
          placeholder="Descrição/efeito da habilidade (opcional)"
          rows={3}
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
        />

        <input
          id="master-enemy-skill-name"
          value={enemySkillName}
          onChange={(e) => setEnemySkillName(e.target.value)}
          placeholder="Nome da habilidade (opcional)"
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
        />

        <input
          id="master-enemy-skill-est"
          type="number"
          min="0"
          value={enemySkillEst}
          onChange={(e) => setEnemySkillEst(Math.max(0, Number(e.target.value) || 0))}
          placeholder="Custo de EST da habilidade"
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
        />

        <input
          id="master-enemy-skill-mp"
          type="number"
          min="0"
          value={enemySkillMp}
          onChange={(e) => setEnemySkillMp(Math.max(0, Number(e.target.value) || 0))}
          placeholder="Custo de MP da habilidade"
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
        />

          

          <div>\n  <h4 className="font-medium">📊 Status de combate</h4>\n  <p className="mt-1 text-xs text-muted">Atributos iniciais do Monstro ou Boss.</p>\n</div>\n<div className="grid grid-cols-2 gap-2">
            {([
              ["HP", enemyHp, setEnemyHp],
              ["MP", enemyMp, setEnemyMp],
              ["EST", enemyEst, setEnemyEst],
              ["ATK", enemyAtk, setEnemyAtk],
              ["ATK MGC", enemyAtkMgc, setEnemyAtkMgc],
              ["DEF", enemyDef, setEnemyDef],
              ["RES", enemyRes, setEnemyRes],
              ["AGI", enemyAgi, setEnemyAgi],
              ["INT", enemyInt, setEnemyInt],
            ] as const).map(([label, value, setter]) => (
              <label key={label} className="space-y-1">
                <span className="text-xs font-medium text-muted">{label}</span>
                <input
                  type="number"
                  min="0"
                  value={value}
                  onChange={(e) => setter(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
                />
              </label>
            ))}
          </div>

          <Button
            onClick={() => {
              const nameInput = document.getElementById("master-enemy-name") as HTMLInputElement | null;
              const kindInput = document.getElementById("master-enemy-kind") as HTMLSelectElement | null;
              const levelInput = document.getElementById("master-enemy-level") as HTMLInputElement | null;

              const name = nameInput?.value.trim();
              const level = Math.max(1, Number(levelInput?.value) || 1);
              const kind = kindInput?.value === "boss" ? "boss" : "monster";

              if (!name) return;

              addCombatEnemy({
                name,
                kind,
                level,
                stats: {
                  hp: enemyHp,
                  mp: enemyMp,
                  est: enemyEst,
                  san: enemyEst,
                  atk: enemyAtk,
                  atkMgc: enemyAtkMgc,
                  def: enemyDef,
                  res: enemyRes,
                  agi: enemyAgi,
                  int: enemyInt,
                },
                current: {
                  hp: enemyHp,
                  mp: enemyMp,
                  est: enemyEst,
                  san: enemyEst,
                },
                skills: enemySkillName.trim()
              ? [{
                  id: `enemy-skill-${Date.now()}`,
                  slot: 0,
                  name: enemySkillName.trim(),
                  affinity: enemySkillAffinity,
                  description: enemySkillDescription.trim(),
                  type: enemySkillType,
                  cost: { hp: 0, mp: enemySkillMp, est: enemySkillEst },
                  target: enemySkillTarget,
                  areaCount: 1,
                  areaSquares: 1,
                  direction: "cima",
                  range: enemySkillRange,
                  duration: enemySkillDuration,
                  cooldown: enemySkillCooldown,
                  status: "approved",
                }]
              : [],
              });

              if (nameInput) nameInput.value = "";
            setEnemySkillName("");
            setEnemySkillMp(0);
            setEnemySkillEst(0);
            setEnemySkillType("ataque");
            setEnemySkillAffinity("fisico");
            setEnemySkillTarget("unico");
            setEnemySkillRange(1);
            setEnemySkillDuration(0);
            setEnemySkillCooldown(0);
            setEnemySkillDescription("");
            }}
          >
            Adicionar à batalha
          </Button>
        </div>

        <div className="panel space-y-3 p-4">
          <h3 className="font-medium">Participantes do combate</h3>
          <p className="text-xs text-muted">
            Selecione os Players, monstros e Bosses que participarão desta batalha.
          </p>

          <div className="space-y-2">
            {slots.map((characterId, index) => {
              if (!characterId) return null;

              const character = characters[characterId];
              if (!character) return null;

              const selected = combatParticipants.includes(characterId);

              return (
                <label
                  key={characterId}
                  className="flex cursor-pointer items-center justify-between rounded-md border border-line p-3"
                >
                  <div>
                    <p className="font-medium">
                      Slot {index + 1} · {character.name}
                    </p>
                    <p className="text-xs text-muted">
                      Nv. {character.level}
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleCombatParticipant(characterId)}
                  />
                </label>
              );
            })}

            {Object.values(combatEnemies).map((enemy) => {
              const selected = combatParticipants.includes(enemy.id);

              return (
                <label
                  key={enemy.id}
                  className="flex cursor-pointer items-center justify-between rounded-md border border-line p-3"
                >
                  <div>
                    <p className="font-medium">{enemy.name}</p>
                    <p className="text-xs text-muted">
                      {enemy.kind === "boss" ? "Boss" : "Monstro"} · Nv. {enemy.level}
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleCombatParticipant(enemy.id)}
                  />
                </label>
              );
            })}
          </div>

          <p className="text-xs text-muted">
            Selecionados: {combatParticipants.length}
          </p>
        </div>

        <div className="panel space-y-3 p-4">
          <h3 className="font-medium">Inimigos na mesa</h3>

          {Object.values(combatEnemies).length === 0 ? (
            <p className="text-sm text-muted">Nenhum inimigo adicionado.</p>
          ) : (
            Object.values(combatEnemies).map((enemy) => (
              <div
                key={enemy.id}
                className="flex items-center justify-between rounded-md border border-line p-3"
              >
                <div>
                  <p className="font-medium">{enemy.name}</p>
                  <p className="text-xs text-muted">
                    {enemy.kind === "boss" ? "Boss" : "Monstro"} · Nv. {enemy.level} · HP {enemy.current.hp}/{enemy.stats.hp}
                  </p>
                  {enemy.skills.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium">Habilidades</p>
                      {enemy.skills.map((skill) => (
                        <div key={skill.id} className="flex items-center justify-between gap-2 rounded border border-line px-2 py-1">
                          <p className="text-xs text-muted">
                            {skill.name} · {skill.status}
                          </p>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => { setEditingEnemyId(enemy.id); setEditingEnemySkill(skill.id); }}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => removeCombatEnemySkill(enemy.id, skill.id)}
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  onClick={() => removeCombatEnemy(enemy.id)}
                >
                  Remover
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="panel flex items-center justify-between gap-3 p-4">
          <div>
            <p className="font-medium">Fuga contra Boss</p>
            <p className="text-xs text-muted">
              Permite que jogadores tentem fugir de combates contra Bosses.
            </p>
          </div>

          <input
            type="checkbox"
            checked={allowBossEscape}
            onChange={(event) => setAllowBossEscape(event.target.checked)}
          />
        </div>

        <div className="panel flex gap-2 p-4">
          {combatActive ? (
            <Button variant="ghost" onClick={endCombat}>
              Encerrar combate
            </Button>
          ) : (
            <Button
              disabled={Object.keys(combatEnemies).length === 0}
              onClick={startCombat}
            >
              Iniciar combate
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (section === "eventos") {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => {
            setSection(null);
            setEventType(null);
          }}
        >
          ← Menu do Mestre
        </Button>

        <div>
          <h2 className="font-display text-3xl">Eventos</h2>
          <p className="mt-1 text-sm text-muted">
            Sistema central para CTE, emboscadas, escolhas, puzzles e outros acontecimentos.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {EVENT_TYPES.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => setEventType(event.id)}
              className={`panel p-4 text-left transition ${
                eventType === event.id ? "ring-2 ring-line" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                {event.id === "puzzle" ? (
                  <Puzzle className="size-5" />
                ) : (
                  <BellRing className="size-5" />
                )}

                <div>
                  <p className="font-medium">{event.label}</p>
                  <p className="mt-1 text-xs text-muted">{event.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {eventType && (
          <div className="panel space-y-3 p-4">
            <p className="text-sm font-medium">
              Evento selecionado
            </p>

            <p className="text-sm text-muted">
              {EVENT_TYPES.find((event) => event.id === eventType)?.desc}
            </p>

            {eventType === "cte" && (
              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-muted">Tempo de reação (segundos)</span>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={cteTimerMs / 1000}
                    onChange={(e) => setCteTimerMs(Math.max(1, Number(e.target.value) || 1) * 1000)}
                    className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
                  />
                </label>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted">Alvo do CTE</span>
                  <select
                    className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
                    value={cteTarget}
                    onChange={(e) => setCteTarget(e.target.value as "todos" | "especificos")}
                  >
                    <option value="todos">Todos os jogadores</option>
                    <option value="especificos">Jogadores específicos</option>
                  </select>

                  {cteTarget === "especificos" && (
                    <div className="space-y-2 rounded-md border border-line p-3">
                      <span className="text-xs font-medium text-muted">Selecione os jogadores</span>

                      {slots.map((slotId) => {
                        if (!slotId) return null;
                        const character = characters[slotId];
                        if (!character) return null;

                        const selected = cteTargetCharacterIds.includes(character.id);

                        return (
                          <label key={character.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() =>
                                setCteTargetCharacterIds((current) =>
                                  selected
                                    ? current.filter((id) => id !== character.id)
                                    : [...current, character.id],
                                )
                              }
                            />
                            <span>{character.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                if (!eventType) return;

                const event = {
                  id: crypto.randomUUID(),
                  type: eventType as "cte" | "emboscada" | "escolha" | "puzzle" | "teste" | "narrativo",
                  title:
                    EVENT_TYPES.find((item) => item.id === eventType)?.label ??
                    "Evento",
                  description:
                    EVENT_TYPES.find((item) => item.id === eventType)?.desc ??
                    "Evento criado pelo Mestre.",
                  status: "rascunho" as const,
                  createdAt: Date.now(),
                  target: eventType === "cte" ? cteTarget : "todos",
                  targetCharacterIds: eventType === "cte" ? cteTargetCharacterIds : [],
                  ...(eventType === "cte" ? { timerMs: cteTimerMs, cteStatus: "aguardando" as const } : {}),
                };

                createMasterEvent(event);
                activateMasterEvent(event.id);
                setEventType(null);
              }}
            >
              Criar evento
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (section === "economia") {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSection(null)}
        >
          ← Menu do Mestre
        </Button>

        <div>
          <h2 className="font-display text-3xl">Economia</h2>
          <p className="mt-1 text-sm text-muted">
            Recompensas, XP e progressão dos personagens.
          </p>
        </div>

        <div className="panel space-y-4 p-4">
          <div>
            <p className="font-medium">Conceder XP</p>
            <p className="mt-1 text-xs text-muted">
              Escolha um personagem e conceda XP diretamente.
            </p>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted">Personagem</span>
            <select
              className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
              value={xpTargetId}
              onChange={(e) => setXpTargetId(e.target.value)}
            >
              <option value="">Selecione um personagem</option>

              {slots.map((slotId) => {
                if (!slotId) return null;
                const character = characters[slotId];
                if (!character) return null;

                return (
                  <option key={character.id} value={character.id}>
                    {character.name} — Nv. {character.level}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted">Quantidade de XP</span>
            <input
              type="number"
              min="1"
              value={xpAmount}
              onChange={(e) =>
                setXpAmount(Math.max(1, Number(e.target.value) || 1))
              }
              className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
            />
          </label>

          <Button
            disabled={!xpTargetId}
            onClick={() => {
              if (!xpTargetId) return;

              grantXp(xpTargetId, xpAmount);
            }}
          >
            Conceder XP ao jogador
          </Button>
        </div>

      </div>
    );
  }

  if (section === "xp-mestre") {
    if (!masterCharacter) return null;
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSection(null)}>
          ← Menu do Mestre
        </Button>
        <div>
          <h2 className="font-display text-3xl">Personagens do Mestre</h2>
          <p className="mt-1 text-sm text-muted">Gerencie os personagens do Mestre e escolha qual está ativo.</p>
          <Button onClick={() => nav({ to: "/criar" })}>
            Criar novo personagem
          </Button>
        </div>
        {masterCharacter && (
          <div className="panel space-y-4 p-4">
            <div>
              <p className="font-medium">XP do Mestre</p>
              <p className="mt-1 text-xs text-muted">Progressão exclusiva do personagem do Mestre.</p>
            </div>
            <div className="rounded-md border border-line p-3 space-y-3">
              <div>
                <p className="font-medium">{masterCharacter!.name}</p>
                <p className="mt-1 text-xs text-muted">Nível {masterCharacter!.level}</p>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted">Personagem ativo</p>
                <select value={masterCharacter!.id} onChange={(e) => setActiveMasterCharacter(e.target.value)} className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm">
                  {Object.values(characters).filter((character) => character.isMaster).map((character) => (
                    <option key={character.id} value={character.id}>{character.name} — Nível {character.level}</option>
                  ))}
                </select>
              </div>
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted">Quantidade de XP</span>
              <input type="number" min="1" value={masterXpAmount} onChange={(e) => setMasterXpAmount(Math.max(1, Number(e.target.value) || 1))} className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm" />
            </label>
            <Button onClick={() => grantXp(masterCharacter!.id, masterXpAmount)}>
              Conceder XP ao Mestre
            </Button>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted">Quantidade de XP de Brasão</span>
              <input type="number" min="0" value={masterBrasaoAmount} onChange={(e) => setMasterBrasaoAmount(Math.max(0, Number(e.target.value) || 0))} className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm" />
            </label>
            <Button variant="secondary" onClick={() => grantBrasao(masterCharacter!.id, masterBrasaoAmount)}>
              Conceder XP de Brasão ao Mestre
            </Button>
          </div>
        )}
      </div>
    );
  }


  if (section) {
    const current = SECTIONS.find((item) => item.id === section);

    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSection(null)}
        >
          ← Menu do Mestre
        </Button>

        <div className="panel p-6">
          <h2 className="font-display text-3xl">
            {current?.label}
          </h2>

          <p className="mt-2 text-sm text-muted">
            {current?.desc}
          </p>

          <div className="mt-6 rounded-md border border-line p-4">
            <p className="text-sm text-muted">
              Módulo do Mestre preparado para receber as funções desta seção.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] tracking-wide text-muted uppercase">
          Controle da Mesa
        </p>

        <h2 className="font-display text-3xl">
          Menu do Mestre
        </h2>

        <p className="mt-1 text-sm text-muted">
          Controle eventos, jogadores, mundo, combate e sistemas da campanha.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className="panel p-4 text-left transition hover:bg-raised"
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 size-5 shrink-0" />

                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="mt-1 text-xs text-muted">
                    {item.desc}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
