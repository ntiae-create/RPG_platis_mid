import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { COMBAT_DICE } from "@/data/progression";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function DieMesh({ sides, spinning, value }: { sides: number; spinning: boolean; value: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const vel = useRef(new THREE.Vector3(5.2, 6.4, 3.8));
  useFrame((_, delta) => {
    const d = Math.min(delta, 0.1);
    const m = ref.current;
    if (!m) return;
    if (spinning) {
      m.rotation.x += vel.current.x * d;
      m.rotation.y += vel.current.y * d;
      m.rotation.z += vel.current.z * d;
    } else {
      const targetY = (value / Math.max(1, sides)) * Math.PI * 2;
      m.rotation.x += (0.35 - m.rotation.x) * Math.min(1, d * 5);
      m.rotation.y += (targetY - m.rotation.y) * Math.min(1, d * 5);
      m.rotation.z += (0.12 - m.rotation.z) * Math.min(1, d * 5);
    }
  });

  const geo = useMemo(() => {
    if (sides <= 4) return new THREE.TetrahedronGeometry(0.95);
    if (sides <= 6) return new THREE.BoxGeometry(1.15, 1.15, 1.15);
    if (sides <= 8) return new THREE.OctahedronGeometry(0.95);
    if (sides <= 12) return new THREE.DodecahedronGeometry(0.9);
    if (sides <= 20) return new THREE.IcosahedronGeometry(0.95);
    return new THREE.CylinderGeometry(0.7, 0.7, 0.45, 12);
  }, [sides]);

  return (
    <mesh ref={ref} geometry={geo} castShadow>
      <meshStandardMaterial color="#e8e0d0" roughness={0.28} metalness={0.18} />
    </mesh>
  );
}

export function DiceTray({
  last,
  onRoll,
}: {
  last: { sides: number; value: number; label: string } | null;
  onRoll: (sides: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [custom, setCustom] = useState("16");
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!last) return;
    setSpinning(true);
    const t = window.setTimeout(() => setSpinning(false), 900);
    return () => window.clearTimeout(t);
  }, [last]);

  return (
    <div className="panel overflow-hidden rounded-xl">
      <div className="relative h-48 bg-bg">
        <img src="/felt.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-50" />
        {mounted && (
          <Canvas camera={{ position: [0, 0, 3.2], fov: 40 }} dpr={[1, 2]} className="relative">
            <ambientLight intensity={0.55} />
            <directionalLight position={[3, 4, 2]} intensity={1.3} />
            <DieMesh sides={last?.sides ?? 20} spinning={spinning} value={last?.value ?? 1} />
          </Canvas>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center">
          <div className="font-display text-4xl tabular">{spinning ? "· · ·" : (last?.value ?? "—")}</div>
          <div className="text-[11px] text-muted">{last?.label ?? "Toque um dado"}</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 p-3">
        {COMBAT_DICE.map((d) => (
          <Button key={d} size="sm" variant="secondary" onClick={() => onRoll(d)}>
            D{d}
          </Button>
        ))}
        <Input
          className="h-9 w-20"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          aria-label="Dado personalizado"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const n = Math.max(2, Math.min(1000, Number(custom) || 16));
            onRoll(n);
          }}
        >
          D?
        </Button>
      </div>
    </div>
  );
}
