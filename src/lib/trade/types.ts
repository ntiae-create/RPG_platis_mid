import type { Currency, InventoryItem } from "@/data/types";

/** Referência a um item em oferta (id do inventário do dono no momento da proposta). */
export type TradeItemOffer = {
  itemId: string;
  qty: number;
  /** Snapshot só para exibição; a conclusão revalida o inventário real. */
  snapshot: Pick<InventoryItem, "id" | "name" | "desc" | "qty" | "slot" | "rarity" | "effect" | "bonus" | "tier" | "category">;
};

export type TradeCurrencyOffer = Partial<Pick<Currency, "bronze" | "silver" | "gold" | "platinum">>;

export type TradeKind = "trade" | "gift";

export type TradeStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "failed";

export type TradeProposal = {
  id: string;
  kind: TradeKind;
  status: TradeStatus;
  fromCharacterId: string;
  toCharacterId: string;
  fromItems: TradeItemOffer[];
  /** Itens que o destinatário oferece (vazio em gift). */
  toItems: TradeItemOffer[];
  fromCurrency: TradeCurrencyOffer;
  toCurrency: TradeCurrencyOffer;
  createdAt: number;
  updatedAt: number;
  failReason?: string;
};

export type TradeP2PMessage =
  | { type: "trade-upsert"; proposal: TradeProposal }
  | { type: "trade-accept"; tradeId: string; byCharacterId: string }
  | { type: "trade-reject"; tradeId: string; byCharacterId: string }
  | { type: "trade-cancel"; tradeId: string; byCharacterId: string };
