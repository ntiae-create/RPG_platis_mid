import { useEffect, useState, type ReactNode } from "react";
import { usePlatis } from "@/lib/store";

export function PersistGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const persistApi = usePlatis.persist;
    if (!persistApi) {
      setReady(true);
      return;
    }
    const finish = () => setReady(true);
    const unsub = persistApi.onFinishHydration(finish);
    if (persistApi.hasHydrated()) finish();
    return unsub;
  }, []);
  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-muted">
        Abrindo a mesa…
      </div>
    );
  }
  return <>{children}</>;
}
