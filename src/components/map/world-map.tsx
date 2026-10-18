import { useState } from "react";
import { usePlatis } from "@/lib/store";
import { cn } from "@/lib/utils";
import { WorldGlobe } from "@/components/map/world-globe";
import { ExplorationMap } from "@/components/map/exploration-map";
import { WorldMap2D } from "@/components/map/world-map-2d";

type MapView = "flat" | "exploration" | "globe";

export function WorldMap() {
  const savedView = usePlatis((s) => s.worldMapView);
  const setWorldMapView = usePlatis((s) => s.setWorldMapView);
  const [localView, setLocalView] = useState<MapView | null>(null);

  const view: MapView =
    localView ?? (savedView === "globe" ? "globe" : "flat");

  function changeView(next: MapView) {
    setLocalView(next);
    setWorldMapView(next === "globe" ? "globe" : "map");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => changeView("flat")}
          aria-pressed={view === "flat"}
          className={cn(
            "rounded-lg border px-4 py-2 text-sm",
            view === "flat"
              ? "border-accent bg-accent/15 text-accent"
              : "border-line text-muted",
          )}
        >
          Mapa 2D
        </button>
        <button
          type="button"
          onClick={() => changeView("exploration")}
          aria-pressed={view === "exploration"}
          className={cn(
            "rounded-lg border px-4 py-2 text-sm",
            view === "exploration"
              ? "border-accent bg-accent/15 text-accent"
              : "border-line text-muted",
          )}
        >
          Cidades 3D
        </button>
        <button
          type="button"
          onClick={() => changeView("globe")}
          aria-pressed={view === "globe"}
          className={cn(
            "rounded-lg border px-4 py-2 text-sm",
            view === "globe"
              ? "border-accent bg-accent/15 text-accent"
              : "border-line text-muted",
          )}
        >
          Globo 3D
        </button>
      </div>

      {view === "flat" ? (
        <WorldMap2D />
      ) : view === "globe" ? (
        <WorldGlobe />
      ) : (
        <ExplorationMap />
      )}
    </div>
  );
}
