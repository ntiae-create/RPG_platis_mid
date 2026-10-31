#!/usr/bin/env node
/** Inject NegotiationsPanel into InventoryPanel if missing. */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const invPath = join(root, "src/components/inventory/inventory-panel.tsx");
if (!existsSync(invPath)) process.exit(0);

let t = readFileSync(invPath, "utf8");
if (t.includes("NegotiationsPanel")) {
  console.log("[patch-inv] already has NegotiationsPanel");
  process.exit(0);
}

if (!t.includes('from "@/lib/store"')) {
  console.error("[patch-inv] unexpected inventory-panel.tsx");
  process.exit(1);
}

t = t.replace(
  'import { usePlatis } from "@/lib/store";',
  'import { usePlatis } from "@/lib/store";\nimport { NegotiationsPanel } from "@/components/trade/negotiations-panel";',
);

const marker = '  return (\n    <div className="grid gap-4 lg:grid-cols-2">';
if (!t.includes(marker)) {
  console.error("[patch-inv] return grid not found");
  process.exit(1);
}
t = t.replace(
  marker,
  '  return (\n    <div className="space-y-6">\n    <div className="grid gap-4 lg:grid-cols-2">',
);

const endMarker = "\n  );\n}";
const last = t.lastIndexOf(endMarker);
if (last < 0) {
  console.error("[patch-inv] end not found");
  process.exit(1);
}
const insertion = `
      <section className="panel p-4">
        <h2 className="font-display text-2xl">Negociações</h2>
        <p className="mb-3 text-xs text-muted">
          Troca e envio de itens entre personagens da mesa.
        </p>
        <NegotiationsPanel />
      </section>
    </div>
`;
t = t.slice(0, last) + insertion + t.slice(last);
writeFileSync(invPath, t);
console.log("[patch-inv] Negociações section added to InventoryPanel");
