#!/usr/bin/env python3
"""검은 배경 제거 + 고양이를 박스 위에 앉은 위치로 정렬."""
from collections import deque
from pathlib import Path

from PIL import Image

IMG = Path(__file__).resolve().parent.parent / "img"
THRESHOLD = 35
CROP_TOP = 140
CROP_BOTTOM = 1015
SEAT_OVERLAP = 6  # 발바닥이 박스 윗면에 살짝 닿도록


def _is_dark(r: int, g: int, b: int, threshold: int = THRESHOLD) -> bool:
    return r <= threshold and g <= threshold and b <= threshold


def remove_outer_black(im: Image.Image) -> Image.Image:
    """가장자리와 연결된 검은 배경만 투명 처리 (눈·입 등 안쪽 검은색 유지)."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    bg = [[False] * w for _ in range(h)]
    q = deque()

    def try_seed(x: int, y: int) -> None:
        if 0 <= x < w and 0 <= y < h and not bg[y][x]:
            r, g, b, _ = px[x, y]
            if _is_dark(r, g, b):
                bg[y][x] = True
                q.append((x, y))

    for x in range(w):
        try_seed(x, 0)
        try_seed(x, h - 1)
    for y in range(h):
        try_seed(0, y)
        try_seed(w - 1, y)

    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx]:
                r, g, b, _ = px[nx, ny]
                if _is_dark(r, g, b):
                    bg[ny][nx] = True
                    q.append((nx, ny))

    for y in range(h):
        for x in range(w):
            if bg[y][x]:
                px[x, y] = (0, 0, 0, 0)
    return im


def content_bounds(im: Image.Image, alpha_min: int = 10):
    px = im.load()
    w, h = im.size
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > alpha_min:
                xs.append(x)
                ys.append(y)
    if not xs:
        return 0, 0, w - 1, h - 1
    return min(xs), min(ys), max(xs), max(ys)


def box_seat_y(box: Image.Image) -> int:
    """박스 윗면 y (전체 캔버스)."""
    _, ymin, _, _ = content_bounds(box)
    return ymin + SEAT_OVERLAP


def align_cat_on_box(cat: Image.Image, seat_y: int) -> Image.Image:
    """발끝이 박스 윗면에 닿도록 위로 올림."""
    w, h = cat.size
    _, ymin, _, ymax = content_bounds(cat)
    shift = ymax - seat_y
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste(cat, (0, int(-shift)), cat)
    return out


def crop_stage(im: Image.Image) -> Image.Image:
    return im.crop((0, CROP_TOP, im.size[0], CROP_BOTTOM))


def main():
    box_path = IMG / "box.png"
    box_full = remove_outer_black(Image.open(box_path))
    seat_y = box_seat_y(box_full)

    for name in [
        "tired.png",
        "sus.png",
        "int.png",
        "tsun.png",
        "love.png",
        "mad.png",
    ]:
        path = IMG / name
        cat = remove_outer_black(Image.open(path))
        cat = align_cat_on_box(cat, seat_y)
        cat = crop_stage(cat)
        cat.save(path, "PNG")
        _, ymin, _, ymax = content_bounds(cat)
        print(f"{name}: cat y {ymin}-{ymax} (seat {seat_y})")

    box = crop_stage(box_full)
    box.save(box_path, "PNG")


if __name__ == "__main__":
    main()
