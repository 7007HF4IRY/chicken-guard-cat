#!/usr/bin/env node
/**
 * Render static publish: symlink shared assets into offline/ (DRY).
 * Committed in offline/: index.html, service-worker.js, manifest.webmanifest
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "offline");

const LINKS = [
  { from: "css", to: "css", dir: true },
  { from: "img", to: "img", dir: true },
  { from: "audio", to: "audio", dir: true },
  { from: "fonts", to: "fonts", dir: true },
  { from: "js/choices-data.js", to: "js/choices-data.js", dir: false },
  { from: "js/game.js", to: "js/game.js", dir: false },
];

function removePath(target) {
  if (!fs.existsSync(target)) return;
  const stat = fs.lstatSync(target);
  if (stat.isSymbolicLink()) {
    fs.unlinkSync(target);
    return;
  }
  if (stat.isDirectory()) {
    fs.rmSync(target, { recursive: true, force: true });
  } else {
    fs.unlinkSync(target);
  }
}

function linkOne(fromRel, toRel, isDir) {
  const src = path.join(ROOT, fromRel);
  if (!fs.existsSync(src)) {
    console.error("[build-offline] missing:", fromRel);
    process.exit(1);
  }
  const dest = path.join(OUT, toRel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  removePath(dest);
  const rel = path.relative(path.dirname(dest), src);
  fs.symlinkSync(rel, dest, isDir ? "dir" : "file");
  console.log("[build-offline] linked", toRel, "→", rel);
}

if (!fs.existsSync(path.join(OUT, "index.html"))) {
  console.error("[build-offline] offline/index.html not found");
  process.exit(1);
}

for (const { from, to, dir } of LINKS) {
  linkOne(from, to, dir);
}

const { writeOfflineLaunchers } = require("./pack-offline-zip");
writeOfflineLaunchers(OUT);

const { execFileSync } = require("child_process");
execFileSync(process.execPath, [path.join(__dirname, "pack-offline-zip.js")], {
  stdio: "inherit",
  cwd: ROOT,
});

console.log("[build-offline] done");
