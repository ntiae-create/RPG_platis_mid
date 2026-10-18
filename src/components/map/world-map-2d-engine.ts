/**
 * Motor de mapa mundial 2D com Three.js (câmera ortográfica).
 * Sem React Three Fiber — apenas three.
 *
 * Coordenadas: usa GLOBE_CONTINENTS (lat/lon) → plano ortográfico.
 * Interação: pan (1 dedo), pinch-zoom, toque para selecionar.
 */
import * as THREE from "three";
import { CONTINENTS, BOSSES, type Continent } from "@/data/world";
import { GLOBE_CONTINENTS } from "@/data/globe-geography";

const AFFINITY_COLORS: Record<string, number> = {
  vento: 0x6a9e94,
  luz: 0xc4a84a,
  trevas: 0x8b7ab8,
  terra: 0x7d9b63,
  magico: 0xb18bd1,
  agua: 0x559ec8,
  fogo: 0xd56d4d,
  fisico: 0xc49a72,
};

const OCEAN = 0x0a1620;
const GRID = 0x1a2a38;
const SELECTED = 0xf5e6c8;
const PLAYER = 0xe8c76b;
const BOSS = 0xb54a3c;

/** Converte lat/lon em posição no plano do mapa (unidades de cena). */
export function geoToPlane(lat: number, lon: number): { x: number; y: number } {
  const x = lon * 0.55;
  const y = lat * 0.55;
  return { x, y };
}

export type ContinentNode = {
  id: string;
  name: string;
  biome: string;
  affinity?: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
  color: number;
  bossName?: string;
};

export function buildContinentNodes(): ContinentNode[] {
  return GLOBE_CONTINENTS.map((g) => {
    const continent = CONTINENTS.find((c) => c.id === g.id);
    if (!continent) return null;
    const { x, y } = geoToPlane(g.latitude, g.longitude);
    const boss = BOSSES.find((b) => b.continentId === g.id);
    return {
      id: g.id,
      name: continent.name,
      biome: continent.biome,
      affinity: continent.affinity,
      x,
      y,
      rx: Math.max(4.5, g.width * 0.32),
      ry: Math.max(3.5, g.height * 0.26),
      color: AFFINITY_COLORS[continent.affinity ?? ""] ?? 0x8a9a7e,
      bossName: boss?.name,
    };
  }).filter(Boolean) as ContinentNode[];
}

export type WorldMap2DEngineOptions = {
  container: HTMLElement;
  onSelectContinent?: (id: string) => void;
  playerContinentId?: string | null;
  exploredContinentIds?: Set<string> | string[];
};

export type WorldMap2DEngine = {
  dispose: () => void;
  setSelected: (id: string | null) => void;
  setPlayerContinent: (id: string | null) => void;
  setExplored: (ids: Set<string> | string[]) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resize: () => void;
  getSelectedId: () => string | null;
};

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 3.2;
const ZOOM_STEP = 1.18;

export function createWorldMap2DEngine(
  options: WorldMap2DEngineOptions,
): WorldMap2DEngine {
  const { container, onSelectContinent } = options;
  const nodes = buildContinentNodes();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(OCEAN);

  const camera = new THREE.OrthographicCamera(-50, 50, 35, -35, 0.1, 500);
  camera.position.set(0, 0, 100);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth || 320, container.clientHeight || 240);
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.touchAction = "none";
  container.appendChild(renderer.domElement);

  {
    const geo = new THREE.PlaneGeometry(240, 160);
    const mat = new THREE.MeshBasicMaterial({ color: OCEAN });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = -2;
    scene.add(mesh);
  }
  {
    const grid = new THREE.GridHelper(200, 40, GRID, GRID);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -1.5;
    const mat = grid.material as THREE.Material | THREE.Material[];
    if (Array.isArray(mat)) {
      mat.forEach((m) => {
        m.transparent = true;
        (m as THREE.Material & { opacity: number }).opacity = 0.35;
      });
    } else {
      mat.transparent = true;
      (mat as THREE.Material & { opacity: number }).opacity = 0.35;
    }
    scene.add(grid);
  }

  {
    const eqMat = new THREE.LineBasicMaterial({
      color: 0x2a4a58,
      transparent: true,
      opacity: 0.5,
    });
    const eqPts = [new THREE.Vector3(-110, 0, -1), new THREE.Vector3(110, 0, -1)];
    scene.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(eqPts), eqMat),
    );
    const merPts = [new THREE.Vector3(0, -80, -1), new THREE.Vector3(0, 80, -1)];
    scene.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(merPts), eqMat),
    );
  }

  const continentGroup = new THREE.Group();
  scene.add(continentGroup);

  const meshById = new Map<string, THREE.Mesh>();
  const baseColorById = new Map<string, number>();
  let selectedId: string | null = null;
  let playerContinentId: string | null = options.playerContinentId ?? null;
  let explored = new Set(
    Array.isArray(options.exploredContinentIds)
      ? options.exploredContinentIds
      : options.exploredContinentIds
        ? [...options.exploredContinentIds]
        : [],
  );

  const playerMarker = new THREE.Mesh(
    new THREE.CircleGeometry(1.1, 16),
    new THREE.MeshBasicMaterial({ color: PLAYER }),
  );
  playerMarker.position.z = 2;
  playerMarker.visible = false;
  scene.add(playerMarker);

  for (const n of nodes) {
    const shape = new THREE.Shape();
    const segs = 28;
    for (let i = 0; i <= segs; i++) {
      const t = (i / segs) * Math.PI * 2;
      const wobble =
        0.88 +
        0.1 * Math.sin(t * 3 + n.id.length) +
        0.05 * Math.cos(t * 5);
      const px = Math.cos(t) * n.rx * wobble;
      const py = Math.sin(t) * n.ry * wobble;
      if (i === 0) shape.moveTo(px, py);
      else shape.lineTo(px, py);
    }
    const geo = new THREE.ShapeGeometry(shape);
    const mat = new THREE.MeshBasicMaterial({
      color: n.color,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(n.x, n.y, 0);
    mesh.userData.continentId = n.id;
    mesh.userData.name = n.name;
    continentGroup.add(mesh);
    meshById.set(n.id, mesh);
    baseColorById.set(n.id, n.color);

    const edge = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(
      edge,
      new THREE.LineBasicMaterial({
        color: 0x0a1018,
        transparent: true,
        opacity: 0.55,
      }),
    );
    line.position.copy(mesh.position);
    line.position.z = 0.2;
    continentGroup.add(line);

    if (n.bossName) {
      const bossMesh = new THREE.Mesh(
        new THREE.CircleGeometry(0.9, 10),
        new THREE.MeshBasicMaterial({ color: BOSS }),
      );
      bossMesh.position.set(n.x + n.rx * 0.35, n.y + n.ry * 0.35, 1);
      bossMesh.userData.continentId = n.id;
      continentGroup.add(bossMesh);
    }
  }

  function applyVisualState() {
    for (const [id, mesh] of meshById) {
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const base = baseColorById.get(id) ?? 0x8a9a7e;
      const isSelected = id === selectedId;
      const isExplored = explored.has(id);
      const isPlayer = id === playerContinentId;

      if (isSelected) {
        mat.color.setHex(SELECTED);
        mat.opacity = 1;
      } else if (isPlayer) {
        mat.color.setHex(base);
        mat.opacity = 1;
      } else if (isExplored) {
        mat.color.setHex(base);
        mat.opacity = 0.9;
      } else {
        mat.color.setHex(base);
        mat.opacity = 0.55;
      }
    }

    if (playerContinentId && meshById.has(playerContinentId)) {
      const m = meshById.get(playerContinentId)!;
      playerMarker.position.set(m.position.x, m.position.y, 2);
      playerMarker.visible = true;
    } else {
      playerMarker.visible = false;
    }
  }
  applyVisualState();

  let camX = 0;
  let camY = 0;
  let zoom = 1;

  function updateCamera() {
    const w = container.clientWidth || 320;
    const h = container.clientHeight || 240;
    const aspect = w / h;
    const halfH = 42 / zoom;
    const halfW = halfH * aspect;
    camera.left = camX - halfW;
    camera.right = camX + halfW;
    camera.top = camY + halfH;
    camera.bottom = camY - halfH;
    camera.updateProjectionMatrix();
  }
  updateCamera();

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function pickContinent(clientX: number, clientY: number): string | null {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([...meshById.values()], false);
    if (hits.length === 0) return null;
    return (hits[0].object.userData.continentId as string) ?? null;
  }

  let dragging = false;
  let moved = false;
  let lastX = 0;
  let lastY = 0;
  let activePointers = new Map<number, { x: number; y: number }>();
  let pinchStartDist = 0;
  let pinchStartZoom = 1;

  function onPointerDown(ev: PointerEvent) {
    activePointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    renderer.domElement.setPointerCapture(ev.pointerId);

    if (activePointers.size === 1) {
      dragging = true;
      moved = false;
      lastX = ev.clientX;
      lastY = ev.clientY;
    } else if (activePointers.size === 2) {
      dragging = false;
      const pts = [...activePointers.values()];
      pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStartZoom = zoom;
    }
  }

  function onPointerMove(ev: PointerEvent) {
    if (!activePointers.has(ev.pointerId)) return;
    activePointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });

    if (activePointers.size === 2) {
      const pts = [...activePointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchStartDist > 0) {
        zoom = THREE.MathUtils.clamp(
          pinchStartZoom * (dist / pinchStartDist),
          MIN_ZOOM,
          MAX_ZOOM,
        );
        updateCamera();
      }
      return;
    }

    if (!dragging) return;
    const dx = ev.clientX - lastX;
    const dy = ev.clientY - lastY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;

    const rect = renderer.domElement.getBoundingClientRect();
    const halfH = 42 / zoom;
    const halfW = halfH * (rect.width / Math.max(rect.height, 1));
    camX -= (dx / rect.width) * halfW * 2;
    camY += (dy / rect.height) * halfH * 2;
    camX = THREE.MathUtils.clamp(camX, -100, 100);
    camY = THREE.MathUtils.clamp(camY, -70, 70);
    lastX = ev.clientX;
    lastY = ev.clientY;
    updateCamera();
  }

  function onPointerUp(ev: PointerEvent) {
    const wasMoved = moved;
    activePointers.delete(ev.pointerId);
    try {
      renderer.domElement.releasePointerCapture(ev.pointerId);
    } catch {
      /* ignore */
    }

    if (activePointers.size === 0) {
      if (dragging && !wasMoved) {
        const id = pickContinent(ev.clientX, ev.clientY);
        if (id) {
          selectedId = id;
          applyVisualState();
          onSelectContinent?.(id);
        }
      }
      dragging = false;
      moved = false;
    } else if (activePointers.size === 1) {
      const remaining = [...activePointers.values()][0];
      lastX = remaining.x;
      lastY = remaining.y;
      dragging = true;
      moved = false;
    }
  }

  function onWheel(ev: WheelEvent) {
    ev.preventDefault();
    const factor = ev.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP;
    zoom = THREE.MathUtils.clamp(zoom * factor, MIN_ZOOM, MAX_ZOOM);
    updateCamera();
  }

  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointercancel", onPointerUp);
  renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

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

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry?.dispose();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m?.dispose();
        }
      });
    },
    setSelected(id) {
      selectedId = id;
      applyVisualState();
    },
    setPlayerContinent(id) {
      playerContinentId = id;
      applyVisualState();
    },
    setExplored(ids) {
      explored = new Set(Array.isArray(ids) ? ids : [...ids]);
      applyVisualState();
    },
    zoomIn() {
      zoom = THREE.MathUtils.clamp(zoom * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);
      updateCamera();
    },
    zoomOut() {
      zoom = THREE.MathUtils.clamp(zoom / ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);
      updateCamera();
    },
    resize,
    getSelectedId: () => selectedId,
  };
}

export function listContinentSummaries(): Array<{
  id: string;
  name: string;
  biome: string;
  affinity?: string;
  bossName?: string;
}> {
  return buildContinentNodes().map((n) => ({
    id: n.id,
    name: n.name,
    biome: n.biome,
    affinity: n.affinity,
    bossName: n.bossName,
  }));
}

void (null as unknown as Continent | null);
