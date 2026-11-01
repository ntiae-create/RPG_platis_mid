#!/usr/bin/env node
/** One-shot: integrate trades into src/lib/store.ts if missing. */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const storePath = join(root, "src/lib/store.ts");
if (!existsSync(storePath)) {
  console.error("[apply-trades] store.ts missing");
  process.exit(1);
}
let t = readFileSync(storePath, "utf8");
if (t.includes("createTradeProposal: (input)")) {
  console.log("[apply-trades] already integrated");
  process.exit(0);
}

const needle = 'import { parseSkillCommands, normalizeSkillPercent } from "./skill-command-runtime";';
if (!t.includes(needle)) {
  console.error("[apply-trades] import anchor missing");
  process.exit(1);
}
if (!t.includes('from "./trade/types"')) {
  t = t.replace(
    needle,
    needle +
      '\nimport type { TradeProposal, TradeCurrencyOffer, TradeKind } from "./trade/types";\nimport { applyTradeTransfer, buildOfferFromInventory, currencyTotal } from "./trade/engine";',
  );
}

const oldIface = `  grantItem: (characterId: string, item: InventoryItem) => void;
  addShopListing: (item: InventoryItem) => void;`;
const newIface = `  grantItem: (characterId: string, item: InventoryItem) => void;
  trades: TradeProposal[];
  createTradeProposal: (input: {
    kind: TradeKind;
    toCharacterId: string;
    fromItems: { itemId: string; qty: number }[];
    toItems?: { itemId: string; qty: number }[];
    fromCurrency?: TradeCurrencyOffer;
    toCurrency?: TradeCurrencyOffer;
  }) => string | null;
  acceptTradeProposal: (tradeId: string) => boolean;
  rejectTradeProposal: (tradeId: string) => void;
  cancelTradeProposal: (tradeId: string) => void;
  addShopListing: (item: InventoryItem) => void;`;
if (!t.includes(oldIface)) {
  console.error("[apply-trades] iface anchor missing");
  process.exit(1);
}
t = t.replace(oldIface, newIface);

if (!t.includes('| "trades"')) {
  t = t.replace(
    `  | "characters"
  | "npcs"
  | "shopCatalog"`,
    `  | "characters"
  | "npcs"
  | "trades"
  | "shopCatalog"`,
  );
}
if (!t.includes("trades: [],")) {
  t = t.replace(
    `    npcs: {},
    shopCatalog: [],`,
    `    npcs: {},
    trades: [],
    shopCatalog: [],`,
  );
}

const marker = "      addShopListing: (item) => {";
if (!t.includes(marker)) {
  console.error("[apply-trades] addShopListing marker missing");
  process.exit(1);
}
if (!t.includes("createTradeProposal: (input)")) {
  const impl = `
      createTradeProposal: (input) => {
        const s = get();
        const fromId = s.selfId;
        if (!fromId) return null;
        const from = s.characters[fromId];
        const to = s.characters[input.toCharacterId];
        if (!from || !to) return null;
        if (fromId === input.toCharacterId) return null;

        const fromItems = [];
        for (const row of input.fromItems) {
          const offer = buildOfferFromInventory(from.inventory, row.itemId, row.qty);
          if (!offer) return null;
          fromItems.push(offer);
        }
        const toItems = [];
        if (input.kind === "trade") {
          for (const row of input.toItems ?? []) {
            const offer = buildOfferFromInventory(to.inventory, row.itemId, row.qty);
            if (!offer) return null;
            toItems.push(offer);
          }
        }
        if (fromItems.length === 0 && currencyTotal(input.fromCurrency ?? {}) === 0) return null;

        const proposal = {
          id: uid("tr"),
          kind: input.kind,
          status: "pending",
          fromCharacterId: fromId,
          toCharacterId: input.toCharacterId,
          fromItems,
          toItems: input.kind === "gift" ? [] : toItems,
          fromCurrency: input.fromCurrency ?? {},
          toCurrency: input.kind === "gift" ? {} : (input.toCurrency ?? {}),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((st) => ({ trades: [proposal, ...st.trades].slice(0, 100) }));
        return proposal.id;
      },

      acceptTradeProposal: (tradeId) => {
        const s = get();
        const proposal = s.trades.find((t) => t.id === tradeId);
        if (!proposal || proposal.status !== "pending") return false;
        if (s.selfId !== proposal.toCharacterId) return false;

        const from = s.characters[proposal.fromCharacterId];
        const to = s.characters[proposal.toCharacterId];
        if (!from || !to) return false;

        const result = applyTradeTransfer(from, to, proposal);
        if (!result.ok) {
          set((st) => ({
            trades: st.trades.map((t) =>
              t.id === tradeId
                ? { ...t, status: "failed", failReason: result.reason, updatedAt: Date.now() }
                : t,
            ),
          }));
          return false;
        }

        get().patchCharacter(result.from.id, {
          inventory: result.from.inventory,
          currency: result.from.currency,
        });
        get().patchCharacter(result.to.id, {
          inventory: result.to.inventory,
          currency: result.to.currency,
        });
        set((st) => ({
          trades: st.trades.map((t) =>
            t.id === tradeId
              ? { ...t, status: "accepted", updatedAt: Date.now() }
              : t,
          ),
        }));
        return true;
      },

      rejectTradeProposal: (tradeId) => {
        const s = get();
        const proposal = s.trades.find((t) => t.id === tradeId);
        if (!proposal || proposal.status !== "pending") return;
        if (s.selfId !== proposal.toCharacterId) return;
        set((st) => ({
          trades: st.trades.map((t) =>
            t.id === tradeId
              ? { ...t, status: "rejected", updatedAt: Date.now() }
              : t,
          ),
        }));
      },

      cancelTradeProposal: (tradeId) => {
        const s = get();
        const proposal = s.trades.find((t) => t.id === tradeId);
        if (!proposal || proposal.status !== "pending") return;
        if (s.selfId !== proposal.fromCharacterId) return;
        set((st) => ({
          trades: st.trades.map((t) =>
            t.id === tradeId
              ? { ...t, status: "cancelled", updatedAt: Date.now() }
              : t,
          ),
        }));
      },

`;
  t = t.replace(marker, impl + marker);
}

if (!t.includes("trades: s.trades")) {
  t = t.replace(
    `        chat: s.chat,
        tab: s.tab,
      }),`,
    `        chat: s.chat,
        tab: s.tab,
        trades: s.trades,
      }),`,
  );
}

writeFileSync(storePath, t);
console.log("[apply-trades] store.ts integrated");
