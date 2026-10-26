#!/usr/bin/env python3
"""Prepara el logo y el ícono de Reviro a partir de las imágenes originales (fondo crema).

Uso:  python3 tools/marca.py <logo.png> <icono.png>
- img/logo.webp: el cartel "Reviro" del título, sin el fondo (la sombra queda como sombra transparente).
- img/icono-512.png, img/icono-192.png, img/favicon-32.png, img/favicon.ico: el ícono con las esquinas transparentes.
- img/icono-maskable-512.png y img/apple-touch-icon.png: el ícono a sangre (sin esquinas), para Android e iPhone.
"""
import sys
from collections import deque
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "img"


def sin_fondo(im, t0=10, t1=60):
    """Quita el fondo liso conectado a los bordes; lo que se parece a medias queda semitransparente."""
    im = im.convert("RGB")
    w, h = im.size
    px = im.load()
    # color de fondo: promedio de las esquinas
    cs = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
    bg = tuple(sum(c[i] for c in cs) / 4 for i in range(3))
    dist = lambda c: max(abs(c[i] - bg[i]) for i in range(3))
    alpha = [[255] * w for _ in range(h)]
    seen = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        if seen[y][x]:
            continue
        seen[y][x] = True
        d = dist(px[x, y])
        if d >= t1:
            continue
        alpha[y][x] = 0 if d <= t0 else int(255 * (d - t0) / (t1 - t0))
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx]:
                q.append((nx, ny))
    out = Image.new("RGBA", (w, h))
    op = out.load()
    for y in range(h):
        for x in range(w):
            a = alpha[y][x]
            c = px[x, y]
            if 0 < a < 255:  # el borde y la sombra: un marrón muy oscuro semitransparente, que queda bien sobre la madera
                lum = sum(c) / 3
                c = (round(lum * .25), round(lum * .15), round(lum * .08))
                a = int(a * .8)
            op[x, y] = (*c, a)
    return out.crop(out.getbbox())


def main(logo, icono):
    lg = sin_fondo(Image.open(logo), 10, 105)
    lg.save(IMG / "logo.webp", "WEBP", quality=92, method=6)
    lg.save(IMG / "logo.png")
    ic = sin_fondo(Image.open(icono), 8, 90)
    side = max(ic.size)
    sq = Image.new("RGBA", (side, side))
    sq.paste(ic, ((side - ic.width) // 2, (side - ic.height) // 2))
    for s, n in ((512, "icono-512.png"), (192, "icono-192.png"), (32, "favicon-32.png")):
        sq.resize((s, s), Image.LANCZOS).save(IMG / n)
    sq.resize((64, 64), Image.LANCZOS).save(IMG / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    # a sangre: se recorta adentro del marco dorado, donde el fondo marrón es parejo
    src = Image.open(icono).convert("RGB")
    W = src.width
    m = int(W * 0.14)
    full = src.crop((m, m, W - m, W - m))
    full.resize((512, 512), Image.LANCZOS).save(IMG / "icono-maskable-512.png")
    full.resize((180, 180), Image.LANCZOS).save(IMG / "apple-touch-icon.png")
    print("logo", lg.size, "ícono", ic.size)


if __name__ == "__main__":
    main(*sys.argv[1:3])
