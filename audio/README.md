# 오디오

## BGM

- **`bgm.mp3`** — [OpenGameArt: chill chiptune](https://opengameart.org/content/chill-chiptune) (CC0), **Alex McCulloch** (Pro Sensory). 원본 `chill_chiptune.mp3`를 기반으로 합니다.
- **퍼커션 제거:** OpenGameArt 원본 `chill_chiptune.mp3`에 **Demucs `htdemucs`** `--two-stems drums`로 드럼 스템을 분리한 뒤 **`no_drums` 스템**을 사용합니다. 남는 킥·노이즈 대역 잔향은 ffmpeg로 후처리했습니다 (high-pass 175 Hz, 240 Hz·3.2–5.5 kHz notch 감쇠, 경량 컴프·리미터). 칩튠 멜로디·화음은 유지하되, 스퀘어파 트랜지언트와 스펙트럼이 겹쳐 **아주 약한 리듬감**이 남을 수 있습니다.
- 재생: `<audio loop>` + 우측 상단 BGM ON/OFF (`localStorage`: `chicken-cat-bgm-muted`).

## 효과음

버튼 클릭·설득·라운드 클리어·게임 오버 등은 **Web Audio API**로 브라우저에서 합성합니다 (별도 파일 없음).

## 참고

- `_generate_bgm.py` / `_bgm_loop.wav`는 예전에 합성 BGM을 실험할 때 쓰던 스크립트·중간 파일이며, **배포용 BGM으로는 사용하지 않습니다.**
