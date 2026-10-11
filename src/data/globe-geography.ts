/**
 * Posições geográficas dos 22 continentes no globo 3D.
 * Calibradas a partir da arte oficial (globe-platis) para alinhar
 * marcadores e malhas com os territórios pintados na textura.
 *
 * latitude:  -90 (sul) .. +90 (norte)
 * longitude: -180 .. +180 (0 ≈ centro da textura / face frontal da arte)
 * width/height: extensão angular aproximada do território (graus)
 */
export type GlobeContinent = {
  id: string;
  latitude: number;
  longitude: number;
  width: number;
  height: number;
};

export const GLOBE_CONTINENTS: GlobeContinent[] = [
  { id: "vindheim", latitude: 38, longitude: -78, width: 28, height: 22 },
  { id: "solheim", latitude: 18, longitude: -68, width: 30, height: 22 },
  { id: "nottland", latitude: 42, longitude: -28, width: 26, height: 22 },
  { id: "jordrike", latitude: -2, longitude: -88, width: 30, height: 26 },
  { id: "seidheim", latitude: 8, longitude: -38, width: 24, height: 22 },
  { id: "hafsvik", latitude: 28, longitude: -8, width: 26, height: 20 },
  { id: "eldfjall", latitude: -28, longitude: -42, width: 26, height: 24 },
  { id: "jarnvidr", latitude: -8, longitude: -48, width: 26, height: 22 },
  { id: "duat", latitude: 8, longitude: 28, width: 24, height: 26 },
  { id: "xibalba", latitude: -22, longitude: -92, width: 24, height: 22 },
  { id: "yomi", latitude: -42, longitude: -58, width: 24, height: 20 },
  { id: "wastes", latitude: 52, longitude: 12, width: 32, height: 24 },
  { id: "midgard", latitude: 8, longitude: 52, width: 28, height: 26 },
  { id: "asgard", latitude: 48, longitude: 62, width: 24, height: 20 },
  { id: "jotunheim", latitude: 22, longitude: 78, width: 26, height: 24 },
  { id: "alfheim", latitude: -22, longitude: 12, width: 28, height: 22 },
  { id: "svartalfheim", latitude: -28, longitude: 82, width: 24, height: 22 },
  { id: "muspelheim", latitude: -42, longitude: -5, width: 30, height: 22 },
  { id: "niflheim", latitude: 32, longitude: 48, width: 24, height: 20 },
  { id: "helheim", latitude: -8, longitude: 88, width: 22, height: 24 },
  { id: "vanaheim", latitude: -28, longitude: 48, width: 26, height: 22 },
  { id: "platis", latitude: 5, longitude: 2, width: 18, height: 18 },
];
