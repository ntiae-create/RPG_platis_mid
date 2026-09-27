import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CharacterCard } from "@/components/character/character-card";
import { CombatPanel } from "@/components/combat/combat-panel";
import { InventoryPanel } from "@/components/inventory/inventory-panel";
import { ContinentGrid } from "@/components/map/continent-grid";
import { WorldMap } from "@/components/map/world-map";
import { ChatPanel } from "@/components/mesa/chat-panel";
import { MasterPanel } from "@/components/mesa/master-panel";
import { MesaShell } from "@/components/mesa/shell";
import { PersistGate } from "@/components/persist-gate";
import { SkillPanel } from "@/components/skills/skill-panel";
import { WorldPanel } from "@/components/world/world-panel";
import { usePlatis } from "@/lib/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/mesa")({ component: MesaPage });

function MesaPage() {
  return (
    <PersistGate>
      <Mesa />
    </PersistGate>
  );
}

function Mesa() {
  const nav = useNavigate();
  const selfId = usePlatis((s) => s.selfId);
  const ch = usePlatis((s) => (s.selfId ? s.characters[s.selfId] : null));
  const tab = usePlatis((s) => s.tab);
  const continentId = usePlatis((s) => s.continentId);
  const role = usePlatis((s) => s.role);

  useEffect(() => {
    if (!selfId) nav({ to: "/criar" });
  }, [selfId, nav]);

  if (!ch) return null;

  return (
    <MesaShell
      sidebar={
        <div className="space-y-3">
          <CharacterCard character={ch} />
          <ChatPanel />
          <Button variant="ghost" className="w-full text-muted" onClick={() => nav({ to: "/" })}>
            Sair para o átrio
          </Button>
        </div>
      }
    >
      {tab === "personagem" && (
        <div className="space-y-4 lg:hidden">
          <CharacterCard character={ch} />
        </div>
      )}
      {tab === "personagem" && (
        <div className="panel hidden p-6 lg:block">
          <h2 className="font-display text-3xl">{ch.name}</h2>
          <p className="mt-2 max-w-prose text-sm text-muted">
            Card à direita. A afinidade pinta o retrato. Distribua pontos na aba Inventário, envie habilidades
            para o Mestre e ande o mapa em quatro direções.
          </p>
        </div>
      )}
      {tab === "mapa" && (continentId ? <ContinentGrid /> : <WorldMap />)}
      {tab === "combate" && <CombatPanel />}
      {tab === "habilidades" && <SkillPanel />}
      {tab === "inventario" && <InventoryPanel />}
      {tab === "mundo" && <WorldPanel />}
      {tab === "mesa" && role === "mestre" && <MasterPanel />}
    </MesaShell>
  );
}
