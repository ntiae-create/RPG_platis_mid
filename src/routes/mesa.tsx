import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CharacterCard } from "@/components/character/character-card";
import { CombatPanel } from "@/components/combat/combat-panel";
import { InventoryPanel } from "@/components/inventory/inventory-panel";
import { ContinentGrid } from "@/components/map/continent-grid";
import { WorldMap } from "@/components/map/world-map";
import { ChatPanel } from "@/components/mesa/chat-panel";
import { CtePanel } from "@/components/mesa/cte-panel";
import { MasterPanel } from "@/components/mesa/master-panel";
import { MesaShell } from "@/components/mesa/shell";
import { PersistGate } from "@/components/persist-gate";
import { SkillPanel } from "@/components/skills/skill-panel";
import { WorldPanel } from "@/components/world/world-panel";
import { usePlatis } from "@/lib/store";
import type { Character } from "@/data/types";
import { P2PRoom } from "@/lib/multiplayer";
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
  const p2pRef = useRef<P2PRoom | null>(null);
  const [p2pConnected, setP2pConnected] = useState(false);
  const [p2pPeers, setP2pPeers] = useState<{ id: string; name: string; role: "mestre" | "jogador"; connectionState: string }[]>([]);
  const [remoteCharacters, setRemoteCharacters] = useState<Record<string, Character>>({});
  const [peerReadyCount, setPeerReadyCount] = useState(0);
  const [characterSendCount, setCharacterSendCount] = useState(0);
  const nav = useNavigate();
  const selfId = usePlatis((s) => s.selfId);
  const ch = usePlatis((s) => (s.selfId ? s.characters[s.selfId] : null));
  const tab = usePlatis((s) => s.tab);
  const continentId = usePlatis((s) => s.continentId);
  const role = usePlatis((s) => s.role);
  const activeMasterEventId = usePlatis((s) => s.activeMasterEventId);
  const activeMasterEvent = usePlatis((s) =>
    activeMasterEventId ? s.masterEvents.find((event) => event.id === activeMasterEventId) ?? null : null,
  );
  const respondToCte = usePlatis((s) => s.respondToCte);

  useEffect(() => {
    if (!selfId) nav({ to: "/criar" });
  }, [selfId, nav]);

  useEffect(() => {
    if (!selfId || p2pRef.current) return;

    const room = new P2PRoom({
      room: "platis-main",
      selfId,
      name: ch?.name ?? "",
      role: role ?? "jogador",
      onConnected: () => {
        setP2pConnected(true);
        console.log("[Mesa P2P] conectado à sala");
      },
      onPeerReady: (peerId) => {
        setPeerReadyCount((count) => count + 1);
        console.log("[Mesa P2P] canal reliable pronto:", peerId);
        if (ch) {
          setCharacterSendCount((count) => count + 1);
          p2pRef.current?.send(
            { type: "character", character: ch },
            peerId,
          );
        }
      },
      onPeersChanged: (peers) => { setP2pPeers(peers); console.log("[Mesa P2P] peers:", peers); },
      onMessage: (from, data, channel) => {
        console.log("[Mesa P2P] mensagem:", from, channel, data);
        if (channel === "reliable" && typeof data === "object" && data !== null && "type" in data && "character" in data) {
          const message = data as { type: string; character: Character };
          if (message.type === "character") {
            setRemoteCharacters((current) => ({ ...current, [from]: message.character }));
          }
        }
      },
    });

    p2pRef.current = room;
    void room.join();

    return () => {
      room.close();
      p2pRef.current = null;
    };
  }, [selfId, ch?.name, role]);

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
      <div className="panel space-y-2 border border-line p-4">
        <p className="font-bold">P2P: {p2pConnected ? "CONECTADO" : "CONECTANDO..."}</p>
        <p className="text-sm text-muted">Peers encontrados: {p2pPeers.length}</p>
        <p className="text-sm text-muted">Canais reliable prontos: {peerReadyCount}</p>
        <p className="text-sm text-muted">Envios de personagem: {characterSendCount}</p>
  <p className="text-sm text-muted">Personagens recebidos: {Object.keys(remoteCharacters).length}</p>
        <p className="text-xs text-muted">
          IDs: {Object.keys(remoteCharacters).join(", ") || "nenhum"}
        </p>
        {p2pPeers.map((peer) => (
          <div key={peer.id} className="text-sm">
            {peer.name || peer.id} — {peer.role} — {peer.connectionState}
          </div>
        ))}
      </div>
      <CtePanel />

      {tab === "mesa" && (
        <div className="space-y-4">
          {role === "mestre" && (
          <MasterPanel
            p2pPeers={p2pPeers}
            remoteCharacters={remoteCharacters}
          />
        )}
        </div>
      )}
    </MesaShell>
  );
}
