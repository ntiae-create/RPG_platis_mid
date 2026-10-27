/**
 * Rebuilds src/lib/store.ts from base64 parts (one-time restore).
 * Run: node scripts/rebuild-store-from-parts.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const partsDir = join(root, "scripts/store-b64-parts");
const files = readdirSync(partsDir).filter((f) => f.endsWith(".b64")).sort();
const b64 = files.map((f) => readFileSync(join(partsDir, f), "utf8")).join("");
const buf = Buffer.from(b64, "base64");
writeFileSync(join(root, "src/lib/store.ts"), buf);
console.log("restored store.ts", buf.length, "bytes");
