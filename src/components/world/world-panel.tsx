import { BOSSES, CONTINENTS, TOTAL_DUNGEON_COUNT, dungeonsFor } from "@/data/world";
import { BRASAO_LEVELS } from "@/data/progression";
import { Button } from "@/components/ui/button";
import { usePlatis } from "@/lib/store";
import { useMemo, useState } from "react";
import { AffinityIcon } from "@/components/character/affinity-icon";
import type { AffinityId } from "@/data/types";

export function WorldPanel() {
  const open = usePlatis((s) => s.openContinent);
  const addEntity = usePlatis((s) => s.addEntity);
  const continentId = usePlatis((s) => s.continentId);
  const role = usePlatis((s) => s.role);
  const [cid, setCid] = useState(continentId ?? "platis");
  const list = useMemo(() => dungeonsFor(cid).slice(0, 40), [cid]);

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <h2 className="font-display text-2xl">Bosses mundiais</h2>
        <p className="text-xs text-muted">
          Permanecem no mundo após a derrota. Progressão Lv.12 → 100 → 200 → 300 → 400. Skoll e Hati recebem +100%
          individualmente.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {BOSSES.map((b) => (
            <li key={b.id} className="rounded-md bg-raised p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{b.name}</span>
                {typeof b.affinity === "string" && <AffinityIcon id={b.affinity as AffinityId} className="size-4" />}
              </div>
              <p className="text-[11px] text-muted">
                Brasão {b.brasao} · bônus {b.bonusPct}% · {CONTINENTS.find((c) => c.id === b.continentId)?.name}
              </p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => open(b.continentId)}>
                Ir ao continente
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel p-4">
        <h2 className="font-display text-2xl">Dungeons · {TOTAL_DUNGEON_COUNT}</h2>
        <select
          className="mt-2 h-11 w-full rounded-md bg-raised px-3 text-sm"
          value={cid}
          onChange={(e) => setCid(e.target.value)}
        >
          {CONTINENTS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.dungeonCount} dungeons
            </option>
          ))}
        </select>
        <ul className="mt-3 max-h-72 space-y-1 overflow-auto">
          {list.map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-raised">
              <span>
                {d.name}{" "}
                <span className="text-[11px] text-muted">
                  {d.type} · dif {d.difficulty} · ({d.x},{d.y})
                </span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => open(d.continentId)}>
                Abrir
              </Button>
            </li>
          ))}
        </ul>
        {role === "mestre" && (
          <Button
            className="mt-3"
            variant="secondary"
            onClick={() =>
              addEntity({
                kind: "dungeon",
                name: "Dungeon do Mestre",
                continentId: cid,
                layer: 0,
                x: 1000,
                y: 1500,
              })
            }
          >
            Criar dungeon
          </Button>
        )}
      </div>

      <div className="panel p-4">
        <h2 className="font-display text-2xl">Brasão · 9 níveis</h2>
        <ul className="mt-3 space-y-1.5">
          {BRASAO_LEVELS.map((b) => (
            <li key={b.level} className="flex justify-between gap-3 text-sm">
              <span>
                {b.level} · {b.name}
              </span>
              <span className="text-muted">
                {b.xp.toLocaleString("pt-BR")} XP · {b.effect}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
