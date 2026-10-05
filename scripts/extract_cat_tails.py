#!/usr/bin/env python3
"""고양이 스프라이트에서 꼬리(오른쪽 C자 곡선)만 분리 → img/cats/{name}-body.png, -tail.png."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "img"
OUT = IMG / "cats"

NAMES = ("tired", "sus", "int", "tsun", "love", "mad")

# tired.png 정렬 캔버스: 꼬리가 몸과 만나는 대략적인 최左 열
TAIL_X_MIN = 751
# 꼬리 끝(오른쪽 돌출부) 시드 — 이 열부터 flood 시작
TAIL_TIP_X = 898


def _opaque(px, x: int, y: int) -> bool:
    return px[x, y][3] >= 10


def _tail_seeds(px, w: int, h: int) -> list[tuple[int, int]]:
    """오른쪽 꼬리 끝(돌출 C자) 픽셀만 시드 — 몸통 오른쪽 전체가 아님."""
    seeds: list[tuple[int, int]] = []
    for y in range(h):
        right_x = -1
        for x in range(w - 1, TAIL_X_MIN - 1, -1):
            if _opaque(px, x, y):
                right_x = x
                break
        if right_x >= TAIL_TIP_X:
            seeds.append((right_x, y))
    if seeds:
        return seeds
    # fallback: 최右 불투명 열
    for y in range(h):
        for x in range(w - 1, TAIL_X_MIN, -1):
            if _opaque(px, x, y):
                seeds.append((x, y))
                break
    return seeds


def _flood_can_enter(px, nx: int, ny: int, w: int, h: int) -> bool:
    if not (0 <= nx < w and 0 <= ny < h):
        return False
    if not _opaque(px, nx, ny):
        return False
    if nx < TAIL_X_MIN:
        return False
    # 몸통과 이어지는 좁은 접합부(y≈290–340)만 TAIL_X_MIN 근처 허용
    if nx < TAIL_X_MIN + 18:
        return 278 <= ny <= 345
    # 위쪽 오른쪽은 꼬리 C자만 (몸 윤곽으로 번짐 방지)
    if ny < 172 and nx < 818:
        return False
    return True


def _build_tail_mask(im: Image.Image) -> list[list[bool]]:
    w, h = im.size
    px = im.load()
    tail = [[False] * w for _ in range(h)]
    seeds = _tail_seeds(px, w, h)
    if not seeds:
        return tail

    seen: set[tuple[int, int]] = set(seeds)
    q: deque[tuple[int, int]] = deque(seeds)
    while q:
        x, y = q.popleft()
        tail[y][x] = True
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if (nx, ny) in seen:
                continue
            if not _flood_can_enter(px, nx, ny, w, h):
                continue
            seen.add((nx, ny))
            q.append((nx, ny))

    return tail


def _tail_pivot(tail: list[list[bool]], w: int, h: int) -> tuple[float, float]:
    """꼬리 밑부분(몸통 접합) 중심 → CSS transform-origin %."""
    band = [(x, y) for y in range(h) for x in range(w) if tail[y][x] and x <= TAIL_X_MIN + 14]
    if not band:
        band = [(x, y) for y in range(h) for x in range(w) if tail[y][x]]
    base = [p for p in band if p[1] >= 480] or band
    px = min(base, key=lambda p: (p[0], -p[1]))
    return (px[0] / w * 100.0, px[1] / h * 100.0)


def split_sprite(
    im: Image.Image, tail: list[list[bool]]
) -> tuple[Image.Image, Image.Image]:
    w, h = im.size
    px = im.load()
    body = im.copy()
    tail_im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    bb = body.load()
    tb = tail_im.load()
    for y in range(h):
        for x in range(w):
            if not tail[y][x]:
                continue
            tb[x, y] = px[x, y]
            bb[x, y] = (0, 0, 0, 0)
    return body, tail_im


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    ref = Image.open(IMG / "tired.png").convert("RGBA")
    tail_mask = _build_tail_mask(ref)
    tail_px = sum(tail_mask[y][x] for y in range(ref.size[1]) for x in range(ref.size[0]))
    pivot = _tail_pivot(tail_mask, *ref.size)
    print(f"tail mask pixels: {tail_px}")
    print(f"pivot (CSS): {pivot[0]:.2f}% {pivot[1]:.2f}%")

    for name in NAMES:
        path = IMG / f"{name}.png"
        im = Image.open(path).convert("RGBA")
        if im.size != ref.size:
            raise SystemExit(f"{name}: size {im.size} != reference {ref.size}")
        body, tail_im = split_sprite(im, tail_mask)
        body.save(OUT / f"{name}-body.png", "PNG")
        tail_im.save(OUT / f"{name}-tail.png", "PNG")
        print(f"  {name}-body.png, {name}-tail.png")


if __name__ == "__main__":
    main()
