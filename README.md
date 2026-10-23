# 치킨 사수 냥이

냥이를 설득해 치킨을 나눠 먹는 픽셀 협상 미니게임.

## 배포 URL (Render)

| 사이트 | URL | 설명 |
|--------|-----|------|
| **풀 게임 (온라인)** | https://chicken-guard-cat.onrender.com/ | **선택지 모드** + **자유 채팅 모드**(AI). 온라인일 때 자유 채팅 사용 가능. 오프라인이면 풀 사이트도 선택지만 가능. |
| **오프라인 전용** | https://chicken-guard-cat-offline.onrender.com/ | **선택지 모드만**. 자유 채팅 UI 없음. 아래 「오프라인 플레이 3가지」 참고. |

**폰 QR 스캔:** 카메라·QR 앱으로 스캔하면 **풀 게임** URL(`https://chicken-guard-cat.onrender.com/`)을 브라우저에서 여는 것과 같습니다. **첫 스캔·첫 로드는 데이터(인터넷)가 필요**합니다. 이후 PWA(홈 화면 추가)나 브라우저 캐시가 잡히면 비행기 모드에서도 될 수 있습니다. **처음부터 데이터 0%** 는 QR이 아니라 ZIP을 PC/Android 파일로 미리 받는 방법을 쓰세요. QR PNG는 `img/game-site-qr.png` (`npm run generate:offline-qr`로 재생성).

### 「데이터 0% 처음부터」 (Wi‑Fi·LTE 끈 상태에서도)

**진실:** `https://*.onrender.com` 은 **네트워크가 한 번도 없으면** 열 수 없습니다. URL 붙여넣기로 “처음부터 오프라인”은 불가능합니다.

**가능한 방법:** ZIP을 **미리** USB·AirDrop·교실 복사 등으로 기기에 넣어 두고, **플레이할 때는 인터넷을 쓰지 않습니다.**

1. (준비 단계, 인터넷 있어도 됨) [오프라인 사이트](https://chicken-guard-cat-offline.onrender.com/)에서 **ZIP** 받거나, `npm run build:offline` 후 `offline/chicken-guard-cat-offline.zip` 사용  
2. ZIP 압축 해제  
3. **더블클릭:** macOS `게임-시작-mac.command` / Windows `게임-시작-windows.bat`  
4. 브라우저 `http://127.0.0.1:8765` → **게임 시작!**

폰: Android에서 ZIP 풀기는 가능하지만 PC처럼 로컬 서버 런처가 어렵습니다. **홈 화면 PWA**는 최소 **한 번은 온라인**으로 설치해야 합니다. 무데이터 시연·재생은 **PC/Mac ZIP**을 쓰세요.

`index.html`을 `file://`로만 열어도 SW 없이 동작하도록 되어 있으나, 브라우저마다 글꼴·오디오 제한이 있을 수 있어 **런처(로컬 서버)** 를 권장합니다. ZIP 안 `오프라인-플레이-방법.txt` 참고.

### 오프라인 플레이 3가지 (선택지 모드)

| 방법 | 준비 | 비행기 모드에서 |
|------|------|-----------------|
| **(A) ZIP + 런처** | ZIP을 기기에 미리 복사 (위 「데이터 0%」) | 더블클릭 런처 → **인터넷 불필요** |
| **(B) PWA 홈 화면** | 온라인일 때 오프라인 사이트 → **홈 화면에 추가** | 설치 후 **캐시된 뒤** 오프라인 |
| **(C) URL + 캐시** | 온라인에서 오프라인 URL **한 번** 방문 | 같은 브라우저 재접속 (캐시 있을 때만) |

### 로컬 실행 (풀 사이트)

```bash
npm install
cp .env.example .env   # INWORLD_API_KEY 설정
npm start
```

### 로컬에서 오프라인 사이트 미리보기

```bash
npm run build:offline
cd offline && python3 -m http.server 8765
```

브라우저에서 `http://127.0.0.1:8765` — `offline/` 루트가 오프라인 전용 빌드와 ZIP 내용과 동일합니다 (`npx` 불필요).

## Render Blueprint (두 서비스)

`render.yaml`에 **Node 웹(풀 게임)** 과 **Static(오프라인 전용)** 이 정의되어 있습니다.

1. **처음 Blueprint 연결** — 두 서비스가 함께 생성됩니다.
2. **이미 `chicken-guard-cat`만 있는 경우** — Render Dashboard → **Blueprints** → 해당 Blueprint → **Manual sync** 또는 **New Static Site**:
   - Name: `chicken-guard-cat-offline`
   - Build: `npm run build:offline`
   - Publish directory: `offline`
   - Root directory: (repo 루트)

오프라인 static 서비스는 API 키가 필요 없습니다.

## 구조

- 루트 `index.html` + `server.js` — 풀 게임 (Express, `/api/chat`)
- `offline/` — 오프라인 전용 HTML·SW·manifest (공용 `css/`, `img/`, `audio/`, `fonts/`, `js/`는 `npm run build:offline` 시 symlink)
- `js/game.js` — `window.CHICKEN_CAT_OFFLINE_SITE` 플래그로 오프라인 전용 사이트 분기

Made by 20318 최은서
