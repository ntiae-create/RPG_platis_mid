import type { Character, Currency, InventoryItem } from "@/data/types";
import type { TradeCurrencyOffer, TradeItemOffer, TradeProposal } from "./types";

export function normalizeCurrency(c?: TradeCurrencyOffer): Required<TradeCurrencyOffer> {
  return {
    bronze: Math.max(0, Math.floor(c?.bronze ?? 0)),
    silver: Math.max(0, Math.floor(c?.silver ?? 0)),
    gold: Math.max(0, Math.floor(c?.gold ?? 0)),
    platinum: Math.max(0, Math.floor(c?.platinum ?? 0)),
  };
}

export function currencyTotal(c: TradeCurrencyOffer): number {
  const n = normalizeCurrency(c);
  return n.bronze + n.silver + n.gold + n.platinum;
}

export function hasCurrency(wallet: Currency, cost: TradeCurrencyOffer): boolean {
  const n = normalizeCurrency(cost);
  return (
    (wallet.bronze ?? 0) >= n.bronze &&
    (wallet.silver ?? 0) >= n.silver &&
    (wallet.gold ?? 0) >= n.gold &&
    (wallet.platinum ?? 0) >= n.platinum
  );
}

export function subtractCurrency(wallet: Currency, cost: TradeCurrencyOffer): Currency | null {
  if (!hasCurrency(wallet, cost)) return null;
  const n = normalizeCurrency(cost);
  return {
    bronze: (wallet.bronze ?? 0) - n.bronze,
    silver: (wallet.silver ?? 0) - n.silver,
    gold: (wallet.gold ?? 0) - n.gold,
    platinum: (wallet.platinum ?? 0) - n.platinum,
  };
}

export function addCurrency(wallet: Currency, gain: TradeCurrencyOffer): Currency {
  const n = normalizeCurrency(gain);
  return {
    bronze: (wallet.bronze ?? 0) + n.bronze,
    silver: (wallet.silver ?? 0) + n.silver,
    gold: (wallet.gold ?? 0) + n.gold,
    platinum: (wallet.platinum ?? 0) + n.platinum,
  };
}

export function hasItems(inventory: InventoryItem[], offers: TradeItemOffer[]): boolean {
  const need = new Map<string, number>();
  for (const o of offers) {
    const qty = Math.floor(o.qty);
    if (!o.itemId || qty <= 0) return false;
    need.set(o.itemId, (need.get(o.itemId) ?? 0) + qty);
  }
  for (const [id, qty] of need) {
    const found = inventory.find((i) => i.id === id);
    if (!found || found.qty < qty) return false;
  }
  return true;
}

export function removeItems(
  inventory: InventoryItem[],
  offers: TradeItemOffer[],
): InventoryItem[] | null {
  if (!hasItems(inventory, offers)) return null;
  const need = new Map<string, number>();
  for (const o of offers) {
    need.set(o.itemId, (need.get(o.itemId) ?? 0) + Math.floor(o.qty));
  }
  const next: InventoryItem[] = [];
  for (const item of inventory) {
    const take = need.get(item.id) ?? 0;
    if (take <= 0) {
      next.push({ ...item });
      continue;
    }
    const left = item.qty - take;
    need.set(item.id, 0);
    if (left > 0) next.push({ ...item, qty: left });
  }
  for (const [, left] of need) {
    if (left > 0) return null;
  }
  return next;
}

export function addItems(
  inventory: InventoryItem[],
  grants: InventoryItem[],
): InventoryItem[] {
  const next = inventory.map((i) => ({ ...i }));
  for (const g of grants) {
    const qty = Math.max(1, Math.floor(g.qty));
    const existing = next.find((i) => i.id === g.id);
    if (existing) {
      existing.qty += qty;
    } else {
      next.push({ ...g, qty });
    }
  }
  return next;
}

export function offersToGrantItems(offers: TradeItemOffer[]): InventoryItem[] {
  return offers.map((o) => ({
    ...o.snapshot,
    id: o.itemId,
    name: o.snapshot.name,
    desc: o.snapshot.desc ?? "",
    qty: Math.floor(o.qty),
  }));
}

export type TransferResult =
  | { ok: true; from: Character; to: Character }
  | { ok: false; reason: string };

/**
 * Revalida inventários/moedas e aplica a transferência atômica em cópias.
 * Não muta os originais.
 */
export function applyTradeTransfer(
  from: Character,
  to: Character,
  proposal: TradeProposal,
): TransferResult {
  if (proposal.fromCharacterId !== from.id || proposal.toCharacterId !== to.id) {
    return { ok: false, reason: "Participantes não conferem com a proposta." };
  }
  if (proposal.status !== "pending") {
    return { ok: false, reason: "Proposta não está pendente." };
  }

  const fromItems = proposal.fromItems ?? [];
  const toItems = proposal.kind === "gift" ? [] : proposal.toItems ?? [];
  const fromCur = proposal.fromCurrency ?? {};
  const toCur = proposal.kind === "gift" ? {} : proposal.toCurrency ?? {};

  if (fromItems.some((o) => o.qty <= 0) || toItems.some((o) => o.qty <= 0)) {
    return { ok: false, reason: "Quantidade inválida." };
  }
  if (fromItems.length === 0 && currencyTotal(fromCur) === 0) {
    return { ok: false, reason: "Oferta do remetente vazia." };
  }

  if (!hasItems(from.inventory, fromItems)) {
    return { ok: false, reason: "Remetente não possui os itens oferecidos." };
  }
  if (!hasCurrency(from.currency, fromCur)) {
    return { ok: false, reason: "Remetente sem moedas suficientes." };
  }
  if (!hasItems(to.inventory, toItems)) {
    return { ok: false, reason: "Destinatário não possui os itens oferecidos." };
  }
  if (!hasCurrency(to.currency, toCur)) {
    return { ok: false, reason: "Destinatário sem moedas suficientes." };
  }

  const fromInvAfterRemove = removeItems(from.inventory, fromItems);
  const toInvAfterRemove = removeItems(to.inventory, toItems);
  if (!fromInvAfterRemove || !toInvAfterRemove) {
    return { ok: false, reason: "Falha ao reservar itens." };
  }

  const fromWallet = subtractCurrency(from.currency, fromCur);
  const toWallet = subtractCurrency(to.currency, toCur);
  if (!fromWallet || !toWallet) {
    return { ok: false, reason: "Falha ao reservar moedas." };
  }

  const grantsToTo = offersToGrantItems(fromItems);
  const grantsToFrom = offersToGrantItems(toItems);

  const nextFrom: Character = {
    ...from,
    inventory: addItems(fromInvAfterRemove, grantsToFrom),
    currency: addCurrency(fromWallet, toCur),
  };
  const nextTo: Character = {
    ...to,
    inventory: addItems(toInvAfterRemove, grantsToTo),
    currency: addCurrency(toWallet, fromCur),
  };

  return { ok: true, from: nextFrom, to: nextTo };
}

export function buildOfferFromInventory(
  inventory: InventoryItem[],
  itemId: string,
  qty: number,
): TradeItemOffer | null {
  const item = inventory.find((i) => i.id === itemId);
  const q = Math.floor(qty);
  if (!item || q <= 0 || item.qty < q) return null;
  return {
    itemId: item.id,
    qty: q,
    snapshot: {
      id: item.id,
      name: item.name,
      desc: item.desc,
      qty: item.qty,
      slot: item.slot,
      rarity: item.rarity,
      effect: item.effect,
      bonus: item.bonus,
      tier: item.tier,
      category: item.category,
    },
  };
}
