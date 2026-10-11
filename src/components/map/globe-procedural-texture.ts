import { CanvasTexture, SRGBColorSpace, LinearFilter } from "three";
import { GLOBE_CONTINENTS } from "@/data/globe-geography";
import { CONTINENTS } from "@/data/world";

const AFFINITY_RGB: Record<string, [number, number, number]> = {
  vento: [106, 158, 148],
  luz: [196, 168, 74],
  trevas: [107, 90, 138],
  terra: [106, 125, 82],
  magico: [138, 106, 168],
  agua: [61, 122, 152],
  fogo: [184, 90, 60],
  fisico: [160, 128, 88],
};

const FALLBACK: [number, number, number] = [122, 138, 110];

/**
 * Gera textura equiretangular (2:1) dos 22 continentes para SphereGeometry.
 * Não depende de arquivo externo — tudo a partir de GLOBE_CONTINENTS.
 */
export function createPlatisEquirectTexture(
  width = 1024,
  height = 512,
): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // oceano dark fantasy
  const ocean = ctx.createLinearGradient(0, 0, 0, height);
  ocean.addColorStop(0, "#071018");
  ocean.addColorStop(0.5, "#0a1c28");
  ocean.addColorStop(1, "#071018");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, width, height);

  // ruído sutil no oceano
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.fillStyle = `rgba(40,90,110,${0.02 + Math.random() * 0.04})`;
    ctx.beginPath();
    ctx.arc(x, y, 1 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // continentes
  GLOBE_CONTINENTS.forEach((region, index) => {
    const continent = CONTINENTS.find((c) => c.id === region.id);
    const rgb =
      AFFINITY_RGB[continent?.affinity ?? ""] ?? FALLBACK;

    // equiretangular: lon -180..180 → x, lat 90..-90 → y
    const cx = ((region.longitude + 180) / 360) * width;
    const cy = ((90 - region.latitude) / 180) * height;
    const rx = (region.width / 360) * width * 0.55;
    const ry = (region.height / 180) * height * 0.55;

    // forma irregular com várias elipses sobrepostas
    const seed = index + 1;
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + seed;
      const ox = Math.cos(a) * rx * 0.35;
      const oy = Math.sin(a * 1.3) * ry * 0.35;
      const s = 0.55 + (k % 3) * 0.15;

      const grad = ctx.createRadialGradient(
        cx + ox,
        cy + oy,
        0,
        cx + ox,
        cy + oy,
        Math.max(rx, ry) * s,
      );
      grad.addColorStop(
        0,
        `rgba(${Math.min(255, rgb[0] + 30)},${Math.min(255, rgb[1] + 25)},${Math.min(255, rgb[2] + 20)},0.95)`,
      );
      grad.addColorStop(
        0.55,
        `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.88)`,
      );
      grad.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(
        cx + ox,
        cy + oy,
        rx * s,
        ry * s,
        a * 0.2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    // brilho costeiro
    ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.35)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.85, ry * 0.85, 0, 0, Math.PI * 2);
    ctx.stroke();
  });

  // névoa polar
  const north = ctx.createLinearGradient(0, 0, 0, height * 0.12);
  north.addColorStop(0, "rgba(180,200,210,0.12)");
  north.addColorStop(1, "rgba(180,200,210,0)");
  ctx.fillStyle = north;
  ctx.fillRect(0, 0, width, height * 0.12);

  const south = ctx.createLinearGradient(0, height, 0, height * 0.88);
  south.addColorStop(0, "rgba(180,200,210,0.1)");
  south.addColorStop(1, "rgba(180,200,210,0)");
  ctx.fillStyle = south;
  ctx.fillRect(0, height * 0.88, width, height * 0.12);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
