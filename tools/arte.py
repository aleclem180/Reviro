#!/usr/bin/env python3
"""Dibuja de antemano las 40 cartas, los dorsos y los paños como imágenes WebP (img/arte/<versión>/).

Uso:  python3 tools/arte.py      (necesita Playwright con Chromium)

Las cartas, dorsos y paños son dibujos SVG con un filtro de lápiz que es caro de pintar. Si el celular los pinta
en el medio de la partida (por ejemplo, cuando aparece una carta nueva), la pantalla se traba un instante. Con este
paso quedan pintados de antemano: el juego solo muestra imágenes.

La versión es un resumen de los dibujos: si nada cambió, no se vuelven a generar. Al final arma la web de nuevo para
que index.html apunte a la versión nueva (js/arte-version.js).
"""
import asyncio, base64, contextlib, shutil, socket, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARTE = ROOT / "img" / "arte"


def build():
    subprocess.run([sys.executable, str(ROOT / "tools" / "build.py")], check=True)


@contextlib.contextmanager
def servidor():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]
    p = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1"], cwd=ROOT,
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(.8); yield f"http://127.0.0.1:{port}/"
    finally:
        p.terminate()


JUNTAR = """async () => {
  const items = [];
  for (const c of deck()) { cardHTML(c); items.push(['carta-' + c, CARDSVG[c], 360, 540]); }
  for (const d of DORSOS) items.push(['dorso-' + d.id, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(dorsoSVG(d.id)), 240, 360]);
  for (const p of PANOS) items.push(['pano-' + p.id, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(panoSVG(p.id)), 600, 600]);
  const all = new TextEncoder().encode(items.map(i => i[0] + i[1]).join('|'));
  const h = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1', all))).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 10);
  window.__ITEMS = items; return { h, n: items.length };
}"""

PINTAR = """async (i) => {
  const [name, uri, W, H] = window.__ITEMS[i];
  const im = new Image(); im.src = uri; await im.decode(); await new Promise(r => setTimeout(r, 30));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').drawImage(im, 0, 0, W, H);
  return [name, cv.toDataURL('image/webp', 0.86)];
}"""


async def main():
    from playwright.async_api import async_playwright
    build()
    with servidor() as base:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            pg = await b.new_page()
            await pg.add_init_script("window.__ARTGEN = true")
            await pg.route("**/js/firebase-config.js", lambda r: r.fulfill(body='window.REVIRO_FIREBASE={apiKey:""};', content_type="application/javascript"))
            await pg.route("**/fonts.googleapis.com/**", lambda r: r.abort())
            await pg.goto(base + "index.html")
            await pg.wait_for_function("typeof cardHTML === 'function' && typeof dorsoSVG === 'function'")
            info = await pg.evaluate(JUNTAR)
            dest = ARTE / info["h"]
            if dest.exists() and len(list(dest.glob("*.webp"))) == info["n"]:
                print(f"Los dibujos no cambiaron (versión {info['h']}).")
            else:
                dest.mkdir(parents=True, exist_ok=True)
                for i in range(info["n"]):
                    name, url = await pg.evaluate(PINTAR, i)
                    (dest / f"{name}.webp").write_bytes(base64.b64decode(url.split(",", 1)[1]))
                print(f"{info['n']} imágenes en img/arte/{info['h']}/")
            await b.close()
    for old in ARTE.iterdir():
        if old.is_dir() and old.name != info["h"]:
            shutil.rmtree(old)
    (ROOT / "js" / "arte-version.js").write_text(f"window.REVIRO_ART_V = '{info['h']}';\n", encoding="utf-8")
    build()


if __name__ == "__main__":
    asyncio.run(main())
