#!/usr/bin/env node
import { spawnSync } from "child_process";
let r = spawnSync("node", ["scripts/write-races-part0.mjs"], { stdio: "inherit" });
if (r.status) process.exit(r.status);
r = spawnSync("node", ["scripts/write-races-part1.mjs"], { stdio: "inherit" });
process.exit(r.status ?? 1);
