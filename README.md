# 치킨 사수 냥이

냥이를 설득해 치킨을 나눠 먹는 픽셀 협상 미니게임.

## 배포 URL (Render)

| 사이트 | URL | 설명 |
|--------|-----|------|
| **풀 게임 (온라인)** | https://chicken-guard-cat.onrender.com/ | **선택지 모드** + **자유 채팅 모드**(AI). 온라인일 때 자유 채팅 사용 가능. 오프라인이면 풀 사이트도 선택지만 가능. |
| **오프라인 전용** | https://chicken-guard-cat-offline.onrender.com/ | **선택지 모드만**. 자유 채팅 UI 없음. 아래 「오프라인 플레이 3가지」 참고. |

### 오프라인 플레이 3가지 (선택지 모드)

**솔직한 한계:** `https://*.onrender.com` 주소는 **인터넷·DNS 없이 처음부터** 열 수 없습니다. “한 번 방문 후 캐시”만으로는 **그 전에 한 번은 온라인**이어야 합니다. **처음부터 100% 오프라인**이 필요하면 **(A) ZIP** 또는 **(B) PWA 홈 화면**을 미리 준비하세요.

| 방법 | 준비 | 비행기 모드에서 |
|------|------|-----------------|
| **(A) ZIP 로컬 실행** | Wi‑Fi에서 [오프라인 사이트](https://chicken-guard-cat-offline.onrender.com/) 상단 **ZIP 다운로드** (또는 `npm run build:offline` 후 `offline/chicken-guard-cat-offline.zip`) | ZIP 압축 해제 → 폴더에서 `python3 -m http.server 8080` → 브라우저 `http://localhost:8080` (**인터넷 불필요**) |
| **(B) PWA 홈 화면에 추가** | 온라인일 때 오프라인 사이트 접속 → 배너 **홈 화면에 추가** (iPhone: Safari **공유 → 홈 화면에 추가**) | 설치한 **앱 아이콘**으로 실행 (**캐시된 뒤 오프라인**) |
| **(C) URL + 캐시** | 온라인에서 오프라인 URL을 **한 번** 열어 두기 (Service Worker가 자산 저장) | 같은 브라우저에서 **다시** 그 URL 접속 (이미 캐시된 경우만) |

ZIP 안의 `오프라인-플레이-방법.txt`에도 동일 안내가 있습니다. `file://`로 `index.html`만 더블클릭해도 되지만, 글꼴·캐시 제한이 있을 수 있어 **로컬 서버 한 줄**을 권장합니다.

### 로컬 실행 (풀 사이트)

```bash
npm install
cp .env.example .env   # INWORLD_API_KEY 설정
npm start
```

### 로컬에서 오프라인 사이트 미리보기

```bash
npm run build:offline
npx --yes serve offline -p 4173
```

브라우저에서 `http://localhost:4173` — `offline/` 루트가 오프라인 전용 빌드와 동일합니다.

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
