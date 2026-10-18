import { useEffect, useMemo, useRef } from "react";
import { usePlatis } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
} from "lucide-react";
import {
  createCityMap2DEngine,
  type CityMap2DEngine,
  type MapToken,
} from "@/components/map/world-map-2d-engine";

/**
 * Exploração local 2D (casas e ruas vistas de cima).
 * Mesma posição do store que a Exploração 3D — WASD / D-pad.
 */
export function WorldMap2D() {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CityMap2DEngine | null>(null);

  const selfId = usePlatis((s) => s.selfId);
  const characters = usePlatis((s) => s.characters);
  const continentId = usePlatis((s) => s.continentId);
  const layer = usePlatis((s) => s.layer);
  const moveSelf = usePlatis((s) => s.moveSelf);

  const self = selfId ? characters[selfId] : undefined;
  const worldX = self?.position.x ?? 0;
  const worldY = self?.position.y ?? 0;

  const tokens: MapToken[] = useMemo(() => {
    const list: MapToken[] = [];
    if (self) {
      list.push({
        id: self.id,
        x: self.position.x,
        y: self.position.y,
        name: self.name,
        isSelf: true,
      });
    }
    for (const ch of Object.values(characters)) {
      if (ch.id === selfId) continue;
      if (
        ch.position.continentId !==
          (self?.position.continentId ?? continentId) ||
        ch.position.layer !== (self?.position.layer ?? layer)
      ) {
        continue;
      }
      if (
        Math.abs(ch.position.x - worldX) > 14 ||
        Math.abs(ch.position.y - worldY) > 14
      ) {
        continue;
      }
      list.push({
        id: ch.id,
        x: ch.position.x,
        y: ch.position.y,
        name: ch.name,
      });
    }
    return list;
  }, [characters, selfId, self, continentId, layer, worldX, worldY]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const engine = createCityMap2DEngine({
      container: host,
      originX: worldX,
      originY: worldY,
      tokens,
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setOrigin(worldX, worldY);
  }, [worldX, worldY]);

  useEffect(() => {
    engineRef.current?.setTokens(tokens);
  }, [tokens]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      const directions: Record<string, [number, number]> = {
        w: [0, -1],
        arrowup: [0, -1],
        s: [0, 1],
        arrowdown: [0, 1],
        a: [-1, 0],
        arrowleft: [-1, 0],
        d: [1, 0],
        arrowright: [1, 0],
      };
      const direction = directions[key];
      if (!direction) return;
      e.preventDefault();
      moveSelf(direction[0], direction[1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moveSelf]);

  return (
    <div className="relative h-[min(72vh,680px)] min-h-[360px] w-full overflow-hidden rounded-xl border border-line bg-[#171816]">
      <div ref={hostRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-xs text-white">
        <div className="font-semibold">
          {self?.name ?? "Nenhum personagem selecionado"}
        </div>
        <div className="mt-1 text-white/70">
          {self
            ? `X ${worldX} · Y ${worldY} · Camada ${self.position.layer}`
            : "Selecione seu personagem para explorar"}
        </div>
      </div>

      <div className="absolute bottom-3 right-3 z-10 grid grid-cols-3 gap-1">
        <span />
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="size-11 border border-white/15 bg-black/70 text-white"
          aria-label="Norte"
          onClick={() => moveSelf(0, -1)}
        >
          <ArrowUp className="size-5" />
        </Button>
        <span />
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="size-11 border border-white/15 bg-black/70 text-white"
          aria-label="Oeste"
          onClick={() => moveSelf(-1, 0)}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="size-11 border border-white/15 bg-black/70 text-white"
          aria-label="Sul"
          onClick={() => moveSelf(0, 1)}
        >
          <ArrowDown className="size-5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="size-11 border border-white/15 bg-black/70 text-white"
          aria-label="Leste"
          onClick={() => moveSelf(1, 0)}
        >
          <ArrowRight className="size-5" />
        </Button>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/70 px-3 py-2 text-xs text-white/80">
        WASD / setas ou D-pad · casas e ruas
      </div>

      {!self && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-5 text-center text-sm text-white">
          Selecione um personagem na mesa para começar a explorar.
        </div>
      )}
    </div>
  );
}
