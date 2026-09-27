import { PersistGate } from "@/components/persist-gate";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { usePlatis } from "@/lib/store";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RACES } from "@/data/races";
import { CLASSES } from "@/data/classes";
import { CONTINENTS, TOTAL_DUNGEON_COUNT, BOSSES } from "@/data/world";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <PersistGate>
      <Landing />
    </PersistGate>
  );
}

function Landing() {
  const nav = useNavigate();
  const setRole = usePlatis((s) => s.setRole);
  const selfId = usePlatis((s) => s.selfId);
  const resetAll = usePlatis((s) => s.resetAll);
  const { user, isPending } = useCurrentUserState();

  function enter(role: "jogador" | "mestre") {
    setRole(role);

    if (isPending) return;

    if (!user) {
      nav({ to: "/login" });
      return;
    }

    nav({ to: selfId ? "/mesa" : "/criar" });
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-bg">
      <img src="/hero.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/30" />
      <div className="relative mx-auto flex min-h-dvh max-w-3xl flex-col justify-end px-5 py-10">
        <div className="stagger-in space-y-5 pb-4">
          <p className="text-xs tracking-[0.28em] text-muted uppercase">Mesa virtual</p>
          <h1 className="font-display text-5xl sm:text-6xl">RPG Platis</h1>
          <p className="max-w-lg text-sm text-muted sm:text-base">
            Vinte e cinco raças. Quarenta e três classes. Oito afinidades. Um mapa-múndi de vinte e dois
            continentes, cada célula uma nova grade 2000×3000. Combate D20 com dados 3D. O Mestre é a
            autoridade da mesa.
          </p>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat n={RACES.length} l="Raças" />
            <Stat n={CLASSES.length} l="Classes" />
            <Stat n={CONTINENTS.length} l="Continentes" />
            <Stat n={BOSSES.length} l="Bosses" />
            <Stat n={TOTAL_DUNGEON_COUNT} l="Dungeons" />
            <Stat n={8} l="Afinidades" />
            <Stat n={9} l="Brasões" />
            <Stat n={8} l="Slots" />
          </dl>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="lg" onClick={() => enter("jogador")}>
              Entrar como jogador
            </Button>
            <Button size="lg" variant="secondary" onClick={() => enter("mestre")}>
              Entrar como mestre
            </Button>
          </div>
          {selfId && (
            <button
              type="button"
              className="text-xs text-muted underline-offset-4 hover:underline"
              onClick={resetAll}
            >
              Apagar mesa salva
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="rounded-lg bg-bg/50 px-3 py-2 backdrop-blur-sm">
      <div className="font-display text-2xl tabular leading-none">{n}</div>
      <div className="mt-1 text-[11px] text-muted">{l}</div>
    </div>
  );
}
