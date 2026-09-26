import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CreateForm } from "@/components/character/create-form";
import { PersistGate } from "@/components/persist-gate";
import { usePlatis } from "@/lib/store";

export const Route = createFileRoute("/criar")({ component: CriarPage });

function CriarPage() {
  return (
    <PersistGate>
      <Criar />
    </PersistGate>
  );
}

function Criar() {
  const nav = useNavigate();
  const role = usePlatis((s) => s.role) ?? "jogador";
  const add = usePlatis((s) => s.addCharacter);
  const seed = usePlatis((s) => s.seedDemo);
  return (
    <main className="min-h-dvh bg-bg px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs tracking-[0.22em] text-muted uppercase">Criação</p>
        <h1 className="font-display mt-1 text-4xl">
          {role === "mestre" ? "Personagem do Mestre" : "Seu personagem"}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Nível 1, Sem Brasão, três slots de habilidade. Status final = base racial + bônus da classe. Rare,
          Legendary e Extreme desbloqueiam por missão. Extra só o Mestre libera.
        </p>
        <div className="mt-8">
          <CreateForm
            isMaster={role === "mestre"}
            onCreated={(ch) => {
              seed();
              add(ch, true);
              nav({ to: "/mesa" });
            }}
          />
        </div>
      </div>
    </main>
  );
}
