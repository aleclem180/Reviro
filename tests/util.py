"""Herramientas compartidas por las pruebas de Reviro.

- servidor(): levanta la carpeta del proyecto en un puerto local, como la sirve GitHub Pages.
- motor(js): corre código JavaScript contra el motor del juego (src/engine.js) con Node y devuelve el resultado.
- pagina(): abre Reviro en Chromium (Playwright), en modo local (sin Firebase), ya registrado.
"""
import contextlib, json, socket, subprocess, sys, time
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def puerto_libre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@contextlib.contextmanager
def servidor():
    p = puerto_libre()
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(p), "--bind", "127.0.0.1"], cwd=RAIZ,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            with contextlib.suppress(OSError), socket.create_connection(("127.0.0.1", p), timeout=.2):
                break
            time.sleep(.1)
        yield f"http://127.0.0.1:{p}/"
    finally:
        srv.terminate()


def motor(js):
    """Evalúa `js` (una expresión) con el motor cargado y devuelve el resultado como dato de Python."""
    codigo = (RAIZ / "src" / "engine.js").read_text(encoding="utf-8")
    prog = codigo + "\n;process.stdout.write(JSON.stringify((()=>{" + js + "})()));"
    r = subprocess.run(["node", "-e", prog], capture_output=True, text=True, timeout=60)
    if r.returncode:
        raise RuntimeError(r.stderr)
    return json.loads(r.stdout)


async def pagina(browser, base, ancho=390, alto=844, ruta="index.html"):
    pg = await browser.new_page(viewport={"width": ancho, "height": alto})
    pg.errores = []
    pg.on("pageerror", lambda e: pg.errores.append(str(e)))
    await pg.route("**/js/firebase-config.js",
                   lambda r: r.fulfill(body='window.REVIRO_FIREBASE={apiKey:""};', content_type="application/javascript"))
    await pg.goto(base + ruta)
    await pg.wait_for_selector("#regnick", timeout=15000)
    await pg.fill("#regnick", "Prueba")
    await pg.click('[data-form="reg"] button[type=submit]')
    await pg.click('[data-a="welcome"][data-v="play"]')
    await pg.wait_for_timeout(800)
    return pg
