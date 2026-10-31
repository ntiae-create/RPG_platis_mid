#!/usr/bin/env node
/** Expand trade payloads + surgical patches for store/inventory. */
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

function readPayloadParts(prefix) {
  let i = 0;
  let out = "";
  while (existsSync(join(payloadDir, `${prefix}.${i}`))) {
    out += readFileSync(join(payloadDir, `${prefix}.${i}`), "utf8").trim();
    i += 1;
  }
  return out || null;
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

// Apply script: plain base64 parts (no zlib)
{
  const applyPath = join(root, "scripts/apply-trade-to-store.mjs");
  if (!existsSync(applyPath) || !readFileSync(applyPath, "utf8").includes("createTradeProposal")) {
    const b64 = readPayloadParts("apply-trade.b64plain");
    if (!b64) {
      console.error("[expand-trade] missing apply-trade.b64plain.*");
      process.exit(1);
    }
    writeFileSync(applyPath, Buffer.from(b64, "base64").toString("utf8"));
    console.log("[expand-trade] wrote apply-trade-to-store.mjs");
  } else {
    console.log("[expand-trade] skip apply-trade-to-store.mjs");
  }
}

expand("src__lib__trade__engine.ts.b64", "src/lib/trade/engine.ts", ["applyTradeTransfer"]);
expand("src__components__trade__negotiations-panel.tsx.b64", "src/components/trade/negotiations-panel.tsx", ["NegotiationsPanel"]);
expand("scripts__trade-engine.test.mjs.b64", "scripts/trade-engine.test.mjs", ["trade engine"]);

const apply = spawnSync(process.execPath, [join(root, "scripts/apply-trade-to-store.mjs")], {
  cwd: root,
  encoding: "utf8",
});
if (apply.stdout) process.stdout.write(apply.stdout);
if (apply.stderr) process.stderr.write(apply.stderr);
if (apply.status !== 0) process.exit(apply.status ?? 1);

const invPatch = spawnSync(process.execPath, [join(root, "scripts/patch-inventory-negotiations.mjs")], {
  cwd: root,
  encoding: "utf8",
});
if (invPatch.stdout) process.stdout.write(invPatch.stdout);
if (invPatch.stderr) process.stderr.write(invPatch.stderr);
if (invPatch.status !== 0) process.exit(invPatch.status ?? 1);
