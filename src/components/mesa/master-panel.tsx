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
import { SKILL_COMMANDS, SKILL_COMMAND_CATEGORIES } from "@/data/skill-commands";
import { STATUS_EFFECTS } from "@/data/types";
import { RACES } from "@/data/races";
import { CLASSES } from "@/data/classes";
import { AFFINITIES } from "@/data/affinities";
import { createCharacter } from "@/lib/stats";
import { Button } from "@/components/ui/button";
import { PlayerSlots } from "@/components/mesa/player-slots";
import type { Character, Skill, InventoryItem } from "@/data/types"

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
  { id: "comunicacao", label: "Comandos de habilidades", icon: MessageCircle, desc: "Catálogo, sintaxe e efeitos das habilidades." },
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
  initialSection,
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
  initialSection?: MasterSection;
}) {
  const [skillCommandSearch, setSkillCommandSearch] = useState("");
  const [skillCommandCategory, setSkillCommandCategory] = useState("todas");
  const [skillCommandFormName, setSkillCommandFormName] = useState("");
  const [skillCommandFormCategory, setSkillCommandFormCategory] = useState<"dano" | "debuff" | "buff" | "cura" | "controle" | "utilidade">("dano");
  const [skillCommandFormDescription, setSkillCommandFormDescription] = useState("");
  const [skillCommandFormSyntax, setSkillCommandFormSyntax] = useState("");
  const [skillCommandFormParameters, setSkillCommandFormParameters] = useState("");
  const [skillCommandFormStatus, setSkillCommandFormStatus] = useState<"documentado" | "planejado">("planejado");
  const [skillCommandFormOpen, setSkillCommandFormOpen] = useState(false);
  const [customSkillCommands, setCustomSkillCommands] = useState<typeof SKILL_COMMANDS>(() => {
    try {
      const saved = localStorage.getItem("platis-custom-skill-commands");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [section, setSection] = useState<MasterSection | null>(initialSection ?? null);
  const [npcName, setNpcName] = useState("");
  const [npcGender, setNpcGender] = useState<"masculino" | "feminino">("masculino");
  const [npcRaceId, setNpcRaceId] = useState(RACES[0]?.id ?? "humano");
  const [npcClassId, setNpcClassId] = useState(CLASSES[0]?.id ?? "");
  const [npcAffinityId, setNpcAffinityId] = useState<import("@/data/types").AffinityId>("fisico");
  const [npcImage, setNpcImage] = useState("");
  const [npcPassiveName, setNpcPassiveName] = useState("");
  const [npcPassiveDescription, setNpcPassiveDescription] = useState("");
  const [editingNpcId, setEditingNpcId] = useState<string | null>(null);
  const [npcXpAmount, setNpcXpAmount] = useState("100");
  const [questTitle, setQuestTitle] = useState("");
  const [questDescription, setQuestDescription] = useState("");
  const [questObjective, setQuestObjective] = useState("");
  const [questDifficulty, setQuestDifficulty] = useState("Normal");
  const [questXp, setQuestXp] = useState("100");
  const [questBrasao, setQuestBrasao] = useState("0");
  const [questBronze, setQuestBronze] = useState("0");
  const [questSilver, setQuestSilver] = useState("0");
  const [questGold, setQuestGold] = useState("0");
  const [questPlatinum, setQuestPlatinum] = useState("0");
  const quests = usePlatis((s) => s.quests);
  const createQuest = usePlatis((s) => s.createQuest);
  const updateQuest = usePlatis((s) => s.updateQuest);
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
  const npcs = usePlatis((s) => s.npcs);
  const createNpc = usePlatis((s) => s.createNpc);
  const updateNpc = usePlatis((s) => s.updateNpc);
  const removeNpc = usePlatis((s) => s.removeNpc);
  const grantNpcXp = usePlatis((s) => s.grantNpcXp);
  const publishCharacterAsNpc = usePlatis((s) => s.publishCharacterAsNpc);
  const grantItem = usePlatis((s) => s.grantItem);
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
  const applyCombatStatusEffect = usePlatis((s) => s.applyCombatStatusEffect);
  const combatMode = usePlatis((s) => s.combatMode);
  const [effectCommandTarget, setEffectCommandTarget] = useState("");
  const [effectCommandText, setEffectCommandText] = useState("");
  const [effectCommandResult, setEffectCommandResult] = useState("");

  const allowBossEscape = usePlatis((s) => s.allowBossEscape);
  const setAllowBossEscape = usePlatis((s) => s.setAllowBossEscape);
  const masterId = usePlatis((s) => s.masterId);
  const setActiveMasterCharacter = usePlatis((s) => s.setActiveMasterCharacter);
  const grantXp = usePlatis((s) => s.grantXp);
  const grantBrasao = usePlatis((s) => s.grantBrasaoXp);
  const masterCharacter = masterId ? characters[masterId] : Object.values(characters).find((character) => character.isMaster);

  const [itemFormName, setItemFormName] = useState("");
  const [itemFormRarity, setItemFormRarity] = useState<InventoryItem["rarity"]>("R");
  const [itemFormCategory, setItemFormCategory] = useState("consumível");
  const [itemFormSlot, setItemFormSlot] = useState<InventoryItem["slot"] | "">("");
  const [itemFormEffect, setItemFormEffect] = useState("");
  const [itemFormDesc, setItemFormDesc] = useState("");
  const [itemFormPrice, setItemFormPrice] = useState(0);
  const [itemFormTarget, setItemFormTarget] = useState("");
  const [potionAmount, setPotionAmount] = useState(25);
  const [itemFormBonus, setItemFormBonus] = useState({hp:0,mp:0,est:0,san:0,atk:0,atkMgc:0,def:0,res:0,agi:0,int:0});
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

  if (section === "npcs") {
    const resetNpcForm = () => {
      setEditingNpcId(null);
      setNpcName("");
      setNpcGender("masculino");
      setNpcRaceId(RACES[0]?.id ?? "humano");
      setNpcClassId(CLASSES[0]?.id ?? "");
      setNpcAffinityId("fisico");
      setNpcImage("");
      setNpcPassiveName("");
      setNpcPassiveDescription("");
    };

    const saveNpc = () => {
      if (!npcName.trim() || !npcRaceId || !npcClassId) {
        window.alert("Preencha o nome, a raça e a classe do NPC.");
        return;
      }
      const base = createCharacter({
        name: npcName.trim(),
        gender: npcGender,
        raceId: npcRaceId,
        classId: npcClassId,
        affinityId: npcAffinityId,
        ...(npcImage.trim() ? { image: npcImage.trim() } : {}),
      });
      const passive = {
        name: npcPassiveName.trim(),
        description: npcPassiveDescription.trim(),
        stacks: 0,
      };
      if (editingNpcId && npcs[editingNpcId]) {
        const old = npcs[editingNpcId];
        updateNpc(editingNpcId, {
          ...base,
          id: editingNpcId,
          level: old.level,
          xp: old.xp,
          brasaoXp: old.brasaoXp,
          attrPoints: old.attrPoints,
          poolPoints: old.poolPoints,
          allocated: old.allocated,
          current: old.current,
          skills: old.skills,
          inventory: old.inventory,
          equipment: old.equipment,
          currency: old.currency,
          position: old.position,
          personalPassive: passive,
          isMaster: false,
        });
      } else {
        const id = "npc-" + Date.now() + "-" + Math.random().toString(36).slice(2,8);
        createNpc({ ...base, id, personalPassive: passive, isMaster: false });
      }
      resetNpcForm();
    };

    const editNpc = (npc: Character) => {
      setEditingNpcId(npc.id);
      setNpcName(npc.name);
      setNpcGender(npc.gender);
      setNpcRaceId(npc.raceId);
      setNpcClassId(npc.classId);
      setNpcAffinityId(npc.affinityId);
      setNpcImage(npc.image ?? "");
      setNpcPassiveName(npc.personalPassive?.name ?? "");
      setNpcPassiveDescription(npc.personalPassive?.description ?? "");
    };

    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSection(null)}>← Menu do Mestre</Button>
        <div className="panel space-y-3 p-4">
          <h2 className="font-display text-2xl">{editingNpcId ? "Editar NPC" : "Criar NPC"}</h2>
          <label className="block text-sm">Nome
            <input className="mt-1 w-full rounded-md border border-line bg-bg p-2" value={npcName} onChange={(e) => setNpcName(e.target.value)} placeholder="Nome do NPC" />
          </label>
          <label className="block text-sm">Gênero
            <select className="mt-1 w-full rounded-md border border-line bg-bg p-2" value={npcGender} onChange={(e) => setNpcGender(e.target.value as "masculino" | "feminino")}>
              <option value="masculino">Masculino</option><option value="feminino">Feminino</option>
            </select>
          </label>
          <label className="block text-sm">Raça
            <select className="mt-1 w-full rounded-md border border-line bg-bg p-2" value={npcRaceId} onChange={(e) => setNpcRaceId(e.target.value)}>
              {RACES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label className="block text-sm">Classe
            <select className="mt-1 w-full rounded-md border border-line bg-bg p-2" value={npcClassId} onChange={(e) => setNpcClassId(e.target.value)}>
              {CLASSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block text-sm">Afinidade
            <select className="mt-1 w-full rounded-md border border-line bg-bg p-2" value={npcAffinityId} onChange={(e) => setNpcAffinityId(e.target.value as import("@/data/types").AffinityId)}>
              {AFFINITIES.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <label className="block text-sm">Imagem (URL ou caminho do arquivo)
            <input className="mt-1 w-full rounded-md border border-line bg-bg p-2" value={npcImage} onChange={(e) => setNpcImage(e.target.value)} placeholder="/portraits/npc.png" />
          </label>
          <label className="block text-sm">Passiva pessoal
            <input className="mt-1 w-full rounded-md border border-line bg-bg p-2" value={npcPassiveName} onChange={(e) => setNpcPassiveName(e.target.value)} placeholder="Nome da passiva" />
          </label>
          <label className="block text-sm">Descrição da passiva
            <textarea className="mt-1 w-full rounded-md border border-line bg-bg p-2" value={npcPassiveDescription} onChange={(e) => setNpcPassiveDescription(e.target.value)} placeholder="Descreva o efeito da passiva" rows={3} />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveNpc}>{editingNpcId ? "Salvar alterações" : "Criar NPC"}</Button>
            {editingNpcId && <Button variant="secondary" onClick={resetNpcForm}>Cancelar edição</Button>}
          </div>
        </div>
        <div className="panel space-y-3 p-4">
          <h2 className="font-display text-2xl">Enviar personagem do Mestre como NPC</h2>
          <p className="text-sm text-muted">A ficha original será preservada e continuará vinculada ao NPC.</p>
          {Object.values(characters).filter((c) => c.isMaster && !npcs[c.id]).length === 0 ? (
            <p className="text-sm text-muted">Nenhum personagem disponível para enviar.</p>
          ) : Object.values(characters).filter((c) => c.isMaster && !npcs[c.id]).map((character) => (
            <div key={character.id} className="flex items-center gap-3 rounded-md border border-line p-3">
              {character.image && <img src={character.image} alt={character.name} className="h-12 w-12 rounded-md object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{character.name}</p>
                <p className="text-xs text-muted">Nível {character.level}</p>
              </div>
              <Button onClick={() => publishCharacterAsNpc(character.id)}>Enviar como NPC</Button>
            </div>
          ))}
        </div>
        <div className="panel space-y-3 p-4">
          <h2 className="font-display text-2xl">NPCs cadastrados ({Object.keys(npcs).length})</h2>
          {Object.values(npcs).length === 0 && <p className="text-sm text-muted">Nenhum NPC cadastrado ainda.</p>}
          {Object.values(npcs).map((npc) => (
            <div key={npc.id} className="rounded-md border border-line p-3">
              <div className="flex items-start gap-3">
                {npc.image && <img src={npc.image} alt={npc.name} className="h-16 w-16 rounded-md object-cover" />}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{npc.name}</h3>
                  <p className="text-sm text-muted">Nível {npc.level} · XP {npc.xp}</p>
                  <p className="text-sm">{RACES.find((r) => r.id === npc.raceId)?.name ?? npc.raceId} · {CLASSES.find((c) => c.id === npc.classId)?.name ?? npc.classId}</p>
                  {npc.personalPassive?.name && <p className="mt-1 text-sm">Passiva: {npc.personalPassive.name}</p>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {npc.npcSourceCharacterId ? <span className="self-center text-xs text-muted">Edite pela ficha original</span> : <Button variant="secondary" onClick={() => editNpc(npc)}>Editar</Button>}
                <input aria-label="Quantidade de XP" className="w-24 rounded-md border border-line bg-bg p-2" type="number" min="1" value={npcXpAmount} onChange={(e) => setNpcXpAmount(e.target.value)} />
                <Button variant="secondary" onClick={() => grantNpcXp(npc.id, Number(npcXpAmount))}>Adicionar XP</Button>
                <Button variant="danger" onClick={() => { const msg = npc.npcSourceCharacterId ? "Remover " + npc.name + " dos NPCs? A ficha original será mantida." : "Excluir o NPC " + npc.name + "?"; if (window.confirm(msg)) { removeNpc(npc.id); if (editingNpcId === npc.id) resetNpcForm(); } }}>{npc.npcSourceCharacterId ? "Remover dos NPCs" : "Excluir"}</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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

  if (section === "missoes") {
    const field = "w-full rounded-md border border-line bg-panel p-3 text-sm";
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSection(null)}>← Menu do Mestre</Button>
        <div>
          <h2 className="font-display text-3xl">Quadro de Missões</h2>
          <p className="text-sm text-muted">Crie cartazes e publique objetivos para os jogadores.</p>
        </div>
        <form className="panel space-y-3 p-4" onSubmit={(e) => {
          e.preventDefault();
          if (!questTitle.trim() || !questDescription.trim() || !questObjective.trim()) return;
          createQuest({
            id: crypto.randomUUID(), title: questTitle.trim(),
            description: questDescription.trim(), objective: questObjective.trim(),
            difficulty: questDifficulty, status: "publicada", createdAt: Date.now(),
            reward: {
              xp: Math.max(0, Number(questXp) || 0),
              brasao: Math.max(0, Number(questBrasao) || 0),
              bronze: Math.max(0, Number(questBronze) || 0),
              silver: Math.max(0, Number(questSilver) || 0),
              gold: Math.max(0, Number(questGold) || 0),
              platinum: Math.max(0, Number(questPlatinum) || 0),
            }, participations: []
          });
          setQuestTitle(""); setQuestDescription(""); setQuestObjective("");
        }}>
          <h3 className="font-semibold">Criar cartaz</h3>
          <input className={field} placeholder="Título da missão" value={questTitle} onChange={(e) => setQuestTitle(e.target.value)} />
          <textarea className={field} placeholder="Descrição e contexto" value={questDescription} onChange={(e) => setQuestDescription(e.target.value)} />
          <textarea className={field} placeholder="Objetivo a cumprir" value={questObjective} onChange={(e) => setQuestObjective(e.target.value)} />
          <div className="space-y-2">
            <label className="block text-sm font-medium">Dificuldade da missão</label>
            <select className={field} value={questDifficulty} onChange={(e) => setQuestDifficulty(e.target.value)}>
              <option>Fácil</option>
              <option>Normal</option>
              <option>Difícil</option>
              <option>Extrema</option>
              <option>Lendária</option>
            </select>
            <p className="text-xs text-muted">Escolha o nível de desafio que os jogadores enfrentarão.</p>
          </div>

          <div className="space-y-3 rounded-lg border border-line p-3">
            <h4 className="font-semibold">Recompensas da missão</h4>
            <p className="text-sm text-muted">Defina quanto cada personagem que aceitou a missão receberá quando o Mestre a concluir. Use 0 para não entregar uma recompensa daquele tipo.</p>

            <div className="space-y-1">
              <label className="block text-sm font-medium">Experiência do personagem (XP)</label>
              <input className={field} type="number" min="0" placeholder="Quantidade de XP" value={questXp} onChange={(e) => setQuestXp(e.target.value)} />
              <p className="text-xs text-muted">Ajuda o personagem a progredir normalmente.</p>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">Experiência do Brasão (XP de Brasão)</label>
              <input className={field} type="number" min="0" placeholder="Quantidade de XP de Brasão" value={questBrasao} onChange={(e) => setQuestBrasao(e.target.value)} />
              <p className="text-xs text-muted">Avança a progressão do Brasão, separadamente da experiência normal.</p>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">Moedas de Bronze</label>
              <input className={field} type="number" min="0" placeholder="Quantidade de moedas de Bronze" value={questBronze} onChange={(e) => setQuestBronze(e.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">Moedas de Prata</label>
              <input className={field} type="number" min="0" placeholder="Quantidade de moedas de Prata" value={questSilver} onChange={(e) => setQuestSilver(e.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">Moedas de Ouro</label>
              <input className={field} type="number" min="0" placeholder="Quantidade de moedas de Ouro" value={questGold} onChange={(e) => setQuestGold(e.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">Moedas de Platina</label>
              <input className={field} type="number" min="0" placeholder="Quantidade de moedas de Platina" value={questPlatinum} onChange={(e) => setQuestPlatinum(e.target.value)} />
            </div>
          </div>
          <Button type="submit">Publicar missão</Button>
        </form>
        <div className="space-y-3">
          <h3 className="font-semibold">Cartazes publicados</h3>
          {quests.length === 0 && <p className="text-sm text-muted">Nenhuma missão criada ainda.</p>}
          {quests.map((q) => (
            <article key={q.id} className="panel space-y-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{q.title}</h3>
                <span className="text-xs text-muted">{q.difficulty} · {q.status}</span>
              </div>
              <p className="text-sm">{q.description}</p>
              <p className="text-sm"><strong>Objetivo:</strong> {q.objective}</p>
              <p className="text-xs text-muted">Recompensa: {q.reward.xp ?? 0} XP · Participantes: {q.participations.filter((x) => x.status === "aceita").length}</p>
              <div className="mt-3 space-y-2 rounded-lg border border-line p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Participantes</p>
                {q.participations.length === 0 ? (
                  <p className="text-sm text-muted">Nenhum jogador respondeu ainda.</p>
                ) : q.participations.map((p) => {
                  const character = characters[p.characterId] ?? Object.values(remoteCharacters).find((c) => c.id === p.characterId);
                  const statusLabel = p.status === "aceita" ? "Aceitou" : p.status === "recusada" ? "Recusou" : "Concluiu";
                  return (
                    <div key={p.characterId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span>{character?.name ?? "Personagem"} </span>
                      <span className="text-muted">{statusLabel}{p.rewardedAt ? " · Recompensa entregue" : ""}</span>
                    </div>
                  );
                })}
              </div>
              {q.status === "rascunho" && <Button onClick={() => updateQuest(q.id, { status: "publicada" })}>Publicar</Button>}
              {q.status === "publicada" && <Button onClick={() => {
                const state = usePlatis.getState();
                const pending = q.participations.filter((p) => p.status === "aceita" && !p.rewardedAt);
                const missing = pending.filter((p) =>
                  !state.characters[p.characterId] &&
                  !Object.values(remoteCharacters).some((c) => c.id === p.characterId)
                );
                if (missing.length > 0) {
                  window.alert("Não foi possível entregar as recompensas: há personagem(ns) indisponível(is). Peça para o(s) jogador(es) reconectar(em) e tente novamente.");
                  return;
                }
                for (const p of pending) {
                  const remoteCharacter = Object.values(remoteCharacters).find((c) => c.id === p.characterId);
                  if (!usePlatis.getState().characters[p.characterId] && remoteCharacter) {
                    usePlatis.getState().addCharacter(remoteCharacter, false);
                  }
                }
                const eligible = usePlatis.getState().completeQuestAndReward(q.id);
                const reward = q.reward;
                for (const characterId of eligible) {
                  const remoteCharacter = Object.values(remoteCharacters).find((c) => c.id === characterId);
                  if (!usePlatis.getState().characters[characterId] && remoteCharacter) {
                    usePlatis.getState().addCharacter(remoteCharacter, false);
                  }
                  if (reward.xp) grantXp(characterId, reward.xp);
                  if (reward.brasao) grantBrasao(characterId, reward.brasao);
                  const character = usePlatis.getState().characters[characterId];
                  if (character && (reward.bronze || reward.silver || reward.gold || reward.platinum)) {
                    usePlatis.getState().patchCharacter(characterId, {
                      currency: {
                        ...character.currency,
                        bronze: character.currency.bronze + (reward.bronze ?? 0),
                        silver: character.currency.silver + (reward.silver ?? 0),
                        gold: character.currency.gold + (reward.gold ?? 0),
                        platinum: character.currency.platinum + (reward.platinum ?? 0),
                      },
                    });
                  }
                  const updated = usePlatis.getState().characters[characterId];
                  if (updated) onPatchRemoteCharacter(characterId, updated);
                }
                usePlatis.getState().updateQuest(q.id, {
                  status: "concluida",
                  completedAt: Date.now(),
                  participations: usePlatis.getState().quests
                    .find((quest) => quest.id === q.id)!
                    .participations.map((p) =>
                      eligible.includes(p.characterId) && p.status === "aceita"
                        ? {
                            ...p,
                            status: "concluida" as const,
                            rewardedAt: Date.now(),
                            rewardSnapshot: { ...reward },
                          }
                        : p
                    ),
                });
              }}>Concluir missão e entregar recompensas</Button>}
              {q.status === "publicada" && <Button variant="ghost" onClick={() => updateQuest(q.id, { status: "cancelada" })}>Cancelar missão</Button>}
            </article>
          ))}
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

  if (section === "itens") {
    const bonusKeys = ["hp","mp","est","san","atk","atkMgc","def","res","agi","int"] as const;
    const potionTypes = [
      { stat: "hp", name: "Poção de HP", desc: "Recupera pontos de vida." },
      { stat: "mp", name: "Poção de MP", desc: "Recupera pontos de mana." },
      { stat: "est", name: "Poção de Estamina", desc: "Recupera pontos de estamina." },
      { stat: "san", name: "Poção de Sanidade", desc: "Recupera pontos de sanidade." },
    ] as const;
    const createPotion = (potion: typeof potionTypes[number]) => {
      if (!itemFormTarget || potionAmount < 1) return;
      grantItem(itemFormTarget, {
        id: "potion-" + crypto.randomUUID(),
        name: potion.name,
        rarity: "R",
        category: "consumível",
        effect: `potion:${potion.stat}:${Math.floor(potionAmount)}`,
        desc: `${potion.desc} Recupera até ${Math.floor(potionAmount)} pontos por uso.`,
        price: 0,
        qty: 1,
      });
    };
    const createItem = () => {
      if (!itemFormName.trim() || !itemFormTarget) return;
      const bonus = Object.fromEntries(bonusKeys.filter((k) => itemFormBonus[k] !== 0).map((k) => [k,itemFormBonus[k]])) as InventoryItem["bonus"];
      grantItem(itemFormTarget, {
        id: "item-" + Date.now(),
        name: itemFormName.trim(),
        rarity: itemFormRarity,
        category: itemFormCategory,
        slot: itemFormSlot || undefined,
        effect: itemFormEffect.trim() || undefined,
        desc: itemFormDesc.trim() || itemFormName.trim(),
        price: Math.max(0,itemFormPrice),
        qty: 1,
        bonus,
      });
      setItemFormName("");
      setItemFormEffect("");
      setItemFormDesc("");
      setItemFormPrice(0);
      setItemFormBonus({hp:0,mp:0,est:0,san:0,atk:0,atkMgc:0,def:0,res:0,agi:0,int:0});
    };
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSection(null)}>← Menu do Mestre</Button>
        <div>
          <h2 className="font-display text-3xl">Itens e Inventário</h2>
          <p className="mt-1 text-sm text-muted">Crie itens e entregue diretamente aos personagens.</p>
        </div>
        <div className="panel space-y-4 p-4">
          <h3 className="font-medium">Poções de recuperação</h3>
          <p className="text-xs text-muted">Escolha o personagem, defina a recuperação e entregue a poção.</p>
          <label className="block space-y-1">
            <span className="text-xs text-muted">Entregar poção para</span>
            <select className="w-full min-w-0 rounded-md border border-line bg-bg px-3 py-3 text-sm" value={itemFormTarget} onChange={(e) => setItemFormTarget(e.target.value)}>
              <option value="">Selecione um personagem</option>
              {slots.map((id) => {
                if (!id) return null;
                const ch = characters[id];
                if (!ch) return null;
                return <option key={ch.id} value={ch.id}>{ch.name} — Nv. {ch.level}</option>;
              })}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-muted">Pontos recuperados por uso</span>
            <input type="number" min="1" step="1" className="w-full min-w-0 rounded-md border border-line bg-bg px-3 py-3 text-base" value={potionAmount} onChange={(e) => setPotionAmount(Math.max(1, Math.floor(Number(e.target.value) || 1)))} />
          </label>
          <div className="flex flex-col gap-2">
            {potionTypes.map((potion) => (
              <Button className="w-full min-w-0 whitespace-normal py-3 text-center" key={potion.stat} variant="secondary" disabled={!itemFormTarget} onClick={() => createPotion(potion)}>
                Entregar {potion.name}
              </Button>
            ))}
          </div>
        </div>
        <div className="panel space-y-4 p-4">
          <label className="block space-y-1">
            <span className="text-xs text-muted">Nome do item</span>
            <input className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm" value={itemFormName} onChange={(e) => setItemFormName(e.target.value)} placeholder="Nome do item" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs text-muted">Raridade</span>
              <select className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm" value={itemFormRarity} onChange={(e) => setItemFormRarity(e.target.value as InventoryItem["rarity"])}>
                {["R","SR","SSR","UR","UR MÁX.","LR","LR EXTRA"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-muted">Categoria</span>
              <select className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm" value={itemFormCategory} onChange={(e) => setItemFormCategory(e.target.value)}>
                {["consumível","arma","armadura","acessório","material","missão","especial","outro"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs text-muted">Descrição</span>
            <textarea className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm" value={itemFormDesc} onChange={(e) => setItemFormDesc(e.target.value)} placeholder="Descrição do item" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-muted">Slot de equipamento</span>
            <select className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm" value={itemFormSlot} onChange={(e) => setItemFormSlot(e.target.value as InventoryItem["slot"] | "")}>
              <option value="">Sem slot</option>
              {["arma","armadura","botas","reliquia","colar"].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <p className="text-sm font-medium">Bônus de atributos</p>
          <div className="grid grid-cols-2 gap-3">
            {bonusKeys.map((k) => <label key={k} className="block space-y-1"><span className="text-xs text-muted">{k === "atkMgc" ? "Ataque mágico" : k.toUpperCase()}</span><input type="number" className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm" value={itemFormBonus[k]} onChange={(e) => setItemFormBonus((old) => ({...old,[k]:Number(e.target.value)||0}))} /></label>)}
          </div>
          <label className="block space-y-1">
            <span className="text-xs text-muted">Efeito especial</span>
            <textarea className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm" value={itemFormEffect} onChange={(e) => setItemFormEffect(e.target.value)} placeholder="Efeito do item" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-muted">Preço</span>
            <input type="number" min="0" className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm" value={itemFormPrice} onChange={(e) => setItemFormPrice(Math.max(0,Number(e.target.value)||0))} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-muted">Entregar para</span>
            <select className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm" value={itemFormTarget} onChange={(e) => setItemFormTarget(e.target.value)}>
              <option value="">Selecione um personagem</option>
              {slots.map((id) => { if (!id) return null; const ch = characters[id]; if (!ch) return null; return <option key={ch.id} value={ch.id}>{ch.name} — Nv. {ch.level}</option>; })}
            </select>
          </label>
          <Button onClick={createItem} disabled={!itemFormName.trim() || !itemFormTarget}>Criar e entregar item</Button>
        </div>
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


  if (section === "comunicacao") {
    const allSkillCommands = [...SKILL_COMMANDS, ...customSkillCommands];
    const query = skillCommandSearch.trim().toLocaleLowerCase("pt-BR");
    const filteredCommands = allSkillCommands.filter((item) => {
      const matchesCategory =
        skillCommandCategory === "todas" || item.category === skillCommandCategory;
      const searchable = [
        item.command,
        item.syntax,
        item.description,
        ...item.parameters,
      ].join(" ").toLocaleLowerCase("pt-BR");
      return matchesCategory && searchable.includes(query);
    });

    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSection(null)}>
          ← Menu do Mestre
        </Button>

        <div className="panel space-y-4 p-4">
          <div>
            <h2 className="font-display text-2xl">Catálogo de comandos</h2>
            <p className="mt-1 text-sm text-muted">
              Referência oficial para escrever efeitos de habilidades. Copiar um comando
              não o executa no combate.
            </p>
          </div>

          <div className="rounded-lg border border-line p-3 space-y-3">
            <h3 className="font-semibold">Executar efeito no combate</h3>
            <p className="text-sm text-muted">Aplica um efeito de status ao participante selecionado durante um combate normal.</p>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted">Alvo</span>
              <select value={effectCommandTarget} onChange={(e) => setEffectCommandTarget(e.target.value)} className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm">
                <option value="">Selecione um participante</option>
                {combatParticipants.map((id) => {
                  const fighter = characters[id] ?? combatEnemies[id];
                  return fighter ? <option key={id} value={id}>{fighter.name}</option> : null;
                })}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted">Comando</span>
              <input value={effectCommandText} onChange={(e) => setEffectCommandText(e.target.value)} placeholder="/sangramento, /veneno, /atordoamento..." className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm" />
            </label>
            <Button onClick={() => {
              if (!combatActive || combatMode !== "normal") {
                setEffectCommandResult("Inicie um combate normal antes de executar comandos.");
                return;
              }
              if (!effectCommandTarget || !combatParticipants.includes(effectCommandTarget)) {
                setEffectCommandResult("Selecione um alvo participante do combate.");
                return;
              }
              const raw = effectCommandText.trim().toLocaleLowerCase("pt-BR").split(/\s+/)[0].replace(/^\//, "");
              const aliases: Record<string, string> = {
                sangramento: "bleeding", bleeding: "bleeding",
                atordoamento: "stun", stun: "stun",
                congelamento: "freeze", congelar: "freeze", freeze: "freeze",
                frio: "cold", cold: "cold",
                lentidão: "slow", lentidao: "slow", slow: "slow",
                infectar: "infect", infeccao: "infect", infect: "infect",
                queimadura: "burn", queimar: "burn", burn: "burn",
                cegueira: "blind", blind: "blind",
                fraqueza: "weakness", weakness: "weakness",
                cancelamento: "cancel", cancel: "cancel",
                imobilizacao: "immobilize", immobilize: "immobilize",
                molhado: "wet", wet: "wet",
                fortalecimento: "strengthening", strengthening: "strengthening",
                defensor: "defender", defender: "defender",
                agil: "agile", agile: "agile",
                regeneracao: "regeneration", regeneration: "regeneration",
                limpeza: "clean", clean: "clean",
                veneno: "poison", envenenamento: "poison", poison: "poison",
                explosao: "explosion", explosion: "explosion",
                fio_de_seda: "silk_thread", "fio-de-seda": "silk_thread"
              };
              const effectId = aliases[raw];
              const definition = effectId ? STATUS_EFFECTS[effectId] : undefined;
              if (!effectId || !definition) {
                setEffectCommandResult("Comando desconhecido. Confira o nome do efeito.");
                return;
              }
              const durations: Record<string, number> = {
                bleeding: 2, stun: 1, freeze: 1, cold: 2, slow: 2,
                infect: 1, burn: 3, blind: 1, weakness: 2, cancel: 1,
                immobilize: 1, strengthening: 2, defender: 2, agile: 2,
                regeneration: 2, clean: 1, poison: 2, explosion: 1,
                silk_thread: 2, wet: 1
              };
              const ok = applyCombatStatusEffect(effectId, effectCommandTarget, {
                duration: durations[effectId] ?? 1,
                sourceId: masterId ?? undefined
              });
              const fighter = characters[effectCommandTarget] ?? combatEnemies[effectCommandTarget];
              setEffectCommandResult(ok
                ? definition.name + " aplicado em " + (fighter?.name ?? "alvo") + "."
     : "Falha ao aplicar. Confira o alvo e o modo de combate.");
            }}>Executar comando</Button>
            {effectCommandResult && <p role="status" className="text-sm">{effectCommandResult}</p>}
          </div>

          <div className="rounded-lg border border-line p-3 space-y-3">
            <Button
              variant="secondary"
              onClick={() => setSkillCommandFormOpen((open) => !open)}
            >
              {skillCommandFormOpen ? "Cancelar" : "+ Adicionar comando"}
            </Button>

            {skillCommandFormOpen && (
              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-muted">Nome do comando</span>
                  <input
                    value={skillCommandFormName}
                    onChange={(event) => setSkillCommandFormName(event.target.value)}
                    placeholder="Ex.: Cura percentual"
                    className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-muted">Categoria</span>
                  <select
                    value={skillCommandFormCategory}
                    onChange={(event) => setSkillCommandFormCategory(event.target.value as typeof skillCommandFormCategory)}
                    className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
                  >
                    {SKILL_COMMAND_CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>{category.label}</option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-muted">Sintaxe</span>
                  <input value={skillCommandFormSyntax} onChange={(event) => setSkillCommandFormSyntax(event.target.value)} placeholder="/cura 25%" className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm" />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-muted">Descrição do efeito</span>
                  <textarea value={skillCommandFormDescription} onChange={(event) => setSkillCommandFormDescription(event.target.value)} placeholder="Explique o efeito..." rows={3} className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm" />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-muted">Parâmetros (separados por vírgula)</span>
                  <input value={skillCommandFormParameters} onChange={(event) => setSkillCommandFormParameters(event.target.value)} placeholder="porcentagem, alvo, duração" className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm" />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-muted">Estado</span>
                  <select value={skillCommandFormStatus} onChange={(event) => setSkillCommandFormStatus(event.target.value as typeof skillCommandFormStatus)} className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm">
                    <option value="planejado">Planejado</option>
                    <option value="documentado">Documentado</option>
                  </select>
                </label>
                <Button onClick={() => {
                  const name = skillCommandFormName.trim();
                  const syntax = skillCommandFormSyntax.trim();
                  const description = skillCommandFormDescription.trim();
                  if (!name || !syntax || !description) {
                    alert("Preencha o nome, a sintaxe e a descrição.");
                    return;
                  }
                  const updated = [...customSkillCommands, {
                    command: name,
                    category: skillCommandFormCategory,
                    syntax,
                    description,
                    parameters: skillCommandFormParameters.split(",").map((value) => value.trim()).filter(Boolean),
                    status: skillCommandFormStatus,
                  }];
                  try {
                    localStorage.setItem("platis-custom-skill-commands", JSON.stringify(updated));
                    setCustomSkillCommands(updated);
                    setSkillCommandFormName("");
                    setSkillCommandFormSyntax("");
                    setSkillCommandFormDescription("");
                    setSkillCommandFormParameters("");
                    setSkillCommandFormStatus("planejado");
                    setSkillCommandFormOpen(false);
                  } catch {
                    alert("Não foi possível salvar o comando neste dispositivo.");
                  }
                }}>
                  Salvar comando
                </Button>
              </div>
            )}
          </div>


          <input
            type="search"
            value={skillCommandSearch}
            onChange={(event) => setSkillCommandSearch(event.target.value)}
            placeholder="Buscar comando, efeito ou parâmetro..."
            aria-label="Buscar comandos de habilidades"
            className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
          />

          <label className="block space-y-1">
            <span className="text-xs font-medium text-muted">Categoria</span>
            <select
              value={skillCommandCategory}
              onChange={(event) => setSkillCommandCategory(event.target.value)}
              className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
            >
              <option value="todas">Todas as categorias</option>
              {SKILL_COMMAND_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <p className="text-xs text-muted">
            {filteredCommands.length} comando(s) encontrado(s)
          </p>

          <div className="space-y-3">
            {filteredCommands.map((item) => (
              <article key={item.command} className="rounded-md border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{item.command}</h3>
                  <span className="rounded border border-line px-2 py-1 text-xs text-muted">
                    {item.status === "planejado" ? "Planejado" : "Documentado"}
                  </span>
                </div>

                <p className="mt-2 text-sm">{item.description}</p>

                <div className="mt-3 rounded-md bg-bg p-3">
                  <code className="break-all text-sm">
                    {item.syntax.split(/(\/\/[\w-]+|\/[\w-]+|\[[^\]]*\]|\{[^}]*\}|\b\d+(?:\.\d+)?%)/g).filter(Boolean).map((part, index) => {
                      let color = "text-foreground";
                      if (part.startsWith("/")) color = "text-sky-400 font-semibold";
                      else if (part.startsWith("[") && part.endsWith("]")) color = "text-amber-400";
                      else if (part.startsWith("{") && part.endsWith("}")) color = "text-violet-400";
                      else if (/^\d+(?:\.\d+)?%$/.test(part)) color = "text-emerald-400 font-semibold";
                      return <span key={index} className={color}>{part}</span>;
                    })}
                  </code>
                  <div className="mt-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        void navigator.clipboard?.writeText(item.syntax);
                      }}
                    >
                      Copiar sintaxe
                    </Button>
                  </div>
                </div>

                <p className="mt-2 text-xs text-muted">
                  Parâmetros: {item.parameters.join(", ")}
                </p>
              </article>
            ))}

           {filteredCommands.length === 0 && (
              <p className="rounded-md border border-line p-4 text-sm text-muted">
                Nenhum comando corresponde à busca.
              </p>
            )}
          </div>
        </div>
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
