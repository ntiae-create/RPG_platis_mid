import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePlatis } from "@/lib/store";

export function CtePanel() {
  const activeMasterEventId = usePlatis((s) => s.activeMasterEventId);
  const activeMasterEvent = usePlatis((s) =>
    activeMasterEventId
      ? s.masterEvents.find((event) => event.id === activeMasterEventId) ?? null
      : null,
  );
  const role = usePlatis((s) => s.role);
  const selfId = usePlatis((s) => s.selfId);
  const respondToCte = usePlatis((s) => s.respondToCte);
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (
      !activeMasterEvent ||
      activeMasterEvent.type !== "cte" ||
      activeMasterEvent.cteStatus === "executado"
    ) {
      setRemainingMs(0);
      return;
    }

    const duration = activeMasterEvent.timerMs ?? 3000;
    const endAt = Date.now() + duration;

    setRemainingMs(duration);

    const interval = window.setInterval(() => {
      const remaining = Math.max(0, endAt - Date.now());
      setRemainingMs(remaining);

      if (remaining <= 0) {
        window.clearInterval(interval);
        usePlatis.getState().respondToCte(activeMasterEvent.id, "falha");
      }
    }, 50);

    return () => window.clearInterval(interval);
  }, [activeMasterEvent]);

  if (!activeMasterEvent || activeMasterEvent.type !== "cte") {
    return null;
  }

  const isTargeted =
    activeMasterEvent.target === "todos" ||
    (activeMasterEvent.target === "especificos" &&
      !!selfId &&
      activeMasterEvent.targetCharacterIds.includes(selfId));

  const canReact =
    role !== "mestre" &&
    isTargeted &&
    activeMasterEvent.cteStatus !== "executado" &&
    remainingMs > 0;

  return (
    <div className="panel space-y-4 border border-line p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          CTE
        </p>
        <h2 className="mt-1 font-display text-3xl">
          {activeMasterEvent.title}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {activeMasterEvent.description}
        </p>
      </div>

      <div className="text-center">
        <p className="text-4xl font-bold">
          {(remainingMs / 1000).toFixed(1)}s
        </p>
      </div>

      {canReact && (
        <Button
          type="button"
          className="h-16 w-full text-lg font-bold"
          onClick={() => respondToCte(activeMasterEvent.id, "sucesso")}
        >
          REAGIR
        </Button>
      )}

      {activeMasterEvent.cteStatus === "executado" && (
        <p className="text-center text-lg font-bold">
          {activeMasterEvent.cteResult === "sucesso" ? "SUCESSO" : "FALHA"}
        </p>
      )}
    </div>
  );
}
