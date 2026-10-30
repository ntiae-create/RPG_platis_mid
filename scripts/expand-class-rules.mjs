#!/usr/bin/env node
/**
 * Expands compressed payloads into source files before build/typecheck.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
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
  if (!out) {
    console.error("[expand] missing payload", name);
    process.exit(1);
  }
  return out;
}

function expand(name, outRel, force = false) {
  const outPath = join(root, outRel);
  if (!force && existsSync(outPath)) {
    const cur = readFileSync(outPath, "utf8");
    if (
      cur.length > 500 &&
      !cur.includes("PLACEHOLDER") &&
      !(outRel.includes("store.ts") && !cur.includes("autoAllocateNpcGrowth"))
    ) {
      console.log("[expand] skip (present)", outRel);
      return;
    }
  }
  const b64 = readPayload(name);
  const src = inflateSync(Buffer.from(b64, "base64")).toString("utf8");
  writeFileSync(outPath, src);
  console.log("[expand] wrote", outRel, `(${src.length} bytes)`);
}

for (const name of ["a", "b", "c"]) {
  expand(`class-rules-${name}.b64`, `src/lib/passives/class-rules-${name}.ts`);
}
expand("stats.ts.b64", "src/lib/stats.ts", true);
expand("store.ts.b64", "src/lib/store.ts", true);
