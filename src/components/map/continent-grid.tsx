import { useEffect, useMemo, useRef, useState } from "react";
import {
  GRID_H,
  GRID_W,
  CONTINENT_BY_ID,
  dungeonsFor,
  WORLD_CITIES,
} from "@/data/world";
import { usePlatis } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Eye,
  EyeOff,
  Grid3x3,
  Lock,
  Unlock,
  ZoomIn,
} from "lucide-react";

const CELL = 28;
const COLS = 16;
const ROWS = 12;

const portraitCache = new Map<string, HTMLImageElement>();

function hashCell(x: number, y: number, seed = 0) {
  let n = Math.abs(
    Math.sin((x * 127.1 + y * 311.7 + seed * 74.7)) * 43758.5453,
  );
  return n - Math.floor(n);
}

function getTerrainPalette(biome: string, affinity?: string) {
  const text = `${biome} ${affinity ?? ""}`.toLowerCase();

  if (text.includes("vulc") || text.includes("fogo")) {
    return {
      base: "#241714",
      light: "#493020",
      dark: "#15100f",
      accent: "#8b4930",
    };
  }

  if (
    text.includes("deserto") ||
    text.includes("sol") ||
    text.includes("areia")
  ) {
    return {
      base: "#292319",
      light: "#51452d",
      dark: "#17140f",
      accent: "#9a7940",
    };
  }

  if (
    text.includes("floresta") ||
    text.includes("bosque") ||
    text.includes("campos")
  ) {
    return {
      base: "#172019",
      light: "#2d3b2d",
      dark: "#0d130f",
      accent: "#536c4d",
    };
  }

  if (
    text.includes("gelo") ||
    text.includes("tundra") ||
    text.includes("névoa") ||
    text.includes("montanha")
  ) {
    return {
      base: "#1b2223",
      light: "#344347",
      dark: "#0d1213",
      accent: "#657d82",
    };
  }

  if (
    text.includes("mar") ||
    text.includes("arquipélago") ||
    text.includes("água")
  ) {
    return {
      base: "#142126",
      light: "#28414a",
      dark: "#0a1216",
      accent: "#477985",
    };
  }

  if (
    text.includes("caverna") ||
    text.includes("subterr") ||
    text.includes("obsidiana")
  ) {
    return {
      base: "#19171e",
      light: "#312d3b",
      dark: "#0b0a0f",
      accent: "#62566e",
    };
  }

  if (text.includes("noite") || text.includes("trevas")) {
    return {
      base: "#151520",
      light: "#29283b",
      dark: "#09090f",
      accent: "#5b547c",
    };
  }

  if (text.includes("vento")) {
    return {
      base: "#18211e",
      light: "#304139",
      dark: "#0b110f",
      accent: "#607d70",
    };
  }

  return {
    base: "#1d211b",
    light: "#34392f",
    dark: "#0d100c",
    accent: "#66705a",
  };
}

export function ContinentGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapDragRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
    moved: boolean;
  } | null>(null);
  const didDragRef = useRef(false);
  const [tick, setTick] = useState(0);
  const [selectedCell, setSelectedCell] = useState<{
    x: number;
    y: number;
  } | null>(null);

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
    () => (continentId ? dungeonsFor(continentId).slice(0, 120) : []),
    [continentId],
  );

  const exploreKey = `${continentId}:${layer}`;

  const exploredSet = useMemo(
    () => new Set(explored[exploreKey] ?? []),
    [explored, exploreKey],
  );

  const palette = getTerrainPalette(
    continent?.biome ?? "",
    continent?.affinity,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !continent) return;

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

    /*
     * ============================================================
     * FUNDO DO MAPA
     * ============================================================
     *
     * O primeiro mapa usa /world/map.jpg.
     * Aqui criamos uma representação de terreno própria para que
     * as camadas internas nunca fiquem simplesmente pretas.
     */

    ctx.fillStyle = palette.dark;
    ctx.fillRect(0, 0, w, h);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = viewX + col;
        const y = viewY + row;

        const seen =
          role === "mestre" || exploredSet.has(`${x},${y}`);

        const noise = hashCell(x, y, layer + continent.id.length);

        let fill = palette.base;

        if (noise > 0.72) {
          fill = palette.light;
        }

        if (noise < 0.16) {
          fill = palette.dark;
        }

        if (!seen) {
          fill = "#0b0d0a";
        }

        ctx.fillStyle = fill;
        ctx.fillRect(
          col * CELL,
          row * CELL,
          CELL + 1,
          CELL + 1,
        );

        /*
         * Pequenos detalhes de terreno.
         */
        if (seen) {
          const detail = hashCell(
            x + 31,
            y + 17,
            layer * 9 + 3,
          );

          ctx.globalAlpha = 0.22;

          if (detail > 0.65) {
            ctx.fillStyle = palette.accent;
            ctx.beginPath();
            ctx.arc(
              col * CELL + 7 + detail * 10,
              row * CELL + 8,
              2 + detail * 2,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }

          if (detail < 0.2) {
            ctx.strokeStyle = palette.accent;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(
              col * CELL + 4,
              row * CELL + 20,
            );
            ctx.lineTo(
              col * CELL + 20,
              row * CELL + 7,
            );
            ctx.stroke();
          }

          ctx.globalAlpha = 1;
        }

        if (showGrid) {
          ctx.strokeStyle =
            layer === 0
              ? "rgba(236,232,220,0.10)"
              : layer === 1
                ? "rgba(236,232,220,0.13)"
                : "rgba(236,232,220,0.16)";

          ctx.lineWidth = 1;

          ctx.strokeRect(
            col * CELL + 0.5,
            row * CELL + 0.5,
            CELL,
            CELL,
          );
        }
      }
    }

    /*
     * ============================================================
     * CAMADAS INTERNAS
     * ============================================================
     *
     * Quanto mais profundo o zoom, mais detalhes aparecem.
     */

    if (layer >= 1) {
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const x = viewX + col;
          const y = viewY + row;

          if (
            role !== "mestre" &&
            !exploredSet.has(`${x},${y}`)
          ) {
            continue;
          }

          const noise = hashCell(
            x * 3,
            y * 5,
            layer * 21,
          );

          if (noise > 0.58) {
            ctx.strokeStyle = `${palette.accent}66`;
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(
              col * CELL + 5,
              row * CELL + 15,
            );
            ctx.lineTo(
              col * CELL + 13,
              row * CELL + 9,
            );
            ctx.lineTo(
              col * CELL + 22,
              row * CELL + 18,
            );
            ctx.stroke();
          }
        }
      }
    }

    if (layer >= 2) {
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const x = viewX + col;
          const y = viewY + row;

          if (
            role !== "mestre" &&
            !exploredSet.has(`${x},${y}`)
          ) {
            continue;
          }

          const noise = hashCell(
            x * 11,
            y * 17,
            91,
          );

          if (noise > 0.76) {
            ctx.fillStyle = `${palette.accent}55`;
            ctx.beginPath();
            ctx.arc(
              col * CELL + 14,
              row * CELL + 14,
              3,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }
        }
      }
    }

    /*
     * ============================================================
     * DUNGEONS
     * ============================================================
     */

    dungeons.forEach((d) => {
      const col = d.x - viewX;
      const row = d.y - viewY;

      if (
        col < 0 ||
        row < 0 ||
        col >= COLS ||
        row >= ROWS
      ) {
        return;
      }

      if (
        role !== "mestre" &&
        !exploredSet.has(`${d.x},${d.y}`)
      ) {
        return;
      }

      const size =
        layer >= 2 ? 16 : layer === 1 ? 14 : 12;

      ctx.fillStyle = "rgba(176,138,62,0.9)";

      ctx.fillRect(
        col * CELL + (CELL - size) / 2,
        row * CELL + (CELL - size) / 2,
        size,
        size,
      );

      if (layer >= 1) {
        ctx.strokeStyle = "rgba(245,220,150,0.7)";
        ctx.lineWidth = 1;
        ctx.strokeRect(
          col * CELL + (CELL - size) / 2,
          row * CELL + (CELL - size) / 2,
          size,
          size,
        );
      }
    });

    /* ASSENTAMENTOS DE PLATIS */
    /*
     * ============================================================
     * ASSENTAMENTOS DE PLATIS
     * ============================================================
     */
    WORLD_CITIES
      .filter((city) => city.continentId === continentId)
      .forEach((city) => {
        const col = city.x - viewX;
        const row = city.y - viewY;

        if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return;

        if (
          role !== "mestre" &&
          !exploredSet.has(`${city.x},${city.y}`)
        ) return;

        const px = col * CELL + CELL / 2;
        const py = row * CELL + CELL / 2;

        const size =
          city.type === "capital" ? 7 :
          city.type === "city" ? 5 :
          city.type === "village" ? 4 : 3;

        ctx.fillStyle =
          city.type === "capital" ? "#e6bd62" :
          city.type === "city" ? "#c5a66b" :
          city.type === "village" ? "#a39475" : "#817b6b";

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(236,232,220,0.85)";
        ctx.lineWidth = 1;
        ctx.stroke();

        if (layer >= 1 || city.type === "capital") {
          ctx.fillStyle = "#ece8dc";
          ctx.font = city.type === "capital"
            ? "bold 9px Figtree, sans-serif"
            : "8px Figtree, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(city.name, px, py - size - 2);
        }
      });

    /*
     * ============================================================
     * TOKENS
     * ============================================================
     */

    const drawToken = (
      col: number,
      row: number,
      src: string | undefined,
      name: string,
      mine: boolean,
      color: string,
    ) => {
      const px = col * CELL + CELL / 2;
      const py = row * CELL + CELL / 2;

      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (src) {
        let img = portraitCache.get(src);

        if (!img) {
          img = new Image();
          img.crossOrigin = "anonymous";

          img.onload = () => {
            setTick((n) => n + 1);
          };

          img.src = src;
          portraitCache.set(src, img);
        }

        if (img.complete && img.naturalWidth) {
          ctx.save();

          ctx.beginPath();
          ctx.arc(px, py, 11, 0, Math.PI * 2);
          ctx.clip();

          ctx.drawImage(
            img,
            px - 12,
            py - 12,
            24,
            24,
          );

          ctx.restore();
        }
      } else {
        ctx.fillStyle = "#ece8dc";
        ctx.font = "10px Figtree, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(name.slice(0, 1), px, py);
      }

      ctx.strokeStyle = mine
        ? "#ece8dc"
        : "rgba(236,232,220,0.45)";

      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.stroke();
    };

    entities.forEach((e) => {
      if (e.continentId !== continentId) return;

      if (
        hiddenEntities.includes(e.id) &&
        role !== "mestre"
      ) {
        return;
      }

      if (e.kind === "player" && characters[e.id]) {
        const ch = characters[e.id];

        if (
          ch.position.continentId !== continentId
        ) {
          return;
        }

        if (ch.position.layer !== layer) {
          return;
        }

        const col = ch.position.x - viewX;
        const row = ch.position.y - viewY;

        if (
          col < 0 ||
          row < 0 ||
          col >= COLS ||
          row >= ROWS
        ) {
          return;
        }

        drawToken(
          col,
          row,
          ch.image,
          ch.name,
          e.id === selfId,
          "#3a3a32",
        );
      } else {
        if (
          e.layer !== layer &&
          e.kind !== "boss"
        ) {
          return;
        }

        const col = e.x - viewX;
        const row = e.y - viewY;

        if (
          col < 0 ||
          row < 0 ||
          col >= COLS ||
          row >= ROWS
        ) {
          return;
        }

        const color =
          e.kind === "boss"
            ? "#b54a3c"
            : e.kind === "trap"
              ? "#b08a3e"
              : "#6d8560";

        drawToken(
          col,
          row,
          e.image,
          e.name,
          false,
          color,
        );
      }
    });

    /*
     * ============================================================
     * CÉLULA SELECIONADA
     * ============================================================
     */

    if (selectedCell) {
      const sx = selectedCell.x - viewX;
      const sy = selectedCell.y - viewY;

      if (
        sx >= 0 &&
        sy >= 0 &&
        sx < COLS &&
        sy < ROWS
      ) {
        ctx.strokeStyle = "#ece8dc";
        ctx.lineWidth = 2;

        ctx.strokeRect(
          sx * CELL + 2,
          sy * CELL + 2,
          CELL - 4,
          CELL - 4,
        );
      }
    }

    void tick;
  }, [
    continent,
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
    selectedCell,
    palette,
    tick,
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement)?.tagName,
        )
      ) {
        return;
      }

      const map: Record<
        string,
        [number, number]
      > = {
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

      const selfNow = selfId
        ? usePlatis.getState().characters[selfId]
        : null;

      if (selfNow) {
        panTo(
          selfNow.position.x - 8,
          selfNow.position.y - 6,
        );
      }
    };

    window.addEventListener("keydown", onKey);

    return () =>
      window.removeEventListener(
        "keydown",
        onKey,
      );
  }, [moveSelf, panTo, selfId]);

  if (!continent) return null;

  /*
   * ============================================================
   * CLIQUE / TOQUE
   * ============================================================
   *
   * Camada 0 -> Camada 1
   * Camada 1 -> Camada 2
   *
   * Não depende mais de Shift.
   */

  const onCanvasPointerDown = (
    ev: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (role !== "mestre" || ev.button !== 0) return;

    mapDragRef.current = {
      pointerId: ev.pointerId,
      lastX: ev.clientX,
      lastY: ev.clientY,
      moved: false,
    };

    ev.currentTarget.setPointerCapture(ev.pointerId);
  };

  const onCanvasPointerMove = (
    ev: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const drag = mapDragRef.current;
    if (!drag || drag.pointerId !== ev.pointerId) return;

    const dx = ev.clientX - drag.lastX;
    const dy = ev.clientY - drag.lastY;

    if (Math.abs(ev.clientX - (drag.lastX)) > 3 ||
        Math.abs(ev.clientY - (drag.lastY)) > 3) {
      drag.moved = true;
    }

    if (drag.moved) {
      didDragRef.current = true;
      const rect = ev.currentTarget.getBoundingClientRect();

      panTo(
        viewX - (dx * COLS) / rect.width,
        viewY - (dy * ROWS) / rect.height,
      );
    }

    drag.lastX = ev.clientX;
    drag.lastY = ev.clientY;
  };

  const onCanvasPointerUp = (
    ev: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const drag = mapDragRef.current;
    if (drag && drag.pointerId === ev.pointerId) {
      if (drag.moved) didDragRef.current = true;
      mapDragRef.current = null;
    }
  };

  const onCanvasClick = (
    ev: React.MouseEvent<HTMLCanvasElement>,
  ) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    const rect =
      ev.currentTarget.getBoundingClientRect();

    const col = Math.floor(
      ((ev.clientX - rect.left) /
        rect.width) *
        COLS,
    );

    const row = Math.floor(
      ((ev.clientY - rect.top) /
        rect.height) *
        ROWS,
    );

    if (
      col < 0 ||
      row < 0 ||
      col >= COLS ||
      row >= ROWS
    ) {
      return;
    }

    const x = viewX + col;
    const y = viewY + row;

    setSelectedCell({ x, y });

    /*
     * Nos dois primeiros níveis, tocar em uma célula
     * entra no próximo nível.
     */
    if (layer < 2) {
      zoomIntoCell(x, y);
      return;
    }

    /*
     * No terceiro nível, o Mestre pode teleportar.
     */
    if (
      role === "mestre" &&
      selfId
    ) {
      teleport(selfId, x, y);
    }
  };

  const self = selfId
    ? characters[selfId]
    : null;

  const zoomLabel =
    layer === 0
      ? "Visão do continente"
      : layer === 1
        ? "Bloco interno"
        : "Área detalhada";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl">
            {continent.name}
          </h2>

          <p className="text-xs text-muted">
            {continent.biome}
            {" · "}
            {zoomLabel}
            {" · "}
            camada {layer}
          </p>

          <p className="text-[11px] text-muted">
            Grade global {GRID_W}×{GRID_H}
            {layers.length > 0 &&
              ` · origem (${layers[layers.length - 1].x}, ${layers[layers.length - 1].y})`}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={zoomOut}
          >
            {layer === 0
              ? "Mapa-múndi"
              : "Camada anterior"}
          </Button>

          {layer === 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={closeContinent}
            >
              Fechar
            </Button>
          )}
        </div>
      </div>

      <div className="panel overflow-hidden p-2">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-[11px] tracking-wide text-muted uppercase">
            {zoomLabel}
          </span>

          {layer < 2 && (
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <ZoomIn className="size-3.5" />
              Toque em uma área para ampliar
            </span>
          )}
        </div>

        <canvas
          ref={canvasRef}
          className="mx-auto block max-w-full touch-none rounded-lg"
          onClick={onCanvasClick}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          onPointerCancel={onCanvasPointerUp}
        />

        <p className="px-2 pt-2 text-[11px] text-muted">
          {layer < 2
            ? "Toque em uma célula para entrar no próximo nível."
            : role === "mestre"
              ? "Camada final: toque em uma célula para teleportar o Mestre."
              : "Camada final do mapa."}

          {self && (
            <span className="tabular text-ink">
              {" "}
              Posição ({self.position.x},{" "}
              {self.position.y})
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Button
          size="icon"
          variant="secondary"
          onClick={() => moveSelf(0, -1)}
          aria-label="Norte"
        >
          <ArrowUp />
        </Button>

        <Button
          size="icon"
          variant="secondary"
          onClick={() => moveSelf(-1, 0)}
          aria-label="Oeste"
        >
          <ArrowLeft />
        </Button>

        <Button
          size="icon"
          variant="secondary"
          onClick={() => moveSelf(1, 0)}
          aria-label="Leste"
        >
          <ArrowRight />
        </Button>

        <Button
          size="icon"
          variant="secondary"
          onClick={() => moveSelf(0, 1)}
          aria-label="Sul"
        >
          <ArrowDown />
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={toggleGrid}
        >
          <Grid3x3 />
          Grade
        </Button>

        {role === "mestre" && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={toggleLock}
            >
              {movementLocked ? (
                <Lock />
              ) : (
                <Unlock />
              )}

              {movementLocked
                ? "Movimento bloqueado"
                : "Movimento livre"}
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
                  x:
                    (self?.position.x ??
                      viewX + 8) + 1,
                  y:
                    self?.position.y ??
                    viewY + 6,
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
          <p className="mb-2 text-xs tracking-wide text-muted uppercase">
            Entidades visíveis
          </p>

          <ul className="space-y-1">
            {entities
              .filter(
                (e) =>
                  e.continentId ===
                  continentId,
              )
              .slice(0, 12)
              .map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {e.name}{" "}
                    <span className="text-xs text-muted">
                      ({e.x},{e.y})
                    </span>
                  </span>

                  <button
                    type="button"
                    className="size-11 text-muted"
                    onClick={() =>
                      toggleHidden(e.id)
                    }
                  >
                    {hiddenEntities.includes(
                      e.id,
                    ) ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
