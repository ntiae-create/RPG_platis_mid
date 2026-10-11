export type GlobeContinent = {
  id: string;
  latitude: number;
  longitude: number;
  width: number;
  height: number;
};

export const GLOBE_CONTINENTS: GlobeContinent[] = [
  { id: "vindheim", latitude: 55, longitude: -135, width: 30, height: 22 },
  { id: "solheim", latitude: 30, longitude: -90, width: 28, height: 20 },
  { id: "nottland", latitude: 55, longitude: -35, width: 26, height: 24 },
  { id: "jordrike", latitude: 5, longitude: -145, width: 32, height: 26 },
  { id: "seidheim", latitude: 15, longitude: -65, width: 28, height: 24 },
  { id: "hafsvik", latitude: 35, longitude: 15, width: 28, height: 20 },
  { id: "eldfjall", latitude: -15, longitude: -125, width: 24, height: 30 },
  { id: "jarnvidr", latitude: -5, longitude: -55, width: 30, height: 26 },
  { id: "duat", latitude: 5, longitude: 45, width: 30, height: 24 },
  { id: "xibalba", latitude: -35, longitude: -150, width: 24, height: 22 },
  { id: "yomi", latitude: -40, longitude: -95, width: 28, height: 24 },
  { id: "wastes", latitude: 60, longitude: 95, width: 30, height: 22 },
  { id: "midgard", latitude: 0, longitude: 115, width: 35, height: 30 },
  { id: "asgard", latitude: 65, longitude: 155, width: 24, height: 20 },
  { id: "jotunheim", latitude: 25, longitude: 165, width: 26, height: 24 },
  { id: "alfheim", latitude: -10, longitude: 70, width: 28, height: 22 },
  { id: "svartalfheim", latitude: -55, longitude: 5, width: 30, height: 20 },
  { id: "muspelheim", latitude: -60, longitude: -45, width: 26, height: 20 },
  { id: "niflheim", latitude: 35, longitude: 135, width: 25, height: 24 },
  { id: "helheim", latitude: -25, longitude: 155, width: 26, height: 24 },
  { id: "vanaheim", latitude: -25, longitude: 95, width: 28, height: 22 },
  { id: "platis", latitude: 15, longitude: 5, width: 20, height: 18 },
];
