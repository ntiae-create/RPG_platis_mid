#!/usr/bin/env node
/** Expand trade payloads + surgical patches for store/mesa. */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { inflateSync } from "zlib";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const payloadDir = join(root, "scripts/passives-payload");

function readPayload(name) {
  const single = join(payloadDir, name);
  if (existsSync(single)) return readFileSync(single, "utf8").trim();
  return null;
}

function expand(name, outRel, mustContain) {
  const outPath = join(root, outRel);
  if (existsSync(outPath)) {
    const cur = readFileSync(outPath, "utf8");
    if (mustContain.every((s) => cur.includes(s)) && cur.length > 500) {
      console.log("[expand-trade] skip", outRel);
      return;
    }
  }
  const b64 = readPayload(name);
  if (!b64) {
    console.error("[expand-trade] missing", name);
    process.exit(1);
  }
  mkdirSync(dirname(outPath), { recursive: true });
  const src = inflateSync(Buffer.from(b64, "base64")).toString("utf8");
  writeFileSync(outPath, src);
  console.log("[expand-trade] wrote", outRel, src.length);
}

expand("apply-trade-to-store.mjs.b64", "scripts/apply-trade-to-store.mjs", ["apply-trade"]);
expand("src__lib__trade__engine.ts.b64", "src/lib/trade/engine.ts", ["applyTradeTransfer"]);
expand("src__components__trade__negotiations-panel.tsx.b64", "src/components/trade/negotiations-panel.tsx", ["NegotiationsPanel"]);
expand("scripts__trade-engine.test.mjs.b64", "scripts/trade-engine.test.mjs", ["trade engine"]);

const mesaPath = join(root, "src/routes/mesa.tsx");
if (existsSync(mesaPath)) {
  let m = readFileSync(mesaPath, "utf8");
  if (!m.includes("NegotiationsPanel")) {
    m = m.replace(
      'import { InventoryPanel } from "@/components/inventory/inventory-panel";',
      'import { InventoryPanel } from "@/components/inventory/inventory-panel";\nimport { NegotiationsPanel } from "@/components/trade/negotiations-panel";',
    );
    m = m.replace(
      'import type { SkillP2PMessage } from "@/lib/multiplayer/skill-events";',
      'import type { SkillP2PMessage } from "@/lib/multiplayer/skill-events";\nimport type { TradeP2PMessage } from "@/lib/trade/types";',
    );
    m = m.replace(
      '{tab === "inventario" && <InventoryPanel />}',
      '{tab === "inventario" && <InventoryPanel />}\n      {tab === "negociacoes" && <NegotiationsPanel />}',
    );
    if (!m.includes("trade-upsert")) {
      const marker = 'console.log("[Mesa P2P] mensagem:", from, channel, data);';
      const tradeBlock = `if (channel === "reliable" && typeof data === "object" && data !== null && "type" in data) {
          const tradeMsg = data as TradeP2PMessage;
          if (tradeMsg.type === "trade-upsert") {
            usePlatis.getState().upsertTradeProposal(tradeMsg.proposal);
          }
          if (tradeMsg.type === "trade-accept") {
            usePlatis.getState().acceptTradeProposal(tradeMsg.tradeId);
          }
          if (tradeMsg.type === "trade-reject") {
            usePlatis.getState().rejectTradeProposal(tradeMsg.tradeId);
          }
          if (tradeMsg.type === "trade-cancel") {
            usePlatis.getState().cancelTradeProposal(tradeMsg.tradeId);
          }
        }

        ` + marker;
      if (m.includes(marker)) m = m.replace(marker, tradeBlock);
    }
    if (!m.includes("platis-trade")) {
      const idx = m.indexOf('window.removeEventListener("platis-skill-decision"');
      if (idx >= 0) {
        const end = m.indexOf("}, [", idx);
        const end2 = m.indexOf(");\n", end);
        const fx = `

  useEffect(() => {
    const handleTrade = (event: Event) => {
      const customEvent = event as CustomEvent<TradeP2PMessage>;
      if (!customEvent.detail || !p2pRef.current) return;
      p2pRef.current.broadcast(customEvent.detail);
    };
    window.addEventListener("platis-trade", handleTrade);
    return () => window.removeEventListener("platis-trade", handleTrade);
  }, []);
`;
        m = m.slice(0, end2 + 3) + fx + m.slice(end2 + 3);
      }
    }
    writeFileSync(mesaPath, m);
    console.log("[expand-trade] patched mesa.tsx");
  } else {
    console.log("[expand-trade] skip mesa.tsx");
  }
}

const apply = spawnSync(process.execPath, [join(root, "scripts/apply-trade-to-store.mjs")], {
  cwd: root,
  encoding: "utf8",
});
if (apply.stdout) process.stdout.write(apply.stdout);
if (apply.stderr) process.stderr.write(apply.stderr);
if (apply.status !== 0) process.exit(apply.status ?? 1);
