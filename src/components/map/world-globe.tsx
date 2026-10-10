import { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Sphere,
  useTexture,
  Html,
} from "@react-three/drei";
import { DoubleSide, Vector3, SRGBColorSpace } from "three";
import { CONTINENTS, BOSSES, WORLD_CITIES } from "@/data/world";
import { GLOBE_CONTINENTS } from "@/data/globe-geography";
import { usePlatis } from "@/lib/store";

/**
 * Cores por afinidade — dark fantasy, legíveis no globo.
 * Continentes sem affinity usam o fallback oliva-acinzentado.
 */
const AFFINITY_COLORS: Record<string, string> = {
  vento: "#6a9e94",
  luz: "#c4a84a",
  trevas: "#6b5a8a",
  terra: "#6a7d52",
  magico: "#8a6aa8",
  agua: "#3d7a98",
  fogo: "#b85a3c",
  fisico: "#a08058",
};

const FALLBACK_COLOR = "#7a8a6e";
const CAPITAL_COLOR = "#e6bd62";

/** Raio da superfície do planeta (unidade Three.js). */
const PLANET_RADIUS = 1;
/** Raio ligeiramente acima da superfície para territórios e marcadores. */
const SURFACE_RADIUS = 1.012;
const MARKER_RADIUS = 1.028;
const CAPITAL_RADIUS = 1.032;

/**
 * Converte latitude/longitude (graus) em posição 3D na esfera.
 * Convenção: Y = eixo polar, XZ = equador; longitude 0 no +Z.
 * Não alterar a fórmula sem recalibrar GLOBE_CONTINENTS.
 */
export function geoToVector(
  latitude: number,
  longitude: number,
  radius = SURFACE_RADIUS,
): Vector3 {
  const lat = (latitude * Math.PI) / 180;
  const lon = (longitude * Math.PI) / 180;
  return new Vector3(
    radius * Math.cos(lat) * Math.sin(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.cos(lon),
  );
}

/**
 * Gera malha irregular de continente na superfície da esfera.
 * Formato estável: seed fixo por índice → mesma forma a cada reload.
 */
function makeTerritory(
  latitude: number,
  longitude: number,
  width: number,
  height: number,
  seed: number,
): Float32Array {
  const radius = SURFACE_RADIUS;
  const segments = 48;
  const rings = 16;
  const vertices: number[] = [];
  const centerLat = (latitude * Math.PI) / 180;
  const centerLon = (longitude * Math.PI) / 180;

  function project(u: number, v: number) {
    const angle = Math.atan2(v, u);
    const distance = Math.sqrt(u * u + v * v);
    const irregularity =
      0.78 +
      0.14 * Math.sin(angle * 3 + seed * 1.7) +
      0.08 * Math.cos(angle * 5 + seed) +
      0.04 * Math.sin(distance * 8 + seed * 0.3);

    const lat = centerLat + v * height * irregularity * (Math.PI / 180);
    const lon = centerLon + u * width * irregularity * (Math.PI / 180);

    return new Vector3(
      radius * Math.cos(lat) * Math.sin(lon),
      radius * Math.sin(lat),
      radius * Math.cos(lat) * Math.cos(lon),
    );
  }

  for (let ring = 0; ring < rings; ring++) {
    const r0 = ring / rings;
    const r1 = (ring + 1) / rings;

    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = ((i + 1) / segments) * Math.PI * 2;

      const p00 = project(Math.cos(a0) * r0, Math.sin(a0) * r0);
      const p01 = project(Math.cos(a1) * r0, Math.sin(a1) * r0);
      const p10 = project(Math.cos(a0) * r1, Math.sin(a0) * r1);
      const p11 = project(Math.cos(a1) * r1, Math.sin(a1) * r1);

      vertices.push(
        p00.x,
        p00.y,
        p00.z,
        p10.x,
        p10.y,
        p10.z,
        p11.x,
        p11.y,
        p11.z,

        p00.x,
        p00.y,
        p00.z,
        p11.x,
        p11.y,
        p11.z,
        p01.x,
        p01.y,
        p01.z,
      );
    }
  }

  return new Float32Array(vertices);
}

function TerritoryMesh({
  latitude,
  longitude,
  width,
  height,
  seed,
  color,
  selected,
  hovered,
  onSelect,
  onHover,
}: {
  latitude: number;
  longitude: number;
  width: number;
  height: number;
  seed: number;
  color: string;
  selected: boolean;
  hovered: boolean;
  onSelect: () => void;
  onHover: (v: boolean) => void;
}) {
  const positions = useMemo(
    () => makeTerritory(latitude, longitude, width, height, seed),
    [latitude, longitude, width, height, seed],
  );

  const opacity = selected ? 0.92 : hovered ? 0.78 : 0.55;

  return (
    <mesh
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onHover(false);
        document.body.style.cursor = "auto";
      }}
    >
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <meshStandardMaterial
        color={color}
        side={DoubleSide}
        transparent
        opacity={opacity}
        depthWrite={false}
        roughness={0.85}
        metalness={0.08}
        emissive={selected || hovered ? color : "#000000"}
        emissiveIntensity={selected ? 0.35 : hovered ? 0.2 : 0}
      />
    </mesh>
  );
}

/**
 * Marcador pontual no centro geográfico do continente.
 * Fica sempre na superfície e acompanha a rotação do planeta.
 */
function ContinentMarker({
  latitude,
  longitude,
  color,
  selected,
  name,
  hasBoss,
  onSelect,
}: {
  latitude: number;
  longitude: number;
  color: string;
  selected: boolean;
  name: string;
  hasBoss: boolean;
  onSelect: () => void;
}) {
  const position = useMemo(
    () => geoToVector(latitude, longitude, MARKER_RADIUS),
    [latitude, longitude],
  );

  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[selected ? 0.028 : 0.018, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.7 : 0.35}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>
      {hasBoss && (
        <mesh position={[0, 0.04, 0]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshBasicMaterial color="#c44a3a" />
        </mesh>
      )}
      {selected && (
        <Html
          center
          distanceFactor={6}
          style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
        >
          <div className="rounded border border-white/20 bg-black/75 px-2 py-1 text-[11px] text-white shadow-lg backdrop-blur-sm">
            {name}
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Marcador de capital: offset leve do centro do continente para não
 * coincidir com o marcador principal. Coordenadas de grade 2D não são
 * latitude/longitude — usamos o centro geográfico oficial do continente.
 */
function CapitalMarker({
  latitude,
  longitude,
  name,
  seed,
  onSelect,
}: {
  latitude: number;
  longitude: number;
  name: string;
  seed: number;
  onSelect: () => void;
}) {
  const latOff = ((seed % 5) - 2) * 1.2;
  const lonOff = (((seed * 3) % 7) - 3) * 1.4;

  const position = useMemo(
    () =>
      geoToVector(latitude + latOff, longitude + lonOff, CAPITAL_RADIUS),
    [latitude, longitude, latOff, lonOff],
  );

  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[0.012, 10, 10]} />
        <meshStandardMaterial
          color={CAPITAL_COLOR}
          emissive={CAPITAL_COLOR}
          emissiveIntensity={0.45}
          roughness={0.35}
          metalness={0.3}
        />
      </mesh>
      <Html
        center
        distanceFactor={8}
        style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
        zIndexRange={[50, 0]}
      >
        <div className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-[#e6bd62] opacity-80">
          {name}
        </div>
      </Html>
    </group>
  );
}

/**
 * Esfera planetária com textura do mapa 2D (equiretangular aproximada)
 * e material dark fantasy. Quando o GLB estiver em /public/models/platis-globe.glb,
 * pode substituir esta geometria pelo modelo carregado via useGLTF.
 */
function GlobeSphere() {
  const mapTexture = useTexture("/world/map.jpg");

  useMemo(() => {
    if (mapTexture) {
      mapTexture.colorSpace = SRGBColorSpace;
      mapTexture.anisotropy = 4;
    }
  }, [mapTexture]);

  return (
    <group>
      <Sphere args={[PLANET_RADIUS * 0.998, 64, 64]}>
        <meshStandardMaterial
          color="#0c1a22"
          roughness={0.95}
          metalness={0.05}
        />
      </Sphere>

      <Sphere args={[PLANET_RADIUS, 72, 72]}>
        <meshStandardMaterial
          map={mapTexture}
          color="#c8b8a0"
          roughness={0.88}
          metalness={0.06}
          transparent
          opacity={0.92}
        />
      </Sphere>

      <Sphere args={[PLANET_RADIUS + 0.004, 36, 36]}>
        <meshBasicMaterial
          color="#4a7a88"
          wireframe
          transparent
          opacity={0.06}
        />
      </Sphere>
    </group>
  );
}

function GlobeAtmosphere() {
  return (
    <Sphere args={[PLANET_RADIUS + 0.085, 32, 32]}>
      <meshBasicMaterial
        color="#2a6a7a"
        transparent
        opacity={0.08}
        side={DoubleSide}
        depthWrite={false}
      />
    </Sphere>
  );
}

const USE_GLB_MODEL = false;
const GLB_PATH = "/models/platis-globe.glb";

function GlobeTerritories({
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: {
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  return (
    <group>
      {GLOBE_CONTINENTS.map((region, index) => {
        const continent = CONTINENTS.find((item) => item.id === region.id);
        if (!continent) return null;

        const color =
          AFFINITY_COLORS[continent.affinity ?? ""] ?? FALLBACK_COLOR;
        const boss = BOSSES.find((b) => b.continentId === region.id);
        const capital = WORLD_CITIES.find(
          (c) => c.continentId === region.id && c.type === "capital",
        );

        return (
          <group key={region.id}>
            <TerritoryMesh
              latitude={region.latitude}
              longitude={region.longitude}
              width={region.width}
              height={region.height}
              seed={index + 1}
              color={color}
              selected={selectedId === region.id}
              hovered={hoveredId === region.id}
              onSelect={() => onSelect(region.id)}
              onHover={(v) => onHover(v ? region.id : null)}
            />
            <ContinentMarker
              latitude={region.latitude}
              longitude={region.longitude}
              color={color}
              selected={selectedId === region.id}
              name={continent.name}
              hasBoss={Boolean(boss)}
              onSelect={() => onSelect(region.id)}
            />
            {capital && (
              <CapitalMarker
                latitude={region.latitude}
                longitude={region.longitude}
                name={capital.name}
                seed={index + 1}
                onSelect={() => onSelect(region.id)}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}

function GlobeScene({
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: {
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  return (
    <>
      <color attach="background" args={["#050b12"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 3, 4]} intensity={1.8} color="#fff5e6" />
      <directionalLight
        position={[-4, -2, -3]}
        intensity={0.45}
        color="#3a6a88"
      />
      <pointLight position={[0, 2, 3]} intensity={0.35} color="#5a9aaa" />

      <Suspense
        fallback={
          <Sphere args={[PLANET_RADIUS, 32, 32]}>
            <meshStandardMaterial color="#173b49" roughness={0.9} />
          </Sphere>
        }
      >
        {USE_GLB_MODEL ? null : <GlobeSphere />}
        <GlobeTerritories
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={onSelect}
          onHover={onHover}
        />
        <GlobeAtmosphere />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={1.55}
        maxDistance={4.8}
        rotateSpeed={0.65}
        zoomSpeed={0.85}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI * 0.92}
        minPolarAngle={Math.PI * 0.08}
      />
    </>
  );
}

/**
 * Painel de detalhes do continente (hover ou seleção).
 * Não abre o mapa sozinho — só informa. O botão Explorar chama openContinent.
 */
function ContinentDetailPanel({
  continentId,
  onExplore,
  onDismiss,
}: {
  continentId: string;
  onExplore: () => void;
  onDismiss: () => void;
}) {
  const continent = CONTINENTS.find((c) => c.id === continentId);
  if (!continent) return null;

  const bosses = BOSSES.filter((b) => b.continentId === continentId);
  const cities = WORLD_CITIES.filter((c) => c.continentId === continentId);
  const capital = cities.find((c) => c.type === "capital");
  const color =
    AFFINITY_COLORS[continent.affinity ?? ""] ?? FALLBACK_COLOR;

  return (
    <div className="pointer-events-auto absolute right-3 top-3 z-10 w-[min(100%-1.5rem,260px)] rounded-lg border border-white/15 bg-black/80 p-3 text-left shadow-xl backdrop-blur-md">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            <h3 className="text-sm font-semibold text-white">
              {continent.name}
            </h3>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">{continent.biome}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-white/10 hover:text-white"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <p className="mb-2 text-[11px] leading-relaxed text-slate-300">
        {continent.blurb}
      </p>

      <dl className="mb-3 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
        <dt className="text-slate-500">Dungeons</dt>
        <dd className="text-right text-slate-200">{continent.dungeonCount}</dd>
        {continent.affinity && (
          <>
            <dt className="text-slate-500">Afinidade</dt>
            <dd className="text-right capitalize text-slate-200">
              {continent.affinity}
            </dd>
          </>
        )}
        {capital && (
          <>
            <dt className="text-slate-500">Capital</dt>
            <dd className="text-right text-[#e6bd62]">{capital.name}</dd>
          </>
        )}
        <dt className="text-slate-500">Assentamentos</dt>
        <dd className="text-right text-slate-200">{cities.length}</dd>
      </dl>

      {bosses.length > 0 && (
        <div className="mb-3 rounded border border-red-900/40 bg-red-950/30 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-red-400/80">
            Boss mundial
          </p>
          {bosses.map((b) => (
            <p key={b.id} className="text-xs text-red-200">
              {b.name}
              {b.brasao && b.brasao !== "—" ? ` · ${b.brasao}` : ""}
            </p>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onExplore}
        className="w-full rounded-md border border-accent/50 bg-accent/15 px-3 py-2 text-xs font-medium text-accent transition hover:bg-accent/25"
      >
        Explorar mapa do continente
      </button>
    </div>
  );
}

export function WorldGlobe() {
  const openContinent = usePlatis((state) => state.openContinent);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  /** Painel: mostra o selecionado, ou o hovered se nada selecionado. */
  const panelId = selectedId ?? hoveredId;

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  return (
    <div className="panel overflow-hidden">
      <div className="relative h-[360px] w-full overflow-hidden rounded-xl bg-[#050b12] sm:h-[480px]">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0.35, 3.15], fov: 42 }}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            alpha: false,
          }}
          style={{ touchAction: "none" }}
        >
          <GlobeScene
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={handleSelect}
            onHover={setHoveredId}
          />
        </Canvas>

        <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-white/10 bg-black/55 px-3 py-2 text-sm text-white backdrop-blur-sm">
          Platis · Globo-múndi
        </div>

        {panelId && (
          <ContinentDetailPanel
            continentId={panelId}
            onExplore={() => {
              const id = selectedId ?? hoveredId;
              if (id) openContinent(id);
            }}
            onDismiss={() => {
              setSelectedId(null);
              setHoveredId(null);
            }}
          />
        )}

        <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
          <div className="rounded-md bg-black/55 px-3 py-2 text-xs text-slate-300">
            22 territórios · Toque para selecionar · Explorar abre a camada 1
          </div>
        </div>
      </div>
      <p className="px-4 py-3 text-xs text-muted">
        Arraste para girar · Pinça para aproximar · Marcadores dourados =
        capitais · Ponto vermelho = boss mundial.
        {USE_GLB_MODEL
          ? ` Modelo 3D: ${GLB_PATH}`
          : " Textura: /world/map.jpg · GLB preparado em /models/platis-globe.glb"}
      </p>
    </div>
  );
}
