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

const PORT = 8765;

function writeMacLauncher(dir) {
  const script = `#!/bin/bash
cd "$(dirname "$0")"
PORT=${PORT}
python3 -m http.server "$PORT" &
SRV=$!
sleep 1
open "http://127.0.0.1:$PORT"
echo "치킨 사수 냥이 — 로컬 서버 (포트 $PORT). 종료: Ctrl+C"
wait $SRV
`;
  const p = path.join(dir, "게임-시작-mac.command");
  fs.writeFileSync(p, script, { encoding: "utf8", mode: 0o755 });
  try {
    fs.chmodSync(p, 0o755);
  } catch (_) {
    /* zip staging on Windows */
  }
}

function writeWindowsLauncher(dir) {
  const bat = `@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=${PORT}
start /B cmd /c "python -m http.server %PORT% 2>nul || py -3 -m http.server %PORT%"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:%PORT%"
echo.
echo 치킨 사수 냥이 — 브라우저에서 플레이하세요.
echo 서버 종료: 이 창을 닫으세요.
pause
`;
  fs.writeFileSync(path.join(dir, "게임-시작-windows.bat"), bat, "utf8");
}

function writePlayGuide(dir) {
  const text = `치킨 사수 냥이 — 오프라인 패키지
Made by 20318 최은서

■ 인터넷·Wi‑Fi·모바일 데이터 없이 (처음부터)

  USB / AirDrop / 교실 PC 복사 등으로 이 ZIP을 미리 기기에 넣어 두세요.
  (플레이할 때 인터넷에서 받으면 “처음부터 0% 데이터”가 아닙니다.)

  1) ZIP 압축 해제
  2) 더블클릭
       macOS: 게임-시작-mac.command
       Windows: 게임-시작-windows.bat
  3) 브라우저가 http://127.0.0.1:${PORT} 로 열리면 「게임 시작!」

  Python 3가 없으면: 터미널에서 이 폴더로 이동 후
    macOS: python3 -m http.server ${PORT}
    Windows: py -3 -m http.server ${PORT}
  그다음 브라우저에서 http://127.0.0.1:${PORT}

■ file:// 로 index.html 더블클릭
  Wi‑Fi/데이터 없이 열 수는 있으나, 브라우저마다 글꼴·오디오 제한이 있을 수 있습니다.
  위 런처(로컬 서버)를 권장합니다.

■ Render 주소 (https://*.onrender.com) 는 인터넷이 필요합니다
  URL만으로는 “처음부터” 오프라인 불가. 이 ZIP은 그 제한 없습니다.

■ 스마트폰
  Android: 파일 앱으로 ZIP 풀기 → PC/Mac 런처와 같은 방식은 어렵습니다.
  홈 화면 PWA는 최소 한 번 온라인 설치가 필요합니다. 시연·무데이터 재생은 PC/Mac ZIP 권장.
`;
  fs.writeFileSync(path.join(dir, "오프라인-플레이-방법.txt"), text, "utf8");
}

function writeOfflineLaunchers(dir) {
  fs.mkdirSync(dir, { recursive: true });
  writePlayGuide(dir);
  writeMacLauncher(dir);
  writeWindowsLauncher(dir);
}

module.exports = { writeOfflineLaunchers, PORT };

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
  writeOfflineLaunchers(STAGING);

  const packageZip = path.join(PACKAGE_DIR, ZIP_NAME);
  const publishZip = path.join(OFFLINE, ZIP_NAME);

  await zipDirectory(STAGING, packageZip);
  fs.copyFileSync(packageZip, publishZip);

  fs.rmSync(STAGING, { recursive: true, force: true });

  writeOfflineLaunchers(OFFLINE);

  const sizeMb = (fs.statSync(publishZip).size / (1024 * 1024)).toFixed(2);
  console.log("[pack-offline-zip] wrote", publishZip, `(${sizeMb} MB)`);
  console.log("[pack-offline-zip] copy at", packageZip);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("[pack-offline-zip]", err);
    process.exit(1);
  });
}
