#!/usr/bin/env node
/**
 * Expands compressed class-rules-a/b/c payloads into src/lib/passives/.
 * Used as prebuild so Vercel/local builds get full class passive modules.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { inflateSync } from "zlib";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const names = ["a", "b", "c"];
for (const name of names) {
  const payloadPath = join(root, "scripts/passives-payload", `class-rules-${name}.b64`);
  const outPath = join(root, "src/lib/passives", `class-rules-${name}.ts`);
  if (!existsSync(payloadPath)) {
    console.error("[expand-class-rules] missing payload", payloadPath);
    process.exit(1);
  }
  const b64 = readFileSync(payloadPath, "utf8").trim();
  const src = inflateSync(Buffer.from(b64, "base64")).toString("utf8");
  writeFileSync(outPath, src);
  console.log("[expand-class-rules] wrote", outPath, `(${src.length} bytes)`);
}
