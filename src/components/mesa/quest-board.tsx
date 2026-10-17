import { usePlatis } from "@/lib/store";
import { Button } from "@/components/ui/button";

type Props = {
  onRespond: (questId: string, accept: boolean) => void;
};

export function QuestBoard({ onRespond }: Props) {
  const quests = usePlatis((s) => s.quests);
  const selfId = usePlatis((s) => s.selfId);

  const published = quests.filter((q) => q.status === "publicada");

  return (
    <section className="panel space-y-4 border border-line p-4">
      <div>
        <h2 className="font-display text-2xl">Quadro de Missões</h2>
        <p className="text-sm text-muted">
          Cartazes publicados pelo Mestre. Escolha suas missões.
        </p>
      </div>

      {published.length === 0 && (
        <p className="rounded-lg border border-line p-4 text-sm text-muted">
          Nenhuma missão publicada no momento.
        </p>
      )}

      {published.map((quest) => {
        const participation = quest.participations.find(
          (p) => p.characterId === selfId,
        );

        return (
          <article key={quest.id} className="space-y-3 rounded-xl border border-line bg-raised/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-xl">{quest.title}</h3>
              <span className="rounded-full border border-line px-3 py-1 text-xs">
                {quest.difficulty}
              </span>
            </div>

            <p className="whitespace-pre-wrap text-sm">{quest.description}</p>

            <div className="rounded-lg border border-line p-3">
              <p className="text-xs uppercase tracking-wide text-muted">Objetivo</p>
              <p className="mt-1 text-sm">{quest.objective}</p>
            </div>

            <p className="text-sm text-muted">
              Recompensa: {quest.reward.xp ?? 0} XP
            </p>

            {participation ? (
              <p className="text-sm font-medium">
                {participation.status === "aceita"
                  ? "✓ Missão aceita"
                  : participation.status === "recusada"
                    ? "Missão recusada"
                    : "Missão concluída"}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => onRespond(quest.id, true)}>
                  Aceitar missão
                </Button>
                <Button variant="outline" onClick={() => onRespond(quest.id, false)}>
                  Recusar
                </Button>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
