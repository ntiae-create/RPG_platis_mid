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
import type { SkillP2PMessage } from "@/lib/multiplayer/skill-events";
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
  const patchCharacter = usePlatis((s) => s.patchCharacter);

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
        const currentCharacter = selfId
          ? usePlatis.getState().characters[selfId]
          : null;

        if (currentCharacter) {
          setCharacterSendCount((count) => count + 1);
          p2pRef.current?.send(
            { type: "character", character: currentCharacter },
            peerId,
          );
        }
      },
      onPeersChanged: (peers) => { setP2pPeers(peers); console.log("[Mesa P2P] peers:", peers); },
      onMessage: (from, data, channel) => {
          if (channel === "reliable" && typeof data === "object" && data !== null && "type" in data && (data.type === "skill-submitted" || data.type === "skill-decision")) {
            const message = data as SkillP2PMessage;

            if (message.type === "skill-submitted") {
              const state = usePlatis.getState();
              const character = state.characters[message.characterId];
              if (character) {
                state.patchCharacter(message.characterId, {
                  skills: character.skills.map((skill) =>
                    skill.id === message.skill.id ? message.skill : skill,
                  ),
                });
              }
            }

            if (message.type === "skill-decision") {
              usePlatis.getState().masterSkill(
                message.characterId,
                message.skillId,
                message.action,
                message.edit,
              );
            }
          }

        console.log("[Mesa P2P] mensagem:", from, channel, data);
        if (
          channel === "state" &&
          typeof data === "object" &&
          data !== null &&
          "type" in data &&
          data.type === "master-character-patch"
        ) {
          const message = data as { type: "master-character-patch"; characterId: string; patch: Partial<Character> };
          if (message.characterId === usePlatis.getState().selfId) {
            patchCharacter(message.characterId, message.patch);
          }
        }

        if (
          channel === "state" &&
          typeof data === "object" &&
          data !== null &&
          "type" in data &&
          data.type === "character" &&
          "character" in data
        ) {
          const message = data as { type: "character"; character: Character };
          const existing = usePlatis.getState().characters[message.character.id];

          if (existing) {
            usePlatis.getState().patchCharacter(
              message.character.id,
              message.character,
            );
          } else {
            usePlatis.getState().addCharacter(message.character, false);
          }

          setRemoteCharacters((current) => ({
            ...current,
            [from]: message.character,
          }));
        }

        if (channel === "state" && typeof data === "object" && data !== null && "type" in data && "text" in data) {
          const message = data as { type: string; text: string };
          if (message.type === "chat") {
            usePlatis.getState().sendChat(message.text);
          }
        }

        if (channel === "reliable" && typeof data === "object" && data !== null && "type" in data && "character" in data) {
          const message = data as { type: string; character: Character };
          if (message.type === "character") {
            setRemoteCharacters((current) => ({ ...current, [from]: message.character }));
          usePlatis.getState().addCharacter(message.character, false);
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
    useEffect(() => {
      const handleSkillSubmitted = (event: Event) => {
        const customEvent = event as CustomEvent<SkillP2PMessage>;
        if (customEvent.detail.type !== "skill-submitted") return;
        p2pRef.current?.broadcast(customEvent.detail);
      };

      window.addEventListener("platis-skill-submitted", handleSkillSubmitted);
      return () => {
        window.removeEventListener("platis-skill-submitted", handleSkillSubmitted);
      };
    }, []);
    useEffect(() => {
      if (role !== "mestre") return;

      const handleSkillDecision = (event: Event) => {
        const customEvent = event as CustomEvent<SkillP2PMessage>;
        if (customEvent.detail.type !== "skill-decision") return;

        const decision = customEvent.detail;
        usePlatis.getState().masterSkill(
          decision.characterId,
          decision.skillId,
          decision.action,
          decision.edit,
        );

        const targetPeerId = Object.entries(remoteCharacters).find(([, character]) => character.id === decision.characterId)?.[0];
        if (targetPeerId) {
          p2pRef.current?.send(decision, targetPeerId);
        }
      };

        window.addEventListener("platis-skill-decision", handleSkillDecision);
        return () => {
          window.removeEventListener("platis-skill-decision", handleSkillDecision);
        };
      }, [role, remoteCharacters]);



  const slots = usePlatis((s) => s.slots);
  const characters = usePlatis((s) => s.characters);

  useEffect(() => {
    if (role !== "mestre" || !ch || !p2pRef.current) return;

    p2pRef.current.broadcast({
      type: "character",
      character: ch,

    });

    for (const slotId of slots) {
      if (!slotId || slotId === ch.id) continue;
      const character = characters[slotId];
      if (!character) continue;

      p2pRef.current.broadcast({
        type: "character",
        character,
      });
    }
  }, [ch, role, slots, characters]);

  if (!ch) return null;

  return (
    <MesaShell
      sidebar={
        <div className="space-y-3">
          <CharacterCard character={ch} />
          <ChatPanel onSend={(text) => { p2pRef.current?.broadcast({ type: "chat", text }); }} />
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
            onKickPeer={(peerId) => p2pRef.current?.kick(peerId)}
            onPatchRemoteCharacter={(characterId, patch) => {
              patchCharacter(characterId, patch);
              const targetPeerId = Object.entries(remoteCharacters).find(([, character]) => character.id === characterId)?.[0];
              if (targetPeerId) {
                p2pRef.current?.send({ type: "master-character-patch", characterId, patch }, targetPeerId);
              }
            }}
          />
        )}
        </div>
      )}
    </MesaShell>
  );
}
