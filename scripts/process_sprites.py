#!/usr/bin/env python3
"""검은 배경 제거 + 고양이를 박스 위에 앉은 위치로 정렬."""
from pathlib import Path

from PIL import Image

IMG = Path(__file__).resolve().parent.parent / "img"
THRESHOLD = 35
FEATHER = 8
CROP_TOP = 140
CROP_BOTTOM = 1015
SEAT_OVERLAP = 6  # 발바닥이 박스 윗면에 살짝 닿도록


def remove_black(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r <= THRESHOLD and g <= THRESHOLD and b <= THRESHOLD:
                px[x, y] = (r, g, b, 0)
            elif (
                r <= THRESHOLD + FEATHER
                and g <= THRESHOLD + FEATHER
                and b <= THRESHOLD + FEATHER
            ):
                m = max(r, g, b)
                alpha = int(255 * (m - THRESHOLD) / FEATHER)
                alpha = max(0, min(255, alpha))
                px[x, y] = (r, g, b, min(a, alpha))
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
    box_full = remove_black(Image.open(box_path))
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
        cat = remove_black(Image.open(path))
        cat = align_cat_on_box(cat, seat_y)
        cat = crop_stage(cat)
        cat.save(path, "PNG")
        _, ymin, _, ymax = content_bounds(cat)
        print(f"{name}: cat y {ymin}-{ymax} (seat {seat_y})")

    box = crop_stage(box_full)
    box.save(box_path, "PNG")


if __name__ == "__main__":
    main()
