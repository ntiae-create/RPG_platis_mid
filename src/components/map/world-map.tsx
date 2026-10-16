import { useState } from "react";
import { usePlatis } from "@/lib/store";
import { cn } from "@/lib/utils";
import { WorldGlobe } from "@/components/map/world-globe";
import { ExplorationMap } from "@/components/map/exploration-map";

type MapView = "exploration" | "globe";

export function WorldMap() {
  const savedView = usePlatis((s) => s.worldMapView);
  const setWorldMapView = usePlatis((s) => s.setWorldMapView);
  const [localView, setLocalView] = useState<MapView | null>(null);

  const view =
    localView ?? (savedView === "globe" ? "globe" : "exploration");

  function changeView(next: MapView) {
    setLocalView(next);
    setWorldMapView(next === "globe" ? "globe" : "map");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
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
          Exploração 3D
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

      {view === "globe" ? <WorldGlobe /> : <ExplorationMap />}
    </div>
  );
}
