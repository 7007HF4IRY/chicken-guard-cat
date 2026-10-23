#!/usr/bin/env node
/**
 * Resolve offline/ symlinks into a staging folder and zip for true offline play
 * (python3 -m http.server in extracted folder — no Render URL needed).
 */
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const ROOT = path.join(__dirname, "..");
const OFFLINE = path.join(ROOT, "offline");
const STAGING = path.join(ROOT, ".offline-zip-staging");
const PACKAGE_DIR = path.join(ROOT, "offline-package");
const ZIP_NAME = "chicken-guard-cat-offline.zip";

const SKIP_IN_ZIP = new Set([ZIP_NAME, ".DS_Store"]);

function copyResolved(src, dest) {
  const stat = fs.lstatSync(src);
  if (stat.isSymbolicLink()) {
    return copyResolved(fs.realpathSync(src), dest);
  }
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      if (SKIP_IN_ZIP.has(name)) continue;
      copyResolved(path.join(src, name), path.join(dest, name));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function writePlayGuide(staging) {
  const text = `치킨 사수 냥이 — 오프라인 패키지
Made by 20318 최은서

■ 100% 오프라인으로 실행 (인터넷 불필요)

1) 이 ZIP을 풀어 폴더를 만든다.
2) 터미널(명령 프롬프트)에서 그 폴더로 이동한다.
3) 아래 명령 중 하나를 실행한다.

   macOS / Linux:
     python3 -m http.server 8080

   Windows:
     py -m http.server 8080

4) 브라우저에서 http://localhost:8080 을 연다.
5) "게임 시작!" → 선택지 모드로 플레이.

※ index.html을 더블클릭(file://)으로 열 수도 있지만,
  일부 브라우저에서는 글꼴·캐시가 제한될 수 있어
  위 로컬 서버 방식을 권장합니다.

■ 온라인 URL만으로는 "처음부터" 오프라인 불가
   Render 주소는 한 번이라도 인터넷으로 열어야 합니다.
   이 ZIP은 그 제한 없이 완전 오프라인입니다.
`;
  fs.writeFileSync(path.join(staging, "오프라인-플레이-방법.txt"), text, "utf8");
}

function zipDirectory(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", () => resolve(outPath));
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function main() {
  if (!fs.existsSync(path.join(OFFLINE, "index.html"))) {
    console.error("[pack-offline-zip] run npm run build:offline first (offline/index.html missing)");
    process.exit(1);
  }

  if (fs.existsSync(STAGING)) {
    fs.rmSync(STAGING, { recursive: true, force: true });
  }
  fs.mkdirSync(STAGING, { recursive: true });

  for (const name of fs.readdirSync(OFFLINE)) {
    if (SKIP_IN_ZIP.has(name)) continue;
    copyResolved(path.join(OFFLINE, name), path.join(STAGING, name));
  }
  writePlayGuide(STAGING);

  const packageZip = path.join(PACKAGE_DIR, ZIP_NAME);
  const publishZip = path.join(OFFLINE, ZIP_NAME);

  await zipDirectory(STAGING, packageZip);
  fs.copyFileSync(packageZip, publishZip);

  fs.rmSync(STAGING, { recursive: true, force: true });

  const sizeMb = (fs.statSync(publishZip).size / (1024 * 1024)).toFixed(2);
  console.log("[pack-offline-zip] wrote", publishZip, `(${sizeMb} MB)`);
  console.log("[pack-offline-zip] copy at", packageZip);
}

main().catch((err) => {
  console.error("[pack-offline-zip]", err);
  process.exit(1);
});
