import { useCallback, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

type Building = {
  x: number;
  z: number;
  w: number;
  d: number;
  color: string;
  roof: string;
};

const BUILDINGS: Building[] = [
  { x: -7, z: -5, w: 2.6, d: 2, color: "#4b4035", roof: "#342522" },
  { x: -3.5, z: -6, w: 2.2, d: 2.4, color: "#59483a", roof: "#49302a" },
  { x: 1, z: -6, w: 2.7, d: 2, color: "#49453d", roof: "#292b2b" },
  { x: 6, z: -5.5, w: 2.5, d: 2.5, color: "#564438", roof: "#3c2925" },
  { x: -7, z: 0, w: 2.4, d: 2.6, color: "#514337", roof: "#382824" },
  { x: 7, z: 0, w: 2.5, d: 2.5, color: "#4b4136", roof: "#302827" },
  { x: -6, z: 5, w: 2.8, d: 2.1, color: "#5b4a3b", roof: "#3e2d28" },
  { x: -2.5, z: 6, w: 2.2, d: 2.2, color: "#4c453b", roof: "#302c29" },
  { x: 2, z: 6, w: 2.4, d: 2, color: "#59483a", roof: "#47302a" },
  { x: 6, z: 5, w: 2.7, d: 2.2, color: "#514236", roof: "#332725" },
];


function createStoneTexture(
  base: string,
  grout: string,
  seed: number,
  tileSize = 64,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível criar textura.");

  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, 512, 512);

  let state = seed >>> 0;
  const rand = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };

  const rows = Math.ceil(512 / tileSize);
  for (let row = -1; row <= rows; row++) {
    const offset = row % 2 === 0 ? 0 : tileSize / 2;
    for (let col = -1; col <= rows; col++) {
      const x = col * tileSize + offset;
      const y = row * tileSize;
      const shade = Math.floor(rand() * 28) - 14;
      const r = Math.max(0, Math.min(255, parseInt(base.slice(1, 3), 16) + shade));
      const g = Math.max(0, Math.min(255, parseInt(base.slice(3, 5), 16) + shade));
      const b = Math.max(0, Math.min(255, parseInt(base.slice(5, 7), 16) + shade));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
      ctx.strokeStyle = "rgba(12,12,12,0.48)";
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

      for (let n = 0; n < 14; n++) {
        ctx.fillStyle = rand() > 0.5
          ? "rgba(220,210,180,0.08)"
          : "rgba(0,0,0,0.10)";
        ctx.fillRect(
          x + 4 + rand() * (tileSize - 10),
          y + 4 + rand() * (tileSize - 10),
          1 + rand() * 4,
          1 + rand() * 3,
        );
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createRoofTexture(base: string, seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível criar textura.");

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  let state = seed >>> 0;
  const rand = () => {
    state = (state * 1103515245 + 12345) >>> 0;
    return state / 4294967296;
  };

  const shingleH = 32;
  for (let row = 0; row < 17; row++) {
    const offset = row % 2 ? 0 : 32;
    for (let col = -1; col < 9; col++) {
      const x = col * 64 + offset;
      const y = row * shingleH;
      const shade = Math.floor(rand() * 30) - 15;
      ctx.fillStyle = `rgba(${shade > 0 ? "180,160,140" : "0,0,0"},${0.12 + rand() * 0.12})`;
      ctx.fillRect(x + 2, y + 2, 60, 28);
      ctx.strokeStyle = "rgba(10,10,10,0.48)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, 60, 28);
      ctx.fillStyle = "rgba(220,210,190,0.08)";
      ctx.fillRect(x + 5, y + 5, 48, 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

const CITY_TEXTURES = {
  road: createStoneTexture("#625d52", "#292a27", 10, 54),
  plaza: createStoneTexture("#999080", "#4b4941", 20, 82),
  wall: createStoneTexture("#625f54", "#292b27", 30, 64),
  roof: createRoofTexture("#42332f", 40),
  roofRed: createRoofTexture("#663d32", 50),
  ground: createStoneTexture("#42483a", "#30362d", 60, 96),
};

function BuildingModel({ building }: { building: Building }) {
  return (
    <group position={[building.x, 0, building.z]}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[building.w, 0.9, building.d]} />
        <meshStandardMaterial color={building.color} map={CITY_TEXTURES.wall} roughness={1} />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <coneGeometry args={[Math.max(building.w, building.d) * 0.76, 0.85, 4]} />
        <meshStandardMaterial color={building.roof} map={building.roof === "#49302a" || building.roof === "#47302a" ? CITY_TEXTURES.roofRed : CITY_TEXTURES.roof} roughness={0.95} />
      </mesh>
    </group>
  );
}

function CityScene() {
  const [player, setPlayer] = useState<[number, number]>([0, 3]);
  const blocked = useMemo(
    () => BUILDINGS.map((b) => ({
      minX: b.x - b.w / 2 - 0.35,
      maxX: b.x + b.w / 2 + 0.35,
      minZ: b.z - b.d / 2 - 0.35,
      maxZ: b.z + b.d / 2 + 0.35,
    })),
    [],
  );

  function move(dx: number, dz: number) {
    setPlayer(([x, z]) => {
      const nx = THREE.MathUtils.clamp(x + dx, -10, 10);
      const nz = THREE.MathUtils.clamp(z + dz, -9, 9);
      if (blocked.some((b) => nx > b.minX && nx < b.maxX && nz > b.minZ && nz < b.maxZ)) {
        return [x, z];
      }
      return [nx, nz];
    });
  }

  return (
    <>
      <color attach="background" args={["#101310"]} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[-7, 14, 6]} intensity={2.2} castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 22]} />
        <meshStandardMaterial color="#34382d" map={CITY_TEXTURES.ground} roughness={1} />
      </mesh>

      {/* Estradas principais */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 22]} />
        <meshStandardMaterial color="#625746" map={CITY_TEXTURES.road} roughness={1} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 3.1]} />
        <meshStandardMaterial color="#625746" roughness={1} />
      </mesh>

      {/* Praça central */}
      <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.35, 8]} />
        <meshStandardMaterial color="#85765b" map={CITY_TEXTURES.plaza} roughness={1} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.45, 0.65, 0.4, 8]} />
        <meshStandardMaterial color="#9a927d" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 0.2, 8]} />
        <meshStandardMaterial color="#57777a" metalness={0.25} roughness={0.3} />
      </mesh>

      {/* Muralhas e portões */}
      {[
        [0, -10.4, 23, 0.7],
        [-11.4, 0, 0.7, 21],
        [11.4, 0, 0.7, 21],
        [-7.4, 10.4, 7.2, 0.7],
        [7.4, 10.4, 7.2, 0.7],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.55, z]} castShadow>
          <boxGeometry args={[w, 1.1, d]} />
          <meshStandardMaterial color="#555348" map={CITY_TEXTURES.wall} roughness={1} />
        </mesh>
      ))}

      {BUILDINGS.map((building, i) => (
        <BuildingModel key={i} building={building} />
      ))}

      {/* Personagem representado por um marcador visível */}
      <group position={[player[0], 0.38, player[1]]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.24, 0.3, 0.7, 8]} />
          <meshStandardMaterial color="#d2b16e" emissive="#5d421c" emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[0, 0.48, 0]}>
          <sphereGeometry args={[0.2, 12, 10]} />
          <meshStandardMaterial color="#c6b59a" />
        </mesh>
      </group>

      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        minPolarAngle={0.45}
        maxPolarAngle={1.25}
        minDistance={17}
        maxDistance={30}
        enablePan
      />
      <KeyboardMovement onMove={move} />
    </>
  );
}

function KeyboardMovement({ onMove }: { onMove: (dx: number, dz: number) => void }) {
  const handleKey = useCallback((event: KeyboardEvent) => {
    const keys: Record<string, [number, number]> = {
      ArrowUp: [0, -0.6], w: [0, -0.6], W: [0, -0.6],
      ArrowDown: [0, 0.6], s: [0, 0.6], S: [0, 0.6],
      ArrowLeft: [-0.6, 0], a: [-0.6, 0], A: [-0.6, 0],
      ArrowRight: [0.6, 0], d: [0.6, 0], D: [0.6, 0],
    };
    const direction = keys[event.key];
    if (!direction) return;
    event.preventDefault();
    onMove(direction[0], direction[1]);
  }, [onMove]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return null;
}

export function CityMap3D({ cityName = "Cidade de Platis" }: { cityName?: string }) {
  return (
    <section className="space-y-2">
      <header>
        <h2 className="font-display text-2xl">{cityName}</h2>
        <p className="text-xs text-muted">
          Exploração 3D · Use WASD ou as setas para caminhar. Edifícios bloqueiam o movimento.
        </p>
      </header>
      <div className="overflow-hidden rounded-xl border border-border bg-black" style={{ height: "min(68vh, 620px)", minHeight: 360 }}>
        <Canvas shadows camera={{ position: [14, 17, 19], fov: 42 }}>
          <CityScene />
        </Canvas>
      </div>
    </section>
  );
}
