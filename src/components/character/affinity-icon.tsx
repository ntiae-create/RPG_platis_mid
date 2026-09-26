import {
  Droplets,
  Flame,
  Moon,
  Mountain,
  Sparkles,
  Sun,
  Swords,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { AffinityId } from "@/data/types";

const ICONS: Record<AffinityId, LucideIcon> = {
  fogo: Flame,
  agua: Droplets,
  terra: Mountain,
  vento: Wind,
  luz: Sun,
  trevas: Moon,
  fisico: Swords,
  magico: Sparkles,
};

export function AffinityIcon({ id, className }: { id: AffinityId; className?: string }) {
  const Icon = ICONS[id];
  return <Icon className={className} strokeWidth={1.75} />;
}
