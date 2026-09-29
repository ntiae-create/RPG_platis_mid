import { CharacterCard } from "@/components/character/character-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RACES } from "@/data/races";
import type { Character, InventoryItem } from "@/data/types";
import { usePlatis } from "@/lib/store";
import { Gift, UserPlus } from "lucide-react";
import { useState } from "react";

const ITEM_TEMPLATES: Record<
  NonNullable<InventoryItem["slot"]>,
  Record<
    NonNullable<InventoryItem["tier"]>,
    {
      name: string;
      desc: string;
      price: number;
      bonus: NonNullable<InventoryItem["bonus"]>;
    }
  >
> = {
  arma: {
    basic: {
      name: "Arma Básica",
      desc: "Arma simples.",
      price: 30,
      bonus: { atk: 1 },
    },
    medium: {
      name: "Arma Média",
      desc: "Arma de qualidade superior.",
      price: 40 * 80,
      bonus: { atk: 2 },
    },
    rare: {
      name: "Arma Rara",
      desc: "Arma rara e poderosa.",
      price: 3 * 105 * 80,
      bonus: { atk: 4 },
    },
  },
  armadura: {
    basic: {
      name: "Armadura Básica",
      desc: "Proteção simples.",
      price: 30,
      bonus: { def: 1 },
    },
    medium: {
      name: "Armadura Média",
      desc: "Proteção reforçada.",
      price: 40 * 80,
      bonus: { def: 2 },
    },
    rare: {
      name: "Armadura Rara",
      desc: "Proteção rara e resistente.",
      price: 3 * 105 * 80,
      bonus: { def: 4 },
    },
  },
  botas: {
    basic: {
      name: "Botas Básicas",
      desc: "Botas simples.",
      price: 30,
      bonus: { agi: 1 },
    },
    medium: {
      name: "Botas Médias",
      desc: "Botas aprimoradas.",
      price: 40 * 80,
      bonus: { agi: 2 },
    },
    rare: {
      name: "Botas Raras",
      desc: "Botas raras e ágeis.",
      price: 3 * 105 * 80,
      bonus: { agi: 4 },
    },
  },
  colar: {
    basic: {
      name: "Colar Básico",
      desc: "Colar simples que aumenta HP e MP.",
      price: 30,
      bonus: { hp: 3, mp: 3 },
    },
    medium: {
      name: "Colar Médio",
      desc: "Colar aprimorado que aumenta HP e MP.",
      price: 40 * 80,
      bonus: { hp: 6, mp: 6 },
    },
    rare: {
      name: "Colar Raro",
      desc: "Colar raro que aumenta bastante HP e MP.",
      price: 3 * 105 * 80,
      bonus: { hp: 12, mp: 12 },
    },
  },
  reliquia: {
    basic: {
      name: "Relíquia Básica",
      desc: "Relíquia simples que aumenta INT.",
      price: 30,
      bonus: { int: 2 },
    },
    medium: {
      name: "Relíquia Média",
      desc: "Relíquia aprimorada.",
      price: 40 * 80,
      bonus: { int: 4 },
    },
    rare: {
      name: "Relíquia Rara",
      desc: "Relíquia rara e poderosa.",
      price: 3 * 105 * 80,
      bonus: { int: 8 },
    },
  },
};

const SLOT_LABELS: Record<NonNullable<InventoryItem["slot"]>, string> = {
  arma: "Arma",
  armadura: "Armadura",
  botas: "Botas",
  colar: "Colar",
  reliquia: "Relíquia",
};

const TIER_LABELS: Record<NonNullable<InventoryItem["tier"]>, string> = {
  basic: "Básico",
  medium: "Médio",
  rare: "Raro",
};

function GiveItem({ characterId }: { characterId: string }) {
  const grantItem = usePlatis((s) => s.grantItem);

  const [open, setOpen] = useState(false);
  const [slot, setSlot] =
    useState<NonNullable<InventoryItem["slot"]>>("arma");
  const [tier, setTier] =
    useState<NonNullable<InventoryItem["tier"]>>("basic");
  const [qty, setQty] = useState(1);

  const template = ITEM_TEMPLATES[slot][tier];

  function give() {
    const item: InventoryItem = {
      id: `item-${slot}-${tier}-${Date.now()}`,
      name: template.name,
      desc: template.desc,
      qty: Math.max(1, qty),
      slot,
      tier,
      price: template.price,
      bonus: template.bonus,
    };

    grantItem(characterId, item);
    setOpen(false);
    setQty(1);
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <Gift className="size-4" />
        Entregar item
      </Button>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-md border border-line bg-raised p-2">
      <p className="text-[10px] tracking-wide text-muted uppercase">
        Entregar item
      </p>

      <select
        className="h-10 w-full rounded-md bg-bg px-2 text-sm"
        value={slot}
        onChange={(e) =>
          setSlot(
            e.target.value as NonNullable<InventoryItem["slot"]>,
          )
        }
      >
        {Object.keys(SLOT_LABELS).map((key) => (
          <option key={key} value={key}>
            {SLOT_LABELS[key as NonNullable<InventoryItem["slot"]>]}
          </option>
        ))}
      </select>

      <select
        className="h-10 w-full rounded-md bg-bg px-2 text-sm"
        value={tier}
        onChange={(e) =>
          setTier(
            e.target.value as NonNullable<InventoryItem["tier"]>,
          )
        }
      >
        {Object.keys(TIER_LABELS).map((key) => (
          <option key={key} value={key}>
            {TIER_LABELS[key as NonNullable<InventoryItem["tier"]>]}
          </option>
        ))}
      </select>

      <Input
        type="number"
        min={1}
        value={qty}
        onChange={(e) =>
          setQty(Math.max(1, Number(e.target.value) || 1))
        }
      />

      <div className="rounded-md border border-line p-2">
        <p className="text-sm font-medium">{template.name}</p>
        <p className="text-xs text-muted">{template.desc}</p>
        <p className="text-xs text-muted">
          Bônus: {Object.entries(template.bonus)
            .map(([key, value]) => `+${value} ${key.toUpperCase()}`)
            .join(" · ")}
        </p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={give}>
          Entregar
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export function PlayerSlots({
  p2pPeers,
  remoteCharacters = {},
  onKickPeer,
}: {
  p2pPeers: {
    id: string;
    name: string;
    role: "mestre" | "jogador";
    connectionState: string;
  }[];
  remoteCharacters?: Record<string, Character>;
  onKickPeer: (peerId: string) => void;
}) {
  const slots = usePlatis((s) => s.slots);
  const characters = usePlatis((s) => s.characters);
  const grantXp = usePlatis((s) => s.grantXp);
  const grantBrasao = usePlatis((s) => s.grantBrasaoXp);
  const unlockRace = usePlatis((s) => s.unlockRace);
  const removeCharacter = usePlatis((s) => s.removeCharacter);
  const centerOn = usePlatis((s) => s.centerOn);
  const selectFighter = usePlatis((s) => s.selectFighter);
  const seedDemo = usePlatis((s) => s.seedDemo);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">Oito slots</h2>
        <Button size="sm" variant="secondary" onClick={seedDemo}>
          <UserPlus className="size-4" /> Demo
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {slots.map((id, i) => {
          const ch = id ? characters[id] : null;
          const peer = ch ? null : p2pPeers.find((p) => remoteCharacters[p.id]?.id === id);
          const remoteCharacter = peer ? remoteCharacters[peer.id] ?? null : null;
          return (
            <div key={i} className="panel p-2">
              <p className="px-1 pb-2 text-[10px] tracking-wide text-muted uppercase">
                Slot {i + 1}
              </p>
              {ch ? (
                <div className="space-y-2">
                  <CharacterCard character={ch} compact />
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => grantXp(ch.id, 100)}>
                      +100 XP
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => grantBrasao(ch.id, 3000)}>
                      +3k Brasão
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => centerOn(ch.id)}>
                      Centralizar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => selectFighter("attacker", ch.id)}>
                      Atacante
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => selectFighter("defender", ch.id)}>
                      Defensor
                    </Button>
                    <GiveItem characterId={ch.id} />
                    {ch.isDemo && (
                      <Button size="sm" variant="outline" onClick={() => removeCharacter(ch.id)}>
                        Remover Demo
                      </Button>
                    )}
                  </div>
                  <select
                    className="h-11 w-full rounded-md bg-raised px-2 text-sm"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) unlockRace(ch.id, e.target.value);
                    }}
                  >
                    <option value="">Desbloquear raça</option>
                    {RACES.filter((r) => !ch.unlockedRaces.includes(r.id)).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.tier})
                      </option>
                    ))}
                  </select>
                </div>
              ) : peer ? (
                remoteCharacter ? (
                  <div className="space-y-2">
                    <CharacterCard character={remoteCharacter} compact />
                    <p className="text-xs text-muted">Online · {peer.connectionState}</p>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onKickPeer(peer.id)}
                    >
                      Expulsar da mesa
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeCharacter(remoteCharacter.id)}
                    >
                      Excluir jogador
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border border-line p-4">
                    <p className="font-medium">{peer.name || "Jogador conectado"}</p>
                    <p className="text-xs text-muted">{peer.role} · {peer.connectionState}</p>
                  </div>
                )
              ) : (
                <p className="px-1 py-6 text-center text-sm text-muted">Vazio</p>
              )}
            </div>
          );
        })}
      </div>
      <XpTools />
    </div>
  );
}

function XpTools() {
  const award = usePlatis((s) => s.awardCombatXp);
  const setAmt = usePlatis((s) => s.setCombatXpAward);
  const amt = usePlatis((s) => s.combatXpAward);
  return (
    <div className="panel flex flex-wrap items-end gap-2 p-3">
      <div className="flex-1">
        <p className="mb-1 text-[10px] tracking-wide text-muted uppercase">XP de combate</p>
        <Input
          type="number"
          min={0}
          value={amt}
          onChange={(e) => setAmt(Number(e.target.value))}
        />
      </div>
      <Button onClick={award}>Conceder a todos</Button>
    </div>
  );
}
