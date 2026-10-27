#!/usr/bin/env node
/**
 * Restaura races.ts completo a partir do commit 0b64b79 e aplica atributos-base oficiais.
 * Uso: node scripts/apply-race-base-attrs.mjs
 */
import { writeFileSync } from "fs";

const NEW = {
  humano: [32, 23, 40, 100, 4, 4, 8, 8, 8, 15],
  "meio-elfo": [30, 30, 35, 100, 5, 8, 5, 9, 8, 15],
  elfo: [29, 33, 35, 100, 5, 8, 5, 9, 9, 16],
  "semi-besta": [37, 18, 45, 90, 9, 3, 7, 6, 12, 13],
  besta: [42, 16, 50, 80, 12, 2, 8, 6, 10, 8],
  lizard: [40, 20, 42, 90, 9, 5, 12, 10, 8, 10],
  aqua: [28, 36, 32, 100, 5, 9, 6, 13, 9, 19],
  "morto-vivo": [38, 22, 30, 60, 6, 6, 8, 8, 5, 12],
  demonio: [40, 30, 40, 120, 13, 8, 8, 10, 9, 22],
  divino: [30, 40, 40, 120, 8, 13, 8, 10, 9, 22],
  driade: [30, 45, 38, 160, 4, 11, 7, 9, 9, 17],
  lupino: [40, 25, 45, 130, 13, 6, 8, 8, 13, 15],
  anao: [40, 16, 38, 95, 7, 3, 15, 12, 4, 20],
  orc: [44, 14, 46, 75, 10, 2, 10, 8, 6, 6],
  goblin: [26, 20, 40, 80, 6, 4, 4, 5, 9, 16],
  oni: [45, 20, 50, 110, 14, 5, 10, 8, 12, 14],
  gigante: [50, 25, 55, 110, 15, 5, 17, 17, 4, 10],
  quimera: [40, 30, 45, 80, 10, 10, 10, 10, 10, 10],
  homunculo: [30, 30, 60, 200, 5, 8, 8, 8, 6, 16],
  dragonoide: [75, 54, 72, 194, 21, 16, 20, 17, 18, 30],
  umbral: [66, 80, 69, 210, 17, 21, 15, 16, 20, 32],
  vampiro: [72, 71, 66, 205, 19, 19, 15, 17, 19, 42],
  fae: [60, 89, 80, 203, 17, 17, 15, 19, 21, 43],
  doppelganger: [110, 110, 110, 250, 25, 20, 21, 21, 22, 50],
  kitsune: [110, 110, 110, 250, 20, 25, 21, 20, 23, 50],
};

const url =
  "https://raw.githubusercontent.com/ntiae-create/RPG_platis_mid/0b64b79/src/data/races.ts";

const res = await fetch(url);
if (!res.ok) {
  console.error("Falha ao baixar races.ts base:", res.status);
  process.exit(1);
}
let t = await res.text();

let n = 0;
for (const [id, vals] of Object.entries(NEW)) {
  const re = new RegExp(
    `(id:\\s*\"${id}\"[\\s\\S]*?base:\\s*s\\()([^)]+)(\\))`,
  );
  if (!re.test(t)) {
    console.error("Raça não encontrada:", id);
    process.exit(1);
  }
  t = t.replace(re, `$1${vals.join(", ")}$3`);
  n++;
}

if (n !== 25) {
  console.error("Esperado 25, aplicou", n);
  process.exit(1);
}

writeFileSync("src/data/races.ts", t);
console.log("OK: races.ts restaurado + atributos-base (" + t.length + " bytes, 25 raças)");
