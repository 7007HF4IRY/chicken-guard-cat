#!/usr/bin/env node
/**
 * Offline site QR PNGs (npx qrcode, no package.json dependency).
 */
const { execFileSync } = require("child_process");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "img");

// Canonical full-game URL (README). Render service name may differ per deploy (e.g. esc923).
const FULL_GAME_URL = "https://chicken-guard-cat.onrender.com/";

const TARGETS = [
  {
    file: "game-site-qr.png",
    url: FULL_GAME_URL,
  },
  {
    file: "offline-site-qr.png",
    url: FULL_GAME_URL,
  },
  {
    file: "offline-site-zip-qr.png",
    url: "https://chicken-guard-cat-offline.onrender.com/chicken-guard-cat-offline.zip",
  },
];

for (const { file, url } of TARGETS) {
  const out = path.join(OUT_DIR, file);
  execFileSync(
    "npx",
    ["--yes", "qrcode", "-o", out, url],
    { stdio: "inherit", cwd: ROOT }
  );
  console.log("[generate-offline-qr]", file, "←", url);
}
