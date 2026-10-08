import { BOSSES, WORLD_BOSS_DETAILS, CONTINENTS, TOTAL_DUNGEON_COUNT, dungeonsFor } from "@/data/world";
import { BRASAO_LEVELS } from "@/data/progression";
import { Button } from "@/components/ui/button";
import { usePlatis } from "@/lib/store";
import { useMemo, useState } from "react";
import { AffinityIcon } from "@/components/character/affinity-icon";
import type { AffinityId } from "@/data/types";
import { WorldBossCard } from "@/components/world/world-boss-card";
import { WorldBossPairCard } from "@/components/world/world-boss-pair-card";

function worldBossDetail(id: string) {
  return WORLD_BOSS_DETAILS.find((boss) => boss.id === id);
}

export function WorldPanel() {
  console.log("WORLD PANEL RENDERIZOU");
  const open = usePlatis((s) => s.openContinent);
  const addEntity = usePlatis((s) => s.addEntity);
  const continentId = usePlatis((s) => s.continentId);
  const role = usePlatis((s) => s.role);
  const [cid, setCid] = useState(continentId ?? "platis");
  const list = useMemo(() => dungeonsFor(cid).slice(0, 40), [cid]);
  const hraesvelgr = worldBossDetail("hraesvelgr");

  return (
    <div className="space-y-4">
      {role === "mestre" && (
        <div className="panel p-4">
        <h2 className="font-display text-2xl">Bosses mundiais</h2>
        <p className="text-xs text-muted">
          Permanecem no mundo após a derrota. Progressão Lv.12 → 100 → 200 → 300 → 400. Skoll e Hati recebem +100%
          individualmente.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {BOSSES.filter((b) => b.id !== "hati").map((b) => {
            if (b.id === "skoll") {
              const hati = BOSSES.find((item) => item.id === "hati");
              if (!hati) return null;

              return (
                <div key="skoll-hati" className="space-y-2">
                  <WorldBossPairCard
                    skoll={b}
                    hati={hati}
                    skollDetail={worldBossDetail("skoll")}
                    hatiDetail={worldBossDetail("hati")}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => open(b.continentId)}
                  >
                    Ir ao continente
                  </Button>
                </div>
              );
            }

            return (
              <div key={b.id} className="space-y-2">
                <WorldBossCard boss={b} detail={worldBossDetail(b.id)} />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => open(b.continentId)}
                >
                  Ir ao continente
                </Button>
              </div>
            );
          })}
        </ul>
        </div>
      )}

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
