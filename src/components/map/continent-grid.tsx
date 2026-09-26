import { useEffect, useMemo, useRef, useState } from "react";
import { GRID_H, GRID_W, CONTINENT_BY_ID, dungeonsFor } from "@/data/world";
import { usePlatis } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Eye, EyeOff, Grid3x3, Lock, Unlock } from "lucide-react";

const CELL = 28;
const COLS = 16;
const ROWS = 12;
const portraitCache = new Map<string, HTMLImageElement>();

export function ContinentGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tick, setTick] = useState(0);
  const {
    continentId,
    layer,
    layers,
    viewX,
    viewY,
    showGrid,
    movementLocked,
    role,
    characters,
    entities,
    hiddenEntities,
    explored,
    selfId,
    panTo,
    moveSelf,
    zoomIntoCell,
    zoomOut,
    closeContinent,
    toggleGrid,
    toggleLock,
    toggleHidden,
    teleport,
    addEntity,
  } = usePlatis();

  const continent = continentId ? CONTINENT_BY_ID[continentId] : null;
  const dungeons = useMemo(
    () => (continentId ? dungeonsFor(continentId).slice(0, 80) : []),
    [continentId],
  );

  const exploreKey = `${continentId}:${layer}`;
  const exploredSet = useMemo(
    () => new Set(explored[exploreKey] ?? []),
    [explored, exploreKey],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !continentId) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = COLS * CELL;
    const h = ROWS * CELL;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#121410";
    ctx.fillRect(0, 0, w, h);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = viewX + col;
        const y = viewY + row;
        const seen = exploredSet.has(`${x},${y}`) || role === "mestre";
        const shade = ((x * 13 + y * 7) % 5) * 4;
        ctx.fillStyle = seen ? `rgb(${22 + shade},${24 + shade},${18 + shade})` : "#0c0d0a";
        ctx.fillRect(col * CELL, row * CELL, CELL, CELL);
        if (showGrid) {
          ctx.strokeStyle = "rgba(236,232,220,0.08)";
          ctx.strokeRect(col * CELL + 0.5, row * CELL + 0.5, CELL, CELL);
        }
      }
    }

    dungeons.forEach((d) => {
      const col = d.x - viewX;
      const row = d.y - viewY;
      if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return;
      if (role !== "mestre" && !exploredSet.has(`${d.x},${d.y}`)) return;
      ctx.fillStyle = "rgba(176,138,62,0.85)";
      ctx.fillRect(col * CELL + 8, row * CELL + 8, 12, 12);
    });

    const drawToken = (col: number, row: number, src: string | undefined, name: string, mine: boolean, color: string) => {
      const px = col * CELL + 14;
      const py = row * CELL + 14;
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      if (src) {
        let img = portraitCache.get(src);
        if (!img) {
          img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => setTick((n) => n + 1);
          img.src = src;
          portraitCache.set(src, img);
        }
        if (img.complete && img.naturalWidth) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(px, py, 11, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, px - 12, py - 12, 24, 24);
          ctx.restore();
        }
      } else {
        ctx.fillStyle = "#ece8dc";
        ctx.font = "10px Figtree, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(name.slice(0, 1), px, py);
      }
      ctx.strokeStyle = mine ? "#ece8dc" : "rgba(236,232,220,0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.stroke();
    };

    entities.forEach((e) => {
      if (e.continentId !== continentId) return;
      if (hiddenEntities.includes(e.id) && role !== "mestre") return;
      if (e.kind === "player" && characters[e.id]) {
        const ch = characters[e.id];
        if (ch.position.continentId !== continentId) return;
        const col = ch.position.x - viewX;
        const row = ch.position.y - viewY;
        if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return;
        drawToken(col, row, ch.image, ch.name, e.id === selfId, "#3a3a32");
      } else {
        if (e.layer !== layer && e.kind !== "boss") return;
        const col = e.x - viewX;
        const row = e.y - viewY;
        if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return;
        const color = e.kind === "boss" ? "#b54a3c" : e.kind === "trap" ? "#b08a3e" : "#6d8560";
        drawToken(col, row, e.image, e.name, false, color);
      }
    });
    void tick;
  }, [
    continentId,
    layer,
    viewX,
    viewY,
    showGrid,
    entities,
    characters,
    hiddenEntities,
    exploredSet,
    role,
    selfId,
    dungeons,
    tick,
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return;
      const map: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        KeyW: [0, -1],
        KeyS: [0, 1],
        KeyA: [-1, 0],
        KeyD: [1, 0],
      };
      const delta = map[e.code];
      if (!delta) return;
      e.preventDefault();
      moveSelf(delta[0], delta[1]);
      const self = selfId ? usePlatis.getState().characters[selfId] : null;
      if (self) panTo(self.position.x - 8, self.position.y - 6);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moveSelf, panTo, selfId]);

  if (!continent) return null;

  const onCanvasClick = (ev: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = ev.currentTarget.getBoundingClientRect();
    const col = Math.floor((ev.clientX - rect.left) / CELL);
    const row = Math.floor((ev.clientY - rect.top) / CELL);
    const x = viewX + col;
    const y = viewY + row;
    if (ev.shiftKey) {
      zoomIntoCell(x, y);
      return;
    }
    if (role === "mestre" && selfId) teleport(selfId, x, y);
  };

  const self = selfId ? characters[selfId] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl">{continent.name}</h2>
          <p className="text-xs text-muted">
            {continent.biome} · camada {layer} · grade {GRID_W}×{GRID_H}
            {layers.length > 0 && ` · origem (${layers[layers.length - 1].x}, ${layers[layers.length - 1].y})`}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="secondary" onClick={zoomOut}>
            {layer === 0 ? "Mapa-múndi" : "Camada anterior"}
          </Button>
          {layer === 0 && (
            <Button size="sm" variant="ghost" onClick={closeContinent}>
              Fechar
            </Button>
          )}
        </div>
      </div>

      <div className="panel overflow-hidden p-2">
        <canvas
          ref={canvasRef}
          className="mx-auto block max-w-full touch-none rounded-lg"
          onClick={onCanvasClick}
        />
        <p className="px-2 pt-2 text-[11px] text-muted">
          Setas ou WASD movem 4 direções (Manhattan). Shift+clique abre a grade interna 2000×3000 da célula.
          {self && (
            <span className="tabular text-ink">
              {" "}
              Posição ({self.position.x}, {self.position.y})
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Button size="icon" variant="secondary" onClick={() => moveSelf(0, -1)} aria-label="Norte">
          <ArrowUp />
        </Button>
        <Button size="icon" variant="secondary" onClick={() => moveSelf(-1, 0)} aria-label="Oeste">
          <ArrowLeft />
        </Button>
        <Button size="icon" variant="secondary" onClick={() => moveSelf(1, 0)} aria-label="Leste">
          <ArrowRight />
        </Button>
        <Button size="icon" variant="secondary" onClick={() => moveSelf(0, 1)} aria-label="Sul">
          <ArrowDown />
        </Button>
        <Button size="sm" variant="outline" onClick={toggleGrid}>
          <Grid3x3 /> Grade
        </Button>
        {role === "mestre" && (
          <>
            <Button size="sm" variant="outline" onClick={toggleLock}>
              {movementLocked ? <Lock /> : <Unlock />}{" "}
              {movementLocked ? "Movimento bloqueado" : "Movimento livre"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                addEntity({
                  kind: "monster",
                  name: "Aberração",
                  continentId: continent.id,
                  layer,
                  x: (self?.position.x ?? viewX + 8) + 1,
                  y: self?.position.y ?? viewY + 6,
                  hp: 24,
                  hpMax: 24,
                })
              }
            >
              Criar entidade
            </Button>
          </>
        )}
      </div>

      {role === "mestre" && (
        <div className="panel p-3">
          <p className="mb-2 text-xs tracking-wide text-muted uppercase">Entidades visíveis</p>
          <ul className="space-y-1">
            {entities
              .filter((e) => e.continentId === continentId)
              .slice(0, 12)
              .map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <span>
                    {e.name}{" "}
                    <span className="text-xs text-muted">
                      ({e.x},{e.y})
                    </span>
                  </span>
                  <button type="button" className="size-11 text-muted" onClick={() => toggleHidden(e.id)}>
                    {hiddenEntities.includes(e.id) ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
