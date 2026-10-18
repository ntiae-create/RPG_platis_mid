/**
 * Motor de exploração local 2D (vista de cima) com Three.js ortográfico.
 * Casas, ruas e quarteirões em torno da posição do jogador — mesmo grid do store.
 * Sem React Three Fiber.
 */
import * as THREE from "three";

function hash(x: number, z: number) {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

const COLORS = {
  ground: 0x2a2c28,
  road: 0x4a463c,
  roadEdge: 0x3a3830,
  house: [0x6b5a48, 0x5a5850, 0x7a6a52, 0x4a4e4c, 0x6e6258] as number[],
  roof: 0x3a3530,
  yard: 0x3a4a38,
  player: 0xe8c76b,
  other: 0x6b91b5,
  fog: 0x171816,
};

export type MapToken = {
  id: string;
  x: number;
  y: number;
  name: string;
  isSelf?: boolean;
};

export type CityMap2DEngineOptions = {
  container: HTMLElement;
  originX: number;
  originY: number;
  tokens?: MapToken[];
  radius?: number;
};

export type CityMap2DEngine = {
  dispose: () => void;
  setOrigin: (x: number, y: number) => void;
  setTokens: (tokens: MapToken[]) => void;
  resize: () => void;
};

const CELL = 1;

export function createCityMap2DEngine(
  options: CityMap2DEngineOptions,
): CityMap2DEngine {
  const radius = options.radius ?? 14;
  const container = options.container;

  let originX = options.originX;
  let originY = options.originY;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.fog);

  const camera = new THREE.OrthographicCamera(-16, 16, 12, -12, 0.1, 100);
  camera.position.set(0, 0, 50);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth || 320, container.clientHeight || 240);
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.touchAction = "none";
  container.appendChild(renderer.domElement);

  const world = new THREE.Group();
  scene.add(world);

  const tokenGroup = new THREE.Group();
  scene.add(tokenGroup);

  function isRoad(wx: number, wy: number) {
    return Math.abs(wx % 5) < 1 || Math.abs(wy % 5) < 1;
  }

  function buildChunk() {
    while (world.children.length) {
      const c = world.children[0];
      world.remove(c);
      if (c instanceof THREE.Mesh) {
        c.geometry.dispose();
        const m = c.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
    }

    {
      const size = (radius * 2 + 2) * CELL;
      const geo = new THREE.PlaneGeometry(size, size);
      const mat = new THREE.MeshBasicMaterial({ color: COLORS.ground });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = -0.2;
      world.add(mesh);
    }

    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const wx = originX + dx;
        const wy = originY + dz;
        const px = dx * CELL;
        const py = -dz * CELL;

        if (isRoad(wx, wy)) {
          const geo = new THREE.PlaneGeometry(CELL * 0.98, CELL * 0.98);
          const mat = new THREE.MeshBasicMaterial({ color: COLORS.road });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(px, py, 0);
          world.add(mesh);
          continue;
        }

        if (hash(wx, wy) < 0.22) {
          const geo = new THREE.PlaneGeometry(CELL * 0.92, CELL * 0.92);
          const mat = new THREE.MeshBasicMaterial({ color: COLORS.yard });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(px, py, 0);
          world.add(mesh);
          continue;
        }

        const w = 0.55 + hash(wx + 17, wy) * 0.35;
        const d = 0.55 + hash(wx, wy + 31) * 0.35;
        const color =
          COLORS.house[Math.floor(hash(wx + 53, wy + 7) * COLORS.house.length)];

        const body = new THREE.Mesh(
          new THREE.PlaneGeometry(w * CELL, d * CELL),
          new THREE.MeshBasicMaterial({ color }),
        );
        body.position.set(px, py, 0.05);
        world.add(body);

        const roof = new THREE.Mesh(
          new THREE.PlaneGeometry(w * CELL * 0.85, d * CELL * 0.4),
          new THREE.MeshBasicMaterial({ color: COLORS.roof }),
        );
        roof.position.set(px, py + d * CELL * 0.15, 0.1);
        world.add(roof);

        if (hash(wx + 91, wy + 13) > 0.55) {
          const door = new THREE.Mesh(
            new THREE.PlaneGeometry(0.12, 0.18),
            new THREE.MeshBasicMaterial({ color: 0x2a2418 }),
          );
          door.position.set(px, py - d * CELL * 0.35, 0.12);
          world.add(door);
        }
      }
    }
  }

  function rebuildTokens(tokens: MapToken[]) {
    while (tokenGroup.children.length) {
      const c = tokenGroup.children[0];
      tokenGroup.remove(c);
      if (c instanceof THREE.Mesh) {
        c.geometry.dispose();
        (c.material as THREE.Material).dispose();
      }
    }

    for (const t of tokens) {
      const dx = (t.x - originX) * CELL;
      const dy = -(t.y - originY) * CELL;
      const r = t.isSelf ? 0.28 : 0.24;
      const mesh = new THREE.Mesh(
        new THREE.CircleGeometry(r, 12),
        new THREE.MeshBasicMaterial({
          color: t.isSelf ? COLORS.player : COLORS.other,
        }),
      );
      mesh.position.set(dx, dy, 0.5);
      tokenGroup.add(mesh);

      if (t.isSelf) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.32, 0.4, 16),
          new THREE.MeshBasicMaterial({
            color: 0xf8d77a,
            side: THREE.DoubleSide,
          }),
        );
        ring.position.set(dx, dy, 0.51);
        tokenGroup.add(ring);
      }
    }
  }

  buildChunk();
  rebuildTokens(options.tokens ?? []);

  function updateCamera() {
    const w = container.clientWidth || 320;
    const h = container.clientHeight || 240;
    const aspect = w / Math.max(h, 1);
    const halfH = 11;
    const halfW = halfH * aspect;
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
  }
  updateCamera();

  let raf = 0;
  let disposed = false;
  function loop() {
    if (disposed) return;
    raf = requestAnimationFrame(loop);
    renderer.render(scene, camera);
  }
  loop();

  function resize() {
    const w = container.clientWidth || 320;
    const h = container.clientHeight || 240;
    renderer.setSize(w, h, false);
    updateCamera();
  }

  const ro =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => resize())
      : null;
  ro?.observe(container);

  let lastOx = originX;
  let lastOy = originY;

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m?.dispose();
        }
      });
    },
    setOrigin(x, y) {
      if (x === lastOx && y === lastOy) return;
      lastOx = x;
      lastOy = y;
      originX = x;
      originY = y;
      buildChunk();
    },
    setTokens(tokens) {
      rebuildTokens(tokens);
    },
    resize,
  };
}

/** @deprecated use createCityMap2DEngine */
export const createWorldMap2DEngine = createCityMap2DEngine;
export type WorldMap2DEngine = CityMap2DEngine;
