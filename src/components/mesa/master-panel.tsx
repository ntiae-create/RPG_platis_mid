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
import { useState } from "react";
import { usePlatis } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PlayerSlots } from "@/components/mesa/player-slots";
import type { Character } from "@/data/types";

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
  | "jogadores";

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
}: {
  p2pPeers: {
    id: string;
    name: string;
    role: "mestre" | "jogador";
    connectionState: string;
  }[];
  remoteCharacters: Record<string, Character>;
}) {
  const [section, setSection] = useState<MasterSection | null>(null);
  const [eventType, setEventType] = useState<string | null>(null);
  const [cteTimerMs, setCteTimerMs] = useState(3000);
  const [cteTarget, setCteTarget] = useState<"todos" | "especificos">("todos");
  const [cteTargetCharacterIds, setCteTargetCharacterIds] = useState<string[]>([]);

  const createMasterEvent = usePlatis((s) => s.createMasterEvent);
  const activateMasterEvent = usePlatis((s) => s.activateMasterEvent);
  const masterEvents = usePlatis((s) => s.masterEvents);
  const slots = usePlatis((s) => s.slots);
  const characters = usePlatis((s) => s.characters);
  const masterId = usePlatis((s) => s.masterId);
  const grantXp = usePlatis((s) => s.grantXp);

  const [xpTargetId, setXpTargetId] = useState<string>("");
  const [xpAmount, setXpAmount] = useState(100);

  if (section === "jogadores") {
    return (
      <div className="space-y-3">
        <Button
          variant="ghost"
          onClick={() => setSection(null)}
        >
          ← Menu do Mestre
        </Button>

        <PlayerSlots p2pPeers={p2pPeers} remoteCharacters={remoteCharacters} />
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

              {masterId && characters[masterId] && (
                <option value={masterId}>
                  {characters[masterId].name} — Mestre — Nv. {characters[masterId].level}
                </option>
              )}

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
            Conceder XP
          </Button>
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
