import { useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import { usePlatis } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
} from "lucide-react";

function hash(x: number, z: number) {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function City({ originX, originY }: { originX: number; originY: number }) {
  const buildings = useMemo(() => {
    const items: {
      x: number;
      z: number;
      w: number;
      d: number;
      h: number;
      roof: number;
    }[] = [];

    for (let dz = -18; dz <= 18; dz++) {
      for (let dx = -18; dx <= 18; dx++) {
        const wx = originX + dx;
        const wy = originY + dz;

        if (Math.abs(wx % 5) < 1 || Math.abs(wy % 5) < 1) continue;
        if (hash(wx, wy) < 0.24) continue;

        items.push({
          x: dx,
          z: dz,
          w: 0.65 + hash(wx + 17, wy) * 0.65,
          d: 0.65 + hash(wx, wy + 31) * 0.65,
          h: 0.8 + hash(wx + 53, wy + 7) * 2.2,
          roof: hash(wx + 91, wy + 13),
        });
      }
    }
    return items;
  }, [originX, originY]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#292a27" />
      </mesh>

      {Array.from({ length: 9 }, (_, i) => i - 4).map((i) => (
        <group key={i}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[i * 5, -0.08, 0]}>
            <planeGeometry args={[1.2, 40]} />
            <meshStandardMaterial color="#555047" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.075, i * 5]}>
            <planeGeometry args={[40, 1.2]} />
            <meshStandardMaterial color="#555047" />
          </mesh>
        </group>
      ))}

      {buildings.map((b, i) => (
        <group key={`${b.x}:${b.z}`} position={[b.x, 0, b.z]}>
          <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial
              color={["#625448", "#494944", "#76634c", "#3d4140"][Math.floor(b.roof * 4)]}
              roughness={0.95}
            />
          </mesh>
          <mesh position={[0, b.h + 0.05, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[Math.max(b.w, b.d) * 0.76, 0.5, 4]} />
            <meshStandardMaterial color="#302d2b" roughness={1} />
          </mesh>
          {i % 7 === 0 && (
            <mesh position={[0, 0.015, 0]}>
              <boxGeometry args={[b.w + 0.25, 0.03, b.d + 0.25]} />
              <meshStandardMaterial color="#77705c" />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

function PlayerToken({
  x,
  z,
  isSelf = false,
}: {
  x: number;
  z: number;
  name: string;
  isSelf?: boolean;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.23, 0.28, 0.24, 8]} />
        <meshStandardMaterial color={isSelf ? "#d4b56c" : "#6b91b5"} />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow>
        <sphereGeometry args={[0.17, 12, 10]} />
        <meshStandardMaterial color={isSelf ? "#e8d7a2" : "#c6d0d6"} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial color={isSelf ? "#f8d77a" : "#a9d9ff"} />
      </mesh>
    </group>
  );
}

function FollowCamera({ x, z }: { x: number; z: number }) {
  useFrame(({ camera }) => {
    const target = new THREE.Vector3(x, 0, z);
    const desired = new THREE.Vector3(x, 30, z);
    camera.position.lerp(desired, 0.14);
    camera.lookAt(target);
  });
  return null;
}

export function ExplorationMap() {
  const selfId = usePlatis((s) => s.selfId);
  const characters = usePlatis((s) => s.characters);
  const continentId = usePlatis((s) => s.continentId);
  const layer = usePlatis((s) => s.layer);
  const moveSelf = usePlatis((s) => s.moveSelf);

  const self = selfId ? characters[selfId] : undefined;
  const worldX = self?.position.x ?? 0;
  const worldY = self?.position.y ?? 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")
      )
        return;

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

  const otherPlayers = useMemo(
    () =>
      Object.values(characters).filter(
        (ch) =>
          ch.id !== selfId &&
          ch.position.continentId ===
            (self?.position.continentId ?? continentId) &&
          ch.position.layer === (self?.position.layer ?? layer) &&
          Math.abs(ch.position.x - worldX) <= 18 &&
          Math.abs(ch.position.y - worldY) <= 18,
      ),
    [
      characters,
      selfId,
      self?.position.continentId,
      self?.position.layer,
      continentId,
      layer,
      worldX,
      worldY,
    ],
  );

  return (
    <div className="relative h-[min(72vh,680px)] min-h-[360px] w-full overflow-hidden rounded-xl border border-line bg-[#171816]">
      <Canvas shadows dpr={[1, 1.5]}>
        <OrthographicCamera
          makeDefault
          position={[0, 30, 0]}
          zoom={23}
          near={0.1}
          far={100}
        />
        <ambientLight intensity={1.15} />
        <directionalLight position={[7, 18, 5]} intensity={1.8} castShadow />
        <City originX={worldX} originY={worldY} />
        <PlayerToken x={0} z={0} name={self?.name ?? "Personagem"} isSelf />
        {otherPlayers.map((ch) => (
          <PlayerToken
            key={ch.id}
            x={ch.position.x - worldX}
            z={ch.position.y - worldY}
            name={ch.name}
          />
        ))}
        <FollowCamera x={0} z={0} />
      </Canvas>

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
        WASD / setas ou D-pad · cidades de cima
      </div>

      {!self && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-5 text-center text-sm text-white">
          Selecione um personagem na mesa para começar a explorar.
        </div>
      )}
    </div>
  );
}
