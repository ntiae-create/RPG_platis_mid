import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import { Vector3 } from "three";
import { CONTINENTS } from "@/data/world";
import { GLOBE_CONTINENTS } from "@/data/globe-geography";
import { usePlatis } from "@/lib/store";

const AFFINITY_COLORS: Record<string, string> = {
  vento: "#87c9c0",
  luz: "#f3d987",
  trevas: "#8979b8",
  terra: "#7d9b63",
  magico: "#b18bd1",
  agua: "#559ec8",
  fogo: "#d56d4d",
  fisico: "#c49a72",
};

function geoToVector(latitude: number, longitude: number, radius = 1.018) {
  const lat = (latitude * Math.PI) / 180;
  const lon = (longitude * Math.PI) / 180;
  return new Vector3(
    radius * Math.cos(lat) * Math.sin(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.cos(lon),
  );
}

function makeTerritory(
  latitude: number,
  longitude: number,
  width: number,
  height: number,
  seed: number,
) {
  const segments = 64;
  const radius = 1.035;
  const vertices: number[] = [];
  const centerLat = (latitude * Math.PI) / 180;
  const centerLon = (longitude * Math.PI) / 180;

  function project(u: number, v: number) {
    const angle = Math.atan2(v, u);
    const distance = Math.sqrt(u * u + v * v);
    const irregularity =
      0.76 +
      0.16 * Math.sin(angle * 3 + seed * 1.7) +
      0.09 * Math.cos(angle * 5 + seed);
    const lat = centerLat + (v * height * irregularity * Math.PI) / 180;
    const lon = centerLon + (u * width * irregularity * Math.PI) / 180;
    return new Vector3(
      radius * Math.cos(lat) * Math.sin(lon),
      radius * Math.sin(lat),
      radius * Math.cos(lat) * Math.cos(lon),
    );
  }

  const center = project(0, 0);

  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    const edge0 = project(Math.cos(a0), Math.sin(a0));
    const edge1 = project(Math.cos(a1), Math.sin(a1));

    vertices.push(
      center.x, center.y, center.z,
      edge0.x, edge0.y, edge0.z,
      edge1.x, edge1.y, edge1.z,
    );
  }

  return new Float32Array(vertices);
}

function Territory({
  latitude,
  longitude,
  width,
  height,
  seed,
  color,
  selected,
  onSelect,
}: {
  latitude: number;
  longitude: number;
  width: number;
  height: number;
  seed: number;
  color: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const positions = useMemo(
    () => makeTerritory(latitude, longitude, width, height, seed),
    [latitude, longitude, width, height, seed],
  );

  return (
    <mesh
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <meshBasicMaterial
        color={color}
        side={2}
        transparent
        opacity={selected ? 0.98 : 0.84}
        depthWrite={false}
      />
    </mesh>
  );
}

function GlobeSphere() {
  return (
    <group>
      <Sphere args={[1, 72, 72]}>
        <meshStandardMaterial
          color="#173b49"
          roughness={0.92}
          metalness={0.04}
          transparent
          opacity={0.25}
        />
      </Sphere>
      <Sphere args={[1.008, 48, 48]}>
        <meshBasicMaterial
          color="#5799a2"
          wireframe
          transparent
          opacity={0.09}
        />
      </Sphere>
    </group>
  );
}

function GlobeAtmosphere() {
  return (
    <Sphere args={[1.09, 40, 40]}>
      <meshBasicMaterial color="#3287a1" transparent opacity={0.07} side={2} />
    </Sphere>
  );
}

function GlobeTerritories({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <group>
      {GLOBE_CONTINENTS.map((region, index) => {
        const continent = CONTINENTS.find((item) => item.id === region.id);
        if (!continent) return null;

        return (
          <Territory
            key={region.id}
            latitude={region.latitude}
            longitude={region.longitude}
            width={region.width}
            height={region.height}
            seed={index + 1}
            color={AFFINITY_COLORS[continent.affinity ?? ""] ?? "#8b9d86"}
            selected={selectedId === region.id}
            onSelect={() => onSelect(region.id)}
          />
        );
      })}
    </group>
  );
}

export function WorldGlobe() {
  const openContinent = usePlatis((state) => state.openContinent);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="panel overflow-hidden">
      <div className="relative h-[360px] w-full overflow-hidden rounded-xl bg-[#050b12] sm:h-[480px]">
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 3.2], fov: 45 }}>
          <color attach="background" args={["#050b12"]} />
          <ambientLight intensity={1.2} />
          <directionalLight position={[4, 3, 5]} intensity={2.2} />
          <pointLight position={[-3, -2, -4]} intensity={0.8} color="#367b9a" />
          <GlobeSphere />
          <GlobeTerritories
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              openContinent(id);
            }}
          />
          <GlobeAtmosphere />
          <OrbitControls
            enablePan={false}
            enableZoom
            minDistance={1.6}
            maxDistance={5}
            rotateSpeed={0.7}
          />
        </Canvas>
        <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-white/10 bg-black/55 px-3 py-2 text-sm text-white backdrop-blur-sm">
          Platis · Globo-múndi
        </div>
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/55 px-3 py-2 text-xs text-slate-300">
          22 territórios · Toque em um continente para explorar
        </div>
      </div>
      <p className="px-4 py-3 text-xs text-muted">
        Arraste para girar · Use a pinça para aproximar · Toque em um território para abrir seu mapa.
      </p>
    </div>
  );
}
