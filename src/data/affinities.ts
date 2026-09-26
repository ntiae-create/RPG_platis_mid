import type { AffinityDef, AffinityId } from "./types";

export const AFFINITIES: AffinityDef[] = [
  {
    id: "fogo",
    name: "Fogo",
    symbol: "chama",
    icon: "Flame",
    card: "Vermelho / Laranja",
    effect: "Chamas animadas + brilho quente",
  },
  {
    id: "agua",
    name: "Água",
    symbol: "gota",
    icon: "Droplets",
    card: "Azul / Ciano",
    effect: "Ondas fluidas + reflexo líquido",
  },
  {
    id: "terra",
    name: "Terra",
    symbol: "pedra",
    icon: "Mountain",
    card: "Marrom / Verde terra",
    effect: "Textura de pedra + partículas",
  },
  {
    id: "vento",
    name: "Vento",
    symbol: "vento",
    icon: "Wind",
    card: "Verde-claro / Branco",
    effect: "Linhas de vento + folhas flutuando",
  },
  {
    id: "luz",
    name: "Luz",
    symbol: "sol",
    icon: "Sun",
    card: "Dourado / Branco",
    effect: "Halo luminoso + brilho sagrado",
  },
  {
    id: "trevas",
    name: "Trevas",
    symbol: "lua",
    icon: "Moon",
    card: "Roxo-escuro / Preto",
    effect: "Sombras pulsantes + partículas escuras",
  },
  {
    id: "fisico",
    name: "Físico",
    symbol: "lamina",
    icon: "Swords",
    card: "Cinza metálico",
    effect: "Brilho de metal + faíscas",
  },
  {
    id: "magico",
    name: "Mágico",
    symbol: "runa",
    icon: "Sparkles",
    card: "Roxo / Rosa mágico",
    effect: "Partículas mágicas + runas flutuando",
  },
];

export const AFFINITY_BY_ID: Record<AffinityId, AffinityDef> = Object.fromEntries(
  AFFINITIES.map((a) => [a.id, a]),
) as Record<AffinityId, AffinityDef>;
