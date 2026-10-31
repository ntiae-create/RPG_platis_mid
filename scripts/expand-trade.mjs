#!/usr/bin/env node
/** Expand trade-system payloads when source is missing or incomplete. */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { inflateSync } from "zlib";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const payloadDir = join(root, "scripts/passives-payload");

function readPayload(name) {
  const single = join(payloadDir, name);
  if (existsSync(single)) return readFileSync(single, "utf8").trim();
  let i = 0;
  let out = "";
  while (existsSync(join(payloadDir, `${name}.${i}`))) {
    out += readFileSync(join(payloadDir, `${name}.${i}`), "utf8").trim();
    i += 1;
  }
  if (!out) return null;
  return out;
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

expand("src__lib__trade__engine.ts.b64", "src/lib/trade/engine.ts", ["applyTradeTransfer"]);
expand("src__components__trade__negotiations-panel.tsx.b64", "src/components/trade/negotiations-panel.tsx", ["NegotiationsPanel"]);
expand("src__routes__mesa.tsx.b64", "src/routes/mesa.tsx", ["NegotiationsPanel", "trade-upsert"]);
expand("scripts__trade-engine.test.mjs.b64", "scripts/trade-engine.test.mjs", ["trade engine"]);
expand("store-trade.ts.b64", "src/lib/store.ts", ["createTradeProposal", "negociacoes"]);
