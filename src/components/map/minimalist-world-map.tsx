import { useMemo, useState } from "react";
import { CONTINENTS, BOSSES } from "@/data/world";
import { GLOBE_CONTINENTS } from "@/data/globe-geography";
import { usePlatis } from "@/lib/store";
import { cn } from "@/lib/utils";

const AFFINITY_STROKE: Record<string, string> = {
  vento: "#6a9e94",
  luz: "#c4a84a",
  trevas: "#8b7ab8",
  terra: "#7d9b63",
  magico: "#b18bd1",
  agua: "#559ec8",
  fogo: "#d56d4d",
  fisico: "#c49a72",
};

const FALLBACK = "#8a9a7e";

/**
 * Converte lat/lon do globo em posição % no mapa 2D minimalista.
 * longitude -180..180 → 0..100%, latitude 90..-90 → 0..100%
 */
function geoToPercent(lat: number, lon: number) {
  const x = ((lon + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return { x, y };
}

/**
 * Mapa 2D minimalista: só contornos + nomes + pontos de capital.
 * Usa as mesmas coordenadas geográficas do globo 3D.
 */
export function MinimalistWorldMap() {
  const openContinent = usePlatis((s) => s.openContinent);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const nodes = useMemo(() => {
    return GLOBE_CONTINENTS.map((g) => {
      const continent = CONTINENTS.find((c) => c.id === g.id);
      if (!continent) return null;
      const { x, y } = geoToPercent(g.latitude, g.longitude);
      const stroke =
        AFFINITY_STROKE[continent.affinity ?? ""] ?? FALLBACK;
      const boss = BOSSES.find((b) => b.continentId === g.id);
      const rx = Math.max(4.5, g.width * 0.28);
      const ry = Math.max(3.5, g.height * 0.22);
      return {
        id: g.id,
        name: continent.name,
        biome: continent.biome,
        x,
        y,
        rx,
        ry,
        stroke,
        bossName: boss?.name,
        seed: g.id.length,
      };
    }).filter(Boolean) as Array<{
      id: string;
      name: string;
      biome: string;
      x: number;
      y: number;
      rx: number;
      ry: number;
      stroke: string;
      bossName?: string;
      seed: number;
    }>;
  }, []);

  const activeId = selected ?? hovered;

  return (
    <div className="panel overflow-hidden">
      <div
        className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#050b12] bg-cover bg-center"
        style={{ backgroundImage: 'url("/world/map.jpg")' }}
      >
        <svg
          viewBox="0 0 100 62.5"
          className="size-full"
          role="img"
          aria-label="Mapa minimalista dos 22 continentes de Platis"
        >
          <defs>
            <pattern
              id="grid"
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 5 0 L 0 0 0 5"
                fill="none"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="0.15"
              />
            </pattern>
          </defs>
          <rect width="100" height="62.5" fill="url(#grid)" />

          <line
            x1="0"
            y1="31.25"
            x2="100"
            y2="31.25"
            stroke="rgba(90,154,170,0.12)"
            strokeWidth="0.15"
            strokeDasharray="1 1"
          />
          <line
            x1="50"
            y1="0"
            x2="50"
            y2="62.5"
            stroke="rgba(90,154,170,0.1)"
            strokeWidth="0.15"
            strokeDasharray="1 1"
          />

          {nodes.map((n) => {
            const isActive = activeId === n.id;
            const wobble = 0.6 + (n.seed % 5) * 0.08;
            return (
              <g
                key={n.id}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setSelected(n.id);
                  openContinent(n.id);
                }}
                onPointerEnter={() => setHovered(n.id)}
                onPointerLeave={() => setHovered(null)}
              >
                <ellipse
                  cx={n.x}
                  cy={n.y * 0.625}
                  rx={n.rx * wobble}
                  ry={n.ry * wobble}
                  fill={
                    isActive
                      ? `${n.stroke}33`
                      : "rgba(8,16,22,0.55)"
                  }
                  stroke={n.stroke}
                  strokeWidth={isActive ? 0.45 : 0.28}
                  opacity={isActive ? 1 : 0.85}
                />
                <circle
                  cx={n.x}
                  cy={n.y * 0.625}
                  r={isActive ? 0.55 : 0.4}
                  fill="#e6bd62"
                  opacity={0.95}
                />
                <text
                  x={n.x}
                  y={n.y * 0.625 + n.ry * wobble + 1.6}
                  textAnchor="middle"
                  fill={isActive ? "#f5f0e6" : "#c8c4b8"}
                  fontSize={isActive ? 1.7 : 1.45}
                  fontFamily="Figtree, system-ui, sans-serif"
                  style={{ pointerEvents: "none" }}
                >
                  {n.name}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-white/10 bg-black/55 px-3 py-2 text-sm text-white backdrop-blur-sm">
          Platis · Mapa minimalista
        </div>

        {activeId && (
          <div className="pointer-events-none absolute bottom-3 right-3 max-w-[200px] rounded-md border border-white/10 bg-black/70 px-3 py-2 text-xs text-slate-200 backdrop-blur-sm">
            <div className="font-medium text-white">
              {CONTINENTS.find((c) => c.id === activeId)?.name}
            </div>
            <div className="text-slate-400">
              {CONTINENTS.find((c) => c.id === activeId)?.biome}
            </div>
          </div>
        )}
      </div>
      <p className="px-4 py-3 text-xs text-muted">
        22 continentes · contornos por bioma · toque para abrir a grade
        2000×3000
      </p>
    </div>
  );
}
