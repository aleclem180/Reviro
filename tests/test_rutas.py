"""Las direcciones propias de cada hoja (/torneos, /online, /huella…) y el botón Atrás del navegador."""
import asyncio, re, unittest
from pathlib import Path
from playwright.async_api import async_playwright
from util import servidor, pagina, RAIZ

ROUTES = dict(re.findall(r"(\w+):'([\w-]*)'", re.search(r"const ROUTES=\{(.*?)\};", (RAIZ / "src/ui.js").read_text()).group(1)))


class Rutas(unittest.TestCase):
    def test_cada_ruta_tiene_su_carpeta(self):
        for v, r in ROUTES.items():
            if r:
                self.assertTrue((RAIZ / r / "index.html").exists(), f"falta {r}/index.html: corré python3 tools/build.py")

    def test_entrar_directo_y_volver(self):
        async def correr():
            with servidor() as base:
                async with async_playwright() as p:
                    b = await p.chromium.launch()
                    pg = await pagina(b, base, ruta="huella/")
                    r = [await pg.evaluate("view"), await pg.evaluate("location.pathname")]
                    await pg.click('[data-a="nav"][data-v="extra"]')
                    r.append(await pg.evaluate("location.pathname"))
                    await pg.go_back(); await pg.wait_for_timeout(300)
                    r.append(await pg.evaluate("view"))
                    await b.close()
                    return r
        vista, entrada, extra, atras = asyncio.run(correr())
        self.assertEqual(vista, "gira")
        self.assertTrue(entrada.endswith("/huella"), entrada)
        self.assertTrue(extra.endswith("/extra"), extra)
        self.assertEqual(atras, "gira")


if __name__ == "__main__":
    unittest.main()
