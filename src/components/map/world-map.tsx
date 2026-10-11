import { usePlatis } from "@/lib/store";
import { cn } from "@/lib/utils";
import { WorldGlobe } from "@/components/map/world-globe";
import { MinimalistWorldMap } from "@/components/map/minimalist-world-map";

export function WorldMap() {
  const view = usePlatis((s) => s.worldMapView);
  const setWorldMapView = usePlatis((s) => s.setWorldMapView);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setWorldMapView("map")}
          aria-pressed={view === "map"}
          className={cn(
            "rounded-lg border px-4 py-2 text-sm",
            view === "map"
              ? "border-accent bg-accent/15 text-accent"
              : "border-line text-muted",
          )}
        >
          Mapa 2D
        </button>
        <button
          type="button"
          onClick={() => setWorldMapView("globe")}
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

      {view === "globe" ? <WorldGlobe /> : <MinimalistWorldMap />}
    </div>
  );
}
