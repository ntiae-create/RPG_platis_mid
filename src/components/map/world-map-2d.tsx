import { useEffect, useMemo, useRef, useState } from "react";
import { CONTINENTS, BOSSES } from "@/data/world";
import { usePlatis } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import {
  createWorldMap2DEngine,
  type WorldMap2DEngine,
} from "@/components/map/world-map-2d-engine";

/**
 * Mapa mundial 2D interativo (Three.js ortográfico).
 * - Arrastar com 1 dedo / mouse
 * - Pinça ou botões +/- para zoom
 * - Toque seleciona continente e abre a grade (openContinent)
 */
export function WorldMap2D() {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<WorldMap2DEngine | null>(null);
  const openContinent = usePlatis((s) => s.openContinent);
  const selfId = usePlatis((s) => s.selfId);
  const characters = usePlatis((s) => s.characters);
  const explored = usePlatis((s) => s.explored);

  const self = selfId ? characters[selfId] : undefined;
  const playerContinentId = self?.position.continentId ?? null;

  const exploredContinentIds = useMemo(() => {
    const ids = new Set<string>();
    for (const key of Object.keys(explored)) {
      const continentId = key.split(":")[0];
      if (continentId && CONTINENTS.some((c) => c.id === continentId)) {
        ids.add(continentId);
      }
    }
    if (playerContinentId) ids.add(playerContinentId);
    return ids;
  }, [explored, playerContinentId]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId
    ? CONTINENTS.find((c) => c.id === selectedId)
    : null;
  const selectedBoss = selectedId
    ? BOSSES.find((b) => b.continentId === selectedId)
    : null;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const engine = createWorldMap2DEngine({
      container: host,
      playerContinentId,
      exploredContinentIds,
      onSelectContinent: (id) => {
        setSelectedId(id);
        openContinent(id);
      },
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setPlayerContinent(playerContinentId);
  }, [playerContinentId]);

  useEffect(() => {
    engineRef.current?.setExplored(exploredContinentIds);
  }, [exploredContinentIds]);

  return (
    <div className="panel overflow-hidden">
      <div className="relative h-[min(62vh,520px)] min-h-[280px] w-full overflow-hidden rounded-xl bg-[#050b12]">
        <div ref={hostRef} className="absolute inset-0" />

        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-11 border border-white/15 bg-black/70 text-white shadow-md backdrop-blur-sm"
            aria-label="Aumentar zoom"
            onClick={() => engineRef.current?.zoomIn()}
          >
            <Plus className="size-5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-11 border border-white/15 bg-black/70 text-white shadow-md backdrop-blur-sm"
            aria-label="Diminuir zoom"
            onClick={() => engineRef.current?.zoomOut()}
          >
            <Minus className="size-5" />
          </Button>
        </div>

        <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-white/10 bg-black/55 px-3 py-2 text-sm text-white backdrop-blur-sm">
          Platis · Mapa 2D
        </div>

        {selected && (
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 max-w-sm rounded-md border border-white/10 bg-black/75 px-3 py-2 text-xs text-slate-200 backdrop-blur-sm sm:right-auto">
            <div className="font-medium text-white">{selected.name}</div>
            <div className="text-slate-400">{selected.biome}</div>
            {selectedBoss && (
              <div className="mt-1 text-amber-200/90">
                Boss: {selectedBoss.name}
              </div>
            )}
            <div className="mt-1 text-slate-500">
              Toque abre a grade de exploração
            </div>
          </div>
        )}
      </div>
      <p className="px-4 py-3 text-xs text-muted">
        Arraste para mover · Pinça ou +/− para zoom · Toque em um continente
        para explorar a grade 2000×3000
      </p>
    </div>
  );
}
