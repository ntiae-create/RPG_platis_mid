import type { ReactNode } from "react";
import {
  Backpack,
  Dices,
  Map,
  ScrollText,
  Swords,
  UserRound,
  Users,
} from "lucide-react";
import type { MesaTab } from "@/lib/store";
import { usePlatis } from "@/lib/store";
import { cn } from "@/lib/utils";

const TABS: { id: MesaTab; label: string; icon: typeof Map; master?: boolean }[] = [
  { id: "personagem", label: "Personagem", icon: UserRound },
  { id: "mapa", label: "Mapa", icon: Map },
  { id: "combate", label: "Combate", icon: Swords },
  { id: "habilidades", label: "Habilidades", icon: ScrollText },
  { id: "inventario", label: "Inventário", icon: Backpack },
  { id: "mundo", label: "Mundo", icon: Dices },
  { id: "mesa", label: "Mesa", icon: Users, master: true },
];

export function MesaShell({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar?: ReactNode;
}) {
  const role = usePlatis((s) => s.role);
  const tab = usePlatis((s) => s.tab);
  const setTab = usePlatis((s) => s.setTab);
  const tabs = TABS.filter((t) => !t.master || role === "mestre");

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur-sm">
        <div>
          <p className="font-display text-xl leading-none">Platis</p>
          <p className="text-[11px] tracking-wide text-muted uppercase">
            {role === "mestre" ? "Mestre da mesa" : "Jogador"}
          </p>
        </div>
        <nav className="hidden items-center gap-1 lg:flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { console.log("TAB:", t.id); setTab(t.id); }}
              className={cn(
                "flex h-11 items-center gap-2 rounded-md px-3 text-sm",
                tab === t.id ? "bg-raised" : "text-muted hover:text-ink",
              )}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-4 px-4 py-4 pb-28 lg:grid-cols-[minmax(0,1fr)_320px] lg:pb-6">
        <main>{children}</main>
        {sidebar && <aside className="hidden lg:block">{sidebar}</aside>}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 gap-1 border-t border-line bg-bg/95 px-2 py-2 lg:hidden">
        {tabs.slice(0, 8).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { console.log("TAB:", t.id); setTab(t.id); }}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-md text-[10px]",
              tab === t.id ? "bg-raised text-ink" : "text-muted",
            )}
          >
            <t.icon className="size-4" />
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
