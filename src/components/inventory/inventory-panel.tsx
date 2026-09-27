import { Button } from "@/components/ui/button";
import { inventorySlots, MYSTERY_BOX_SILVER, STAT_LABELS } from "@/data/progression";
import type { StatKey } from "@/data/types";
import { usePlatis } from "@/lib/store";

const EQUIP = ["arma", "armadura", "botas", "reliquia", "colar"] as const;

export function InventoryPanel() {
  const ch = usePlatis((s) => (s.selfId ? s.characters[s.selfId] : null));
  const buy = usePlatis((s) => s.buyMysteryBox);
  const equip = usePlatis((s) => s.equipItem);
  const unequip = usePlatis((s) => s.unequipItem);
  const discard = usePlatis((s) => s.discardItem);
  const spend = usePlatis((s) => s.spendAttr);
  if (!ch) return null;
  const cap = inventorySlots(ch.level);
  const combat: StatKey[] = ["atk", "atkMgc", "def", "res", "agi", "int"];
  const pool: StatKey[] = ["hp", "mp", "est"];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="panel p-4">
        <h2 className="font-display text-2xl">Equipamento</h2>
        <p className="text-xs text-muted">Cinco slots: Arma, Armadura, Botas, Relíquia, Colar.</p>
        <ul className="mt-3 space-y-2">
          {EQUIP.map((k) => (
            <li key={k} className="flex justify-between rounded-md bg-raised px-3 py-2 text-sm">
              <span className="capitalize text-muted">{k}</span>
              <div className="flex items-center gap-2"><span>{ch.equipment[k]?.name ?? "—"}</span>{ch.equipment[k] && <Button size="sm" variant="outline" onClick={() => unequip(k)}>Tirar</Button>}</div>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {(
            [
              ["Bronze", ch.currency.bronze],
              ["Silver", ch.currency.silver],
              ["Gold", ch.currency.gold],
              ["Platinum", ch.currency.platinum],
            ] as const
          ).map(([n, v]) => (
            <div key={n} className="rounded-md bg-raised px-2 py-2">
              <div className="text-[10px] text-muted">{n}</div>
              <div className="tabular font-medium">{v}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted">1 Silver = 80 Bronze · 1 Gold = 105 Silver · 1 Platinum = 1.000 Gold</p>
        <Button className="mt-3" variant="secondary" onClick={buy}>
          Mystery Box · {MYSTERY_BOX_SILVER} Silver
        </Button>
      </div>

      <div className="panel p-4">
        <h2 className="font-display text-2xl">Mochila</h2>
        <p className="text-xs text-muted">
          {ch.inventory.length}/{cap} slots · +10 a cada 5 níveis
        </p>
        <ul className="mt-3 space-y-2">
          {ch.inventory.length === 0 && <li className="text-sm text-muted">Vazia.</li>}
          {ch.inventory.map((it) => (
            <li key={it.id} className="flex items-center justify-between rounded-md bg-raised px-3 py-2">
              <div>
                <div className="text-sm">{it.name}</div>
                <div className="text-[11px] text-muted">{it.desc}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => equip(it.id)}>
                  Equipar
                </Button>
                <Button size="sm" variant="outline" onClick={() => { if (window.confirm(`Descartar "${it.name}"?`)) discard(it.id); }}>
                  Descartar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel p-4 lg:col-span-2">
        <h2 className="font-display text-2xl">Progressão</h2>
        <p className="text-xs text-muted">
          Nível máximo 150. Cada nível: +3 atributos e +2 Sanidade. A cada 5 níveis: +8 para HP / MP / EST.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {combat.map((k) => (
            <Button key={k} size="sm" variant="secondary" disabled={ch.attrPoints <= 0} onClick={() => spend(k)}>
              +1 {STAT_LABELS[k]}
            </Button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">{ch.attrPoints} pontos de atributo</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {pool.map((k) => (
            <Button
              key={k}
              size="sm"
              variant="outline"
              disabled={ch.poolPoints <= 0}
              onClick={() => spend(k, true)}
            >
              +1 {STAT_LABELS[k]} (pool)
            </Button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">{ch.poolPoints} pontos de pool</p>
      </div>
    </div>
  );
}
