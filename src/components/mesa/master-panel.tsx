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

export function MasterPanel() {
  const [section, setSection] = useState<MasterSection | null>(null);
  const [eventType, setEventType] = useState<string | null>(null);

  const createMasterEvent = usePlatis((s) => s.createMasterEvent);
  const masterEvents = usePlatis((s) => s.masterEvents);

  if (section === "jogadores") {
    return (
      <div className="space-y-3">
        <Button
          variant="ghost"
          onClick={() => setSection(null)}
        >
          ← Menu do Mestre
        </Button>

        <PlayerSlots />
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
                  targetCharacterIds: [],
                };

                createMasterEvent(event);
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
