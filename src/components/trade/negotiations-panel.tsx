import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePlatis } from "@/lib/store";
import type { TradeCurrencyOffer } from "@/lib/trade/types";

type Mode = "trade" | "gift";

export function NegotiationsPanel() {
  const selfId = usePlatis((s) => s.selfId);
  const characters = usePlatis((s) => s.characters);
  const slots = usePlatis((s) => s.slots);
  const trades = usePlatis((s) => s.trades);
  const createTradeProposal = usePlatis((s) => s.createTradeProposal);
  const acceptTradeProposal = usePlatis((s) => s.acceptTradeProposal);
  const rejectTradeProposal = usePlatis((s) => s.rejectTradeProposal);
  const cancelTradeProposal = usePlatis((s) => s.cancelTradeProposal);

  const self = selfId ? characters[selfId] : null;

  const recipients = useMemo(() => {
    const ids = slots.filter((id): id is string => Boolean(id) && id !== selfId);
    return ids
      .map((id) => characters[id])
      .filter((ch): ch is NonNullable<typeof ch> => Boolean(ch));
  }, [slots, characters, selfId]);

  const [mode, setMode] = useState<Mode>("gift");
  const [toId, setToId] = useState<string>("");
  const [fromSelected, setFromSelected] = useState<Record<string, number>>({});
  const [toSelected, setToSelected] = useState<Record<string, number>>({});
  const [fromCurrency, setFromCurrency] = useState<TradeCurrencyOffer>({});
  const [toCurrency, setToCurrency] = useState<TradeCurrencyOffer>({});
  const [msg, setMsg] = useState<string>("");

  const recipient = toId ? characters[toId] : null;

  if (!self) return null;

  function toggleFrom(itemId: string, max: number) {
    setFromSelected((prev) => {
      const next = { ...prev };
      if (next[itemId]) delete next[itemId];
      else next[itemId] = Math.min(1, max);
      return next;
    });
  }

  function toggleTo(itemId: string, max: number) {
    setToSelected((prev) => {
      const next = { ...prev };
      if (next[itemId]) delete next[itemId];
      else next[itemId] = Math.min(1, max);
      return next;
    });
  }

  function submit() {
    setMsg("");
    if (!toId) {
      setMsg("Selecione o destinatário.");
      return;
    }
    const fromItems = Object.entries(fromSelected)
      .filter(([, q]) => q > 0)
      .map(([itemId, qty]) => ({ itemId, qty }));
    const toItems =
      mode === "trade"
        ? Object.entries(toSelected)
            .filter(([, q]) => q > 0)
            .map(([itemId, qty]) => ({ itemId, qty }))
        : [];
    const id = createTradeProposal({
      kind: mode,
      toCharacterId: toId,
      fromItems,
      toItems,
      fromCurrency,
      toCurrency: mode === "trade" ? toCurrency : {},
    });
    if (!id) {
      setMsg("Não foi possível criar a proposta. Verifique itens e quantidades.");
      return;
    }
    const proposal = usePlatis.getState().trades.find((x) => x.id === id);
    if (proposal && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("platis-trade", { detail: { type: "trade-upsert", proposal } }));
    }
    setMsg(mode === "gift" ? "Presente enviado." : "Proposta de troca enviada.");
    setFromSelected({});
    setToSelected({});
    setFromCurrency({});
    setToCurrency({});
  }

  const received = trades.filter((t) => t.toCharacterId === selfId && t.status === "pending");
  const sent = trades.filter((t) => t.fromCharacterId === selfId && t.status === "pending");
  const history = trades.filter((t) => t.status !== "pending");

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <h2 className="font-display text-2xl">Negociações</h2>
        <p className="text-xs text-muted">
          Troca e envio de itens entre personagens da mesa. O inventário continua na aba Inventário.
        </p>
      </div>

      <div className="panel space-y-3 p-4">
        <h3 className="font-display text-xl">Nova negociação</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={mode === "gift" ? "default" : "outline"}
            onClick={() => setMode("gift")}
          >
            Dar item
          </Button>
          <Button
            size="sm"
            variant={mode === "trade" ? "default" : "outline"}
            onClick={() => setMode("trade")}
          >
            Trocar
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {recipients.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setToId(r.id);
                setToSelected({});
              }}
              className={
                "flex items-center gap-2 rounded-md border px-2 py-1 text-sm " +
                (toId === r.id ? "border-ink bg-raised" : "border-line")
              }
            >
              {r.image ? (
                <img src={r.image} alt="" className="size-8 rounded object-cover" />
              ) : (
                <span className="flex size-8 items-center justify-center rounded bg-raised text-xs">?</span>
              )}
              {r.name}
            </button>
          ))}
        </div>

        {recipients.length === 0 && (
          <p className="text-xs text-muted">Nenhum outro personagem nos slots da mesa.</p>
        )}

        {toId && (
          <>
            <div>
              <p className="mb-1 text-sm font-medium">Seus itens (oferta)</p>
              <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                {self.inventory.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 rounded-md bg-raised px-2 py-1">
                    <input
                      type="checkbox"
                      checked={Boolean(fromSelected[item.id])}
                      onChange={() => toggleFrom(item.id, item.qty)}
                    />
                    <span className="flex-1 truncate">
                      {item.name} ×{item.qty}
                    </span>
                    {fromSelected[item.id] != null && (
                      <input
                        type="number"
                        min={1}
                        max={item.qty}
                        className="w-16 rounded border border-line bg-bg px-1"
                        value={fromSelected[item.id]}
                        onChange={(e) =>
                          setFromSelected((prev) => ({
                            ...prev,
                            [item.id]: Math.max(1, Math.min(item.qty, Number(e.target.value) || 1)),
                          }))
                        }
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              {(["bronze", "silver", "gold", "platinum"] as const).map((k) => (
                <label key={k} className="capitalize">
                  {k}
                  <input
                    type="number"
                    min={0}
                    className="mt-0.5 w-full rounded border border-line bg-bg p-1"
                    value={fromCurrency[k] ?? 0}
                    onChange={(e) =>
                      setFromCurrency((c) => ({
                        ...c,
                        [k]: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                      }))
                    }
                  />
                </label>
              ))}
            </div>

            {mode === "trade" && recipient && (
              <div>
                <p className="mb-1 text-sm font-medium">Itens do destinatário (pedido)</p>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                  {recipient.inventory.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 rounded-md bg-raised px-2 py-1">
                      <input
                        type="checkbox"
                        checked={Boolean(toSelected[item.id])}
                        onChange={() => toggleTo(item.id, item.qty)}
                      />
                      <span className="flex-1 truncate">
                        {item.name} ×{item.qty}
                      </span>
                      {toSelected[item.id] != null && (
                        <input
                          type="number"
                          min={1}
                          max={item.qty}
                          className="w-16 rounded border border-line bg-bg px-1"
                          value={toSelected[item.id]}
                          onChange={(e) =>
                            setToSelected((prev) => ({
                              ...prev,
                              [item.id]: Math.max(1, Math.min(item.qty, Number(e.target.value) || 1)),
                            }))
                          }
                        />
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  {(["bronze", "silver", "gold", "platinum"] as const).map((k) => (
                    <label key={k} className="capitalize">
                      {k} (pedido)
                      <input
                        type="number"
                        min={0}
                        className="mt-0.5 w-full rounded border border-line bg-bg p-1"
                        value={toCurrency[k] ?? 0}
                        onChange={(e) =>
                          setToCurrency((c) => ({
                            ...c,
                            [k]: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={submit}>{mode === "gift" ? "Enviar presente" : "Enviar proposta"}</Button>
            {msg && <p className="text-sm text-muted">{msg}</p>}
          </>
        )}
      </div>

      <section className="panel space-y-2 p-4">
        <h3 className="font-display text-xl">Recebidas</h3>
        {received.length === 0 && <p className="text-xs text-muted">Nenhuma proposta pendente.</p>}
        {received.map((t) => (
          <TradeRow
            key={t.id}
            kind={t.kind}
            fromName={characters[t.fromCharacterId]?.name ?? t.fromCharacterId}
            fromItems={t.fromItems}
            toItems={t.toItems}
            fromCurrency={t.fromCurrency}
            toCurrency={t.toCurrency}
            actions={
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    const ok = acceptTradeProposal(t.id);
                    if (ok && typeof window !== "undefined") {
                      window.dispatchEvent(
                        new CustomEvent("platis-trade", {
                          detail: { type: "trade-accept", tradeId: t.id, byCharacterId: selfId },
                        }),
                      );
                    }
                  }}
                >
                  Aceitar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    rejectTradeProposal(t.id);
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(
                        new CustomEvent("platis-trade", {
                          detail: { type: "trade-reject", tradeId: t.id, byCharacterId: selfId },
                        }),
                      );
                    }
                  }}
                >
                  Recusar
                </Button>
              </>
            }
          />
        ))}
      </section>

      <section className="panel space-y-2 p-4">
        <h3 className="font-display text-xl">Enviadas</h3>
        {sent.length === 0 && <p className="text-xs text-muted">Nada aguardando resposta.</p>}
        {sent.map((t) => (
          <TradeRow
            key={t.id}
            kind={t.kind}
            fromName="Você"
            toName={characters[t.toCharacterId]?.name ?? t.toCharacterId}
            fromItems={t.fromItems}
            toItems={t.toItems}
            fromCurrency={t.fromCurrency}
            toCurrency={t.toCurrency}
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  cancelTradeProposal(t.id);
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(
                      new CustomEvent("platis-trade", {
                        detail: { type: "trade-cancel", tradeId: t.id, byCharacterId: selfId },
                      }),
                    );
                  }
                }}
              >
                Cancelar
              </Button>
            }
          />
        ))}
      </section>

      <section className="panel space-y-2 p-4">
        <h3 className="font-display text-xl">Histórico</h3>
        {history.length === 0 && <p className="text-xs text-muted">Sem histórico.</p>}
        {history.slice(0, 30).map((t) => (
          <div key={t.id} className="rounded-md bg-raised px-3 py-2 text-sm">
            <p>
              <span className="uppercase text-muted">{t.kind}</span> · {t.status}
              {t.failReason ? ` — ${t.failReason}` : ""}
            </p>
            <p className="text-xs text-muted">
              {characters[t.fromCharacterId]?.name ?? t.fromCharacterId} →{" "}
              {characters[t.toCharacterId]?.name ?? t.toCharacterId}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

function TradeRow(props: {
  kind: string;
  fromName?: string;
  toName?: string;
  fromItems: { snapshot: { name: string }; qty: number }[];
  toItems: { snapshot: { name: string }; qty: number }[];
  fromCurrency: TradeCurrencyOffer;
  toCurrency: TradeCurrencyOffer;
  actions?: import("react").ReactNode;
}) {
  return (
    <div className="rounded-md border border-line px-3 py-2 text-sm">
      <p className="font-medium">
        {props.kind === "gift" ? "Presente" : "Troca"} · {props.fromName}
        {props.toName ? ` → ${props.toName}` : ""}
      </p>
      <p className="text-xs text-muted">
        Oferece:{" "}
        {props.fromItems.map((i) => `${i.snapshot.name}×${i.qty}`).join(", ") || "—"}
        {formatCur(props.fromCurrency)}
      </p>
      {props.kind === "trade" && (
        <p className="text-xs text-muted">
          Pede: {props.toItems.map((i) => `${i.snapshot.name}×${i.qty}`).join(", ") || "—"}
          {formatCur(props.toCurrency)}
        </p>
      )}
      {props.actions && <div className="mt-2 flex gap-2">{props.actions}</div>}
    </div>
  );
}

function formatCur(c: TradeCurrencyOffer): string {
  const parts = (["bronze", "silver", "gold", "platinum"] as const)
    .filter((k) => (c[k] ?? 0) > 0)
    .map((k) => `${c[k]} ${k}`);
  return parts.length ? ` · ${parts.join(", ")}` : "";
}
