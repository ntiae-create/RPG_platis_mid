import { CONTINENTS } from "@/data/world";
import { BOSSES } from "@/data/world";
import { usePlatis } from "@/lib/store";
import { cn } from "@/lib/utils";
import { WorldGlobe } from "@/components/map/world-globe";
import { useState } from "react";

export function WorldMap() {
  const openContinent = usePlatis((s) => s.openContinent);
  const [view, setView] = useState<"map" | "globe">("map");
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button type="button" onClick={() => setView("map")} aria-pressed={view === "map"} className={cn("rounded-lg border px-4 py-2 text-sm", view === "map" ? "border-accent bg-accent/15 text-accent" : "border-line text-muted")}>
          Mapa 2D
        </button>
        <button type="button" onClick={() => setView("globe")} aria-pressed={view === "globe"} className={cn("rounded-lg border px-4 py-2 text-sm", view === "globe" ? "border-accent bg-accent/15 text-accent" : "border-line text-muted")}>
          Globo 3D
        </button>
      </div>
      {view === "globe" ? <WorldGlobe /> : <div className="panel overflow-hidden">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-raised">
        <img
          src="/world/map.jpg"
          alt="Mapa-múndi de Platis"
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-bg/20" />
        {CONTINENTS.map((c) => {
          const boss = BOSSES.find((b) => b.continentId === c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => openContinent(c.id)}
              style={{ left: `${c.x}%`, top: `${c.y}%` }}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full",
                "min-h-11 min-w-11 px-2 text-left",
              )}
              title={c.name}
            >
              <span className="block size-2.5 rounded-full bg-accent shadow-[0_0_0_4px_rgba(216,208,192,0.18)]" />
              <span className="mt-1 hidden max-w-28 truncate rounded bg-bg/75 px-1.5 py-0.5 text-[10px] backdrop-blur-sm sm:block">
                {c.name}
                {boss ? ` · ${boss.name}` : ""}
              </span>
            </button>
          );
        })}
      </div>
      <p className="px-4 py-3 text-xs text-muted">
        22 continentes · 2390 dungeons · 11 bosses mundiais. Toque um marco para abrir a grade 2000×3000.
      </p>
      </div>}
    </div>
  );
}
